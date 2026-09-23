import { addDynamicControls } from './init.js';

import { ENV, config, getPlatform } from './config.js';
import { searchResults } from './state.js';

import * as helper from '../utils/helpers.js';

import { ChangeListener, ClickListener } from '../data/listeners.js';

window.addEventListener('change', (e) => {
    const actionElement = e.target.closest('[data-action]');
    const action = actionElement ? actionElement.dataset.action : null;

    const c = new ChangeListener(e.target);

    const actionHandlers = {
        'change-basemap': () => c.changeBasemap(),
        'toggle-layer': () => c.toggleLayer()
    };

    // run default handlers for on click
    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }
});

window.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    const action = actionElement ? actionElement.dataset.action : null;

    const c = new ClickListener(e.target);

    const actionHandlers = {
        'account': () => c.account(),
        'basemaps': () => c.basemaps(),
        'layers': () => c.layers(),
        'close-impact': () => c.closeImpact(),
        'sync': () => helper.saveSession(true),
        'logout': () => window.location.href = `${ENV.baseURL}logout?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}`,
        'sr-onclick': () => c.searchResultClick(),
        'dropdown-nav': () => document.querySelector('nav').classList.toggle('open'),
        'main-guide': () => global.trails.displayTrail(actionElement.dataset.tid)
    };

    // run default handlers for on click
    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }

    if (!e.target.closest('.dropdown-button')) {
        document.querySelectorAll('.dropdown-button button.expand')
            .forEach(button => button.classList.remove('expand'));
    }

    // hide search results if outside search result container
    if (!e.target.contains(searchResults) && (e.target.parentElement && !e.target.parentElement.contains(searchResults)) && !e.target.contains(document.querySelector('#q'))) {
        searchResults.style.display = 'none';
        document.querySelector('#q').value = '';

        searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
    }
});

window.addEventListener('resize', async () => {
    const nav = document.querySelector('nav'),
        nb = document.querySelector('#close-navbar');

    if (window.innerWidth < 600) {
        if (nav.classList.contains('hide')) {
            document.documentElement.style.setProperty('--nav-width', '100px');
            nav.classList.remove('hide');
        }

        nb.classList.remove('show');
    } else {
        nb.classList.add('show');
    }

    helper.debounce(addDynamicControls, 150)();
});

window.addEventListener('keydown', e => {
    const isPasteAction = (e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V'),
        isSystemKey = e.altKey || e.key === 'Enter' || e.key === 'Shift' || e.key === 'Escape',
        isFindShortcut = (e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F'),
        isTypingKey = !e.ctrlKey && !e.metaKey && !e.altKey && !isSystemKey,
        searchBox = document.querySelector('#q');

    config.runSearch = false;

    // if the user presses the esc key
    if (e.code == 'Escape') {
        if (helper.isVisible('#modal')) global.inits.clickListener.closeModal();

        if (helper.isVisible('.popup')) {
            global.marker?.remove();
            document.querySelector('.popup')?.remove();
        }

        // clear/close search features
        if (e.target === searchBox) {
            searchBox.value = '';
            searchBox.blur();
            searchResults.style.display = 'none';

            searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
        }
    }

    // if the user pressed ctrl + f, focus the search box
    if (isFindShortcut) {
        e.preventDefault();
        searchBox.focus();
        return;
    }

    // onkeydown in the search box
    if (e.target?.id == 'q') {
        if (/^(Arrow|Shift|Control|Alt|Tab|CapsLock|Escape)/.test(e.key)) return;

        const searchVisible = searchResults.style.display !== 'none' && searchResults.style.display !== '',
            standby = searchResults.querySelector('.standby');

        if (isTypingKey || isPasteAction) {
            config.runSearch = true;
            if (!searchVisible) searchResults.style.display = 'flex';

            standby.innerHTML = '<i class="fa-duotone fa-spinner-third"></i><span>Searching...</span>';
            if (standby.style.display != 'inline-flex') {
                searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
                standby.style.display = 'inline-flex';
            }

            standby.querySelector('i').style.display = 'block';
            standby.querySelector('span').textContent = 'Searching...';
        }
    }
});

window.addEventListener('keyup', helper.debounce((e) => {
    (async () => {
        if (/^(Arrow|Shift|Control|Alt|Tab|CapsLock|Escape)/.test(e.key)) return;

        if (e.target.id == 'q' && config.runSearch) {
            const { Search } = await import('../data/search.js');

            document.querySelector('#clearSearch').style.display = e.target.value == '' ? 'none' : 'block';
            new Search(e.target.value).do();

            config.runSearch = false;
        }
    })();
}, 500));

window.addEventListener('focus', e => { if (e.target?.id == 'q') searchResults.style.display = 'flex'; });
