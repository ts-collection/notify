import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogUpdate, mockLogUpdateClear } = vi.hoisted(() => {
  const logUpdate = vi.fn();
  const clear = vi.fn();
  return { mockLogUpdate: logUpdate, mockLogUpdateClear: clear };
});

vi.mock('log-update', () => ({
  createLogUpdate: () =>
    Object.assign(mockLogUpdate, { clear: mockLogUpdateClear }),
}));

vi.useFakeTimers({
  toFake: [
    'Date',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
  ],
});

import { notify } from '../src/utils/notify';
import { toast } from '../src/utils/toast';

function tick() {
  vi.advanceTimersByTime(80);
}

function lastRender(): string {
  const calls = mockLogUpdate.mock.calls;
  if (calls.length === 0) return '';
  return calls[calls.length - 1][0].replace(/\u001b\[[0-9;]*m/g, '').trim();
}

beforeEach(() => {
  mockLogUpdate.mockClear();
  mockLogUpdateClear.mockClear();
  toast.clear();
  tick();
  mockLogUpdate.mockClear();
});

afterEach(() => {
  toast.clear();
});

describe('toast', () => {
  it('delegates to notify with toast: true and returns a handle', () => {
    const handle = toast('hello');
    tick();
    expect(handle.id).toMatch(/^notify_\d+$/);
    expect(handle.dismiss).toBeInstanceOf(Function);
    expect(lastRender()).toMatch(/hello/);
  });

  it('success/error/warning/info all render', () => {
    toast('hold');
    tick();

    toast.success('ok!');
    toast.error('no!');
    toast.warning('warn');
    toast.info('info');
    tick();

    const text = lastRender();
    expect(text).toMatch(/ok!/);
    expect(text).toMatch(/no!/);
    expect(text).toMatch(/warn/);
    expect(text).toMatch(/info/);
  });

  it('loading delegates to notify.loading (persistent)', () => {
    toast.loading('working');
    tick();
    expect(lastRender()).toMatch(/working/);

    vi.advanceTimersByTime(10_000);
    tick();
    expect(lastRender()).toMatch(/working/);
  });

  it('handle.dismiss works', () => {
    toast('hold');
    const handle = toast('bye');
    tick();
    expect(lastRender()).toMatch(/bye/);

    handle.dismiss();
    tick();
    expect(lastRender()).not.toMatch(/bye/);
  });

  it('clear removes all entries and clears the log update', () => {
    toast('a');
    toast('b');
    tick();
    expect(mockLogUpdate.mock.calls.length).toBeGreaterThan(0);

    toast.clear();
    expect(mockLogUpdateClear).toHaveBeenCalled();
  });

  it('auto-dismisses after default duration', () => {
    // Add a persistent entry so the loop stays alive
    notify('anchor');
    tick();

    // Add a toast
    toast('transient');
    tick();
    expect(lastRender()).toMatch(/transient/);

    // Advance well past 3000ms
    vi.advanceTimersByTime(3100);
    tick();

    const text = lastRender();
    expect(text).not.toMatch(/transient/);
    expect(text).toMatch(/anchor/);
  });

  it('toast.promise returns a PromiseHandle with .result', async () => {
    const handle = toast.promise(Promise.resolve(42), {
      loading: '…',
      success: 'done',
      error: 'fail',
    });
    tick();
    const data = await handle.result;
    tick();
    expect(data).toBe(42);
    expect(lastRender()).toMatch(/done/);
  });

  it('toast.progress returns a ProgressHandle', () => {
    const bar = toast.progress({ total: 3 });
    expect(bar.advance).toBeInstanceOf(Function);
    expect(bar.set).toBeInstanceOf(Function);
    expect(bar.done).toBeInstanceOf(Function);
    expect(bar.fail).toBeInstanceOf(Function);
    expect(bar.label).toBeInstanceOf(Function);
  });
});
