import type { NotifyOptions, PromiseMessages } from '../types';
import { deriveLabel } from './helpers';
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
  messages: PromiseMessages<T> = {},
  options?: NotifyOptions,
): Promise<T> => {
  const promise =
    typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

  const label = deriveLabel(promiseOrFn);
  const loadingMsg = messages.loading ?? `${label}Loading...`;

  const id = manager.add('loading', loadingMsg, options);

  try {
    const data = await promise;
    const rawSuccess = messages.success ?? `${label}Completed`;
    const successMessage =
      typeof rawSuccess === 'function' ? rawSuccess(data) : rawSuccess;
    manager.update(id, 'success', successMessage, options);
    return data;
  } catch (err) {
    const rawError = messages.error ?? `${label}Failed`;
    const errorMessage =
      typeof rawError === 'function' ? rawError(err) : rawError;
    manager.update(id, 'error', errorMessage, options);
    throw err;
  } finally {
    await messages.finally?.();
  }
};
base.dismiss = (id: string) => manager.dismiss(id);
base.clear = () => manager.clear();

export const notify = base;
