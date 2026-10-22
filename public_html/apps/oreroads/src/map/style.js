import * as helpers from '../utils/helpers.js';
import { Data } from '../data/data.js';
import { Radar } from '../data/radar.js';
import { ENV, config, getPlatform } from '../app/config.js';
import { global, layersList, metro, constants } from '../app/global.js';
import { Tables } from '../ui/tables.js';

export class Style {
    constructor(onLoad = false) {
        if (onLoad && !global.menuLoaded) {
            this.menu = null;
            this.userBtn = null;
            this.winLoc = window.location;

            this.createButtons();
            this.getCities();

            helpers.hideLoading();
        }

        new Data().doLayers();

        // whether or not to load up radar animation
        if (new Data().defaultLayer('radar') != 'none') {
            global.radar = new Radar();
            global.radar.init();
        }
    }

    async getCities() {
        const cache = helpers.storage('cities');

        if (!cache) {
            const resp = await helpers.api(`${ENV.apiURL}search/oreroads`, null, true);

            global.cities = resp.cities;
            helpers.storage('cities', JSON.stringify(resp.cities));
        } else {
            global.cities = JSON.parse(cache);
        }
    }

    createButtons() {
        const d = `<div class="search">
            <i class="fas fa-search" style="color:#919191"></i><input type="text" id="search" autocomplete="off" placeholder="Find road reports or cities..."></div>
            <div class="search-results"><div id="result" class="none">Searching...</div></div>
            <img class="logo" src="${ENV.host}${config.imgPath}oreroads_icon_small.png" title="OregonRoads logo" alt="OregonRoads logo">
            <div class="radar-controls"><div class="t"><span id="time" style="font-size:14px">--</span><span><i class="fas fa-pause" id="radarPP"></i></span></div>
            <input type="range" id="radarTime" min="0" max="12" value="0" oninput="setRT(this.value)"></div>
            <div class="mitem-wrapper"><div id="layers" class="mitem" title="Layers"><i class="fas fa-layer-group"></i></div>
            <div id="query" class="mitem" title="Search map"><i class="far fa-magnifying-glass"></i></div>
            <div id="table" class="mitem" title="Tabular Listing"><i class="fa-sharp far fa-table"></i></div>
            <div id="areas" class="mitem" title="Zoom Areas"><i class="fas fa-magnifying-glass-plus"></i></div>
            <div id="myfavorites" class="mitem" title="My Favorites"><i class="fas fa-heart"></i></div>
            <div id="user" class="mitem" title="Account"><i class="fas fa-user"></i></div></div>
            <div id="menu"><span id="close"></span></div>
            <div id="modal"></div>`;

        document.querySelector('#map').insertAdjacentHTML('afterend', d);
        this.menu = document.querySelector('#menu');
        this.userBtn = document.querySelector('#user');
        global.modal = document.querySelector('#modal');

        this.createListeners();
    }

    createListeners() {
        this.userBtn.addEventListener('click', () => this.onUserProfileClick());
        document.querySelector('#layers').addEventListener('click', (e) => this.onLayersBtnClick(e));
        document.querySelector('#myfavorites').addEventListener('click', () => this.onFavsBtnClick());
        document.querySelector('#areas').addEventListener('click', () => this.onAreasBtnClick());
        document.querySelector('#table').addEventListener('click', () => this.onTableBtnClick());
        document.querySelector('#query').addEventListener('click', () => this.onQueryBtnClick());
    }

    onQueryBtnClick() {
        document.querySelector('.search').style.display = 'flex';
        document.querySelector('#search').focus();
    }

    onUserProfileClick() {
        const uri = this.winLoc.pathname + (this.winLoc.hash ? this.winLoc.hash : '');

        if (config.settings.user != null) {
            const userMenu = `<ul id="userMenu"><li class="head"><span>Hi, ${config.settings.getUser().getName().first()}</span></li>
                <li id="userSync"><a href="#" onclick="return false">Sync Favorites</a></li>
                <li><a href="${ENV.host}account/settings">Account</a></li>
                <li><a href="${ENV.host}logout?next='${encodeURIComponent(this.winLoc.href + '?loggedOut=1')}">Logout</a></li>
                <li><a href="#" onclick="createDialog('Disclaimer', disclaimer, false, 'Ok');get('.dialog').classList.add('disclaimer');return false">Disclaimer</a></li>
                <li><a target="blank" href="../about/contact">Contact Us</a></li>
                <li><a href="#" id="aboutDialog">About</a></li></ul>`;

            if (!document.querySelector('ul#userMenu')) document.body.insertAdjacentHTML('beforeend', userMenu);
            const um = document.querySelector('ul#userMenu');

            um.style.top = this.userBtn.parentElement.offsetTop + 'px';
            um.style.left = (this.userBtn.parentElement.offsetLeft - 166) + 'px';
        } else {
            this.winLoc.href = `${ENV.host.replace('//', '//auth.')}login?service=apps&prod=${getPlatform()}&next=${encodeURIComponent(window.location.href)}`;
        }
    }

    onLayersBtnClick(e) {
        if (!global.menuLoaded) {
            const bm = '<div class="item"><div class="t"><h2>Basemap</h2><div class="radio">' +
                '<input type="radio" id="light" name="basemap" value="light"' + (config.userBaseMap == null || config.userBaseMap == 'light' ? ' checked' : '') + '><label for="light">Light</label></div>' +
                '<div class="radio"><input type="radio" id="dark" name="basemap" value="dark"' + (config.userBaseMap == 'dark' ? ' checked' : '') + '><label for="dark">Dark</label></div></div></div>';

            let lm = '<h1>Layers</h1>' + bm;
            const cache = JSON.parse(helpers.storage('layers')),
                isChecked = (name) => cache.filter(it => it.layer == name)?.[0].show;

            layersList.forEach(e => {
                const checked = isChecked(e.layer) ? ' checked' : '';

                lm += `<div class="item"><div class="t"><h2>${e.name}</h2>
                    <span style="font-size:14px">${e.desc}</span></div><div class="s">
                    <label class="switch">
                    <input type="checkbox" id="lo${e.layer}" class="toggle" data-layer="${e.layer}"${checked}>
                    <span class="slider"></span></label></div></div>`;
            });

            this.menu.insertAdjacentHTML('beforeend', lm);
            global.menuLoaded = true;
        }

        menu.style.display = this.menu.style.display == 'block' ? 'none' : 'block';

        e.stopPropagation();
    }

    onTabClickListener(tabContainer, tabContent, e) {
        const clickedTab = e.target.closest('li.tab');
        if (!clickedTab) return;

        tabContainer.querySelectorAll('li').forEach(t => t.classList.remove('active'));

        tabContent.querySelectorAll('.content').forEach(c => {
            c.style.display = c.dataset.tab === clickedTab.dataset.tab ? 'block' : 'none';
        });

        clickedTab.classList.add('active');
    }

    async onFavsBtnClick() {
        const tables = new Tables();

        let rwisCount = global.globalData.rwis.length,
            rwCount = global.globalData.roadReports.length;

        history.replaceState(null, null, ' ');

        global.modal.innerHTML = '<span id="close"></span><h1>My Favorites</h1><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="cams">Cameras</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="rwis">Weather</li></ul>' +
            '<div class="tab-content"><div class="content active" data-tab="cams">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="rwis">Loading...</div></div></div>';
        global.modal.classList.add('full');
        global.modal.style.display = 'flex';

        global.modal.querySelector('ul.tabs').addEventListener('click', (e) => {
            this.onTabClickListener(global.modal.querySelector('ul.tabs'), global.modal.querySelector('.tab-content'), e);
        });

        tables.webcamTable();
        tables.rwisTable();

        document.querySelectorAll('#modal .tab-content .content[data-tab=rwis] .rwis-card').forEach((e) => {
            if (!config.settings.isFavorite('rwis', e.dataset.id)) {
                e.remove();
                rwisCount--;
            }

            if (rwisCount == 0) {
                global.modal.querySelector('.tab-content .content[data-tab=rwis]').innerHTML = 'You currently don\'t have any favorite weather stations';
            }
        });

        tables.rwTable();

        document.querySelectorAll('#modal .tab-content .content[data-tab=roads] .inc-card').forEach((e) => {
            if (!config.settings.isFavorite('roadReports', e.dataset.id)) {
                e.remove();
                rwCount--;
            }

            if (rwCount == 0) {
                global.modal.querySelector('.tab-content .content[data-tab=roads]').innerHTML = 'You currently don\'t have any favorite road reports';
            }
        });
    }

    /* regional areas icon on click */
    onAreasBtnClick() {
        let d = document.createElement('div'),
            items = '';

        metro.forEach((i) => {
            const zm = i.zoom - 2 - (window.outerWidth < 475 ? 2 : (window.outerWidth < 600 ? 1 : 0));
            items += `<li><a href="#" id="areaLink" onclick="return false" data-lon="${i.center[1]}" data-lat="${i.center[0]}" data-zoom="${zm}">${i.name}</a></li>`;
        });

        d.innerHTML = constants.dialog;
        d.classList.add('dialog');
        document.body.appendChild(d);

        const container = document.querySelector('.dialog');
        container.querySelector('h1').innerHTML = 'Go to an area';
        container.querySelector('p').innerHTML = '<ul>' + items + '</ul>';
        container.querySelector('#pos').innerHTML = 'Cancel';
        container.querySelector('#neg').remove();

        document.querySelector('.backdrop').style.display = 'block';
    }

    /* tabular listing icon on click */
    onTableBtnClick() {
        const tables = new Tables();
        history.replaceState(null, null, ' ');

        global.modal.innerHTML = '<span id="close"></span><h1>Tabular Report</h1><div class="wrapper"><ul class="tabs"><li class="tab" data-tab="alerts">Alerts</li><li class="tab active" data-tab="rwis">Weather</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="incs">Incidents</li></ul>' +
            '<div class="tab-content"><div class="content" data-tab="alerts">There are currently no high priority alerts.</div><div class="content active" data-tab="rwis">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>';
        global.modal.classList.add('full');
        global.modal.style.display = 'flex';

        global.modal.querySelector('ul.tabs').addEventListener('click', (e) => {
            this.onTabClickListener(global.modal.querySelector('ul.tabs'), global.modal.querySelector('.tab-content'), e);
        });

        tables.rwisTable();
        tables.incsTable();
        tables.rwTable();
    }
}