export type NotifyType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading';

export type NotifyOptions = {
  toast?: boolean | { duration: number };
  id?: string;
};

export type NotifyEntry = {
  id: string;
  type: NotifyType;
  message: string;
  createdAt: number;
  duration: number;
  persistent: boolean;
  spinnerIndex: number;
};
