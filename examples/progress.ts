import { notify } from '../src/index';
import { sleep } from './helpers';

const variants = [
  'bar',
  'pacman',
  'circle',
  'shade',
  'slim',
  'braille',
  'diamond',
  'pill',
  'smooth',
  'dot',
  'line',
  'block',
] as const;

for (const v of variants) {
  const bar = notify.progress(
    { total: 8, variant: v },
    { loading: v },
  );
  for (let i = 0; i < 8; i++) {
    await sleep(100);
    bar.advance();
  }
  await sleep(200);
}

// Custom inline variant — pass full/empty/head directly
const custom = notify.progress(
  { total: 6, variant: { full: '▓', empty: '░', head: '▒' } },
  { loading: 'custom' },
);
for (let i = 0; i < 6; i++) {
  await sleep(120);
  custom.advance();
}
await sleep(500);
