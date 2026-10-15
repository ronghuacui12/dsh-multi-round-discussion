/**
 * Discussion artefacts: proposal, review, decision.
 *
 * Every artefact is a *structured* value rather than free prose. That is what
 * keeps the decision maker from being swayed by whichever model writes the
 * longest answer, and it is what lets the UI render a comparison instead of a
 * transcript.
 */
/** Why a proposal says it can be believed. */
export interface Proposal {
    /** Identity of this proposal (assigned by the discussion engine). */
    id: string;
    /** Profile that produced it. Hidden during anonymous review. */
    profileId: string;
    /** One-paragraph statement of the approach. */
    summary: string;
    /** The concrete approach, as free-form markdown. */
    plan: string;
    /** Why this approach is expected to work. */
    reasons: string[];
    /** What can go wrong. Required: a proposal with no risks is not trusted. */
    risks: string[];
    /** External things this approach needs before it can proceed. */
    dependencies: string[];
    /** Self-assessed confidence, 0..1. */
    confidence: number;
    /** Tokens and time spent producing it, for the cost panel. */
    usage?: {
        inputTokens: number;
        outputTokens: number;
        durationMs: number;
        costUsd: number;
    };
}
/**
 * An anonymised view of a proposal, as handed to a reviewer.
 *
 * `profileId` is deliberately absent: reviewers see `anonId` only, so review
 * cannot turn into a popularity contest between vendors.
 */
export interface AnonymizedProposal {
    anonId: string;
    summary: string;
    plan: string;
    reasons: string[];
    risks: string[];
    dependencies: string[];
    confidence: number;
}
/** One reviewer's assessment of one proposal. */
export interface Review {
    id: string;
    /** Reviewer profile. */
    reviewerProfileId: string;
    /** `anonId` of the reviewed proposal (see AnonymizedProposal). */
    targetAnonId: string;
    /** Resolved proposal id, mapped back after review. */
    targetProposalId: string;
    /** What the reviewer thinks holds up. */
    pros: string[];
    /** What the reviewer thinks does not. */
    cons: string[];
    /** Concrete changes that would make it acceptable. */
    suggestions: string[];
    /** 0..1, the reviewer's own confidence in this assessment. */
    confidence: number;
    /** Which review round produced it. */
    round: number;
}
/** The lead model's binding decision over the proposal set. */
export interface Decision {
    /** Decision identity, so the round ledger can reference it. */
    id: string;
    /** Profile that decided. `'user'` when the user force-adopted a proposal. */
    decisionMakerProfileId: string;
    /** Proposals adopted (possibly more than one, when fusing). */
    chosenProposalIds: string[];
    /** Proposals rejected. Every non-chosen proposal must appear here. */
    rejectedProposalIds: string[];
    /** Why, referencing review findings where possible. */
    rationale: string;
    /** The direction to execute, in the lead model's own words. */
    finalDirection: string;
    /** Round counter this decision closes; a re-loop increments it. */
    round: number;
    /**
     * True when the decision maker could not distinguish the options and is
     * forwarding the choice to the user rather than inventing a preference.
     */
    needsUserInput?: boolean;
}
/** One entry in the run's audit trail. */
export interface DiscussionRound {
    round: number;
    /** Proposal ids produced in this round. */
    proposalIds: string[];
    /** Review ids produced in this round. */
    reviewIds: string[];
    /** The decision that closed the round, when it closed one. */
    decisionId?: string;
    /** Why the round ended without a decision, when it did. */
    closedReason?: 'budget' | 'rounds-exhausted' | 'no-viable-proposal';
}
//# sourceMappingURL=discussion.d.ts.map