import { notify } from '../src/index';
import { sleep } from './helpers';

const load = notify.loading('Loading message — persistent', {
  display: { timer: true },
});

await sleep(1500);
load.update({ type: 'success', message: 'Loading completed!' });

await sleep(500);
