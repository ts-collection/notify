import { toast } from '../src/index';
import { sleep } from './helpers';

const h = toast.promise(
  sleep(1000).then(() => 42),
  {
    loading: 'toast.promise: loading…',
    success: 'toast.promise: got 42!',
    error: 'toast.promise: failed',
  },
);
const result = await h.result;

await sleep(500);
