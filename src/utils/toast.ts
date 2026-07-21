import type { NotifyOptions } from '../types';
import { notify } from './notify';

type ToastOptions = Omit<NotifyOptions, 'toast'> & { duration?: number };

function toToastOptions(opts?: ToastOptions): NotifyOptions {
  const { duration, ...rest } = opts ?? {};
  return { ...rest, toast: duration ? { duration } : true };
}

function toast(msg: string, opts?: ToastOptions) {
  return notify(msg, toToastOptions(opts));
}
toast.success = (msg: string, opts?: ToastOptions) =>
  notify.success(msg, toToastOptions(opts));
toast.error = (msg: string, opts?: ToastOptions) =>
  notify.error(msg, toToastOptions(opts));
toast.warning = (msg: string, opts?: ToastOptions) =>
  notify.warning(msg, toToastOptions(opts));
toast.info = (msg: string, opts?: ToastOptions) =>
  notify.info(msg, toToastOptions(opts));

toast.loading = notify.loading;

toast.promise = <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  messages: Parameters<typeof notify.promise>[1],
  opts?: ToastOptions,
) => notify.promise(promiseOrFn, messages, toToastOptions(opts));

toast.dismiss = notify.dismiss;
toast.clear = notify.clear;

export { toast };
