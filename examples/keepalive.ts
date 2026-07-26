import { notify } from '../src/index';
import { sleep } from './helpers';

const h = notify('Process stays alive until dismiss', {
  keepAlive: true,
});

await sleep(2000);
h.update({ type: 'success', message: 'KeepAlive entry dismissed' });
await sleep(300);
