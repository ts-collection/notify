import chalk from 'chalk';
import { notify } from '../src/index';
import { sleep } from './helpers';

notify('Basic persistent message (default type)', {
  style: {
    color: '#fff000',
    backgroundColor: '#000fff',
    modifier: ['italic', 'bold', 'strikethrough'],
  },
});
// await sleep(500);

// notify.success('Success message');
// notify.error('Error message');
// notify.warning('Warning message');
// notify.info('Info message');

// await sleep(1500);
