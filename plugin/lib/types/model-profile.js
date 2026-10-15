/**
 * ModelProfile: the "one API key can mint many model instances" abstraction.
 *
 * The four layers the design document asks to keep apart are modelled as four
 * distinct things, and never collapsed into one field:
 *
 *   Provider route  -> `ModelProfile.provider`  (a key registered with ctx.llm)
 *   Model endpoint  -> `ModelProfile.model`     (the wire model id)
 *   Model instance  -> one ModelProfile         (its own temperature / prompt)
 *   Role binding    -> `ModelProfile.role`      (what this instance is FOR)
 *
 * Because an instance is just a profile row, the same `provider` + `model` may
 * appear any number of times with different `temperature` / `systemPrompt` /
 * `role`. That is the whole mechanism behind "one API key, many models".
 */
/** All roles, in the order a run exercises them. */
export const MODEL_ROLES = [
    'proposer',
    'reviewer',
    'decisionMaker',
    'planBuilder',
    'executor',
    'verifier',
];
//# sourceMappingURL=model-profile.js.map