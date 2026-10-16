/**
 * Run-level vocabulary: phases, status, control commands, cost projection.
 * These are the types the UI renders and the control bar writes.
 */
import type { BlackboardSnapshot } from './blackboard.js';
import type { ExecutionPlan } from './plan.js';
import type { ModelProfile, ModelRole } from './model-profile.js';
/**
 * The orchestration state machine's states (doc §2.2).
 *
 * Note the loop-back rule: every retry path re-enters at `deciding`. There is
 * no `proposing -> proposing` edge, which is what makes "the discussion cannot
 * run forever" a structural property rather than a prompt instruction.
 */
export type Phase = 
/** No run in flight. */
'idle'
/** Lead model is checking whether the request is answerable as stated. */
 | 'clarifying'
/** Parked: the lead model asked the user something. */
 | 'awaiting-user'
/** Proposers are running in parallel, each blind to the others. */
 | 'proposing'
/** Reviewers are cross-checking anonymised proposals. */
 | 'reviewing'
/** The lead model is choosing / fusing / rejecting. */
 | 'deciding'
/** The decision is being turned into a structured plan. */
 | 'planning'
/** The executor is walking the plan. */
 | 'executing'
/** The verifier is checking execution against acceptance criteria. */
 | 'verifying'
/** The lead model is composing the final answer. */
 | 'finalizing'
/** Terminal: answered. */
 | 'completed'
/** Terminal: unrecoverable failure. */
 | 'failed'
/** Terminal: user called stop (or the budget guard did). */
 | 'stopped';
/** Coarse grouping of {@link Phase} for UI colouring. */
export type RunStatus = 'idle' | 'running' | 'awaiting' | 'done' | 'error';
/** Live status of one participating model. */
export interface ParticipantStatus {
    profileId: string;
    label: string;
    role: ModelRole;
    state: 'idle' | 'thinking' | 'done' | 'error' | 'aborted';
    /** Which phase the participant is currently serving. */
    phase: Phase;
    startedAt?: number;
    finishedAt?: number;
    error?: string;
}
/** Per-participant and total spend, as shown in the cost panel. */
export interface CostSummary {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    totalDurationMs: number;
    /** Per-participant breakdown, sorted by cost descending. */
    byProfile: ProfileCost[];
    /** Budget consumption and what is left. */
    budget: BudgetStatus;
}
/** One row of the per-participant cost breakdown. */
export interface ProfileCost {
    profileId: string;
    label: string;
    role: ModelRole;
    provider: string;
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    durationMs: number;
}
/** How much of each budget is left. `Infinity` means unlimited. */
export interface BudgetStatus {
    maxTotalTokens: number;
    maxTotalCostUsd: number;
    maxDurationMs: number;
    remainingTokens: number;
    remainingCostUsd: number;
    remainingMs: number;
    /** True as soon as any dimension is exhausted. */
    exhausted: boolean;
    /** Human-readable reason, set when `exhausted`. */
    exhaustedReason?: string;
}
/**
 * A user instruction issued mid-run from the control bar (doc §12.3).
 *
 * Commands are advisory inputs to the state machine, not direct mutations:
 * the orchestrator applies them at the next safe point, so the blackboard
 * never observes a half-applied instruction.
 */
export type RunControl = 
/** Ask the run to stop at the next safe point. */
{
    kind: 'stop';
}
/** Skip the review phase for the current or next round. */
 | {
    kind: 'skip-review';
}
/** Bypass deliberation and adopt one proposal directly. */
 | {
    kind: 'force-adopt';
    proposalId: string;
}
/** Replace the current plan and continue from execution. */
 | {
    kind: 'edit-plan';
    plan: ExecutionPlan;
}
/** Approve the plan so execution may start. */
 | {
    kind: 'approve-plan';
}
/** Answer the clarification question the run is parked on. */
 | {
    kind: 'supply-clarification';
    answer: string;
};
/**
 * Everything the discussion view renders for one run.
 *
 * Deliberately self-contained and JSON-serialisable: the client fetches this
 * over HTTP and renders it without reaching into host internals.
 */
export interface RunState {
    runId: string;
    phase: Phase;
    status: RunStatus;
    /** Monotonic; bumped on every mutation so the client can skip no-op renders. */
    revision: number;
    startedAt: number;
    updatedAt: number;
    finishedAt?: number;
    /** The user's request, as submitted. */
    request: string;
    /** Model selection for this run, frozen at start. */
    participants: ParticipantStatus[];
    /** The blackboard, deep-copied for transport. */
    blackboard: BlackboardSnapshot;
    cost: CostSummary;
    /** Operator-facing messages: budget exhaustion, forced hand-over, denials. */
    notices: RunNotice[];
    /** Set while the run is parked awaiting a user answer. */
    pendingQuestion?: string;
    /**
     * Set when this run was started as a follow-up to an earlier one
     * (`POST /runs` with `parentRunId`). The UI uses it to link the thread.
     */
    parentRunId?: string;
    /** True only on a run restored from the on-disk history. */
    restored?: boolean;
}
/** A notice surfaced in the discussion view. */
export interface RunNotice {
    id: string;
    at: number;
    level: 'info' | 'warn' | 'error';
    message: string;
}
/** Which preset shapes the participant roster (doc §3.2). */
export type PresetName = 'fast' | 'balanced' | 'deep' | 'custom';
/** The roster a preset expands to. */
export interface PresetDefinition {
    name: PresetName;
    /** Whether cross-review runs. */
    review: boolean;
    /** Whether a verifier runs after execution. */
    verify: boolean;
    /** How many proposer profiles to pick. */
    proposers: number;
    /** Hard ceiling on discussion rounds, further clamped by the budget guard. */
    maxRounds: number;
}
/** The full participant roster for one run, after preset expansion. */
export interface Roster {
    preset: PresetName;
    lead: ModelProfile;
    proposers: ModelProfile[];
    reviewers: ModelProfile[];
    executor: ModelProfile;
    verifier?: ModelProfile;
}
//# sourceMappingURL=run.d.ts.map