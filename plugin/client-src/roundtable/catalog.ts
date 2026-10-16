export const MODEL_ART = [
  { id: 'chatgpt', name: 'ChatGPT', hint: '银白龙娘', match: /chatgpt|openai|\bgpt(?:[-\d\s]|$)|\bo[134](?:[-\s]|$)/i },
  { id: 'claude', name: 'Claude', hint: '橙发花饰', match: /claude|anthropic|opus|sonnet|haiku/i },
  { id: 'gemini', name: 'Gemini', hint: '星光猫娘', match: /gemini|google/i },
  { id: 'grok', name: 'Grok', hint: '金发暗色礼裙', match: /grok|\bxai\b|x\.ai/i },
  { id: 'deepseek', name: 'DeepSeek', hint: '蓝色鲸鱼娘', match: /deepseek|深度求索|鲸鱼/i },
  { id: 'glm', name: 'GLM', hint: '黑白棋盘', match: /\bglm|zhipu|z\.ai|智谱/i },
  { id: 'minimax', name: 'MiniMax', hint: '珊瑚粉贝雷帽', match: /minimax|abab|海螺/i },
  { id: 'kimi', name: 'Kimi', hint: '银发月光女仆', match: /kimi|moonshot|月之暗面/i },
  { id: 'step', name: 'Step', hint: '浅蓝发与方灯', match: /step(?:fun|[-\d\s]|$)|阶跃/i },
  { id: 'mimo', name: 'MiMo', hint: '橙白兔耳科技服', match: /mimo|xiaomi|小米/i },
  { id: 'qwen', name: '千问', hint: '蓝白折扇', match: /qwen|千问|通义|dashscope|bailian|百炼/i },
  { id: 'doubao', name: '豆包', hint: '黑粉包子女仆', match: /doubao|豆包|volcengine|火山|seed[-\d]/i },
] as const;
export type ArtId = typeof MODEL_ART[number]['id'];
export const ART_VERSION = 'layered-20261016-5';
export const artUrl = (id: ArtId | 'longtable' | 'room' | 'wood-short' | 'wood-long' | `seated-${ArtId}`) => '/dsh-mmd/art/' + id + '.webp?v=' + ART_VERSION;
const KEY = 'dsh-mmd.art.assignments.v1';
export function readArtAssignments(): Record<string, ArtId> {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([, id]) => MODEL_ART.some((a) => a.id === id))) as Record<string, ArtId>;
  } catch { return {}; }
}
export function saveArtAssignments(value: Record<string, ArtId>) { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {} }
export function artOf(profile: { profileId?: string; id?: string; model?: string; provider?: string; label?: string }, overrides: Record<string, ArtId>): ArtId | undefined {
  const override = overrides[profile.profileId || profile.id || ''];
  if (override && MODEL_ART.some((a) => a.id === override)) return override;
  // Explicit model identity wins over the provider route (an OpenAI-compatible route may host GLM).
  for (const value of [profile.model, profile.provider, profile.label, profile.profileId || profile.id]) {
    const entry = value && MODEL_ART.find((a) => a.match.test(value));
    if (entry) return entry.id;
  }
  return undefined;
}
