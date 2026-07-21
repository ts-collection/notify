export type NotifyType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading';

export interface NotifyOptions {
  toast?: { duration: number };
  id?: string;
}

export interface NotifyEntry {
  id: string;
  type: NotifyType;
  message: string;
  createdAt: number;
  duration: number;
  persistent: boolean;
  spinnerIndex: number;
}
