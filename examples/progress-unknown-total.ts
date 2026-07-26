/**
 * Progress — unknown total (just a counter)
 *
 * Run: bun run examples/07-progress-unknown-total.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

const bar = notify.progress('Processing items…', {
  progress: { current: 0 },
});
for (let i = 1; i <= 4; i++) {
  await sleep(200);
  bar.update({ progress: { current: i } });
}
bar.update({ type: 'success', message: 'All items processed' });

await sleep(500);
notify.clear();
