/**
 * Run persistence.
 *
 * The live registry is in-memory by design -- runs hold abort controllers,
 * gates and budget guards that cannot be serialised. But the *record* of a
 * discussion is exactly the thing a user wants back tomorrow, and losing it on
 * restart made every past discussion unreachable.
 *
 * So this module keeps a write-behind copy of each run's public state under
 * `~/.dsh/mmd/runs/<runId>.json`:
 *
 *   - Writes are debounced and coalesced per run; a burst of patches during a
 *     phase transition costs one write.
 *   - A terminal phase flushes immediately, because that is the state most
 *     worth not losing.
 *   - Restored runs are read-only: they carry `restored: true` and no budget,
 *     machine or gate, so the orchestrator and the control route refuse them
 *     instead of half-driving a dead run.
 *   - Retention is a count ceiling on disk, not a timer, so nothing is deleted
 *     while the process is down.
 *
 * @module dsh-multi-model-discussion/services/run-history
 */
import fs from 'node:fs';
import path from 'node:path';
import { mmdHome } from '../host/user-settings.js';
/** Bumped when the on-disk shape changes in a way an older reader cannot use. */
const HISTORY_VERSION = 1;
/** How long a burst of state changes is coalesced before hitting the disk. */
const FLUSH_DEBOUNCE_MS = 400;
/** How many run files to keep. */
const DEFAULT_KEEP = 300;
/** Phases after which a run never changes again. */
const TERMINAL_PHASES = new Set(['completed', 'failed', 'stopped']);
/** Directory holding one JSON document per run. */
export function runsDir() {
    return path.join(mmdHome(), 'runs');
}
/** File-safe form of a run id. */
function fileFor(runId) {
    return path.join(runsDir(), `${runId.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`);
}
export class RunHistory {
    logger;
    keep;
    store;
    /** Run ids whose latest state has not reached the disk yet. */
    dirty = new Set();
    timer;
    flushing = false;
    unsubscribe;
    constructor(options) {
        this.logger = options.logger;
        this.keep = options.keep ?? DEFAULT_KEEP;
        this.store = options.store;
    }
    /**
     * Load every persisted run into the store as a read-only context.
     *
     * Called once at plugin load: after this the discussion view lists history
     * even though nothing has run yet in this process.
     */
    restore() {
        let files;
        try {
            files = fs.readdirSync(runsDir()).filter((name) => name.endsWith('.json'));
        }
        catch {
            // No directory yet: a first run. Not a problem worth logging.
            return 0;
        }
        let restored = 0;
        for (const name of files) {
            const file = path.join(runsDir(), name);
            try {
                const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
                const state = parsed?.state;
                if (!state || typeof state.runId !== 'string')
                    throw new Error('missing state.runId');
                this.store.add({
                    runId: state.runId,
                    state,
                    // Marked settled so prune() may drop it, and restored so the
                    // orchestrator and the control route refuse to drive it.
                    settled: true,
                    restored: true,
                });
                restored++;
            }
            catch (cause) {
                this.logger?.warn('跳过无法解析的研讨记录 %s：%s', name, cause instanceof Error ? cause.message : String(cause));
                try {
                    fs.renameSync(file, `${file}.broken`);
                }
                catch {
                    // Leaving the file in place is fine; it is skipped either way.
                }
            }
        }
        return restored;
    }
    /** Start mirroring store changes to disk. Returns the disposer. */
    attach() {
        this.unsubscribe = this.store.subscribe((state) => {
            this.dirty.add(state.runId);
            // A finished run is written without waiting: the debounce exists to
            // reduce churn during a run, not to delay the last write.
            if (TERMINAL_PHASES.has(state.phase))
                void this.flush();
            else
                this.schedule();
        });
        return () => {
            this.unsubscribe?.();
            if (this.timer !== undefined)
                clearTimeout(this.timer);
            this.timer = undefined;
            void this.flush();
        };
    }
    /** Delete one persisted run. Returns whether a file was removed. */
    forget(runId) {
        this.dirty.delete(runId);
        try {
            fs.rmSync(fileFor(runId), { force: true });
            return true;
        }
        catch {
            return false;
        }
    }
    schedule() {
        if (this.timer !== undefined)
            return;
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.flush();
        }, FLUSH_DEBOUNCE_MS);
        // A pending flush must never hold the process open.
        this.timer.unref?.();
    }
    /** Write every dirty run's current state. Never throws at the caller. */
    async flush() {
        if (this.flushing)
            return;
        this.flushing = true;
        try {
            const pending = [...this.dirty];
            this.dirty.clear();
            if (pending.length === 0) {
                this.enforceRetention();
                return;
            }
            fs.mkdirSync(runsDir(), { recursive: true });
            for (const runId of pending) {
                const context = this.store.get(runId);
                // A run pruned from memory is already on disk from an earlier flush.
                if (!context || context.restored)
                    continue;
                await this.write(runId, context.state);
            }
            this.enforceRetention();
        }
        catch (cause) {
            this.logger?.warn('研讨记录写入失败：%s', cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            this.flushing = false;
        }
    }
    async write(runId, state) {
        const file = fileFor(runId);
        const temp = `${file}.${process.pid}.tmp`;
        const document = { version: HISTORY_VERSION, savedAt: Date.now(), state };
        await fs.promises.writeFile(temp, `${JSON.stringify(document)}\n`, 'utf8');
        // Atomic replace: a half-written history file must never be readable.
        await fs.promises.rename(temp, file);
    }
    /** Keep only the newest `keep` run files. */
    enforceRetention() {
        let entries;
        try {
            entries = fs.readdirSync(runsDir()).filter((name) => name.endsWith('.json'));
        }
        catch {
            return;
        }
        if (entries.length <= this.keep)
            return;
        const stamped = entries.map((name) => {
            const file = path.join(runsDir(), name);
            let startedAt = 0;
            try {
                startedAt = JSON.parse(fs.readFileSync(file, 'utf8'))?.state?.startedAt ?? 0;
            }
            catch {
                startedAt = 0;
            }
            return { file, startedAt };
        });
        stamped.sort((a, b) => b.startedAt - a.startedAt);
        for (const { file } of stamped.slice(this.keep)) {
            try {
                fs.rmSync(file, { force: true });
            }
            catch {
                // Best-effort: a file that cannot be removed is retried next flush.
            }
        }
    }
}
