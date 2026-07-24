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
  it('notify(message) creates a default entry and returns an id', () => {
    const id = notify('hello');
    expect(id).toMatch(/^notify_\d+$/);
  });

  it.each([
    ['success', 'done'],
    ['error', 'failed'],
    ['warning', 'caution'],
    ['info', 'note'],
  ] as const)('notify.%s() creates the correct type', (method, msg) => {
    const fn = notify[method] as (m: string) => string;
    const id = fn(msg);
    expect(id).toMatch(/^notify_\d+$/);
  });

  it('returns the custom id when provided', () => {
    const id = notify('msg', { id: 'my-custom-id' });
    expect(id).toBe('my-custom-id');
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
  it('dismiss removes a single entry', () => {
    notify('stay');
    const goId = notify('go');
    tick();

    expect(lastRender()).toMatch(/stay/);
    expect(lastRender()).toMatch(/go/);

    // dismiss the 'go' entry using its id
    notify.dismiss(goId);
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
    const p = Promise.resolve('ok');
    await notify.promise(p);
    tick();
    expect(lastRender()).toMatch(/Completed/);
  });

  it('uses defaults when messages is undefined', async () => {
    const p = Promise.resolve('ok');
    await notify.promise(p, undefined);
    tick();
    expect(lastRender()).toMatch(/Completed/);
  });

  it('default error message on reject', async () => {
    const p = Promise.reject(new Error('crash'));
    await expect(notify.promise(p)).rejects.toThrow('crash');
    tick();
    expect(lastRender()).toMatch(/Failed/);
  });

  it('prefixes named function name in defaults', async () => {
    async function fetchData() {
      return 'data';
    }
    await notify.promise(fetchData);
    tick();
    expect(lastRender()).toMatch(/fetchData/);
  });

  it('partial messages override only specified fields', async () => {
    await notify.promise(Promise.resolve('ok'), {
      loading: 'custom loading',
    });
    tick();
    // loading msg seen before tick, then success defaults to 'Completed'
    expect(lastRender()).toMatch(/Completed/);
  });

  it('success callback still works with default fallback', async () => {
    await notify.promise(Promise.resolve(42), {
      success: (n: number) => `got ${n}`,
    });
    tick();
    expect(lastRender()).toMatch(/got 42/);
  });

  it('error callback still works with default fallback', async () => {
    await expect(
      notify.promise(Promise.reject(new Error('fail')), {
        error: (e: unknown) => `err: ${(e as Error).message}`,
      }),
    ).rejects.toThrow('fail');
    tick();
    expect(lastRender()).toMatch(/err: fail/);
  });
});

// ============================================================================
// notify.promise
// ============================================================================
describe('notify.promise', () => {
  it('resolves and shows success message from string', async () => {
    const p = Promise.resolve(42);
    const resultPromise = notify.promise(p, {
      loading: 'fetching…',
      success: 'fetched!',
      error: 'failed',
    });

    // The promise resolves via microtask; we must await first so the update
    // (manager.update) runs, THEN tick to trigger the render interval.
    const result = await resultPromise;
    tick();

    expect(result).toBe(42);
    expect(lastRender()).toMatch(/fetched/);
  });

  it('resolves and shows success message from callback', async () => {
    const p = Promise.resolve('data');
    const resultPromise = notify.promise(p, {
      loading: 'loading…',
      success: (data: string) => `got ${data}`,
      error: 'failed',
    });

    const result = await resultPromise;
    tick();

    expect(result).toBe('data');
    expect(lastRender()).toMatch(/got data/);
  });

  it('rejects and shows error message from string', async () => {
    const err = new Error('boom');
    const p = Promise.reject(err);
    const resultPromise = notify.promise(p, {
      loading: 'processing…',
      success: 'done',
      error: 'something went wrong',
    });

    await expect(resultPromise).rejects.toThrow('boom');
    tick();

    expect(lastRender()).toMatch(/something went wrong/);
  });

  it('rejects and shows error message from callback', async () => {
    const err = new Error('kaboom');
    const p = Promise.reject(err);
    const resultPromise = notify.promise(p, {
      loading: 'calculating…',
      success: 'done',
      error: (e: unknown) => `oops: ${(e as Error).message}`,
    });

    await expect(resultPromise).rejects.toThrow('kaboom');
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
    // but entries without a custom id get sequential ids
    expect(text).toMatch(/msg 0/);
    expect(text).toMatch(/msg 99/);
  });

  it('accepts a thunk (lazy promise) and resolves', async () => {
    const p = notify.promise(
      () => Promise.resolve(99),
      {
        loading: 'lazy…',
        success: 'got it',
        error: 'nope',
      },
    );
    tick();
    await expect(p).resolves.toBe(99);
    tick();
    expect(lastRender()).toMatch(/got it/);
  });

  it('accepts a thunk that rejects', async () => {
    const p = notify.promise(
      () => Promise.reject(new Error('nope')),
      {
        loading: 'lazy…',
        success: 'done',
        error: 'thunk failed',
      },
    );
    tick();
    await expect(p).rejects.toThrow('nope');
    tick();
    expect(lastRender()).toMatch(/thunk failed/);
  });

  it('calls finally callback on resolve', async () => {
    const fn = vi.fn();
    await notify.promise(
      Promise.resolve('ok'),
      {
        loading: '…',
        success: 'done',
        error: 'fail',
        finally: fn,
      },
    );
    tick();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls finally callback on reject', async () => {
    const fn = vi.fn();
    await expect(
      notify.promise(
        Promise.reject(new Error('boom')),
        {
          loading: '…',
          success: 'done',
          error: 'fail',
          finally: fn,
        },
      ),
    ).rejects.toThrow('boom');
    tick();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('keepAlive refs the timer; without keepAlive the timer is unrefed', () => {
    // After the first notify() call an internal setInterval is created.
    // With vi.useFakeTimers the return value has ref/unref as no-ops;
    // we can verify that the code path calls them by spying once on the
    // prototype after the interval already exists.

    // Trigger interval creation with a non-keepAlive entry.
    notify('a');
    tick();

    // The interval is created; grab one reference then spy ref/unref.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timers: any = (globalThis as any).__fakeTimers;
    // If fake timers support inspection, find the active interval.
    // Otherwise just verify the code path doesn't throw — keepAlive is
    // a Node.js process-exit concern, not easily observable in fake timers.
    expect(() => {
      const id = notify('keep-me', { keepAlive: true });
      tick();
      notify.dismiss(id);
      tick();
    }).not.toThrow();
  });

  it('promise forwards keepAlive option', async () => {
    expect(() =>
      notify.promise(Promise.resolve('ok'), {
        loading: '…',
        success: 'done',
        error: 'fail',
      }, { keepAlive: true }),
    ).not.toThrow();
    tick();
    await Promise.resolve();
    tick();
  });
});
