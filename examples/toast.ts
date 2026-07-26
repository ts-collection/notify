import { toast } from '../src/index';
import { sleep } from './helpers';

toast('Toast message — auto dismiss after 3s');
await sleep(500);

toast('Custom 500ms toast — vanishes fast', { duration: 500 });
await sleep(300);

toast.success('toast.success()');
toast.error('toast.error()');
toast.warning('toast.warning()');
toast.info('toast.info()');
toast.loading('toast.loading() — persistent until dismiss');
await sleep(1000);

const t = toast.loading('This will be dismissed soon');
await sleep(600);
t.dismiss();

await sleep(500);
