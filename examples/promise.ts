import { notify } from '../src/index';
import { sleep } from './helpers';

const h1 = notify.promise(
  sleep(1500).then(() => ({ id: 1, name: 'example' })),
  {
    loading: 'Fetching user…',
    success: (data: { name: string }) => `Got → ${data.name}`,
    error: 'Failed',
  },
);
const data = await h1.result;

await sleep(400);

const h2 = notify.promise(
  sleep(1200).then(() => Promise.reject(new Error('something went wrong'))),
  {
    loading: 'Fetching (will fail)…',
    success: "(won't see this)",
    error: (err: unknown) => `→ ${(err as Error).message}`,
  },
);
await h2.result.catch(() => {});

await sleep(400);

async function fetchUser() {
  await sleep(1100);
  return 'Alice';
}
const h3 = notify.promise(fetchUser, {
  loading: 'Calling fetchUser…',
  success: (name: string) => `→ ${name}`,
  error: 'failed',
});
await h3.result;

await sleep(500);
