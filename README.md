# @ts-utilities/notify

Sonner-like CLI notifier — create, update, and dismiss terminal notifications with a clean id-based API.

```
√ Build succeeded
× Tests failed
▲ Warning: deprecated API
i Info: server starting
● Running
⠋ Loading...
```

## Install

```bash
npm install @ts-utilities/notify
```

## Quick Start

```ts
import { notify } from '@ts-utilities/notify';

notify('Hello');
notify.success('Done');
notify.error('Failed');
notify.warning('Caution');
notify.info('Note');
notify.loading('Working…');

const id = notify('First');
notify('Replaced', { id });    // same id → replaces in place

notify.dismiss(id);            // remove one
notify.clear();                // remove all
```

## Icons

Override the default type-based icon with any character or emoji.

```ts
notify('Rocket launch', { icon: '🚀' });
notify.success('Party time', { icon: '🎉' });
notify.loading('Working', { icon: '🌀' });
```

Custom icons work with `update` to change the icon dynamically:

```ts
const { id } = notify.loading('Processing', { id: 'task' });
notify.update(id, {
  type: 'success',
  message: 'Done!',
  options: { icon: '✅' },
});
```

When `icon` is set, it completely replaces the default character (including loading/progress spinners).

## Style

Every notification accepts a `style` option to control color, background, modifier flags, and mode.

```ts
notify('Blue bold text', {
  style: { color: 'blue', bold: true },
});

notify('Custom hex color', {
  style: { color: '#ff4500' },
});

notify('RGB color + underline', {
  style: { color: 'rgb(255, 165, 0)', underline: true },
});

notify('White on blue', {
  style: { color: 'white', backgroundColor: 'blue', bold: true },
});

notify('Multiple modifiers', {
  style: { bold: true, italic: true, underline: true, color: 'cyan' },
});
```

### Color

| Type | Example |
|------|---------|
| Named chalk | `'red'`, `'green'`, `'blue'`, `'cyan'`, `'magenta'`, `'yellow'`, `'white'`, `'gray'`, `'black'` |
| Hex | `'#ff0000'`, `'#0f0'` |
| RGB | `'rgb(255, 0, 0)'`, `'rgb(100, 200, 50)'` |
| ChalkInstance | `chalk.hex('#f0f')`, `chalk.rgb(255, 0, 255)` |

> `backgroundColor` accepts the same formats — named colors like `'blue'` are automatically prefixed to `bgBlue`. You can also pass `chalk.bgRed`, `chalk.bgHex(...)`, etc.

### Mode

Controls which parts of the notification receive styling:

```ts
notify('Only icon is colored', { style: { mode: 'icon-only', color: 'green' } });
notify('Only text is colored', { style: { mode: 'text-only', color: 'magenta', bold: true } });
notify('No ANSI at all', { style: { mode: 'none' } });
```

### Dynamic style via update

```ts
const { id } = notify.loading('Working…');
notify.update(id, {
  options: { style: { color: 'blue', bold: true } },
});
```

### Style on progress notifications

```ts
const bar = notify.progress({ total: 5 }, { loading: 'Styled progress' });
notify.update(bar.id, {
  options: { style: { color: 'cyan', bold: true } },
});
```

### Style on promise notifications

```ts
await notify.promise(fetch('/api/data'), {
  loading: 'Fetching…',
  success: 'Got it!',
  error: 'Failed',
}, {
  style: { color: 'blue', bold: true },
}).catch(() => {});
```

### Style on toast

```ts
import { toast } from '@ts-utilities/notify';

toast.success('Styled toast', { style: { color: 'green', bold: true } });
toast('Auto-dismiss with style', { duration: 2000, style: { color: 'magenta' } });
```

## Progress

```ts
const bar = notify.progress({ total: 15 });
for (let i = 0; i < 15; i++) {
  await sleep(100);
  bar.advance();
}
```

### Display Toggles

All display options are enabled by default. Disable any of them:

```ts
notify.progress({
  total: 100,
  display: { spinner: false, percentage: false, count: false },
}, { loading: 'Downloading' });
```

### Bar Variants

| Variant | Full | Empty | Sample |
|---------|------|-------|--------|
| `bar` (default) | `█` | `░` | `[████████████████████░░░░░░░░░░] 67%` |
| `block` | `█` | ` ` | `[████████████████████          ] 80%` |
| `line` | `━` | `─` | `[━━━━━━━━━━━━━━━━━━━━━━━━━] 80%` |
| `dot` | `●` | `○` | `[●●●●●●●●●●●●●●●●●●○○○○○○○○] 80%` |
| `none` | — | — | `80% (400/500)` |

```ts
notify.progress({ total: 5, variant: 'dot' }, { loading: 'Tasks' });
```

Variant is set-once — `notify.update` cannot change it.

### Unknown Total

```ts
const bar = notify.progress({}, { loading: 'Processing' });

bar.advance();        // → 1
bar.advance();        // → 2
bar.set(42);          // → 42
```

## Update

Partial update — only specified fields are merged:

```ts
const bar = notify.progress({ total: 100 }, { loading: 'Uploading' });

notify.update(bar.id, {
  progress: { current: 75 },
  message: 'Still uploading…',
});

notify.update(bar.id, {
  type: 'success',
  message: 'Upload completed',
});

// or
// bar.done('Upload completed')

// or 
// const bar = notify.progress({ total: 100 }, { loading: 'Uploading', success: 'Upload Completed' });

```

## Promise

`notify.promise()` returns a **thenable handle** that resolves to `T` directly. Rejects on error — wrap in try/catch.

### Await the handle directly

```ts
const handle = notify.promise(fetch('/api/data'), {
  loading: 'Fetching…',
  success: 'Fetched!',
  error: 'Request failed',
});

try {
  const data = await handle;
  notify.success(`Got ${data}`);
} catch (err) {
  notify.error('Request failed');
}
```

### Await `.result` (identical to awaiting the handle)

`await handle.result` is equivalent to `await handle` — both resolve to `T` or reject.

```ts
try {
  const data = await handle.result;
  notify.success(`Got ${data}`);
} catch (err) {
  notify.error('Request failed');
}
```

### Callbacks

```ts
const handle = notify.promise(Promise.resolve(42), {
  success: (data) => `Got ${data}`,
  error: (err) => `Error: ${err.message}`,
  finally: () => cleanup(),
});

try {
  const data = await handle;
  notify.success(`Got ${data}`);
} catch (err) {
  notify.error('Request failed');
}
```

### Function Labels

Pass an async function directly — the label is derived from the function name.

```ts
async function fetchUser() { return 'Alice'; }
try {
  const data = await notify.promise(fetchUser);
} catch {}
```

### `PromiseHandle<T>` type

```ts
interface PromiseHandle<T> extends NotifyHandle, PromiseLike<T> {
  result: Promise<T>;
}
```

## Toast (auto-dismiss)

```ts
import { toast } from '@ts-utilities/notify';

toast('Auto-dismisses after 3s');
toast('Custom duration', { duration: 500 });
toast.success('Quick success');
```

Toast inherits all `notify.*` methods:

```ts
toast.loading('…');
toast.promise(Promise.resolve(42), { loading: '…', success: 'Done' });
toast.dismiss(id);
toast.clear();
```

## Timer

`timer` is a standalone utility for measuring elapsed time. Works independently of notifications — use it anywhere in your code.

```ts
import { timer } from '@ts-utilities/notify';

timer.start('fetch');
const data = await fetch('/api');
console.log(timer.get('fetch'));       // 1.234 (seconds)
console.log(timer.stop('fetch', 'ms')); // 1234, timer removed
```

### `timer.start(id)`

Starts tracking a named timer. Silently overwrites if the id already exists.

### `timer.get(id, unit?)`

Returns elapsed time since `start()`. Timer keeps running. Throws if the id doesn't exist.

| unit | granularity |
|------|-------------|
| `'auto'` (default) | smart — `500ms`, `2.5s`, `2m 30s`, `1h 15m 30s` |
| `'ms'` | milliseconds |
| `'s'` | seconds |
| `'m'` | minutes |

### `timer.stop(id, unit?)`

Returns elapsed time and removes the timer. Same unit options as `get()`.

### Combining with notifications

```ts
timer.start('api');
const h = notify.loading('api request...', { display: { timer: true } });
await sleep(1500);
h.update({
  type: 'success',
  message: `api done in ${timer.stop('api').toFixed(2)}s`,
});
```

The notification shows a live ticking timer. `timer.stop()` gives the exact precision value for the final message.

### `timer.measure(fn, messages?)`

Wraps a function, runs it, and auto-displays the elapsed time when done. Supports sync and async functions.

```ts
// Auto-message (uses function name as label)
timer.measure(() => doWork());
// → doWork Completed in 2.0s

// With loading + custom success callback
timer.measure(
  () => heavyComputation(),
  {
    loading: 'Working...',
    success: (elapsed) => `done in ${elapsed.toFixed(2)}s`,
    error: (err) => `error: ${(err as Error).message}`,
  },
);

// Async function
const data = await timer.measure(async () => {
  const res = await fetch('/api');
  return res.json();
});
```

| message | Default example | Callback signature |
|---------|-----------------|--------------------|
| `loading` | (no loading shown) | — |
| `success` | `"fnName Completed in 2.5s"` | `(elapsed: number) => string` — elapsed in seconds |
| `error` | `"fnName Failed in 1.2s"` | `(error: unknown) => string` |

If `loading` is omitted, the function runs without a loading notification — only the result is displayed.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | auto | Custom notification id (replaces existing) |
| `icon` | `string` | — | Custom icon character or emoji |
| `toast` | `boolean \| { duration: number }` | — | Makes entry auto-dismiss |
| `keepAlive` | `boolean` | `false` | Keeps process alive until dismissed |
| `style` | `NotifyStyleOptions` | — | Color, background, modifier flags |


## Types

```ts
import type {
  NotifyEntry,
  NotifyOptions,
  NotifyStyleOptions,
  ColorMode,
  NotifyColor,
  NotifyType,
  NotifyHandle,
  ProgressOptions,
  ProgressHandle,
  ProgressVariant,
  ProgressConfig,
  PromiseMessages,
  PromiseHandle,
  TimerUnit,
} from '@ts-utilities/notify';
```

## API

### `notify(message, options?)` → `NotifyHandle`

Creates a default notification. Returns a handle with `id`, `dismiss()`, and `update()`.

### `notify.{success|error|warning|info|loading}(message, options?)` → `NotifyHandle`

### `notify.progress(config, messages?)` → `ProgressHandle`

Creates a persistent animated progress notification. Returns a handle with `advance()`, `set()`, `done()`, `fail()`, `label()`, `dismiss()`, and `update()`.

### `notify.update(id, update)`

Partially updates a notification.

### `notify.promise(promiseOrFn, messages?, options?)` → `PromiseHandle<T>`

Returns a thenable handle — `await handle` and `await handle.result` both resolve to `T`. Rejects on error — wrap in try/catch.

### `notify.dismiss(id)`

### `notify.clear()`

### `timer.start(id)`

### `timer.get(id, unit?)`

### `timer.stop(id, unit?)`

### `timer.measure(fn, messages?)`
