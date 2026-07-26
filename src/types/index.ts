export type NotifyType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'progress';

export type ProgressVariant = 'bar' | 'block' | 'line' | 'dot' | 'none';

export type ProgressBarSet = {
  full: string;
  empty: string;
};

export type ProgressInitOptions = {
  current: number;
  total?: number;
  variant?: ProgressVariant;
  display?: Partial<{
    spinner: boolean;
    brackets: boolean;
    percentage: boolean;
    count: boolean;
  }>;
};

export type ProgressOptions = Pick<ProgressInitOptions, 'current' | 'total'>;

// NOTE: developer options
export type NotifyOptions = {
  id?: string;
  toast?: boolean | { duration: number };
  keepAlive?: boolean;
};

// NOTE: internal options
export type PromiseMessages<T = unknown> = {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((error: unknown) => string);
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
  message?: string;
  progress?: ProgressOptions;
  options?: NotifyOptions;
};

export type ProgressHandle = NotifyHandle & {
  advance: (n?: number) => void;
  set: (current: number) => void;
  done: (msg?: string) => void;
  fail: (msg?: string) => void;
  label: (msg: string) => void;
};

export type PromiseHandle<T> = NotifyHandle & {
  result: Promise<T>;
};

export type ProgressStartMessages = {
  success?: string;
  error?: string;
};

export type ProgressStartConfig = {
  total: number;
  variant?: ProgressVariant;
  display?: Partial<{
    spinner: boolean;
    brackets: boolean;
    percentage: boolean;
    count: boolean;
  }>;
};

export type NotifyEntry = {
  id: string;
  type: NotifyType;
  message: string;
  createdAt: number;
  duration: number;
  persistent: boolean;
  keepAlive: boolean;
  spinnerIndex: number;
  progress?: ProgressInitOptions;
};
