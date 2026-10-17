import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { Avatar } from './avatar';

/** Role groups, in the order the panel renders them. */
const GROUPS = [
  { role: 'decisionMaker', title: '主导模型', icon: '★', color: '#16a34a', hint: '读完全部提案与互评，拍板选出最终方向，并写出最终答复。', min: 1, max: 1, seat: 'lead' },
  { role: 'proposer', title: '讨论者', icon: '💡', color: '#2563eb', hint: '各自独立提出方案，然后互相看到对方（匿名）的方案并给出自己的理解与评价。', min: 1, max: 5, seat: 'proposer' },
  { role: 'reviewer', title: '专职评审（可选）', icon: '🔍', color: '#7c3aed', hint: '不提案，只对匿名方案做交叉评审。讨论者已经在互评，这一组可以留空。', min: 0, max: 3, seat: 'reviewer' },
  { role: 'executor', title: '执行模型', icon: '⚙', color: '#d97706', hint: '只按批准后的计划动手，不重新规划。', min: 1, max: 1, seat: 'executor' },
  { role: 'verifier', title: '验证模型（可选）', icon: '✓', color: '#0891b2', hint: '执行后按验收标准检查结果。', min: 0, max: 2, seat: 'verifier' },
];

/** Tools that only ever read; everything else can change something. */
const READ_ONLY = new Set([
  'read', 'glob', 'grep', 'read_image', 'list_dir', 'skill', 'load_workspace_dependencies',
  'web_search', 'web_fetch', 'job_list', 'job_output', 'list_agents', 'get_goal',
  'team_task_list', 'team_task_get', 'wait_agent', 'present', 'multi_model_discuss',
]);

/** How the tool catalog is grouped in the panel, in render order. */
const TOOL_CATS: { key: string; title: string; match: (name: string) => boolean }[] = [
  { key: 'fs', title: '文件', match: (n) => ['read', 'write', 'edit', 'read_image', 'glob', 'grep', 'list_dir', 'notebook_edit'].includes(n) },
  { key: 'shell', title: '终端 / 系统', match: (n) => ['pwsh', 'bash', 'run_code', 'kill_shell'].includes(n) },
  { key: 'task', title: '任务 / 后台', match: (n) => ['todo_write', 'job_list', 'job_output', 'job_kill', 'create_goal', 'get_goal', 'update_goal', 'exit_plan_mode'].includes(n) },
  { key: 'web', title: '网络', match: (n) => ['web_search', 'web_fetch'].includes(n) },
  { key: 'team', title: '协作 / 子代理', match: (n) => /^(spawn_teammate|send_message|wait_agent|list_agents|interrupt_agent|team_task_|subagent|workflow)/.test(n) },
  { key: 'mcp', title: 'MCP（外部服务器）', match: (n) => n.startsWith('mcp__') },
  { key: 'other', title: '其他', match: () => true },
];

/** A quick whitelist the operator can start from. */
const TOOL_PRESETS: { key: string; label: string; hint: string; pick: (tools: string[]) => string[] }[] = [
  { key: 'ro', label: '只读', hint: '只能看，不能改', pick: (tools) => tools.filter((t) => READ_ONLY.has(t)) },
  { key: 'rw', label: '常用读写', hint: '读 + 写文件 + 终端', pick: (tools) => tools.filter((t) => READ_ONLY.has(t) || ['write', 'edit', 'pwsh', 'todo_write', 'present'].includes(t)) },
  { key: 'all', label: '全部（含以后新增）', hint: '白名单写 *：现在和以后新增的工具（含新 MCP）都自动允许', pick: () => ['*'] },
  { key: 'listed', label: '只选目录里的', hint: '把当前目录里的工具逐个勾上，不含以后新增的', pick: (tools) => [...tools] },
  { key: 'none', label: '清空', hint: '执行模型不碰任何工具', pick: () => [] },
];

interface Seat {
  key: string;
  role: string;
  provider: string;
  model: string;
  label: string;
  temperature: number;
  systemPrompt: string;
  enabled: boolean;
}

/** Turn the served profile list into the panel's editable seats. */
function toSeats(profiles: any[]): Seat[] {
  return (profiles ?? []).map((p: any) => ({
    key: String(p.id),
    role: String(p.role),
    provider: String(p.provider ?? ''),
    model: String(p.model ?? ''),
    label: String(p.label ?? p.id),
    temperature: typeof p.temperature === 'number' ? p.temperature : 0.4,
    systemPrompt: String(p.systemPrompt ?? ''),
    enabled: p.enabled !== false,
  }));
}

/** Next free seat key for a group, so avatars stay attached to a stable id. */
function nextKey(seats: Seat[], prefix: string): string {
  let n = 1;
  const used = new Set(seats.map((s) => s.key));
  while (used.has(prefix + '-' + n)) n++;
  return prefix + '-' + n;
}

export function SettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [preset, setPreset] = useState('balanced');
  const [peerReview, setPeerReview] = useState(true);
  const [mode, setMode] = useState('confirm');
  const [permissions, setPermissions] = useState('full');
  const [toolConfirmation, setToolConfirmation] = useState(false);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [maxSteps, setMaxSteps] = useState(12);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [mmdHome, setMmdHome] = useState('');
  const [dirty, setDirty] = useState(false);
  const [toolQuery, setToolQuery] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pendingSeat = useRef<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.settings();
      setSeats(toSeats(data.profiles));
      setProviders(data.providers ?? []);
      setTools(data.tools ?? []);
      setPreset(data.preset ?? 'balanced');
      setPeerReview(data.peerReview !== false);
      setMode(data.execution?.mode ?? 'confirm');
      setPermissions(data.execution?.permissions ?? 'full');
      setToolConfirmation(data.execution?.toolConfirmation === true);
      setAllowedTools(data.execution?.allowedTools ?? []);
      setMaxSteps(data.execution?.maxSteps ?? 12);
      setAvatars(data.avatars ?? {});
      setMmdHome(data.mmdHome ?? '');
      setDirty(false);
    } catch (cause: any) {
      setError(String(cause?.message ?? cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const modelsOf = useCallback(
    (providerId: string) => providers.find((p) => p.id === providerId)?.models ?? [],
    [providers],
  );

  const patchSeat = (key: string, patch: Partial<Seat>) => {
    setSeats((current) => current.map((seat) => (seat.key === key ? { ...seat, ...patch } : seat)));
    setStatus('');
    setDirty(true);
  };

  const addSeat = (role: string, prefix: string) => {
    setSeats((current) => [
      ...current,
      {
        key: nextKey(current, prefix),
        role,
        provider: providers[0]?.id ?? '',
        model: providers[0]?.models?.[0]?.id ?? '',
        label: '',
        temperature: 0.4,
        systemPrompt: '',
        enabled: true,
      },
    ]);
    setStatus('');
    setDirty(true);
  };

  const removeSeat = (key: string) => {
    setSeats((current) => current.filter((seat) => seat.key !== key));
    setStatus('');
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const profiles = seats
        .filter((seat) => seat.provider && seat.model)
        .map((seat) => ({
          id: seat.key,
          role: seat.role,
          provider: seat.provider,
          model: seat.model,
          label: seat.label || undefined,
          temperature: seat.temperature,
          systemPrompt: seat.systemPrompt || undefined,
          enabled: seat.enabled,
        }));
      const result = await api.saveSettings({
        profiles,
        preset,
        peerReview,
        execution: { mode, permissions, toolConfirmation, allowedTools, maxSteps },
      });
      setSeats(toSeats(result.profiles));
      setAvatars(result.avatars ?? {});
      setDirty(false);
      const warnings: string[] = result.warnings ?? [];
      setStatus(warnings.length > 0 ? '已保存（' + warnings.join('；') + '）' : '已保存，下一次研讨立即生效。');
    } catch (cause: any) {
      setError(String(cause?.message ?? cause));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (key: string, file: File) => {
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('读取图片失败。'));
        reader.readAsDataURL(file);
      });
      const result = await api.uploadAvatar(key, dataUrl);
      setAvatars(result.avatars ?? {});
      setStatus('头像已更新。');
    } catch (cause: any) {
      setError(String(cause?.message ?? cause));
    }
  };

  const applyToolPreset = (pick: (list: string[]) => string[]) => {
    setAllowedTools(pick(tools.length > 0 ? tools : FALLBACK_TOOLS));
    setStatus('');
    setDirty(true);
  };

  const toggleTool = (name: string, on: boolean) => {
    setAllowedTools((current) => (on ? [...new Set([...current, name])] : current.filter((n) => n !== name)));
    setStatus('');
    setDirty(true);
  };

  const grouped = useMemo(
    () => GROUPS.map((group) => ({ group, seats: seats.filter((seat) => seat.role === group.role) })),
    [seats],
  );

  /** The catalog split into render categories, filtered by the search box. */
  const toolCats = useMemo(() => {
    const catalog = tools.length > 0 ? tools : FALLBACK_TOOLS;
    const query = toolQuery.trim().toLowerCase();
    const filtered = query ? catalog.filter((name) => name.toLowerCase().includes(query)) : catalog;
    const claimed = new Set<string>();
    const out: { key: string; title: string; names: string[] }[] = [];
    for (const cat of TOOL_CATS) {
      const names = cat.key === 'other'
        ? filtered.filter((name) => !claimed.has(name))
        : filtered.filter((name) => !claimed.has(name) && cat.match(name));
      for (const name of names) claimed.add(name);
      if (names.length > 0) out.push({ key: cat.key, title: cat.title, names });
    }
    return out;
  }, [tools, toolQuery]);

  const missingRoles = useMemo(() => {
    const required: [string, string][] = [['decisionMaker', '主导模型'], ['proposer', '讨论者'], ['executor', '执行模型']];
    return required.filter(([role]) => !seats.some((seat) => seat.role === role && seat.enabled && seat.provider && seat.model)).map(([, label]) => label);
  }, [seats]);

  const customTools = allowedTools.filter((name) => name !== '*' && !(tools.length > 0 ? tools : FALLBACK_TOOLS).includes(name));

  if (loading) return <div className="mmd-set"><p className="mmd-hint">正在读取当前配置…</p></div>;

  return (
    <div className="mmd-set">
      <div className="mmd-set-head">
        <div style={{ flex: '1 1 420px' }}>
          <h3>研讨模式</h3>
          <p className="mmd-hint">
            每个座位选一个已经配好的模型（provider 路由 + 模型 id），不需要再填 API Key——密钥由 DSH 的凭证层按请求解析。留空的座位不参与研讨。
          </p>
          {mmdHome ? <p className="mmd-hint">配置保存到 <code>{mmdHome + '/roster.json'}</code>，同时立即对运行中的研讨生效。</p> : null}
        </div>
        <div style={{ minWidth: 190 }}>
          <div className="mmd-field">
            <span>研讨深度</span>
            <select className="mmd-select" value={preset} onChange={(event) => { setPreset(event.target.value); setDirty(true); }}>
              <option value="fast">快速 · 1 提案者 · 1 轮</option>
              <option value="balanced">平衡 · 3 提案者 · 2 轮</option>
              <option value="deep">深度 · 5 提案者 · 3 轮 + 验证</option>
              <option value="custom">自定义 · 完全按上面的座位</option>
            </select>
          </div>
          <label className="mmd-check" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={peerReview} onChange={(event) => { setPeerReview(event.target.checked); setDirty(true); }} />
            讨论者互相评议
          </label>
        </div>
      </div>

      {error ? <div className="mmd-alert is-bad"><span>✕</span><span>{error}</span></div> : null}
      {missingRoles.length > 0 ? (
        <div className="mmd-alert is-warn"><span>!</span><span>{'还缺必需角色：' + missingRoles.join('、') + '。补齐之前无法发起研讨。'}</span></div>
      ) : null}

      {grouped.map(({ group, seats: groupSeats }) => (
        <section className="mmd-group" key={group.role}>
          <div className="mmd-group-head">
            <h4>
              <span className="mmd-role-badge" style={{ background: group.color }}>{group.icon}</span>
              {group.title}
            </h4>
            <span className="mmd-count">{groupSeats.length + '/' + group.max}</span>
            <span className="mmd-spacer" />
            {groupSeats.length < group.max ? (
              <button type="button" className="mmd-btn mmd-btn-sm" onClick={() => addSeat(group.role, group.seat)}>+ 添加</button>
            ) : null}
          </div>
          <p className="mmd-hint">{group.hint}</p>
          {groupSeats.length === 0 ? <p className="mmd-hint" style={{ marginTop: 8 }}>（暂无座位，本组不参与）</p> : null}
          {groupSeats.map((seat) => (
            <div className={'mmd-seat' + (seat.enabled ? '' : ' is-off')} key={seat.key}>
              <div
                className="mmd-seat-av"
                title="点击上传头像图片"
                onClick={() => { pendingSeat.current = seat.key; fileRef.current?.click(); }}
              >
                <Avatar seatKey={seat.key} label={seat.label || seat.key} size={48} version={avatars[seat.key]} />
              </div>
              <div className="mmd-seat-body">
                <div className="mmd-seat-line">
                  <div className="mmd-field" style={{ flex: '1 1 150px' }}>
                    <span>显示名</span>
                    <input
                      className="mmd-input"
                      value={seat.label}
                      placeholder={seat.key}
                      onChange={(event) => patchSeat(seat.key, { label: event.target.value })}
                    />
                  </div>
                  <div className="mmd-field">
                    <span>Provider 路由</span>
                    <select
                      className="mmd-select"
                      value={seat.provider}
                      onChange={(event) => {
                        const provider = event.target.value;
                        patchSeat(seat.key, { provider, model: modelsOf(provider)[0]?.id ?? '' });
                      }}
                    >
                      <option value="">（未选择）</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mmd-field">
                    <span>模型</span>
                    <select
                      className="mmd-select"
                      value={seat.model}
                      onChange={(event) => patchSeat(seat.key, { model: event.target.value })}
                    >
                      <option value="">（未选择）</option>
                      {modelsOf(seat.provider).map((model: any) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                      {seat.model && !modelsOf(seat.provider).some((m: any) => m.id === seat.model) ? (
                        <option value={seat.model}>{seat.model + '（已配置，未在目录中）'}</option>
                      ) : null}
                    </select>
                  </div>
                  <div className="mmd-field" style={{ maxWidth: 104, flex: '0 0 104px' }}>
                    <span>温度</span>
                    <input
                      className="mmd-input"
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={seat.temperature}
                      onChange={(event) => patchSeat(seat.key, { temperature: Number(event.target.value) })}
                    />
                  </div>
                  <label className="mmd-check" style={{ paddingBottom: 7 }}>
                    <input type="checkbox" checked={seat.enabled} onChange={(event) => patchSeat(seat.key, { enabled: event.target.checked })} />
                    启用
                  </label>
                  {group.max > group.min ? (
                    <button type="button" className="mmd-btn mmd-btn-sm mmd-btn-danger" style={{ marginBottom: 4 }} onClick={() => removeSeat(seat.key)}>
                      移除
                    </button>
                  ) : null}
                </div>
                <div className="mmd-field">
                  <span>角色提示词（同款模型靠它 + 温度分裂成不同角色，可留空）</span>
                  <textarea
                    className="mmd-textarea"
                    value={seat.systemPrompt}
                    placeholder="例如：你偏好激进、直接的落地路径。"
                    onChange={(event) => patchSeat(seat.key, { systemPrompt: event.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </section>
      ))}

      <section className="mmd-group">
        <div className="mmd-group-head">
          <h4><span className="mmd-role-badge" style={{ background: '#d97706' }}>⚙</span>执行方式</h4>
          <span className="mmd-spacer" />
          <span className="mmd-count">{'已选 ' + allowedTools.length + ' 个工具'}</span>
        </div>
        <div className="mmd-mode-cards">
          <div className={'mmd-mode-card' + (mode === 'confirm' ? ' is-on' : '')} onClick={() => { setMode('confirm'); setDirty(true); }}>
            <input type="radio" name="mmd-mode" checked={mode === 'confirm'} onChange={() => { setMode('confirm'); setDirty(true); }} style={{ marginTop: 3 }} />
            <span>
              <b>执行前先问我</b>
              <span>计划涉及改动时停下来，等你点「批准并执行」才会动手。</span>
            </span>
          </div>
          <div className={'mmd-mode-card' + (mode === 'auto' ? ' is-on' : '')} onClick={() => { setMode('auto'); setDirty(true); }}>
            <input type="radio" name="mmd-mode" checked={mode === 'auto'} onChange={() => { setMode('auto'); setDirty(true); }} style={{ marginTop: 3 }} />
            <span>
              <b>直接执行</b>
              <span>计划生成后不再询问，立刻交给执行模型。</span>
            </span>
          </div>
        </div>

        <div className="mmd-mode-cards" style={{ marginTop: 10 }}>
          <div className={'mmd-mode-card' + (permissions === 'full' ? ' is-on' : '')} onClick={() => { setPermissions('full'); setDirty(true); }}>
            <input type="radio" name="mmd-perm" checked={permissions === 'full'} onChange={() => { setPermissions('full'); setDirty(true); }} style={{ marginTop: 3 }} />
            <span>
              <b>完全权限</b>
              <span>执行模型的工具调用不受会话沙箱约束（profile 的 sandbox-policy 需为 danger-full-access）。</span>
            </span>
          </div>
          <div className={'mmd-mode-card' + (permissions === 'session' ? ' is-on' : '')} onClick={() => { setPermissions('session'); setDirty(true); }}>
            <input type="radio" name="mmd-perm" checked={permissions === 'session'} onChange={() => { setPermissions('session'); setDirty(true); }} style={{ marginTop: 3 }} />
            <span>
              <b>跟随当前会话</b>
              <span>沿用发起研讨那个会话的权限；会话设为只读时，执行模型也只能读。</span>
            </span>
          </div>
        </div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={toolConfirmation}
            onChange={(event) => { setToolConfirmation(event.target.checked); setDirty(true); }}
            style={{ marginTop: 3 }}
          />
          <span>
            <b>工具级二次确认（默认关）</b>
            <span style={{ display: 'block', color: 'var(--mmd-muted, #6b7280)', fontSize: 12 }}>
              开着时每一个会改动系统的工具都要单独确认一次。插件目前**没有**交互式确认通道，
              所以开着等于把 <code>pwsh</code> / <code>write</code> 这类调用直接跳过、并如实记为 skipped。
              上面的「执行前先问我」已经能拦住整份计划，这一项一般不需要开。
            </span>
          </span>
        </label>

        <p className="mmd-hint" style={{ marginTop: 12 }}>
          执行模型默认没有任何工具，只能给步骤说明。下面的目录来自宿主当前可用的工具；勾得越多它能做的事越多，
          <b>写文件 / 跑命令这类会改动机器的工具请谨慎勾选</b>。
        </p>

        <div className="mmd-tool-toolbar">
          {TOOL_PRESETS.map((item) => (
            <button type="button" key={item.key} className="mmd-btn mmd-btn-sm" title={item.hint} onClick={() => applyToolPreset(item.pick)}>
              {item.label}
            </button>
          ))}
          {allowedTools.includes('*') ? (
            <span
              className="mmd-chip is-on"
              title="白名单写 *：所有工具（含以后新增）都允许，点一下撤销"
              onClick={() => { setAllowedTools((current) => current.filter((name) => name !== '*')); setDirty(true); }}
            >
              ✓ 全部工具（*）
            </span>
          ) : null}
          <span className="mmd-spacer" />
          <input
            className="mmd-input mmd-btn-sm"
            style={{ maxWidth: 180 }}
            placeholder="搜索工具…"
            value={toolQuery}
            onChange={(event) => setToolQuery(event.target.value)}
          />
        </div>

        <div className="mmd-tool-cat">
          <div className="mmd-sec-label">{'全部工具（' + (tools.length > 0 ? tools.length : FALLBACK_TOOLS.length) + ' 个可选）'}</div>
          {toolCats.map((cat) => (
            <div className="mmd-tool-cat" key={cat.key}>
              <div className="mmd-sec-label">{cat.title}</div>
              <div className="mmd-chips">
                {cat.names.map((name) => {
                  const on = allowedTools.includes(name);
                  const risky = !READ_ONLY.has(name);
                  return (
                    <span
                      key={name}
                      className={'mmd-chip' + (on ? ' is-on' : '') + (risky ? ' is-warn' : '')}
                      title={risky ? '这个工具会改动东西' : '只读工具'}
                      onClick={() => toggleTool(name, !on)}
                    >
                      {on ? '✓ ' : ''}{name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
          {toolCats.length === 0 ? <p className="mmd-hint">没有匹配的工具。</p> : null}
          {customTools.length > 0 ? (
            <div className="mmd-tool-cat">
              <div className="mmd-sec-label">白名单里额外写死的名字</div>
              <div className="mmd-chips">
                {customTools.map((name) => (
                  <span key={name} className="mmd-chip is-on" onClick={() => toggleTool(name, false)}>✓ {name}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mmd-seat-line" style={{ marginTop: 14 }}>
          <div className="mmd-field" style={{ maxWidth: 160 }}>
            <span>执行步数上限（0 = 不限）</span>
            <input
              className="mmd-input"
              type="number"
              min={0}
              max={100000}
              value={maxSteps}
              onChange={(event) => { setMaxSteps(Number(event.target.value)); setDirty(true); }}
            />
            <span className="mmd-hint" style={{ fontSize: 11 }}>
              {maxSteps === 0 ? '不限轮数：按需调用，直到计划完成' : '单次执行最多 ' + maxSteps + ' 轮工具调用'}
            </span>
          </div>
        </div>
      </section>

      <div className="mmd-save">
        <button type="button" className="mmd-btn mmd-btn-primary" disabled={saving} onClick={() => void save()}>
          {saving ? '保存中…' : '保存'}
        </button>
        <button type="button" className="mmd-btn" disabled={saving} onClick={() => void load()}>重新读取</button>
        {dirty ? <span className="mmd-status mmd-warn"><span className="mmd-dot-unsaved" /> 有未保存的改动</span> : null}
        {status ? <span className="mmd-status mmd-ok">{status}</span> : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const key = pendingSeat.current;
          event.target.value = '';
          if (file && key) void uploadAvatar(key, file);
        }}
      />
    </div>
  );
}

/** Used before the host answers, so the panel is never empty. */
const FALLBACK_TOOLS = ['read', 'write', 'edit', 'read_image', 'glob', 'grep', 'pwsh', 'bash', 'todo_write', 'web_search', 'web_fetch', 'job_list', 'present'];
