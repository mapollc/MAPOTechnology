import { config, siteTitle } from '../app/config.js';
import { global } from '../app/global.js';

import { Calculate } from '../utils/calculate.js';
import * as helpers from '../utils/helpers.js';

const calculate = new Calculate();

export class Modal {
    constructor(json, origin = false) {
        this.json = json;
        this.origin = origin;
        this.closeBtn = '<span id="close"></span>';
        this.template = `${this.closeBtn}<h1></h1><span class="updated"></span><div class="rows"></div>`;
        this.template2 = `${this.closeBtn}<h1></h1><div class="popup-content"></div>`;
    }

    updateURI(type, id, title = '') {
        /*if (origin) {
            const newURL = window.location.origin + '/oregonroads/' + type + '/' + id + (window.location.search.search('version') ? window.location.search : '') + window.location.hash;
            window.history.pushState({}, (title ? title + ' | ' + siteTitle : ''), newURL);
        }

        if (title) {
            document.title = title + ' | ' + siteTitle;
        }*/
    }

    vms() {
        let messages,
            thetype = typeof this.json.messages;

        if (thetype != 'string') {
            this.json.messages = JSON.parse(JSON.stringify(this.json.messages));
            messages = this.json.messages;
        } else {
            messages = this.json.messages ? JSON.parse(this.json.messages) : null;
        }

        let msg = `${messages[0][0]}<br>${messages[0][1]}<br>${messages[0][2]}`;

        if (messages[1]) {
            msg += `<br><span style="font-weight:100">------------------------------------------------------</span><br>
                ${messages[1][0]}<br>${messages[1][1]}<br>${messages[1][2]}`;
        }

        this.actions().create(this.json.name);
        this.actions().setContent(`<div class="vmsMsg">${msg}</div>${this.json.attached ? `<small>This message is in relation to incident #${this.json.attached}.</small>` : ''}`);

        this.updateURI('dms', this.json.id, this.json.name);
    }

    processRoadReports(data) {
        let rows = `<div class="line"><div class="de">Temperature</div><span>${data.temp}&deg;F</span></div>
            <div class="line"><div class="de">Road Conditions</div><span${data.road.id == 3 ? ' class="bi"' : ''}>${data.road.condition}</span></div>
            <div class="line"><div class="de">Weather</div><span>${data.weather}</span></div>
            <div class="line"><div class="de">New Snow</div><span>${data.snow.new == null ? 'N/A' : (data.snow.new == 'Trace' ? 'Trace' : `${data.snow.new}&nbsp;in`)}</span></div>
            <div class="line"><div class="de">Roadside Snow</div><span>${data.snow.roadside == null ? 'N/A' : (data.snow.roadside == 'Trace' ? 'Trace' : `${data.snow.roadside}&nbsp;in`)}</span></div>
            ${data.notes ? `<div class="line m"><div class="de">Comments</div><span>${data.notes}</span></div>` : ''}
            ${data.restrict.cmv.restrict ? `<div class="line m"><div class="de">Commerical Vehicle Restrictions</div><span>${data.restrict.cmv.restrict}</span></div>` : ''}
            ${data.restrict.chains.cond != 0 ? `<div class="sz"><h3>Snow Zone</h3><p>${data.restrict.chains.desc}</p></div>` : ''}
            <small>This data is reported by ODOT maintenance crews five times per day and at other times when conditions change significantly.</small>`;

        return rows;
    }

    roadReport(name, int = 0) {
        if (this.json.length == 0) {
            helpers.createDialog('No Report', 'Currently, there is no road report for ' + name + '.');
            return;
        }

        const data = this.json[int];

        this.actions().create(`${data.name} (${helpers.roadName(data.hwy)})` + this.genFav('roadReports', data.name, data.name));
        this.actions().rows(this.processRoadReports(data));
        this.actions().updated(`Last report ${helpers.timeAgo(data.updated)}`);

        if (data.restrict.chains.cond != 0 && data.restrict.chains.cond != 'A') {
            global.modal.querySelector('.updated').insertAdjacentHTML('beforebegin', '<p class="chreq">Chain restrictions are in place</p>');
        }

        if (this.json.length > 1) {
            let ops = '';

            this.json.forEach((w, n) => {
                ops += '<option ' + (w.name == data.name ? 'selected ' : '') + 'value="' + n + '">' + w.name + '</option>';
            });

            global.modal.querySelector('.updated').insertAdjacentHTML('beforebegin', `<select id="changeRW" style="width:100%">${ops}</select>`);
        }

        this.actions().show(true);
        this.updateURI('road-report', data.id, 'Report Report for ' + name);
    }

    processRWIS(cams = [], station, surface, weather, updated) {
        let pvt = 'N/A',
            content = '',
            wc = 'N/A',
            wi = '',
            vis = 'N/A',
            cameras = '';

        const geo = helpers.fetchRWIS(station.id);

        // process nearby webcams
        if (cams.length > 0) {
            cams.forEach(c => {
                const thecam = c.properties.cameras;

                for (let i = 0; i < thecam.length; i++) {
                    cameras += '<a href="#" class="rwisCam" data-id="' + thecam[i].id + '" onclick="return false">' + thecam[i].name + '</a>';
                }
            });
        }

        if (surface.pavement != null) pvt = surface.pavement[0].toFixed(1) + '&deg;F';
        if (weather.wind != null) wi = `<svg xmlns="http://www.w3.org/2000/svg" title="${weather.wind.dir}" style="transform:rotate(${weather.wind.rawdir}deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--dark-orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>`;
        if (weather.temp <= 50 && (weather.wind && (weather.wind.speed >= 3 || weather.wind.gust >= 3))) {
            wc = calculate.windChill(weather.temp, (weather.wind.speed >= 3 ? weather.wind.speed : weather.wind.gust)) + '&deg;F';
        } else {
            wc = Math.round(weather.temp) + '&deg;F';
        }

        if (weather.visibility != null) vis = weather.visibility.toFixed(2) + ' miles';

        content = `<div class="card">
            <div style="flex:1 1 50%;text-align:center">
                <h5 style="font-size:50px;color:var(--blue);margin:0">${Math.round(weather.temp)}&deg;F</h5>
                <span class="cl">temperature</span>
            </div>
            <div style="display:inline-flex;flex-direction:column;justify-content:center;gap:1em;flex:1 1 50%">
                <div style="text-align:center"><h5${surface.pavement != null && surface.pavement[0] < 32 ? ' style="color:#D33737"' : ''}>${pvt}</h5><span class="cl">pavement temp</span></div>
                <div style="text-align:center"><h5>${wc}</h5><span class="cl">feels like</span></div>
            </div>
        </div>`;

        if (surface.grip != null) {
            content += `<div class="card vert" onclick="helpers.grip('${surface.grip}');return false">
                <span class="cl" style="margin:0 0 0.5em 0">surface friction</span>
                <div class="grip">
                    <svg xmlns="http://www.w3.org/2000/svg" title="West" width="36" height="36" viewBox="0 0 24 24" style="transform:rotate(180deg);left:calc(-17px + ${Math.round(surface.grip / 0.82 * 100)}%)">
                        <path fill="#444" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path>
                    </svg>
                </div>
                <div style="display:inline-flex;width:100%;justify-content:space-between;align-items:center;margin-top:0.2em">
                    <h5>${Math.round(surface.grip * 100)}%</h5>
                    <p style="margin:0">${helpers.gripHelper(surface.grip)[0].toUpperCase()}</p>
                </div>
            </div>`;
        }

        if (weather.wind != null) {
            content += `<div style="display:flex;gap:1em">
                <div class="card vert">
                    <h5>${Math.round(weather.wind.speed) + ' mph'}</h5>
                    <span class="cl">wind speed</span>
                    <h5>${Math.round(weather.wind.gust) + ' mph'}</h5>
                    <span class="cl">wind gust</span>
                </div>
                <div class="card vert" style="justify-content:center">
                    ${wi}
                    <h5 style="margin-top:0.5em">${weather.wind.dir}</h5>
                    <span class="cl">wind direction</span>
                </div>
            </div>`;
        }

        content += `<div style="display:flex;gap:1em">
            <div class="card vert">
                <h5>${calculate.rh(weather.temp, weather.td)}%</h5>
                <span class="cl">relative humidity</span>
            </div>
            <div class="card vert" style="justify-content:center">
                <h5>${vis}</h5>
                <span class="cl">visibility</span>
            </div>
        </div>
        ${cameras != '' ? `<div class="card vert"><span class="cl" style="margin:0 0 0.5em 0">nearby cameras</span>${cameras}</div>` : ''}
        <div style="margin-top:1em;text-align:center">
            <span class="updated">Last report ${helpers.timeAgo(updated)}</span>
            <a href="#" class="btn" id="getwxf" data-stn="${station.id}" data-lat="${geo[1]}" data-lon="${geo[0]}" onclick="return false" style="margin-top:1em">
                <i class="far fa-snowflake"></i>Get weather forecast
            </a>
        <small>This data is automatically reported from a network of Road Weather Information Systems (RWIS).</small>
        </div>`;

        return content;
    }

    rwis(cams = []) {
        let thetype = typeof this.json.station,
            station,
            surface,
            weather;

        if (thetype != 'string') {
            this.json = JSON.parse(JSON.stringify(this.json));
            station = this.json.station;
            surface = this.json.surface;
            weather = this.json.weather;
        } else {
            station = this.json.station ? JSON.parse(this.json.station) : null;
            surface = this.json.surface ? JSON.parse(this.json.surface) : null;
            weather = this.json.weather ? JSON.parse(this.json.weather) : null;
        }

        const content = this.processRWIS(cams, station, surface, weather, this.json.updated);

        this.actions().create(helpers.roadName(station.name) + this.genFav('rwis', station.id, station.name), true);
        this.actions().setContent(content, true);

        if ((new Date().getTime() / 1000) - this.json.updated > (60 * 60 * 24 * 2)) {
            global.modal.querySelector('.popup-content').insertAdjacentHTML('beforebegin', '<p class="chreq">Station is likely offline and data is expired</p>');
        }

        this.updateURI('rwis', station.id, 'Current Weather: ' + station.name);
    }

    processIncidents(data, dataLoc = null, lanes, comments, filesObj, showUpd = false) {
        let files = "", affected = '';

        if (lanes != null) {
            const arr = { 'NB': [], 'SB': [], 'WB': [], 'EB': [] };
            lanes?.forEach(ln => {
                arr[ln.direction].push(ln.lane);
            });

            affected = Object.entries(arr)
                .filter(([_, arr]) => Array.isArray(arr) && arr.length > 0)
                .map(([dir, arr]) => `${calculate.direction(dir)}: ${arr.join(', ')}`)
                .join('<br>');
        }

        if (comments && comments.link) files = `<span><a target="blank" href="${comments.desc}">Additional Information</a></span>`;

        if (filesObj) {
            filesObj.forEach(l => {
                files += `<span><a target="blank" href="${l.url}">${l['file-description']}</a></span>`;
            });
        }

        const thisInc = helpers.getIncident(data.id);
        const coords = thisInc?.geometry.type == 'Point' ? thisInc?.geometry.coordinates : thisInc?.geometry.coordinates[0];
        const whichWay = dataLoc.direction ? ` ${calculate.direction(dataLoc.direction)}` : '';

        return `<div class="boxes">
            <div class="ea">
                <p class="location">${dataLoc.hwy}${whichWay ?? ''}, MP ${dataLoc.milepost.start}${dataLoc.milepost.end ? '-' + dataLoc.milepost.end : ''}</p>
                <p class="relLoc">${helpers.nearestCity(coords[1], coords[0])}</p>
            </div>
        </div>
        ${showUpd ? `<span class="updated">Updated ${helpers.timeAgo(data.updated)} &middot; Reported ${helpers.timeAgo(data.created)}</span>` : ''}
        <p class="incDesc">${data.desc}</p>
        ${comments && !comments.link ? `<p style="color:var(--blue-gray)">${comments.desc}</p>` : ''}
        <div class="rows">
            ${filesObj || (comments && comments.link) ? `<div class="line m"><div class="de">Links</div>${files}</div>` : ''}
            <div class="line m">
                <div class="de">Delays</div>
                <span>${data.impact}</span>
            </div>
            <div class="line m">
                <div class="de">Lanes Affected</div>
                <span>${lanes == null ? 'None' : affected}</span>
            </div>
        </div>
        <button class="btn dark" style="display:block;margin-top:1em" data-find="incident" data-id="${data.id}">Zoom in</button>
        <span class="bottom">Incident #${data.id} &middot; ${dataLoc.name} (#${dataLoc.id})</span>`;
    }

    incident() {
        let data = this.json;
        const thetype = typeof data.location;
        let dataLoc, lanes, comments, filesObj;

        if (thetype != 'string') {
            data = JSON.parse(JSON.stringify(data));
            dataLoc = data.location;
            lanes = data.lanes;
            comments = data.comments;
            filesObj = data.files;
        } else {
            dataLoc = data.location ? JSON.parse(data.location) : null;
            lanes = data.lanes ? JSON.parse(data.lanes) : null;
            comments = data.comments ? JSON.parse(data.comments) : null;
            filesObj = data.files ? JSON.parse(data.files) : null;
        }

        const { icon, color } = helpers.incidentStyle(data.type);

        this.actions().create(`<i class="fa-solid fa-${icon}" style="color:${color};margin-right:0.75em"></i>${data.type}`);
        this.actions().setContent(this.processIncidents(data, dataLoc, lanes, comments, filesObj));
        this.actions().updated(`Updated ${helpers.timeAgo(data.updated)} &middot; Reported ${helpers.timeAgo(data.created)}`);

        global.modal.querySelector('.updated').parentNode.insertBefore(global.modal.querySelector('.boxes'), global.modal.querySelector('.updated'));

        this.updateURI('incident', data.id, `${data.type} @ ${dataLoc.hwy} MP ${dataLoc.milepost.start}${dataLoc.milepost.end ? `-${dataLoc.milepost.end}` : ''}${dataLoc.direction ? ` ${dataLoc.direction}` : ''}`);
    }

    processCameras(geo, camera, rn = false) {
        const where = geo == null ? null : helpers.nearestCity(geo[1], geo[0]);

        return `${!rn ? `<span>${camera.name}</span>${this.genFav('cameras', camera.id, camera.name)}` : ''}</h2>
        <img loading="lazy" src="${atob(camera.url)}?${new Date().getTime()}" alt="${camera.name}" title="${camera.name}" class="webcam">
        <span class="bottom" style="margin-bottom:1em">${where != null && where != '' ? where + ' &middot; ' : ''}${camera.county ? `${camera.county}&nbsp;County&nbsp;&middot;&nbsp;` : ''} Provided by ODOT</span>`;
    }

    webcam(geo = null) {
        let firstID, firstName, camContent = '';

        this.actions().create('Travel Cameras');

        this.json.forEach((camera, i) => {
            if (!firstID) {
                firstID = camera.id;
                firstName = camera.name;
            }

            camContent += `<h2 class="wc"${i > 0 ? ' style="margin-top:1em"' : ''}>${this.processCameras(geo, camera)}`;
        });

        this.actions().setContent(camContent);
        this.updateURI('camera', firstID, firstName);
    }

    genFav(cat, id, title) {
        const is = config.settings.isFavorite(cat, id.toString());
        return '<i id="fav" class="fas fa-heart ' + (!is ? 'un' : '') + 'favorite" data-category="' + cat + '" data-title="' + title + '" data-id="' + id + '" title="' + (is ? 'Remove from' : 'Add to') + ' favorites" aria-hidden="true"></i>';
    }

    async wxAlert(id) {
        const { wwa } = await helpers.api(config.apiURL + 'getWWA', [['id', id]]);

        const content = `<span class="updated">Issued ${wwa.issued} &middot; Expires ${wwa.expires}</span>
            <div class="wwa-area">
                <i class="fas fa-location-dot"></i>
                ${wwa.area}
            </div>
            <div class="wwa-headline">${wwa.headline}</div>
            <p>${wwa.text}</p>${wwa.help && wwa.help != '<p></p>' ? wwa.help : ''}
            <p style="font-size:14px;color:#727272;margin-top:2em">Issued by <a href="//weather.gov/${wwa.wfo}">NWS ${wwa.office}</a></p>`;

        this.actions().create(`${wwa.title}`, true);
        this.actions().setContent(content, true);
        this.updateURI('wwa', id, `${wwa.title} issued by the National Weather Service in ${wwa.office}`);
    }

    actions() {
        const self = this;

        return {
            create: (title, useTemp2 = false) => {
                global.modal.innerHTML = useTemp2 ? self.template2 : self.template;
                self.actions().setTitle(title);
            },
            setTitle: (title) => {
                global.modal.querySelector('h1').innerHTML = title;
            },
            rows: (rows) => {
                global.modal.querySelector('.rows').innerHTML = rows;
            },
            setContent: (content, useTemp2 = false) => {
                if (useTemp2) {
                    global.modal.querySelector('.popup-content').innerHTML = content;
                } else {
                    const rows = global.modal.querySelector('.rows');

                    rows?.insertAdjacentHTML('afterend', content);
                    rows?.remove();
                }

                self.actions().show();
            },
            updated: (ago) => {
                global.modal.querySelector('.updated').innerHTML = ago;
            },
            show: (removeFull = false) => {
                if (removeFull) global.modal.classList.remove('full');
                global.modal.style.display = 'flex';
                ////global.modal = modal;
            }
        };
    }
}