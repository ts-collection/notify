import { createLogUpdate } from 'log-update';
import type {
  NotifyEntry,
  NotifyHandle,
  NotifyOptions,
  NotifyType,
  NotifyUpdate,
  ProgressHandle,
  ProgressInitOptions,
  ProgressOptions,
} from '../types';
import { formatProgress, getIcon, resolveToast } from './helpers';

export class NotifyManager {
  private entries: NotifyEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private logUpdate = createLogUpdate(process.stderr);
  private counter = 0;
  private lastOutput = '';

  private nextId() {
    return `notify_${++this.counter}`;
  }

  /** Whether any entry needs periodic attention (spinner animation, progress, or expiry). */
  private needsTick(): boolean {
    return this.entries.some(
      (e) => e.type === 'loading' || e.type === 'progress' || !e.persistent,
    );
  }

  /** Start the render interval if needed and not already running. */
  private ensureLoop() {
    if (!this.timer && this.needsTick()) {
      this.timer = setInterval(() => this.render(), 80);
    }
    this.syncRefState();
  }

  private syncRefState() {
    if (!this.timer) return;
    const shouldKeepAlive = this.entries.some((t) => t.keepAlive);
    if (shouldKeepAlive) this.timer.ref();
    else this.timer.unref();
  }

  /** Render current entries to terminal. Skips logUpdate when output unchanged. */
  private render() {
    const now = Date.now();
    this.entries = this.entries.filter(
      (t) => t.persistent || now - t.createdAt < t.duration,
    );

    if (this.entries.length === 0) {
      if (this.lastOutput !== '') {
        this.lastOutput = '';
        this.logUpdate.clear();
      }
      this.stopLoop();
      return;
    }

    const lines = this.entries.map((t) => {
      const progressSuffix = t.progress ? ` ${formatProgress(t.progress)}` : '';
      const line = `${getIcon(t)} ${t.message}${progressSuffix}`;
      // Advance spinner for animated types
      if (t.type === 'loading' || t.type === 'progress') t.spinnerIndex++;
      return line;
    });

    const output = lines.join('\n');

    if (output !== this.lastOutput) {
      this.lastOutput = output;
      this.logUpdate(output);
    }

    this.syncRefState();

    // Stop interval if no more periodic work needed (all entries static + persistent).
    if (!this.needsTick()) {
      this.stopLoop();
    }
  }

  private stopLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  add(
    type: NotifyType,
    message: string,
    options: NotifyOptions & { progress?: ProgressInitOptions } = {},
  ) {
    const id = options.id ?? this.nextId();
    const existing = this.entries.find((t) => t.id === id);

    const isPersistent = type === 'loading' || type === 'progress';
    const { isToast, duration } = isPersistent
      ? { isToast: false, duration: Number.POSITIVE_INFINITY }
      : resolveToast(options.toast);

    const progress = options.progress;

    const entry: NotifyEntry = {
      id,
      type,
      message,
      createdAt: Date.now(),
      duration,
      persistent: !isToast,
      keepAlive: options.keepAlive ?? false,
      spinnerIndex: existing?.spinnerIndex ?? 0,
      ...(progress ? { progress } : {}),
    };

    if (existing) Object.assign(existing, entry);
    else this.entries.push(entry);

    this.render();
    this.ensureLoop();
    return id;
  }

  update(
    id: string,
    update: {
      type?: NotifyType;
      message?: string;
      progress?: ProgressOptions;
      options?: NotifyOptions;
    },
  ) {
    const entry = this.entries.find((t) => t.id === id);
    if (!entry) {
      const type = update.type ?? 'default';
      const message = update.message ?? '';
      return this.add(type, message, {
        ...update.options,
        id,
        ...(update.progress
          ? {
              progress: {
                ...update.progress,
                display: {},
              } as ProgressInitOptions,
            }
          : {}),
      });
    }

    if (update.type !== undefined) {
      entry.type = update.type;
      // Clear progress when switching away from progress type
      if (update.type !== 'progress') {
        delete entry.progress;
      }
      const isPersistent =
        update.type === 'loading' || update.type === 'progress';
      const { isToast, duration } = isPersistent
        ? { isToast: false, duration: Number.POSITIVE_INFINITY }
        : resolveToast(
            update.options?.toast ??
              (entry.persistent ? undefined : { duration: entry.duration }),
          );
      entry.duration = duration;
      entry.persistent =
        !isToast || !update.options?.toast ? isPersistent : false;
    }

    if (update.message !== undefined) {
      entry.message = update.message;
    }

    if (update.progress !== undefined) {
      // Preserve initial variant/display options — update only touches current/total
      entry.progress = {
        ...entry.progress,
        display: entry.progress?.display ?? {},
        current: update.progress.current,
        ...(update.progress.total !== undefined
          ? { total: update.progress.total }
          : {}),
      };
    }

    entry.createdAt = Date.now();

    if (update.options?.keepAlive !== undefined) {
      entry.keepAlive = update.options.keepAlive;
    }

    if (update.type === 'loading') {
      entry.spinnerIndex = 0;
    }

    this.render();
    this.ensureLoop();
    return id;
  }

  dismiss(id: string) {
    this.entries = this.entries.filter((t) => t.id !== id);
    this.render();
  }

  clear() {
    this.entries = [];
    if (this.lastOutput !== '') {
      this.lastOutput = '';
      this.logUpdate.clear();
    }
    this.stopLoop();
  }

  /** Create a NotifyHandle for a given entry id */
  handle(id: string): NotifyHandle {
    return {
      id,
      dismiss: () => this.dismiss(id),
      update: (update: NotifyUpdate) => this.update(id, update),
    };
  }

  /** Create a ProgressHandle for a given entry id */
  progressHandle(
    id: string,
    config: { total: number },
    messages?: { success?: string; error?: string },
  ): ProgressHandle {
    let resolved = false;

    return {
      id,
      dismiss: () => this.dismiss(id),
      update: (update: NotifyUpdate) => this.update(id, update),
      advance: (n = 1) => {
        if (resolved) return;
        const entry = this.entries.find((e) => e.id === id);
        const current = (entry?.progress?.current ?? 0) + n;
        this.update(id, { progress: { current, total: config.total } });
        if (current >= config.total) {
          resolved = true;
          const doneMsg = messages?.success ?? entry?.message;
          if (doneMsg !== undefined) {
            this.update(id, { type: 'success', message: doneMsg });
          } else {
            this.update(id, { type: 'success' });
          }
        }
      },
      set: (current: number) => {
        if (resolved) return;
        this.update(id, { progress: { current, total: config.total } });
        if (current >= config.total) {
          resolved = true;
          const doneMsg = messages?.success ?? this.entries.find((e) => e.id === id)?.message;
          if (doneMsg !== undefined) {
            this.update(id, { type: 'success', message: doneMsg });
          } else {
            this.update(id, { type: 'success' });
          }
        }
      },
      done: (msg?: string) => {
        resolved = true;
        const finalMsg = msg ?? messages?.success;
        if (finalMsg !== undefined) {
          this.update(id, { type: 'success', message: finalMsg });
        } else {
          this.update(id, { type: 'success' });
        }
      },
      fail: (msg?: string) => {
        resolved = true;
        const finalMsg = msg ?? messages?.error;
        if (finalMsg !== undefined) {
          this.update(id, { type: 'error', message: finalMsg });
        } else {
          this.update(id, { type: 'error' });
        }
      },
      label: (msg: string) => {
        this.update(id, { message: msg });
      },
    };
  }
}
