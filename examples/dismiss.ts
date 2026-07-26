import { notify } from '../src/index';
import { sleep } from './helpers';

notify('I stay');
const h = notify('I will be dismissed');
await sleep(800);

h.dismiss();
notify.info('Dismissed the temporary entry');

await sleep(800);
