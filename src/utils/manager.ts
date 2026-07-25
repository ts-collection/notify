import { createLogUpdate } from 'log-update';
import type { NotifyEntry, NotifyOptions, NotifyType, ProgressOptions } from '../types';
import { color } from './colors';
import { DEFAULT_TOAST_DURATION, SPINNER_FRAMES } from './constants';

function formatProgress(progress: ProgressOptions): string {
  const { current, total } = progress;
  if (total === undefined) return `${current}`;
  const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  const barWidth = 10;
  const filled = Math.round((percent / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  return `[${bar}] ${percent}% (${current}/${total})`;
}

const icon = (t: NotifyEntry) => {
  if (t.type === 'loading')
    return color.info(SPINNER_FRAMES[t.spinnerIndex % SPINNER_FRAMES.length]);
  if (t.type === 'progress') return color.info('▸');
  if (t.type === 'success') return color.success('√');
  if (t.type === 'error') return color.error('×');
  if (t.type === 'warning') return color.warn('▲');
  if (t.type === 'info') return color.info('i');
  return color.dim('●');
};

function resolveToast(toast: NotifyOptions['toast']) {
  if (!toast) return { isToast: false, duration: Number.POSITIVE_INFINITY };
  if (toast === true)
    return { isToast: true, duration: DEFAULT_TOAST_DURATION };
  return { isToast: true, duration: toast.duration };
}

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
    return this.entries.some((e) => e.type === 'loading' || e.type === 'progress' || !e.persistent);
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
      const line = `${icon(t)} ${t.message}${progressSuffix}`;
      if (t.type === 'loading') t.spinnerIndex++;
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

  add(type: NotifyType, message: string, options: NotifyOptions & { progress?: ProgressOptions } = {}) {
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
      return this.add(type, message, { ...update.options, id, progress: update.progress });
    }

    if (update.type !== undefined) {
      entry.type = update.type;
      // Clear progress when switching away from progress type
      if (update.type !== 'progress') {
        entry.progress = undefined;
      }
      const isPersistent = update.type === 'loading' || update.type === 'progress';
      const { isToast, duration } = isPersistent
        ? { isToast: false, duration: Number.POSITIVE_INFINITY }
        : resolveToast(update.options?.toast ?? entry.persistent ? undefined : { duration: entry.duration });
      entry.duration = duration;
      entry.persistent = !isToast || !update.options?.toast ? isPersistent : false;
    }

    if (update.message !== undefined) {
      entry.message = update.message;
    }

    if (update.progress !== undefined) {
      entry.progress = update.progress;
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
}
