/**
 * Basic messages — default, success, error, warning, info
 *
 * Run: bun run examples/01-basic.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

notify('Basic persistent message (default type)');
await sleep(500);

notify.success('Success message');
notify.error('Error message');
notify.warning('Warning message');
notify.info('Info message');

await sleep(1500);
notify.clear();
