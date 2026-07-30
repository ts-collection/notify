import { notify } from '../src/index';
import { sleep } from './helpers';

// NOTE: multi-colored segments in a single line
notify([
  { text: '✓', style: { color: 'green', bold: true } },
  ' Build ',
  { text: 'succeeded', style: { color: 'green', bold: true } },
  ' in ',
  { text: '12.3s', style: { color: 'yellow' } },
]);
await sleep(1000);

notify.error([
  { text: '✗', style: { color: 'red', bold: true } },
  ' Connection refused — ',
  { text: 'localhost:3000', style: { color: 'cyan', underline: true } },
]);
await sleep(1000);

notify.success([
  { text: '🏁', style: { color: 'green' } },
  ' Pipeline ',
  { text: '#142', style: { color: 'white', bold: true } },
  ' — ',
  { text: '3 passed', style: { color: 'green' } },
  ', ',
  { text: '0 failed', style: { color: 'green' } },
  ', ',
  { text: '12s', style: { color: 'yellow' } },
]);
await sleep(1000);

// NOTE: pacman progress — animated om nom nom
const pac = notify.progress(
  { total: 10, variant: 'pacman' },
  { loading: [{ text: 'ᗧ', style: { color: 'yellow' } }, ' Chomping…'] },
);
for (let i = 0; i < 10; i++) {
  await sleep(120);
  pac.advance();
}
await sleep(500);

// NOTE: shade progress — smooth gradient edge
const shade = notify.progress(
  { total: 8, variant: 'shade' },
  { loading: [{ text: '▓', style: { color: 'blue' } }, ' Loading assets…'] },
);
for (let i = 0; i < 8; i++) {
  await sleep(150);
  shade.advance();
}
await sleep(500);

// NOTE: circle progress — pulsing lead dot
const circ = notify.progress(
  { total: 12, variant: 'circle' },
  {
    loading: [
      { text: '⬤', style: { color: 'magenta' } },
      ' Processing frames…',
    ],
  },
);
for (let i = 0; i < 12; i++) {
  await sleep(100);
  circ.advance();
}
await sleep(500);

// NOTE: promise with inline styled messages
await notify.promise(
  sleep(1500).then(() => ({ user: 'alice', role: 'admin' })),
  {
    loading: [{ text: '◐', style: { color: 'cyan' } }, ' Authenticating…'],
    success: (data: { user: string; role: string }) => [
      { text: '✓', style: { color: 'green' } },
      ' ',
      { text: data.user, style: { color: 'cyan', bold: true } },
      ' logged in as ',
      { text: data.role, style: { color: 'yellow' } },
    ],
    error: () => [{ text: '✗', style: { color: 'red' } }, ' Login failed'],
  },
);

await sleep(1000);

// NOTE: braile progress — half-eaten cell edge
const brl = notify.progress(
  { total: 6, variant: 'braille' },
  {
    loading: [{ text: '⣿', style: { color: 'green' } }, ' Syncing data…'],
  },
);
for (let i = 0; i < 6; i++) {
  await sleep(200);
  brl.advance();
}
await sleep(500);

// NOTE: diamond progress — sharp pointer
const dia = notify.progress(
  { total: 5, variant: 'diamond' },
  { loading: [{ text: '◆', style: { color: 'blue' } }, ' Optimizing…'] },
);
for (let i = 0; i < 5; i++) {
  await sleep(180);
  dia.advance();
}
await sleep(500);

// NOTE: inline styled update — dynamic progress with color
const build = notify.progress(
  { total: 4 },
  {
    loading: [{ text: '🔨', style: {} }, ' Building…'],
  },
);
await sleep(400);
build.label([
  { text: '√', style: { color: 'green' } },
  ' Linting ',
  { text: 'passed', style: { color: 'green' } },
]);
await sleep(600);
build.set(1);
build.label([
  { text: '√', style: { color: 'green' } },
  ' TypeScript ',
  { text: 'passed', style: { color: 'green' } },
]);
await sleep(600);
build.set(2);
build.label([
  { text: '!', style: { color: 'yellow' } },
  ' Tests ',
  { text: '3 warnings', style: { color: 'yellow' } },
]);
await sleep(600);
build.set(3);
build.label([
  { text: '√', style: { color: 'green' } },
  ' Bundling ',
  { text: 'passed', style: { color: 'green' } },
]);
await sleep(600);
build.set(4);
await sleep(500);

// NOTE: slim variant — chevron pointer, nice for download bars
const slim = notify.progress(
  { total: 7, variant: 'slim' },
  {
    loading: [{ text: '❯', style: { color: 'cyan' } }, ' Downloading…'],
  },
);
for (let i = 0; i < 7; i++) {
  await sleep(120);
  slim.advance();
}
await sleep(500);

// NOTE: final summary with colorful inline segments
notify.success([
  { text: '✨', style: { color: 'green' } },
  ' All ',
  { text: '8', style: { color: 'white', bold: true } },
  ' tasks ',
  { text: 'completed', style: { color: 'green', bold: true } },
  ' in ',
  { text: '18.4s', style: { color: 'yellow' } },
]);
await sleep(2000);
