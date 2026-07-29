import type { NotifyDefaults, ProgressBarSet, ProgressVariant } from '../types';

export const SPINNER_FRAMES = [
  '⠋',
  '⠙',
  '⠹',
  '⠸',
  '⠼',
  '⠴',
  '⠦',
  '⠧',
  '⠇',
  '⠏',
];

export const PROGRESS_BARS: Record<
  Exclude<ProgressVariant, 'none'>,
  ProgressBarSet
> = {
  bar: { full: '█', empty: '░' },
  block: { full: '█', empty: ' ' },
  line: { full: '━', empty: '─' },
  dot: { full: '●', empty: '○' },
  smooth: { full: '█', empty: ' ' },
  shade: { full: '▓', empty: '░', head: '▒' },
  slim: { full: '━', empty: '╌', head: '❯' },
  pill: { full: '▰', empty: '▱' },
  braille: { full: '⣿', empty: '⣀', head: '⣷' },
  circle: { full: '⬤', empty: '◯', head: '◉', headAlt: '⬤' },
  diamond: { full: '◆', empty: '◇', head: '◈' },
  pacman: { full: '─', empty: '·', head: 'ᗧ', headAlt: 'ᗣ' },
};

export const DEFAULT_TOAST_DURATION = 3000;

// NOTE: built-in defaults
export const LIBRARY_DEFAULTS: NotifyDefaults = {
  display: {
    icon: true,
    timer: false,
    spinner: true,
    brackets: false,
    percentage: true,
    count: true,
  },
  toast: {
    defaultDuration: DEFAULT_TOAST_DURATION,
  },
  progress: {
    defaultVariant: 'bar',
  },
  variants: {
    success: { icon: '√', style: { color: 'green' } },
    error: { icon: '×', style: { color: 'red' } },
    warning: { icon: '▲', style: { color: 'yellow' } },
    info: { icon: 'i', style: { color: 'cyan' } },
    loading: { style: { color: 'cyan' }, display: { timer: true } },
    progress: { style: { color: 'cyan' }, display: { timer: true } },
    default: { icon: '●' },
  },
};
