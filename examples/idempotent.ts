/**
 * Idempotent entries — reuse an id to replace a message in-place
 *
 * Run: bun run examples/04-idempotent.ts
 */
import { notify } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

const h = notify('First message', { id: 'my-id' });
await sleep(600);
h.update({ message: 'Replaced by this (same id)' });

await sleep(600);
notify.clear();
