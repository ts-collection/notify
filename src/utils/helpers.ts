import type { ChalkInstance } from 'chalk';
import chalk from 'chalk';
import type {
  NotifyColor,
  NotifyEntry,
  NotifyOptions,
  NotifyStyleOptions,
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

// NOTE: resolve a color value to a chalk instance
function chalkFromColor(
  color?: NotifyColor,
  background = false,
): ChalkInstance | undefined {
  if (!color) return undefined;

  if (typeof color !== 'string') return color;

  if (color.startsWith('#')) {
    return background ? chalk.bgHex(color) : chalk.hex(color);
  }

  if (color.startsWith('rgb')) {
    const nums = color.match(/\d+/g)?.map(Number);

    if (nums && nums.length >= 3) {
      return background
        ? chalk.bgRgb(nums[0]!, nums[1]!, nums[2]!)
        : chalk.rgb(nums[0]!, nums[1]!, nums[2]!);
    }
  }

  const key = background
    ? (`bg${color[0]!.toUpperCase()}${color.slice(1)}` as keyof typeof chalk)
    : (color as keyof typeof chalk);

  return chalk[key] as ChalkInstance;
}

// NOTE: combine style options into a single chalk styler function
// Returns undefined when no custom styles are configured (caller falls back to type-based coloring)
export function resolveStyle(
  style: NotifyStyleOptions | undefined,
): ((text: string) => string) | undefined {
  if (!style) return undefined;
  const { color, backgroundColor, modifier } = style;
  if (!color && !backgroundColor && !modifier) return undefined;

  let styler: ChalkInstance = chalk;

  if (color) {
    const fn = chalkFromColor(color);
    if (fn) styler = fn;
  }

  if (backgroundColor) {
    const fn = chalkFromColor(backgroundColor, true);
    if (fn) styler = fn;
  }

  if (modifier) {
    const mods = Array.isArray(modifier) ? modifier : [modifier];
    for (const mod of mods) {
      if (typeof mod === 'string') {
        const m = (styler as unknown as Record<string, ChalkInstance>)[mod];
        if (m) styler = m;
      } else {
        styler = mod;
      }
    }
  }

  return (text: string) => styler(text);
}

// NOTE: wrap text in type-appropriate or custom color
export function colorMessage(
  type: NotifyType,
  msg: string,
  styler?: (text: string) => string,
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
  styler?: (text: string) => string,
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
