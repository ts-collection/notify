import logUpdate from 'log-update';
import type { NotifyEntry, NotifyOptions, NotifyType } from '../types';
import { color } from './colors';
import { DEFAULT_TOAST_DURATION, SPINNER_FRAMES } from './constants';

const icon = (t: NotifyEntry) => {
  if (t.type === 'loading')
    return color.info(SPINNER_FRAMES[t.spinnerIndex % SPINNER_FRAMES.length]);
  if (t.type === 'success') return color.success('√');
  if (t.type === 'error') return color.error('×');
  if (t.type === 'warning') return color.warn('▲');
  if (t.type === 'info') return color.info('i');
  return color.dim('●');
};

// Resolve the `toast` option into a { isToast, duration } pair.
// - falsy (undefined/false) -> not a toast, stays until dismissed/replaced
// - true                    -> toast with the default duration
// - { duration }            -> toast with a custom duration
function resolveToast(toast: NotifyOptions['toast']) {
  if (!toast) return { isToast: false, duration: Number.POSITIVE_INFINITY };
  if (toast === true)
    return { isToast: true, duration: DEFAULT_TOAST_DURATION };
  return { isToast: true, duration: toast.duration };
}

export class NotifyManager {
  private entries: NotifyEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private counter = 0;

  private nextId() {
    return `notify_${++this.counter}`;
  }

  private ensureLoop() {
    if (!this.timer) {
      this.timer = setInterval(() => this.render(), 80);
      this.render();
    }
    this.syncRefState();
  }

  // Keep the interval ref'd (blocks process exit) only while at least
  // one active entry asked to `keepAlive`. Otherwise unref it so a
  // lingering notify never keeps the CLI alive on its own.
  private syncRefState() {
    if (!this.timer) return;
    const shouldKeepAlive = this.entries.some((t) => t.keepAlive);
    if (shouldKeepAlive) this.timer.ref();
    else this.timer.unref();
  }

  private stopLoopIfIdle() {
    if (this.entries.length === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logUpdate.clear();
    }
  }

  private render() {
    const now = Date.now();
    this.entries = this.entries.filter(
      (t) => t.persistent || now - t.createdAt < t.duration,
    );

    if (this.entries.length === 0) {
      this.stopLoopIfIdle();
      return;
    }

    const lines = this.entries.map((t) => {
      const line = `${icon(t)} ${t.message}`;
      if (t.type === 'loading') t.spinnerIndex++;
      return line;
    });

    logUpdate(lines.join('\n'));
    this.syncRefState(); // an expired keepAlive entry may have just been filtered out
  }

  add(type: NotifyType, message: string, options: NotifyOptions = {}) {
    const id = options.id ?? this.nextId();
    const existing = this.entries.find((t) => t.id === id);

    const isLoading = type === 'loading';
    const { isToast, duration } = isLoading
      ? { isToast: false, duration: Number.POSITIVE_INFINITY }
      : resolveToast(options.toast);

    const entry: NotifyEntry = {
      id,
      type,
      message,
      createdAt: Date.now(),
      duration,
      persistent: !isToast,
      keepAlive: options.keepAlive ?? false,
      spinnerIndex: existing?.spinnerIndex ?? 0,
    };

    if (existing) Object.assign(existing, entry);
    else this.entries.push(entry);

    this.ensureLoop();
    return id;
  }

  update(
    id: string,
    type: NotifyType,
    message: string,
    options: NotifyOptions = {},
  ) {
    const entry = this.entries.find((t) => t.id === id);
    if (!entry) return this.add(type, message, { ...options, id });

    const isLoading = type === 'loading';
    const { isToast, duration } = isLoading
      ? { isToast: false, duration: Number.POSITIVE_INFINITY }
      : resolveToast(options.toast);

    entry.type = type;
    entry.message = message;
    entry.createdAt = Date.now();
    entry.duration = duration;
    entry.persistent = !isToast;
    entry.keepAlive = options.keepAlive ?? entry.keepAlive;
    this.syncRefState();
    return id;
  }

  dismiss(id: string) {
    this.entries = this.entries.filter((t) => t.id !== id);
    this.syncRefState();
    this.stopLoopIfIdle();
  }

  clear() {
    this.entries = [];
    this.stopLoopIfIdle();
  }
}
