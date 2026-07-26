/**
 * keepAlive — prevent Node process from exiting while entry exists
 *
 * Run: bun run examples/13-keepalive.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

const h = notify('Process stays alive until dismiss', {
  keepAlive: true,
});

await sleep(2000);
h.update({ type: 'success', message: 'KeepAlive entry dismissed' });
await sleep(300);
notify.clear();
