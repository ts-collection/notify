export type NotifyType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'progress';

export type ProgressVariant = 'bar' | 'block' | 'line' | 'dot' | 'none';

export type ProgressInitOptions = {
  current: number;
  total?: number;
  variant?: ProgressVariant;
  display: Partial<{
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
