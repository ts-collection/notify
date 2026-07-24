export type NotifyType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading';

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
};
