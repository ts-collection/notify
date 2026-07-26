/**
 * Dismiss — remove a specific entry via handle
 *
 * Run: bun run examples/12-dismiss.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

notify('I stay');
const h = notify('I will be dismissed');
await sleep(800);

h.dismiss();
notify.info('Dismissed the temporary entry');

await sleep(800);
notify.clear();
