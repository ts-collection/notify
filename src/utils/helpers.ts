import type {
  NotifyEntry,
  NotifyOptions,
  ProgressBarSet,
  ProgressInitOptions,
  ProgressVariant,
} from '../types';
import { color } from './colors';
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

export function getIcon(t: NotifyEntry) {
  if (t.type === 'progress' && t.progress?.display?.spinner === false)
    return color.info('▸');
  if (t.type === 'loading' || t.type === 'progress')
    return color.info(SPINNER_FRAMES[t.spinnerIndex % SPINNER_FRAMES.length]);
  if (t.type === 'success') return color.success('√');
  if (t.type === 'error') return color.error('×');
  if (t.type === 'warning') return color.warn('▲');
  if (t.type === 'info') return color.info('i');
  return color.dim('●');
}

export function resolveToast(toast: NotifyOptions['toast']) {
  if (!toast) return { isToast: false, duration: Number.POSITIVE_INFINITY };
  if (toast === true)
    return { isToast: true, duration: DEFAULT_TOAST_DURATION };
  return { isToast: true, duration: toast.duration };
}
