import type {
  Message,
  NotifyHandle,
  NotifyOptions,
  ProgressConfig,
  ProgressHandle,
  ProgressMessages,
  PromiseHandle,
  PromiseMessages,
} from '../types';
import { notify } from './notify';

type ToastOptions = Omit<NotifyOptions, 'toast'> & { duration?: number };

function toToastOptions(opts?: ToastOptions): NotifyOptions {
  const { duration, ...rest } = opts ?? {};
  return { ...rest, toast: duration ? { duration } : true };
}

function toast(msg: Message, opts?: ToastOptions): NotifyHandle {
  return notify(msg, toToastOptions(opts));
}

toast.success = (msg: Message, opts?: ToastOptions): NotifyHandle =>
  notify.success(msg, toToastOptions(opts));
toast.error = (msg: Message, opts?: ToastOptions): NotifyHandle =>
  notify.error(msg, toToastOptions(opts));
toast.warning = (msg: Message, opts?: ToastOptions): NotifyHandle =>
  notify.warning(msg, toToastOptions(opts));
toast.info = (msg: Message, opts?: ToastOptions): NotifyHandle =>
  notify.info(msg, toToastOptions(opts));
toast.loading = (msg: Message, opts?: ToastOptions): NotifyHandle =>
  notify.loading(msg, toToastOptions(opts));

toast.progress = (
  config: ProgressConfig,
  messages?: ProgressMessages & { loading?: Message },
  opts?: ToastOptions,
): ProgressHandle => notify.progress(config, messages, toToastOptions(opts));

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
