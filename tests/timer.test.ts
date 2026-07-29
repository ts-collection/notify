import chalk from 'chalk';
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

vi.useFakeTimers();

const { timer } = await import('../src/utils/timer');

function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*m/g, '').trim();
}

describe('timer', () => {
  beforeEach(() => {
    vi.advanceTimersByTime(100); // advance past import timing noise
    mockLogUpdate.mockClear();
    mockLogUpdateClear.mockClear();
  });

  afterEach(() => {
    vi.setSystemTime(0);
  });

  it('start and get elapsed in seconds', () => {
    timer.start('a');
    vi.advanceTimersByTime(2500);
    expect(timer.get('a')).toBeCloseTo(2.5, 1);
  });

  it('get in ms', () => {
    timer.start('b');
    vi.advanceTimersByTime(500);
    expect(timer.get('b', 'ms')).toBeCloseTo(500);
  });

  it('get in minutes', () => {
    timer.start('c');
    vi.advanceTimersByTime(120_000);
    expect(timer.get('c', 'm')).toBeCloseTo(2);
  });

  it('stop returns elapsed and removes timer', () => {
    timer.start('d');
    vi.advanceTimersByTime(1000);
    const elapsed = timer.stop('d');
    expect(elapsed).toBeCloseTo(1);
    expect(() => timer.get('d')).toThrow('Timer "d" not found');
  });

  it('stop with unit', () => {
    timer.start('e');
    vi.advanceTimersByTime(3000);
    expect(timer.stop('e', 'ms')).toBeCloseTo(3000);
  });

  it('throws on missing timer', () => {
    expect(() => timer.get('nonexistent')).toThrow(
      'Timer "nonexistent" not found',
    );
  });

  it('multiple independent timers', () => {
    timer.start('early');
    vi.advanceTimersByTime(2000);
    timer.start('late');
    vi.advanceTimersByTime(1000);

    expect(timer.stop('early', 'ms')).toBeCloseTo(3000);
    expect(timer.stop('late', 'ms')).toBeCloseTo(1000);
  });

  describe('measure', () => {
    it('returns sync result and shows success with auto-message', () => {
      const result = timer.measure(() => {
        vi.advanceTimersByTime(2000);
        return 42;
      });

      expect(result).toBe(42);
      const lastCall = stripAnsi(mockLogUpdate.mock.calls.at(-1)?.[0] ?? '');
      expect(lastCall).toContain('Completed in 2.0s');
    });

    it('returns async result and shows success with auto-message', async () => {
      const result = timer.measure(() => Promise.resolve('ok'));
      vi.advanceTimersByTime(1500);
      await expect(result).resolves.toBe('ok');
    });

    it('shows loading when messages.loading is provided (sync)', () => {
      timer.measure(
        () => {
          vi.advanceTimersByTime(2000);
          return 1;
        },
        { loading: 'Working...' },
      );

      // loading appeared
      const calls = mockLogUpdate.mock.calls;
      const loadingLine = stripAnsi(
        calls.find((c: string[]) => c[0].includes('Working...'))?.[0] ?? '',
      );
      expect(loadingLine).toContain('Working...');

      // then success with auto message
      const lastCall = stripAnsi(calls.at(-1)?.[0] ?? '');
      expect(lastCall).toContain('Completed in 2.0s');
    });

    it('measure with custom success message (sync)', () => {
      const result = timer.measure(
        () => {
          vi.advanceTimersByTime(500);
          return 'data';
        },
        {
          success: (elapsed) => `took ${elapsed.toFixed(2)}s`,
        },
      );

      expect(result).toBe('data');
      const lastCall = stripAnsi(mockLogUpdate.mock.calls.at(-1)?.[0] ?? '');
      expect(lastCall).toContain('took 0.50s');
    });

    it('measure with custom error message (sync throw)', () => {
      expect(() =>
        timer.measure(
          () => {
            vi.advanceTimersByTime(100);
            throw new Error('boom');
          },
          {
            error: (err) => `fail: ${(err as Error).message}`,
          },
        ),
      ).toThrow('boom');

      const lastCall = stripAnsi(mockLogUpdate.mock.calls.at(-1)?.[0] ?? '');
      expect(lastCall).toContain('fail: boom');
    });

    it('measure with custom error message (async reject)', async () => {
      const p = timer.measure(() => Promise.reject(new Error('async fail')), {
        error: (err) => `async error: ${(err as Error).message}`,
      });

      vi.advanceTimersByTime(100);

      await expect(p).rejects.toThrow('async fail');
      const lastCall = stripAnsi(mockLogUpdate.mock.calls.at(-1)?.[0] ?? '');
      expect(lastCall).toContain('async error: async fail');
    });

    it('uses function name as label', () => {
      function doWork() {
        vi.advanceTimersByTime(1000);
        return true;
      }

      timer.measure(doWork);

      const lastCall = stripAnsi(mockLogUpdate.mock.calls.at(-1)?.[0] ?? '');
      expect(lastCall).toContain('doWork Completed in 1.0s');
    });
  });
});
