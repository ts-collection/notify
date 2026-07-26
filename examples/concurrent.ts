import { notify } from '../src/index';

for (let i = 0; i < 8; i++) {
  notify(`Concurrent entry #${i + 1}`);
}
