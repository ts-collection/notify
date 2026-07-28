import { describe, expect, it, vi } from 'vitest';

vi.useFakeTimers();

const { timer } = await import('../src/utils/timer');

describe('timer', () => {
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
});
