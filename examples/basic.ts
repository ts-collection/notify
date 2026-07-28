import { notify } from '../src/index';
import { sleep } from './helpers';

// NOTE: 'start' is added first and appears at the top.
// After updating to 'Done', it moves to the bottom —
// keeping the timeline natural (newest terminal toasts last).
notify('Started...', {
  display: { timer: true },
  id: 'job',
});
await sleep(500);

notify.success('Middle notification');

await sleep(1500);

notify.update('job', { type: 'success', message: 'Done' });

await sleep(500);
notify.success('Last notification');
