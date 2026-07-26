/**
 * Progress (one-off) — create with total, update manually
 *
 * Run: bun run examples/05-progress-legacy.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

const total = 5;
const bar = notify.progress('Downloading assets…', {
  progress: { current: 0, total },
});
for (let step = 1; step <= total; step++) {
  await sleep(300);
  bar.update({ progress: { current: step, total } });
}
bar.update({ type: 'success', message: 'Assets downloaded' });

await sleep(500);
notify.clear();
