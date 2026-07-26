import type {
  NotifyHandle,
  NotifyOptions,
  NotifyUpdate,
  ProgressHandle,
  ProgressInitOptions,
  ProgressConfig,
  ProgressMessages,
  PromiseHandle,
  PromiseMessages,
} from '../types';

import { deriveLabel } from './helpers';
import { NotifyManager } from './manager';

const manager = new NotifyManager();

function toHandle(id: string): NotifyHandle {
  return manager.handle(id);
}

function base(message: string, options?: NotifyOptions): NotifyHandle {
  return toHandle(manager.add('default', message, options));
}

base.success = (message: string, options?: NotifyOptions): NotifyHandle =>
  toHandle(manager.add('success', message, options));
base.error = (message: string, options?: NotifyOptions): NotifyHandle =>
  toHandle(manager.add('error', message, options));
base.warning = (message: string, options?: NotifyOptions): NotifyHandle =>
  toHandle(manager.add('warning', message, options));
base.info = (message: string, options?: NotifyOptions): NotifyHandle =>
  toHandle(manager.add('info', message, options));
base.loading = (message: string, options?: NotifyOptions): NotifyHandle =>
  toHandle(manager.add('loading', message, options));

base.progress = (
  config: ProgressConfig,
  messages?: ProgressMessages & { loading?: string },
): ProgressHandle => {
  const loadingMsg = messages?.loading ?? 'Working...';
  const progress: ProgressInitOptions = {
    current: 0,
    ...(config.total !== undefined ? { total: config.total } : {}),
  };
  if (config.variant !== undefined) progress.variant = config.variant;
  if (config.display !== undefined) progress.display = config.display;
  const id = manager.add('loading', loadingMsg, { progress });
  return manager.progressHandle(id, config, messages);
};

base.update = (id: string, update: NotifyUpdate) => manager.update(id, update);

base.promise = <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  messages: PromiseMessages<T> = {},
  options?: NotifyOptions,
): PromiseHandle<T> => {
  const promise =
    typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

  const label = deriveLabel(promiseOrFn);
  const loadingMsg = messages.loading ?? `${label}Loading...`;

  const id = manager.add('loading', loadingMsg, options);
  const handle = toHandle(id);

  const result = promise
    .then((data: T) => {
      const rawSuccess = messages.success ?? `${label}Completed`;
      const successMessage =
        typeof rawSuccess === 'function' ? rawSuccess(data) : rawSuccess;
      manager.update(id, {
        type: 'success',
        message: successMessage,
        ...(options ? { options } : {}),
      });
      return data;
    })
    .catch((err: unknown) => {
      const rawError = messages.error ?? `${label}Failed`;
      const errorMessage =
        typeof rawError === 'function' ? rawError(err) : rawError;
      manager.update(id, {
        type: 'error',
        message: errorMessage,
        ...(options ? { options } : {}),
      });
      throw err;
    })
    .finally(() => messages.finally?.());

  return { ...handle, result };
};

base.dismiss = (id: string) => manager.dismiss(id);
base.clear = () => manager.clear();

export { manager };
export const notify = base;
