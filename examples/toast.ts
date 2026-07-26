/**
 * Toast messages — auto-dismissing notifications
 *
 * Run: bun run examples/03-toast.ts
 */
import { notify, toast } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

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

// Dismiss the persistent loading toast
const t = toast.loading('This will be dismissed soon');
await sleep(600);
t.dismiss();

await sleep(500);
notify.clear();
