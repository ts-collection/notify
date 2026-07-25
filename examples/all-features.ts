/**
 * Comprehensive example — every API surface of @ts-utilities/notify
 *
 * Run in terminal: bun run examples/all-features.ts
 * Pipe to see non-TTY: bun run examples/all-features.ts | cat
 */
import { notify, toast } from '../src/index';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

notify.clear();

notify('Basic persistent message (default type)');
await sleep(800);

notify.success('Success message');
notify.error('Error message');
notify.warning('Warning message');
notify.info('Info message');
notify.loading('Loading message — persistent');
await sleep(1000);

notify('First message', { id: 'example-id' });
await sleep(300);
notify('Replaced by this (same id)', { id: 'example-id' });
await sleep(500);

toast('Toast message — auto dismiss after 3s');
await sleep(500);

toast('Custom 500ms toast — vanishes fast', { duration: 500 });
await sleep(300);

toast.success('toast.success()');
toast.error('toast.error()');
toast.warning('toast.warning()');
toast.info('toast.info()');
toast.loading('toast.loading() — persistent');
await sleep(800);

const aliveId = notify('keepAlive — process stays alive until dismiss', {
  keepAlive: true,
});

const progressTotal = 5;
const progressId = notify.progress('Downloading assets…', {
  progress: { current: 0, total: progressTotal },
});
for (let step = 1; step <= progressTotal; step++) {
  await sleep(300);
  notify.update(progressId, {
    progress: { current: step, total: progressTotal },
  });
}
notify.update(progressId, {
  type: 'success',
  message: 'Assets downloaded',
});
await sleep(500);

// Progress with unknown total (just a count)
const unknownId = notify.progress('Processing items…', {
  progress: { current: 0 },
});
for (let i = 1; i <= 4; i++) {
  await sleep(200);
  notify.update(unknownId, {
    progress: { current: i },
  });
}
notify.update(unknownId, {
  type: 'success',
  message: 'All items processed',
});
await sleep(500);

setTimeout(() => {
  notify.dismiss(aliveId);
  notify.success('keepAlive entry dismissed');
}, 2000);
await sleep(500);

// NOTE: fire without blocking (no await)
notify.promise(
  sleep(1500).then(() => ({ id: 1, name: 'example' })),
  {
    loading: 'promise: loading…',
    success: (data: { name: string }) => `promise: resolved → ${data.name}`,
    error: 'promise: failed',
  },
);
await sleep(500);

await notify
  .promise(
    sleep(1200).then(() => Promise.reject(new Error('something went wrong'))),
    {
      loading: 'promise: will reject…',
      success: "(won't see this)",
      error: (err: unknown) => `promise: → ${(err as Error).message}`,
    },
  )
  .catch(() => {});
await sleep(500);

async function fetchUser() {
  await sleep(1100);
  return 'Alice';
}

await notify.promise(fetchUser, {
  loading: 'fetchUser: loading…',
  success: (name: string) => `fetchUser: → ${name}`,
  error: 'fetchUser: failed',
});
await sleep(300);

await toast.promise(
  sleep(1000).then(() => 42),
  {
    loading: 'toast.promise: loading…',
    error: 'toast.promise: failed',
  },
);
await sleep(300);

await notify.promise(
  sleep(800).then(() => 'done'),
  {
    loading: 'finally: loading…',
    success: 'finally: done',
    error: 'finally: error',
    finally: () => console.log('[callback] finally() executed'),
  },
);

await sleep(500);
for (let i = 0; i < 5; i++) {
  notify(`Concurrent entry #${i + 1}`);
}

await sleep(800);
const dismissMeId = notify('This will be dismissed in 1s');
setTimeout(() => {
  notify.dismiss(dismissMeId);
  notify.info('Dismissed the temporary entry');
}, 1000);

await sleep(2000);
notify.clear();
await sleep(200);
console.log('All entries cleared — done');
