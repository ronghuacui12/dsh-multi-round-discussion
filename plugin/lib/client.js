window.__ModuleLoader__.load({
  id: 'dsh-multi-model-discussion',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name2 in all)
        __defProp(target, name2, { get: all[name2], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

    // client-src/index.tsx
    var index_exports = {};
    __export(index_exports, {
      apply: () => apply,
      inject: () => inject,
      name: () => name
    });
    module.exports = __toCommonJS(index_exports);

    // client-src/styles.ts
    var STYLE_ID = "dsh-mmd-styles";
    var CSS = `
    .mmd-root { --mmd-bg: var(--dsh-color-bg, #fff); --mmd-fg: var(--dsh-color-fg, #1f2328);
      --mmd-muted: var(--dsh-color-fg-muted, #6b7280); --mmd-line: var(--dsh-color-border, rgba(127,127,127,.25));
      --mmd-panel: var(--dsh-color-bg-subtle, rgba(127,127,127,.06));
      display: flex; height: 100%; min-height: 0; font-size: 13px; color: var(--mmd-fg); }

    /* ---------------------------------------------------------------- chat shell */
    .mmd-chat { display: flex; flex-direction: column; flex: 1; min-width: 0; height: 100%; }
    .mmd-chat-head { display: flex; align-items: center; gap: 10px; padding: 10px 16px;
      border-bottom: 1px solid var(--mmd-line); flex: 0 0 auto; flex-wrap: wrap; }
    .mmd-chat-title { font-weight: 600; font-size: 14px; }
    .mmd-chat-sub { color: var(--mmd-muted); font-size: 12px; }
    .mmd-chat-body { flex: 1 1 auto; overflow-y: auto; padding: 16px 16px 132px; scroll-behavior: smooth; }
    .mmd-compose { display: flex; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--mmd-line); align-items: center; }
    .mmd-chat-foot { flex: 0 0 auto; border-top: 1px solid var(--mmd-line); padding: 10px 16px; }

    /* ------------------------------------------------------------------ messages */
    .mmd-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-start; }
    .mmd-row-mine { flex-direction: row-reverse; }
    .mmd-avatar { width: 38px; height: 38px; border-radius: 50%; flex: 0 0 auto; overflow: hidden;
      background: var(--mmd-panel); display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 15px; color: #fff; user-select: none; }
    .mmd-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .mmd-col { min-width: 0; max-width: 82%; }
    .mmd-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .mmd-row-mine .mmd-meta { flex-direction: row-reverse; }
    .mmd-name { font-weight: 600; font-size: 12.5px; }
    .mmd-tag { font-size: 11px; color: var(--mmd-muted); }
    .mmd-bubble { border: 1px solid var(--mmd-line); border-radius: 12px; padding: 9px 12px;
      background: var(--mmd-panel); white-space: pre-wrap; word-break: break-word; line-height: 1.65; }
    .mmd-bubble-mine { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.35); }
    .mmd-bubble-lead { border-color: rgba(22,163,74,.4); background: rgba(22,163,74,.08); }
    .mmd-bubble-exec { border-color: rgba(217,119,6,.4); background: rgba(217,119,6,.08); }
    .mmd-bubble-sys { border-style: dashed; background: transparent; color: var(--mmd-muted); font-size: 12px; }
    .mmd-bubble-title { font-weight: 600; margin-bottom: 6px; }
    .mmd-bubble section { margin-top: 8px; }
    .mmd-sec-label { font-size: 11.5px; color: var(--mmd-muted); margin-bottom: 2px; }
    .mmd-bubble ul { margin: 0; padding-left: 18px; }
    .mmd-divider { display: flex; align-items: center; gap: 10px; margin: 20px 0 16px; color: var(--mmd-muted); font-size: 11.5px; }
    .mmd-divider::before, .mmd-divider::after { content: ''; flex: 1; height: 1px; background: var(--mmd-line); }
    .mmd-thinking { display: inline-flex; align-items: center; gap: 6px; color: var(--mmd-muted); font-size: 12px; }
    .mmd-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; animation: mmd-pulse 1.1s infinite ease-in-out; }
    .mmd-dot-done { background: #16a34a; animation: none; }
    .mmd-dot-error { background: #dc2626; animation: none; }
    .mmd-dot-idle { background: #9ca3af; animation: none; }
    @keyframes mmd-pulse { 0%,100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.1); } }
    .mmd-empty { padding: 60px 20px; text-align: center; color: var(--mmd-muted); }

    /* ------------------------------------------------------------------ controls */
    .mmd-btn { border: 1px solid var(--mmd-line); background: var(--mmd-bg); color: var(--mmd-fg);
      border-radius: 8px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; }
    .mmd-btn:hover:not(:disabled) { background: var(--mmd-panel); }
    .mmd-btn:disabled { opacity: .45; cursor: not-allowed; }
    .mmd-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }
    .mmd-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .mmd-btn-danger { border-color: rgba(220,38,38,.5); color: #dc2626; }
    .mmd-spacer { flex: 1; }
    .mmd-select, .mmd-input { border: 1px solid var(--mmd-line); border-radius: 8px; padding: 5px 8px;
      background: var(--mmd-bg); color: var(--mmd-fg); font-size: 12.5px; max-width: 100%; }
    .mmd-approve { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border: 1px solid rgba(217,119,6,.5);
      background: rgba(217,119,6,.1); border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; }

    /* ----------------------------------------------------------------- settings */
    .mmd-set { display: flex; flex-direction: column; gap: 22px; padding: 4px 2px 90px; max-width: 880px; }
    .mmd-set h3 { margin: 0 0 4px; font-size: 15px; }
    .mmd-set h4 { margin: 0 0 10px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }
    .mmd-hint { color: var(--mmd-muted); font-size: 12px; line-height: 1.6; margin: 0; }
    .mmd-group { border: 1px solid var(--mmd-line); border-radius: 12px; padding: 14px 16px; }
    .mmd-seat { display: flex; gap: 14px; padding: 12px 0; border-top: 1px dashed var(--mmd-line); align-items: flex-start; }
    .mmd-seat:first-of-type { border-top: 0; }
    .mmd-seat-avatar { position: relative; flex: 0 0 auto; cursor: pointer; }
    .mmd-seat-avatar .mmd-avatar { width: 46px; height: 46px; font-size: 18px; }
    .mmd-seat-avatar input { display: none; }
    .mmd-seat-avatar:hover::after { content: '换头像'; position: absolute; inset: auto 0 -15px 0; text-align: center;
      font-size: 10px; color: var(--mmd-muted); }
    .mmd-seat-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .mmd-seat-line { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .mmd-field { display: flex; flex-direction: column; gap: 3px; min-width: 140px; flex: 1; }
    .mmd-field > span { font-size: 11.5px; color: var(--mmd-muted); }
    .mmd-save { display: flex; align-items: center; gap: 12px; position: sticky; bottom: 0;
      background: var(--mmd-bg); padding: 12px 0; border-top: 1px solid var(--mmd-line); }
    .mmd-status { font-size: 12.5px; }
    .mmd-ok { color: #16a34a; }
    .mmd-bad { color: #dc2626; }
    .mmd-warn { color: #d97706; }
    .mmd-radio { display: flex; gap: 16px; flex-wrap: wrap; }
    .mmd-radio label { display: flex; gap: 6px; align-items: center; font-size: 12.5px; cursor: pointer; }
    .mmd-tools { display: flex; gap: 10px 16px; flex-wrap: wrap; }
    .mmd-tools label { display: flex; gap: 6px; align-items: center; font-size: 12.5px; cursor: pointer; }
    .mmd-cost { flex: 0 0 240px; border-left: 1px solid var(--mmd-line); padding: 14px; overflow-y: auto; }
    .mmd-cost h4 { margin: 0 0 10px; font-size: 12.5px; }
    .mmd-cost table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .mmd-cost td, .mmd-cost th { text-align: left; padding: 3px 2px; border-bottom: 1px solid var(--mmd-line); }
    .mmd-bar { height: 5px; border-radius: 3px; background: var(--mmd-line); overflow: hidden; margin: 4px 0 10px; }
    .mmd-bar > i { display: block; height: 100%; background: #2563eb; }
    `;
    function injectStyles() {
      if (typeof document === "undefined") return;
      if (document.getElementById(STYLE_ID)) return;
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = CSS;
      document.head.appendChild(el);
    }

    // client-src/settings.tsx
    var import_react2 = require("react");

    // client-src/api.ts
    var PREFIX = "/dsh-mmd";
    async function request(path, init) {
      const response = await fetch(PREFIX + path, {
        ...init,
        headers: { "content-type": "application/json", ...init?.headers ?? {} }
      });
      const text = await response.text();
      let body = void 0;
      try {
        body = text ? JSON.parse(text) : void 0;
      } catch {
        body = void 0;
      }
      if (!response.ok) {
        throw new Error(body && body.error || `${response.status} ${response.statusText}`);
      }
      return body;
    }
    var api = {
      settings: () => request("/settings"),
      saveSettings: (patch) => request("/settings", { method: "POST", body: JSON.stringify(patch) }),
      models: () => request("/models"),
      runs: () => request("/runs"),
      run: (id) => request(`/runs/${encodeURIComponent(id)}`),
      control: (id, control) => request(`/runs/${encodeURIComponent(id)}/control`, { method: "POST", body: JSON.stringify({ control }) }),
      start: (payload) => request("/runs", { method: "POST", body: JSON.stringify(payload) }),
      uploadAvatar: (key, dataUrl) => request("/avatars", { method: "POST", body: JSON.stringify({ key, dataUrl }) })
    };
    function subscribeEvents(onRuns, onRun) {
      if (typeof EventSource === "undefined") return () => {
      };
      const source = new EventSource(PREFIX + "/events");
      source.addEventListener("snapshot", (event) => {
        try {
          onRuns(JSON.parse(event.data).runs ?? []);
        } catch {
        }
      });
      source.addEventListener("run-updated", (event) => {
        try {
          onRun(JSON.parse(event.data));
        } catch {
        }
      });
      return () => source.close();
    }

    // client-src/avatar.tsx
    var import_react = require("react");
    var import_jsx_runtime = require("react/jsx-runtime");
    var PALETTE = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];
    function hueFor(key) {
      let hash = 0;
      for (let i = 0; i < key.length; i++) hash = hash * 31 + key.charCodeAt(i) >>> 0;
      return PALETTE[hash % PALETTE.length];
    }
    function Avatar(props) {
      const { seatKey, label, size = 38, version } = props;
      const [broken, setBroken] = (0, import_react.useState)(false);
      (0, import_react.useEffect)(() => setBroken(false), [version, seatKey]);
      const initial = (label || seatKey || "?").trim().slice(0, 1).toUpperCase();
      const src = version ? `/dsh-mmd/avatars/${encodeURIComponent(seatKey)}?v=${encodeURIComponent(version)}` : `/dsh-mmd/avatars/${encodeURIComponent(seatKey)}`;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mmd-avatar", style: { width: size, height: size, background: hueFor(seatKey), fontSize: Math.round(size * 0.42) }, children: broken ? initial : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src, alt: label, onError: () => setBroken(true) }) });
    }

    // client-src/settings.tsx
    var import_jsx_runtime2 = require("react/jsx-runtime");
    var GROUPS = [
      { role: "decisionMaker", title: "主导模型", hint: "读完全部提案与互评，拍板选出最终方向，并写出最终答复。", min: 1, max: 1, seat: "lead" },
      { role: "proposer", title: "讨论者", hint: "各自独立提出方案，然后互相看到对方（匿名）的方案并给出自己的理解与评价。", min: 1, max: 5, seat: "proposer" },
      { role: "reviewer", title: "专职评审（可选）", hint: "不提案，只对匿名方案做交叉评审。讨论者已经在互评，这一组可以留空。", min: 0, max: 3, seat: "reviewer" },
      { role: "executor", title: "执行模型", hint: "只按批准后的计划动手，不重新规划。", min: 1, max: 1, seat: "executor" },
      { role: "verifier", title: "验证模型（可选）", hint: "执行后按验收标准检查结果。", min: 0, max: 2, seat: "verifier" }
    ];
    function toSeats(profiles) {
      return (profiles ?? []).map((p) => ({
        key: String(p.id),
        role: String(p.role),
        provider: String(p.provider ?? ""),
        model: String(p.model ?? ""),
        label: String(p.label ?? p.id),
        temperature: typeof p.temperature === "number" ? p.temperature : 0.4,
        systemPrompt: String(p.systemPrompt ?? ""),
        enabled: p.enabled !== false
      }));
    }
    function nextKey(seats, prefix) {
      let n = 1;
      const used = new Set(seats.map((s) => s.key));
      while (used.has(`${prefix}-${n}`)) n++;
      return `${prefix}-${n}`;
    }
    function SettingsSection() {
      const [loading, setLoading] = (0, import_react2.useState)(true);
      const [saving, setSaving] = (0, import_react2.useState)(false);
      const [error, setError] = (0, import_react2.useState)("");
      const [status, setStatus] = (0, import_react2.useState)("");
      const [seats, setSeats] = (0, import_react2.useState)([]);
      const [providers, setProviders] = (0, import_react2.useState)([]);
      const [tools, setTools] = (0, import_react2.useState)([]);
      const [preset, setPreset] = (0, import_react2.useState)("balanced");
      const [peerReview, setPeerReview] = (0, import_react2.useState)(true);
      const [mode, setMode] = (0, import_react2.useState)("confirm");
      const [allowedTools, setAllowedTools] = (0, import_react2.useState)([]);
      const [maxSteps, setMaxSteps] = (0, import_react2.useState)(12);
      const [avatars, setAvatars] = (0, import_react2.useState)({});
      const [mmdHome, setMmdHome] = (0, import_react2.useState)("");
      const fileRef = (0, import_react2.useRef)(null);
      const pendingSeat = (0, import_react2.useRef)("");
      const load = (0, import_react2.useCallback)(async () => {
        setLoading(true);
        setError("");
        try {
          const data = await api.settings();
          setSeats(toSeats(data.profiles));
          setProviders(data.providers ?? []);
          setTools(data.tools ?? []);
          setPreset(data.preset ?? "balanced");
          setPeerReview(data.peerReview !== false);
          setMode(data.execution?.mode ?? "confirm");
          setAllowedTools(data.execution?.allowedTools ?? []);
          setMaxSteps(data.execution?.maxSteps ?? 12);
          setAvatars(data.avatars ?? {});
          setMmdHome(data.mmdHome ?? "");
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setLoading(false);
        }
      }, []);
      (0, import_react2.useEffect)(() => {
        void load();
      }, [load]);
      const modelsOf = (0, import_react2.useCallback)(
        (providerId) => providers.find((p) => p.id === providerId)?.models ?? [],
        [providers]
      );
      const patchSeat = (key, patch) => {
        setSeats((current) => current.map((seat) => seat.key === key ? { ...seat, ...patch } : seat));
        setStatus("");
      };
      const addSeat = (role, prefix) => {
        setSeats((current) => [
          ...current,
          {
            key: nextKey(current, prefix),
            role,
            provider: providers[0]?.id ?? "",
            model: providers[0]?.models?.[0]?.id ?? "",
            label: "",
            temperature: 0.4,
            systemPrompt: "",
            enabled: true
          }
        ]);
        setStatus("");
      };
      const removeSeat = (key) => {
        setSeats((current) => current.filter((seat) => seat.key !== key));
        setStatus("");
      };
      const save = async () => {
        setSaving(true);
        setError("");
        setStatus("");
        try {
          const profiles = seats.filter((seat) => seat.provider && seat.model).map((seat) => ({
            id: seat.key,
            role: seat.role,
            provider: seat.provider,
            model: seat.model,
            label: seat.label || void 0,
            temperature: seat.temperature,
            systemPrompt: seat.systemPrompt || void 0,
            enabled: seat.enabled
          }));
          const result = await api.saveSettings({
            profiles,
            preset,
            peerReview,
            execution: { mode, allowedTools, maxSteps }
          });
          setSeats(toSeats(result.profiles));
          setAvatars(result.avatars ?? {});
          const warnings = result.warnings ?? [];
          setStatus(warnings.length > 0 ? `已保存（${warnings.join("；")}）` : "已保存，下一次研讨立即生效。");
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setSaving(false);
        }
      };
      const uploadAvatar = async (key, file) => {
        setError("");
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("读取图片失败。"));
            reader.readAsDataURL(file);
          });
          const result = await api.uploadAvatar(key, dataUrl);
          setAvatars(result.avatars ?? {});
          setStatus("头像已更新。");
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };
      const grouped = (0, import_react2.useMemo)(
        () => GROUPS.map((group) => ({ group, seats: seats.filter((seat) => seat.role === group.role) })),
        [seats]
      );
      if (loading) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-set", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: "正在读取当前配置…" }) });
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-set", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "研讨模式" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: "下面每个座位选一个已经配好的模型（provider 路由 + 模型 id），不需要再填 API Key—— 密钥由 DSH 的凭证层按请求解析。留空的座位不参与研讨。" }),
          mmdHome ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "mmd-hint", children: [
            "配置保存到 ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("code", { children: [
              mmdHome,
              "/roster.json"
            ] }),
            "，同时立即对运行中的研讨生效。"
          ] }) : null
        ] }),
        error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-bubble mmd-bubble-sys mmd-bad", children: [
          "✕ ",
          error
        ] }) : null,
        grouped.map(({ group, seats: groupSeats }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "mmd-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { children: [
            group.title,
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "mmd-muted", style: { fontWeight: 400, fontSize: 11.5 }, children: [
              groupSeats.length,
              "/",
              group.max
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-spacer" }),
            groupSeats.length < group.max ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn", onClick: () => addSeat(group.role, group.seat), children: "+ 添加" }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: group.hint }),
          groupSeats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", style: { marginTop: 8 }, children: "（暂无座位，本组不参与）" }) : null,
          groupSeats.map((seat) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "div",
              {
                className: "mmd-seat-avatar",
                title: "点击上传头像图片",
                onClick: () => {
                  pendingSeat.current = seat.key;
                  fileRef.current?.click();
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { seatKey: seat.key, label: seat.label || seat.key, size: 46, version: avatars[seat.key] })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat-body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat-line", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "显示名" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      className: "mmd-input",
                      value: seat.label,
                      placeholder: seat.key,
                      onChange: (event) => patchSeat(seat.key, { label: event.target.value })
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Provider 路由" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                    "select",
                    {
                      className: "mmd-select",
                      value: seat.provider,
                      onChange: (event) => {
                        const provider = event.target.value;
                        patchSeat(seat.key, { provider, model: modelsOf(provider)[0]?.id ?? "" });
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "（未选择）" }),
                        providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: provider.id, children: provider.name }, provider.id))
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "模型" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                    "select",
                    {
                      className: "mmd-select",
                      value: seat.model,
                      onChange: (event) => patchSeat(seat.key, { model: event.target.value }),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "（未选择）" }),
                        modelsOf(seat.provider).map((model) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: model.id, children: model.name }, model.id)),
                        seat.model && !modelsOf(seat.provider).some((m) => m.id === seat.model) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: seat.model, children: [
                          seat.model,
                          "（已配置，未在目录中）"
                        ] }) : null
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", style: { maxWidth: 110 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "温度" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      className: "mmd-input",
                      type: "number",
                      min: 0,
                      max: 2,
                      step: 0.1,
                      value: seat.temperature,
                      onChange: (event) => patchSeat(seat.key, { temperature: Number(event.target.value) })
                    }
                  )
                ] }),
                group.max > group.min ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-danger", onClick: () => removeSeat(seat.key), children: "移除" }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "角色提示词（同款模型靠它分裂成不同角色，可留空）" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "input",
                  {
                    className: "mmd-input",
                    value: seat.systemPrompt,
                    placeholder: "例如：你偏好激进、直接的落地路径。",
                    onChange: (event) => patchSeat(seat.key, { systemPrompt: event.target.value })
                  }
                )
              ] })
            ] })
          ] }, seat.key))
        ] }, group.role)),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "mmd-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: "研讨方式" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat-line", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", style: { maxWidth: 220 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "研讨深度" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { className: "mmd-select", value: preset, onChange: (event) => setPreset(event.target.value), children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "fast", children: "快速 · 1 提案者 · 1 轮" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "balanced", children: "平衡 · 3 提案者 · 2 轮" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "deep", children: "深度 · 5 提案者 · 3 轮 + 验证" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "custom", children: "自定义 · 完全按上面的座位" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "mmd-radio", style: { marginTop: 16 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: peerReview, onChange: (event) => setPeerReview(event.target.checked) }),
              "讨论者互相评议（关掉就只剩各自独立提案）"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "mmd-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: "执行方式" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-radio", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", name: "mmd-mode", checked: mode === "confirm", onChange: () => setMode("confirm") }),
              "执行前先问我（计划涉及改动时停下来等批准）"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", name: "mmd-mode", checked: mode === "auto", onChange: () => setMode("auto") }),
              "直接执行（不再询问）"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", style: { marginTop: 8 }, children: "执行模型默认没有任何工具，只能给步骤说明。要让讨论结果真正落地，请在下面勾选允许它调用的工具。" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-tools", style: { marginTop: 10 }, children: (tools.length > 0 ? tools : ["read", "write", "edit", "read_image", "glob", "grep", "pwsh", "bash", "todo_write"]).map((tool) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: allowedTools.includes(tool),
                onChange: (event) => setAllowedTools(
                  (current) => event.target.checked ? [.../* @__PURE__ */ new Set([...current, tool])] : current.filter((name2) => name2 !== tool)
                )
              }
            ),
            tool
          ] }, tool)) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-seat-line", style: { marginTop: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", style: { maxWidth: 160 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "执行步数上限" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "mmd-input",
                type: "number",
                min: 1,
                max: 60,
                value: maxSteps,
                onChange: (event) => setMaxSteps(Number(event.target.value))
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-save", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", disabled: saving, onClick: () => void save(), children: saving ? "保存中…" : "保存" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn", disabled: saving, onClick: () => void load(), children: "重新读取" }),
          status ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-status mmd-ok", children: status }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            ref: fileRef,
            type: "file",
            accept: "image/png,image/jpeg,image/webp,image/gif",
            onChange: (event) => {
              const file = event.target.files?.[0];
              const key = pendingSeat.current;
              event.target.value = "";
              if (file && key) void uploadAvatar(key, file);
            }
          }
        )
      ] });
    }

    // client-src/chat.tsx
    var import_react3 = require("react");
    var import_jsx_runtime3 = require("react/jsx-runtime");
    var PHASE_TEXT = {
      idle: "空闲",
      clarifying: "正在判断需求",
      "awaiting-user": "等你补充信息",
      proposing: "讨论者独立提案中",
      reviewing: "互相评议中",
      deciding: "主导模型决策中",
      planning: "生成执行计划",
      executing: "执行中",
      verifying: "验证中",
      finalizing: "汇总答复",
      completed: "已完成",
      failed: "失败",
      stopped: "已停止"
    };
    var ROLE_TEXT = {
      decisionMaker: "主导模型",
      proposer: "讨论者",
      reviewer: "评审",
      executor: "执行模型",
      verifier: "验证"
    };
    function roundOfProposal(id) {
      const match = /^proposal-r(\d+)-/.exec(id);
      return match ? Number(match[1]) : 1;
    }
    function Section(props) {
      const { label, values } = props;
      if (!values || values.length === 0) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-sec-label", children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { children: values.map((value, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("li", { children: value }, index)) })
      ] });
    }
    function DiscussionView() {
      const [runs, setRuns] = (0, import_react3.useState)([]);
      const [activeId, setActiveId] = (0, import_react3.useState)("");
      const [run, setRun] = (0, import_react3.useState)(null);
      const [names, setNames] = (0, import_react3.useState)({});
      const [avatars, setAvatars] = (0, import_react3.useState)({});
      const [error, setError] = (0, import_react3.useState)("");
      const [draft, setDraft] = (0, import_react3.useState)("");
      const [busy, setBusy] = (0, import_react3.useState)(false);
      const [clarify, setClarify] = (0, import_react3.useState)("");
      const bodyRef = (0, import_react3.useRef)(null);
      const loadMeta = (0, import_react3.useCallback)(async () => {
        try {
          const data = await api.settings();
          const map = {};
          for (const profile of data.profiles ?? []) map[profile.id] = profile.label ?? profile.id;
          setNames(map);
          setAvatars(data.avatars ?? {});
        } catch {
        }
      }, []);
      const loadRuns = (0, import_react3.useCallback)(async (preferId) => {
        try {
          const data = await api.runs();
          const list = data.runs ?? [];
          setRuns(list);
          setActiveId((current) => preferId || current || (list[0]?.runId ?? ""));
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      }, []);
      (0, import_react3.useEffect)(() => {
        void loadMeta();
        void loadRuns();
      }, [loadMeta, loadRuns]);
      (0, import_react3.useEffect)(() => {
        const off = subscribeEvents(
          (list) => setRuns(list),
          (next) => {
            setRuns((current) => [next, ...current.filter((r) => r.runId !== next.runId)]);
            setRun((current) => current && current.runId === next.runId ? next : current);
          }
        );
        const timer = setInterval(() => {
          void loadRuns();
          void loadMeta();
        }, 4e3);
        return () => {
          off();
          clearInterval(timer);
        };
      }, [loadRuns, loadMeta]);
      (0, import_react3.useEffect)(() => {
        if (!activeId) {
          setRun(null);
          return;
        }
        let alive = true;
        const pull = () => api.run(activeId).then((data) => {
          if (alive) setRun(data.run);
        }).catch(() => {
        });
        void pull();
        const timer = setInterval(pull, 1500);
        return () => {
          alive = false;
          clearInterval(timer);
        };
      }, [activeId]);
      const nameOf = (profileId) => names[profileId] ?? run?.participants?.find((p) => p.profileId === profileId)?.label ?? profileId;
      const roleOf = (profileId) => run?.participants?.find((p) => p.profileId === profileId)?.role ?? "";
      const messages = (0, import_react3.useMemo)(() => {
        if (!run) return [];
        const bb = run.blackboard ?? {};
        const proposals = bb.proposals ?? [];
        const reviews = bb.reviews ?? [];
        const decisions = bb.decisions ?? (bb.decision ? [bb.decision] : []);
        const items = [];
        items.push({ kind: "request", id: "request", text: run.request });
        const rounds = [...new Set(proposals.map((p) => roundOfProposal(p.id)))].sort((a, b) => a - b);
        const indexOf = new Map(proposals.map((p, index) => [p.id, index + 1]));
        for (const round of rounds) {
          items.push({ kind: "divider", id: `d-propose-${round}`, text: `第 ${round} 轮 · 独立提案` });
          for (const proposal of proposals.filter((p) => roundOfProposal(p.id) === round)) {
            items.push({ kind: "proposal", id: proposal.id, proposal, label: `P${indexOf.get(proposal.id)}` });
          }
          const roundReviews = reviews.filter((review) => review.round === round);
          if (roundReviews.length > 0) {
            items.push({ kind: "divider", id: `d-review-${round}`, text: `第 ${round} 轮 · 互相评议` });
            for (const review of roundReviews) {
              items.push({
                kind: "review",
                id: review.id,
                review,
                target: `P${indexOf.get(review.targetProposalId) ?? "?"}`
              });
            }
          }
          const decision = decisions.find((d) => d.round === round);
          if (decision) items.push({ kind: "decision", id: decision.id, decision });
        }
        if (bb.plan) items.push({ kind: "plan", id: `plan-${bb.plan.id}`, plan: bb.plan });
        if (bb.execution) items.push({ kind: "execution", id: `exec-${bb.execution.planId}`, execution: bb.execution });
        if (bb.verification) items.push({ kind: "verification", id: `verify-${bb.verification.planId}`, verification: bb.verification });
        for (const notice of run.notices ?? []) {
          items.push({ kind: "notice", id: notice.id, notice });
        }
        if (bb.finalAnswer) items.push({ kind: "answer", id: "answer", text: bb.finalAnswer });
        return items;
      }, [run]);
      (0, import_react3.useEffect)(() => {
        const node = bodyRef.current;
        if (node) node.scrollTop = node.scrollHeight;
      }, [messages.length, run?.phase, run?.revision]);
      const control = async (payload) => {
        if (!run) return;
        try {
          await api.control(run.runId, payload);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };
      const start = async () => {
        const request2 = draft.trim();
        if (!request2) return;
        setBusy(true);
        setError("");
        try {
          const created = await api.start({ request: request2 });
          setDraft("");
          await loadRuns(created.run?.runId);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setBusy(false);
        }
      };
      const thinking = (run?.participants ?? []).filter((p) => p.state === "thinking");
      const awaitingApproval = run?.phase === "planning" && !!run?.pendingQuestion;
      const awaitingUser = run?.phase === "awaiting-user";
      const settled = ["completed", "failed", "stopped"].includes(run?.phase ?? "");
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-root", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-chat", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-chat-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-chat-title", children: "多模型研讨" }),
            run ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-chat-sub", children: PHASE_TEXT[run.phase] ?? run.phase }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { className: "mmd-select", value: activeId, onChange: (event) => setActiveId(event.target.value), children: [
              runs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "（暂无研讨）" }) : null,
              runs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("option", { value: item.runId, children: [
                (item.request ?? "").slice(0, 26),
                " · ",
                PHASE_TEXT[item.phase] ?? item.phase
              ] }, item.runId))
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-spacer" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn", disabled: !run || settled, onClick: () => void control({ kind: "stop" }), children: "叫停" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn", disabled: !run || run.phase !== "proposing", onClick: () => void control({ kind: "skip-review" }), children: "跳过评议" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-compose", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "input",
              {
                className: "mmd-input",
                style: { flex: 1 },
                value: draft,
                placeholder: "提出一个问题，让多个模型分别出方案、再互相评议…",
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void start();
                  }
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", disabled: busy || !draft.trim(), onClick: () => void start(), children: busy ? "发起中…" : "发起研讨" })
          ] }),
          awaitingApproval ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-approve", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "计划已生成，等你批准" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-chat-sub", children: "批准后执行模型才会动手。" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-spacer" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", onClick: () => void control({ kind: "approve-plan" }), children: "批准并执行" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-danger", onClick: () => void control({ kind: "stop" }), children: "不执行" })
          ] }) : null,
          awaitingUser ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-approve", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "需要补充信息" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "mmd-input", style: { flex: 1, minWidth: 200 }, value: clarify, onChange: (event) => setClarify(event.target.value), placeholder: run?.pendingQuestion ?? "" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", onClick: () => {
              void control({ kind: "supply-clarification", answer: clarify });
              setClarify("");
            }, children: "回答" })
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-chat-body", ref: bodyRef, children: [
            error ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble mmd-bubble-sys mmd-bad", children: [
              "✕ ",
              error
            ] }) : null,
            !run ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-empty", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontWeight: 600, marginBottom: 6 }, children: "还没有研讨记录" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { children: "在下面输入一个问题，讨论者会分别独立提案，然后互相评议，最后由主导模型给出结论。" })
            ] }) : null,
            messages.map((item) => {
              if (item.kind === "divider") return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-divider", children: item.text }, item.id);
              if (item.kind === "request") {
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row mmd-row-mine", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: "__user", label: "我" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: "我" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-tag", children: "提问" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-mine", children: item.text })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "proposal") {
                const p = item.proposal;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: p.profileId, label: nameOf(p.profileId), version: avatars[p.profileId] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(p.profileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        ROLE_TEXT[roleOf(p.profileId)] ?? "提案",
                        " · ",
                        item.label,
                        " · 信心 ",
                        Math.round((p.confidence ?? 0) * 100),
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble-title", children: p.summary }),
                      p.plan,
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "理由", values: p.reasons }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "风险", values: p.risks }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "依赖", values: p.dependencies })
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "review") {
                const rv = item.review;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: rv.reviewerProfileId, label: nameOf(rv.reviewerProfileId), version: avatars[rv.reviewerProfileId] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(rv.reviewerProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "评议 ",
                        item.target,
                        " · 信心 ",
                        Math.round((rv.confidence ?? 0) * 100),
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "认可", values: rv.pros }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "质疑", values: rv.cons }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "建议", values: rv.suggestions })
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "decision") {
                const d = item.decision;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: d.decisionMakerProfileId, label: nameOf(d.decisionMakerProfileId), version: avatars[d.decisionMakerProfileId] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: d.decisionMakerProfileId === "user" ? "你" : nameOf(d.decisionMakerProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "拍板 · 采纳 ",
                        d.chosenProposalIds?.length ?? 0,
                        " 个方案"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble mmd-bubble-lead", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble-title", children: "结论方向" }),
                      d.finalDirection,
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "取舍理由", values: [d.rationale] })
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "plan") {
                const plan = item.plan;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: plan.planBuilderProfileId ?? "__plan", label: "计划", version: avatars[plan.planBuilderProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(plan.planBuilderProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "执行计划 · ",
                        plan.steps?.length ?? 0,
                        " 步",
                        plan.mutatesState ? " · 会改变系统状态" : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      (plan.steps ?? []).map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { marginBottom: 6 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
                          index + 1,
                          ". ",
                          step.description
                        ] }),
                        step.tool ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                          "（",
                          step.tool,
                          "）"
                        ] }) : null,
                        step.acceptance ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-sec-label", children: [
                          "验收：",
                          step.acceptance
                        ] }) : null
                      ] }, step.id)),
                      plan.notes ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "说明", values: [plan.notes] }) : null
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "execution") {
                const execution = item.execution;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: execution.executorProfileId ?? "__exec", label: "执行", version: avatars[execution.executorProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(execution.executorProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "执行结果 · ",
                        execution.status,
                        execution.stoppedReason ? ` · ${execution.stoppedReason}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-exec", children: (execution.outputs ?? []).map((output, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { marginBottom: 6 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
                        "第 ",
                        index + 1,
                        " 步 · ",
                        output.status
                      ] }),
                      output.error ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bad", children: output.error }) : null,
                      output.rendered ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { children: String(output.rendered).slice(0, 1200) }) : null
                    ] }, output.stepId)) })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "verification") {
                const verification = item.verification;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: verification.verifierProfileId ?? "__verify", label: "验证", version: avatars[verification.verifierProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: verification.verifierProfileId ? nameOf(verification.verifierProfileId) : "验证" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        verification.passed ? "通过" : "未通过",
                        " · ",
                        verification.recommendedAction
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "问题", values: verification.issues }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "建议", values: verification.suggestions }),
                      verification.skipped ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-sec-label", children: "（本次未实际验证）" }) : null
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "notice") {
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-row", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-col", style: { maxWidth: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-sys", children: item.notice.message }) }) }, item.id);
              }
              if (item.kind === "answer") {
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: run?.blackboard?.decision?.decisionMakerProfileId ?? "__lead", label: "主导", version: avatars[run?.blackboard?.decision?.decisionMakerProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: "主导模型" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-tag", children: "最终答复" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-lead", children: item.text })
                  ] })
                ] }, item.id);
              }
              return null;
            }),
            thinking.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: thinking[0].profileId, label: nameOf(thinking[0].profileId), version: avatars[thinking[0].profileId] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-col", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-thinking", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-dot" }),
                thinking.map((p) => nameOf(p.profileId)).join("、"),
                " 正在思考…"
              ] }) })
            ] }) : null
          ] })
        ] }),
        run ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-cost", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "用量" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            "总 token：",
            run.cost?.totalTokens ?? 0
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            "成本：$",
            (run.cost?.totalCostUsd ?? 0).toFixed(4)
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bar", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { style: { width: `${Math.min(100, run.cost?.budget?.maxTotalTokens ? run.cost.totalTokens / run.cost.budget.maxTotalTokens * 100 : 0)}%` } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "模型" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "调用" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "token" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: (run.cost?.byProfile ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { title: `${row.provider}/${row.model}`, children: row.label ?? row.profileId }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: row.calls }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: row.inputTokens + row.outputTokens })
            ] }, row.profileId)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { style: { marginTop: 16 }, children: "参与模型" }),
          (run.participants ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `mmd-dot mmd-dot-${p.state === "thinking" ? "" : p.state}` }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: nameOf(p.profileId) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-tag", children: ROLE_TEXT[p.role] ?? p.role })
          ] }, p.profileId))
        ] }) : null
      ] });
    }

    // client-src/index.tsx
    var name = "multi-model-discussion/client";
    var inject = ["slots"];
    function apply(ctx) {
      injectStyles();
      const slots = ctx.slots;
      if (!slots) {
        ctx.logger?.("multi-model-discussion/client")?.info?.("composition has no slots service; the discussion UI is not mounted");
        return;
      }
      slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: "multi-model-discussion", order: 30, label: "研讨模式" },
          SettingsSection
        )
      );
      slots.inject(
        "conversation.view",
        () => slots.register(
          { name: "conversation.view", id: "multi-model-discussion", order: 100, label: "多模型研讨" },
          DiscussionView
        )
      );
    }

    return module.exports;
  },
});
