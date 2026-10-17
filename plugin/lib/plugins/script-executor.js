/**
 * Deterministic execution: run the plan's own script instead of asking a model
 * to imitate a shell one tool call at a time.
 *
 * The failure mode this replaces is the one that made every run a coin flip:
 * an LLM executor improvising commands, dropping steps, or handing work back to
 * the operator. Here the model writes \`run.ps1\` and \`check.ps1\` once, the
 * operator approves them, and the plugin then just runs them and reports the
 * exit code. A failure is a line number in a log, not a lost round.
 *
 * Everything the run needs is materialised under \`~/.dsh/mmd/runs/<runId>/\` so the
 * operator can re-run the script by hand, diff it, or keep it as an artifact.
 *
 * @module dsh-multi-model-discussion/plugins/script-executor
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { mmdHome } from '../host/user-settings.js';

/** How much of a stream to keep in the run state (the full text stays on disk). */
const TAIL = 6000;
/** Default wall clock allowance for one script. */
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

/** Directory holding one folder per run's scripts and logs. */
export function scriptDir(runId) {
    return path.join(mmdHome(), 'runs', runId);
}

/** Prefix that makes a PowerShell script deterministic and UTF-8 clean. */
const PREAMBLE = [
    "$ErrorActionPreference = 'Stop'",
    "$ProgressPreference = 'SilentlyContinue'",
    "try { [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false) } catch { }",
    "try { $OutputEncoding = [Text.UTF8Encoding]::new($false) } catch { }",
    "$env:PYTHONUTF8 = '1'",
    "$env:PYTHONIOENCODING = 'utf-8'",
    '',
].join('\n');

/** Keep the tail of a long stream; the whole thing is on disk. */
function tail(text, max = TAIL) {
    if (typeof text !== 'string')
        return '';
    return text.length <= max ? text : '…（前略，完整日志见文件）\n' + text.slice(-max);
}

/**
 * Pick a PowerShell that actually runs on this host.
 *
 * \`pwsh\` may be a Windows Store execution-alias stub that exits with -4058 when
 * PowerShell 7 is not installed, so resolution is by probe rather than by name.
 */
let cachedShell;
function resolveShell() {
    if (cachedShell !== undefined)
        return cachedShell;
    for (const exe of ['pwsh', 'powershell.exe']) {
        try {
            const probe = spawnSync(exe, ['-NoProfile', '-NonInteractive', '-Command', 'exit 0'], { timeout: 20000, windowsHide: true });
            if (probe.status === 0) {
                cachedShell = exe;
                return cachedShell;
            }
        }
        catch {
            // Try the next candidate.
        }
    }
    cachedShell = 'powershell.exe';
    return cachedShell;
}

/**
 * Run one PowerShell file and capture its streams.
 *
 * `pwsh` (7+) is preferred, `powershell.exe` (5.1) is the fallback so this works
 * on a stock Windows box without PowerShell 7 installed.
 */
function runPowerShell(file, cwd, timeoutMs, signal) {
    return new Promise((resolve) => {
        const exe = resolveShell();
        const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file];
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            resolve(value);
        };
        const child = spawn(exe, args, { cwd, windowsHide: true, env: { ...process.env } });
        child.stdout?.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
        child.stderr?.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
        const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
        const onAbort = () => { child.kill(); };
        signal?.addEventListener('abort', onAbort, { once: true });
        child.on('error', (cause) => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            finish({ exitCode: null, stdout, stderr: stderr + '\n[启动失败] ' + cause.message, timedOut: false, aborted: false });
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            finish({ exitCode: code, stdout, stderr, timedOut, aborted: signal?.aborted === true });
        });
    });
}

export class ScriptExecutor {
    logger;
    onNotice;
    onParticipant;
    constructor(options = {}) {
        this.logger = options.logger;
        this.onNotice = options.onNotice ?? (() => { });
        this.onParticipant = options.onParticipant ?? (() => { });
    }
    /**
     * Materialise and run the plan's scripts.
     *
     * @param plan - must carry `script.run` (and usually `script.check`).
     * @param profile - the executor profile, used only for attribution.
     * @param signal - run cancellation.
     * @param runId - the run whose folder holds the artifacts.
     * @returns an ExecutionResult shaped like the agent executor's.
     */
    async execute(plan, profile, signal, runId) {
        const script = plan.script;
        if (!script || typeof script.run !== 'string' || script.run.trim() === '') {
            throw new Error('这个计划没有携带可执行脚本（script.run 为空）。');
        }
        const dir = scriptDir(runId);
        fs.mkdirSync(dir, { recursive: true });
        const runPath = path.join(dir, 'run.ps1');
        const checkPath = path.join(dir, 'check.ps1');
        // The BOM matters: Windows PowerShell 5.1 decodes a BOM-less .ps1 as ANSI,
        // which turns any Chinese text into a parser error.
        fs.writeFileSync(runPath, '\uFEFF' + PREAMBLE + script.run.replace(/^\uFEFF/, ''), 'utf8');
        const hasCheck = typeof script.check === 'string' && script.check.trim() !== '';
        if (hasCheck)
            fs.writeFileSync(checkPath, '\uFEFF' + PREAMBLE + script.check.replace(/^\uFEFF/, ''), 'utf8');

        this.onParticipant(profile.id, { state: 'thinking', phase: 'executing', startedAt: Date.now(), error: undefined });
        this.onNotice({ level: 'info', message: `执行脚本已写入 ${dir}（run.ps1${hasCheck ? ' + check.ps1' : ''}）` });

        const timeoutMs = Number.isFinite(plan.script.timeoutMs) ? plan.script.timeoutMs : DEFAULT_TIMEOUT_MS;
        const run = await runPowerShell(runPath, dir, timeoutMs, signal);
        const runStdout = tail(run.stdout);
        const runStderr = tail(run.stderr);
        fs.writeFileSync(path.join(dir, 'run.log'), `exit=${String(run.exitCode)}\n--- stdout ---\n${run.stdout}\n--- stderr ---\n${run.stderr}\n`, 'utf8');

        let check;
        const runFailed = run.exitCode !== 0 || run.timedOut || run.aborted;
        if (runFailed) {
            this.onParticipant(profile.id, { state: 'error', phase: 'executing', error: `脚本退出码 ${String(run.exitCode)}`, finishedAt: Date.now() });
        }
        else if (hasCheck && !signal?.aborted) {
            this.onNotice({ level: 'info', message: '主脚本执行完成，开始跑验收脚本。' });
            check = await runPowerShell(checkPath, dir, Math.min(timeoutMs, 5 * 60 * 1000), signal);
            fs.writeFileSync(path.join(dir, 'check.log'), `exit=${String(check.exitCode)}\n--- stdout ---\n${check.stdout}\n--- stderr ---\n${check.stderr}\n`, 'utf8');
        }
        if (!runFailed && (!check || check.exitCode === 0))
            this.onParticipant(profile.id, { state: 'done', phase: 'executing', finishedAt: Date.now() });

        const status = run.aborted || signal?.aborted
            ? 'failed'
            : runFailed
                ? 'failed'
                : check
                    ? (check.exitCode === 0 ? 'success' : 'partial')
                    : 'success';
        const outputs = [
            {
                stepId: 'script:run',
                status: runFailed ? 'failed' : 'success',
                ...(run.exitCode !== 0 ? { error: tail(runStderr, 1200) || `退出码 ${String(run.exitCode)}` } : {}),
                rendered: runStdout,
            },
            ...(check
                ? [{
                    stepId: 'script:check',
                    status: check.exitCode === 0 ? 'success' : 'failed',
                    ...(check.exitCode !== 0 ? { error: tail(check.stderr, 1200) || tail(check.stdout, 1200) || `退出码 ${String(check.exitCode)}` } : {}),
                    rendered: tail(check.stdout),
                }]
                : []),
        ];
        return {
            planId: plan.id,
            status,
            outputs,
            executorProfileId: profile.id,
            turns: 1,
            stoppedReason: run.aborted ? 'aborted' : run.timedOut || check?.timedOut ? 'max-steps' : runFailed ? 'error' : 'completed',
            script: {
                dir,
                runPath,
                checkPath: hasCheck ? checkPath : undefined,
                exitCode: run.exitCode,
                timedOut: run.timedOut,
                runStdout,
                runStderr,
                ...(check ? { checkExitCode: check.exitCode, checkOutput: tail(check.stdout), checkError: tail(check.stderr) } : {}),
            },
        };
    }
}
