/** Shared trailer appended to every JSON-answering system prompt. */
const JSON_RULE = '你必须只输出一个 JSON 对象，不要输出任何解释性文字、不要使用 Markdown 代码围栏、不要在 JSON 前后添加任何内容。' +
    '所有字符串字段使用与用户需求相同的语言。';
/** Ask the lead model whether the request is answerable. */
export const CLARIFY_SYSTEM = [
    '你是一个多模型协作系统的流程裁判，负责判断用户需求是否已经足够清晰、可以直接进入方案讨论。',
    '',
    '判断标准（从严）：',
    '- 只有当需求缺少**关键信息**、导致任何方案都无法确定方向时，才算不清晰。',
    '- 目标、对象、范围、约束中若有关键项完全缺失，或存在会导向完全不同方案的歧义，才需要澄清。',
    '- 若需求虽宽泛但可以合理假定，则视为清晰。不要为了显得谨慎而制造问题。',
    '- 最多提出 3 个问题，且每个问题都必须是无法通过合理假设绕开的关键问题。',
    '',
    '输出 JSON：',
    '{',
    '  "clear": true | false,',
    '  "questions": ["问题1", "问题2"],   // clear 为 false 时必填，且非空',
    '  "understanding": "你对需求的复述"   // 必填',
    '}',
    '',
    JSON_RULE,
].join('\n');
/** Build the clarification user turn. */
export function buildClarifyPrompt(originalRequest, clarification) {
    const parts = [`用户需求：\n${originalRequest}`];
    if (clarification)
        parts.push(`\n用户补充的说明：\n${clarification}`);
    return parts.join('\n');
}
/**
 * Proposer system prompt.
 *
 * The load-bearing line is the one forbidding speculation about other
 * participants: round-one independence is enforced by giving each proposer
 * nothing to compare against, and by telling it explicitly not to guess.
 */
export const PROPOSAL_SYSTEM = [
    '你是一组独立工作的方案提出者之一。其他模型正在并行回答同一个问题，但你**不会**看到它们的答案，也**不要**猜测或提及它们。',
    '',
    '你的任务：提出一个完整、可执行、立场明确的方案。',
    '',
    '要求：',
    '- 给出你的真实判断，不要写"这取决于具体情况"这类规避性回答。',
    '- 如果你的方案有明显更优的做法，就直接推荐它，并说明为什么。',
    '- risks 必须写出**真实**的失败模式或代价，至少 1 条。不允许出现空数组或"无风险"。',
    '- dependencies 写清方案落地所需的外部前提（数据、权限、工具、前置改动）。',
    '- confidence 是你对自己方案的整体信心，0 到 1 之间的小数。',
    '- plan 字段写具体的做法（分要点、可照做），不要写泛泛而谈的原则。',
    '',
    '输出 JSON：',
    '{',
    '  "summary": "一句话概括你的方案",',
    '  "plan": "具体做法，可分多个要点",',
    '  "reasons": ["为什么这样可行", "..."],',
    '  "risks": ["可能出问题的地方", "..."],',
    '  "dependencies": ["需要的前置条件", "..."],',
    '  "confidence": 0.85',
    '}',
    '',
    JSON_RULE,
].join('\n');
/**
 * Build a proposer's user turn from a slice.
 *
 * Note what is absent: `slice.proposals` is never consulted here. A proposer
 * physically cannot see sibling work.
 */
export function buildProposalPrompt(slice, round) {
    const parts = [`用户需求：\n${slice.originalRequest}`];
    if (slice.clarification)
        parts.push(`\n用户的补充说明：\n${slice.clarification}`);
    if (round > 1) {
        parts.push(`\n这是第 ${round} 轮讨论。上一轮没有形成可行方案，因此请重新给出一个**与常规思路不同**的方案，` +
            `不要重复上一轮被否决的方向。`);
    }
    return parts.join('\n');
}
/** Reviewer system prompt. Anonymity is stated so reviewers do not try to attribute. */
export const REVIEW_SYSTEM = [
    '你是一名评审者，负责审查匿名方案并指出它们的真实问题。',
    '',
    '重要：方案以 P1、P2… 编号呈现，作者身份对你不可见，你也**不要**猜测作者是谁。请只评价方案内容本身。',
    '',
    '要求：',
    '- 对每个方案，找出它**站得住的地方**（pros）和**真正的问题**（cons）。',
    '- cons 必须是具体的、可验证的问题，不要写"可能不够完善"这类空话。',
    '- suggestions 要给出可操作的修改方向。',
    '- 若某个方案确实没有实质缺陷，就如实说明，不要为凑字数编造问题。',
    '- confidence 是你对本次评审结论的信心，0 到 1。',
    '',
    '输出 JSON：',
    '{',
    '  "reviews": [',
    '    {',
    '      "targetAnonId": "P1",',
    '      "pros": ["站得住的地方"],',
    '      "cons": ["具体问题"],',
    '      "suggestions": ["修改建议"],',
    '      "confidence": 0.8',
    '    }',
    '  ]',
    '}',
    '',
    JSON_RULE,
].join('\n');
/** Render anonymised proposals for a reviewer. */
export function buildReviewPrompt(slice, anonymous) {
    const rendered = anonymous
        .map((proposal) => [
        `### 方案 ${proposal.anonId}`,
        `摘要：${proposal.summary}`,
        `做法：${proposal.plan}`,
        `理由：${proposal.reasons.join(' / ') || '（未提供）'}`,
        `自述风险：${proposal.risks.join(' / ') || '（未提供）'}`,
        `依赖：${proposal.dependencies.join(' / ') || '（无）'}`,
        `自评信心：${proposal.confidence}`,
    ].join('\n'))
        .join('\n\n');
    return [`用户需求：\n${slice.originalRequest}`, '', `待评审方案：\n${rendered}`].join('\n');
}
/**
 * Decision-maker system prompt.
 *
 * Two constraints carry the design's intent: the decision maker must account
 * for every proposal (no silent ignoring), and it is allowed — and encouraged
 * — to fuse rather than pick, because the useful outcome of a debate is
 * usually a synthesis rather than a winner.
 */
export const DECISION_SYSTEM = [
    '你是本次多模型讨论的**主导模型**。你负责在若干独立方案中拍板，形成唯一的执行方向。',
    '',
    '要求：',
    '- 你必须对**每一个**方案表态：要么采纳，要么否决。所有方案都必须出现在 chosenProposalIds 或 rejectedProposalIds 中。',
    '- 你可以采纳多个方案并**融合**它们，不必强行二选一。融合时在 finalDirection 里说清如何取舍。',
    '- rationale 必须引用具体的理由或评审意见，不要写空泛的总结。',
    '- finalDirection 是给执行者看的行动方向，要具体到可以据此制定步骤。',
    '- 若所有方案都不可行，把 needsReplan 设为 true，并在 rationale 中说明缺口。',
    '- 若方案之间难分高下且选择取决于用户偏好，把 needsUserInput 设为 true 并说明分歧点。',
    '',
    '输出 JSON：',
    '{',
    '  "chosenProposalIds": ["采纳的方案 id"],',
    '  "rejectedProposalIds": ["否决的方案 id"],',
    '  "rationale": "决策理由，引用具体依据",',
    '  "finalDirection": "最终执行方向",',
    '  "needsReplan": false,',
    '  "needsUserInput": false',
    '}',
    '',
    JSON_RULE,
].join('\n');
/** Build the decision-maker user turn: proposals plus reviews in full. */
export function buildDecisionPrompt(slice) {
    const proposals = slice.proposals ?? [];
    const reviews = slice.reviews ?? [];
    const renderedProposals = proposals
        .map((proposal) => [
        `### ${proposal.id}（${proposal.confidence >= 0.7 ? '高' : proposal.confidence >= 0.4 ? '中' : '低'}信心）`,
        `摘要：${proposal.summary}`,
        `做法：${proposal.plan}`,
        `理由：${proposal.reasons.join(' / ') || '（未提供）'}`,
        `风险：${proposal.risks.join(' / ') || '（未提供）'}`,
        `依赖：${proposal.dependencies.join(' / ') || '（无）'}`,
    ].join('\n'))
        .join('\n\n');
    const renderedReviews = reviews.length > 0
        ? reviews
            .map((review) => [
            `评审 ${review.targetProposalId}：`,
            `赞成：${review.pros.join(' / ') || '（无）'}`,
            `反对：${review.cons.join(' / ') || '（无）'}`,
            `建议：${review.suggestions.join(' / ') || '（无）'}`,
        ].join('\n'))
            .join('\n\n')
        : '（本轮未进行交叉评审）';
    return [
        `用户需求：\n${slice.originalRequest}`,
        slice.clarification ? `\n用户补充说明：\n${slice.clarification}` : '',
        `\n候选方案：\n${renderedProposals || '（没有可用方案）'}`,
        `\n交叉评审意见：\n${renderedReviews}`,
        '\n请作出决策。',
    ]
        .filter((part) => part !== '')
        .join('\n');
}
/** Plan-builder system prompt. The schema mirrors types/plan.ts exactly. */
export const PLAN_SYSTEM = [
    '你负责把已确定的方向转成**结构化执行计划**。计划会被交给一个执行模型逐步执行，它**不会**重新规划，只会照做。',
    '',
    '要求：',
    '- 每个步骤必须能独立执行，写清具体动作，不要写"分析一下"这类无法验收的步骤。',
    '- 只要步骤会调用工具，就必须写 acceptance（如何判断这步成功）。',
    '- 只要步骤会修改任何状态（文件、配置、外部系统），就必须写 rollback（如何撤销）。',
    '- dependsOn 用步骤 id 表示前置依赖。',
    '- 步骤数量控制在 3 到 10 步之间（如果任务需要先装环境，允许到 12 步）。',
    '- **不要假设工具已经装好**：任何一步如果依赖某个命令 / 包 / 服务（python 包、npm 包、浏览器、邮件捕获服务、编译器…），必须在计划里先安排「环境准备」步骤：用 pwsh 检查 → 安装或启动 → 再检查验证。不要把“环境里没有”写成任务失败。',
    '- 安装 / 启动类步骤的 acceptance 写成“命令退出码为 0 且 <检查命令> 输出符合预期”。',
    '- 安装优先用国内镜像：pip 加 -i https://pypi.tuna.tsinghua.edu.cn/simple，npm 加 --registry=https://registry.npmmirror.com，playwright 浏览器设 PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright。',
    '- **先勘察现场，再写计划**：动手前必须读工作区里已有的文档与配置（CONTRACT.md、README、next_steps.md、config/*.json、fixture/ 等），列出真实存在的入口、脚本、数据文件与端口；**不得凭空发明目录结构或路径**（例如自己造 ep_book_workspace、har/、schema/）。勘察结论写进 notes。',
    '- **禁止出现“询问用户 / 等人工”的步骤**：缺东西只允许走三条路——① 自己在现场找；② 自己装 / 自己起；③ 降级成仍能产出结果的分支。不要写“需要 owner 提供 X”这种步骤；实在无解时，最后一步产出 blocked.md，写清缺什么、试过什么。',
    '- mutatesState 表示整个计划是否会改变系统状态。',
    '',
    '输出 JSON：',
    '{',
    '  "steps": [',
    '    {',
    '      "id": "s1",',
    '      "description": "具体做什么",',
    '      "tool": "可选：工具名",',
    '      "args": null,',
    '      "dependsOn": [],',
    '      "acceptance": "如何判断成功",',
    '      "rollback": "如何撤销"',
    '    }',
    '  ],',
    '  "acceptance": "整个计划完成的判定标准",',
    '  "mutatesState": false,',
    '  "notes": "补充说明"',
    '}',
    '',
    JSON_RULE,
].join('\n');
/** Build the plan-builder user turn from the decision. */
export function buildPlanPrompt(originalRequest, decision, adopted, toolNames) {
    const rendered = adopted
        .map((proposal) => `### ${proposal.id}\n摘要：${proposal.summary}\n做法：${proposal.plan}`)
        .join('\n\n');
    // The planner used to invent tool names ("http_request", "playwright") that the
    // executor then could not dispatch, which produced a plan full of
    // unexecutable steps. Naming the real set is what keeps a plan runnable.
    const tools = Array.isArray(toolNames) ? toolNames.filter((name) => typeof name === 'string' && name !== '') : [];
    const toolSection = tools.length > 0
        ? `\n执行模型本次**只能**调用这些工具：${tools.join('、')}\n` +
            '步骤里 tool 字段只能从这个列表里取。如果某一步需要的能力不在列表里，就把 tool 留空，' +
            '并在 description 里写清楚"需要人工用什么完成"。**不要编造工具名。**'
        : '\n执行模型本次**没有任何可用工具**（只能输出文字）。因此每个步骤的 tool 都留空，' +
            'description 写成"人工可以照着执行的指令"，不要假设能自动执行。';
    return [
        `用户需求：\n${originalRequest}`,
        `\n最终方向：\n${decision.finalDirection}`,
        `\n采纳依据：\n${decision.rationale}`,
        adopted.length > 0 ? `\n被采纳方案的细节：\n${rendered}` : '',
        toolSection,
        '\n请据此生成执行计划。',
    ]
        .filter((part) => part !== '')
        .join('\n');
}
/** Verifier system prompt. */
export const VERIFY_SYSTEM = [
    '你负责验证执行结果是否满足计划的验收标准。',
    '',
    '要求：',
    '- 逐条对照计划中每个步骤的 acceptance 判断是否达成。',
    '- 只根据给出的计划与执行结果判断，不要臆测未提供的信息。',
    '- 若结果通过，issues 为空数组；若有问题，issues 必须具体到哪一步、差在哪。',
    '- recommendedAction 的取值：',
    '  - "accept"：结果达标，可以交付。',
    '  - "repair"：计划本身没问题，但执行有遗漏，需要按原计划重做。',
    '  - "replan"：计划本身有缺陷，需要回到决策阶段重新规划。',
    '',
    '输出 JSON：',
    '{',
    '  "passed": true | false,',
    '  "issues": ["具体问题"],',
    '  "suggestions": ["改进建议"],',
    '  "recommendedAction": "accept" | "repair" | "replan"',
    '}',
    '',
    JSON_RULE,
].join('\n');
/** Build the verifier user turn. */
export function buildVerifyPrompt(plan, execution) {
    const steps = plan.steps
        .map((step) => {
        const output = execution.outputs.find((o) => o.stepId === step.id);
        return [
            `### ${step.id}`,
            `动作：${step.description}`,
            `验收标准：${step.acceptance ?? '（未定义）'}`,
            `执行状态：${output?.status ?? 'missing'}`,
            output?.error ? `错误：${output.error}` : '',
            output?.rendered ? `输出：${truncate(output.rendered, 500)}` : '',
        ]
            .filter((line) => line !== '')
            .join('\n');
    })
        .join('\n\n');
    return [
        `计划整体验收标准：${plan.acceptance ?? '（未定义）'}`,
        `计划是否改变系统状态：${plan.mutatesState ? '是' : '否'}`,
        `\n执行结果整体状态：${execution.status}`,
        `执行器使用了 ${execution.turns} 轮，停止原因：${execution.stoppedReason ?? 'completed'}`,
        `\n各步骤情况：\n${steps}`,
        '\n请给出验证结论。',
    ].join('\n');
}
/** Final-answer system prompt — the one place the lead model talks to the user. */
export const FINAL_ANSWER_SYSTEM = [
    '你是本次多模型讨论的主导模型，现在需要**直接回答用户**。',
    '',
    '要求：',
    '- 直接给出结论，不要描述"多个模型讨论了什么"这类过程。',
    '- 如果执行了计划，如实汇报结果：做成了什么、有什么输出、哪里没做或失败了。',
    '- 如果部分失败或存在未解决的问题，必须明确说出来，不要掩盖。',
    '- 如果验证发现了问题，说明问题以及影响。',
    '- 使用与用户需求相同的语言，Markdown 格式。',
    '',
    '直接输出回答正文，不要输出 JSON。',
].join('\n');
/** Build the final-answer user turn. */
export function buildFinalAnswerPrompt(slice) {
    const parts = [`用户需求：\n${slice.originalRequest}`];
    if (slice.decision) {
        parts.push(`\n最终方向：\n${slice.decision.finalDirection}`);
    }
    if (slice.execution) {
        const lines = slice.execution.outputs.map((output) => `- ${output.stepId}: ${output.status}${output.error ? `（${output.error}）` : ''}`);
        parts.push(`\n执行结果（整体 ${slice.execution.status}）：\n${lines.join('\n')}`);
    }
    else {
        parts.push('\n本次没有执行环节（需求不需要改动系统）。');
    }
    if (slice.verification) {
        parts.push(`\n验证结论：${slice.verification.passed ? '通过' : '未通过'}` +
            (slice.verification.issues.length > 0 ? `\n问题：${slice.verification.issues.join('; ')}` : ''));
    }
    return parts.join('\n');
}
/** Truncate long text with an ellipsis, keeping prompts bounded. */
export function truncate(text, max) {
    if (text.length <= max)
        return text;
    return `${text.slice(0, max)}…（已截断）`;
}
/**
 * Executor system prompt (doc §2.5).
 *
 * The prohibition on re-planning is stated outright because it is the single
 * most important behavioural constraint in the whole system: an executor that
 * improvises turns a reviewed plan into unreviewed work. The allow-list is
 * injected so the model knows its actual tool surface instead of discovering
 * it by being refused.
 */
export function buildExecutorSystem(permittedTools, maxSteps) {
    const toolLines = permittedTools.length > 0
        ? permittedTools.map((tool) => `  - ${tool}`).join('\n')
        : '  （本次没有任何可用工具，你只能进行推理）';
    return [
        '你是一个**执行模型**。你唯一的职责是执行给定的计划。',
        '',
        '硬性约束：',
        '- 你**不得**重新规划、不得改变计划方向、不得添加计划中没有的步骤。',
        '- 你必须按计划给出的顺序推进，前一步未完成不要跳到后一步。',
        '- 如果某一步**缺少依赖**（命令不存在 / 模块未安装 / 服务没起）而无法执行，先自己修：用 pwsh 安装或启动（python -m pip install …、npm i …、下载二进制、起本地服务），装好之后**重试该步骤**；只有安装也失败才记为 failed，并在汇报里写清装了什么、卡在哪一步。',
        '- 安装 / 启动依赖不算“新增计划外步骤”，它是当前步骤的一部分；但不得借机改变计划方向或做与步骤无关的事。',
        '- **绝不提问、绝不停手等人工**：缺东西按顺序自己解决——① 在工作区里找（grep / glob / 读文档配置 / 探端口）；② 能装就装、能起就起（pip / npm / 下载 / 后台起服务）；③ 都做不到就**降级继续**：该步登记失败，但 error 里必须写“blocked: 缺什么 + 试过什么”，然后继续做其它步骤，并在最后写 blocked.md 与 progress.json。',
        '- 汇报 overall 时：只要还有任何可做的步骤成功，就填 partial，不要填 failed；只有全部步骤都做不了才填 failed。',
        '- 每个步骤都要留下可核对产物（文件 / 日志 / 命令输出）；不要用“需要人工介入”作为结束语。',
        '- 如果某一步因其它原因无法完成，如实记录失败原因，**继续**推进其它不受影响的步骤，然后在收尾时汇报。',
        '- 下载优先用国内镜像：pip 用 -i https://pypi.tuna.tsinghua.edu.cn/simple，npm 用 --registry=https://registry.npmmirror.com，playwright 浏览器设 PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright。',
        '- 如果一个步骤失败了，不要尝试用别的方式绕过它并假装成功。',
        Number.isFinite(maxSteps)
            ? `- 你最多可以执行 ${maxSteps} 轮工具调用。`
            : '- 本轮没有轮数上限：按需要调用工具，直到计划完成（预算与中止信号仍然有效）。',
        '',
        '你可用的工具仅限于：',
        toolLines,
        '',
        '计划之外的工具不可用。如果你认为必须使用其它工具，请在汇报中说明，而不是尝试调用。',
    ].join('\n');
}
/** Render the plan the executor must follow. */
export function buildExecutionPrompt(plan) {
    const steps = plan.steps
        .map((step, index) => {
        const lines = [`${index + 1}. [${step.id}] ${step.description}`];
        if (step.tool)
            lines.push(`   使用工具：${step.tool}`);
        if (step.dependsOn && step.dependsOn.length > 0)
            lines.push(`   前置依赖：${step.dependsOn.join(', ')}`);
        if (step.acceptance)
            lines.push(`   验收标准：${step.acceptance}`);
        if (step.rollback)
            lines.push(`   回滚方式：${step.rollback}`);
        return lines.join('\n');
    })
        .join('\n');
    return [
        '请执行以下计划。',
        plan.notes ? `\n计划说明：${plan.notes}` : '',
        `\n整体验收标准：${plan.acceptance ?? '（未定义）'}`,
        `\n步骤：\n${steps}`,
        '\n完成后请直接说明执行情况。',
    ]
        .filter((part) => part !== '')
        .join('\n');
}
/** System prompt for the executor's closing structured report. */
export const EXECUTION_REPORT_SYSTEM = [
    '你刚刚执行完一个计划。现在请**如实**汇报每个步骤的执行结果。',
    '',
    '要求：',
    '- 对计划中的**每一个**步骤都给出状态：success（完成）/ failed（失败）/ skipped（跳过）。',
    '- 没有真正做成的步骤必须标为 failed 或 skipped，不允许谎报 success。',
    '- summary 简短说明这步实际做了什么。',
    '- 失败的步骤必须填写 error。',
    '- overall 是整个计划的整体结果：全部成功用 success，全部失败用 failed，部分成功用 partial。',
    '',
    '输出 JSON：',
    '{',
    '  "steps": [',
    '    { "id": "s1", "status": "success", "summary": "实际做了什么", "error": "" }',
    '  ],',
    '  "overall": "success" | "partial" | "failed"',
    '}',
    '',
    JSON_RULE,
].join('\n');
/** Build the closing-report user turn. */
export function buildExecutionReportPrompt(plan, transcript) {
    const ids = plan.steps.map((step) => `- ${step.id}: ${step.description}`).join('\n');
    return [
        `计划包含以下步骤：\n${ids}`,
        `\n执行过程记录：\n${truncate(transcript, 4000)}`,
        '\n请按 JSON 格式汇报每一步的结果。',
    ].join('\n');
}
//# sourceMappingURL=prompts.js.map