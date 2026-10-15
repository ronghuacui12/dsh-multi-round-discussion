/**
 * discussion-engine (doc §7, §8).
 *
 * Responsibilities, and the mechanism that makes each one real:
 *
 *   - **Parallel, independent proposals.** Every proposer is dispatched with
 *     `sliceFor('proposer')`, which returns the request and nothing else. Two
 *     proposers cannot converge by reading each other, because there is
 *     nothing to read. They are launched with `Promise.allSettled`, so one slow
 *     or broken vendor cannot hold up the round.
 *
 *   - **Anonymous cross-review.** Reviewers receive `anonymizeProposals()`,
 *     which strips profile ids and substitutes stable `P1/P2/…` labels. The
 *     mapping back to real proposal ids happens here, after the reviews land,
 *     so a reviewer never learns which vendor wrote what.
 *
 *   - **Partial failure is survivable.** One proposer failing degrades the
 *     round; it does not abort it. Only a round where *every* proposer failed
 *     is an error, and that error is raised so the orchestrator can decide
 *     (usually: hand straight to the decision maker with what exists).
 */
import { randomUUID } from 'node:crypto';
import { PROPOSAL_SYSTEM, REVIEW_SYSTEM, buildProposalPrompt, buildReviewPrompt, } from "../core/prompts.js";
import { StructuredOutputError, clampConfidence, optionalStringArray, parseStructured, requireString, salvageText } from "../utils/json.js";
/** Raised when a round produced nothing usable. */
export class EmptyRoundError extends Error {
    round;
    failures;
    constructor(round, failures) {
        super(`Round ${round} produced no usable proposals. All ${failures.length} proposers failed:\n` +
            failures.map((f) => `  - ${f}`).join('\n'));
        this.round = round;
        this.failures = failures;
        this.name = 'EmptyRoundError';
    }
}
export class DiscussionEngine {
    registry;
    blackboard;
    logger;
    onParticipant;
    onNotice;
    onUsage;
    constructor(options) {
        this.registry = options.registry;
        this.blackboard = options.blackboard;
        this.logger = options.logger;
        this.onParticipant = options.onParticipant ?? (() => { });
        this.onNotice = options.onNotice ?? (() => { });
        this.onUsage = options.onUsage ?? (() => { });
    }
    /**
     * Run one round of parallel proposals.
     *
     * @param round - 1-based round number, used for ids and prompt framing.
     * @param proposers - the seated proposer profiles.
     * @param signal - run cancellation.
     * @returns the proposals that succeeded, in roster order.
     */
    async runProposals(round, proposers, signal) {
        if (proposers.length === 0)
            throw new EmptyRoundError(round, ['(no proposers were seated)']);
        const prompt = buildProposalPrompt(this.blackboard.sliceFor('proposer'), round);
        const settled = await Promise.allSettled(proposers.map((profile, index) => this.proposeOne(profile, round, index, prompt, signal)));
        const proposals = [];
        const failures = [];
        settled.forEach((result, index) => {
            const profile = proposers[index];
            if (result.status === 'fulfilled') {
                proposals.push(result.value);
                return;
            }
            const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
            failures.push(`${profile.label ?? profile.id} (${profile.provider}/${profile.model}): ${message}`);
            this.onParticipant(profile.id, { state: 'error', phase: 'proposing', error: message, finishedAt: Date.now() });
            this.onNotice({ level: 'warn', message: `提案者 ${profile.label ?? profile.id} 失败：${message}` });
            this.logger?.warn('proposer %s failed: %s', profile.id, message);
        });
        if (proposals.length === 0)
            throw new EmptyRoundError(round, failures);
        if (failures.length > 0) {
            this.onNotice({
                level: 'warn',
                message: `第 ${round} 轮有 ${failures.length} 个提案者失败，${proposals.length} 个成功，讨论继续。`,
            });
        }
        this.blackboard.addProposals(proposals);
        return proposals;
    }
    /** Dispatch one proposer and parse its structured reply. */
    async proposeOne(profile, round, index, prompt, signal) {
        const id = `proposal-r${round}-${index + 1}`;
        this.onParticipant(profile.id, {
            state: 'thinking',
            phase: 'proposing',
            startedAt: Date.now(),
            finishedAt: undefined,
            error: undefined,
        });
        const response = await this.registry.call(profile.id, {
            prompt,
            system: mergeSystem(profile.systemPrompt, PROPOSAL_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (!response.ok) {
            throw new Error(response.error ?? `model call failed (${response.errorCode ?? 'unknown'})`);
        }
        const proposal = parseProposal(response.text, id, profile.id);
        this.onParticipant(profile.id, { state: 'done', phase: 'proposing', finishedAt: Date.now() });
        return {
            ...proposal,
            usage: {
                inputTokens: response.usage.inputTokens,
                outputTokens: response.usage.outputTokens,
                durationMs: response.durationMs,
                costUsd: response.costUsd,
            },
        };
    }
    /**
     * Run one round of anonymous cross-review.
     *
     * Reviewers are dispatched in parallel for the same reason proposers are,
     * and they all see the identical anonymised set — no reviewer is influenced
     * by another reviewer's verdict.
     *
     * @param round - round whose proposals are under review.
     * @param reviewers - the seated reviewer profiles.
     * @param proposals - the proposals to review. Passed in rather than looked up
     *   by round: the round ledger entry only lands once the decision closes the
     *   round, so a round-keyed lookup would come up empty here.
     * @param signal - run cancellation.
     * @returns the reviews, with `targetProposalId` resolved from the anon labels.
     */
    async runReviews(round, reviewers, proposals, signal) {
        if (reviewers.length === 0)
            return [];
        const { anonymous, mapping } = this.blackboard.anonymizeProposals(proposals);
        if (anonymous.length === 0)
            return [];
        const prompt = buildReviewPrompt(this.blackboard.sliceFor('reviewer'), anonymous);
        const settled = await Promise.allSettled(reviewers.map((profile, index) => this.reviewOne(profile, round, index, prompt, anonymous, mapping, signal)));
        const reviews = [];
        settled.forEach((result, index) => {
            const profile = reviewers[index];
            if (result.status === 'fulfilled') {
                reviews.push(...result.value);
                this.onParticipant(profile.id, { state: 'done', phase: 'reviewing', finishedAt: Date.now() });
                return;
            }
            const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
            this.onParticipant(profile.id, { state: 'error', phase: 'reviewing', error: message, finishedAt: Date.now() });
            this.onNotice({ level: 'warn', message: `评审者 ${profile.label ?? profile.id} 失败：${message}` });
            this.logger?.warn('reviewer %s failed: %s', profile.id, message);
        });
        // Reviews are advisory: losing all of them does not invalidate the round,
        // because the decision maker still reads every proposal in full.
        if (reviews.length === 0) {
            this.onNotice({ level: 'warn', message: '交叉评审没有产出任何有效意见，决策将只依据提案本身。' });
            return [];
        }
        this.blackboard.addReviews(reviews);
        return reviews;
    }
    /** Dispatch one reviewer over the anonymised set. */
    async reviewOne(profile, round, index, prompt, anonymous, mapping, signal) {
        this.onParticipant(profile.id, {
            state: 'thinking',
            phase: 'reviewing',
            startedAt: Date.now(),
            finishedAt: undefined,
            error: undefined,
        });
        const response = await this.registry.call(profile.id, {
            prompt,
            system: mergeSystem(profile.systemPrompt, REVIEW_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (!response.ok) {
            throw new Error(response.error ?? `model call failed (${response.errorCode ?? 'unknown'})`);
        }
        return parseReviews(response.text, profile.id, round, index, anonymous, mapping);
    }
}
/** Compose a profile's own prompt with the phase instruction. */
export function mergeSystem(profileSystem, phaseSystem) {
    if (!profileSystem || profileSystem.trim() === '')
        return phaseSystem;
    return `${profileSystem}\n\n---\n\n${phaseSystem}`;
}
/** Validate a parsed object as a proposal body. */
function parseProposal(text, id, profileId) {
    const check = (raw) => {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            throw new StructuredOutputError('Expected a JSON object for the proposal.', text);
        }
        const o = raw;
        const risks = optionalStringArray(o.risks);
        const confidence = clampConfidence(o.confidence);
        return {
            id,
            profileId,
            summary: requireString(o.summary, 'summary'),
            plan: requireString(o.plan, 'plan'),
            reasons: optionalStringArray(o.reasons),
            // A proposal with no acknowledged risk is a quality problem, not a
            // protocol error. Record it explicitly so the decision maker sees it.
            risks: risks.length > 0 ? risks : ['（该方案未声明任何风险，请谨慎评估）'],
            dependencies: optionalStringArray(o.dependencies),
            confidence: risks.length > 0 ? confidence : Math.min(confidence, 0.5),
        };
    };
    try {
        return parseStructured(text, check);
    }
    catch (cause) {
        if (!(cause instanceof StructuredOutputError))
            throw cause;
        // Degrade rather than lose the whole proposer: keep its prose as the plan
        // and flag the low confidence so it cannot masquerade as a clean proposal.
        return {
            id,
            profileId,
            summary: salvageText(text).slice(0, 200),
            plan: salvageText(text),
            reasons: [],
            risks: ['（该方案未能按结构化格式输出，理由与风险字段缺失）'],
            dependencies: [],
            confidence: 0.2,
        };
    }
}
/** Validate the top-level `{ reviews: [...] }` envelope. */
function parseReviews(text, reviewerProfileId, round, reviewerIndex, anonymous, mapping) {
    const knownAnonIds = new Set(anonymous.map((a) => a.anonId));
    const check = (raw) => {
        if (typeof raw !== 'object' || raw === null) {
            throw new StructuredOutputError('Expected a JSON object with a "reviews" array.', text);
        }
        const list = raw.reviews;
        if (!Array.isArray(list)) {
            throw new StructuredOutputError('Field "reviews" must be an array.', text);
        }
        const parsed = [];
        for (const entry of list) {
            if (typeof entry !== 'object' || entry === null)
                continue;
            const o = entry;
            const anonId = typeof o.targetAnonId === 'string' ? o.targetAnonId.trim() : '';
            // Ignore reviews aimed at labels that do not exist: a hallucinated P9 is
            // not evidence about any real proposal.
            if (!knownAnonIds.has(anonId))
                continue;
            const targetProposalId = mapping.get(anonId);
            if (!targetProposalId)
                continue;
            parsed.push({
                targetAnonId: anonId,
                targetProposalId,
                pros: optionalStringArray(o.pros),
                cons: optionalStringArray(o.cons),
                suggestions: optionalStringArray(o.suggestions),
                confidence: clampConfidence(o.confidence),
            });
        }
        if (parsed.length === 0) {
            throw new StructuredOutputError('No review entries referenced a real proposal id.', text);
        }
        return parsed;
    };
    const reviews = parseStructured(text, check);
    return reviews.map((review, i) => ({
        ...review,
        id: `review-r${round}-${reviewerIndex + 1}-${i + 1}-${randomUUID().slice(0, 8)}`,
        reviewerProfileId,
        round,
    }));
}
//# sourceMappingURL=discussion-engine.js.map