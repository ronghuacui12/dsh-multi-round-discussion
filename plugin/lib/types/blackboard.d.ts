/**
 * The Shared Blackboard.
 *
 * Design rule (doc §2.3): no model ever sees the full conversation history.
 * Every model reads exactly the slice it needs, and the blackboard is the only
 * place those slices come from. This is what keeps token cost bounded as the
 * number of participants grows.
 */
import type { Decision, DiscussionRound, Proposal, Review } from './discussion.js';
import type { ExecutionPlan, ExecutionResult, Verification } from './plan.js';
/** Everything one run knows, accumulated phase by phase. */
export interface Blackboard {
    /** Run identity; also the key the UI polls. */
    runId: string;
    /** The user's request, verbatim and never rewritten. */
    originalRequest: string;
    /** Clarification questions the orchestrator asked, and the user's answers. */
    clarification?: ClarificationRecord;
    /** Proposals, across all rounds. Round membership lives on DiscussionRound. */
    proposals: Proposal[];
    /** Reviews, across all rounds. */
    reviews: Review[];
    /** The most recent decision. Earlier ones are kept in `decisions`. */
    decision?: Decision;
    /** Every decision ever taken on this run, oldest first (re-loops append). */
    decisions: Decision[];
    /** The plan currently under execution. */
    plan?: ExecutionPlan;
    /** Every plan produced, including superseded ones. */
    plans: ExecutionPlan[];
    /** The latest execution result. */
    execution?: ExecutionResult;
    /** Every execution result, including retried ones. */
    executions: ExecutionResult[];
    /** The latest verification. */
    verification?: Verification;
    /** Round ledger. */
    rounds: DiscussionRound[];
    /** The lead model's final answer to the user. */
    finalAnswer?: string;
}
/** A clarification exchange. */
export interface ClarificationRecord {
    /** What the orchestrator asked. */
    questions: string[];
    /** What the user answered. Absent while the run is parked awaiting input. */
    answer?: string;
    /** Whether the run is currently parked on this question. */
    pending: boolean;
}
/**
 * A read-only projection of the blackboard handed to one model.
 *
 * The discussion engine builds these per participant, so "each model only
 * reads what it needs" is a property of the type rather than a convention.
 */
export interface BlackboardSlice {
    /** The original request. Present in every slice. */
    originalRequest: string;
    clarification?: string;
    /** Proposals this consumer is allowed to see. */
    proposals?: Proposal[];
    /** Reviews this consumer is allowed to see. */
    reviews?: Review[];
    decision?: Decision;
    plan?: ExecutionPlan;
    execution?: ExecutionResult;
    verification?: Verification;
}
/** A full, deep-frozen snapshot of a blackboard, as served to the UI. */
export interface BlackboardSnapshot extends Blackboard {
    /** Monotonic revision; the UI uses it to skip no-op renders. */
    revision: number;
}
//# sourceMappingURL=blackboard.d.ts.map