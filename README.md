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

## Style

Every notification accepts a `style` option to control color, background, modifier, and mode.

```ts
notify('Blue bold text', {
  style: { color: 'blue', modifier: 'bold' },
});

notify('Custom hex color', {
  style: { color: '#ff4500' },
});

notify('RGB color + underline', {
  style: { color: 'rgb(255, 165, 0)', modifier: 'underline' },
});

notify('White on blue', {
  style: { color: 'white', backgroundColor: 'blue', modifier: 'bold' },
});

notify('Multiple modifiers', {
  style: { modifier: ['bold', 'italic', 'underline'], color: 'cyan' },
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

### Modifier

| Type | Example |
|------|---------|
| Single name | `'bold'`, `'dim'`, `'italic'`, `'underline'`, `'strikethrough'` |
| Multiple | `['bold', 'italic', 'underline']` |
| ChalkInstance | `chalk.bold`, `chalk.italic` |

### Mode

Controls which parts of the notification receive styling:

```ts
notify('Only icon is colored', { style: { mode: 'icon-only', color: 'green' } });
notify('Only text is colored', { style: { mode: 'text-only', color: 'magenta', modifier: 'bold' } });
notify('No ANSI at all', { style: { mode: 'none' } });
```

### Dynamic style via update

```ts
const { id } = notify.loading('Working…');
notify.update(id, {
  options: { style: { color: 'blue', modifier: 'bold' } },
});
```

### Style on progress notifications

```ts
const bar = notify.progress({ total: 5 }, { loading: 'Styled progress' });
notify.update(bar.id, {
  options: { style: { color: 'cyan', modifier: 'bold' } },
});
```

### Style on promise notifications

```ts
await notify.promise(fetch('/api/data'), {
  loading: 'Fetching…',
  success: 'Got it!',
  error: 'Failed',
}, {
  style: { color: 'blue', modifier: 'bold' },
});
```

### Style on toast

```ts
import { toast } from '@ts-utilities/notify';

toast.success('Styled toast', { style: { color: 'green', modifier: 'bold' } });
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
```

## Promise

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

```ts
async function fetchUser() { return 'Alice'; }
await notify.promise(fetchUser);
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
| `style` | `NotifyStyleOptions` | — | Color, background, modifier, mode |

### NotifyStyleOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'all' \| 'icon-only' \| 'text-only' \| 'none'` | `'all'` | Controls styling scope |
| `color` | `ForegroundColorName \| CustomColor \| ChalkInstance` | — | Text/icon color |
| `backgroundColor` | `ForegroundColorName \| CustomColor \| ChalkInstance` | — | Background color |
| `modifier` | `ModifierName \| ModifierName[] \| ChalkInstance \| ChalkInstance[]` | — | Text modifiers (bold, italic, etc.) |

### CustomColor

| Format | Example |
|--------|---------|
| Hex | `'#ff0000'`, `'#0f0'` |
| RGB | `'rgb(255, 0, 0)'`, `'rgb(100, 200, 50)'` |

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

Returns a handle with a `.result` promise.

### `notify.dismiss(id)`

### `notify.clear()`
