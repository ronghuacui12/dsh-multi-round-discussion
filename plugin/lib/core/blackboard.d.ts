/**
 * The Shared Blackboard (doc §2.3, §6).
 *
 * One mutable accumulator per run, plus:
 *   - a monotonic `revision` so subscribers can skip no-op renders;
 *   - `sliceFor(role)` / `anonymizeProposals()`, which are what actually keep
 *     token cost bounded as participants are added. "Each model reads only
 *     what it needs" is enforced by which method the caller is given, not by
 *     trusting a prompt.
 *
 * Every mutation bump is followed by deep-copied snapshots, so a reader can
 * never observe a half-applied phase: build the whole artefact, then commit it.
 */
import type { Decision, DiscussionRound, Proposal, Review, AnonymizedProposal } from '../types/discussion.js';
import type { ExecutionPlan, ExecutionResult, Verification } from '../types/plan.js';
import type { Blackboard, BlackboardSlice, BlackboardSnapshot } from '../types/blackboard.js';
import type { ModelRole } from '../types/model-profile.js';
/** What one consumer is allowed to read. */
export interface SliceOptions {
    /** Include the decision record. */
    includeDecision?: boolean;
    /** Include the current plan. */
    includePlan?: boolean;
    /** Include the latest execution result. */
    includeExecution?: boolean;
    /** Include the latest verification. */
    includeVerification?: boolean;
    /** Include proposals. Defaults to false — the safest setting. */
    includeProposals?: boolean;
    /** Include reviews. Defaults to false. */
    includeReviews?: boolean;
}
/** Anonymisation result: the redacted view plus the id mapping back to reality. */
export interface AnonymizationResult {
    anonymous: AnonymizedProposal[];
    /** anonId -> real proposal id. */
    mapping: Map<string, string>;
}
export declare class SharedBlackboard {
    private state;
    private revision;
    private readonly listeners;
    /**
     * Stable anonId assignment. Kept across calls so a reviewer that sees "P2"
     * twice sees the same proposal twice — otherwise anonymity would also make
     * the review incoherent.
     *
     * Two maps, because the two directions serve different needs:
     * `proposalToAnon` keeps labels stable across calls, `anonToProposal`
     * resolves a reviewer's `P2` back to the real record.
     */
    private readonly proposalToAnon;
    private readonly anonToProposal;
    constructor(runId: string, originalRequest: string);
    get runId(): string;
    get currentRevision(): number;
    /** Live read-only view. Callers must not retain it across awaits. */
    read(): Readonly<Blackboard>;
    /** Deep, detached copy — safe to hand to a transport or a long-lived UI store. */
    snapshot(): BlackboardSnapshot;
    /** Subscribe to mutations. Returns the unsubscribe function. */
    subscribe(listener: (snapshot: BlackboardSnapshot) => void): () => void;
    /** Bump the revision and notify. Called once per committed mutation. */
    private commit;
    /** Record the clarification questions the lead model asked. */
    askClarification(questions: string[]): void;
    /** Record the user's answer and unpark the run. */
    answerClarification(answer: string): void;
    /** Append a proposal. */
    addProposal(proposal: Proposal): void;
    /** Append several proposals as one committed batch (parallel phase). */
    addProposals(proposals: Proposal[]): void;
    /** Append a review. */
    addReview(review: Review): void;
    /** Append several reviews as one committed batch. */
    addReviews(reviews: Review[]): void;
    /** Record a decision; also appends to the decision history. */
    setDecision(decision: Decision): void;
    /** Record the plan under execution; also appends to plan history. */
    setPlan(plan: ExecutionPlan): void;
    /** Record an execution result; also appends to execution history. */
    setExecution(result: ExecutionResult): void;
    /** Record a verification verdict. */
    setVerification(verification: Verification): void;
    /** Append a discussion round to the ledger. */
    addRound(round: DiscussionRound): void;
    /** Close the run with the lead model's answer. */
    setFinalAnswer(answer: string): void;
    /** Look up a proposal by id. */
    findProposal(id: string): Proposal | undefined;
    /** Look up a proposal by its anonymous id. */
    findProposalByAnonId(anonId: string): Proposal | undefined;
    /** Proposals produced in one round, in production order. */
    proposalsForRound(round: number): Proposal[];
    /** Reviews produced in one round. */
    reviewsForRound(round: number): Review[];
    /**
     * Build the redacted view reviewers are given.
     *
     * Takes the proposals explicitly rather than reading them by round number.
     * Round membership only lands in the ledger once a decision closes the round,
     * which happens *after* review — so a round-keyed lookup would find nothing.
     *
     * Ids are assigned by position and cached, so the same proposal keeps the
     * same `anonId` for the life of the run. Reviews therefore compose across
     * rounds without a reviewer ever learning which vendor wrote what.
     */
    anonymizeProposals(proposals: readonly Proposal[]): AnonymizationResult;
    /**
     * The slice one role may read.
     *
     * The defaults are the point: a proposer gets the request and nothing else,
     * which is how round-one independence is guaranteed structurally rather than
     * by asking models not to peek.
     */
    sliceFor(role: ModelRole, options?: SliceOptions): BlackboardSlice;
}
//# sourceMappingURL=blackboard.d.ts.map