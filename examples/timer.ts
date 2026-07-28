import { notify, timer } from '../src/index';
import { sleep } from './helpers';

// NOTE: time promise-based work — show result with notify
timer.start('fetch');
await sleep(1200);
notify.success(`fetch took ${timer.get('fetch', 'ms').toFixed(0)}ms`);

await sleep(400);

// NOTE: time multiple concurrent operations
timer.start('db');
timer.start('cache');
await sleep(800);
notify.info(`cache was ${timer.stop('cache').toFixed(1)}s`);
await sleep(400);
notify.warning(`db was ${timer.stop('db', 'ms').toFixed(0)}ms`);

await sleep(400);

// NOTE: show live progress with timer + notify loading
timer.start('api');
const h = notify.loading('api request...', { display: { timer: true } });
await sleep(1500);
h.update({
  type: 'success',
  message: `api done`,
});

notify.warning(`Total time: ${timer.stop('fetch').toFixed(1)}s`);
