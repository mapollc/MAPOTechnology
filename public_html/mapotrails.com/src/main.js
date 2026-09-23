import { ENV, config } from './app/config.js';
import { startup } from './app/init.js';

/*
 * SETUP CONFIG BEFORE THE "MAP OF TRAILS" APP LOADS
 */

const path = ENV.debug
    ? window.location.pathname
        .split('/src/')[1]
        ?.split('/')
        .filter(Boolean) ?? []
    : window.location.pathname
        ?.split('/')
        .filter(Boolean) ?? [];

config.taxonomy = path[0] === 'trails' ? {
    category: 'trail',
    activity: null,
    area: null
} : {
    category: ['snow', 'trail'].includes(path[0]) ? path[0] : 'trail',
    activity: path[1] || null,
    area: path[2] || null
};

/*
 * START THE APP
 */

startup().catch(err => {
    console.error('Map of Trails failed to initialize.', err);
});