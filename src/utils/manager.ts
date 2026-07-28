import type {
  NotifyDefaults,
  NotifyEntry,
  NotifyHandle,
  NotifyOptions,
  NotifyStyleOptions,
  NotifyType,
  NotifyUpdate,
  ProgressConfig,
  ProgressHandle,
  ProgressInitOptions,
} from '../types';
import { DEFAULT_TOAST_DURATION, LIBRARY_DEFAULTS } from './constants';
import {
  colorMessage,
  formatProgress,
  getColoredIcon,
  getIconChar,
  resolveStyle,
} from './helpers';
import { RenderLoop } from './renderer';

export class NotifyManager {
  private defaults: NotifyDefaults = LIBRARY_DEFAULTS;
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
      const styler = resolveStyle(t.style);
      const mode = t.style?.mode ?? 'all';
      const colorIcon = mode === 'all' || mode === 'icon-only';
      const colorText = mode === 'all' || mode === 'text-only';
      const icon = `${colorIcon ? getColoredIcon(t, styler) : getIconChar(t)} `;
      const message = colorText
        ? colorMessage(t.type, t.message, styler)
        : t.message;
      const progressText = t.progress ? formatProgress(t.progress) : '';
      const progressSuffix = progressText
        ? ` ${colorText ? colorMessage(t.type, progressText, styler) : progressText}`
        : '';
      if (t.type === 'loading' || t.type === 'progress') t.spinnerIndex++;
      return `${icon}${message}${progressSuffix}`;
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

  setDefaults(cfg: NotifyDefaults) {
    if (cfg.variants) {
      this.defaults.variants = {
        ...this.defaults.variants,
        ...cfg.variants,
      };
    }
    if (cfg.toast) {
      this.defaults.toast = { ...this.defaults.toast, ...cfg.toast };
    }
    if (cfg.progress) {
      this.defaults.progress = { ...this.defaults.progress, ...cfg.progress };
    }
    if (cfg.icon !== undefined) this.defaults.icon = cfg.icon;
    if (cfg.style !== undefined) this.defaults.style = cfg.style;
    if (cfg.keepAlive !== undefined) this.defaults.keepAlive = cfg.keepAlive;
  }

  // NOTE: resolve icon: per-call > defaults.variants[type].icon > defaults.icon > hardcoded (handled in helpers)
  private resolveIcon(
    type: NotifyType,
    perCallIcon?: string,
  ): string | undefined {
    if (perCallIcon !== undefined) return perCallIcon;
    return this.defaults.variants?.[type]?.icon ?? this.defaults.icon;
  }

  // NOTE: resolve toast: per-call > defaults.toast.defaultDuration > helpers hardcoded
  private resolveToast(toastOption: NotifyOptions['toast']) {
    if (!toastOption)
      return { isToast: false, duration: Number.POSITIVE_INFINITY };
    if (toastOption === true) {
      return {
        isToast: true,
        duration:
          this.defaults.toast?.defaultDuration ?? DEFAULT_TOAST_DURATION,
      };
    }
    return { isToast: true, duration: toastOption.duration };
  }

  // NOTE: resolve style: per-call > defaults.variants[type].style > defaults.style > hardcoded
  private resolveStyle(
    type: NotifyType,
    perCallStyle?: NotifyStyleOptions,
  ): NotifyStyleOptions | undefined {
    const variantStyle = this.defaults.variants?.[type]?.style;
    const globalStyle = this.defaults.style;
    // RESOLVE: order per call > variant > global
    if (perCallStyle) return perCallStyle;
    if (variantStyle) return variantStyle;
    return globalStyle;
  }

  // NOTE: resolve progress defaults — explicit build to satisfy exactOptionalPropertyTypes
  private resolveProgressDefaults(
    progress?: ProgressInitOptions,
  ): ProgressInitOptions | undefined {
    if (!progress) return undefined;
    const result: ProgressInitOptions = {
      current: progress.current,
      display: {
        ...this.defaults.progress?.defaultDisplay,
        ...progress.display,
      },
    };
    if (progress.total !== undefined) result.total = progress.total;
    const variant = progress.variant ?? this.defaults.progress?.defaultVariant;
    if (variant !== undefined) result.variant = variant;
    return result;
  }

  add(
    type: NotifyType,
    message: string,
    options: NotifyOptions & { progress?: ProgressInitOptions } = {},
  ): string {
    const id = options.id ?? this.nextId();
    const existing = this.entries.find((t) => t.id === id);

    const loadingType = type === 'loading' || type === 'progress';
    const duration = loadingType
      ? Number.POSITIVE_INFINITY
      : this.resolveToast(options.toast).duration;

    const icon = this.resolveIcon(type, options.icon);
    const style = this.resolveStyle(type, options.style);
    const keepAlive = options.keepAlive ?? this.defaults.keepAlive ?? false;
    const progress = this.resolveProgressDefaults(options.progress);

    const entry: NotifyEntry = {
      id,
      type,
      message,
      ...(icon !== undefined ? { icon } : {}),
      createdAt: Date.now(),
      duration,
      persistent: loadingType,
      keepAlive,
      spinnerIndex: existing?.spinnerIndex ?? 0,
      style,
    };

    if (progress) entry.progress = progress;
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

      if (update.type === 'loading' || update.type === 'progress') {
        entry.duration = Number.POSITIVE_INFINITY;
        entry.persistent = true;
      } else {
        const toastOption = update.options?.toast ?? {
          duration: entry.duration,
        };
        entry.duration = this.resolveToast(toastOption).duration;
        entry.persistent = false;
      }
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

    if (update.options?.icon !== undefined) {
      entry.icon = update.options.icon;
    }

    if (update.options?.style !== undefined) {
      entry.style = update.options.style;
    } else if (update.type && update.type !== entry.type) {
      // NOTE: re-resolve style from defaults when type changes
      entry.style = this.resolveStyle(update.type, undefined);
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
    config: ProgressConfig,
    messages?: { success?: string; error?: string },
    options?: NotifyOptions,
  ): ProgressHandle {
    let resolved = false;
    const hasTotal = config.total !== undefined;

    const resolve = (type: 'success' | 'error', msg?: string) => {
      const finalMsg =
        msg ?? (type === 'success' ? messages?.success : messages?.error);
      const update: NotifyUpdate = { type };
      if (finalMsg !== undefined) update.message = finalMsg;
      if (options) update.options = options;
      this.update(id, update);
    };

    const checkResolve = (current: number) => {
      if (hasTotal && current >= config.total!) {
        resolved = true;
        resolve('success');
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
        if (hasTotal) {
          this.update(id, { progress: { current, total: config.total! } });
        } else {
          this.update(id, { progress: { current } });
        }
        checkResolve(current);
      },
      set: (current: number) => {
        if (resolved) return;
        if (hasTotal) {
          this.update(id, { progress: { current, total: config.total! } });
        } else {
          this.update(id, { progress: { current } });
        }
        checkResolve(current);
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
