/**
 * Toast.promise — toast-specific promise wrapping
 *
 * Run: bun run examples/09-toast-promise.ts
 */
import { toast } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

toast.clear();

const h = toast.promise(sleep(1000).then(() => 42), {
  loading: 'toast.promise: loading…',
  success: 'toast.promise: got 42!',
  error: 'toast.promise: failed',
});
const result = await h.result;
console.log('Result:', result);

await sleep(500);
toast.clear();
