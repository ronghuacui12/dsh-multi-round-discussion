import { useState } from 'react';
import type { ModelProfile, ModelRole } from '../../lib/types/model-profile';
import { MODEL_ART, artOf } from './catalog';
import type { ArtId } from './catalog';
import { ModelArt } from './art';
import { ROLE_TEXT } from './layout';
import { TableDialog } from './dialog';

export interface ProviderEntry { id: string; name?: string; models?: { id: string; name?: string }[] }
export function EditDrawer({ profile, providers, appearance, saving, error, onSave, onClose }: {
  profile: ModelProfile; providers: ProviderEntry[]; appearance?: ArtId; saving: boolean; error: string;
  onSave: (profile: ModelProfile, appearance?: ArtId) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [art, setArt] = useState<ArtId | ''>(appearance || '');
  const models = providers.find((p) => p.id === draft.provider)?.models ?? [];
  const patch = (value: Partial<ModelProfile>) => setDraft((current) => ({ ...current, ...value }));
  const chosen = art || artOf(draft, {});
  return <TableDialog title="模型信息与形象" onClose={onClose}>
    <form className="mmd-table-form" onSubmit={(event) => { event.preventDefault(); onSave(draft, art || undefined); }}>
      <div className="mmd-table-edit-preview"><ModelArt identity={chosen} participant={{ profileId: draft.id, label: draft.label || draft.id, role: draft.role, state: 'idle', phase: 'idle' }} width={105} />
        <div><b>{chosen ? MODEL_ART.find((a) => a.id === chosen)?.name : '自动识别模型'}</b><p>形象独立于职责；换座不换人。</p><small>选择形象不等于接通该模型。</small></div></div>
      <label>显示名<input className="mmd-input" aria-label="显示名" value={draft.label || ''} onChange={(e) => patch({ label: e.target.value })} placeholder={draft.id} maxLength={100} /></label>
      <label>Provider 路由<select required className="mmd-select" aria-label="Provider 路由" value={draft.provider} onChange={(e) => patch({ provider: e.target.value, model: '' })}>
        <option value="">请选择已注册的路由</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
        {draft.provider && !providers.some((p) => p.id === draft.provider) ? <option value={draft.provider}>{draft.provider + '（已配置）'}</option> : null}
      </select></label>
      <label>模型 ID<input required className="mmd-input" aria-label="模型 ID" list="mmd-table-model-options" value={draft.model} onChange={(e) => patch({ model: e.target.value })} placeholder="选择或输入准确的模型 ID" />
        <datalist id="mmd-table-model-options">{models.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}</datalist></label>
      <div className="mmd-table-form-row"><label>职责<select className="mmd-select" aria-label="职责" value={draft.role} onChange={(e) => patch({ role: e.target.value as ModelRole })}>
        {(['decisionMaker', 'proposer', 'reviewer', 'executor', 'verifier'] as const).map((r) => <option key={r} value={r}>{ROLE_TEXT[r]}</option>)}
      </select></label><label>温度<input className="mmd-input" aria-label="温度" type="number" min={0} max={2} step={.1} required value={draft.temperature ?? .4} onChange={(e) => patch({ temperature: Number(e.target.value) })} /></label></div>
      <label>人物形象<select className="mmd-select" aria-label="人物形象" value={art} onChange={(e) => setArt(e.target.value as ArtId | '')}>
        <option value="">自动识别模型</option>{MODEL_ART.map((a) => <option key={a.id} value={a.id}>{a.name + ' · ' + a.hint}</option>)}
      </select></label>
      <label>角色提示词<textarea className="mmd-textarea" aria-label="角色提示词" rows={5} value={draft.systemPrompt || ''} onChange={(e) => patch({ systemPrompt: e.target.value })} /></label>
      <label className="mmd-check"><input type="checkbox" checked={draft.enabled !== false} onChange={(e) => patch({ enabled: e.target.checked })} />启用，参与下次研讨</label>
      {error ? <p className="mmd-bad" role="alert">{error}</p> : null}
      <footer><small>保存后写入当前阵容；模型密钥沿用已注册路由。</small><button type="submit" className="mmd-btn mmd-btn-primary" disabled={saving}>{saving ? '保存中…' : '保存模型'}</button></footer>
    </form>
  </TableDialog>;
}
