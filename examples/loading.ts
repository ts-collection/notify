/**
 * Loading messages — persistent until dismissed or updated
 *
 * Run: bun run examples/02-loading.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

const load = notify.loading('Loading message — persistent');

await sleep(1500);
load.update({ type: 'success', message: 'Loading completed!' });

await sleep(500);
notify.clear();
