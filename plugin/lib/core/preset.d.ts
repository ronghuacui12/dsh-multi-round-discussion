/**
 * Presets (doc §3.2).
 *
 * A preset is the shape of a roster, not a roster: it says how many proposers
 * to seat and whether review/verification run. Which concrete profiles fill
 * those seats is a separate decision, taken at run start from the registry.
 */
import type { PresetDefinition, PresetName } from '../types/run.js';
/** Built-in presets. */
export declare const PRESETS: Record<Exclude<PresetName, 'custom'>, PresetDefinition>;
/** Resolve a preset name to its definition; `custom` returns the balanced shape. */
export declare function resolvePreset(name: PresetName): PresetDefinition;
/** Every preset name, for the settings UI. */
export declare const PRESET_NAMES: readonly PresetName[];
/** Chinese labels for the configuration panel. */
export declare const PRESET_LABELS: Record<PresetName, string>;
/** One-line description of what each preset buys you. */
export declare const PRESET_DESCRIPTIONS: Record<PresetName, string>;
//# sourceMappingURL=preset.d.ts.map