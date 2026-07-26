/**
 * Finally callback — called after resolve or reject
 *
 * Run: bun run examples/10-finally.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

const h = notify.promise(sleep(800).then(() => 'done'), {
  loading: 'finally: loading…',
  success: 'finally: done',
  error: 'finally: error',
  finally: () => console.log('[callback] finally() executed'),
});
await h.result;

await sleep(500);
notify.clear();
