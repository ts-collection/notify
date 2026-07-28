import type { NotifyHandle, TimerUnit } from '../types';
import { formatElapsed } from './helpers';
import { notify } from './notify';

const store = new Map<string, number>();
let counter = 0;

export type MeasureMessages = {
  loading?: string;
  success?: string | ((elapsed: number) => string);
  error?: string | ((error: unknown) => string);
};

function factor(unit: Exclude<TimerUnit, 'auto'>): number {
  switch (unit) {
    case 'ms':
      return 1;
    case 's':
      return 1000;
    case 'm':
      return 60_000;
  }
}

function start(id: string): void {
  store.set(id, Date.now());
}

function get(id: string, unit: TimerUnit = 'auto'): number {
  const ts = store.get(id);
  if (ts === undefined) throw new Error(`Timer "${id}" not found`);
  const ms = Date.now() - ts;
  // NOTE: 'auto' returns seconds (same as 's') for callback compatibility
  if (unit === 'auto') return ms / 1000;
  return ms / factor(unit);
}

function stop(id: string, unit: TimerUnit = 'auto'): number {
  const elapsed = get(id, unit);
  store.delete(id);
  return elapsed;
}

function getFnLabel(fn: Function): string {
  return fn.name ? `${fn.name} ` : '';
}

function resolveSuccessMsg(
  label: string,
  elapsedMs: number,
  msg?: string | ((elapsed: number) => string),
): string {
  return msg === undefined
    ? `${label}Completed in ${formatElapsed(elapsedMs)}`
    : typeof msg === 'function'
      ? msg(elapsedMs / 1000)
      : msg;
}

function resolveErrorMsg(
  label: string,
  elapsedMs: number,
  err: unknown,
  msg?: string | ((error: unknown) => string),
): string {
  return msg === undefined
    ? `${label}Failed in ${formatElapsed(elapsedMs)}`
    : typeof msg === 'function'
      ? msg(err)
      : msg;
}

function measure<T>(
  fn: () => Promise<T>,
  messages?: MeasureMessages,
): Promise<T>;
function measure<T>(fn: () => T, messages?: MeasureMessages): T;
function measure<T>(
  fn: (() => T) | (() => Promise<T>),
  messages?: MeasureMessages,
): T | Promise<T> {
  const label = getFnLabel(fn);
  const id = `measure_${counter++}`;

  const startedAt = Date.now();

  let handle: NotifyHandle | undefined;
  if (messages?.loading) {
    handle = notify.loading(messages.loading, { id });
  }

  try {
    const result = fn();

    // NOTE: async path — chain .then/.catch on the promise
    if (result instanceof Promise) {
      return result
        .then((data) => {
          const elapsedMs = Date.now() - startedAt;
          store.delete(id);
          const msg = resolveSuccessMsg(label, elapsedMs, messages?.success);
          if (handle) handle.update({ type: 'success', message: msg });
          else notify.success(msg);
          return data;
        })
        .catch((err: unknown) => {
          const elapsedMs = Date.now() - startedAt;
          store.delete(id);
          const msg = resolveErrorMsg(label, elapsedMs, err, messages?.error);
          if (handle) handle.update({ type: 'error', message: msg });
          else notify.error(msg);
          throw err;
        });
    }

    // NOTE: sync path
    const elapsedMs = Date.now() - startedAt;
    store.delete(id);
    const msg = resolveSuccessMsg(label, elapsedMs, messages?.success);
    if (handle) handle.update({ type: 'success', message: msg });
    else notify.success(msg);
    return result;
  } catch (err) {
    // NOTE: sync throw or error inside fn() before return
    const elapsedMs = Date.now() - startedAt;
    store.delete(id);
    const msg = resolveErrorMsg(label, elapsedMs, err, messages?.error);
    if (handle) handle.update({ type: 'error', message: msg });
    else notify.error(msg);
    throw err;
  }
}

export const timer = { start, get, stop, measure };
