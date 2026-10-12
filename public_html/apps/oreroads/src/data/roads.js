import { global } from '../app/global.js'
import * as helpers from '../utils/helpers.js';
import maplibregl from '../map/maplibre.js';

export class RoadNetwork {
    constructor(lat = null, lon = null, road = null) {
        this.lat = lat;
        this.lon = lon;
        this.road = road;
        this.ROAD_RANGE_DIST = 10;

        this.reportTemplate = '<span id="close"></span><h1></h1><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="rw">Road</li><li class="tab" data-tab="wx">Weather</li>' +
            '<li class="tab" data-tab="cams">Cameras</li><li class="tab" data-tab="incs">Incidents</li></ul><div class="tab-content"><div class="content active" data-tab="rw">Loading...</div>' +
            '<div class="content" data-tab="wx">Loading...</div><div class="content" data-tab="cams">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>';
    }

    mileposts(json) {
        if (!json?.features?.length) return;

        global.roadNetwork = json.features
            .map(f => ({
                id: String(f.properties.HWYNUMB),
                name: f.properties.HWYNAME,
                mp: Number(f.properties.MP_DISP.split('.')[0]),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0]
            }))
            .sort((a, b) => a.id.localeCompare(b.id) || a.mp - b.mp);
    }

    getRange(report/*, rn, isClick = false*/) {
        const roadMatch = global.roadNetwork.find(e => e.id === this.road);
        if (!roadMatch) return '';

        const name = roadMatch.name;

        const candidates = global.roadNetwork.filter(rn =>
            rn.name === name &&
            global.calculate.distance(this.lat, this.lon, rn.lat, rn.lon) <= this.ROAD_RANGE_DIST / 2
        );

        if (!candidates.length) return '';

        const mpValues = candidates.map(c => Number(c.mp));
        const minMP = Math.min(...mpValues);
        const maxMP = Math.max(...mpValues);

        const mp1 = candidates.find(f => f.mp === minMP);
        const mp2 = candidates.find(f => f.mp === maxMP);

        this.listFeatures(mp1, mp2, report);

        return `${mp1.mp}-${mp2.mp}`;
    }

    listFeatures(a, b, report) {
        const hwy = helpers.roadName(report[0].hwy);
        const start = Math.min(a.mp, b.mp);
        const end = Math.max(a.mp, b.mp);

        const isBetween = (num) => (num >= start && num <= end) || (num <= start && num >= end);

        const features = {
            meta: { hwy, start: a.mp, end: b.mp },
            rw: report,
            rwis: [],
            webcams: [],
            incidents: [],
            construction: []
        };

        const incidentIDs = new Set();

        // get RWIS
        global.globalData.rwis
            .filter(f => f.properties.station !== null)
            .forEach(f => {
                const st = f.properties.station;

                if (st.hwy === hwy.replace('-', '') && isBetween(st.mp)) {
                    features.rwis.push(f);
                }
            });

        // get travel cameras
        global.globalData.webcams.forEach(f => {
            const cam = f.properties.cameras?.[0];

            if (cam && cam.hwy === hwy && isBetween(cam.milepost)) {
                features.webcams.push(f);
            }
        });

        // get incidents
        global.globalData.incidents.forEach(f => {
            const { id, location } = f.properties;
            if (incidentIDs.has(id)) return;
            if (location.hwy !== hwy) return;

            const { start: mpStart, end: mpEnd } = location.milepost;

            if (f.geometry.type === 'Point') {
                if (isBetween(mpStart) || (mpEnd && isBetween(mpEnd))) {
                    incidentIDs.add(id);
                    features.incidents.push(f.properties);
                }
            } else {
                if (isBetween(start) || isBetween(end)) {
                    incidentIDs.add(id);
                    features.incidents.push(f.properties);
                }
            }
        });

        const bounds = new maplibregl.LngLatBounds()
            .extend([a.lon, a.lat])
            .extend([b.lon, b.lat]);

        global.map.fitBounds(bounds, { padding: 60 });

        this.displayFeatures(features);
    }

    itemHeader(name, updated) {
        return `<h2>${name}</h2>${updated != null ? `<span class="updated">${updated}</span>` : ''}`;
    }

    buildSection(items = [], emptyMsg) {
        //console.log(items);
        return items.length
            ? items.map(item => `<div class="roadNetworkItem">${item}</div>`).join('<hr>')
            : emptyMsg;
    }

    async displayFeatures(report) {
        const { Modal } = await import('../ui/modal.js');

        const processor = new Modal();
        global.modal.innerHTML = this.reportTemplate;

        const tabs = global.modal.querySelector('ul.tabs');
        const tabContent = global.modal.querySelector('.tab-content');

        tabs.addEventListener('click', async (e) => {
            const { Style } = await import('../map/style.js');
            new Style().onTabClickListener(tabs, tabContent, e);
        });
        tabContent.scrollTo({ top: 0, behavior: 'smooth' });

        global.modal.querySelector('h1').innerHTML = `Report for ${report.meta.hwy} from MP ${report.meta.start} - ${report.meta.end}`;

        // work through RWIS
        const rwisContent = this.buildSection(
            (report.rwis ?? []).map(rwis => {
                const { station, surface, weather } = rwis.properties;
                return this.itemHeader(`${station.name}${processor.genFav('rwis', station.id, station.name)}`, null) +
                    processor.processRWIS([], station, surface, weather, rwis.properties.updated);
            }),
            'There are no RWIS in this area.'
        );

        // work through cameras
        const cameraContent = this.buildSection(
            (report.webcams ?? []).flatMap(json =>
                (json?.properties?.cameras ?? []).map(cam =>
                    this.itemHeader(`${cam?.name}${processor.genFav('cameras', cam?.id, cam?.name)}`) +
                    processor.processCameras(null, cam, true)
                )
            ),
            'There are no travel cameras in this area.'
        );

        // work through incidents
        const incidentContent = this.buildSection(
            (report.incidents ?? []).map(inc => {
                if (!inc) return '';
                const { icon, color } = helpers.incidentStyle(inc.type);
                const header = `<h2 class="inc"><i class="fa-solid fa-${icon}" style="color:${color};margin-right:0.75em"></i>${inc.type}</h2>`;

                return header + processor.processIncidents(inc, inc.location, inc.lanes, inc.comments, inc.files, true);
            }),
            'There are no incidents reported in this area.'
        );

        // work through road reports
        const rwContent = this.buildSection(
            (report.rw ?? []).map(rw =>
                this.itemHeader(
                    `${rw.name}${processor.genFav('roadReports', rw.name, rw.name)}`,
                    `Last report ${helpers.timeAgo(rw.updated)}`
                ) + processor.processRoadReports(rw)
            ),
            'There are no road reports in this area.'
        );

        // inject into modal
        const list = { rw: rwContent, wx: rwisContent, cams: cameraContent, incs: incidentContent };

        Object.keys(list).forEach(key => {
            global.modal.querySelector(`.content[data-tab="${key}"]`).innerHTML = list[key];
        });

        // finally, show modal
        global.modal.classList.add('full');
        global.modal.style.display = 'flex';
        ////global.modal = modal;
    }
}