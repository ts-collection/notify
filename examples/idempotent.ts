import { notify } from '../src/index';
import { sleep } from './helpers';

const h = notify('First message', { id: 'my-id' });
await sleep(600);
h.update({ message: 'Replaced by this (same id)' });

await sleep(600);
