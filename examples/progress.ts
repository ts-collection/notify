import { notify } from '../src/index';
import { sleep } from './helpers';

const bar = notify.progress({ total: 15 }, {}, { display: { timer: true } });
for (let i = 0; i < 15; i++) {
  await sleep(100);
  bar.advance();
}
await sleep(500);

const bar2 = notify.progress(
  { total: 3, variant: 'dot' },
  { loading: 'Processing…', success: 'All done!', error: 'Bailed' },
  { display: { timer: true } },
);
bar2.advance();
await sleep(300);
bar2.advance();
await sleep(300);
bar2.advance();
await sleep(500);

const bar3 = notify.progress({ total: 10, variant: 'line' });
bar3.label('Step 1…');
await sleep(400);
bar3.set(5);
await sleep(400);
bar3.fail('Failed at step 2');
await sleep(500);

// Custom inline variant — pass full/empty characters directly
const bar4 = notify.progress(
  { total: 5, variant: { full: 'x', empty: ' ' } },
  { loading: 'Custom chars' },
);
await sleep(200);
bar4.advance();
await sleep(200);
bar4.advance();
await sleep(200);
bar4.advance();
await sleep(200);
bar4.advance();
await sleep(200);
bar4.advance();
await sleep(500);
