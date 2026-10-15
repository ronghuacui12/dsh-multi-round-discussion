/**
 * Roster assembly.
 *
 * Turns "run the deep preset" into concrete profiles, from whatever the
 * registry actually holds. Two rules matter here:
 *
 *   - **Roles are filled from role bindings, not from vendor names.** Three
 *     profiles pointing at the same provider+model with different system
 *     prompts is a perfectly good roster; so is three different vendors.
 *   - **A missing role fails the run at start, loudly.** Discovering that no
 *     executor was configured after a ten-minute discussion has spent the
 *     budget is the expensive version of this error.
 */
import type { ModelProfile, ModelRole } from '../types/model-profile.js';
import type { PresetDefinition, Roster } from '../types/run.js';
/**
 * The profile lookups roster assembly actually needs.
 *
 * Narrowed deliberately: `ModelRegistry` satisfies it structurally, but a test
 * (or a future profile source) can too, without dragging in the LLM seam.
 */
export interface ProfileSource {
    getProfile(id: string): ModelProfile | undefined;
    getProfilesByRole(role: ModelRole): ModelProfile[];
}
/** Raised when the configured profiles cannot fill the requested roster. */
export declare class RosterError extends Error {
    constructor(message: string);
}
/** Explicit profile choices, which take precedence over role lookup. */
export interface RosterOverrides {
    lead?: string;
    proposers?: string[];
    reviewers?: string[];
    executor?: string;
    verifier?: string;
}
/**
 * Build the roster for one run.
 *
 * @param registry - the profile registry.
 * @param preset - shape of the roster.
 * @param overrides - explicit profile ids from the configuration panel.
 */
export declare function buildRoster(registry: ProfileSource, preset: PresetDefinition, overrides?: RosterOverrides): Roster;
/** Summarise a roster for the log line and the UI. */
export declare function describeRoster(roster: Roster): string;
//# sourceMappingURL=roster.d.ts.map