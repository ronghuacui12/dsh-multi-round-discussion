/**
 * Every prompt the orchestration sends, in one file.
 *
 * Kept together on purpose: these strings are the actual policy of the system
 * (what a proposer may see, what a decision maker must record, which fields are
 * mandatory), so they need to be reviewable side by side rather than scattered
 * across phase implementations.
 *
 * Conventions used throughout:
 *   - Replies are JSON-only. Anything else is a protocol violation the caller
 *     reports, rather than prose we try to guess at.
 *   - The model is told the language to answer in, and it is the user's.
 *   - Mandatory-risk fields exist so a proposal with no acknowledged downside
 *     cannot score well; see PROPOSAL_SYSTEM.
 */
import type { AnonymizedProposal, Decision, Proposal } from '../types/discussion.js';
import type { ExecutionPlan, ExecutionResult } from '../types/plan.js';
import type { BlackboardSlice } from '../types/blackboard.js';
/** Ask the lead model whether the request is answerable. */
export declare const CLARIFY_SYSTEM: string;
/** Build the clarification user turn. */
export declare function buildClarifyPrompt(originalRequest: string, clarification?: string): string;
/**
 * Proposer system prompt.
 *
 * The load-bearing line is the one forbidding speculation about other
 * participants: round-one independence is enforced by giving each proposer
 * nothing to compare against, and by telling it explicitly not to guess.
 */
export declare const PROPOSAL_SYSTEM: string;
/**
 * Build a proposer's user turn from a slice.
 *
 * Note what is absent: `slice.proposals` is never consulted here. A proposer
 * physically cannot see sibling work.
 */
export declare function buildProposalPrompt(slice: BlackboardSlice, round: number): string;
/** Reviewer system prompt. Anonymity is stated so reviewers do not try to attribute. */
export declare const REVIEW_SYSTEM: string;
/** Render anonymised proposals for a reviewer. */
export declare function buildReviewPrompt(slice: BlackboardSlice, anonymous: readonly AnonymizedProposal[]): string;
/**
 * Decision-maker system prompt.
 *
 * Two constraints carry the design's intent: the decision maker must account
 * for every proposal (no silent ignoring), and it is allowed — and encouraged
 * — to fuse rather than pick, because the useful outcome of a debate is
 * usually a synthesis rather than a winner.
 */
export declare const DECISION_SYSTEM: string;
/** Build the decision-maker user turn: proposals plus reviews in full. */
export declare function buildDecisionPrompt(slice: BlackboardSlice): string;
/** Plan-builder system prompt. The schema mirrors types/plan.ts exactly. */
export declare const PLAN_SYSTEM: string;
/** Build the plan-builder user turn from the decision. */
export declare function buildPlanPrompt(originalRequest: string, decision: Decision, adopted: readonly Proposal[]): string;
/** Verifier system prompt. */
export declare const VERIFY_SYSTEM: string;
/** Build the verifier user turn. */
export declare function buildVerifyPrompt(plan: ExecutionPlan, execution: ExecutionResult): string;
/** Final-answer system prompt — the one place the lead model talks to the user. */
export declare const FINAL_ANSWER_SYSTEM: string;
/** Build the final-answer user turn. */
export declare function buildFinalAnswerPrompt(slice: BlackboardSlice): string;
/** Truncate long text with an ellipsis, keeping prompts bounded. */
export declare function truncate(text: string, max: number): string;
/**
 * Executor system prompt (doc §2.5).
 *
 * The prohibition on re-planning is stated outright because it is the single
 * most important behavioural constraint in the whole system: an executor that
 * improvises turns a reviewed plan into unreviewed work. The allow-list is
 * injected so the model knows its actual tool surface instead of discovering
 * it by being refused.
 */
export declare function buildExecutorSystem(permittedTools: readonly string[], maxSteps: number): string;
/** Render the plan the executor must follow. */
export declare function buildExecutionPrompt(plan: ExecutionPlan): string;
/** System prompt for the executor's closing structured report. */
export declare const EXECUTION_REPORT_SYSTEM: string;
/** Build the closing-report user turn. */
export declare function buildExecutionReportPrompt(plan: ExecutionPlan, transcript: string): string;
//# sourceMappingURL=prompts.d.ts.map