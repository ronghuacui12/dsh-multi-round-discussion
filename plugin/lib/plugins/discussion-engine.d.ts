import type { Logger } from '@deepseek-ai/cordis';
import type { ModelRegistry } from '../services/model-registry.js';
import type { SharedBlackboard } from '../core/blackboard.js';
import type { Proposal, Review } from '../types/discussion.js';
import type { ModelCallUsage, ModelProfile } from '../types/model-profile.js';
import type { ParticipantStatus } from '../types/run.js';
import type { RunNotice } from '../types/run.js';
/** Raised when a round produced nothing usable. */
export declare class EmptyRoundError extends Error {
    readonly round: number;
    readonly failures: string[];
    constructor(round: number, failures: string[]);
}
export interface DiscussionEngineOptions {
    registry: ModelRegistry;
    blackboard: SharedBlackboard;
    logger?: Logger;
    /** Called as a participant's working state changes. */
    onParticipant?: (profileId: string, patch: Partial<ParticipantStatus>) => void;
    /** Called for operator-visible notices. */
    onNotice?: (notice: Omit<RunNotice, 'id' | 'at'>) => void;
    /** Per-call usage sink, scoped to the owning run's budget guard. */
    onUsage?: (usage: ModelCallUsage) => void;
}
export declare class DiscussionEngine {
    private readonly registry;
    private readonly blackboard;
    private readonly logger;
    private readonly onParticipant;
    private readonly onNotice;
    private readonly onUsage;
    constructor(options: DiscussionEngineOptions);
    /**
     * Run one round of parallel proposals.
     *
     * @param round - 1-based round number, used for ids and prompt framing.
     * @param proposers - the seated proposer profiles.
     * @param signal - run cancellation.
     * @returns the proposals that succeeded, in roster order.
     */
    runProposals(round: number, proposers: ModelProfile[], signal: AbortSignal): Promise<Proposal[]>;
    /** Dispatch one proposer and parse its structured reply. */
    private proposeOne;
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
    runReviews(round: number, reviewers: ModelProfile[], proposals: readonly Proposal[], signal: AbortSignal): Promise<Review[]>;
    /** Dispatch one reviewer over the anonymised set. */
    private reviewOne;
}
/** Compose a profile's own prompt with the phase instruction. */
export declare function mergeSystem(profileSystem: string | undefined, phaseSystem: string): string;
//# sourceMappingURL=discussion-engine.d.ts.map