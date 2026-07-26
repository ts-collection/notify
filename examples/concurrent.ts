/**
 * Concurrent entries — many notifications at once
 *
 * Run: bun run examples/11-concurrent.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

for (let i = 0; i < 8; i++) {
  notify(`Concurrent entry #${i + 1}`);
}

await sleep(1000);
notify.clear();
