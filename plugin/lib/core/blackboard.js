export class SharedBlackboard {
    state;
    revision = 0;
    listeners = new Set();
    /**
     * Stable anonId assignment. Kept across calls so a reviewer that sees "P2"
     * twice sees the same proposal twice — otherwise anonymity would also make
     * the review incoherent.
     *
     * Two maps, because the two directions serve different needs:
     * `proposalToAnon` keeps labels stable across calls, `anonToProposal`
     * resolves a reviewer's `P2` back to the real record.
     */
    proposalToAnon = new Map();
    anonToProposal = new Map();
    constructor(runId, originalRequest) {
        this.state = {
            runId,
            originalRequest,
            proposals: [],
            reviews: [],
            decisions: [],
            plans: [],
            executions: [],
            rounds: [],
        };
    }
    get runId() {
        return this.state.runId;
    }
    get currentRevision() {
        return this.revision;
    }
    /** Live read-only view. Callers must not retain it across awaits. */
    read() {
        return this.state;
    }
    /** Deep, detached copy — safe to hand to a transport or a long-lived UI store. */
    snapshot() {
        return { ...structuredClone(this.state), revision: this.revision };
    }
    /** Subscribe to mutations. Returns the unsubscribe function. */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /** Bump the revision and notify. Called once per committed mutation. */
    commit() {
        this.revision += 1;
        const snap = this.snapshot();
        for (const listener of this.listeners) {
            try {
                listener(snap);
            }
            catch {
                // A broken observer must not abort the run; the blackboard is the
                // source of truth and the mutation has already landed.
            }
        }
    }
    // ---------------------------------------------------------------- mutations
    /** Record the clarification questions the lead model asked. */
    askClarification(questions) {
        this.state.clarification = { questions, pending: true };
        this.commit();
    }
    /** Record the user's answer and unpark the run. */
    answerClarification(answer) {
        this.state.clarification = {
            questions: this.state.clarification?.questions ?? [],
            answer,
            pending: false,
        };
        this.commit();
    }
    /** Append a proposal. */
    addProposal(proposal) {
        this.state.proposals.push(proposal);
        this.commit();
    }
    /** Append several proposals as one committed batch (parallel phase). */
    addProposals(proposals) {
        if (proposals.length === 0)
            return;
        this.state.proposals.push(...proposals);
        this.commit();
    }
    /** Append a review. */
    addReview(review) {
        this.state.reviews.push(review);
        this.commit();
    }
    /** Append several reviews as one committed batch. */
    addReviews(reviews) {
        if (reviews.length === 0)
            return;
        this.state.reviews.push(...reviews);
        this.commit();
    }
    /** Record a decision; also appends to the decision history. */
    setDecision(decision) {
        this.state.decision = decision;
        this.state.decisions.push(decision);
        this.commit();
    }
    /** Record the plan under execution; also appends to plan history. */
    setPlan(plan) {
        this.state.plan = plan;
        this.state.plans.push(plan);
        this.commit();
    }
    /** Record an execution result; also appends to execution history. */
    setExecution(result) {
        this.state.execution = result;
        this.state.executions.push(result);
        this.commit();
    }
    /** Record a verification verdict. */
    setVerification(verification) {
        this.state.verification = verification;
        this.commit();
    }
    /** Append a discussion round to the ledger. */
    addRound(round) {
        this.state.rounds.push(round);
        this.commit();
    }
    /** Close the run with the lead model's answer. */
    setFinalAnswer(answer) {
        this.state.finalAnswer = answer;
        this.commit();
    }
    // ------------------------------------------------------------------ reading
    /** Look up a proposal by id. */
    findProposal(id) {
        return this.state.proposals.find((p) => p.id === id);
    }
    /** Look up a proposal by its anonymous id. */
    findProposalByAnonId(anonId) {
        const real = this.anonToProposal.get(anonId);
        return real ? this.findProposal(real) : undefined;
    }
    /** Proposals produced in one round, in production order. */
    proposalsForRound(round) {
        const ledger = this.state.rounds.find((r) => r.round === round);
        if (!ledger)
            return [];
        const ids = new Set(ledger.proposalIds);
        return this.state.proposals.filter((p) => ids.has(p.id));
    }
    /** Reviews produced in one round. */
    reviewsForRound(round) {
        const ledger = this.state.rounds.find((r) => r.round === round);
        if (!ledger)
            return [];
        const ids = new Set(ledger.reviewIds);
        return this.state.reviews.filter((r) => ids.has(r.id));
    }
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
    anonymizeProposals(proposals) {
        const mapping = new Map();
        const anonymous = [];
        for (const proposal of proposals) {
            let anonId = this.proposalToAnon.get(proposal.id);
            if (!anonId) {
                anonId = `P${this.proposalToAnon.size + 1}`;
                this.proposalToAnon.set(proposal.id, anonId);
                this.anonToProposal.set(anonId, proposal.id);
            }
            mapping.set(anonId, proposal.id);
            anonymous.push({
                anonId,
                summary: proposal.summary,
                plan: proposal.plan,
                reasons: proposal.reasons,
                risks: proposal.risks,
                dependencies: proposal.dependencies,
                confidence: proposal.confidence,
            });
        }
        return { anonymous, mapping };
    }
    /**
     * The slice one role may read.
     *
     * The defaults are the point: a proposer gets the request and nothing else,
     * which is how round-one independence is guaranteed structurally rather than
     * by asking models not to peek.
     */
    sliceFor(role, options = {}) {
        const clarification = this.state.clarification?.answer;
        const base = { originalRequest: this.state.originalRequest };
        if (clarification)
            base.clarification = clarification;
        switch (role) {
            case 'proposer':
                // Independence rule (doc §2.6): a proposer never sees sibling proposals.
                return base;
            case 'reviewer':
                return {
                    ...base,
                    proposals: options.includeProposals === false ? undefined : this.state.proposals,
                };
            case 'decisionMaker':
                return {
                    ...base,
                    proposals: this.state.proposals,
                    reviews: this.state.reviews,
                    execution: options.includeExecution ? this.state.execution : undefined,
                    verification: options.includeVerification ? this.state.verification : undefined,
                    decision: options.includeDecision ? this.state.decision : undefined,
                };
            case 'planBuilder':
                return {
                    ...base,
                    decision: this.state.decision,
                    proposals: this.state.decision
                        ? this.state.proposals.filter((p) => this.state.decision.chosenProposalIds.includes(p.id))
                        : [],
                };
            case 'executor':
                // The executor reads the plan and nothing else — no request, no debate.
                return { originalRequest: '', plan: this.state.plan };
            case 'verifier':
                return {
                    ...base,
                    plan: this.state.plan,
                    execution: this.state.execution,
                };
            default: {
                const exhaustive = role;
                throw new Error(`Unhandled role in sliceFor: ${String(exhaustive)}`);
            }
        }
    }
}
//# sourceMappingURL=blackboard.js.map