import { gmtime } from '../utils/helpers.js';

import { config } from './config.js';

import { stateLabels } from '../utils/constants.js';

export const global = {
    conversion: null,
    dispatchCenters: null,
    map: null,
    marker: null,
    chart: null,
    activeIncidents: new Map(),
    loadingImages: new Set(),
    mapControls: [],
    dataView: {
        newFires: [],
        topFires: [],
        trackedFires: [],
        airQualityStns: null
    },
    inits: {
        trending: false,
        highchartsLoad: false,
        evacuations: null,
        clickListener: null,
        controlsAtBottom: null,
        trackedDone: false
    },
    selected: {
        caperim: null,
        ausperim: null,
        perim: null,
        evac: null,
        nri: null,
        erc: null
    },
    radar: {
        mapFrames: [],
        animationPosition: 0,
        animationTimer: false,
        currentLayerId: null,
        isLoading: false,
        loadedPositions: new Set()
    },
    hrrrSmokeTime: {
        init: gmtime(-3600),
        fcst: gmtime(+3600)
    }
};

export const modal = document.querySelector('#modal'),
    impact = document.querySelector('#impact'),
    searchResults = document.querySelector('#search-results');

export const disclaimer = 'This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.',
    impactHeader = `<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" data-action="close-impact" title="Close window">
    <i class="far fa-xmark" data-action="close-impact"></i></div></header>`,
    noneTracked = '<p class="message error">You aren\'t following any wildfires yet. Click on a fire to start following an incident.</p>',
    premFeature = '<i class="fas fa-lock" style="color:#a1d5e9" title="Subscribe to Map of Fire to gain access to this feature"></i>';

export async function createCSReport(data, lat, lon) {
    const form = document.querySelector('#newReport'),
        theState = stateLabels[data.geocode.state];

    if (config.settings.user != null) {
        form.querySelector('input[name=authUser]').value = 1;
        form.insertAdjacentHTML('afterbegin', `<input type="hidden" name="uid" value="${config.settings.user.uid}">`);
    }

    form.querySelector('input[name=lat]').value = lat;
    form.querySelector('input[name=lon]').value = lon;
    form.querySelector('input[id=gc]').value = data.geocode.county.county ? `${data.geocode.county.county} County` : 'Undetermined';
    form.querySelector('input[id=gl]').value = data.geocode.near;
    form.querySelector('input[id=gs]').value = data.geocode.state ? theState?.name : 'Undetermined';
    form.querySelector('input[name=geolocation]').value = data.geocode.near;
    form.querySelector('input[name=state]').value = `${data.geocode.state} / ${theState?.name}`;

    form.querySelector('input[name=size]').addEventListener('keyup', (e) => {
        form.querySelector('#alab').innerHTML = `acre${(e.target.value != 1 ? 's' : '')}`;
    });

    config.disableClicks = false;
}