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

## Progress

Create progress notifications with animated bars:

```ts
const id = notify.progress('Uploading files', {
  progress: { current: 0, total: 500 },
});
// → ⠋ Uploading files [████████████████████░░░░░░░░░░] 67% (334/500)

notify.update(id, {
  progress: { current: 334, total: 500 },
});
```

### Display Toggles

All display options are enabled by default. Disable any of them:

```ts
notify.progress('Downloading', {
  progress: {
    current: 0,
    total: 100,
    spinner: false,   // static ▸ icon instead of animated spinner
    percentage: false, // hide percentage
    suffix: false,     // hide (current/total)
  },
});
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
notify.progress('Tasks', {
  progress: { current: 4, total: 5, variant: 'dot' },
});
```

Variant is set-once — `notify.update` cannot change it.

### Unknown Total

When `total` is omitted, just the count is shown:

```ts
notify.progress('Processing', {
  progress: { current: 42 }, // no total
});
// → ⠋ Processing 42
```

## Update

Partial update — only specified fields are merged:

```ts
const id = notify.progress('Uploading', {
  progress: { current: 0, total: 100 },
});

notify.update(id, {
  progress: { current: 75 },
  message: 'Still uploading…',
});

notify.update(id, {
  type: 'success',
  message: 'Upload completed',
});
// Progress resets when switching away from `progress` type
```

## Promise

Tracks a promise through loading → success/error:

```ts
await notify.promise(fetch('/api/data'), {
  loading: 'Fetching…',
  success: 'Fetched!',
  error: 'Request failed',
});
```

### Callbacks

```ts
await notify.promise(Promise.resolve(42), {
  success: (data) => `Got ${data}`,
  error: (err) => `Error: ${err.message}`,
  finally: () => cleanup(),
});
```

### Function Labels

Named functions get auto-prefixed defaults:

```ts
async function fetchUser() { return 'Alice'; }
await notify.promise(fetchUser);
// loading → "fetchUser: Loading..."
// success → "fetchUser: Completed"
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

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | auto | Custom notification id (replaces existing) |
| `toast` | `boolean \| { duration: number }` | — | Makes entry auto-dismiss |
| `keepAlive` | `boolean` | `false` | Keeps process alive until dismissed |

## Types

```ts
import type { NotifyEntry, NotifyOptions, NotifyType, ProgressOptions, ProgressVariant, PromiseMessages } from '@ts-utilities/notify';
```

## API

### `notify(message, options?)` → `string`

Creates a default notification. Returns the id.

### `notify.{success|error|warning|info|loading}(message, options?)` → `string`

### `notify.progress(message, options?)` → `string`

Creates a persistent animated progress notification.

### `notify.update(id, update)`

Partially updates a notification:

```ts
notify.update(id, {
  type?: NotifyType;
  message?: string;
  progress?: { current: number; total?: number };
  options?: NotifyOptions;
});
```

### `notify.promise(promiseOrFn, messages?, options?)` → `Promise<T>`

### `notify.dismiss(id)`

### `notify.clear()`
