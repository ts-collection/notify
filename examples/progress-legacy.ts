import { notify } from '../src/index';
import { sleep } from './helpers';

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
