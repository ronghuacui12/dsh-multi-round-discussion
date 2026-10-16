/** Unsigned FNV-1a: identity never changes when a model changes role. */
export function lookOf(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619) >>> 0;
  return {
    skin: ['#ffd9b3', '#f7c9a3', '#d9a17e'][hash % 3],
    hair: ['#292c35', '#4b3621', '#6b4f2a', '#1f2937', '#7355a7'][(hash >>> 3) % 5],
    hairStyle: (hash >>> 6) % 6,
    bodyWidth: [38, 42, 34][(hash >>> 12) % 3],
  };
}
