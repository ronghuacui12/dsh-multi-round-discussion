/**
 * orchestrator (doc §2.2, §5, §8).
 *
 * The only component that drives the state machine. Everything else is called
 * by it and then goes quiet, which is what makes the phase order auditable:
 * read `run()` top to bottom and you have read the whole protocol.
 *
 * Shape of a run:
 *
 *   clarify -> [await user] -> (propose -> [review] -> decide)* -> plan
 *           -> [await approval] -> execute -> [verify -> (repair | replan)]*
 *           -> answer -> done
 *
 * Two invariants the code below is built around:
 *
 *   - **Every loop-back goes through `deciding`.** The only way back into the
 *     discussion is `deciding -> proposing`, and it is bounded by both the
 *     budget guard's round ceiling and the replan counter.
 *   - **Parking is an await, not saved state.** `UserInputGate.wait()` keeps
 *     the control flow linear; there is no resume-point variable that could
 *     drift out of step with the state machine.
 */
import { randomUUID } from 'node:crypto';
import { RunStore, UserInputGate, computeCostSummary, initialParticipant } from "../services/run-store.js";
import { SharedBlackboard } from "../core/blackboard.js";
import { BudgetGuard } from "../core/budget-guard.js";
import { StateMachine, statusOf, PHASE_LABELS } from "../core/state-machine.js";
import { ToolSandbox } from "../core/sandbox.js";
import { buildRoster, describeRoster } from "../core/roster.js";
import { resolvePreset } from "../core/preset.js";
import { DiscussionEngine } from "./discussion-engine.js";
import { LeadModel } from "./lead-model.js";
import { Executor } from "./executor.js";
import { Verifier } from "./verifier.js";
/** How many times a failed verification may send the run back to decision. */
const MAX_REPLANS = 1;
/** How many times a failed verification may re-run the same plan. */
const MAX_REPAIRS = 1;
export class Orchestrator {
    ctx;
    registry;
    store;
    config;
    logger;
    /** Long-lived per-run objects, keyed by run id. */
    engines = new Map();
    constructor(options) {
        this.ctx = options.ctx;
        this.registry = options.registry;
        this.store = options.store;
        this.config = options.config;
        this.logger = options.logger;
    }
    // ------------------------------------------------------------------ lifecycle
    /**
     * Start a run. Returns immediately with the initial state; the run continues
     * in the background and reports progress through the store.
     *
     * Roster errors are thrown synchronously — a misconfigured roster should fail
     * the caller's request, not surface as a failed run the user has to go read.
     */
    start(options) {
        const preset = resolvePreset(options.preset ?? this.config.preset);
        const roster = buildRoster(this.registry, preset, options.overrides ?? this.config.overrides ?? {});
        const budget = new BudgetGuard({
            ...this.config.budget,
            maxDiscussionRounds: Math.min(this.config.budget.maxDiscussionRounds, preset.maxRounds),
        });
        const runId = RunStore.newRunId();
        // A follow-up run carries the earlier discussion in. The prompt request is
        // the context block plus the new question, while `state.request` stays the
        // user's own words so the UI bubble shows exactly what the user typed.
        const promptRequest = typeof options.context === 'string' && options.context.trim() !== ''
            ? `${options.context.trim()}\n\n${options.request}`
            : options.request;
        const blackboard = new SharedBlackboard(runId, promptRequest);
        const abort = new AbortController();
        const participants = [
            initialParticipant(roster.lead),
            ...roster.proposers.map(initialParticipant),
            ...roster.reviewers.map(initialParticipant),
            initialParticipant(roster.executor),
            ...(roster.verifier ? [initialParticipant(roster.verifier)] : []),
        ];
        // De-duplicate: the lead model may also be seated as a proposer.
        const seen = new Set();
        const uniqueParticipants = participants.filter((participant) => {
            if (seen.has(participant.profileId))
                return false;
            seen.add(participant.profileId);
            return true;
        });
        const now = Date.now();
        const machine = new StateMachine('idle');
        const state = {
            runId,
            phase: 'idle',
            status: 'idle',
            revision: 0,
            startedAt: now,
            updatedAt: now,
            request: options.request,
            ...(typeof options.parentRunId === 'string' && options.parentRunId !== ''
                ? { parentRunId: options.parentRunId }
                : {}),
            participants: uniqueParticipants,
            blackboard: blackboard.snapshot(),
            cost: computeCostSummary(budget, now),
            notices: [],
        };
        const context = {
            runId,
            state,
            blackboard,
            // What the engines are asked about: context block + new question.
            promptRequest,
            budget,
            machine,
            roster,
            abort,
            gate: new UserInputGate(),
            queued: [],
            settled: false,
        };
        this.store.add(context);
        // Keep the transported blackboard in step without the orchestrator having
        // to remember to refresh it after every phase.
        const unsubscribe = blackboard.subscribe((snapshot) => {
            this.store.patch(runId, { blackboard: snapshot });
        });
        /**
         * Charge one model call to *this* run.
         *
         * Bound per run rather than registered as a global observer on the
         * registry: the registry is shared by every run, so a global observer
         * would let concurrent runs spend each other's budget.
         */
        const recordUsage = (usage) => {
            budget.record(usage);
            this.store.refreshCost(runId);
        };
        this.engines.set(runId, {
            engine: new DiscussionEngine({
                registry: this.registry,
                blackboard,
                ...(this.logger ? { logger: this.logger } : {}),
                onParticipant: (profileId, patch) => this.store.patchParticipant(runId, profileId, patch),
                onNotice: (notice) => this.store.notice(runId, notice),
                onUsage: recordUsage,
            }),
            executor: new Executor({
                ctx: this.ctx,
                registry: this.registry,
                // Present only when the run was started from an agent session.
                ...(options.agent ? { agent: options.agent } : {}),
                permissions: this.config.executor?.permissions ?? 'full',
                sandbox: new ToolSandbox(this.config.executor),
                blackboard,
                ...(this.logger ? { logger: this.logger } : {}),
                onParticipant: (profileId, patch) => this.store.patchParticipant(runId, profileId, patch),
                onNotice: (notice) => this.store.notice(runId, notice),
                onUsage: recordUsage,
            }),
            verifier: new Verifier(this.registry, recordUsage),
            lead: new LeadModel(this.registry, recordUsage),
        });
        this.logger?.info('run %s started: %s', runId, describeRoster(roster));
        // Fire and forget: the run reports through the store from here on.
        void this.run(context).finally(() => {
            unsubscribe();
            this.engines.delete(runId);
        });
        return this.store.get(runId)?.state ?? state;
    }
    /** Deliver a user control to the run currently parked on it, or queue it. */
    control(runId, control) {
        const context = this.store.get(runId);
        if (!context || context.settled)
            return false;
        // `stop` takes effect immediately through the abort signal.
        if (control.kind === 'stop') {
            this.stopRun(context, '用户叫停');
            return true;
        }
        context.queued.push(control);
        // Wake a parked run; a run between phases picks the control up at its next
        // checkpoint via `takeQueued`.
        context.gate.resolve(control);
        return true;
    }
    /** Cancel a run from the outside (plugin unload, host shutdown). */
    cancel(runId) {
        const context = this.store.get(runId);
        if (!context || context.settled)
            return false;
        this.stopRun(context, '运行被取消');
        return true;
    }
    /** Abort every in-flight run. Called from the plugin's disposer. */
    dispose() {
        for (const context of this.store.all()) {
            if (!context.settled)
                this.stopRun(context, '插件卸载');
        }
    }
    stopRun(context, reason) {
        context.abort.abort();
        this.store.notice(context.runId, { level: 'warn', message: reason });
    }
    // --------------------------------------------------------------------- driving
    /** Consume the first queued control of a given kind, if any. */
    takeQueued(context, kind) {
        const index = context.queued.findIndex((control) => control.kind === kind);
        if (index === -1)
            return undefined;
        const [control] = context.queued.splice(index, 1);
        return control;
    }
    /** Whether the run has been aborted. */
    aborted(context) {
        return context.abort.signal.aborted;
    }
    /** Transition the state machine and mirror it into the transported state. */
    goto(context, phase) {
        context.machine.goto(phase);
        this.store.setPhase(context.runId, phase, statusOf(phase));
        this.logger?.debug('run %s -> %s', context.runId, PHASE_LABELS[phase]);
    }
    notice(context, level, message) {
        this.store.notice(context.runId, { level, message });
    }
    /**
     * The main protocol. Linear on purpose — see the file header.
     */
    async run(context) {
        const { blackboard, budget, roster, abort } = context;
        const parts = this.engines.get(context.runId);
        const signal = abort.signal;
        try {
            // ---------------------------------------------------------- clarification
            this.goto(context, 'clarifying');
            const verdict = await parts.lead.clarify(roster.lead, context.promptRequest, undefined, signal);
            this.store.refreshCost(context.runId);
            if (this.aborted(context)) {
                this.finish(context, 'stopped');
                return;
            }
            if (!verdict.clear && verdict.questions.length > 0) {
                blackboard.askClarification(verdict.questions);
                this.goto(context, 'awaiting-user');
                this.store.patch(context.runId, { pendingQuestion: verdict.questions.join('\n') });
                const control = await context.gate.wait(signal);
                if (this.aborted(context) || !control || control.kind !== 'supply-clarification') {
                    this.finish(context, 'stopped');
                    return;
                }
                blackboard.answerClarification(control.answer);
                this.store.patch(context.runId, { pendingQuestion: undefined });
                // Clarification is asked at most once: a lead model that keeps finding
                // the request unclear would otherwise park the run forever.
                this.goto(context, 'clarifying');
            }
            // ------------------------------------------------------------- discussion
            const decision = await this.runDiscussion(context, parts);
            if (!decision) {
                this.finish(context, this.aborted(context) ? 'stopped' : 'failed');
                return;
            }
            // --------------------------------------------------- plan / execute / verify
            let replans = 0;
            let repairs = 0;
            let plan;
            let execution;
            let verification;
            let activeDecision = decision;
            for (;;) {
                if (this.aborted(context)) {
                    this.finish(context, 'stopped');
                    return;
                }
                const built = await this.runPlanning(context, parts, activeDecision);
                if (!built) {
                    this.finish(context, this.aborted(context) ? 'stopped' : 'failed');
                    return;
                }
                plan = built;
                const executed = await this.runExecution(context, parts, plan);
                if (!executed) {
                    this.finish(context, this.aborted(context) ? 'stopped' : 'failed');
                    return;
                }
                execution = executed;
                verification = await this.runVerification(context, parts, plan, execution);
                // Failure routing: repair first (same plan), replan only if the plan
                // itself is at fault and the counter has room.
                if (verification && !verification.passed) {
                    if (verification.recommendedAction === 'repair' && repairs < MAX_REPAIRS) {
                        repairs++;
                        this.notice(context, 'info', `验证未通过，按原计划重试执行（第 ${repairs} 次）。`);
                        continue;
                    }
                    if (verification.recommendedAction === 'replan' && replans < MAX_REPLANS) {
                        replans++;
                        this.notice(context, 'info', `验证未通过且计划本身存在问题，回到主导决策重新规划（第 ${replans} 次）。`);
                        this.goto(context, 'deciding');
                        const redecided = await this.redecide(context, parts, verification);
                        if (!redecided)
                            break;
                        activeDecision = redecided;
                        continue;
                    }
                }
                break;
            }
            // ---------------------------------------------------------------- answer
            if (this.aborted(context)) {
                this.finish(context, 'stopped');
                return;
            }
            this.goto(context, 'finalizing');
            const slice = blackboard.sliceFor('decisionMaker', {
                includeExecution: true,
                includeVerification: true,
                includeDecision: true,
            });
            const answer = await parts.lead.finalAnswer(roster.lead, slice, signal);
            blackboard.setFinalAnswer(answer);
            this.store.refreshCost(context.runId);
            this.finish(context, 'completed');
        }
        catch (cause) {
            const message = cause instanceof Error ? cause.message : String(cause);
            this.logger?.error('run %s failed: %s', context.runId, message);
            this.notice(context, 'error', `运行失败：${message}`);
            this.finish(context, 'failed');
        }
    }
    // ------------------------------------------------------------- phase helpers
    /**
     * Propose -> [review] -> decide, looping only while there is budget and the
     * decision maker has not found anything workable.
     */
    async runDiscussion(context, parts) {
        const { blackboard, budget, roster } = context;
        const signal = context.abort.signal;
        let round = 0;
        for (;;) {
            round++;
            // Collected here rather than re-read from the ledger afterwards: the
            // round row is only appended once the decision closes it, so a lookup
            // keyed by round number would find nothing at that point.
            let proposalIds = [];
            let reviewIds = [];
            const canDiscuss = budget.canStartRound(round);
            if (!canDiscuss) {
                const status = budget.status();
                if (blackboard.read().proposals.length === 0) {
                    throw new Error(status.exhausted
                        ? `预算在产生任何提案之前就耗尽了：${status.exhaustedReason}`
                        : '已达到最大讨论轮数，且没有任何提案可供决策。');
                }
                this.notice(context, 'warn', status.exhausted
                    ? `预算已耗尽（${status.exhaustedReason}），立即停止讨论并进入主导决策。`
                    : `已达最大讨论轮数（${budget.maxRounds}），停止讨论并进入主导决策。`);
                this.goto(context, 'deciding');
            }
            else {
                // ------------------------------------------------------------ propose
                this.goto(context, 'proposing');
                const proposals = await parts.engine.runProposals(round, roster.proposers, signal);
                proposalIds = proposals.map((proposal) => proposal.id);
                this.store.refreshCost(context.runId);
                this.notice(context, 'info', `第 ${round} 轮：${proposals.length} 个模型独立给出方案。`);
                // ------------------------------------------------------------- review
                //
                // The proposers review each other, anonymously. This is the step
                // that turns "N independent answers" into "N answers plus each
                // author's response to the others": every proposer is shown the
                // anonymised set (including the ones it did not write) and asked
                // what it now thinks. Seated reviewers, when present, run over
                // the same anonymised set in the same round.
                const skipReview = this.takeQueued(context, 'skip-review') !== undefined;
                const peerReviewers = this.config.peerReview === false ? [] : roster.proposers;
                const reviewers = [...roster.reviewers, ...peerReviewers];
                if (reviewers.length > 0 && !skipReview) {
                    this.goto(context, 'reviewing');
                    const reviews = await parts.engine.runReviews(round, reviewers, proposals, signal);
                    reviewIds = reviews.map((review) => review.id);
                    this.store.refreshCost(context.runId);
                }
                else if (reviewers.length > 0) {
                    this.notice(context, 'info', '已按用户指令跳过交叉评审。');
                }
                this.goto(context, 'deciding');
            }
            if (this.aborted(context))
                return undefined;
            // --------------------------------------------------------------- decide
            const forced = this.takeQueued(context, 'force-adopt');
            const outcome = forced
                ? this.applyForcedAdoption(context, forced.proposalId, round)
                : await parts.lead.decide(roster.lead, blackboard.sliceFor('decisionMaker'), round, signal);
            if (!outcome) {
                this.notice(context, 'error', `强制采纳的方案 "${forced?.proposalId}" 不存在。`);
                return undefined;
            }
            const { decision, autoRejected } = outcome;
            blackboard.setDecision(decision);
            blackboard.addRound({
                round,
                proposalIds,
                reviewIds,
                decisionId: decision.id,
            });
            this.store.refreshCost(context.runId);
            if (autoRejected.length > 0) {
                this.notice(context, 'warn', `决策未提及 ${autoRejected.length} 个方案（${autoRejected.join(', ')}），系统已自动将其归入否决。`);
            }
            if (decision.needsUserInput) {
                this.notice(context, 'info', '决策者认为方案取舍取决于用户偏好，已保留该判断，最终答复中将说明分歧。');
            }
            // Loop back only when nothing was adopted and rounds remain.
            if (decision.chosenProposalIds.length === 0 && budget.canStartRound(round + 1)) {
                this.notice(context, 'info', `第 ${round} 轮没有形成可行方案，进入下一轮讨论。`);
                continue;
            }
            return decision;
        }
    }
    /** Build a decision record from a user's force-adopt instruction. */
    applyForcedAdoption(context, proposalId, round) {
        const proposal = context.blackboard.findProposal(proposalId);
        if (!proposal)
            return undefined;
        const others = context.blackboard.read().proposals
            .filter((candidate) => candidate.id !== proposalId)
            .map((candidate) => candidate.id);
        return {
            decision: {
                id: `decision-forced-${randomUUID().slice(0, 8)}`,
                decisionMakerProfileId: 'user',
                chosenProposalIds: [proposalId],
                rejectedProposalIds: others,
                rationale: `用户强制采纳方案 ${proposalId}。`,
                finalDirection: proposal.plan,
                round,
            },
            autoRejected: [],
        };
    }
    /** Re-decide after a failed verification, with the verdict in view. */
    async redecide(context, parts, verification) {
        const slice = context.blackboard.sliceFor('decisionMaker', {
            includeExecution: true,
            includeVerification: true,
        });
        // Fold the verifier's findings into the request the decision maker sees,
        // so a replan is informed rather than a rerun of the same reasoning.
        const augmented = {
            ...slice,
            clarification: (slice.clarification ? `${slice.clarification}\n\n` : '') +
                `上一次执行的验证未通过。问题：${verification.issues.join('; ') || '（未说明）'}。` +
                `建议：${verification.suggestions.join('; ') || '（无）'}。请据此调整决策方向。`,
        };
        const outcome = await parts.lead.decide(context.roster.lead, augmented, context.blackboard.read().rounds.length + 1, context.abort.signal);
        context.blackboard.setDecision(outcome.decision);
        this.store.refreshCost(context.runId);
        return outcome.decision;
    }
    /** Generate the plan, handling the optional approval park. */
    async runPlanning(context, parts, decision) {
        const { blackboard, roster } = context;
        const signal = context.abort.signal;
        this.goto(context, 'planning');
        const adopted = decision.chosenProposalIds
            .map((id) => blackboard.findProposal(id))
            .filter((proposal) => proposal !== undefined);
        // Plan against the tools the executor can actually dispatch: a plan that
        // names tools nobody has is a plan that cannot run.
        const availableTools = typeof parts.executor.availableToolNames === 'function'
            ? parts.executor.availableToolNames()
            : [];
        let plan = await parts.lead.buildPlan(roster.lead, context.promptRequest, decision, adopted, signal, availableTools);
        blackboard.setPlan(plan);
        this.store.refreshCost(context.runId);
        if (this.aborted(context))
            return undefined;
        // A plan that changes nothing runs unattended. One that does asks first.
        // The plan gate is the one approval that can actually reach the user; the
        // per-tool switch is separate and defaults off.
        const needsApproval = plan.mutatesState && this.config.executor?.planApproval !== false;
        if (!needsApproval)
            return plan;
        this.store.patch(context.runId, {
            pendingQuestion: `该计划包含会改变系统状态的操作，是否批准执行？\n\n${plan.steps
                .map((step) => `- ${step.description}${step.tool ? `（调用 ${step.tool}）` : ''}`)
                .join('\n')}`,
        });
        const control = await context.gate.wait(signal);
        this.store.patch(context.runId, { pendingQuestion: undefined });
        if (this.aborted(context))
            return undefined;
        if (!control)
            return undefined;
        if (control.kind === 'edit-plan') {
            plan = control.plan;
            blackboard.setPlan(plan);
            this.notice(context, 'info', '用户修改了计划，将按修改后的计划执行。');
            return plan;
        }
        if (control.kind === 'approve-plan') {
            this.notice(context, 'info', '用户批准了计划。');
            return plan;
        }
        if (control.kind === 'stop') {
            return undefined;
        }
        // Any other control does not answer the approval question; treat it as
        // "not approved" and end the run rather than executing unapproved work.
        this.notice(context, 'warn', '未收到计划批准，出于安全考虑未执行。');
        return undefined;
    }
    /** Run the plan. */
    async runExecution(context, parts, plan) {
        this.goto(context, 'executing');
        const result = await parts.executor.execute(plan, context.roster.executor, context.abort.signal);
        this.store.refreshCost(context.runId);
        return result;
    }
    /** Verify, when a verifier is seated. */
    async runVerification(context, parts, plan, execution) {
        const verifierProfile = context.roster.verifier;
        if (!verifierProfile)
            return undefined;
        this.goto(context, 'verifying');
        this.store.patchParticipant(context.runId, verifierProfile.id, {
            state: 'thinking',
            phase: 'verifying',
            startedAt: Date.now(),
        });
        const verification = await parts.verifier.verify(plan, execution, verifierProfile, context.abort.signal);
        context.blackboard.setVerification(verification);
        this.store.refreshCost(context.runId);
        this.store.patchParticipant(context.runId, verifierProfile.id, {
            state: 'done',
            phase: 'verifying',
            finishedAt: Date.now(),
        });
        if (!verification.passed) {
            this.notice(context, 'warn', `验证未通过：${verification.issues.join('; ') || '（未说明问题）'}（建议：${verification.recommendedAction}）`);
        }
        return verification;
    }
    /** Settle the run on a terminal phase. */
    finish(context, phase) {
        context.settled = true;
        // The transition table encodes the normal edges only. An abnormal end —
        // aborted mid-phase, provider failure during `proposing` — is settled
        // explicitly rather than by enumerating every phase → terminal pair.
        if (!context.machine.isTerminal) {
            context.machine.settle(phase, 'run settled');
        }
        this.store.refreshCost(context.runId);
        this.store.patch(context.runId, {
            phase,
            status: statusOf(phase),
            finishedAt: Date.now(),
            pendingQuestion: undefined,
            blackboard: context.blackboard.snapshot(),
        });
        this.logger?.info('run %s finished: %s', context.runId, phase);
    }
}
//# sourceMappingURL=orchestrator.js.map