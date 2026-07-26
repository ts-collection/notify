import type {
  NotifyHandle,
  NotifyOptions,
  ProgressHandle,
  ProgressInitOptions,
  ProgressStartConfig,
  ProgressStartMessages,
  PromiseHandle,
  PromiseMessages,
} from '../types';
import { notify } from './notify';

type ToastOptions = Omit<NotifyOptions, 'toast'> & { duration?: number };
type ToastProgressFn = ((
  msg: string,
  opts?: ToastOptions & { progress?: ProgressInitOptions },
) => NotifyHandle) & {
  start: (
    config: ProgressStartConfig,
    messages?: ProgressStartMessages & { loading?: string },
  ) => ProgressHandle;
};

type ToastProgressOptions = ToastOptions & { progress?: ProgressInitOptions };

function toToastOptions(opts?: ToastOptions): NotifyOptions {
  const { duration, ...rest } = opts ?? {};
  return { ...rest, toast: duration ? { duration } : true };
}

function toToastProgressOptions(
  opts?: ToastProgressOptions,
): NotifyOptions & { progress?: ProgressInitOptions } {
  const { duration, progress, ...rest } = opts ?? {};
  const result: NotifyOptions & { progress?: ProgressInitOptions } = {
    ...rest,
    toast: duration ? { duration } : true,
  };
  if (progress !== undefined) result.progress = progress;
  return result;
}

function toast(msg: string, opts?: ToastOptions): NotifyHandle {
  return notify(msg, toToastOptions(opts));
}

toast.success = (msg: string, opts?: ToastOptions): NotifyHandle =>
  notify.success(msg, toToastOptions(opts));
toast.error = (msg: string, opts?: ToastOptions): NotifyHandle =>
  notify.error(msg, toToastOptions(opts));
toast.warning = (msg: string, opts?: ToastOptions): NotifyHandle =>
  notify.warning(msg, toToastOptions(opts));
toast.info = (msg: string, opts?: ToastOptions): NotifyHandle =>
  notify.info(msg, toToastOptions(opts));
toast.loading = (msg: string, opts?: ToastOptions): NotifyHandle =>
  notify.loading(msg, toToastOptions(opts));

const toastProgressFn: ToastProgressFn = (
  msg: string,
  opts?: ToastOptions & { progress?: ProgressInitOptions },
): NotifyHandle => notify.progress(msg, toToastProgressOptions(opts));
toastProgressFn.start = (
  config: ProgressStartConfig,
  messages?: ProgressStartMessages & { loading?: string },
): ProgressHandle => notify.progress.start(config, messages);
toast.progress = toastProgressFn;

toast.update = (id: string, update: Parameters<typeof notify.update>[1]) =>
  notify.update(id, update);
toast.promise = <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  messages: PromiseMessages<T>,
  opts?: ToastOptions,
): PromiseHandle<T> =>
  notify.promise(promiseOrFn, messages, toToastOptions(opts));
toast.dismiss = notify.dismiss;
toast.clear = notify.clear;

export { toast };
