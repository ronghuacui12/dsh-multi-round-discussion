/**
 * A short, read-only map of the working directory.
 *
 * Why this exists: the discussion models only ever see the user's sentence. With
 * no view of the disk they invented paths that do not exist (ep_book_workspace/,
 * har/, schema/) and planned nine steps against them; the executor then honestly
 * failed every one. A dozen lines of the real layout is enough to keep plans on
 * real files — and it costs almost nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
const SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__', '.venv', 'dist', 'build', '.pytest_cache', '.idea', '.vscode']);
const DOC_NAMES = ['CONTRACT.md', 'README.md', 'next_steps.md', 'AGENTS.md', 'AI_HANDOFF.md', 'README.txt'];
const MAX_TOP = 24;
const MAX_DOCS = 12;
/** The first meaningful line of a markdown file, trimmed to one line. */
function firstLine(file) {
    try {
        const text = fs.readFileSync(file, 'utf8').slice(0, 4000);
        for (const raw of text.split(/\r?\n/)) {
            const line = raw.trim();
            if (line === '' || line.startsWith('' + String.fromCharCode(96, 96, 96)) || line.startsWith('|'))
                continue;
            return line.replace(/^#+\s*/, '').slice(0, 100);
        }
    }
    catch {
        // An unreadable doc simply contributes no hint.
    }
    return '';
}
/** Build the brief. Never throws: a failed read yields a shorter brief. */
export function buildWorkspaceBrief(cwd = process.cwd()) {
    const lines = [
        '【工作区现场（插件自动采集：写计划时以这里的真实路径为准，不要凭空发明目录）】',
        '工作目录: ' + cwd,
    ];
    let entries;
    try {
        entries = fs.readdirSync(cwd, { withFileTypes: true });
    }
    catch {
        return lines.join('\n');
    }
    const dirs = entries.filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name)).map((e) => e.name + '/').sort();
    const files = entries.filter((e) => e.isFile()).map((e) => e.name).sort();
    lines.push('顶层目录: ' + (dirs.slice(0, MAX_TOP).join(', ') || '（无）'));
    lines.push('顶层文件: ' + (files.slice(0, MAX_TOP).join(', ') || '（无）'));
    const docs = [];
    for (const dir of dirs) {
        if (docs.length >= MAX_DOCS)
            break;
        for (const name of DOC_NAMES) {
            const file = path.join(cwd, dir.slice(0, -1), name);
            if (!fs.existsSync(file))
                continue;
            const title = firstLine(file);
            docs.push(dir.slice(0, -1) + '/' + name + (title ? ' → ' + title : ''));
            break;
        }
    }
    if (docs.length > 0)
        lines.push('项目文档: ' + docs.join(' ｜ '));
    lines.push('提醒: 先读这些目录和文档再写计划；不存在的东西要么自己装、自己起，要么降级继续——不要写「等人工提供」。');
    return lines.join('\n');
}
