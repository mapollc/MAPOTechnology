import { ENV, config } from '../app/config.js';
import { global, searchResults } from '../app/state.js';

import { storage, numberFormat, api } from '../utils/helpers.js';
import { stateLabels } from '../utils/constants.js';

export function addTrending() {
    const fragment = document.createDocumentFragment();
    const standby = searchResults.querySelector('li.standby');
    let count = 0;

    searchResults.querySelectorAll('li.standby').forEach(li => {
        if (li !== standby) li.remove();
    });

    searchResults.style.display = 'flex';
    standby.innerHTML = '<h6 style="color:var(--box-border);font-size:18px;cursor:auto;user-select:none">Trending incidents...</h6>';

    if (standby.style.display == 'none') standby.style.display = 'inline-flex';

    if (global.dataView.topFires?.length) {
        global.dataView.topFires.forEach(i => {
            const p = i.data;
            const fire = config.wildfire.findFire(p.wfid);

            if (!fire) return;

            const fireName = fire.properties.name;
            const acres = global.conversion.sizeFormat(fire.properties.acres);
            const who = `${numberFormat(i.count, 0)} ${(i.count == 1 ? 'person is' : 'people are')} looking at the ${fireName}`;

            const li = document.createElement('li');

            li.classList.add('trending');
            li.dataset.action = 'sr-onclick';
            li.dataset.type = 'incident';
            li.dataset.wfid = p.wfid;
            li.title = who;

            li.innerHTML = `<div>
                <span class="icon fire fas fa-fire"></span>
                <h3>
                    ${fireName}
                    <span>${fire.properties.type} in ${stateLabels[fire.properties.state]?.name}&nbsp;&middot;&nbsp;<b>${acres}</b></span>
                </h3>
            </div>
            ${(i.trending ? '<span class="trend fas fa-arrow-trend-up" style="color:var(--green)"></span>' : '')}`;

            fragment.appendChild(li);

            count++;
        });
    }

    if (count === 0) {
        const li = document.createElement('li');
        li.classList.add('standby');
        li.innerHTML = '<span>No currently trending fires</span>';
        fragment.appendChild(li);
    }

    searchResults.appendChild(fragment);
}

export class Search {
    constructor(q) {
        this.key = 'mapofire.search_history';
        this.history = storage(this.key);
        this.emptyHistory = this.history == null || this.history == '' || JSON.parse(this.history).length == 0 ? true : false;
        this.query = q != null ? q.toLowerCase().replace('fire', '') : null;
        this.results = searchResults;
        this.standby = this.results.querySelector('li.standby');
    }

    /*clearData() {
        if (!this.emptyHistory) {
            const tmp = [];

            JSON.parse(this.history).forEach((i) => {
                if (new Date().getTime() - i.time < (60 * 60 * 24 * 14 * 1000)) {
                    tmp.push(i);
                }
            });

            storage(this.key, JSON.stringify(tmp));
        }
    }

    storeSearches() {
        this.clearData();

        const srJson = {
            query: this.query,
            time: new Date().getTime()
        };

        if (this.history == null) {
            storage(this.key, JSON.stringify([srJson]));
        } else {
            const searchArray = [];

            JSON.parse(this.history).forEach((i) => {
                searchArray.push(i);
            });

            searchArray.push(srJson);
            storage(this.key, JSON.stringify(searchArray));
        }
    }

    getSearchHistory() {
        if (this.emptyHistory) {
            return null;
        } else {
            const queryCounts = {},
                json = JSON.parse(this.history);

            json.forEach(item => {
                queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
            });

            const latestEntriesMap = new Map();
            json.forEach(item => {
                const existingEntry = latestEntriesMap.get(item.query);

                if (!existingEntry || item.time > existingEntry.time) {
                    latestEntriesMap.set(item.query, item);
                }
            });

            const results = Array.from(latestEntriesMap.values());

            results.sort((a, b) => {
                const countA = queryCounts[a.query],
                    countB = queryCounts[b.query];

                if (countA !== countB) {
                    return countB - countA;
                }

                return b.time - a.time;
            });

            return results;
        }
    }*/

    async do() {
        Array.from(this.results.querySelectorAll('li:not(.standby)')).forEach(li => li.remove());

        let count = 0,
            apiStarted = false;

        if (this.query.length > 0) {
            const crds = (/([0-9]{2}\.[0-9]+),\s?(-[0-9]{3}.[0-9]+)/gm).exec(this.query);

            // store user searches in local storage
            //this.storeSearches();

            if (crds != null) {
                const lat = Number(crds[1]),
                    lon = Number(crds[2]);

                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    const h = global.map.getCenter(),
                        dist = numberFormat(global.conversion.distance(h.lat, h.lng, lat, lon), 1),
                        dms = String(`${global.conversion.convertToDms(lat, false)}&nbsp;${global.conversion.convertToDms(lon, true)}`).replace(/\s/g, '');

                    const li = document.createElement('li');
                    li.dataset.action = 'sr-onclick';
                    li.dataset.type = 'coordinates';
                    li.dataset.lat = lat.toString();
                    li.dataset.lon = lon.toString();
                    li.innerHTML = `<span class="icon fas fa-map-location"></span><h3>${parseFloat(lat).toFixed(6).replace(/[0]+$/, '')},&nbsp;${parseFloat(lon).toFixed(6).replace(/[0]+$/, '')} <span style="color:#788695">${dms}</span><span>${dist} mile${dist != 1 ? 's' : ''} away</span></h3>`;
                    this.results.appendChild(li);

                    count++;
                }
            } else {
                global.activeIncidents.forEach(f => {
                    let use = false;

                    const isIntl = (f.properties?.isCanada ?? false) || (f.properties?.isAustralia ?? false),
                        p = f.properties,
                        name = p.name,
                        acresDisp = global.conversion.sizeFormat(p.acres),
                        fstat = p.status,
                        status = (p.time.year < config.curTime.getFullYear() ? 'out' : config.wildfire.getStatus(fstat, p.notes)),
                        j = name.toLowerCase().split(' ');

                    for (let i = 0; i < j.length; i++) {
                        if (j[i].search(this.query) >= 0) {
                            use = true;
                            break;
                        }
                    }

                    if (name.toLowerCase().search(this.query) >= 0) use = true;

                    if (use && !isIntl) {
                        const li = document.createElement('li');
                        const state = stateLabels[p.state]?.name;

                        li.dataset.action = 'sr-onclick';
                        li.dataset.type = 'incident';
                        li.dataset.wfid = p.wfid;
                        li.title = name;
                        li.innerHTML = `<span class="icon fire fas fa-fire"></span>
                            <h3>
                                ${name}
                                <span>${p.type}${state ? ` in <b>${state}</b>` : ''}&nbsp;&middot;&nbsp;${acresDisp}${status != '' ? `&nbsp;&middot;&nbsp;
                                    <span class="fstatus ${status}">${status.ucfirst()}` : ''}</span>
                                </span>
                            </h3>`;
                        this.results.appendChild(li);

                        count++;
                    }
                });
            }
        }

        if (count > 0) {
            this.standby.style.display = 'none';
        }

        if (this.query.length > 3) {
            apiStarted = true;

            this.apiSearch().then(added => {
                const finalCount = count + added;

                if (finalCount > 0) {
                    this.standby.style.display = 'none';
                } else {
                    this.standby.style.display = 'block';
                    this.standby.querySelector('i').style.display = 'none';
                    this.standby.querySelector('span').innerHTML = 'No results found';
                }
            });
        }

        if (this.query.length == 0 || (count === 0 && !apiStarted)) {
            this.standby.style.display = 'block';
            this.standby.querySelector('i').style.display = 'none';
            this.standby.querySelector('span').innerHTML = this.query.length == 0 ? 'Ready to search? Type something...' : 'No results found';
        }
    }

    async apiSearch() {
        let count = 0;
        const search = await api(`${ENV.apiURL}search`, [['q', this.query]], true);

        if (search.results != null && search.results.length > 0) {
            search.results.forEach((p) => {
                const li = document.createElement('li');
                let pname;

                if (p.type == 'county' || p.type == 'state') {
                    const bbox = {
                        x: {
                            min: p.data.xmin,
                            max: p.data.xmax
                        },
                        y: {
                            min: p.data.ymin,
                            max: p.data.ymax
                        }
                    };

                    li.dataset.bbox = JSON.stringify(bbox);
                }

                if (p.type == 'state') {
                    pname = p.data.name;
                } else if (p.type == 'county') {
                    pname = `${p.data.name} County, ${p.data.state}`;
                } else {
                    pname = `${p.data.city}, ${stateLabels[p.data.state].name}${(p.isZip ? ` ${p.data.zip}` : '')}`;
                    if (p.type == 'gis') {
                        pname = `${p.data.name}, ${stateLabels[p.data.state].name}`;
                        li.dataset.geotype = p.data.type;
                    }

                    li.dataset.lat = p.lat;
                    li.dataset.lon = p.lon;
                }

                li.dataset.action = 'sr-onclick';
                li.dataset.name = pname;
                if (p.data.county) li.dataset.county = p.data.county;
                li.dataset.type = p.type.toLowerCase();
                li.innerHTML = `<span class="icon fas fa-location-dot"></span>
                    <h3>${pname}
                        <span>${p.type == 'gis' ? `${p.data.type} in ` : ''}${p.data.county ? `${p.data.county} County` : (p.type == 'county' ? 'County' : 'State')}${p.type == 'city' && p.data.population > 0 ? `&nbsp;&middot;&nbsp;Population:&nbsp;${numberFormat(p.data.population)}` : ''}</span>
                    </h3>`;

                this.results.appendChild(li);

                count++;
            });
        }

        return count;
    }
}