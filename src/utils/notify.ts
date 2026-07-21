import logUpdate from 'log-update';
import type { NotifyEntry, NotifyOptions, NotifyType } from '../types';
import { color } from './colors';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const DEFAULT_DURATION = 3000;

const icon = (t: NotifyEntry) => {
  if (t.type === 'loading')
    return color.info(SPINNER_FRAMES[t.spinnerIndex % SPINNER_FRAMES.length]);
  if (t.type === 'success') return color.success('√');
  if (t.type === 'error') return color.error('×');
  if (t.type === 'warning') return color.warn('▲');
  if (t.type === 'info') return color.info('i');
  return color.dim('●');
};

class NotifyManager {
  private entries: NotifyEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private counter = 0;

  private nextId() {
    return `notify_${++this.counter}`;
  }

  private ensureLoop() {
    if (this.timer) return;
    this.timer = setInterval(() => this.render(), 80);
    this.render();
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
  }

  add(type: NotifyType, message: string, options: NotifyOptions = {}) {
    const id = options.id ?? this.nextId();
    const existing = this.entries.find((t) => t.id === id);

    const entry: NotifyEntry = {
      id,
      type,
      message,
      createdAt: Date.now(),
      duration: options.duration ?? DEFAULT_DURATION,
      persistent: type === 'loading',
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

    entry.type = type;
    entry.message = message;
    entry.createdAt = Date.now();
    entry.duration = options.duration ?? DEFAULT_DURATION;
    entry.persistent = type === 'loading';
    return id;
  }

  dismiss(id: string) {
    this.entries = this.entries.filter((t) => t.id !== id);
    this.stopLoopIfIdle();
  }

  clear() {
    this.entries = [];
    this.stopLoopIfIdle();
  }
}

const manager = new NotifyManager();

function base(message: string, options?: NotifyOptions) {
  return manager.add('default', message, options);
}

base.success = (message: string, options?: NotifyOptions) =>
  manager.add('success', message, options);
base.error = (message: string, options?: NotifyOptions) =>
  manager.add('error', message, options);
base.warning = (message: string, options?: NotifyOptions) =>
  manager.add('warning', message, options);
base.info = (message: string, options?: NotifyOptions) =>
  manager.add('info', message, options);
base.loading = (message: string, options?: NotifyOptions) =>
  manager.add('loading', message, {
    ...options,
    duration: Number.POSITIVE_INFINITY,
  });
base.dismiss = (id: string) => manager.dismiss(id);
base.clear = () => manager.clear();

base.promise = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
  options?: NotifyOptions,
) => {
  const id = manager.add('loading', messages.loading, {
    ...options,
    duration: Number.POSITIVE_INFINITY,
  });

  try {
    const data = await promise;
    const successMessage =
      typeof messages.success === 'function'
        ? messages.success(data)
        : messages.success;
    manager.update(id, 'success', successMessage, options);
    return data;
  } catch (err) {
    const errorMessage =
      typeof messages.error === 'function'
        ? messages.error(err)
        : messages.error;
    manager.update(id, 'error', errorMessage, options);
    throw err;
  }
};

export const notify = base;
