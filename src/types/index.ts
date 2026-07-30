import type { ChalkInstance, ForegroundColorName, ModifierName } from 'chalk';
import type { CustomColor } from './color';

export type TimerUnit = 'auto' | 'ms' | 's' | 'm';

export type NotifyType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'progress';

export type ProgressVariant =
  | 'bar'
  | 'block'
  | 'line'
  | 'dot'
  | 'smooth'
  | 'shade'
  | 'slim'
  | 'pill'
  | 'braille'
  | 'circle'
  | 'diamond'
  | 'pacman'
  | 'none';

export type ProgressBarSet = {
  full: string;
  empty: string;
  head?: string;
  headAlt?: string;
};

export type ProgressVariantLike = ProgressVariant | ProgressBarSet;

export type NotifyDisplay = {
  icon?: boolean;
  timer?: boolean;
  // progress-specific
  spinner?: boolean;
  brackets?: boolean;
  percentage?: boolean;
  count?: boolean;
};

export type ProgressInitOptions = {
  current: number;
  total?: number;
  variant?: ProgressVariantLike;
};

export type ProgressOptions = Pick<ProgressInitOptions, 'current' | 'total'>;

export type ColorMode = 'icon-only' | 'text-only' | 'all' | 'none';

export type NotifyColor = ForegroundColorName | CustomColor | ChalkInstance;
// NOTE: resolved internal color config
export type NotifyStyleOptions = {
  mode?: ColorMode;
  color?: NotifyColor;
  // NOTE: we'll add bg manually
  backgroundColor?: NotifyColor;
  modifier?: ChalkInstance | ChalkInstance[];
} & Partial<Record<ModifierName, boolean>>;

export type InlineSegment =
  | string
  | { text: string; style?: NotifyStyleOptions };

export type Message = string | InlineSegment[];

// NOTE: developer options
export type NotifyOptions = {
  id?: string;
  icon?: string;
  toast?: boolean | { duration: number };
  keepAlive?: boolean;
  style?: NotifyStyleOptions;
  display?: Partial<NotifyDisplay>;
};

// NOTE: internal options
export type PromiseMessages<T = unknown> = {
  loading?: Message;
  success?: Message | ((data: T) => Message);
  error?: Message | ((error: unknown) => Message);
  finally?: () => void | Promise<void>;
};

// NOTE: handle types — returned by all notify.* and toast.* methods
export type NotifyHandle = {
  id: string;
  dismiss: () => void;
  update: (update: NotifyUpdate) => void;
};

export type NotifyUpdate = {
  type?: NotifyType;
  message?: Message;
  progress?: ProgressOptions;
  options?: NotifyOptions;
};

export type ProgressHandle = NotifyHandle & {
  advance: (n?: number) => void;
  set: (current: number) => void;
  done: (msg?: Message) => void;
  fail: (msg?: Message) => void;
  label: (msg: Message) => void;
};

export type ResolvedHandle<T> = NotifyHandle & {
  data: T;
  error: unknown;
};

export type PromiseHandle<T> = NotifyHandle & {
  result: Promise<T>;
} & PromiseLike<T>;

export type ProgressMessages = {
  success?: Message;
  error?: Message;
};

export type ProgressConfig = {
  total?: number;
  variant?: ProgressVariantLike;
};

export type NotifyVariantConfig = {
  icon?: string;
  style?: NotifyStyleOptions;
  display?: Partial<NotifyDisplay>;
};

// NOTE: global defaults config — set once via notify.defaults()
export type NotifyDefaults =
  // Top-level fallbacks for any type
  NotifyVariantConfig & {
    toast?: {
      defaultDuration?: number;
    };
    progress?: {
      defaultVariant?: ProgressVariant;
    };
    keepAlive?: boolean;
    // Per-type overrides (win over top-level)
    variants?: Partial<Record<NotifyType, NotifyVariantConfig>>;
  };

export type NotifyEntry = {
  id: string;
  type: NotifyType;
  message: string;
  icon?: string;
  createdAt: number;
  updatedAt?: number; // reset on update, used for duration/expiry check
  elapsed?: number;
  duration: number;
  persistent: boolean;
  keepAlive: boolean;
  spinnerIndex: number;
  style?: NotifyStyleOptions | undefined;
  display?: Partial<NotifyDisplay> | undefined;
  progress?: ProgressInitOptions | undefined;
};
