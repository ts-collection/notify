import { notify } from '../src/index';
import { sleep } from './helpers';

notify('Default styling — dimmed text');
await sleep(400);

notify.success('Named color override', { style: { color: 'blue', bold: true } });
await sleep(400);

notify.error('Custom hex color', { style: { color: '#ff4500' } });
await sleep(400);

notify.warning('RGB color + underline', { style: { color: 'rgb(255, 165, 0)', underline: true } });
await sleep(400);

notify.info('Background + foreground', { style: { color: 'white', backgroundColor: 'blue', bold: true } });
await sleep(400);

notify.loading('Multiple modifiers', { style: { bold: true, italic: true, underline: true, color: 'cyan' } });
await sleep(400);

notify('Icon-only mode — only icon is colored', { style: { mode: 'icon-only', color: 'green' } });
await sleep(400);

notify('Text-only mode — only text is colored', { style: { mode: 'text-only', color: 'magenta', bold: true } });
await sleep(400);

notify('None mode — no ANSI at all', { style: { mode: 'none' } });
await sleep(400);

let counter = 0;
const interval = setInterval(() => {
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];
  notify(`Cycling color: ${counter}`, {
    id: 'cycler',
    style: { color: colors[counter % colors.length]!, bold: true },
  });
  counter++;
  if (counter >= 6) {
    clearInterval(interval);
    notify.dismiss('cycler');
  }
}, 200);

await sleep(2000);

const bar = notify.progress(
  { total: 5, variant: 'dot' },
  { loading: 'Styled progress', success: 'Done!' },
);
await sleep(400);
notify.update(bar.id, { options: { style: { color: 'blue', bold: true } } });
bar.advance();
await sleep(300);
notify.update(bar.id, { options: { style: { color: 'magenta', italic: true } } });
bar.advance();
await sleep(300);
notify.update(bar.id, { options: { style: { color: 'green' } } });
bar.advance();
await sleep(300);
bar.advance();
await sleep(300);
bar.advance();
await sleep(500);

notify.info('All done!', { style: { color: 'cyan', bold: true } });
await sleep(500);
