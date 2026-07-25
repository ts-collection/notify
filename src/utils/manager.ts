import { createLogUpdate } from 'log-update';
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

  /** Whether any entry needs periodic attention (spinner animation or expiry). */
  private needsTick(): boolean {
    return this.entries.some((e) => e.type === 'loading' || !e.persistent);
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
      const line = `${icon(t)} ${t.message}`;
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

    this.render();
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

    if (type === 'loading') {
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
