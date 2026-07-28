import type { NotifyDefaults } from '../types';

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
    loading: { style: { color: 'cyan' } },
    progress: { style: { color: 'cyan' } },
    default: { icon: '●' },
  },
};
