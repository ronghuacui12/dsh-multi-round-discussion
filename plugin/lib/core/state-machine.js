/**
 * Legal transitions out of each phase.
 *
 * Reading note: `executing -> deciding` is the "execution failed, hand it back
 * to the lead model" path, and `verifying -> executing` is the narrowly-scoped
 * "verification failed but the plan itself is sound" repair. Both are in the
 * design document; nothing else loops.
 */
const TRANSITIONS = {
    idle: ['clarifying', 'failed'],
    clarifying: ['awaiting-user', 'proposing', 'stopped', 'failed'],
    'awaiting-user': ['clarifying', 'stopped', 'failed'],
    proposing: ['reviewing', 'deciding', 'stopped', 'failed'],
    reviewing: ['deciding', 'stopped', 'failed'],
    // `deciding -> finalizing` covers a request that needs no plan at all
    // (a question that the discussion itself answered).
    deciding: ['proposing', 'planning', 'finalizing', 'stopped', 'failed'],
    planning: ['executing', 'deciding', 'finalizing', 'stopped', 'failed'],
    // `executing -> finalizing` exists for compositions where no verifier is
    // seated (the fast and balanced presets). Verification is optional, so a run
    // that has no verifier must be able to go straight to the answer instead of
    // passing through a phase it will not perform.
    executing: ['verifying', 'finalizing', 'deciding', 'stopped', 'failed'],
    // `verifying -> executing` is the same-plan repair retry.
    verifying: ['finalizing', 'deciding', 'executing', 'stopped', 'failed'],
    finalizing: ['completed', 'stopped', 'failed'],
    completed: [],
    failed: [],
    stopped: [],
};
/** Phases from which no transition is possible. */
export const TERMINAL_PHASES = ['completed', 'failed', 'stopped'];
/** Map a phase to the coarse status the UI colours by. */
export function statusOf(phase) {
    switch (phase) {
        case 'idle':
            return 'idle';
        case 'completed':
            return 'done';
        case 'failed':
            return 'error';
        case 'stopped':
            return 'done';
        case 'awaiting-user':
            return 'awaiting';
        default:
            return 'running';
    }
}
/** Human-readable phase labels, used by the UI and the notices feed. */
export const PHASE_LABELS = {
    idle: '未开始',
    clarifying: '需求澄清',
    'awaiting-user': '等待用户补充',
    proposing: '并行提案',
    reviewing: '交叉评审',
    deciding: '主导决策',
    planning: '计划生成',
    executing: '执行',
    verifying: '验证',
    finalizing: '最终答复',
    completed: '已完成',
    failed: '失败',
    stopped: '已停止',
};
/** Raised on an attempt to take an illegal edge. */
export class IllegalTransitionError extends Error {
    from;
    to;
    allowed;
    constructor(from, to, allowed) {
        super(`Illegal phase transition ${from} -> ${to}. ` +
            `From ${from} the run may only go to: ${allowed.length > 0 ? allowed.join(', ') : '(terminal)'}.`);
        this.from = from;
        this.to = to;
        this.allowed = allowed;
        this.name = 'IllegalTransitionError';
    }
}
export class StateMachine {
    currentPhase;
    options;
    records = [];
    constructor(initial = 'idle', options = {}) {
        this.currentPhase = initial;
        this.options = options;
    }
    get phase() {
        return this.currentPhase;
    }
    get status() {
        return statusOf(this.currentPhase);
    }
    get isTerminal() {
        return TERMINAL_PHASES.includes(this.currentPhase);
    }
    /** Phases reachable from here. */
    get allowedNext() {
        return TRANSITIONS[this.currentPhase];
    }
    /** Whether `to` is a legal next phase. */
    can(to) {
        return TRANSITIONS[this.currentPhase].includes(to);
    }
    /** All transitions taken so far. */
    history() {
        return this.records;
    }
    /**
     * Move to `to`, or throw {@link IllegalTransitionError}.
     *
     * @param to - the next phase.
     * @param reason - short audit note; stored in the transition record.
     */
    goto(to, reason) {
        if (!this.can(to)) {
            throw new IllegalTransitionError(this.currentPhase, to, TRANSITIONS[this.currentPhase]);
        }
        const record = { from: this.currentPhase, to, at: Date.now(), reason };
        this.currentPhase = to;
        this.records.push(record);
        this.options.onTransition?.(record);
    }
    /**
     * Move to `to` only if legal; otherwise stay put and report false.
     *
     * Used by the budget guard, which wants to force a hand-over to the decision
     * phase but must not throw when the run is already there.
     */
    tryGoto(to, reason) {
        if (!this.can(to))
            return false;
        this.goto(to, reason);
        return true;
    }
    /**
     * Unconditionally settle on a terminal phase.
     *
     * Termination is reachable from every phase in principle — a provider can
     * fail during `proposing`, a user can abort during `executing` — but the
     * transition table only encodes the *normal* edges. Rather than listing every
     * phase → terminal pair (and its combinatorial maintenance), abnormal ends
     * funnel through here. Non-terminal targets are rejected: this is for
     * settling, not for skipping phases.
     *
     * @param to - a terminal phase.
     * @param reason - audit note recorded in the transition history.
     */
    settle(to, reason) {
        if (!TERMINAL_PHASES.includes(to)) {
            throw new Error(`StateMachine.settle() only accepts a terminal phase, got "${to}".`);
        }
        if (this.currentPhase === to)
            return;
        const record = { from: this.currentPhase, to, at: Date.now(), reason };
        this.currentPhase = to;
        this.records.push(record);
        this.options.onTransition?.(record);
    }
}
//# sourceMappingURL=state-machine.js.map