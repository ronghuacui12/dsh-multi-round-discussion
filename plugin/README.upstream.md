# dsh-multi-model-discussion

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的多模型讨论式生成插件。

一句话概括：

> 用户选模型 → 多模型独立提案 → 主导模型决策 → 主导模型生成计划 → 执行模型执行 → 主导模型汇总答复。

它不是"让多个模型一起聊天"，而是一套**角色清晰、阶段明确、状态可控**的多模型编排系统：

| 角色 | 职责 | 本实现中的位置 |
|---|---|---|
| 编排者 Orchestrator | 驱动状态机、管理预算与生命周期 | `plugins/orchestrator.ts` |
| 提案者 Proposer | 多个模型并行独立给出方案 | `plugins/discussion-engine.ts` |
| 评审者 Reviewer | 匿名交叉评审，防趋同 | `plugins/discussion-engine.ts` |
| 决策者 Decision Maker | 主导模型拍板 / 融合 / 否决 | `plugins/lead-model.ts` |
| 计划生成者 Plan Builder | 把决策转成结构化计划 | `plugins/lead-model.ts` |
| 执行者 Executor | 只执行计划，不重新规划 | `plugins/executor.ts` |
| 验证者 Verifier | 按验收标准检查执行结果 | `plugins/verifier.ts` |

---

## 1. 核心设计

### 1.1 一个 API Key 分裂出多个模型实例

这是整套设计的地基，由 `ModelProfile` 承载。四层语义被严格分开，从不合并成一个字段：

| 层次 | 字段 | 含义 |
|---|---|---|
| Provider route | `provider` | 注册在 `ctx.llm` 上的路由名，如 `deepseek-official` |
| Model endpoint | `model` | 传给 provider 的 wire model id |
| Model instance | 一行 `ModelProfile` | 自己的 temperature / systemPrompt / maxTokens |
| Role binding | `role` | 这个实例"是干什么的" |

因此**同一个 provider + model 可以出现任意多次**，靠 temperature 和 systemPrompt 区分成不同角色。这就是"一个 Key 分裂多个模型"的完整机制——不需要任何特殊支持，因为实例本来就只是一行配置。

### 1.2 状态机化，且回环全部收敛到"主导决策"

```
需求澄清 → [等待用户] → (并行提案 → [交叉评审] → 主导决策)*
        → 计划生成 → [等待批准] → 执行 → [验证 → (修复 | 重新决策)]*
        → 最终答复 → 完成
```

`core/state-machine.ts` 的转移表里**不存在** `proposing → proposing` 这类边。讨论要再来一轮，唯一的路径是 `deciding → proposing`。这让"讨论不会无限进行"成为**图的结构性质**，而不是写在提示词里的请求。

非法转移会抛 `IllegalTransitionError` 并同时报出源阶段、目标阶段和合法目标集合，阶段错误在发生的那一刻就暴露。

### 1.3 共享黑板：每个模型只读自己需要的部分

`core/blackboard.ts` 的 `sliceFor(role)` 决定了每个角色能读到什么，**盲提案是结构保证的**：

| 角色 | 能读到 |
|---|---|
| proposer | 原始需求 + 澄清记录，**看不到其它提案** |
| reviewer | 需求 + 匿名化提案（`P1`/`P2`，作者不可见） |
| decisionMaker | 需求 + 全部提案 + 全部评审 |
| executor | **只有计划**——没有需求原文，没有讨论过程 |
| verifier | 计划 + 执行结果 |

提案者拿不到兄弟提案，不是因为提示词要求它别看，而是因为切片里根本没有那个字段。

### 1.4 执行模型严格受限

`plugins/executor.ts` 是一个自建的受限工具循环（不复用 DSH agent loop），三重约束按强度排列：

1. **Schema 过滤**——非白名单工具在模型被询问之前就被移除了，模型根本看不到它们；看不见的工具不会被调用。
2. **派发时校验**——每次调用都要再过一次 `sandbox.decide()`，所以幻觉出来的工具名也会被拦住。
3. **步数上限**——`maxSteps` 封顶，达到上限就如实报告为 partial，不继续烧预算。

执行器**不修复任何失败**。失败的处置权属于主导模型（`executing → deciding` 这条边），不属于执行循环。

### 1.5 预算可管

`core/budget-guard.ts` 横切所有烧 token 的环节。超限行为是明确的：**立即停止讨论、保留已有提案、强制进入主导决策**——失去一个更好的答案可以接受，因为失控的争论而丢掉整个运行不行。

轮次检查发生在**一轮开始之前**，所以不会出现"开到一半被放弃"的半成品轮次污染决策输入。

---

## 2. 目录结构

```
dsh-multi-model-discussion/
├─ package.json                  # dsh.bundle + dsh.client 双端声明
├─ tsconfig.json                 # 类型检查（含 src 与 test）
├─ tsconfig.build.json           # Node 端构建
├─ cordis.patch.yml              # bundle 层：一行挂载整个编排
├─ scripts/
│  └─ fix-dts-specifiers.mjs     # 把 .d.ts 里的 .ts 说明符改写为 .js
├─ src/
│  ├─ index.ts                   # 插件入口：Config schema + 装配 + 生命周期
│  ├─ types/
│  │  ├─ model-profile.ts        # ModelProfile / ModelRole / 成本类型
│  │  ├─ discussion.ts           # Proposal / AnonymizedProposal / Review / Decision
│  │  ├─ plan.ts                 # ExecutionPlan / ExecutionResult / Verification
│  │  ├─ blackboard.ts           # Blackboard / BlackboardSlice / Snapshot
│  │  ├─ run.ts                  # Phase / RunState / RunControl / CostSummary
│  │  └─ index.ts
│  ├─ core/
│  │  ├─ blackboard.ts           # SharedBlackboard：切片、匿名化、revision
│  │  ├─ state-machine.ts        # 转移表 + settle + PHASE_LABELS
│  │  ├─ budget-guard.ts         # Token / 成本 / 耗时 / 轮次上限
│  │  ├─ sandbox.ts              # 工具白名单与只读判定
│  │  ├─ roster.ts               # roster 组装（按角色而非厂商）
│  │  ├─ preset.ts               # 快速 / 平衡 / 深度 / 自定义
│  │  ├─ prompts.ts              # 全部提示词（集中可审）
│  │  └─ events.ts               # 事件名常量
│  ├─ services/
│  │  ├─ model-registry.ts       # 唯一的模型调用出口 + 计费
│  │  └─ run-store.ts            # 运行态存储 + UserInputGate
│  ├─ plugins/
│  │  ├─ orchestrator.ts         # 状态机驱动
│  │  ├─ discussion-engine.ts    # 并行提案 + 匿名评审
│  │  ├─ lead-model.ts           # 澄清 / 决策 / 计划 / 最终答复
│  │  ├─ executor.ts             # 受限工具循环
│  │  ├─ verifier.ts             # 验收检查
│  │  └─ observability.ts        # 成本统计与历史
│  ├─ host/
│  │  └─ api-routes.ts           # JSON 快照 + SSE 事件流
│  ├─ tools/
│  │  └─ discuss.ts              # multi_model_discuss 工具
│  ├─ client/                    # 浏览器端（独立构建目标）
│  │  ├─ index.ts                # 注册 conversation.view 标签页
│  │  ├─ DiscussionView.tsx      # 讨论过程视图
│  │  ├─ api.ts                  # HTTP + SSE 客户端
│  │  └─ styles.ts               # 运行时注入的样式表
│  └─ utils/
│     ├─ cost.ts                 # 价格表与成本估算
│     ├─ json.ts                 # 结构化输出解析
│     └─ logger.ts
└─ test/                         # 86 个单元测试
```

### 关于"插件拆分"的一个实现决策

设计文档建议拆成 6 个可独立挂载的插件（`model-registry` / `discussion-engine` / `orchestrator` / `executor` / `ui-panel` / `observability`）。

本实现把这 6 部分做成**一个插件包内的模块**，原因是：它们的配置（profile 列表、预算、roster）属于**同一份配置**，拆成 6 行 `cordis.yml` 意味着改一个 roster 要动 6 个地方，而收益只是"可以只挂载一个子集"——但一个没有 executor 的编排器没有意义。

拆分原则仍然被遵守：

- `model-registry` 与运行态存储都是 Cordis 服务（`ctx.multiModelRegistry` / `ctx.multiModelRunStore`），其它模块按**服务键**依赖它们，不靠 import 耦合；外部插件同样可以 `inject: [...]` 消费它们。
- `orchestrator` 是唯一驱动状态机的一方。
- `observability` 与客户端 UI 是完全被动的观察者，去掉后核心链路照跑。
- 所有注册都通过 `ctx.effect(...)` 持有 disposer，卸载时自动清理。

---

## 3. 安装与配置

### 3.1 安装

```bash
# 从本地目录安装
dsh plugin --profile web add /path/to/dsh-multi-model-discussion
```

或作为一次性 overlay：

```bash
dsh web --patch /path/to/dsh-multi-model-discussion/cordis.patch.yml
```

### 3.2 最小配置

`cordis.patch.yml` 里的一行即可挂载整套编排：

```yaml
- insert:
    - id: dsh-multi-model-discussion
      name: dsh-multi-model-discussion
      config:
        preset: balanced
```

### 3.3 配置模型阵容

插件开箱自带一组默认 `ModelProfile`，全部指向 `dsh-llm-deepseek` 默认注册的 `deepseek-official` 路由，因此装上即可运行。要换成自己的阵容，覆盖 `profiles`：

```yaml
- insert:
    - id: dsh-multi-model-discussion
      name: dsh-multi-model-discussion
      config:
        preset: deep
        profiles:
          # 主导模型：决策 + 计划生成 + 最终答复
          - id: lead
            provider: deepseek-official
            model: deepseek-v4-pro
            role: decisionMaker
            label: 主导模型
            temperature: 0.2
            systemPrompt: 你是一位技术负责人，擅长在方案之间做取舍。

          # 同一 provider、同一 model，靠 temperature 与提示词分裂成两个提案者
          - id: proposer-bold
            provider: deepseek-official
            model: deepseek-v4-flash
            role: proposer
            temperature: 0.9
            systemPrompt: 你偏好激进、直接的落地路径。
          - id: proposer-cautious
            provider: deepseek-official
            model: deepseek-v4-flash
            role: proposer
            temperature: 0.2
            systemPrompt: 你会主动指出长期维护成本与边界情况。

          # 想混用别的厂商，就换 provider 路由
          - id: proposer-gpt
            provider: openai
            model: gpt-4o-mini
            role: proposer
            apiKeyRef: OPENAI_API_KEY

          - id: reviewer
            provider: deepseek-official
            model: deepseek-v4-pro
            role: reviewer

          - id: executor
            provider: deepseek-official
            model: deepseek-v4-flash
            role: executor
            temperature: 0
```

`apiKeyRef` 是**环境变量名**，不是密钥本身——密钥由 DSH 的凭证层按请求解析，不会写进配置文件。

### 3.4 全部配置项

| 键 | 默认值 | 说明 |
|---|---|---|
| `enabled` | `true` | 总开关。`false` 时插件加载但不工作 |
| `preset` | `balanced` | 默认研讨深度 |
| `profiles` | 见上 | 全部模型实例 |
| `budget.maxTotalTokens` | `2000000` | 总 token 上限，`0` 表示不限 |
| `budget.maxTotalCostUsd` | `5` | 总成本上限（USD） |
| `budget.maxDurationMs` | `900000` | 墙钟时长上限 |
| `budget.maxDiscussionRounds` | `3` | 讨论轮数上限 |
| `budget.maxProposers` | `5` | 单轮提案者数量上限 |
| `executor.allowedTools` | `[]` | 执行器可用工具白名单（精确匹配）。**默认空 = 无工具** |
| `executor.requireConfirmationForWrites` | `true` | 非只读工具是否需人工确认 |
| `executor.maxSteps` | `12` | 执行器最大轮数 |
| `overrides` | — | 显式指定 lead / proposers / reviewers / executor / verifier |
| `api.token` | — | HTTP 接口的 Bearer token（可选） |
| `pricing` | — | 覆盖价格表，键为 model id 前缀 |

### 三种预设

| 预设 | 阵容 | 说明 |
|---|---|---|
| `fast` | 1 提案 + 1 决策 + 1 执行 | 最省成本 |
| `balanced` | 3 提案 + 1 决策 + 1 执行 | 默认，能拿到真实分歧 |
| `deep` | 5 提案 + 交叉评审 + 决策 + 执行 + 验证 | 完整链路 |

---

## 4. 使用方式

### 4.1 通过工具发起（主要方式）

插件向模型注册了一个 `multi_model_discuss` 工具。模型判断问题值得多模型研讨时调用它，默认等待完成后把最终答复作为工具结果返回：

```jsonc
// 参数
{
  "request": "要为现有 Node 服务加一层缓存，需要考虑一致性与运维成本",
  "preset": "deep",     // 可选，覆盖默认
  "wait": true          // 可选，false 则立即返回 run id
}
```

### 4.2 讨论过程视图

插件在会话视图的标签环（`conversation.view`）里注册了一个「多模型研讨」标签页，三栏布局：

- **左栏**：当前阶段、参与模型实时状态（思考中 / 完成 / 失败）、通知流
- **中栏**：按阶段展示提案卡片、评审意见、决策记录、执行计划、执行结果、验证结论，以及**控制条**
- **右栏**：Token / 成本 / 耗时总计、预算消耗条、按模型拆分明细

控制条支持：**叫停**、**跳过评审**、**批准计划**、**强制采纳某个方案**。

> 匿名性在 UI 里同样保持：评审阶段提案只显示 `P1`/`P2`，作者要等决策产出后才揭示。

### 4.3 HTTP 接口

客户端标签页读的就是这些路由：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/dsh-mmd/handshake` | 探活与版本 |
| GET | `/dsh-mmd/profiles` | 已注册的 ModelProfile 与 provider |
| GET | `/dsh-mmd/runs` | 全部运行（最新在前） |
| GET | `/dsh-mmd/runs/:id` | 单次运行完整状态 |
| GET | `/dsh-mmd/events` | SSE：运行状态变更流 |
| POST | `/dsh-mmd/runs` | 发起运行 |
| POST | `/dsh-mmd/runs/:id/control` | 下发控制命令 |

所有**写**接口都强制同源校验（`Origin` 与 `Host` 不一致直接 403），可选再叠加 `api.token`。未挂载 HTTP 服务时（headless 组合）这些路由自动不注册，插件其余部分照常工作。

---

## 5. 构建与测试

```bash
npm install
npm run typecheck   # tsc --noEmit，覆盖 src 与 test
npm test            # 100 个测试（含端到端流水线集成测试）
npm run build       # Node 端 (tsc) + 浏览器端 (esbuild)
```

构建产物：

- `lib/index.js` — Node 端插件入口（`package.json#main`）
- `lib/client.js` — 浏览器端 bundle（`exports["./client"]`），**样式已内联**，不需要额外加载 CSS
- `lib/**/*.d.ts` — 类型声明，`.ts` 说明符已改写为 `.js`

测试分两层。**单元测试**覆盖不依赖 DSH 运行时的核心逻辑；**集成测试**把真实插件挂载进真实 Cordis 上下文，用 stub 的 LLM 层端到端跑完一次完整流水线（澄清 → 提案 → 评审 → 决策 → 计划 → 执行 → 验证 → 答复）。两层都可以在任何环境里真实运行。

| 测试文件 | 覆盖内容 |
|---|---|
| `state-machine.test.ts` | 转移合法性、回环唯一收敛到 deciding、settle、终态无出边 |
| `blackboard.test.ts` | 提案者隔离、匿名化与反查、revision、订阅容错 |
| `budget-guard.test.ts` | 各类上限触顶、轮次前置拒绝、提案者数量钳制 |
| `sandbox.test.ts` | 白名单精确匹配、拒绝理由、只读判定、需确认路径 |
| `roster.test.ts` | 按角色组装、缺角色即失败、显式覆盖、一个 Key 多实例 |
| `structured-output.test.ts` | 从散文/围栏中抽 JSON、字符串内花括号、形状校验 |
| `cost.test.ts` | 最长前缀定价、缓存计费、未定价模型如实标记 |
| `integration.test.ts` | 插件在真实 Cordis 下加载、服务注册、完整流水线跑通、轮次账本、成本归属、参与者状态收敛、缺角色拒绝、单提案者失败不致全局失败 |

---

## 6. 验收标准对照

| # | 验收标准 | 状态 | 实现位置 |
|---|---|---|---|
| 1 | 用户可以选择多个模型参与 | ✅ | `profiles` 配置 + preset |
| 2 | 每个模型可配置独立 API 与参数 | ✅ | `ModelProfile`（provider/baseURL/temperature/systemPrompt…） |
| 3 | 一个 API Key 可创建多个 ModelProfile | ✅ | 同 provider+model 多行，靠 role/temperature 区分；见 `roster.test.ts` |
| 4 | 多提案模型并行独立输出 | ✅ | `runProposals` 用 `Promise.allSettled` + 盲切片 |
| 5 | 主导模型读取提案并输出决策 | ✅ | `LeadModel.decide` + 决策完整性校验 |
| 6 | 主导模型生成结构化执行计划 | ✅ | `LeadModel.buildPlan` + 依赖与 `mutatesState` 校验 |
| 7 | 执行模型按计划执行 | ✅ | `Executor.execute` 受限工具循环 |
| 8 | 最终由主导模型汇总答复 | ✅ | `LeadModel.finalAnswer`（失败时降级为确定性摘要） |
| 9 | 可查看每个模型的耗时与 token 成本 | ✅ | `CostSummary` + 右侧成本面板 |
| 10 | 任一阶段失败可回到主导决策重新规划 | ✅ | `verifying → deciding`，回环次数受限 |

---

## 7. 已知限制

请在设计评审和部署时考虑以下几点。

### 7.1 客户端 UI 未在真实 DSH 环境中端到端验证

公开 npm 上的 `@deepseek-ai/dsh-client-*` 包版本（`0.0.1-rc.1` 量级）**滞后于**本插件对标的运行时（参考插件声明的是 `>=0.1.7-rc.2`），且其依赖树在公共 registry 上不完整（例如 `@deepseek-ai/dsh-compact` 不存在，导致 `dsh-client-runtime` 无法安装）。

因此 `src/client/` 的处理方式是：

- 槽位契约**按文档结构化声明**（`ctx.slots.inject` / `ctx.slots.register`），而不 import 那些版本的声明文件——那是拿一个无法验证的编译期保证去换一个会直接崩的硬版本耦合。
- 客户端代码通过 **tsc 与 esbuild 双重校验**（类型正确、可打包、自包含），但**没有在真实 DSH Web 界面中渲染验证过**。

Node 端（`src/` 其余部分）不受此影响：它的类型检查是对照**已安装的真实** `@deepseek-ai/cordis` / `dsh-llm` / `dsh-tools` 声明完成的。

**建议**：在目标 DSH 版本上首次运行时，先只验证 Node 端（工具调用、HTTP 接口），确认无误后再检查标签页渲染。若槽位 API 有出入，改动集中在 `src/client/index.ts` 一处。

### 7.2 未对接真实模型 Provider

完整流水线已用 **stub 的 LLM 层**端到端跑通（`test/integration.test.ts`，13 个用例），覆盖了状态机流转、并行提案、匿名评审、决策解析、计划执行、验证与最终答复的全链路。

但**没有**对接过真实 provider 做过一次真实的多模型研讨——沙箱环境缺少 DSH 运行时与可用的 API 凭证。因此未经验证的是：模型在真实提示词下的输出质量，以及各 provider 的实际延迟/限流行为。

### 7.3 成本价格是占位示例

`utils/cost.ts` 里的 `EXAMPLE_PRICES` 是**占位值**，仅用于让成本面板首次运行时有意义。Token 数来自 provider 的 `usage` 响应，是精确的；价格不是。未命中价格表的模型会报告 `costUsd: 0` 并标记为**未定价**，而不是被悄悄按 0 计算。请用 `pricing.overrides` 填入你账单上的真实费率。

### 7.4 其他

- **重新规划回环限 1 次**，修复重试限 1 次（`MAX_REPLANS` / `MAX_REPAIRS`）。设计文档允许的回环已实现，但次数是刻意收紧的；如需放开，改 `plugins/orchestrator.ts` 顶部两个常量。
- **执行器的写操作确认**：当前没有接交互式审批通道，因此需要确认的工具会被**跳过并如实报告为 skipped**，而不是静默放行。想无人值守执行写操作，需要显式把 `requireConfirmationForWrites` 设为 `false` 并自行承担风险。
- **设置页配置面板尚未实现**。模型阵容目前通过 `cordis.patch.yml` 配置。
- **运行态存储在内存中**，进程重启即丢失。需要持久化属于独立 persistence 插件的职责。

---

## 8. 设计要点速查

如果想快速理解"为什么这样写"，按这个顺序读：

1. `core/state-machine.ts` — 转移表就是协议本身
2. `core/blackboard.ts` 的 `sliceFor` — token 成本如何被结构性地控制住
3. `core/prompts.ts` — 系统的实际策略都在这里，集中一处便于审查
4. `plugins/orchestrator.ts` 的 `run()` — 自上而下读完即读完整个协议
5. `plugins/executor.ts` 文件头 — 为什么执行器要自建循环而不用 agent loop

## License

MIT
