import { startup } from './app/init.js';

startup().catch(err => {
    console.error('Map of Fire failed to initialize.', err);
});