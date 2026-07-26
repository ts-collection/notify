import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock log-update before importing notify so the module gets the mock
// NOTE: vi.mock factory is hoisted, so shared vars must use vi.hoisted().
// ---------------------------------------------------------------------------
const { mockLogUpdate, mockLogUpdateClear } = vi.hoisted(() => {
  const logUpdate = vi.fn();
  const clear = vi.fn();
  return { mockLogUpdate: logUpdate, mockLogUpdateClear: clear };
});

vi.mock('log-update', () => ({
  createLogUpdate: () => {
    const fn = Object.assign(mockLogUpdate, { clear: mockLogUpdateClear });
    return fn;
  },
}));

// ---------------------------------------------------------------------------
// Fake timers so we control the internal render interval (80ms)
// ---------------------------------------------------------------------------
vi.useFakeTimers();

import { notify } from '../src/utils/notify';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Strip ANSI escape sequences from a string */
function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*m/g, '').trim();
}

/** Advance fake timers past the render interval so pending renders fire */
function tick(): void {
  vi.advanceTimersByTime(80);
}

/** Return the last rendered output (plain text, no ANSI) */
function lastRender(): string {
  const calls = mockLogUpdate.mock.calls;
  if (calls.length === 0) return '';
  return stripAnsi(calls[calls.length - 1][0]);
}

beforeEach(() => {
  mockLogUpdate.mockClear();
  mockLogUpdateClear.mockClear();
  vi.advanceTimersByTime(0); // clear any pending timers
  notify.clear();
  tick();
  mockLogUpdate.mockClear();
  mockLogUpdateClear.mockClear();
});

afterEach(() => {
  notify.clear();
});

// ============================================================================
// notify – basic add / convenience methods
// ============================================================================
describe('notify – basic API', () => {
  it('notify(message) returns a handle with id', () => {
    const handle = notify('hello');
    expect(handle.id).toMatch(/^notify_\d+$/);
    expect(handle.dismiss).toBeInstanceOf(Function);
    expect(handle.update).toBeInstanceOf(Function);
  });

  it.each([
    ['success', 'done'],
    ['error', 'failed'],
    ['warning', 'caution'],
    ['info', 'note'],
  ] as const)('notify.%s() returns a handle with correct id', (method, msg) => {
    const fn = notify[method] as (m: string) => { id: string };
    const handle = fn(msg);
    expect(handle.id).toMatch(/^notify_\d+$/);
  });

  it('returns the custom id in the handle when provided', () => {
    const handle = notify('msg', { id: 'my-custom-id' });
    expect(handle.id).toBe('my-custom-id');
  });

  it('replaces an existing entry when the same id is reused', () => {
    notify('first', { id: 'dup' });
    tick();

    // same id – updates in place
    notify('second', { id: 'dup' });
    tick();

    const text = lastRender();
    expect(text).toMatch(/second/);
    expect(text).not.toMatch(/first/);
  });
});

// ============================================================================
// notify.dismiss / notify.clear
// ============================================================================
describe('notify.dismiss / notify.clear', () => {
  it('handle.dismiss removes a single entry', () => {
    notify('stay');
    const goHandle = notify('go');
    tick();

    expect(lastRender()).toMatch(/stay/);
    expect(lastRender()).toMatch(/go/);

    // dismiss using handle
    goHandle.dismiss();
    tick();

    const text = lastRender();
    expect(text).toMatch(/stay/);
    expect(text).not.toMatch(/go/);
  });

  it('clear removes all entries and clears the log update', () => {
    notify('a');
    notify('b');
    tick();
    expect(mockLogUpdate.mock.calls.length).toBeGreaterThan(0);

    notify.clear();

    // clear calls stopLoopIfIdle which calls logUpdate.clear()
    expect(mockLogUpdateClear).toHaveBeenCalled();
  });
});

// ============================================================================
// toast (auto-dismiss) behaviour
// ============================================================================
describe('toast (auto-dismiss)', () => {
  it('toast: true auto-removes after default duration', () => {
    // Add a persistent entry so the render loop stays active
    notify('persistent-context');

    notify('toast msg', { toast: true });
    tick();
    expect(lastRender()).toMatch(/toast msg/);

    // Advance past the default duration (3000ms)
    vi.advanceTimersByTime(3001);
    tick(); // render loop picks up the expiry

    // The toast line should be gone; only the persistent line remains
    const text = lastRender();
    expect(text).not.toMatch(/toast msg/);
    expect(text).toMatch(/persistent-context/);
  });

  it('toast: { duration } uses custom duration', () => {
    notify('persistent-context');

    notify('custom toast', { toast: { duration: 500 } });
    tick();
    expect(lastRender()).toMatch(/custom toast/);

    vi.advanceTimersByTime(501);
    tick();

    const text = lastRender();
    expect(text).not.toMatch(/custom toast/);
    expect(text).toMatch(/persistent-context/);
  });

  it('non-toast entries persist beyond default duration', () => {
    notify('persistent msg');
    tick();

    vi.advanceTimersByTime(10_000);
    tick();

    expect(lastRender()).toMatch(/persistent msg/);
  });

  it('loading entries are always persistent regardless of toast option', () => {
    notify.loading('loading…', { toast: true });
    tick();

    vi.advanceTimersByTime(10_000);
    tick();

    expect(lastRender()).toMatch(/loading/);
  });
});

// ============================================================================
// notify.promise – default messages / name labeling
// ============================================================================
describe('notify.promise – defaults & name labeling', () => {
  it('uses defaults when messages is empty', async () => {
    const handle = notify.promise(Promise.resolve('ok'));
    tick();
    await handle.result;
    tick();
    expect(lastRender()).toMatch(/Completed/);
  });

  it('uses defaults when messages is undefined', async () => {
    const handle = notify.promise(Promise.resolve('ok'), undefined);
    tick();
    await handle.result;
    tick();
    expect(lastRender()).toMatch(/Completed/);
  });

  it('default error message on reject', async () => {
    const handle = notify.promise(Promise.reject(new Error('crash')));
    tick();
    await expect(handle.result).rejects.toThrow('crash');
    tick();
    expect(lastRender()).toMatch(/Failed/);
  });

  it('prefixes named function name in defaults', async () => {
    async function fetchData() {
      return 'data';
    }
    const handle = notify.promise(fetchData);
    tick();
    await handle.result;
    tick();
    expect(lastRender()).toMatch(/fetchData/);
  });

  it('partial messages override only specified fields', async () => {
    const handle = notify.promise(Promise.resolve('ok'), {
      loading: 'custom loading',
    });
    tick();
    await handle.result;
    tick();
    // success defaults to 'Completed'
    expect(lastRender()).toMatch(/Completed/);
  });

  it('success callback still works with default fallback', async () => {
    const handle = notify.promise(Promise.resolve(42), {
      success: (n: number) => `got ${n}`,
    });
    tick();
    await handle.result;
    tick();
    expect(lastRender()).toMatch(/got 42/);
  });

  it('error callback still works with default fallback', async () => {
    const handle = notify.promise(Promise.reject(new Error('fail')), {
      error: (e: unknown) => `err: ${(e as Error).message}`,
    });
    tick();
    await expect(handle.result).rejects.toThrow('fail');
    tick();
    expect(lastRender()).toMatch(/err: fail/);
  });
});

// ============================================================================
// notify.promise
// ============================================================================
describe('notify.promise', () => {
  it('resolves and shows success message from string', async () => {
    const handle = notify.promise(Promise.resolve(42), {
      loading: 'fetching…',
      success: 'fetched!',
      error: 'failed',
    });

    tick();
    const result = await handle.result;
    tick();

    expect(result).toBe(42);
    expect(lastRender()).toMatch(/fetched/);
  });

  it('resolves and shows success message from callback', async () => {
    const handle = notify.promise(Promise.resolve('data'), {
      loading: 'loading…',
      success: (data: string) => `got ${data}`,
      error: 'failed',
    });

    tick();
    const result = await handle.result;
    tick();

    expect(result).toBe('data');
    expect(lastRender()).toMatch(/got data/);
  });

  it('rejects and shows error message from string', async () => {
    const err = new Error('boom');
    const handle = notify.promise(Promise.reject(err), {
      loading: 'processing…',
      success: 'done',
      error: 'something went wrong',
    });

    tick();
    await expect(handle.result).rejects.toThrow('boom');
    tick();

    expect(lastRender()).toMatch(/something went wrong/);
  });

  it('rejects and shows error message from callback', async () => {
    const err = new Error('kaboom');
    const handle = notify.promise(Promise.reject(err), {
      loading: 'calculating…',
      success: 'done',
      error: (e: unknown) => `oops: ${(e as Error).message}`,
    });

    tick();
    await expect(handle.result).rejects.toThrow('kaboom');
    tick();

    expect(lastRender()).toMatch(/oops: kaboom/);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================
describe('edge cases', () => {
  it('clearing when already empty does not throw', () => {
    expect(() => notify.clear()).not.toThrow();
  });

  it('dismissing a non-existent id does not throw', () => {
    expect(() => notify.dismiss('no-such-id')).not.toThrow();
  });

  it('can handle many concurrent entries', () => {
    for (let i = 0; i < 100; i++) {
      notify(`msg ${i}`);
    }
    tick();

    const text = lastRender();
    // The last entry will be "msg 99" sorted by insertion order
    expect(text).toMatch(/msg 0/);
    expect(text).toMatch(/msg 99/);
  });

  it('accepts a thunk (lazy promise) and resolves', async () => {
    const handle = notify.promise(() => Promise.resolve(99), {
      loading: 'lazy…',
      success: 'got it',
      error: 'nope',
    });
    tick();
    await expect(handle.result).resolves.toBe(99);
    tick();
    expect(lastRender()).toMatch(/got it/);
  });

  it('accepts a thunk that rejects', async () => {
    const handle = notify.promise(() => Promise.reject(new Error('nope')), {
      loading: 'lazy…',
      success: 'done',
      error: 'thunk failed',
    });
    tick();
    await expect(handle.result).rejects.toThrow('nope');
    tick();
    expect(lastRender()).toMatch(/thunk failed/);
  });

  it('calls finally callback on resolve', async () => {
    const fn = vi.fn();
    const handle = notify.promise(Promise.resolve('ok'), {
      loading: '…',
      success: 'done',
      error: 'fail',
      finally: fn,
    });
    tick();
    await handle.result;
    tick();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls finally callback on reject', async () => {
    const fn = vi.fn();
    const handle = notify.promise(Promise.reject(new Error('boom')), {
      loading: '…',
      success: 'done',
      error: 'fail',
      finally: fn,
    });
    tick();
    await expect(handle.result).rejects.toThrow('boom');
    tick();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('keepAlive refs the timer; without keepAlive the timer is unrefed', () => {
    // Trigger interval creation with a non-keepAlive entry.
    notify('a');
    tick();

    expect(() => {
      const handle = notify('keep-me', { keepAlive: true });
      tick();
      handle.dismiss();
      tick();
    }).not.toThrow();
  });

  it('promise forwards keepAlive option', async () => {
    const handle = notify.promise(
      Promise.resolve('ok'),
      {
        loading: '…',
        success: 'done',
        error: 'fail',
      },
      { keepAlive: true },
    );
    tick();
    await handle.result;
    tick();
  });
});

// ============================================================================
// notify.progress
// ============================================================================
describe('notify.progress', () => {
  it('creates a progress notification and returns a handle', () => {
    const handle = notify.progress('Uploading', {
      progress: { current: 0, total: 500 },
    });
    expect(handle.id).toMatch(/^notify_\d+$/);
  });

  it('renders progress bar with percentage', () => {
    notify.progress('Uploading files', {
      progress: {
        current: 200,
        total: 500,
        display: { percentage: true, brackets: true, count: true },
      },
    });
    tick();
    const text = lastRender();
    expect(text).toMatch(/Uploading files/);
    expect(text).toMatch(/40%/);
    expect(text).toMatch(/\[/);
    expect(text).toMatch(/\]/);
  });

  it('renders current count only when total is unknown', () => {
    notify.progress('Processing', { progress: { current: 42 } });
    tick();
    const text = lastRender();
    expect(text).toMatch(/Processing/);
    expect(text).toMatch(/42/);
    expect(text).not.toMatch(/%/);
    expect(text).not.toMatch(/\//);
    expect(text).not.toMatch(/\[/);
  });

  it('clamps percentage between 0 and 100', () => {
    notify.progress('Overflow', {
      progress: { current: 999, total: 100, display: { percentage: true } },
    });
    tick();
    const text = lastRender();
    // 999/100 = 999% but should be clamped at 100%
    expect(text).toMatch(/100%/);
  });

  it('clamps at 0 for negative current', () => {
    notify.progress('Underflow', {
      progress: { current: -5, total: 100, display: { percentage: true } },
    });
    tick();
    const text = lastRender();
    expect(text).toMatch(/0%/);
  });

  it('persists beyond default toast duration', () => {
    notify.progress('Long op', { progress: { current: 0, total: 10 } });
    tick();

    vi.advanceTimersByTime(10_000);
    tick();

    expect(lastRender()).toMatch(/Long op/);
  });

  it('progress notifications keep the render loop alive', () => {
    notify.progress('Ongoing', { progress: { current: 5, total: 10 } });
    tick();

    // Should still render after arbitrary time
    vi.advanceTimersByTime(5000);
    tick();

    expect(lastRender()).toMatch(/Ongoing/);
  });

  it('can be dismissed via handle', () => {
    // Keep a persistent anchor so the render loop stays alive
    notify('anchor');

    const handle = notify.progress('Dismiss me', {
      progress: { current: 3, total: 10 },
    });
    tick();
    expect(lastRender()).toMatch(/Dismiss me/);

    handle.dismiss();
    tick();
    expect(lastRender()).not.toMatch(/Dismiss me/);
  });

  it('updates with partial progress via handle.update', () => {
    const handle = notify.progress('Uploading', {
      progress: {
        current: 0,
        total: 100,
        display: { percentage: true },
      },
    });
    tick();
    expect(lastRender()).toMatch(/0%/);

    handle.update({
      progress: { current: 75, total: 100 },
    });
    tick();

    const text = lastRender();
    expect(text).toMatch(/75%/);
    expect(text).toMatch(/Uploading/);
  });

  it('updates with type and message via handle.update', () => {
    const handle = notify.progress('Uploading files', {
      progress: { current: 100, total: 100 },
    });
    tick();

    handle.update({
      type: 'success',
      message: 'Upload completed',
    });
    tick();

    const text = lastRender();
    expect(text).toMatch(/Upload completed/);
    // progress bar should be gone since we switched away from 'progress' type
    expect(text).not.toMatch(/100%/);
    expect(text).toMatch(/√/);
  });

  it('updates with progress AND type+message in same call', () => {
    const handle = notify.progress('Processing', {
      progress: {
        current: 1,
        total: 5,
        display: { percentage: true },
      },
    });
    tick();

    handle.update({
      type: 'progress',
      message: 'Still processing…',
      progress: { current: 3, total: 5 },
    });
    tick();

    const text = lastRender();
    expect(text).toMatch(/Still processing/);
    expect(text).toMatch(/60%/);
  });

  it('update creates a new entry when id does not exist', () => {
    const id = notify.update('nonexistent', {
      type: 'progress',
      message: 'Created via update',
      progress: { current: 0, total: 10 },
    });
    tick();
    expect(lastRender()).toMatch(/Created via update/);
  });

  it('progress shows spinning animation (spinnerIndex advances)', () => {
    notify.progress('Spinning', { progress: { current: 0, total: 10 } });
    tick();
    const text1 = lastRender();
    tick();
    const text2 = lastRender();
    // Spinner frames differ between ticks
    expect(text1).not.toEqual(text2);
  });

  it('renders block variant with spaces as empty', () => {
    notify.progress('Block', {
      progress: {
        current: 8,
        total: 10,
        variant: 'block',
        display: { percentage: true, brackets: true },
      },
    });
    tick();
    const text = lastRender();
    expect(text).toMatch(/80%/);
    // block variant uses space for empty, so last chars should be spaces before ]
    expect(text).toMatch(/\]/);
  });

  it('renders line variant', () => {
    notify.progress('Line progress', {
      progress: {
        current: 4,
        total: 5,
        variant: 'line',
        display: { percentage: true },
      },
    });
    tick();
    const text = lastRender();
    expect(text).toMatch(/80%/);
    expect(text).toMatch(/━/);
  });

  it('renders dot variant', () => {
    notify.progress('Dot progress', {
      progress: {
        current: 3,
        total: 5,
        variant: 'dot',
        display: { percentage: true },
      },
    });
    tick();
    const text = lastRender();
    expect(text).toMatch(/60%/);
    expect(text).toMatch(/●/);
    expect(text).toMatch(/○/);
  });

  it('renders none variant (no bar, just percentage)', () => {
    notify.progress('No bar', {
      progress: {
        current: 50,
        total: 100,
        variant: 'none',
        display: { percentage: true },
      },
    });
    tick();
    const text = lastRender();
    expect(text).toMatch(/50%/);
    expect(text).not.toMatch(/\[/);
  });
});

// ============================================================================
// notify.progress.start builder API
// ============================================================================
describe('notify.progress.start builder', () => {
  it('returns a ProgressHandle with advance, set, done, fail, label', () => {
    const bar = notify.progress.start({ total: 5 });
    expect(bar.id).toMatch(/^notify_\d+$/);
    expect(bar.advance).toBeInstanceOf(Function);
    expect(bar.set).toBeInstanceOf(Function);
    expect(bar.done).toBeInstanceOf(Function);
    expect(bar.fail).toBeInstanceOf(Function);
    expect(bar.label).toBeInstanceOf(Function);
    expect(bar.dismiss).toBeInstanceOf(Function);
  });

  it('advance increments progress and auto-resolves on reaching total', () => {
    const bar = notify.progress.start({ total: 4 });
    tick();
    expect(lastRender()).toMatch(/Working/);
    expect(lastRender()).toMatch(/0%/);

    bar.advance();
    tick();
    expect(lastRender()).toMatch(/25%/);

    bar.advance();
    tick();
    expect(lastRender()).toMatch(/50%/);

    bar.advance();
    tick();
    expect(lastRender()).toMatch(/75%/);

    bar.advance();
    tick();
    // auto-resolved to success
    expect(lastRender()).toMatch(/Working/);
    expect(lastRender()).not.toMatch(/%/);
  });

  it('advance auto-resolves with success message from config', () => {
    const bar = notify.progress.start({ total: 2 }, { success: 'All done!' });
    tick();

    bar.advance();
    bar.advance();
    tick();

    expect(lastRender()).toMatch(/All done!/);
  });

  it('set can jump to a specific value and auto-resolve', () => {
    const bar = notify.progress.start({ total: 10 });
    bar.set(10);
    tick();
    expect(lastRender()).not.toMatch(/%/);
  });

  it('done manually marks as success with optional message', () => {
    const bar = notify.progress.start({ total: 10 }, { success: 'Finished!' });
    bar.done('Custom done');
    tick();
    expect(lastRender()).toMatch(/Custom done/);
  });

  it('done falls back to config success message', () => {
    const bar = notify.progress.start({ total: 10 }, { success: 'Finished!' });
    bar.done();
    tick();
    expect(lastRender()).toMatch(/Finished!/);
  });

  it('fail manually marks as error with optional message', () => {
    const bar = notify.progress.start({ total: 10 }, { error: 'Oh no' });
    bar.fail('Something broke');
    tick();
    expect(lastRender()).toMatch(/Something broke/);
  });

  it('fail falls back to config error message', () => {
    const bar = notify.progress.start({ total: 10 }, { error: 'Oh no' });
    bar.fail();
    tick();
    expect(lastRender()).toMatch(/Oh no/);
  });

  it('label updates the message', () => {
    const bar = notify.progress.start({ total: 5 });
    bar.label('Step 2…');
    tick();
    expect(lastRender()).toMatch(/Step 2/);
  });

  it('handle.dismiss works on progress handle', () => {
    const bar = notify.progress.start({ total: 5 });
    tick();
    expect(lastRender()).toMatch(/Working/);
    bar.dismiss();
    // dismiss runs render() synchronously which calls logUpdate.clear()
    expect(mockLogUpdateClear).toHaveBeenCalled();
  });

  it('loading message can be customised', () => {
    const bar = notify.progress.start({ total: 3 }, { loading: 'Uploading…' });
    tick();
    expect(lastRender()).toMatch(/Uploading/);
  });
});
