import type { ChalkInstance } from 'chalk';
import chalk, { modifierNames } from 'chalk';
import type {
  NotifyColor,
  NotifyDisplay,
  NotifyEntry,
  NotifyOptions,
  NotifyStyleOptions,
  NotifyType,
  ProgressBarSet,
  ProgressInitOptions,
} from '../types';

import {
  DEFAULT_TOAST_DURATION,
  PROGRESS_BARS,
  SPINNER_FRAMES,
} from './constants';

export function deriveLabel(
  promiseOrFn: Promise<unknown> | (() => Promise<unknown>),
): string {
  if (typeof promiseOrFn === 'function') {
    const name = promiseOrFn.name;
    if (name) return `${name}: `;
  }
  return '';
}

export function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;

  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

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
  const { color, backgroundColor, modifier, ...rest } = style;
  const boolModifiers = rest as Partial<
    Record<import('chalk').ModifierName, boolean>
  >;
  if (
    !color &&
    !backgroundColor &&
    !modifier &&
    !hasBoolModifier(boolModifiers)
  )
    return undefined;

  let styler: ChalkInstance = chalk;

  if (color) {
    const fn = chalkFromColor(color);
    if (fn) styler = fn;
  }

  if (backgroundColor) {
    const fn = chalkFromColor(backgroundColor, true);
    if (fn) styler = fn;
  }

  // NOTE: apply named boolean modifiers first (bold: true, italic: true)
  for (const [name, enabled] of Object.entries(boolModifiers)) {
    if (enabled) {
      const m = (styler as unknown as Record<string, ChalkInstance>)[name];
      if (m) styler = m;
    }
  }

  // NOTE: then apply ChalkInstance modifier(s)
  if (modifier) {
    const mods = Array.isArray(modifier) ? modifier : [modifier];
    for (const mod of mods) {
      styler = mod;
    }
  }

  return (text: string) => styler(text);
}

function hasBoolModifier(obj: Partial<Record<string, boolean>>): boolean {
  return modifierNames.some((k) => obj[k] === true);
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

function renderBar(
  set: ProgressBarSet,
  percent: number,
  width: number,
  tick: number,
): string {
  if (percent >= 100) return set.full.repeat(width);

  if (!set.head) {
    const filled = Math.round((percent / 100) * width);
    return set.full.repeat(filled) + set.empty.repeat(width - filled);
  }

  const frac = percent / 100;
  const pos = Math.min(Math.floor(frac * width), width - 1);
  const head =
    Math.floor(tick / 6) % 2 === 0 ? set.head : (set.headAlt ?? set.head);
  return set.full.repeat(pos) + head + set.empty.repeat(width - pos - 1);
}

export function formatProgress(
  progress: ProgressInitOptions,
  disp?: Partial<NotifyDisplay>,
  tick: number = 0,
): string {
  const { current, total, variant } = progress;
  const { brackets = false, percentage = true, count = true } = disp ?? {};

  const parts: string[] = [];

  if (total !== undefined) {
    const percent = Math.min(
      100,
      Math.max(0, Math.round((current / total) * 100)),
    );
    const barWidth = 20;

    let set: ProgressBarSet | undefined;
    if (variant && typeof variant === 'object') {
      set = variant;
    } else if (variant && variant !== 'none') {
      set = PROGRESS_BARS[variant as keyof typeof PROGRESS_BARS];
    } else if (!variant) {
      // NOTE: default to 'bar' when no variant is specified
      set = PROGRESS_BARS.bar;
    }

    if (set) {
      const bar = renderBar(set, percent, barWidth, tick);
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

export function getIconChar(
  t: NotifyEntry,
  disp?: Partial<NotifyDisplay>,
): string {
  const spinnerOff =
    (t.type === 'loading' || t.type === 'progress') && disp?.spinner === false;
  if (t.icon) return t.icon;
  if (spinnerOff) return '▸';
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
  disp?: Partial<NotifyDisplay>,
): string {
  const char = getIconChar(t, disp);
  if (styler) return styler(char);
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
