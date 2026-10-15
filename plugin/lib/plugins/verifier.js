import { VERIFY_SYSTEM, buildVerifyPrompt } from "../core/prompts.js";
import { mergeSystem } from "./discussion-engine.js";
import { StructuredOutputError, optionalStringArray, parseStructured } from "../utils/json.js";
/** The record produced when no verifier profile was seated. */
export function skippedVerification(planId) {
    return {
        planId,
        passed: true,
        issues: [],
        suggestions: [],
        recommendedAction: 'accept',
        skipped: true,
    };
}
/** The record produced when the verifier itself failed to answer. */
export function unverified(planId, reason) {
    return {
        planId,
        passed: true,
        issues: [`验证模型未能给出结论：${reason}`],
        suggestions: [],
        // Fail open — an unavailable verifier is not evidence the work is wrong.
        recommendedAction: 'accept',
        skipped: true,
    };
}
export class Verifier {
    registry;
    onUsage;
    constructor(registry, onUsage = () => { }) {
        this.registry = registry;
        this.onUsage = onUsage;
    }
    /**
     * Check one execution result.
     *
     * @param plan - the plan that was executed.
     * @param execution - what happened.
     * @param profile - the verifier profile, or `undefined` to skip.
     * @param signal - run cancellation.
     */
    async verify(plan, execution, profile, signal) {
        if (!profile)
            return skippedVerification(plan.id);
        const response = await this.registry.call(profile.id, {
            prompt: buildVerifyPrompt(plan, execution),
            system: mergeSystem(profile.systemPrompt, VERIFY_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (!response.ok) {
            return unverified(plan.id, response.error ?? response.errorCode ?? 'unknown error');
        }
        try {
            return parseStructured(response.text, (raw) => {
                if (typeof raw !== 'object' || raw === null) {
                    throw new StructuredOutputError('Expected a JSON object for the verification.', response.text);
                }
                const o = raw;
                const action = o.recommendedAction === 'accept' || o.recommendedAction === 'repair' || o.recommendedAction === 'replan'
                    ? o.recommendedAction
                    : undefined;
                const issues = optionalStringArray(o.issues);
                const passed = o.passed === true;
                return {
                    planId: plan.id,
                    verifierProfileId: profile.id,
                    passed,
                    issues,
                    suggestions: optionalStringArray(o.suggestions),
                    // Default the action from `passed` rather than trusting a
                    // contradictory pair like { passed: false, action: 'accept' }.
                    recommendedAction: action ?? (passed ? 'accept' : 'replan'),
                };
            });
        }
        catch (cause) {
            return unverified(plan.id, cause instanceof Error ? cause.message : String(cause));
        }
    }
}
//# sourceMappingURL=verifier.js.map