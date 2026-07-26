import type { NotifyOptions, ProgressInitOptions } from '../types';
import { notify } from './notify';

type ToastOptions = Omit<NotifyOptions, 'toast'> & { duration?: number };

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
toast.loading = (msg: string, opts?: ToastOptions) =>
  notify.loading(msg, toToastOptions(opts));
toast.progress = (msg: string, opts?: ToastProgressOptions) =>
  notify.progress(msg, toToastProgressOptions(opts));
toast.update = (
  id: string,
  update: Parameters<typeof notify.update>[1],
) => notify.update(id, update);
toast.promise = <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  messages: Parameters<typeof notify.promise>[1],
  opts?: ToastOptions,
) => notify.promise(promiseOrFn, messages, toToastOptions(opts));
toast.dismiss = notify.dismiss;
toast.clear = notify.clear;

export { toast };
