import chalk from 'chalk';
import type {
  NotifyColorConfig,
  NotifyColorInput,
  NotifyColorStyle,
  NotifyEntry,
  NotifyOptions,
  NotifyType,
  ProgressBarSet,
  ProgressInitOptions,
  ProgressVariant,
} from '../types';

import { DEFAULT_TOAST_DURATION, SPINNER_FRAMES } from './constants';

export function deriveLabel(
  promiseOrFn: Promise<unknown> | (() => Promise<unknown>),
): string {
  if (typeof promiseOrFn === 'function') {
    const name = promiseOrFn.name;
    if (name) return `${name}: `;
  }
  return '';
}

const PROGRESS_BARS: Record<
  Exclude<ProgressVariant, 'none'>,
  ProgressBarSet
> = {
  bar: { full: '█', empty: '░' },
  block: { full: '█', empty: ' ' },
  line: { full: '━', empty: '─' },
  dot: { full: '●', empty: '○' },
};

// NOTE: resolve user color input to internal config
export function resolveColor(
  input: NotifyColorInput | undefined,
): NotifyColorConfig {
  if (!input) return { mode: 'all' } as NotifyColorConfig;

  // Function — custom styler with 'all' mode
  if (typeof input === 'function') {
    return { mode: 'all', styler: input } as NotifyColorConfig;
  }

  // Object — optional mode + optional styler
  const config: NotifyColorConfig = { mode: input.mode ?? 'all' };
  if (input.color) config.styler = input.color;
  return config;
}

// NOTE: wrap text in type-appropriate or custom color
export function colorMessage(
  type: NotifyType,
  msg: string,
  styler?: NotifyColorStyle,
): string {
  if (styler) return styler(msg);
  switch (type) {
    case 'success':
      return chalk.green(msg);
    case 'error':
      return chalk.red(msg);
    case 'warning':
      return chalk.yellow(msg);
    case 'info':
      return chalk.cyan(msg);
    case 'loading':
    case 'progress':
      return chalk.cyan(msg);
    default:
      return chalk.dim(msg);
  }
}

export function formatProgress(progress: ProgressInitOptions): string {
  const { current, total, variant, display } = progress;
  const { brackets = false, percentage = true, count = true } = display ?? {};

  const parts: string[] = [];

  if (total !== undefined) {
    const v = variant ?? 'bar';
    const percent = Math.min(
      100,
      Math.max(0, Math.round((current / total) * 100)),
    );
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);

    if (v !== 'none') {
      const set = PROGRESS_BARS[v];
      const bar = set.full.repeat(filled) + set.empty.repeat(barWidth - filled);
      if (brackets) {
        parts.push(`[${bar}]`);
      } else {
        parts.push(bar);
      }
    }

    if (percentage) {
      parts.push(`${percent}%`);
    }

    if (count) {
      parts.push(`(${current}/${total})`);
    }
  } else {
    parts.push(`${current}`);
  }

  return parts.join(' ');
}

export function getIconChar(t: NotifyEntry): string {
  if (t.type === 'progress' && t.progress?.display?.spinner === false)
    return '▸';
  if (t.type === 'loading' || t.type === 'progress')
    return SPINNER_FRAMES[t.spinnerIndex % SPINNER_FRAMES.length]!;
  if (t.type === 'success') return '√';
  if (t.type === 'error') return '×';
  if (t.type === 'warning') return '▲';
  if (t.type === 'info') return 'i';
  return '●';
}

export function getColoredIcon(
  t: NotifyEntry,
  styler?: NotifyColorStyle,
): string {
  const char = getIconChar(t);
  if (styler) return styler(char);
  if (t.type === 'progress' && t.progress?.display?.spinner === false)
    return chalk.cyan(char);
  if (t.type === 'loading' || t.type === 'progress') return chalk.cyan(char);
  if (t.type === 'success') return chalk.green(char);
  if (t.type === 'error') return chalk.red(char);
  if (t.type === 'warning') return chalk.yellow(char);
  if (t.type === 'info') return chalk.cyan(char);
  return chalk.dim(char);
}

export function resolveToast(toast: NotifyOptions['toast']) {
  if (!toast) return { isToast: false, duration: Number.POSITIVE_INFINITY };
  if (toast === true)
    return { isToast: true, duration: DEFAULT_TOAST_DURATION };
  return { isToast: true, duration: toast.duration };
}
