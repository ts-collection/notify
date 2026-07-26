import { notify } from '../src/index';
import { sleep } from './helpers';

const bar = notify.progress('Processing items…', {
  progress: { current: 0 },
});
for (let i = 1; i <= 4; i++) {
  await sleep(200);
  bar.update({ progress: { current: i } });
}
bar.update({ type: 'success', message: 'All items processed' });

await sleep(500);
