import { notify } from '../src/index';
import { sleep } from './helpers';

const bar = notify.progress.start({ total: 5 });
for (let i = 0; i < 5; i++) {
  await sleep(300);
  bar.advance();
}

await sleep(500);

const bar2 = notify.progress.start(
  { total: 3 },
  { loading: 'Processing…', success: 'All done!', error: 'Bailed' },
);
bar2.advance();
await sleep(300);
bar2.advance();
await sleep(300);
bar2.advance();

await sleep(500);

const bar3 = notify.progress.start({ total: 10 });
bar3.label('Step 1…');
await sleep(400);
bar3.set(5);
await sleep(400);
bar3.fail('Failed at step 2');

await sleep(500);
