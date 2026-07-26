import type {
  NotifyEntry,
  NotifyHandle,
  NotifyOptions,
  NotifyType,
  NotifyUpdate,
  ProgressHandle,
  ProgressInitOptions,
} from '../types';
import { formatProgress, getIcon, resolveToast } from './helpers';
import { RenderLoop } from './renderer';

export class NotifyManager {
  private entries: NotifyEntry[] = [];
  private counter = 0;
  private renderLoop = new RenderLoop();

  private nextId(): string {
    return `notify_${++this.counter}`;
  }

  // NOTE: true when any entry needs spinner animation, progress output, or expiry checks
  private needsTick(): boolean {
    return this.entries.some(
      (e) => e.type === 'loading' || e.type === 'progress' || !e.persistent,
    );
  }

  // NOTE: filter expired, build lines, write, manage loop state
  private render() {
    const now = Date.now();
    this.entries = this.entries.filter(
      (t) => t.persistent || now - t.createdAt < t.duration,
    );

    if (this.entries.length === 0) {
      this.renderLoop.clear();
      this.renderLoop.stop();
      return;
    }

    const lines = this.entries.map((t) => {
      const progressSuffix = t.progress ? ` ${formatProgress(t.progress)}` : '';
      const line = `${getIcon(t)} ${t.message}${progressSuffix}`;
      if (t.type === 'loading' || t.type === 'progress') t.spinnerIndex++;
      return line;
    });

    this.renderLoop.write(lines);
    this.renderLoop.syncRefState(this.entries.some((t) => t.keepAlive));

    if (!this.needsTick()) {
      this.renderLoop.stop();
    }
  }

  // NOTE: trigger render + ensure interval is running when entries need periodic work
  private flush() {
    this.render();
    if (this.needsTick()) {
      this.renderLoop.start(() => this.render());
    }
  }

  // NOTE: derive persistence and toast config from type
  private persistConfig(
    type: NotifyType,
    toastOption?: NotifyOptions['toast'],
  ) {
    const persistent = type === 'loading' || type === 'progress';
    if (persistent) {
      return { persistent, isToast: false, duration: Number.POSITIVE_INFINITY };
    }
    const { isToast, duration } = resolveToast(toastOption);
    return { persistent, isToast, duration };
  }

  add(
    type: NotifyType,
    message: string,
    options: NotifyOptions & { progress?: ProgressInitOptions } = {},
  ): string {
    const id = options.id ?? this.nextId();
    const existing = this.entries.find((t) => t.id === id);

    const { isToast, duration } = this.persistConfig(type, options.toast);

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

    if (options.progress) entry.progress = options.progress;
    if (existing) Object.assign(existing, entry);
    else this.entries.push(entry);

    this.flush();
    return id;
  }

  update(id: string, update: NotifyUpdate): string {
    const entry = this.entries.find((t) => t.id === id);
    if (!entry) {
      // NOTE: create-on-miss when updating a non-existent id
      return this.add(update.type ?? 'default', update.message ?? '', {
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
      // NOTE: clear progress when switching away from progress type
      if (update.type !== 'progress') delete entry.progress;

      const { isToast, duration } = this.persistConfig(
        update.type,
        update.options?.toast ??
          (entry.persistent ? undefined : { duration: entry.duration }),
      );
      entry.duration = duration;
      entry.persistent =
        !isToast || !update.options?.toast
          ? update.type === 'loading' || update.type === 'progress'
          : false;
    }

    if (update.message !== undefined) {
      entry.message = update.message;
    }

    if (update.progress !== undefined) {
      // NOTE: preserve initial variant/display — update only touches current/total
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

    this.flush();
    return id;
  }

  dismiss(id: string) {
    this.entries = this.entries.filter((t) => t.id !== id);
    this.flush();
  }

  clear() {
    this.entries = [];
    this.renderLoop.destroy();
  }

  handle(id: string): NotifyHandle {
    return {
      id,
      dismiss: () => this.dismiss(id),
      update: (update: NotifyUpdate) => this.update(id, update),
    };
  }

  progressHandle(
    id: string,
    config: { total: number },
    messages?: { success?: string; error?: string },
  ): ProgressHandle {
    let resolved = false;

    const resolve = (type: 'success' | 'error', msg?: string) => {
      const finalMsg =
        msg ?? (type === 'success' ? messages?.success : messages?.error);
      if (finalMsg !== undefined) {
        this.update(id, { type, message: finalMsg });
      } else {
        this.update(id, { type });
      }
    };

    return {
      id,
      dismiss: () => this.dismiss(id),
      update: (update: NotifyUpdate) => this.update(id, update),
      advance: (n = 1) => {
        if (resolved) return;
        const entry = this.entries.find((e) => e.id === id);
        const current = (entry?.progress?.current ?? 0) + n;
        this.update(id, { progress: { current, total: config.total } });
        // NOTE: auto-resolve when current reaches or exceeds total
        if (current >= config.total) {
          resolved = true;
          resolve('success');
        }
      },
      set: (current: number) => {
        if (resolved) return;
        this.update(id, { progress: { current, total: config.total } });
        if (current >= config.total) {
          resolved = true;
          resolve('success');
        }
      },
      done: (msg?: string) => {
        resolved = true;
        resolve('success', msg);
      },
      fail: (msg?: string) => {
        resolved = true;
        resolve('error', msg);
      },
      label: (msg: string) => {
        this.update(id, { message: msg });
      },
    };
  }
}
