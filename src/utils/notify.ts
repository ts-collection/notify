import type { NotifyOptions } from '../types';
import { NotifyManager } from './manager';

const manager = new NotifyManager();

function base(message: string, options?: NotifyOptions) {
  return manager.add('default', message, options);
}

base.success = (message: string, options?: NotifyOptions) =>
  manager.add('success', message, options);
base.error = (message: string, options?: NotifyOptions) =>
  manager.add('error', message, options);
base.warning = (message: string, options?: NotifyOptions) =>
  manager.add('warning', message, options);
base.info = (message: string, options?: NotifyOptions) =>
  manager.add('info', message, options);
base.loading = (message: string, options?: NotifyOptions) =>
  manager.add('loading', message, options);
base.promise = async <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
    finally?: () => void | Promise<void>;
  },
  options?: NotifyOptions,
): Promise<T> => {
  const promise =
    typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

  const id = manager.add('loading', messages.loading, options);

  try {
    const data = await promise;
    const successMessage =
      typeof messages.success === 'function'
        ? messages.success(data)
        : messages.success;
    manager.update(id, 'success', successMessage, options);
    return data;
  } catch (err) {
    const errorMessage =
      typeof messages.error === 'function'
        ? messages.error(err)
        : messages.error;
    manager.update(id, 'error', errorMessage, options);
    throw err;
  } finally {
    await messages.finally?.();
  }
};
base.dismiss = (id: string) => manager.dismiss(id);
base.clear = () => manager.clear();

base.promise = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
  options?: NotifyOptions,
) => {
  const id = manager.add('loading', messages.loading, options);

  try {
    const data = await promise;
    const successMessage =
      typeof messages.success === 'function'
        ? messages.success(data)
        : messages.success;
    manager.update(id, 'success', successMessage, options);
    return data;
  } catch (err) {
    const errorMessage =
      typeof messages.error === 'function'
        ? messages.error(err)
        : messages.error;
    manager.update(id, 'error', errorMessage, options);
    throw err;
  }
};

export const notify = base;
