function rwTable() {
    let content = '',
        exists = false;

    for (let i = 0; i < rw.length; i++) {
        let p = rw[i];

        if (p.road) {
            exists = true;
            content += '<div class="inc-card" data-id="' + p.name + '"  onclick="goToRW(\'' + p.name + '\')"><div class="wrap"><h2>' + p.name + '</h2><span class="updated">Last report ' + timeAgo(p.updated) + '</span></div>' +
                '<div class="rows" style="margin-top:0">' +
                '<div class="line"><div class="de">Weather</div><span>' + p.weather + '</span></div>' +
                '<div class="line"><div class="de">Road Conditions</div><span>' + p.road.condition + '</span></div>' +
                '</div></div>';
        }
    }

    get('#modal .tab-content .content[data-tab=roads]').innerHTML = exists ? '<input type="text" id="filterRW" class="text" autocomplete="off" placeholder="Search reports...">' + content : 'There are no road reports currently available.';
}

function webcamTable() {
    let content = '',
        count = 0;

    webcams.forEach((w) => {
        for (let i = 0; i < w.properties.cameras.length; i++) {
            const data = w.properties.cameras[i];

            if (isFavorite('cameras', data.id.toString())) {
                content += '<div style="' + (count != 0 ? 'margin-top:0.5em;' : '') + 'text-align:center"><h4 class="fav">' + data.name + genFav('cameras', data.id, data.name) + '</h4><img loading="lazy" src="' + atob(data.url) + '?' + new Date().getTime() + '" alt="' + data.name + '" title="' + data.name + '" class="webcam"></div>';
                count++;
            }
        }
    });

    get('#modal .tab-content .content[data-tab=cams]').innerHTML = (count == 0 ? 'You currently don\'t have any favorite cameras' : content);
}

function rwisTable() {
    let content = '';

    rwis.forEach((s) => {
        let p = s.properties,
            pvt;

        if (p.surface.pavement.length != 0) {
            pvt = Math.round(p.surface.pavement[0]) + '&deg;F';

            if (p.surface.pavement[1]) {
                pvt += '/' + Math.round(p.surface.pavement[1]) + '&deg;F';
            }
        }

        if (p.weather.wind.rawdir != 'null') {
            var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + p.weather.wind.dir + '" style="transform:rotate(' + p.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
        }

        //content += p.station.name + '<br>' + Math.round(p.weather.temp) + '<br>' + pvt + '<br>' + p.weather.wind.dir + p.weather.wind.speed + '<br>';
        content += '<div class="rwis-card" data-id="' + p.station.id + '" onclick="goToRWIS(\'' + p.station.id + '\')">' +
            '<span class="temp">' + Math.round(p.weather.temp) + '&deg;</span>' +
            '<div class="wrapper">' +
            '<h2>' + p.station.name + '</h2>' +
            '<div class="rows">' +
            (pvt ? '<div class="line"><div class="de">Pavement Temp</div><span>' + pvt + '</span></div>' : '') +
            (p.weather.wind.speed != null && p.weather.wind.dir != 'null' ? '<div class="line"><div class="de">Wind</div><span>' + (p.weather.wind.rawdir != 'null' ? wi : '') + (p.weather.wind.speed ? Math.round(p.weather.wind.speed) + ' mph' : '') + '</span></div>' : '') +
            (p.surface.grip != 'null' ? '<div class="line"><div class="de">Surface Friction</div><span><a href="#" onclick="grip(\'' + p.surface.grip + '\');return false">' + (p.surface.grip * 100) + '%</a></span></div>' : '') +
            '</div>' +
            '<span class="updated" style="text-align:left;margin-top:1em">Last reported ' + timeAgo(p.updated) + '</span>' +
            '</div></div>';
    });

    get('#modal .tab-content .content[data-tab=rwis]').innerHTML = '<input type="text" id="filterRWIS" class="text" autocomplete="off" placeholder="Search stations...">' + content;
}

async function incsTable() {
    let content = '',
        alerts = '';

    incidents.forEach((s) => {
        if (s.properties.category != 'Road Work') {
            let p = s.properties,
                isAlert = false;

            if (p.type == 'Closure' || p.impact == 'Closure' || p.impact == 'Closure with Detour') {
                isAlert = true;
            }

            content += '<div class="inc-card" onclick="findIncident(\'' + p.id + '\', true)"><div class="wrap"><h2>' + p.type + '</h2><span class="updated">' + timeAgo(p.updated) + '</span></div><p style="margin:0;color:var(--blue)">' + p.location.desc + '</p>' +
                '<span style="color:#555;font-size:14px">' + p.location.hwy + ' &middot; Milepost ' + p.location.milepost.start + (p.location.milepost.end ? '-' + p.location.milepost.end : '') +
                (p.location.direction ? ' &middot; ' + p.location.direction : '') + '</span></div>';

            if (isAlert) {
                alerts += '<div class="inc-card" onclick="findIncident(\'' + p.id + '\', true)"><div class="wrap"><h2 style="color:#e53935">' + p.type + '</h2><span class="updated">' + timeAgo(p.updated) + '</span></div><p style="margin:0;color:var(--blue)">' + p.location.desc + '</p>' +
                    '<span style="color:#555;font-size:14px">' + p.location.hwy + ' &middot; Milepost ' + p.location.milepost.start + (p.location.milepost.end ? '-' + p.location.milepost.end : '') +
                    (p.location.direction ? ' &middot; ' + p.location.direction : '') + '</span></div>';
            }
        }
    });

    /* parse WWAs */
    if (nwsAlerts.length > 0) {
        for (let i = 0; i < nwsAlerts.length; i++) {
            const d1 = new Date(nwsAlerts[i].effective * 1000),
                d2 = new Date(nwsAlerts[i].expires * 1000),
                tzs = d1.toString().match(/\(([A-Za-z\s]+)\)/)[1].split(' '),
                tz = tzs[0].substring(0, 1) + tzs[1].substring(0, 1) + tzs[2].substring(0, 1),
                t1 = (d1.getHours() == 0 ? 12 : (d1.getHours() > 12 ? d1.getHours() - 12 : d1.getHours())) + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes(),
                t2 = (d2.getHours() == 0 ? 12 : (d2.getHours() > 12 ? d2.getHours() - 12 : d2.getHours())) + ':' + (d2.getMinutes() < 10 ? '0' : '') + d2.getMinutes(),
                iss = short_months[d1.getMonth()] + ' ' + d1.getDate() + ', ' + d1.getFullYear() + ' at ' + t1 + ' ' + (d1.getHours() > 12 ? 'P' : 'A') + 'M ' + tz,
                exp = dow[d2.getDay()] + ', ' + long_months[d2.getMonth()] + ' ' + d2.getDate() + ', ' + d2.getFullYear() + ' at ' + t2 + ' ' + (d2.getHours() > 12 ? 'P' : 'A') + 'M';

            alerts += '<div class="wwa-card" onclick="window.open(\'https://alerts-v2.weather.gov/#/?id=' + nwsAlerts[i].id + '\')"><div class="wrap"><h2>' + nwsAlerts[i].event + '</h2></div><p style="font-size:15px;margin:0">In effect until ' + exp + '</p>' +
                '<p style="color:var(--blue-gray);margin:0">' + nwsAlerts[i].zone + '</p><span class="updated" style="text-align:left">Issued ' + iss + '</span></div>';
        }
    }

    get('#modal .tab-content .content[data-tab=alerts]').innerHTML = alerts;
    get('#modal .tab-content .content[data-tab=incs]').innerHTML = content;
}

async function radarInit() {
    await fetch('https://api.rainviewer.com/public/weather-maps.json').then(async (resp) => {
        const imgs = await resp.json();

        imgs.radar.past.forEach((e) => {
            radarImgs.push(e.time);
        });

        let time = (n) => {
            const d = new Date(radarImgs[n] * 1000),
                h = d.getHours(),
                m = d.getMinutes();

            return (h > 12 ? h - 12 : (h == 12 ? 12 : h)) + ':'.replace(' ', '') + (m < 10 ? '0' : '') + m + (h >= 12 ? 'p' : 'a') + 'm';
        };

        const rl = '<div class="radar"><div><span class="radarControl fas fa-pause"></span><div class="time">' +
            '<input type="range" steps="12" min="0" max="12" value="0">' +
            '<div class="tr"><span>' + time(0) + '</span><span>' + time(6) + '</span><span>' + time(12) + '</span></div></div></div></div>';

        document.body.insertAdjacentHTML('beforeend', rl);

        this.radar();
    });
}

function radar() {
    let counter = 0;

    radarImgs.forEach((e, n) => {
        map.addSource('radar-' + n, {
            type: 'raster',
            tiles: ['https://tilecache.rainviewer.com/v2/radar/' + e + '/256/{z}/{x}/{y}/4/0_1.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
        });

        map.addLayer({
            id: 'radar-layer-' + n,
            type: 'raster',
            source: 'radar-' + n,
            layout: {
                visibility: 'none'
            },
            paint: {
                'raster-fade-duration': 0,
                'raster-opacity': 0.7
            }
        });
    });

    let ra = () => {
        radarImgs.forEach((e, n) => {
            map.setLayoutProperty('radar-layer-' + n, 'visibility', (n == counter ? 'visible' : 'none'));
            document.querySelector('.radar input[type=range]').value = counter;
        });

        if (counter == radarImgs.length - 1) {
            counter = 0;
            clearInterval(radarAnim);

            setTimeout(() => {
                radarAnim = setInterval(ra, RADAR_INT);
            }, RADAR_INT);
        } else {
            counter++;
        }
    };


    radarAnim = setInterval(ra, RADAR_INT);
}

class Geo {
    constructor(lat, lon, zoom) {
        this.lat = lat;
        this.lon = lon;
        this.zoom = zoom;
    }

    saveLocation() {
        localStorage.setItem('map_lat', this.lat);
        localStorage.setItem('map_lon', this.lon);
        localStorage.setItem('map_zoom', this.zoom);
    }

    getLocation() {
        return [
            localStorage.getItem('map_lat'),
            localStorage.getItem('map_lon'),
            localStorage.getItem('map_zoom')
        ];
    }
}

class Subscription {
    constructor(u) {
        this.sub = null;
        this.user = u;

        if (this.user && this.user.subscriptions != null) {
            this.user.subscriptions.forEach((s) => {
                if (s.plan == sub_id) {
                    this.sub = s;
                }
            });
        }
    }

    valid() {
        return this.sub == null ? false : true;
    }

    cid() {
        return this.sub ? this.sub.cid : null;
    }

    sid() {
        return this.sub ? this.sub.subscription : null;
    }

    expires() {
        return this.sub ? dateTime(this.sub.ends) : null;
    }
}

function doFavorites(f, cat, id, title) {
    let n = 'favorites_' + cat,
        cur = localStorage.getItem(n),
        arr = [];

    if (f == 'add') {
        if (cur == null || cur == 'null') {
            localStorage.setItem(n, '["' + id + '"]');
        } else {
            JSON.parse(cur).forEach((e) => {
                arr.push(e);
            });

            if (arr.includes(id)) {
                console.error('This item already exists in the user\'s favorites');
            } else {
                arr.push(id.toString());
                localStorage.setItem(n, JSON.stringify(arr));
            }
        }

        Snackbar(title + ' was successfully added to your favorites.');
    } else {
        JSON.parse(cur).forEach((e) => {
            if (e != id) {
                arr.push(e);
            }
        });

        localStorage.setItem(n, JSON.stringify(arr));
        Snackbar(title + ' was successfully removed from your favorites.');
    }

    localStorage.setItem('modTime', Math.round(new Date().getTime() / 1000));
}

class Settings {
    constructor(u) {
        this.user = u;
        this.role = u != null ? u.role : 'GUEST';

        if (this.getRoadReports() != null) {
            localStorage.setItem('favorites_roadReports', JSON.stringify(this.getRoadReports()));
        }

        if (this.getRWIS() != null) {
            localStorage.setItem('favorites_rwis', JSON.stringify(this.getRWIS()));
        }

        if (this.getCameras() != null) {
            localStorage.setItem('favorites_cameras', JSON.stringify(this.getCameras()));
        }
    }

    subscriptions() {
        let sub = new Subscription(this.user);

        return {
            valid: () => {
                return sub.expires();
            },
            customerID: () => {
                return sub.cid();
            },
            subID: () => {
                return sub.sid();
            },
            expires: () => {
                return sub.expires();
            }
        }
    }

    getRole() {
        return this.role;
    }

    hasPermissions(action) {
        if (action == 'ADMIN') {
            return this.getRole() == 'ADMIN' ? true : false;
        } else {
            return this.getRole() == 'ADMIN' ? true : this.subscriptions().valid();
        }
    }

    getToken() {
        return this.user ? this.user.token : null;
    }

    getUID() {
        return this.user ? this.user.uid : null;
    }

    getName() {
        return this.getFirstName() + ' ' + this.user.last_name;
    }

    getFirstName() {
        return this.user.first_name;
    }

    favorites() {
        return this.user == null ? null : this.user.settings.oreroads;
    }

    getCameras() {
        return this.user == null ? null : (this.user.settings.oreroads ? this.user.settings.oreroads.cameras : null);
    }

    getRoadReports() {
        return this.user == null ? null : (this.user.settings.oreroads ? this.user.settings.oreroads.roadReports : null);
    }

    getRWIS() {
        return this.user == null ? null : (this.user.settings.oreroads ? this.user.settings.oreroads.rwis : null);
    }

    getSyncTime() {
        return this.user == null ? null : this.user.settings.synced
    }
}

class Modal {
    constructor(json, origin = false) {
        this.json = json;
        this.origin = origin;
        this.ht = '<span id="close"></span>' + template;
    }

    updateURI(type, id, title = '') {
        if (origin) {
            const newURL = window.location.origin + '/oregonroads/' + type + '/' + id + window.location.hash;
            window.history.pushState({}, (title ? title + ' | ' + siteTitle : ''), newURL);
        }

        if (title) {
            document.title = title + ' | ' + siteTitle;
        }
    }

    ttimes() {
        const d = document.createElement('div');
        let tmp = '<div class="travel_time"><table><tbody>';

        for (let i = 0; i < this.json.end.length; i++) {
            const single = (this.json.end.length == 1 ? true : false);
            console.log(single);

            tmp += '<tr><td style="width:32%"><div class="r">' + (this.json.start.icon ? '<img src="https://www.tripcheck.com/TV/images/Signs/' + this.json.start.icon + '" style="height:45px">' : '') + '<h5>' + (this.json.start.direction ? this.json.start.direction : this.json.start.road) + '</h5></div></td>' +
                '<td style="text-align:center;width:30px;font-style:italic;color:#444">to</td>';

            if (single) {
                tmp += '<td style="width:32%">' + (this.json.end[0].to.icon ? '<div class="r"><img src="https://www.tripcheck.com/TV/images/Signs/' + this.json.end[0].to.icon + '" style="height:45px">' +
                    (this.json.end[0].to.direction ? '<h5>' + this.json.end[0].to.direction + '</h5>' : '') + '</div>' : '<h5 style="text-align:center;line-height:1.3;font-size:17px">' + this.json.end[0].to + '</h5>') + '</td>';
            } else {
                tmp += '<td style="width:32%">' + (this.json.end[i].to.constructor === String ? '<h5 style="text-align:center;line-height:1.3;font-size:17px">' +
                    this.json.end[i].to + '</h5>' : '<div class="r"><img src="https://www.tripcheck.com/TV/images/Signs/' + this.json.end[i].to.icon + '" style="height:45px"></div>') + '</td>';
            }

            tmp += '<td rowspan="2" class="ttim"><span class="head">TRAVEL</span><h6>' + (this.json.end[i].travelTime == -1 ? 'N/A' : this.json.end[i].travelTime + ' min' + (this.json.end[i].travelTime == 1 ? '' : 's')) + '</h6>' +
                '<span class="head">DELAYS</span><span class="delay" title="A ' + (this.json.end[i].variable * 100).toFixed(1) + '% increase to your travel time">' + (this.json.end[i].delay == -1 ? 'N/A' : this.json.end[i].delay + ' min' + (this.json.end[i].delay == 1 ? '' : 's')) + '</span></td></tr>' +
                '<tr class="de"><td><p>' + (this.json.start.to ? this.json.start.to : '') + '</p></td><td></td><td><p>' +
                (single ? (this.json.end[i].to.to ? this.json.end[i].to.to : '') : (this.json.end[i].to.constructor === String ? '' : this.json.end[i].to.road)) + '</p></td></tr>';
        }

        tmp += '</tbody></div>';

        d.innerHTML = dialog;
        d.style.maxWidth = '475px';
        d.classList.add('dialog');
        document.body.appendChild(d);
        get('.dialog h1').innerHTML = 'Travel Times';

        if (this.json.updated) {
            get('.dialog p').classList.add('updated');
            get('.dialog p').innerHTML = 'As of ' + timeAgo(this.json.updated);
        }

        get('.dialog p').insertAdjacentHTML('beforebegin', tmp);
        get('.dialog #pos').innerHTML = 'Close';
        get('.dialog #neg').remove();
        get('.backdrop').style.display = 'block';
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

        let msg = messages[0][0] + '<br>' + messages[0][1] + '<br>' + messages[0][2];

        if (messages[1]) {
            msg += '<br><span style="font-weight:100">------------------------------------------------------</span><br>' +
                messages[1][0] + '<br>' + messages[1][1] + '<br>' + messages[1][2];
        }

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = this.json.name;
        get('#modal .rows').insertAdjacentHTML('afterend', '<div class="vmsMsg">' + msg + '</div>' + (this.json.attached ? '<small>This message is in relation to incident #' + this.json.attached + '.</small>' : ''));
        get('#modal .rows').remove();

        modal.style.display = 'flex';
        this.updateURI('dms', this.json.id, this.json.name);
    }

    roadReport(name, int = 0) {
        if (this.json.length == 0) {
            createDialog('No Report', 'Currently, there is no road report for ' + name + '.');
        } else {
            let data = this.json[int],
                rows = '';

            rows += '<div class="line"><div class="de">Temperature</div><span>' + data.temp + '&deg;F</span></div>';
            rows += '<div class="line"><div class="de">Road Conditions</div><span' + (data.road.id == 3 ? ' class="bi"' : '') + '>' + data.road.condition + '</span></div>';
            rows += '<div class="line"><div class="de">Weather</div><span>' + data.weather + '</span></div>';
            rows += '<div class="line"><div class="de">New Snow</div><span>' + (data.snow.new == null ? 'N/A' : (data.snow.new == 'Trace' ? 'Trace' : data.snow.new + ' in')) + '</span></div>';
            rows += '<div class="line"><div class="de">Roadside Snow</div><span>' + (data.snow.roadside == null ? 'N/A' : (data.snow.roadside == 'Trace' ? 'Trace' : data.snow.roadside + ' in')) + '</span></div>';
            rows += (data.notes ? '<div class="line m"><div class="de">Comments</div><span>' + data.notes + '</span></div>' : '');
            rows += (data.restrict.cmv.restrict ? '<div class="line m"><div class="de">Commerical Vehicle Restrictions</div><span>' + data.restrict.cmv.restrict + '</span></div>' : '');
            rows += (data.restrict.chains.cond != 0 ? '<div class="sz"><h3>Snow Zone</h3><p>' + data.restrict.chains.desc + '</p></div>' : '');
            rows += '<small>This data is reported by ODOT maintenance crews five times per day and at other times when conditions change significantly.</small>';

            modal.innerHTML = this.ht;
            get('#modal h1').style.alignItems = 'center';
            get('#modal h1').innerHTML = /*'<span class="rc"></span>' + */data.name + ' (' + roadName(data.hwy) + ')' + genFav('roadReports', data.name, data.name);
            /*get('#modal h1 .rc').style.backgroundColor = road(data.road.id);*/
            get('#modal .updated').innerHTML = 'Last report ' + timeAgo(data.updated);
            get('#modal .rows').innerHTML = rows;

            if (data.restrict.chains.cond != 0 && data.restrict.chains.cond != 'A') {
                get('#modal .updated').insertAdjacentHTML('beforebegin', '<p class="chreq">Chain restrictions are in place</p>');
            }

            if (this.json.length > 1) {
                let ops = '';

                this.json.forEach((w, n) => {
                    ops += '<option ' + (w.name == data.name ? 'selected ' : '') + 'value="' + n + '">' + w.name + '</option>';
                });

                get('#modal .updated').insertAdjacentHTML('beforebegin', '<select id="changeRW" data-json=\'' + JSON.stringify(this.json) + '\'>' + ops + '</select>');
            }

            modal.style.display = 'flex';
            this.updateURI('road-report', data.id, 'Report Report for ' + name);
        }
    }

    async getWXFcst(e) {
        let content = '',
            content2 = '';

        get('#modal').classList.add('full');
        get('#modal').innerHTML = '<span id="close"></span>' + template.replace('<div class="rows"></div>', loading);

        const json = await api(apiURL + 'forecast', [['lat', e.getAttribute('data-lat')], ['lon', e.getAttribute('data-lon')]]);

        if (json) {
            const title = 'Weather Forecast' + (e.getAttribute('data-stn') ? ' @ ' + e.getAttribute('data-stn') : '');
            get('#modal h1').innerHTML = title;

            if (json.forecast.hourly.updated === false || json.forecast.daily.updated === false) {
                get('#modal svg').insertAdjacentHTML('afterend', '<p style="text-align:center">The weather forecast for this location is unavailable right now.</p>');
                get('#modal svg').remove();
            } else {
                let h = json.forecast.hourly.periods,
                    d = json.forecast.daily.periods;

                for (let i = 0; i < h.length; i++) {
                    const hr = new Date(h[i].startTime * 1000).getHours(),
                        time = (hr == 0 ? 12 : (hr > 12 ? hr - 12 : hr)) + ' ' + (hr < 12 ? 'A' : 'P') + 'M';

                    content += '<div class="tp"><h3>' + h[i].temperature + '&deg;</h3><img title="' + h[i].shortForecast + '" alt="' + h[i].shortForecast + '" src="' + h[i].icon + '"><p>' + time + '</p></div>';
                }

                for (let i = 0; i < d.length; i++) {
                    content2 += '<div class="tp"><div class="head"><h3>' + d[i].name + '</h3><img title="' + d[i].shortForecast + '" alt="' + d[i].shortForecast + '" src="' + d[i].icon + '" style="height:65px">' +
                        '<p>' + d[i].temperature + '&deg;</p></div><p style="font-size:15px">' + d[i].detailedForecast + '</p></div>';
                }

                get('#modal .updated').style.textAlign = 'left';
                get('#modal .updated').innerHTML = 'Forecast updated ' + timeAgo(json.forecast.hourly.updated) + ' from NWS ' + json.forecast.wfo;
                get('#modal svg').insertAdjacentHTML('afterend', '<div class="hrly">' + content + '</div><div class="daily">' + content2 + '</div>');
                get('#modal svg').remove();
            }
        }
    }

    rwis(cams = []) {
        let pvt = '',
            rows = '',
            wc = '',
            thetype = typeof this.json.station,
            geo = [0, 0],
            station,
            surface,
            weather,
            cameras = '';

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

        rwis.forEach((e) => {
            if (e.properties.station.id == station.id) {
                geo = e.geometry.coordinates;
            }
        });

        /* process nearby webcams */
        if (cams.length > 0) {
            let camlinks = '';

            cams.forEach((c) => {
                const thecam = c.properties.cameras;

                for (let i = 0; i < thecam.length; i++) {
                    camlinks += '<a href="#" class="rwisCam" data-id="' + thecam[i].id + '" onclick="return false">' + thecam[i].name + '</a><br>';
                }
            });

            cameras = camlinks.slice(0, -4);
        }

        if (surface.pavement.length != 0) {
            pvt = Math.round(surface.pavement[0]) + '&deg;F';

            if (surface.pavement[1]) {
                pvt += '/' + Math.round(surface.pavement[1]) + '&deg;F';
            }
        }

        if (weather.wind.rawdir != 'null') {
            var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + weather.wind.dir + '" style="transform:rotate(' + weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
        }

        if (weather.temp && weather.wind.speed != 'null' && weather.temp <= 50 && weather.wind.speed >= 3) {
            wc = '<div class="line"><div class="de">Feels Like</div><span>' + windChill(weather.temp, weather.wind.speed) + '&deg;F</span></div>';
        }

        rows += '<div class="line"><div class="de">Temperature</div><span style="color:var(--blue);font-weight:600;font-size:20px;line-height:1">' + Math.round(weather.temp) + '&deg;F</span></div>';
        rows += (wc != '' ? wc : '');
        /*rows += (weather.td != 'null' ? '<div class="line"><div class="de">Dew point</div><span>' + Math.round(weather.td) + '&deg;F</span></div>' : '');*/
        rows += (surface.pavement[0] ? '<div class="line"><div class="de">Pavement Temperature</div><span>' + pvt + '</span></div>' : '');
        rows += (surface.grip != 'null' ? '<div class="line"><div class="de">Surface Friction</div><span><a href="#" onclick="grip(\'' + surface.grip + '\');return false">' + Math.round(surface.grip * 100) + '%</a></span></div>' : '');
        rows += (weather.visibility != 'null' ? '<div class="line"><div class="de">Visibility</div><span>' + weather.visibility.toFixed(2) + ' miles</span></div>' : '');
        rows += (weather.wind.dir != 'null' ? '<div class="line"><div class="de">Wind Direction</div><span title="' + weather.wind.dir + '">' + wi + weather.wind.dir + '</span></div>' : '');
        rows += (weather.wind.dir != 'null' && weather.wind.speed != 'null' ? '<div class="line"><div class="de">Wind Speed</div><span>' + Math.round(weather.wind.speed) + ' mph</span></div>' : '');
        rows += (weather.wind.dir != 'null' && weather.wind.gust != 'null' ? '<div class="line"><div class="de">Wind Gust</div><span>' + Math.round(weather.wind.gust) + ' mph</span></div>' : '');

        if (cameras) {
            rows += '<div><span class="de" style="display:block">Nearby Cameras</span>' + cameras + '</div>';
        }

        rows += '<a href="#" class="btn" id="getwxf" data-stn="' + station.id + '" data-lat="' + geo[1] + '" data-lon="' + geo[0] + '" onclick="return false" style="margin-top:1em"><i class="far fa-snowflake"></i>Get weather forecast</a><small>This data is automatically reported from a network of Road Weather Information Systems (RWIS).</small>';

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = roadName(station.name) + genFav('rwis', station.id, station.name);
        get('#modal .updated').innerHTML = 'Last report ' + timeAgo(this.json.updated);
        get('#modal .rows').innerHTML = rows;

        if ((new Date().getTime() / 1000) - this.json.updated > (60 * 60 * 24 * 2)) {
            get('#modal .updated').insertAdjacentHTML('beforebegin', '<p class="chreq">Station is likely offline and data is expired</p>');
        }

        modal.style.display = 'flex';
        this.updateURI('rwis', station.id, 'Current Weather: ' + station.name);

        /*let data = this.json.json,
            pvt = '',
            rows = '',
            wc = '',
            geo;

        /*rwis.getLayers().forEach((e) => {
            if (e.feature.properties.station.id == data.station.id) {
                geo = e.feature.geometry.coordinates;
            }
        });*//*

        if (data.surface.pavement.length != 0) {
            pvt = Math.round(data.surface.pavement[0]) + '&deg;F';

            if (data.surface.pavement[1]) {
                pvt += '/' + Math.round(data.surface.pavement[1]) + '&deg;F';
            }
        }

        if (data.weather.wind.rawdir != 'null') {
            var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + data.weather.wind.dir + '" style="transform:rotate(' + data.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
        }

        if (data.weather.temp && data.weather.wind.speed != 'null' && data.weather.temp <= 50 && data.weather.wind.speed >= 3) {
            wc = '<div class="line"><div class="de">Feels Like</div><span>' + windChill(data.weather.temp, data.weather.wind.speed) + '&deg;F</span></div>';
        }

        rows += '<div class="line"><div class="de">Temperature</div><span>' + Math.round(data.weather.temp) + '&deg;F</span></div>';
        rows += (wc != '' ? wc : '');
        /*rows += (data.weather.td != 'null' ? '<div class="line"><div class="de">Dew point</div><span>' + Math.round(data.weather.td) + '&deg;F</span></div>' : '');*//*
        rows += (data.surface.pavement[0] ? '<div class="line"><div class="de">Pavement Temperature</div><span>' + pvt + '</span></div>' : '');
        rows += (data.surface.grip != 'null' ? '<div class="line"><div class="de">Surface Friction</div><span><a href="#" onclick="grip(\'' + data.surface.grip + '\');return false">' + Math.round(data.surface.grip * 100) + '%</a></span></div>' : '');
        rows += (data.weather.visibility != 'null' ? '<div class="line"><div class="de">Visibility</div><span>' + data.weather.visibility.toFixed(2) + ' miles</span></div>' : '');
        rows += (data.weather.wind.dir != 'null' ? '<div class="line"><div class="de">Wind Direction</div><span title="' + data.weather.wind.dir + '">' + wi + data.weather.wind.dir + '</span></div>' : '');
        rows += (data.weather.wind.dir != 'null' && data.weather.wind.speed != 'null' ? '<div class="line"><div class="de">Wind Speed</div><span>' + Math.round(data.weather.wind.speed) + ' mph</span></div>' : '');
        rows += (data.weather.wind.dir != 'null' && data.weather.wind.gust != 'null' ? '<div class="line"><div class="de">Wind Gust</div><span>' + Math.round(data.weather.wind.gust) + ' mph</span></div>' : '');
        rows += '<a href="#" class="btn" id="getwxf" data-lat="' + geo[1] + '" data-lon="' + geo[0] + '" onclick="return false" style="margin-top:1em"><i class="far fa-snowflake"></i>Get weather forecast</a><small>This data is automatically reported from a network of Road Weather Information Systems (RWIS).</small>';

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = roadName(data.station.name) + genFav('rwis', data.station.id, data.station.name);
        get('#modal .updated').innerHTML = 'Last report ' + timeAgo(data.updated);
        get('#modal .rows').innerHTML = rows;

        if ((new Date().getTime() / 1000) - data.updated > (60 * 60 * 24 * 2)) {
            get('#modal .updated').insertAdjacentHTML('beforebegin', '<p class="chreq">Station is likely offline and data is expired</p>');
        }

        modal.style.display = 'flex';*/
    }

    incident() {
        let data = this.json,
            ty,
            col,
            files = '',
            affected = '',
            thetype = typeof data.location,
            dataLoc,
            lanes,
            comments,
            filesObj;

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

        if (data.type == 'Crash') {
            ty = 'triangle-exclamation';
            col = '#e65100';
        } else if (data.type == 'Closure') {
            ty = 'do-not-enter';
            col = '#dc3545';
        } else {
            ty = 'diamond-exclamation';
            col = '#fcc733';
        }

        if (lanes != null) {
            for (let i = 0; i < lanes.length; i++) {
                var aff = lanes[i].lane;
                var affDir = lanes[i].direction;

                affected += aff + ' (' + affDir + ')<br>';
            }
        }

        if (comments && comments.link) {
            files = '<span><a target="blank" href="' + comments.desc + '">Additional Information</a></span>';
        }

        if (filesObj) {
            filesObj.forEach((l) => {
                files += '<span><a target="blank" href="' + l.url + '">' + l['file-description'] + '</a></span>';
            });
        }

        var h = '<div class="boxes"><div class="ea"><span>Road</span><p>' + dataLoc.hwy + '</p></div>' +
            '<div class="ea"><span>Milepost</span><p>' + dataLoc.milepost.start + (dataLoc.milepost.end ? '-' + dataLoc.milepost.end : '') + '</p></div>' +
            (dataLoc.direction ? '<div class="ea"><span>Direction</span><p>' + dataLoc.direction + '</p></div>' : '') + '</div>' +
            '<p style="color:var(--blue-gray)">' + data.desc + '</p>' + (comments && !comments.link ? '<p style="color:var(--blue-gray)">' + comments.desc + '</p>' : '') + '<div class="rows">' +
            (filesObj || (comments && comments.link) ? '<div class="line m"><div class="de" style="font-size:13px">Links</div>' + files + '</div>' : '') +
            '<div class="line m"><div class="de" style="font-size:13px">Delays</div><span>' + data.impact + '</span></div></div>' +
            '<div class="line m" style="margin-top:0.5em"><div class="de" style="font-size:13px">Lanes Affected</div><span>' + (lanes == null ? 'None' : affected) + '</span></div></div>' +
            '<a href="#" class="btn dark" style="margin-top:1em" onclick="findIncident(\'' + data.id + '\');return false">Zoom in</a><span class="bottom">Incident #' + data.id + ' &middot; ' + dataLoc.name + ' (#' + dataLoc.id + ')</span>';

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = '<i class="fa-solid fa-' + ty + '" style="color:' + col + ';margin-right:0.75em"></i>' + data.type;
        get('#modal .updated').style.textAlign = 'left';
        get('#modal .updated').innerHTML = 'Updated ' + timeAgo(data.updated) + ' &middot; Reported ' + timeAgo(data.created);
        get('#modal .rows').insertAdjacentHTML('afterend', h);
        get('#modal .rows').remove();

        modal.style.display = 'flex';
        this.updateURI('incident', data.id, data.type + ' @ ' + dataLoc.hwy + ' MP ' + dataLoc.milepost.start + (dataLoc.milepost.end ? '-' + dataLoc.milepost.end : '') + (dataLoc.direction ? ' ' + dataLoc.direction : ''));
    }

    webcam(geo = null) {
        let where = '',
            firstID,
            firstName;

        if (geo != null) {
            const theCity = [],
                theDist = [],
                theBear = [];

            cities.list.forEach((c) => {
                const dist = distance(c.lat, c.lon, geo[1], geo[0]);
                const bear = getBearing(c.lat, c.lon, geo[1], geo[0]);
                theCity.push(c.city);
                theDist.push(dist);
                theBear.push(bear);
            });

            const min = Math.min.apply(null, theDist);
            where = min.toFixed(1) + ' miles ' + theBear[theDist.indexOf(min)] + ' of ' + theCity[theDist.indexOf(min)];
        }

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = 'Travel Cameras';

        this.json.forEach((camera, i) => {
            if (!firstID) {
                firstID = camera.id;
                firstName = camera.name;
            }

            get('#modal .rows').insertAdjacentHTML('afterend', '<h2 class="wc"' + (this.json.length > 0 && i != this.json.length - 1 ? ' style="margin-top:1em"' : '') + '><span>' + camera.name + '</span>' + genFav('cameras', camera.id, camera.name) + '</h2>' +
                '<img loading="lazy" src="' + atob(camera.url) + '?' + new Date().getTime() + '" alt="' +
                camera.name + '" title="' + camera.name + '" class="webcam">' +
                '<span class="bottom" style="margin-bottom:1em">' + (where != '' ? where + ' &middot; ' : '') + camera.county + ' County &middot; Provided by ODOT</span>'
            );
        });

        get('#modal .rows').remove();
        modal.style.display = 'flex';
        this.updateURI('camera', firstID, firstName);

        /*modal.innerHTML = this.ht;

        get('#modal h1').innerHTML = this.json.name + genFav('cameras', this.json.id, this.json.name);
        get('#modal .rows').insertAdjacentHTML('afterend', '<div class="cam_wrapper"></div>');
        get('#modal .rows').insertAdjacentHTML('afterend', '<img loading="lazy" src="' + atob(this.json.url) + '?' + new Date().getTime() + '" alt="' + this.json.name + '" title="' + this.json.name + '" class="webcam"><span class="bottom">' + this.json.county + ' County &middot; Provided by ODOT</span>');
        get('#modal .rows').remove();

        modal.style.display = 'flex';*/
    }
}

class RoadNetwork {
    constructor(lat = null, lon = null, road = null) {
        this.lat = lat;
        this.lon = lon;
        this.road = road;
    }

    mileposts(json) {
        let results = [];
        json.features.forEach((e) => {
            const name = e.properties.HWYNAME,
                id = e.properties.HWYNUMB,
                mp = e.properties.MP_DISP.split('.')[0],
                lat = e.geometry.coordinates[1],
                lon = e.geometry.coordinates[0];

            results.push({ id, name, mp, lat, lon });
        });

        results.sort((a, b) => {
            return a.id - b.id || parseFloat(a.mp) - parseFloat(b.mp);
        });

        roadNetwork = results;
    }

    getRange(report, rn) {
        let i = 0,
            mps = [],
            arr = [],
            name = '';

        roadNetwork.forEach((e) => {
            if (this.road == e.id && name == '') {
                name = e.name;
            }
        });

        roadNetwork.forEach((rn) => {
            const dist = distance(this.lat, this.lon, rn.lat, rn.lon);

            if (rn.name == name && dist <= ROAD_RANGE_DIST / 2) {
                arr.push(rn);
                mps.push(rn.mp);
                i++;
            }
        });

        if (mps.length > 0) {
            const mp1 = arr.find((f) => {
                return f.mp == Math.min.apply(null, mps).toString();
            });

            const mp2 = arr.find((f) => {
                return f.mp == Math.max.apply(null, mps).toString();
            });

            this.listFeatures(mp1, mp2, report);
            return mp1.mp + '-' + mp2.mp;
        } else {
            return '';
        }
    }

    listFeatures(a, b, report) {
        const minlat = b.lat,
            minlon = a.lon,
            maxlat = a.lat,
            maxlon = b.lon,
            arr = [rwis, webcams, incidents];

        let features = {
            'meta': {
                'hwy': roadName(report[0].hwy),
                'start': a.mp,
                'end': b.mp
            },
            'rw': report,
            'rwis': [],
            'webcams': [],
            'incidents': [],
            'construction': []
        };

        const incsIDs = [],
            incs = [];

        arr.forEach((p, n) => {
            p.forEach((f) => {
                if (n == 2) {
                    const isBetween = (num, min, max) => {
                        if (min > max) {
                            const temp = min;
                            min = max;
                            max = temp;
                        }

                        return num >= min && num <= max;
                    },
                        start = a.mp < b.mp ? a.mp : b.mp,
                        end = a.mp > b.mp ? a.mp : b.mp;

                    if (f.geometry.type == 'Point') {
                        if (!incsIDs.includes(f.properties.id)) {
                            if (f.properties.location.hwy == features.meta.hwy && (isBetween(f.properties.location.milepost.start, start, end) ||
                                (f.properties.location.milepost.end && isBetween(f.properties.location.milepost.end, start, end)))) {
                                incsIDs.push(f.properties.id);
                                incs.push(f.properties);
                            }
                        }

                        /*if ((f.geometry.coordinates[1] >= minlat && f.geometry.coordinates[1] <= maxlat) &&
                            (f.geometry.coordinates[0] >= minlon && f.geometry.coordinates[0] <= maxlon)) {

                            features.incidents.push(f.properties);
                        }*/
                    } else {
                        for (let i = start; i <= end; i++) {
                            if (!incsIDs.includes(f.properties.id)) {
                                if (isBetween(i, f.properties.location.milepost.start, f.properties.location.milepost.end)) {

                                    incsIDs.push(f.properties.id);
                                    incs.push(f.properties);
                                }
                            }
                        }
                    }
                } else {
                    if ((f.geometry.coordinates[1] >= minlat && f.geometry.coordinates[1] <= maxlat) &&
                        (f.geometry.coordinates[0] >= minlon && f.geometry.coordinates[0] <= maxlon)) {

                        if (n == 0) {
                            features.rwis.push(f);
                        } else {
                            features.webcams.push(f);
                        }
                    }
                }
            });
        });

        /* push additional incidents */
        if (incs.length > 0) {
            incs.forEach((e) => {
                features.incidents.push(e);
            });
        }

        this.displayFeatures(features);
    }

    displayFeatures(report) {
        let modal = get('#modal'),
            a = '',
            b = '',
            c = '',
            d = '';

        modal.innerHTML = reportTemplate;
        modal.querySelector('.tab-content').scrollTo({ top: 0, behavior: 'smooth' });
        modal.querySelector('h1').innerHTML = 'Report for ' + report.meta.hwy + ' from MP ' + report.meta.start + '-' + report.meta.end;

        /* add webcams */
        report.webcams.forEach((w, i) => {
            w.properties.cameras.forEach((cam, x) => {
                a += '<h2 class="wc"><span>' + cam.name + '</span>' + genFav('cameras', cam.id, cam.name) + '</h2>' +
                    '<img loading="lazy" src="' + atob(cam.url) + '?' + new Date().getTime() + '" alt="' +
                    cam.name + '" title="' + cam.name + '" class="webcam">' +
                    '<span class="bottom" style="margin-bottom:1em">' + cam.county + ' County &middot; Provided by ODOT</span>' +
                    (report.webcams.length - 1 == i && w.properties.cameras.length - 1 == x ? '' : '<hr>');
            });
            /*a += '<h2 style="align-items:center">' + w.properties.name + genFav('cameras', w.properties.id, w.properties.name) + '</h2>' +
                '<img loading="lazy" src="' + atob(w.properties.url) + '?' + new Date().getTime() + '" alt="' + w.properties.name + '" title="' + w.properties.name + '" class="webcam">' +
                '<span class="bottom">' + w.properties.county + ' County &middot; Provided by ' + w.properties.network + '</span>' +
                (i < report.webcams.length - 1 ? '<hr>' : '');*/
        });

        /* add rwis */
        report.rwis.forEach((r, i) => {
            let pvt,
                geo = r.geometry.coordinates;

            if (r.properties.surface.pavement.length != 0) {
                pvt = Math.round(r.properties.surface.pavement[0]) + '&deg;F';

                if (r.properties.surface.pavement[1]) {
                    pvt += '/' + Math.round(r.properties.surface.pavement[1]) + '&deg;F';
                }
            }

            if (r.properties.weather.wind.rawdir != 'null') {
                var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + r.properties.weather.wind.dir + '" style="transform:rotate(' + r.properties.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
            }

            b += '<h2 style="width:100%;justify-content:space-between;align-items:center">' + roadName(r.properties.station.name) + genFav('rwis', r.properties.station.id, r.properties.station.name) + '</h2><span class="updated">Last report ' + timeAgo(r.properties.updated) + '</span><div class="rows">' +
                '<div class="line"><div class="de">Temperature</div><span>' + Math.round(r.properties.weather.temp) + '&deg;F</span></div>' +
                (r.properties.weather.td != 'null' ? '<div class="line"><div class="de">Dew point</div><span>' + Math.round(r.properties.weather.td) + '&deg;F</span></div>' : '') +
                (r.properties.surface.pavement[0] ? '<div class="line"><div class="de">Pavement Temperature</div><span>' + pvt + '</span></div>' : '') +
                (r.properties.surface.grip != 'null' ? '<div class="line"><div class="de">Surface Friction</div><span><a href="#" onclick="grip(\'' + r.properties.surface.grip + '\');return false">' + Math.round(r.properties.surface.grip * 100) + '%</a></span></div>' : '') +
                (r.properties.weather.visibility != 'null' ? '<div class="line"><div class="de">Visibility</div><span>' + r.properties.weather.visibility.toFixed(2) + ' miles</span></div>' : '') +
                (r.properties.weather.wind.dir != 'null' ? '<div class="line"><div class="de">Wind Direction</div><span>' + wi + r.properties.weather.wind.dir + '</span></div>' : '') +
                (r.properties.weather.wind.dir != 'null' && r.properties.weather.wind.speed != 'null' ? '<div class="line"><div class="de">Wind Speed</div><span>' + Math.round(r.properties.weather.wind.speed) + ' mph</span></div>' : '') +
                (r.properties.weather.wind.dir != 'null' && r.properties.weather.wind.gust != 'null' ? '<div class="line"><div class="de">Wind Gust</div><span>' + Math.round(r.properties.weather.wind.gust) + ' mph</span></div>' : '') +
                '<a href="#" class="btn" id="getwxf" data-lat="' + geo[1] + '" data-lon="' + geo[0] + '" onclick="return false" style="margin-top:1em"><i class="far fa-snowflake"></i>Get weather forecast</a><small>This data is automatically reported from a network of Road Weather Information Systems (RWIS).</small>' +
                '</div>' + (i < report.rwis.length - 1 ? '<hr>' : '');
        });

        /* add road reports */
        report.rw.forEach((r, i) => {
            if (r.road) {
                c += '<h2 style="width:100%;justify-content:space-between;align-items:center">' + r.name + ' (' + roadName(r.hwy) + ')' + genFav('roadReports', r.name, r.name) + '</h2>' +
                    (r.restrict.chains.cond != 0 && r.restrict.chains.cond != 'A' ? '<p class="chreq">Chain restrictions are in place</p>' : '') +
                    '<span class="updated">Last report ' + timeAgo(r.updated) + '</span><div class="rows"><div class="line"><div class="de">Temperature</div><span>' + r.temp + '&deg;F</span></div>' +
                    '<div class="line"><div class="de">Road Conditions</div><span' + (r.road.id == 3 ? ' class="bi"' : '') + '>' + r.road.condition + '</span></div>' +
                    '<div class="line"><div class="de">Weather</div><span>' + r.weather + '</span></div>' +
                    '<div class="line"><div class="de">New Snow</div><span>' + (r.snow.new == 'Trace' ? 'Trace' : r.snow.new + ' in') + '</span></div>' +
                    '<div class="line"><div class="de">Roadside Snow</div><span>' + (r.snow.roadside == 'Trace' ? 'Trace' : r.snow.roadside + ' in') + '</span></div>' +
                    (r.notes ? '<div class="line m"><div class="de">Comments</div><span>' + r.notes + '</span></div>' : '') +
                    (r.restrict.cmv.restrict ? '<div class="line m"><div class="de">Commerical Vehicle Restrictions</div><span>' + r.restrict.cmv.restrict + '</span></div>' : '') +
                    (r.restrict.chains.cond != 0 ? '<div class="sz"><h3>Snow Zone</h3><p>' + r.restrict.chains.desc + '</p></div>' : '') +
                    '<small>This data is reported by ODOT maintenance crews five times per day and at other times when conditions change significantly.</small></div>' +
                    (i < report.rw.length - 1 ? '<hr>' : '');
            }
        });

        /* add incidents */
        report.incidents.forEach((data, i) => {
            let ty,
                col,
                files = '',
                affected = '';

            if (data.type == 'Crash') {
                ty = 'triangle-exclamation';
                col = '#e65100';
            } else if (data.type == 'Closure') {
                ty = 'do-not-enter';
                col = '#dc3545';
            } else {
                ty = 'diamond-exclamation';
                col = '#fcc733';
            }

            if (data.lanes != null) {
                for (let i = 0; i < data.lanes.length; i++) {
                    var aff = data.lanes[i].lane;
                    var affDir = data.lanes[i].direction;

                    affected += aff + ' (' + affDir + ')<br>';
                }
            }

            if (data.comments && data.comments.link) {
                files = '<span><a target="blank" href="' + data.comments.desc + '">Additional Information</a></span>';
            }

            if (data.files) {
                data.files.forEach((l) => {
                    files += '<span><a target="blank" href="' + l.url + '">' + l['file-description'] + '</a></span>';
                });
            }

            d += '<h2 style="align-items:center"><i class="fas fa-' + ty + '" style="color:' + col + ';margin-right:0.75em"></i>' + data.type + '</h2>' +
                '<div class="boxes"><div class="ea"><span>Road</span><p>' + data.location.hwy + '</p></div>' +
                '<div class="ea"><span>Milepost</span><p>' + data.location.milepost.start + (data.location.milepost.end ? '-' + data.location.milepost.end : '') + '</p></div>' +
                (data.location.direction ? '<div class="ea"><span>Direction</span><p>' + data.location.direction + '</p></div>' : '') + '</div>' +
                '<p style="color:var(--blue-gray)">' + data.desc + '</p>' + (data.comments && !data.comments.link ? '<p style="color:var(--blue-gray)">' + data.comments.desc + '</p>' : '') + '<div class="rows">' +
                (data.files || (data.comments && data.comments.link) ? '<div class="line m"><div class="de" style="font-size:13px">Links</div>' + files + '</div>' : '') +
                '<div class="line m"><div class="de" style="font-size:13px">Delays</div><span>' + data.impact + '</span></div></div>' +
                '<div class="line m" style="margin-top:0.5em"><div class="de" style="font-size:13px">Lanes Affected</div><span>' + (data.lanes == null ? 'None' : affected) + '</span></div></div>' +
                '<a href="#" class="btn dark" style="margin:1em auto 0;display:block" onclick="findIncident(\'' + data.id + '\');return false">Zoom in</a><span class="bottom">Incident #' + data.id + ' &middot; ' + data.location.name + ' (#' + data.location.id + ')</span>' +
                (i < report.incidents.length - 1 ? '<hr>' : '');
        });

        modal.querySelector('.content[data-tab=cams]').innerHTML = (a ? a : 'There are no road cameras in this area.');
        modal.querySelector('.content[data-tab=wx]').innerHTML = (b ? b : 'There are no RWIS in this area.');
        modal.querySelector('.content[data-tab=rw]').innerHTML = (c != '' ? c : 'There are no road reports for this area.');
        modal.querySelector('.content[data-tab=incs]').innerHTML = (d ? d : 'There are no incidents reported in this area.');

        modal.classList.add('full');
        modal.style.display = 'flex';
    }
}

class Data {
    constructor() {
        this.cluster = {
            maxZoom: 10,
            minPoints: 3,
            radius: 25
        };
    }

    init() {
        this.getHighways();
    }

    doLayers() {
        this.getWWAs();
        this.getRoads().then(() => {
            this.getRW();
            this.getIncidents().then(() => {
                this.getWebcams();
                this.getRWIS();
                this.getDMS();
                this.getConstruction();

                hideLoading();
            });
        });
    }

    defaultLayer(name) {
        let resp = '';

        JSON.parse(localStorage.getItem('layers')).forEach((e) => {
            if (e.layer == name) {
                resp = e.show ? 'visible' : 'none';
            }
        });

        return resp;
    }

    async getHighways() {
        if (localStorage.getItem('road_network') == null) {
            //const resp = await fetch('https://api.mapbox.com/datasets/v1/mapollc/clqe6a9gn145e1mk7fhq1ohoy/features?access_token=pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw&start=' + start);
            const resp = await fetch('https://apps.mapotechnology.com/src/oreroads/geojson/v' + version + '/mileposts.geojson');

            if (resp.ok) {
                const json = await resp.json();
                localStorage.setItem('road_network', JSON.stringify(json));

                new RoadNetwork().mileposts(json);
            }
        } else {
            const json = localStorage.getItem('road_network');
            new RoadNetwork().mileposts(JSON.parse(json));
        }
    }

    async getWWAs() {
        progress('Getting weather alerts...');
        const json = await api(apiURL + 'wwas/oreroads');

        if (json) {
            if (json.wwas != null && json.wwas.length > 0) {
                nwsAlerts = json.wwas;
            }
        }
    }

    compileReports(name) {
        let report = [],
            tf = name.toLowerCase(),
            s = counterpart(tf);

        rw.forEach((ea) => {
            if (ea.name.toLowerCase() == tf) {
                report.push(ea);
            }
        });

        if (s != '') {
            rw.forEach((ea) => {
                if (ea.name == s) {
                    report.push(ea);
                }
            });
        }

        return report;
    }

    roadClick(n, e) {
        const road = map.queryRenderedFeatures(e.point, {
            layers: ['roads_' + n]
        });

        if (road.length > 0) {
            const report = this.compileReports(road[0].properties.name);

            if (report.length == 0) {
                new Modal(report, true).roadReport(road[0].properties.name);
            } else {
                const range = new RoadNetwork(
                    e.lngLat.lat,
                    e.lngLat.lng,
                    (report.length > 0 && report[0].hwyID ? report[0].hwyID.toString() : road[0].properties.hwy)
                ).getRange(
                    report,
                    road[0].properties.name,
                    true
                );

                const uqid = {
                    lat: e.lngLat.lat,
                    lon: e.lngLat.lng,
                    hwy: (report.length > 0 && report[0].hwyID ? report[0].hwyID.toString() : road[0].properties.hwy),
                    name: road[0].properties.name
                };

                new Modal(null, true).updateURI('road-segment', btoa(JSON.stringify(uqid)), 'Road Report for ' + roadName(road[0].properties.hwy) + ' from MP ' + range);
                //new Modal(null, true).updateURI('road-report', report[0].id, 'Road Report for ' + road[0].properties.name);
            }
        }
    }

    findRoad(roadName) {
        let pos = null;

        roads.features.forEach((road, i) => {
            if (road.properties.name.toLowerCase() == roadName) {
                pos = i;
            }
        });

        return pos;
    }

    async getRW() {
        progress('Getting road conditions...');
        const rpt = await api(apiURL + 'roads');

        if (!rpt || rpt.rw == null) {
            console.error('There was an error getting current road conditions.');
        } else {
            rpt.rw.forEach((feature) => {
                const pos = this.findRoad(feature.name.toLowerCase());

                rw.push(feature);
                if (pos != null) {
                    roads.features[pos].properties = feature;
                }
            });

            map.getSource('roads').setData(roads);

            console.info(rpt.rw.length + ' road & weather stations reporting');
            rwRetrieved = true;
        }
    }

    async getRoads() {
        progress('Loading highway network...');

        await fetch('https://api.mapbox.com/datasets/v1/mapollc/clofxe8el0lxy2arnbd8ltiz4/features?access_token=' + mapboxToken).then(async (data) => {
            const json = await data.json();

            if (json) {
                roads = json;

                /* loop through features to add names to an array */
                json.features.forEach((f) => {
                    roadsArray.push(f);
                    roadsIDArray.push(f.properties.id);
                });

                if (!map.getSource('roads')) {
                    map.addSource('roads', {
                        type: 'geojson',
                        data: json
                    });
                }

                if (!map.getLayer('roads_path')) {
                    const defColor = '#bdbdbd',
                        roadColor = [
                            'case',
                            ['has', 'road'],
                            [
                                'case',
                                ['==', ['to-number', ['get', 'id', ['get', 'road', ['properties']]]], 1], '#000',
                                ['==', ['to-number', ['get', 'id', ['get', 'road', ['properties']]]], 2], '#2196f3',
                                ['==', ['to-number', ['get', 'id', ['get', 'road', ['properties']]]], 3], '#ff9800',
                                ['==', ['to-number', ['get', 'id', ['get', 'road', ['properties']]]], 4], '#827717',
                                ['==', ['to-number', ['get', 'id', ['get', 'road', ['properties']]]], 5], '#7e57c2',
                                ['==', ['to-number', ['get', 'id', ['get', 'road', ['properties']]]], 6], '#d32f2f',
                                defColor
                            ],
                            defColor
                        ];

                    map.addLayer({
                        id: 'roads_path',
                        type: 'line',
                        source: 'roads',
                        paint: {
                            'line-color': roadColor,
                            'line-width': 6
                        },
                        filter: ['==', '$type', 'LineString'],
                        layout: {
                            visibility: this.defaultLayer('roads')
                        }
                    }).on('mouseenter', 'roads_path', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'roads_path', () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'roads_path', (e) => {
                        this.roadClick('path', e);
                    }).addLayer({
                        id: 'roads_point',
                        type: 'circle',
                        source: 'roads',
                        paint: {
                            'circle-color': roadColor,
                            'circle-radius': 8
                        },
                        filter: ['==', '$type', 'Point'],
                        layout: {
                            visibility: this.defaultLayer('roads')
                        }
                    }).on('mouseenter', 'roads_point', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'roads_point', () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'roads_point', (e) => {
                        this.roadClick('point', e);
                    }).addLayer({
                        id: 'roads_text',
                        type: 'symbol',
                        source: 'roads',
                        paint: {
                            'text-color': '#fff',
                            'text-opacity': {
                                stops: [[13, 0], [14, 1]]
                            },
                            'text-halo-color': '#333',
                            'text-halo-width': 1,
                            'text-halo-blur': 2
                        },
                        filter: ['!=', '$type', 'Point'],
                        layout: {
                            'symbol-placement': 'line',
                            'symbol-spacing': 400,
                            'text-font': ['DIN Pro Medium'],
                            'text-field': ['get', 'name'],
                            'text-justify': 'center',
                            'text-size': 14,
                            'text-allow-overlap': false,
                            visibility: this.defaultLayer('roads')
                        }
                    });
                }
            }
        });
    }

    webcamClick(e) {
        const allCams = [],
            cams = map.queryRenderedFeatures(e.point, {
                layers: ['webcams', 'webcams_count', 'webcams_cluster']
            });

        if (cams.length > 0) {
            /* if the symbol is a cluster, zoom in to expand additional cameras, otherwise show cams */
            if (cams[0].properties && cams[0].properties.cluster) {
                map.flyTo({
                    center: cams[0].geometry.coordinates,
                    zoom: map.getZoom() + 2.5
                });
            } else {
                cams.forEach((feature) => {
                    if (feature.properties && !feature.properties.cluster) {
                        JSON.parse(feature.properties.cameras).forEach((obj) => {
                            allCams.push(obj);
                        });
                    }
                });

                if (allCams.length > 0) {
                    new Modal(allCams, true).webcam(cams[0].geometry.coordinates)
                }

                /*if (!cams[0].properties.cluster) {
                    new Modal(cams[0].properties).webcam();
                }*/
            }
        }
    }

    displayWebcams(json) {
        const groupedFeatures = new Map();
        progress('Getting travel cams...');

        json.features.forEach((feature) => {
            const key = JSON.stringify(feature.geometry.coordinates);

            if (!groupedFeatures.has(key)) {
                groupedFeatures.set(key, {
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: {
                        cameras: []
                    }
                });
            }
            groupedFeatures.get(key).properties.cameras.push(feature.properties);
        });

        json = JSON.parse('{"type":"FeatureCollection","features":' + JSON.stringify(Array.from(groupedFeatures.values())) + '}');
        webcams = json.features;

        if (!map.hasImage('cam')) {
            map.loadImage(host + 'assets/images/oreroads/camera_icon.png', (error, img) => {
                if (error) throw error; map.addImage('cam', img);

                if (!map.hasImage('cluster_cam')) {
                    map.loadImage(host + 'assets/images/oreroads/camera_cluster_icon.png', (error, img) => {
                        if (error) throw error; map.addImage('cluster_cam', img);

                        if (!map.getSource('webcams')) {
                            map.addSource('webcams', {
                                type: 'geojson',
                                data: json,
                                cluster: true,
                                clusterMaxZoom: this.cluster.maxZoom,
                                clusterMinPoints: this.cluster.minPoints,
                                clusterRadius: this.cluster.radius
                            });
                        }

                        if (!map.getLayer('webcams')) {
                            map.addLayer({
                                id: 'webcams',
                                type: 'symbol',
                                source: 'webcams',
                                filter: ['!', ['has', 'point_count']],
                                paint: {
                                    /*'icon-translate': [18, 0]*/
                                },
                                layout: {
                                    'icon-image': 'cam',
                                    'icon-size': 0.5,
                                    'icon-allow-overlap': true,
                                    'symbol-placement': 'point',
                                    visibility: this.defaultLayer('webcams')
                                }
                            }).on('mouseenter', 'webcams', () => {
                                map.getCanvas().style.cursor = 'pointer';
                            }).on('mouseleave', 'webcams', () => {
                                map.getCanvas().style.cursor = 'auto';
                            }).on('click', 'webcams', (e) => {
                                this.webcamClick(e);
                            }).addLayer({
                                id: 'webcams_cluster',
                                type: 'circle',
                                source: 'webcams',
                                filter: ['has', 'point_count'],
                                paint: {
                                    'circle-color': '#944f9f',
                                    'circle-radius': 12,
                                    'circle-stroke-color': '#0a0a0a',
                                    'circle-stroke-width': 5,
                                    'circle-stroke-opacity': 0.1
                                },
                                layout: {
                                    visibility: this.defaultLayer('webcams')
                                }
                            }).on('mouseenter', 'webcams_cluster', () => {
                                map.getCanvas().style.cursor = 'pointer';
                            }).on('mouseleave', 'webcams_cluster', () => {
                                map.getCanvas().style.cursor = 'auto';
                            }).on('click', 'webcams_cluster', (e) => {
                                this.webcamClick(e);
                            }).addLayer({
                                id: 'webcams_count',
                                type: 'symbol',
                                source: 'webcams',
                                filter: ['has', 'point_count'],
                                paint: {
                                    'text-color': '#fff'
                                },
                                layout: {
                                    'text-field': ['get', 'point_count_abbreviated'],
                                    'text-font': ['DIN Pro Medium'],
                                    'text-anchor': 'center',
                                    'text-justify': 'center',
                                    /*'text-offset': [1.2, 0],*/
                                    'text-allow-overlap': true,
                                    'text-size': 14,
                                    visibility: this.defaultLayer('webcams')
                                }
                            }).on('mouseenter', 'webcams_count', () => {
                                map.getCanvas().style.cursor = 'pointer';
                            }).on('mouseleave', 'webcams_count', () => {
                                map.getCanvas().style.cursor = 'auto';
                            }).on('click', 'webcams_count', (e) => {
                                this.webcamClick(e);
                            });
                        }
                        /* add webcams to an array */
                        /*json.features.forEach((cam, i) => {
                            webcams.push(cam);
                        });
                 
                        if (!map.getSource('webcams')) {
                            map.addSource('webcams', {
                                type: 'geojson',
                                data: json,
                                cluster: true,
                                clusterMaxZoom: this.cluster.maxZoom,
                                clusterMinPoints: this.cluster.minPoints,
                                clusterRadius: this.cluster.radius
                            });
                        }
                 
                        if (!map.getLayer('webcams')) {
                            map.addLayer({
                                id: 'webcams',
                                type: 'circle',
                                source: 'webcams',
                                paint: {
                                    'circle-color': '#fff',
                                    'circle-radius': 11,
                                    'circle-stroke-color': '#666',
                                    'circle-stroke-width': 1,
                                    'circle-stroke-opacity': 0.5,
                                    'circle-translate': [12.5, 0]
                                },
                                layout: {
                                    visibility: this.defaultLayer('webcams')
                                }
                            }).on('mouseenter', 'webcams', () => {
                                map.getCanvas().style.cursor = 'pointer';
                            }).on('mouseleave', 'webcams', () => {
                                map.getCanvas().style.cursor = 'auto';
                            }).on('click', 'webcams', (e) => {
                                this.webcamClick(e);
                            }).addLayer({
                                id: 'webcams_icon',
                                type: 'symbol',
                                source: 'webcams',
                                layout: {
                                    'icon-offset': [18.5, 0],
                                    'icon-image': 'cam',
                                    'icon-size': 0.65,
                                    'icon-allow-overlap': true,
                                    'symbol-placement': 'point',
                                    visibility: this.defaultLayer('webcams')
                                }
                            }).on('mouseenter', 'webcams_icon', () => {
                                map.getCanvas().style.cursor = 'pointer';
                            }).on('mouseleave', 'webcams_icon', () => {
                                map.getCanvas().style.cursor = 'auto';
                            }).on('click', 'webcams', (e) => {
                                this.webcamClick(e);
                            });
                        }*/
                    });
                }
            });
        }

        console.info(json.features.length + ' webcams located');
    }

    async getWebcams() {
        if ((localStorage.getItem('webcams') == null || storageIsOld('webcams', 2592000)) || !useLocalStorage) {
            const json = await api(apiURL + 'webcams', [['network', 'ODOT']]);

            if (json) {
                if (useLocalStorage) {
                    localStorage.setItem('webcams', JSON.stringify(json));
                    localStorage.setItem('webcams_time', new Date().getTime());
                }
                this.displayWebcams(json);
            }
        } else {
            this.displayWebcams(JSON.parse(localStorage.getItem('webcams')));
        }

        webcamsRetrieved = true;
    }

    rwisClick(e) {
        const layer = map.queryRenderedFeatures(e.point, {
            layers: ['rwis']
        });

        if (layer.length > 0) {
            if (layer[0].properties && layer[0].properties.cluster) {
                map.flyTo({
                    center: layer[0].geometry.coordinates,
                    zoom: map.getZoom() + 2.5
                });
            } else {
                const cams = [];

                /* get webcams nearby to this RWIS */
                webcams.forEach((cam) => {
                    const dist = distance(layer[0].geometry.coordinates[1], layer[0].geometry.coordinates[0], cam.geometry.coordinates[1], cam.geometry.coordinates[0]);

                    if (dist <= 1) {
                        cams.push(cam);
                    }
                });

                new Modal(layer[0].properties, true).rwis(cams);
            }
        }
    }

    displayRWIS(json) {
        /* add webcams to an array */
        json.features.forEach((stn) => {
            rwis.push(stn)
        });

        if (!map.getSource('rwis')) {
            map.addSource('rwis', {
                type: 'geojson',
                data: json,
                cluster: true,
                clusterMaxZoom: this.cluster.maxZoom,
                clusterMinPoints: this.cluster.minPoints,
                clusterRadius: this.cluster.radius
            });
        }

        if (!map.getLayer('rwis')) {
            map.addLayer({
                id: 'rwis',
                type: 'circle',
                source: 'rwis',
                paint: {
                    'circle-color': [
                        'case',
                        ['has', 'point_count'],
                        '#04564f',
                        '#009688'
                    ]/*'#009688'*/,
                    'circle-radius': /*[
                        'case',
                        ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99], 15,
                        13
                    ]*/14,
                    'circle-stroke-color': '#0a0a0a',
                    'circle-stroke-width': [
                        'case',
                        ['has', 'point_count'],
                        5,
                        1
                    ],
                    'circle-stroke-opacity': 0.1,
                    'circle-translate': [-24, -12]
                },
                layout: {
                    visibility: this.defaultLayer('rwis')
                }
            }).on('mouseenter', 'rwis', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'rwis', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('click', 'rwis', (e) => {
                this.rwisClick(e);
            }).addLayer({
                id: 'rwis_text',
                type: 'symbol',
                source: 'rwis',
                paint: {
                    'text-color': '#fff'
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': ['concat', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], '°'],
                    'text-justify': 'center',
                    'text-size': [
                        'case',
                        ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99],
                        12,
                        14
                    ],
                    'text-offset': [
                        'case',
                        ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99],
                        [-1.98, -1],
                        [-1.7, -.85]
                    ],
                    'text-allow-overlap': true,
                    visibility: this.defaultLayer('rwis')
                }
            }).on('mouseenter', 'rwis_text', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'rwis_text', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('click', 'rwis_text', (e) => {
                this.rwisClick(e);
            }).addLayer({
                id: 'rwis_count',
                type: 'symbol',
                source: 'rwis',
                filter: ['has', 'point_count'],
                paint: {
                    'text-color': '#fff'
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-justify': 'center',
                    'text-size': 14,
                    'text-offset': [-1.7, -0.85],
                    'text-allow-overlap': true,
                    visibility: this.defaultLayer('rwis')
                }
            }).on('mouseenter', 'rwis_count', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'rwis_count', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('click', 'rwis_count', (e) => {
                this.rwisClick(e);
            });
        }

        console.info(json.features.length + ' RWIS stations reporting');
    }

    async getRWIS() {
        progress('Finding weather conditions...');

        if ((localStorage.getItem('rwis') == null || storageIsOld('rwis', 300)) || !useLocalStorage) {
            const json = await api(apiURL + 'roads/rwis');

            if (json) {
                if (useLocalStorage) {
                    localStorage.setItem('rwis', JSON.stringify(json));
                    localStorage.setItem('rwis_time', new Date().getTime());
                }
                this.displayRWIS(json);
            }
        } else {
            this.displayRWIS(JSON.parse(localStorage.getItem('rwis')));
        }

        rwisRetrieved = true;
    }

    displayIncidents(json) {
        const incImgs = ['', '_crash', '_closure'],
            finish = () => {
                /* if the incident is a linestring, we need to add icons for the start and end milepost */
                json.features.forEach((feature) => {
                    incidents.push(feature);

                    if (feature.geometry.type != 'Point') {
                        const start = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: feature.geometry.coordinates[0]
                            },
                            properties: feature.properties
                        }, end = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: feature.geometry.coordinates[feature.geometry.coordinates.length - 1]
                            },
                            properties: feature.properties
                        };

                        json.features.push(start);
                        json.features.push(end);
                    }
                });

                if (!map.getSource('incidents')) {
                    map.addSource('incidents', {
                        type: 'geojson',
                        data: json
                    });
                }

                map.addLayer({
                    id: 'incidents_point',
                    type: 'symbol',
                    source: 'incidents',
                    filter: ['==', '$type', 'Point'],
                    paint: {
                        'icon-halo-color': '#333',
                        'icon-halo-width': 5,
                        'icon-halo-blur': 1
                    },
                    layout: {
                        'icon-image': [
                            'case',
                            ['==', ['get', 'type'], 'Crash'], 'incident_crash',
                            ['==', ['get', 'type'], 'Closure'], 'incident_closure',
                            'incident'
                        ],
                        'icon-size': 0.45,
                        'icon-allow-overlap': true,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('incidents')
                    }
                }).on('mouseenter', 'incidents_point', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'incidents_point', () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', 'incidents_point', (e) => {
                    const inc = map.queryRenderedFeatures(e.point, {
                        layers: ['incidents_point']
                    });

                    if (inc.length > 0) {
                        new Modal(inc[0].properties, true).incident();
                    }
                }).addLayer({
                    id: 'incidents_line_bg',
                    type: 'line',
                    source: 'incidents',
                    filter: ['!=', '$type', 'Point'],
                    paint: {
                        'line-width': 5,
                        'line-color': '#555'
                    },
                    layout: {
                        visibility: this.defaultLayer('incidents')
                    }
                }, 'incidents_point').on('mouseenter', 'incidents_line_bg', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'incidents_line_bg', () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', 'incidents_line_bg', (e) => {
                    const inc = map.queryRenderedFeatures(e.point, {
                        layers: ['incidents_line_bg']
                    });

                    if (inc.length > 0) {
                        new Modal(inc[0].properties, true).incident();
                    }
                }).addLayer({
                    id: 'incidents_line',
                    type: 'line',
                    source: 'incidents',
                    filter: ['!=', '$type', 'Point'],
                    paint: {
                        'line-width': 5,
                        'line-color': '#ff4a4a',
                        'line-dasharray': [3, 3]
                    },
                    layout: {
                        visibility: this.defaultLayer('incidents')
                    }
                }, 'incidents_point').on('mouseenter', 'incidents_line', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'incidents_line', () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', 'incidents_line', (e) => {
                    const inc = map.queryRenderedFeatures(e.point, {
                        layers: ['incidents_line']
                    });

                    if (inc.length > 0) {
                        new Modal(inc[0].properties, true).incident();
                    }
                }).addLayer({
                    id: 'incidents_text',
                    type: 'symbol',
                    source: 'incidents',
                    paint: {
                        'text-color': '#333',
                        'text-opacity': {
                            stops: [[8.4, 0], [8.5, 1]]
                        },
                        'text-halo-color': '#fff',
                        'text-halo-width': 1,
                        'text-halo-blur': 1
                    },
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'symbol-placement': 'point',
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'type'],
                        'text-max-width': 8,
                        'text-justify': 'center',
                        'text-anchor': 'top',
                        'text-offset': [0, 1.05],
                        'text-size': 11,
                        'text-allow-overlap': false,
                        visibility: this.defaultLayer('incidents')
                    }
                });

                console.info(json.features.length + ' incidents reported by ODOT TOCs');
            };

        incImgs.forEach((n, i) => {
            if (!map.hasImage('incident' + n)) {
                map.loadImage(host + 'assets/images/oreroads/incident' + n + '.png', (error, img) => {
                    if (error) throw error;
                    map.addImage('incident' + n, img);

                    if (i == incImgs.length - 1) {
                        finish();
                    }
                });
            }
        });
    }

    async getIncidents() {
        progress('Getting incidents...');

        if ((localStorage.getItem('incidents') == null || storageIsOld('incidents', 300)) || !useLocalStorage) {
            const json = await api(apiURL + 'roads/incidents');

            if (json) {
                if (useLocalStorage) {
                    localStorage.setItem('incidents', JSON.stringify(json));
                    localStorage.setItem('incidents_time', new Date().getTime());
                }
                this.displayIncidents(json);
            }
        } else {
            this.displayIncidents(JSON.parse(localStorage.getItem('incidents')));
        }

        incidentsRetrieved = true;
    }

    displayDMS(json) {
        if (!map.hasImage('dms')) {
            map.loadImage(host + 'assets/images/oreroads/dms_icon.png', (error, img) => {
                if (error) throw error;
                map.addImage('dms', img);

                varMsgSigns = json;

                if (!map.getSource('dms')) {
                    map.addSource('dms', {
                        type: 'geojson',
                        data: json
                    });
                }

                if (!map.getLayer('dms')) {
                    map.addLayer({
                        id: 'dms',
                        type: 'symbol',
                        source: 'dms',
                        paint: {},
                        layout: {
                            'icon-image': 'dms',
                            'icon-size': 0.65,
                            'icon-allow-overlap': false,
                            'symbol-placement': 'point',
                            visibility: this.defaultLayer('vms')
                        }
                    }).on('mouseenter', 'dms', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'dms', () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'dms', (e) => {
                        const dms = map.queryRenderedFeatures(e.point, {
                            layers: ['dms']
                        });

                        if (dms.length > 0) {
                            new Modal(dms[0].properties, true).vms();
                        }
                    });
                }

                console.info(json.features.length + ' active variable message signs');
            });
        }
    }

    async getDMS() {
        if ((localStorage.getItem('dms') == null || storageIsOld('dms', 300)) || !useLocalStorage) {
            const json = await api(apiURL + 'roads/dms');

            if (json) {
                if (useLocalStorage) {
                    localStorage.setItem('dms', JSON.stringify(json));
                    localStorage.setItem('dms_time', new Date().getTime());
                }
                this.displayDMS(json);
            }
        } else {
            this.displayDMS(JSON.parse(localStorage.getItem('dms')));
        }

        dmsRetrieved = true;
    }

    displayConstruction(json) {
        if (!map.hasImage('construction')) {
            map.loadImage(host + 'assets/images/oreroads/roadwork_icon.png', (error, img) => {
                if (error) throw error;
                map.addImage('construction', img);

                roadwork = json;

                if (!map.getSource('roadWork')) {
                    map.addSource('roadWork', {
                        type: 'geojson',
                        data: json
                    });
                }

                if (!map.getLayer('roadWork')) {
                    map.addLayer({
                        id: 'roadWork_point',
                        type: 'symbol',
                        source: 'roadWork',
                        paint: {},
                        filter: ['==', '$type', 'Point'],
                        layout: {
                            'icon-image': 'construction',
                            'icon-size': 0.65,
                            'icon-allow-overlap': false,
                            'symbol-placement': 'point',
                            visibility: this.defaultLayer('construction')
                        }
                    }).on('mouseenter', 'roadWork_point', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'roadWork_point', () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'roadWork_point', (e) => {
                        const inc = map.queryRenderedFeatures(e.point, {
                            layers: ['roadWork_point']
                        });

                        if (inc.length > 0) {
                            new Modal(inc[0].properties, true).incident();
                        }
                    });
                }

                console.info(json.features.length + ' road work & maintenance events found');
            });
        }
    }

    async getConstruction() {
        if ((localStorage.getItem('construction') == null || storageIsOld('construction', 300)) || !useLocalStorage) {
            const json = await api(apiURL + 'roads/incidents/construction');

            if (json) {
                if (useLocalStorage) {
                    localStorage.setItem('construction', JSON.stringify(json));
                    localStorage.setItem('construction_time', new Date().getTime());
                }
                this.displayConstruction(json);
            }
        } else {
            this.displayConstruction(JSON.parse(localStorage.getItem('construction')));
        }

        roadWorkRetrieved = true;
    }

    getTraffic() {
        if (!map.getSource('traffic')) {
            map.addSource('traffic', {
                type: 'raster',
                tiles: [
                    'https://api.mapbox.com/styles/v1/mapollc/cloq47dre005e01r6gnn92v3h/tiles/256/{z}/{x}/{y}@2x?access_token=' + mapboxToken
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('traffic')) {
            map.addLayer({
                id: 'traffic',
                type: 'raster',
                source: 'traffic',
                paint: {},
                layout: {
                    visibility: this.defaultLayer('traffic')
                }
            });
        }
    }
}

function init() {
    if (localStorage.getItem('map_lat') != null) {
        var mc = [localStorage.getItem('map_lon'), localStorage.getItem('map_lat')],
            mz = localStorage.getItem('map_zoom');
    } else {
        var mc = [-120.5542, 44.10337],
            mz = 6;
    }

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: (userBaseMap == null || userBaseMap == 'light' ? basemaps.light : basemaps.dark),
        projection: 'mercator',
        hash: true,
        attributionControl: false,
        collectResourceTiming: true,
        zoom: mz,
        center: mc
    }).on('zoomstart', (e) => {
        moving = true;
    }).on('movestart', (e) => {
        map.getCanvas().style.cursor = 'grabbing';
        moving = true;
    }).on('moveend', (e) => {
        map.getCanvas().style.cursor = 'auto';

        saveLoc();
        moving = false;
    }).on('zoomend', (e) => {
        saveLoc();
        moving = false;
    }).on('load', () => {
        map.touchPitch.disable();
        new Data().init();

        handleURIIntents();

        /*map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
        }).setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1.5
        }).setFog({
            range: [2.5, 5.5],
            'horizon-blend': 1,
            color: '#f4fcff',
            'high-color': '#87c8dd',
            'space-color': '#a2d9f5',
            'star-intensity': 0.5
        });*/
    }).on('style.load', () => {
        const d = '<div class="search">' +
            '<i class="fas fa-search" style="color:#919191"></i><input type="text" id="search" autocomplete="off" placeholder="Find road reports or cities..."></div>' +
            '<div class="search-results"><div id="result" class="none">Searching...</div></div>' +
            '<img class="logo" src="' + host + 'assets/images/oreroads/oreroads_square_logo.png" onclick="window.location.href=window.location.href">' +
            '<div class="radar-controls"><div class="t"><span id="time" style="font-size:14px">--</span><span><i class="fas fa-pause" id="radarPP"></i></span></div>' +
            '<input type="range" id="radarTime" min="0" max="12" value="0" oninput="setRT(this.value)"></div>' +
            '<div class="mitem-wrapper"><div id="layers" class="mitem" title="Layers"><i class="fas fa-layer-group"></i></div>' +
            '<div id="query" class="mitem" title="Search map"><i class="far fa-magnifying-glass"></i></div>' +
            '<div id="table" class="mitem" title="Tabular Listing"><i class="fa-sharp far fa-table"></i></div>' +
            '<div id="areas" class="mitem" title="Zoom Areas"><i class="fas fa-magnifying-glass-plus"></i></div>' +
            '<div id="myfavorites" class="mitem" title="My Favorites"><i class="fas fa-heart"></i></div>' +
            '<div id="user" class="mitem" title="Account"><i class="fas fa-user"></i></div></div>' +
            '<div id="menu"><span id="close"></span></div>' +
            '<div id="modal"></div>';

        get('#map').insertAdjacentHTML('afterend', d);

        let menu = get('#menu');

        /* on user/profile icon click */
        get('#user').addEventListener('click', () => {
            var uri = window.location.pathname + (window.location.hash ? window.location.hash : '');

            if (settings.user != null) {
                document.body.insertAdjacentHTML('beforeend', '<ul id="userMenu"><li class="head"><span>Hi, ' + settings.getFirstName() + '</span></li><li onclick="syncFavorites(true)"><a href="#" onclick="return false">Sync Favorites</a></li><li><a href="' + host + 'account/settings">Account</a></li>' +
                    '<li><a href="' + host + 'logout?next=' + encodeURIComponent(window.location.href + '?loggedOut=1') + '">Logout</a></li><li><a href="#" onclick="createDialog(\'Disclaimer\', disclaimer, false, \'Ok\');get(\'.dialog\').classList.add(\'disclaimer\');get(\'ul#userMenu\').remove();return false">Disclaimer</a></li>' +
                    '<li><a target="blank" href="../about/contact">Contact Us</a></li><li><a href="#" id="aboutDialog" onclick="return false">About</a></li></ul>');
                get('ul#userMenu').style.top = get('#user').parentElement.offsetTop + 'px';
                get('ul#userMenu').style.left = (get('#user').parentElement.offsetLeft - 166) + 'px';
            } else {
                window.location.href = host + 'secure/login?service=apps&prod=oregonroads&next=' + encodeURIComponent(uri);
            }
        });

        /* on layers icon click */
        get('#layers').addEventListener('click', () => {
            if (!menuLoaded) {
                let bm = '<div class="item"><div class="t"><h2>Basemap</h2><div class="radio">' +
                    '<input type="radio" id="light" name="basemap" value="light"' + (userBaseMap == null || userBaseMap == 'light' ? ' checked' : '') + '><label for="light">Light</label></div>' +
                    '<div class="radio"><input type="radio" id="dark" name="basemap" value="dark"' + (userBaseMap == 'dark' ? ' checked' : '') + '><label for="dark">Dark</label></div></div></div>',
                    lm = '<h1>Layers</h1>' + bm,
                    cache = JSON.parse(localStorage.getItem('layers')),
                    isChecked = (name) => {
                        let show;

                        cache.forEach((it) => {
                            if (name == it.layer) {
                                show = it.show;
                            }
                        });

                        return show;
                    };

                layersList.forEach((e) => {
                    const checked = isChecked(e.layer) ? ' checked' : '';

                    lm += '<div class="item"><div class="t"><h2>' + e.name + '</h2><span style="font-size:14px">' + e.desc + '</span></div><div class="s">' +
                        '<label class="switch"><input type="checkbox" id="lo' + e.layer + '" class="toggle" data-layer="' + e.layer + '"' + checked + '><span class="slider"></span></label></div></div>';
                });

                menu.insertAdjacentHTML('beforeend', lm);
                menuLoaded = true;
            }

            if (document.querySelector('#menu').style.display == 'block') {
                menu.style.display = 'none';
            } else {
                menu.style.display = 'block';
            }
        });

        /* on "my favorites" icon click */
        get('#myfavorites').addEventListener('click', () => {
            let modal = get('#modal'),
                rwisCount = rwis.length,
                rwCount = rw.length;

            history.replaceState(null, null, ' ');

            modal.innerHTML = '<span id="close"></span><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="cams">Cameras</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="rwis">Weather</li></ul>' +
                '<div class="tab-content"><div class="content active" data-tab="cams">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="rwis">Loading...</div></div></div>';
            modal.classList.add('full');
            modal.style.display = 'flex';

            webcamTable();
            rwisTable();

            getAll('#modal .tab-content .content[data-tab=rwis] .rwis-card').forEach((e) => {
                if (!isFavorite('rwis', e.getAttribute('data-id'))) {
                    e.remove();
                    rwisCount--;
                }

                if (rwisCount == 0) {
                    get('#modal .tab-content .content[data-tab=rwis]').innerHTML = 'You currently don\'t have any favorite weather stations';
                }
            });

            rwTable();

            getAll('#modal .tab-content .content[data-tab=roads] .inc-card').forEach((e) => {
                if (!isFavorite('roadReports', e.getAttribute('data-id'))) {
                    e.remove();
                    rwCount--;
                }

                if (rwCount == 0) {
                    get('#modal .tab-content .content[data-tab=roads]').innerHTML = 'You currently don\'t have any favorite road reports';
                }
            });
        });

        /* regional areas icon on click */
        get('#areas').addEventListener('click', () => {
            let d = document.createElement('div'),
                items = '';

            metro.list.forEach((i) => {
                const zm = i.zoom - 2 - (window.outerWidth < 475 ? 2 : (window.outerWidth < 600 ? 1 : 0));
                items += '<li><a href="#" onclick="map.flyTo({center: [' + i.center[1] + ',' + i.center[0] + '], zoom: ' + zm + '});' +
                    'get(\'.dialog\').remove();get(\'.backdrop\').style.display=\'none\';return false">' + i.name + '</a></li>';
            });

            d.innerHTML = dialog;
            d.classList.add('dialog');
            document.body.appendChild(d);
            get('.dialog h1').innerHTML = 'Go to an area';
            get('.dialog p').innerHTML = '<ul>' + items + '</ul>';
            get('.dialog #pos').innerHTML = 'Cancel';

            get('.dialog #neg').remove();

            get('.backdrop').style.display = 'block';
        });

        /* tabular listing icon on click */
        get('#table').addEventListener('click', () => {
            const modal = get('#modal');

            history.replaceState(null, null, ' ');

            modal.innerHTML = '<span id="close"></span><div class="wrapper"><ul class="tabs"><li class="tab" data-tab="alerts">Alerts</li><li class="tab active" data-tab="rwis">Weather</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="incs">Incidents</li></ul>' +
                '<div class="tab-content"><div class="content" data-tab="alerts">There are currently no high priority alerts.</div><div class="content active" data-tab="rwis">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>';
            modal.classList.add('full');
            modal.style.display = 'flex';

            rwisTable();
            incsTable();
            rwTable();
        });

        /* open search feature */
        get('#query').addEventListener('click', () => {
            get('.search').style.display = 'flex';
            get('#search').focus();
        });

        hideLoading();
        new Data().doLayers();

        /* whether or not to load up radar animation */
        if (new Data().defaultLayer('radar') != 'none') {
            radarInit();
        }
    }).addControl(new mapboxgl.FullscreenControl({
        container: document.body
    })).addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
    })).addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    })).addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        })
    );

    map.getCanvas().style.cursor = 'auto';
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        let usr,
            //token = ['', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMSIsImlhdCI6MTcyOTExNDI0OSwiZXhwIjoxNzI5NzE5MDQ5LCJob3N0IjoiTW96aWxsYVwvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0XC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWVcLzEyOS4wLjAuMCBTYWZhcmlcLzUzNy4zNiIsImlwIjoiNDcuMjguMzIuMTkwIn0.kL7IxsG0EayvwUpeCpCVERcwb4_ZNdSQVe8eMWtZ4Os'];
            token = (/token=(.*?)(?=;|$)/gm).exec(document.cookie);

        if (token != null) {
            const get = await api(apiURL + 'user/get/oreroads', [['token', token[1]]]);
            if (get) {
                usr = get.user;
            } else {
                usr = null;
            }
        } else {
            usr = null;
        }

        /* create settings class based on user profile and settings */
        settings = new Settings(usr);

        init();
    } else {
        /* save favorites every 5 minutes */
        setInterval(() => {
            syncFavorites();
        }, 1000 * 60 * 5);

        /* refresh the app every 15 minutes */
        setInterval(() => {
            window.location.href = window.location.href;
        }, 1000 * 60 * 15);

        /* log the user's first time on the map */
        if (!localStorage.getItem('firstLoad')) {
            localStorage.setItem('firstLoad', new Date().getTime() / 1000);
        }

        /* show the disclaimer if user hasn't read it before */
        if (!localStorage.getItem('disclaimer')) {
            let t = setInterval(() => {
                if (rw.length > 0) {
                    clearInterval(t);

                    setTimeout(() => {
                        createDialog('Disclaimer', disclaimer, false, 'I agree');
                        get('.dialog').classList.add('disclaimer');
                    }, 1000);
                }
            }, 500);
        }

        /* set default layers for the map for first time user */
        if (localStorage.getItem('layers') == null) {
            const defaultLayers = [];

            layersList.forEach((e) => {
                defaultLayers.push({
                    layer: e.layer,
                    show: e.default
                });
            });

            localStorage.setItem('layers', JSON.stringify(defaultLayers));
        }
    }
};

window.onload = () => {
    /* determine versioning for app */
    if (localStorage.getItem('version') == null || localStorage.getItem('version') != version) {
        console.info('Changing web app versions...');
        localStorage.setItem('version', version);
    }

    if (localStorage.getItem('buildDate') == null || new Date(localStorage.getItem('buildDate')).getTime() < new Date(build).getTime()) {
        localStorage.setItem('buildDate', build);
    }

    if (!useLocalStorage) {
        const ls = ['dms', 'incidents', 'construction', 'webcams', 'rwis'];

        ls.forEach((i) => {
            if (localStorage.getItem(i) != null) {
                localStorage.clear(i);
                localStorage.clear(i + '_time');
            }
        });
    }
};

/* on window resize */
window.addEventListener('resize', (e) => {
    const um = get('ul#userMenu');

    if (isVisible(um)) {
        const u = get('#user').parentElement;
        um.style.top = u.offsetTop + 'px';
        um.style.left = (u.offsetLeft - 166) + 'px';
    }
});

/* on change events */
window.addEventListener('change', (e) => {
    if (e.target.id == 'changeRW') {
        var e = get('#changeRW');
        new Modal(JSON.parse(e.getAttribute('data-json'))).roadReport(e.options[e.selectedIndex].text, e.options[e.selectedIndex].value);
    }

    /* change basemap */
    if (e.target.getAttribute('name') == 'basemap') {
        const bm = e.target.value;

        map.setStyle(bm == 'light' ? basemaps.light : basemaps.dark, {
            diff: false
        });

        localStorage.setItem('basemap', bm);
    }

    /* show OR hide layers */
    if (e.target && e.target.className == 'toggle') {
        const customLayers = [],
            layer = e.target,
            name = layer.getAttribute('data-layer'),
            isChecked = layer.checked ? 'visible' : 'none';

        if (name == 'roads') {
            map.setLayoutProperty('roads_path', 'visibility', isChecked);
            map.setLayoutProperty('roads_point', 'visibility', isChecked);
            map.setLayoutProperty('roads_text', 'visibility', isChecked);
        } else if (name == 'webcams') {
            map.setLayoutProperty('webcams', 'visibility', isChecked);
            map.setLayoutProperty('webcams_count', 'visibility', isChecked);
        } else if (name == 'rwis') {
            map.setLayoutProperty('rwis', 'visibility', isChecked);
            map.setLayoutProperty('rwis_text', 'visibility', isChecked);
        } else if (name == 'incidents') {
            map.setLayoutProperty('incidents_point', 'visibility', isChecked);
            map.setLayoutProperty('incidents_line_bg', 'visibility', isChecked);
            map.setLayoutProperty('incidents_line', 'visibility', isChecked);
            map.setLayoutProperty('incidents_text', 'visibility', isChecked);
        } else if (name == 'vms') {
            map.setLayoutProperty('dms', 'visibility', isChecked);
        } else if (name == 'construction') {
            map.setLayoutProperty('roadWork_point', 'visibility', isChecked);
        } else if (name == 'traffic') {
            map.setLayoutProperty('traffic', 'visibility', isChecked);
        } else if (name == 'radar') {
            if (layer.checked) {
                radarInit();
            } else {
                radarPlay = true;
                document.querySelector('.radar').remove();
                clearInterval(radarAnim);

                for (let i = 0; i < radarImgs.length; i++) {
                    map.removeLayer('radar-layer-' + i)
                        .removeSource('radar-' + i);
                }
            }
        }

        /* save custom layers to local storage */
        get('#menu').querySelectorAll('.toggle').forEach((chk) => {
            const name = chk.getAttribute('data-layer'),
                checked = chk.checked;

            customLayers.push({
                layer: name,
                show: checked
            });
        });

        localStorage.setItem('layers', JSON.stringify(customLayers));
    }
});

/* if the url changes without reloading, handle the request */
window.addEventListener('popstate', () => {
    queryParams = window.location.href.split('oregonroads/')[1];
    handleURIIntents();
});

/* on event clicks */
window.addEventListener('click', (e) => {
    /* search */
    if (e.target.id == 'query') {
        get('.search').style.display = 'flex';
        get('#search').focus();
    }

    if (e.target.id == 'aboutDialog') {
        createDialog('About OregonRoads', '<span style="display:block;color:#555;padding-bottom:0.5em">&copy; ' + new Date().getFullYear() + ' MAPO LLC</span><b>Version:</b> ' +
            version + '<br><b>Build Date:</b> ' + localStorage.getItem('buildDate') + '<br><b>Device:</b> ' + navigator.userAgent +
            '<span style="display:block;padding-top:0.5em">' +
            '<a href="' + host + 'oregonroads?utm_campaign=oregonroads&utm_medium=app&utm_source=user_menu">Learn More</a> &middot; ' +
            '<a href="' + host + 'about/legal/terms">Terms of Service</a> &middot; ' +
            '<a href="' + host + 'about/legal/privacy">Privacy Policy</a>' +
            '</span>');
    }

    /* close modal */
    if (e.target.id == 'close') {
        e.target.parentElement.style.display = 'none';
        get('#modal').classList.remove('full');
        get('#modal').classList.remove('disclaimer');

        removeHash();
    }

    /* click on positive CTA button in dialog */
    if (e.target.id == 'pos' && e.target.classList.contains('cta')) {
        if (get('.dialog').classList.contains('disclaimer')) {
            localStorage.setItem('disclaimer', new Date().getTime() / 1000);
        }

        get('.dialog').remove();
        get('.backdrop').style.display = 'none';
        history.replaceState(null, null, ' ');
    }

    /* get weather forecast */
    if (e.target.id == 'getwxf') {
        new Modal(null).getWXFcst(e.target);
    }

    /* pause of play radar */
    if (e.target.classList.contains('radarControl')) {
        const c = document.querySelector('.radarControl');

        if (radarPlay) {
            clearInterval(radarAnim);
            c.classList.remove('fa-pause');
            c.classList.add('fa-play');
            radarPlay = false;
        } else {
            let counter = document.querySelector('.radar input[type=range]').value,
                ra = () => {
                    radarImgs.forEach((e, n) => {
                        map.setLayoutProperty('radar-layer-' + n, 'visibility', (n == counter ? 'visible' : 'none'));
                        document.querySelector('.radar input[type=range]').value = counter;
                    });

                    if (counter == radarImgs.length - 1) {
                        counter = 0;
                        clearInterval(radarAnim);

                        setTimeout(() => {
                            radarAnim = setInterval(ra, RADAR_INT);
                        }, RADAR_INT);
                    } else {
                        counter++;
                    }
                };

            radarAnim = setInterval(ra, RADAR_INT);

            c.classList.add('fa-pause');
            c.classList.remove('fa-play');
            radarPlay = true;
        }
    }

    /* on search result click */
    if (e.target.id == 'result') {
        const s = get('.search'),
            sr = get('.search-results');

        get('#search').value = '';
        s.classList.remove('open');
        s.style.display = 'none';
        sr.style.display = 'none';
        sr.innerHTML = noRes;

        if (e.target.getAttribute('data-report')) {
            map.fitBounds(geojsonExtent(roadsArray[e.target.getAttribute('data-pos')].geometry), {
                padding: 60
            });
        } else {
            map.flyTo({
                center: [e.target.getAttribute('data-lon'), e.target.getAttribute('data-lat')],
                zoom: 12
            });
        }
    }

    /* favorite an item */
    if (e.target.id == 'fav') {
        if (e.target.classList.contains('unfavorite')) {
            e.target.classList.add('favorite');
            e.target.classList.remove('unfavorite');
            e.target.setAttribute('title', 'Remove from favorites');

            doFavorites('add', e.target.getAttribute('data-category'), e.target.getAttribute('data-id'), e.target.getAttribute('data-title'));
        } else {
            e.target.classList.add('unfavorite');
            e.target.classList.remove('favorite');
            e.target.setAttribute('title', 'Add to favorites');

            doFavorites('remove', e.target.getAttribute('data-category'), e.target.getAttribute('data-id'), e.target.getAttribute('data-title'));
        }
    }

    /* tab controls */
    if (e.target.classList.contains('tab')) {
        getAll('ul.tabs li').forEach((t) => {
            t.addEventListener('click', (e) => {
                getAll('ul.tabs li').forEach((p) => {
                    p.classList.remove('active');
                });

                getAll('.tab-content .content').forEach((f) => {
                    f.style.display = (f.getAttribute('data-tab') == t.getAttribute('data-tab') ? 'block' : 'none');
                });

                t.classList.add('active');
            });
        });
    }

    /* open webcams from RWIS modal */
    if (e.target.classList.contains('rwisCam')) {
        let geo = null,
            cams = [];

        webcams.forEach((w) => {
            for (let i = 0; i < w.properties.cameras.length; i++) {
                if (w.properties.cameras[i].id == e.target.getAttribute('data-id')) {
                    geo = w.geometry.coordinates;
                    cams.push(w.properties.cameras[i]);
                }
            }
        });

        new Modal(cams).webcam(geo);
    }
});

window.addEventListener('mousedown', (e) => {
    const target = e.target,
        modal = get('#modal'),
        user = get('#user'),
        search = get('.search'),
        results = get('.search-results');

    if (e.button === 0) {
        if (!modal.contains(target) && !user.contains(target) && !search.contains(target)) {
            if (isVisible(modal)) {
                modal.style.display = 'none';
                modal.classList.remove('full');
                modal.classList.remove('disclaimer');

                removeHash();
            }
        }

        if (!user.contains(target) && target.parentElement.parentElement.id != 'userMenu' && get('#userMenu') != null) {
            get('#userMenu').remove();
        }

        if (!search.contains(target) && !results.contains(target) && search.style.display == 'flex') {
            search.style.display = 'none';
            results.style.display = 'none';
            results.innerHTML = noRes;
        }
    }
    /*var target = e.target,
    menu = get('#menu'),
    modal = get('#modal'),
    search = get('.search'),
    searchRes = get('.search-results'),
    userMenu = get('ul#userMenu');

if (menu != null) {
    if (target !== menu && !menu.contains(target)) {
        menu.style.display = 'none';
    }
}

if (modal != null) {
    if (target !== modal && !modal.contains(target) && !moving) {
        modal.innerHTML = '';
        modal.style.display = 'none';
    }
}

if (search != null) {
    if (target !== search && !search.contains(target) && target !== searchRes && !searchRes.contains(target)) {
        search.style.display = 'none';
        searchRes.style.display = 'none';
    }
}

if (userMenu != null) {
    if (target !== userMenu && !userMenu.contains(target)) {
        userMenu.remove();
    }
}*/
});

window.addEventListener('keyup', (e) => {
    var search = e.target,
        md = get('#modal');

    /* close dialog when enter key is pressed */
    if (isVisible(get('.dialog')) && (e.code == 'Enter' || e.code == 'Escape')) {
        get('.dialog').remove();
        get('.backdrop').style.display = 'none';
    } else {
        /* close modal when esc key is pressed */
        if (isVisible(md) && e.code == 'Escape') {
            md.style.display = 'none';
            md.classList.remove('full');
            md.classList.remove('disclaimer');

            removeHash();
        }
    }

    if (search.id == 'filterRWIS') {
        const items = getAll('.content[data-tab=rwis] .rwis-card');

        if (search.value.length >= 1) {
            items.forEach((e) => {
                const n = e.querySelector('.wrap h2').innerHTML.toString().toLowerCase();

                if (n.search(search.value.replace(/([a-zA-Z]+)\-([0-9]+)?/gm, '$1$2').toLowerCase()) >= 0) {
                    e.style.display = 'flex';
                } else {
                    e.style.display = 'none';
                }
            });
        } else {
            items.forEach((e) => {
                e.style.display = 'flex';
            });
        }
    }

    if (search.id == 'filterRW') {
        const items = getAll('.content[data-tab=roads] .inc-card');

        if (search.value.length >= 1) {
            items.forEach((e) => {
                const n = e.querySelector('.wrap h2').innerHTML.toString().toLowerCase();

                if (n.search(search.value.replace(/([a-zA-Z]+)\-([0-9]+)?/gm, '$1$2').toLowerCase()) >= 0) {
                    e.style.display = 'flex';
                } else {
                    e.style.display = 'none';
                }
            });
        } else {
            items.forEach((e) => {
                e.style.display = 'flex';
            });
        }
    }

    if (search.id == 'search') {
        const sr = get('.search-results');

        if (search.value.length >= 2) {
            get('.search').classList.add('open');
            sr.style.display = 'block';

            let count = 0,
                res = '';

            /* search through all 12-37 reporting stations */
            roadsArray.forEach((e, n) => {
                if (e.properties.name.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-report="' + e.properties.name + '" data-pos="' + n + '">' + e.properties.name + '<span>Road Report</span></div>';
                    count++;
                }
                /*if (e.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-report="' + e + '" data-id="' + n + '">' + e + '<span>Road Report</span></div>';
                    count++;
                }*/
            });

            /* search through Oregon cities */
            cities.list.forEach((c) => {
                if (c.city.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-city="' + c.city + '" data-lat="' + c.lat + '" data-lon="' + c.lon + '">' + c.city + ', OR<span>City</span></div>';
                    count++;
                }
            });

            if (count == 0) {
                if (get('.search-result #result.none') != null) {
                    get('.search-results #result.none').innerHTML = 'No results found';
                } else {
                    sr.innerHTML = noRes;
                }
            } else {
                sr.innerHTML = res;
            }
        } else {
            if (get('.search-result #result.none') != null) {
                get('.search-results #result.none').innerHTML = 'No results found';
            } else {
                sr.innerHTML = noRes;
            }
        }
    }
});

window.addEventListener('contextmenu', (e) => {
    if (e.target.localName == 'img' || e.target.localName == 'canvas') {
        e.preventDefault();
    }
});