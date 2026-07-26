/**
 * Progress (builder) — use .start().advance() chain
 *
 * Run: bun run examples/06-progress-builder.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

// Basic — auto-done when reaching total
const bar = notify.progress.start({ total: 5 });
for (let i = 0; i < 5; i++) {
  await sleep(300);
  bar.advance(); // hits 5 → auto-resolves to success
}

await sleep(500);

// With custom messages
const bar2 = notify.progress.start(
  { total: 3 },
  { loading: 'Processing…', success: 'All done!', error: 'Bailed' },
);
bar2.advance();
await sleep(300);
bar2.advance();
await sleep(300);
bar2.advance(); // auto-done → "All done!"

await sleep(500);

// Manual done / fail
const bar3 = notify.progress.start({ total: 10 });
bar3.label('Step 1…');
await sleep(400);
bar3.set(5);
await sleep(400);
bar3.fail('Failed at step 2');

await sleep(500);
notify.clear();
