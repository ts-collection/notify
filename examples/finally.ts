import { notify } from '../src/index';
import { sleep } from './helpers';

const h = notify.promise(sleep(800).then(() => 'done'), {
  loading: 'finally: loading…',
  success: 'finally: done',
  error: 'finally: error',
  finally: () => console.log('[callback] finally() executed'),
});
await h.result;

await sleep(500);
