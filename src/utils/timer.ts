import type { TimerUnit } from '../types';

const store = new Map<string, number>();

function factor(unit: TimerUnit): number {
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

function get(id: string, unit: TimerUnit = 's'): number {
  const ts = store.get(id);
  if (ts === undefined) throw new Error(`Timer "${id}" not found`);
  return (Date.now() - ts) / factor(unit);
}

function stop(id: string, unit: TimerUnit = 's'): number {
  const elapsed = get(id, unit);
  store.delete(id);
  return elapsed;
}

export const timer = { start, get, stop };
