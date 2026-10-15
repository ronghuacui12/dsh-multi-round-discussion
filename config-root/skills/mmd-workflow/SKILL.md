---
name: mmd-workflow
description: 研讨模式的操作手册。当用户要求多模型研讨、让多个模型一起讨论、评审方案，或需要"先出方案再讨论、我批准后才执行"时使用；也用于首次配置 leader / 提案者 / 执行者的模型与 API。
---

# 研讨模式操作手册

本 preset 挂载了 `dsh-multi-model-discussion` 插件，它提供：

- 一个 `multi_model_discuss` 工具——发起一次完整研讨；
- 一组 HTTP 路由（`/dsh-mmd/...`）——给界面标签页和脚本用。

状态机是插件里实现的，不是靠提示词自觉。它长这样：

```
澄清 → [等用户] → (提案 → [评审] → 决策)* → 计划 → 【等你批准】
     → 执行 → [验收 → (修复 | 重新决策)]* → 汇总 → 完成
```

## 一、首次配置：三个角色的模型

研讨需要三类角色才能跑：`decisionMaker`（leader）、至少一个 `proposer`、一个 `executor`。

### 1. 先看现在注册了什么

```bash
curl -s http://127.0.0.1:<端口>/dsh-mmd/profiles
```

端口看 DSH 启动日志里打印的 URL。返回里的 `provider` 字段就是已注册的路由名。默认会有 `deepseek-official`（由 `dsh-llm-deepseek` 注册）。

### 2. 要用别的厂商，先在 profile 层注册路由

provider 路由属于 host 平面，写进 `~/.dsh/profiles/desktop/cordis.patch.yml`，和现有的 `zai` / `gemini` 并列：

```yaml
- id: llm-pi-ai
  config:
    providers:
      glm:
        displayName: glm
        apiKeyEnv: GLM_API_KEY          # 环境变量名，不是密钥本身
        api: openai-completions
        baseURL: https://open.bigmodel.cn/api/paas/v4
        models:
          - id: glm-5.3
            name: glm-5.3
```

改完 profile 会热重载。**密钥只以环境变量名出现**——DSH 的凭证层按请求解析，明文永不进配置。先设好变量：

```bash
export GLM_API_KEY=...      # 或写进系统的环境变量设置
```

### 3. 把角色写进 roster.json

`${DSH_HOME:-$HOME/.dsh}/.agent-presets/mmd-discussion/roster.json` 的 `profiles` 数组，每行一个参与实例：

```json
{"id": "lead", "role": "decisionMaker", "provider": "deepseek-official", "model": "deepseek-v4-pro",
 "label": "主导模型", "systemPrompt": "你是技术负责人，负责拍板。"}
```

| 字段 | 说明 |
|---|---|
| `role` | `decisionMaker` / `proposer` / `reviewer` / `executor` / `verifier` |
| `provider` | 已注册的路由名（profile 层注册的那个） |
| `model` | 传给该路由的模型 id |
| `label` | 界面显示名 |
| `systemPrompt` | 这个实例的角色框定——**这才是把同款模型区分成不同参与者的东西** |
| `apiKeyRef` | 可选。仅当该路由需要单独指定密钥环境变量时用 |

提案者数量随意（1–5，上限由 `budget.maxProposers` 兜）。**改完要新开会话或重载 preset 才生效**——`profiles` 是挂载时读入的。

## 二、发起一次研讨

```
用多模型研讨分析一下「<你的需求>」，preset 用 balanced
```

或直接调工具：

```json
{"request": "<需求原文>", "preset": "balanced", "wait": true}
```

档位：`fast`（1 提案） / `balanced`（3 提案 + 评审） / `deep`（5 提案 + 双评审 + 验证）。

## 三、审批门禁：这是本 preset 存在的主要理由

计划里只要有**任何会改变系统状态的步骤**，运行就会停在 `awaiting_approval`，并挂出 `pendingQuestion`：

> 该计划包含会改变系统状态的操作，是否批准执行？
> - <步骤 1>
> - <步骤 2>

这是插件里的硬门禁，`executor.requireConfirmationForWrites: true` 就是它的开关（**不要改成 false**）。行为：

| 你下发 | 结果 |
|---|---|
| `approve-plan` | 按计划执行 |
| `edit-plan`（带修改后的计划） | 按修改后的计划执行 |
| `stop` | 终止，不执行 |
| 其它任何命令 | **视为未批准，直接结束运行，不执行** |

所以正确做法是：**把 `pendingQuestion` 原文给用户看，等他明确点头，再下发 `approve-plan`。** 不自动批准、不替他判断哪些步骤无所谓、不因"上一次批准过"就跳过这一次。

下发控制命令：

```bash
curl -s -X POST http://127.0.0.1:<端口>/dsh-mmd/runs/<runId>/control \
  -H 'content-type: application/json' \
  -H "Origin: http://127.0.0.1:<端口>" \
  -d '{"kind":"approve-plan"}'
```

其它可用控制：`skip-review`（跳过评审）、`force-adopt`（强制采纳某个方案）、`stop`、`supply-clarification`（补答澄清问题）。

> 写接口强制同源校验：`Origin` 与 `Host` 不一致会直接 403。非浏览器客户端可以不发 `Origin`。

## 四、执行模型的工具范围

`agent.cordis.yml` 里 `executor.allowedTools` 是**精确匹配的白名单**，默认只放了只读工具：

```yaml
allowedTools:
  - read
  - glob
  - grep
```

想让执行模型真的动手改代码，把 `write` / `edit` 加进去。要注意：

- 不在白名单里的工具，**模型根本看不到**（schema 阶段就被移除），不是"看到但被拒"。
- 白名单里的写工具仍需计划被批准才会被调用——门禁在计划层，不在工具层。
- `partial` / `skipped` 是会被如实报告的，不会伪装成 `done`。

## 五、看研讨过程

- **界面**：会话视图标签环里的「多模型研讨」标签页（三栏：参与模型状态 / 阶段产出与控制条 / 成本明细）。
- **接口**：`GET /dsh-mmd/runs`（列表）、`GET /dsh-mmd/runs/<id>`（单次完整状态）、`GET /dsh-mmd/events`（SSE 事件流）。
- **自检**：`GET /dsh-mmd/handshake` 应返回 `{"ok":true,...}`。返回 404 说明插件的 HTTP 路由没挂上——先确认 host 侧的 `dsh-host-webserver` 在跑。
