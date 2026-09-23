import { ENV } from '../app/config.js';
import { api, numberFormat } from '../utils/helpers.js';
import { global, searchResults, stateLabels } from '../app/state.js';

export class Search {
    constructor(q) {
        this.query = q != null ? q.toLowerCase().replace('fire', '') : null;
        this.results = searchResults;
        this.standby = this.results.querySelector('li.standby');
    }

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
                global.trails.trailheads.forEach((feature, _) => {
                    let use = false;

                    const name = feature.properties.title;
                    const j = name.toLowerCase().split(' ');

                    for (let i = 0; i < j.length; i++) {
                        if (j[i].search(this.query) >= 0) {
                            use = true;
                            break;
                        }
                    }

                    if (name.toLowerCase().search(this.query) >= 0) use = true;

                    if (use) {
                        const li = document.createElement('li');
                        const terms = feature.properties.term.length ? feature.properties.term.join(' &middot; ') : 'Trail';

                        li.dataset.action = 'sr-onclick';
                        li.dataset.type = 'trail';
                        li.dataset.tid = feature.properties.id;
                        li.title = name;
                        li.innerHTML = `<!--<span class="icon fire fas fa-fire"></span>-->
                                <h3>
                                    ${name}
                                    <span><b>${terms}</b>&nbsp;&middot;&nbsp;${numberFormat(feature.properties.stats?.distance, 1)} mi.</span>
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