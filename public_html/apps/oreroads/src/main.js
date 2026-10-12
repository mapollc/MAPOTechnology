import { startup } from './app/init.js';

startup().catch(err => {
    console.error('OregonRoads failed to initialize.', err);
});