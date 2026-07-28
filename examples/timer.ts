import { timer } from '../src/index';
import { sleep } from './helpers';

// NOTE: time promise-based work
timer.start('fetch');
await sleep(1200);
console.log(`fetch took ${timer.stop('fetch', 'ms')}ms`);

// NOTE: time multiple concurrent operations
timer.start('db');
timer.start('cache');
await sleep(800);
console.log(`cache was ${timer.stop('cache')}s`);
await sleep(400);
console.log(`db was ${timer.stop('db', 'ms')}ms`);

// NOTE: check elapsed without stopping
timer.start('api');
await sleep(500);
console.log(`api so far: ${timer.get('api').toFixed(2)}s`);
await sleep(700);
console.log(`api so far: ${timer.get('api', 'ms').toFixed(0)}ms`);
timer.stop('api');

await sleep(400);

// NOTE: measure — wraps a function, auto-displays elapsed time
function fetchData() {
  // simulate work
  return { id: 1, name: 'test' };
}
const data = timer.measure(fetchData);
