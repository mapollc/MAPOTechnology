import { ENV, config } from '../app/config.js';
import { global, modal } from '../app/state.js';

import { Popup, api, timeAgo, setHeaders, unsetHeaders, mapMouseOver, dateTime, getbbox } from '../utils/helpers.js';
import { wwaColors } from '../utils/constants.js';

import { ndfdTime } from './index.js';

import { notify } from '../ui/components.js';

import { layerActions } from '../map/layers.js';

export class NWS {
    async get(update = false) {
        const wwa = await api('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,Event,Affected,End_'],
            ['returnGeometry', true],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (!global.map.getSource('wwas')) {
            global.map.addSource('wwas', {
                type: 'geojson',
                data: wwa
            });
        }

        if (update) {
            global.map.getSource('wwas').setData(wwa);
        } else {
            if (!global.map.getLayer('wwas_outline')) {
                global.map.addLayer({
                    id: 'wwas_outline',
                    type: 'line',
                    source: 'wwas',
                    paint: {
                        'line-color': wwaColors,
                        'line-width': 2
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }

            if (!global.map.getLayer('wwas_fill')) {
                global.map.addLayer({
                    id: 'wwas_fill',
                    type: 'fill',
                    source: 'wwas',
                    paint: {
                        'fill-color': wwaColors,
                        'fill-opacity': 0.35
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });

                mapMouseOver('wwas_fill');
            }

            if (!global.map.getLayer('wwas_title')) {
                global.map.addLayer({
                    id: 'wwas_title',
                    type: 'symbol',
                    source: 'wwas',
                    minzoom: 8.9,
                    paint: {
                        'text-color': '#000',
                        'text-halo-color': '#fff',
                        'text-halo-blur': 1,
                        'text-halo-width': 1
                    },
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 450,
                        'text-font': config.fonts.din(),
                        'text-field': ['get', 'Event'],
                        'text-justify': 'auto',
                        'text-size': 14,
                        'text-max-width': 12,
                        'text-max-angle': 30,
                        'text-anchor': 'bottom',
                        'text-offset': [0, 1.3],
                        'text-letter-spacing': 0.05
                    }
                });
            }
        }
    }

    // get current weather alerts at the lat/lon of the users' click point
    async find(lat, lon) {
        let out = '<p>There are no valid weather alerts at this location</p>',
            popup = new Popup('').loading('<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting weather alerts...</p>');

        const data = await api(`${ENV.apiURL}nws`, [['lat', lat], ['lon', lon]]);

        if (data.alerts && data.alerts.length > 0) {
            const listOfAlerts = data.alerts.map(a => `<li style="line-height:1.3">
                <a href="#" data-action="readWWA" onclick="return false" data-id="${a.id}">${a.event}</a> until ${a.expires}
            </li>`).join('');

            // update the popup with valid alerts
            out = `<ul style="padding-inline-start:1em;display:inline-flex;flex-direction:column;gap:.5em">${listOfAlerts}</ul>`;
        }

        popup.update('Current Alerts', out);
    }

    // get SPC convective and fire weather outlooks
    async spc(update = false) {
        let od = document.querySelector('#otlkDay'),
            ot = document.querySelector('#otlkType'),
            dy,
            ty;

        if (od) {
            dy = od.options[od.selectedIndex].value;
            ty = ot.options[ot.selectedIndex].value;
        } else {
            dy = config.settings.special().otlkDay();
            ty = config.settings.special().otlkType();
        }

        const out = await api(`${ENV.apiURL}outlooks/${ty}`, [['day', (dy ? dy : 1)]]);
        if (!out) return;

        if (out.features.length == 0) {
            notify('info', `No ${ty == 'severe' ? 'severe thunderstorms are' : 'critical fire weather is'} expected, so no outlook is displayed on the map.`);
        }

        if (update) {
            global.map.getSource('outlook').setData(out);
        } else {
            if (!global.map.getSource('outlook')) {
                global.map.addSource('outlook', {
                    type: 'geojson',
                    data: out
                });
            }

            if (!global.map.getLayer('outlook_fill')) {
                global.map.addLayer({
                    id: 'outlook_fill',
                    type: 'fill',
                    source: 'outlook',
                    paint: {
                        'fill-color': ['get', 'fill'],
                        'fill-opacity': 0.4
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });

                mapMouseOver('outlook_fill');
            }

            if (!global.map.getLayer('outlook_outline')) {
                global.map.addLayer({
                    id: 'outlook_outline',
                    type: 'line',
                    source: 'outlook',
                    paint: {
                        'line-color': ['get', 'stroke']
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }

            if (!global.map.getLayer('outlook_title')) {
                global.map.addLayer({
                    id: 'outlook_title',
                    type: 'symbol',
                    source: 'outlook',
                    minzoom: 5.7,
                    paint: {
                        'text-color': '#000',
                        'text-halo-color': '#fff',
                        'text-halo-blur': 1,
                        'text-halo-width': 1
                    },
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 450,
                        'text-font': config.fonts.din(),
                        'text-field': ['get', 'name'],
                        'text-justify': 'auto',
                        'text-size': 14,
                        'text-max-width': 12,
                        'text-max-angle': 30,
                        'text-anchor': 'bottom',
                        'text-offset': [0, 1.3],
                        'text-letter-spacing': 0.05
                    }
                });
            }
        }
    }

    fcstHour() {
        const h = config.curTime.getUTCHours(),
            m = config.curTime.getUTCMonth() + 1,
            mo = (m < 10 ? '0' : '') + m,
            d = config.curTime.getUTCDate(),
            dy = (d < 10 ? '0' : '') + d;
        let t;

        if (h >= 19 && h <= 23 || h == 0) {
            t = '18';
        } else if (h >= 1 && h <= 6) {
            t = '00';
        } else if (h >= 7 && h <= 12) {
            t = '06';
        } else {
            t = '12';
        }

        return `${config.curTime.getUTCFullYear()}-${mo}-${dy}T${t}:00:00.000Z`;
    }

    ndfd(update = false, tid) {
        let ur, leg, legend = document.querySelector('.ndfdLegend');
        const fcstTime = document.querySelector('#fcstTime');

        let ft = config.settings.special().fcstTime(),
            fm = config.settings.special().forecastModel();

        if (Date.parse(ft) < new Date().getTime()) {
            ft = new Date(ndfdTime()).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z');
            if (fcstTime) [...fcstTime.options].forEach(o => o.selected = o.value === ft);
            config.settings.special.fcstTime = ft;
        }

        const ops = {
            '12hr_precipitation_probability': ['ndfd_precipitation', 'forecasts/ndfd_precipitation/ows?layer=conus_12hr_precipitation_probability'],
            'relative_humidity': ['ndfd_moisture', 'forecasts/ndfd_moisture/ows?layer=conus_relative_humidity'],
            'wind_speed': ['ndfd_wind', 'forecasts/ndfd_wind/ows?layer=conus_wind_speed'],
            'total_sky_cover': ['ndfd_sky', 'forecasts/ndfd_sky/ows?layer=conus_total_sky_cover'],
            'air_temperature': ['ndfd_temperature', 'ndfd_temperature/ows?layer=conus_air_temperature']
        };

        if (ops[fm]) [ur, leg] = ops[fm];

        if (!legend) {
            const container = document.createElement('div');
            container.className = 'ndfdLegend';
            document.body.append(container);
        }

        if (tid != 'fcstTime') {
            document.querySelector('.ndfdLegend').innerHTML = `<img src="https://nowcoast.noaa.gov/geoserver/${leg}&service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=283&height=33" alt="Legend">`;
        }

        if (update) {
            global.map.getSource('ndfd').setTiles([
                `https://nowcoast.noaa.gov/geoserver/${ur}/wms?service=WMS&layers=${fm}&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=1920&height=626&time=${ft}&dim_time_reference=${this.fcstHour()}&crs=EPSG%3A3857&bbox={bbox-epsg-3857}`
            ]);
        } else {
            if (!global.map.getSource('ndfd')) {
                global.map.addSource('ndfd', {
                    'type': 'raster',
                    'tiles': [
                        `https://nowcoast.noaa.gov/geoserver/${ur}/wms?service=WMS&layers=${fm}&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=1920&height=626&time=${ft}&dim_time_reference=${this.fcstHour()}&crs=EPSG%3A3857&bbox={bbox-epsg-3857}`
                    ],
                    'tileSize': 256
                });
            }

            if (!global.map.getLayer('ndfd')) {
                global.map.addLayer({
                    id: 'ndfd',
                    type: 'raster',
                    source: 'ndfd',
                    paint: {
                        'raster-opacity': 0.75
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    satellite(w) {
        let layer;

        switch (w) {
            case 1: layer = 'global_visible_imagery_mosaic'; break;
            case 2: layer = 'global_longwave_imagery_mosaic'; break;
            case 3: layer = 'global_water_vapor_imagery_mosaic'; break;
        }

        if (!global.map.getSource('satellite' + w)) {
            global.map.addSource('satellite' + w, {
                'type': 'raster',
                'tiles': [
                    `https://nowcoast.noaa.gov/geoserver/satellite/wms?service=WMS&layers=${layer}&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=256&height=256&crs=EPSG%3A3857&bbox={bbox-epsg-3857}`
                ],
                'tileSize': 256
            });
        }

        if (!global.map.getLayer('satellite' + w)) {
            global.map.addLayer({
                id: 'satellite' + w,
                type: 'raster',
                source: 'satellite' + w,
                paint: {
                    'raster-opacity': 0.7
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async getOutlookText(otlkType, day/*, click = true*/) {
        if (!config.settings.hasPermissions(config.PERMISSION_LEVELS.PRO)) {
            unsetHeaders();
            return;
        }

        global.inits.clickListener.openModal('wwa');
        const type = otlkType == 'severe' ? 'Severe Weather' : 'Fire Weather';

        setHeaders(`Day ${day} ${type} Outlook`, `weather/outlook/${otlkType}/${day}`,
            `Read the Day ${day} ${type} Outlook from the NWS Storm Prediction Center.`);

        let graphics = '';
        const request = await api(`${ENV.apiURL}outlooks/${otlkType}/text`, [['day', day]]);

        if (!request) {
            global.inits.clickListener.closeModal();
            notify('error', 'There was an error getting outlook text');
        }

        const valid1 = dateTime(request.outlook.valid, true, true),
            valid2 = dateTime(request.outlook.expires, true, true);

        setHeaders(`Day ${day} ${type} Outlook`, `weather/outlook/${otlkType}/${day}`,
            `Read the Day ${day} ${type} Outlook from the NWS Storm Prediction Center for ${valid1} until ${valid2}.`);

        request.outlook.graphics.forEach(g => {
            const gt = g.includes('torn') ? 'Tornado' : (g.includes('hail') ? 'Hail' : (g.includes('wind') ? 'Wind' : type));
            graphics += `<div class="g">
                <a target="blank" href="${ENV.baseURL}src/images/spc?path=${g}">
                    <img alt="Day ${day} ${gt} Outlook" class="ttip" data-tooltip="Day ${day} ${gt} Outlook" src="https://www.spc.noaa.gov/products/${g}">
                </a>
            </div>`;
        });

        const forecastText = request.outlook.text.replace(/<p><b>(<u>)?(.*?)(<\/u>)?<\/b><\/p>/gm, `<p style="padding-bottom:.75em"><b>$1$2$3</b></p>`);

        const content = `<div class="container">
            <div class="wwa">
                <header>
                    <div class="title">
                        <div class="tray">
                            <h1>Day ${day} ${type} Outlook</h1>
                        </div>

                        <p class="timestamps">
                            <span>Issued <b>${timeAgo(request.outlook.issued)}</b></span>
                            <span>Valid from <b>${valid1}</b> until <b>${valid2}</b></span>
                            <span>Issued by <a target="blank" href="https://www.spc.noaa.gov/" title="NOAA/NWS Storm Prediction Center">NOAA/NWS Storm Prediction Center</a></span>
                        </p>
                    </div>
                </header>

                <div class="block">
                    <div class="card row">
                        <div class="col wwa-details" data-width="100">
                            ${forecastText}

                            <span style="display:block;margin-top:1em"><b>Forecaster:</b> ${request.outlook.forecaster}</span>
                        </div>
                    </div>

                    <div class="graphics">
                        ${graphics}
                    </div>
                </div>
            </div>
        </div>`;

        modal.querySelector('.content').innerHTML = content;
    }

    async readWWA(id/*, click = true*/) {
        global.inits.clickListener.openModal('wwa');

        const request = await api(`${ENV.apiURL}getWWA`, [['id', id]]),
            a = request.wwa;

        ////getWorker('wwas');

        setHeaders(`${a.title} issued by the National Weather Service in ${a.office}`, `weather/alert/${id}`,
            `The National Weather Service in ${a.office} has issued a ${a.title} for ${a.area} until ${a.expires}.`);

        config.workers.wwas.postMessage(a);

        // add content to modal after service worker finishes
        config.workers.wwas.onmessage = (event) => {
            modal.querySelector('.content').innerHTML = event.data;

            if (a.title == 'Tornado Warning' || a.title == 'Severe Thunderstorm Warning') {
                modal.querySelector('h1.title').style.color = a.color;
            }
        };
    }
}

export class Weather {
    constructor(lat = null, lon = null) {
        this.lat = lat != null ? parseFloat(lat) : null;
        this.lon = lon != null ? parseFloat(lon) : null;
        this.scale = [
            [-50, -40, 'rgb(91, 18, 160)', '#fff'],
            [-40, -30, 'rgb(203, 72, 207)', '#222'],
            [-30, -20, 'rgb(111, 91, 226)', '#222'],
            [-20, -10, 'rgb(117,107,177)', '#222'],
            [-10, 0, 'rgb(13,0,125)', '#fff'],
            [0, 10, 'rgb(0,102,194)', '#fff'],
            [10, 20, 'rgb(74,199,255)', '#222'],
            [20, 30, 'rgb(173,255,255)', '#222'],
            [30, 40, 'rgb(0,153,150)', '#fff'],
            [40, 50, 'rgb(6,109,44)', '#fff'],
            [50, 60, 'rgb(116,196,118)', '#222'],
            [60, 70, 'rgb(211,255,190)', '#222'],
            [70, 80, 'rgb(255,237,160)', '#222'],
            [80, 90, 'rgb(254,174,42)', '#222'],
            [90, 100, 'rgb(252,78,42)', '#222'],
            [100, 110, 'rgb(177,0,38)', '#222'],
            [110, 120, 'rgb(89,0,66)', '#222']
        ];
        this.buildExpression = (steps, isColor = true) => {
            const isF = config.settings.weather()?.temp() == 'f',
                expr = ['case'];

            steps.forEach(([fMin, fMax, val]) => {
                const min = isF ? fMin : +global.conversion.FtoC(fMin).toFixed(1),
                    max = isF ? fMax : +global.conversion.FtoC(fMax).toFixed(1);

                expr.push(['all', ['>=', ['get', 'temp'], min], ['<', ['get', 'temp'], max]], val);
            });

            expr.push(isColor ? 'rgb(40,0,40)' : '#222');
            return expr;
        };
        this.stnColors = {
            bg: this.buildExpression(this.scale.map(s => [s[0], s[1], s[2]])),
            text: this.buildExpression(this.scale.map(s => [s[0], s[1], s[3]]), false),
        };
    }

    async findWXStn(stn) {
        const resp = await api(`https://api.synopticdata.com/v2/stations/metadata?token=350409c14c544ec9957effb1c15bcb99&stid=${stn}`);

        if (resp) {
            const lat = resp.STATION[0].LATITUDE,
                lon = resp.STATION[0].LONGITUDE;

            global.map.easeTo({
                center: [lon, lat],
                zoom: 9.2,
                duration: 1000
            });

            global.map.once('moveend', () => {
                // get weather stations without checking the layer
                if (!config.settings.isEnabled('stns')) layerActions['stns'].exe();

                const wait = setInterval(() => {
                    if (global.map.getSource('stns')) {
                        clearInterval(wait);
                        const data = global.map.getSource('stns')._data.geojson.features.filter(feat => feat.properties.STID == stn);

                        if (data.length == 0) return;

                        this.currentConds(data[0].properties);
                    }
                }, 200);
            });
        }
    }

    currentConds(p) {
        if (!p) return;

        const weatherSettings = config.settings.weather(),
            tempPref = weatherSettings?.temp(),
            windPref = weatherSettings?.wind(),
            hasPermissions = config.settings.hasPermissions('PRO');

        setHeaders(
            `Current Weather at ${p.NAME}`,
            `weather/current/${p.STID}`,
            `Live weather observations at ${p.NAME} (${p.STID}).`
        );

        const popup = new Popup('').loading();

        const obs = typeof p.OBSERVATIONS === 'string' ? JSON.parse(p.OBSERVATIONS) : p.OBSERVATIONS;

        let t = obs.air_temp_value_1?.value ?? null,
            rh = obs.relative_humidity_value_1?.value ?? null,
            ws = obs.wind_speed_value_1?.value ?? null;

        let wd = obs.wind_direction_value_1?.value ? global.conversion.getCompassDirection(obs.wind_direction_value_1?.value) : 'Variable';

        let tunit = 'F',
            wunit = 'mph';

        let wetBulb = (t != null && rh != null) ? global.conversion.wetBulb(t, rh) : null;

        // calculate heat index or wind chill
        let feelsLike = t;

        if (t != null) {
            if (ws != null && t <= 50 && ws >= 3) {
                feelsLike = global.conversion.windChill(t, ws);
            } else if (rh != null && t >= 80/* && rh >= 40*/) {
                feelsLike = global.conversion.heatIndex(t, rh);
            }
        }

        // format temperature
        if (tempPref == 'c') {
            tunit = 'C';

            if (t != null) t = global.conversion.FtoC(t);
            if (feelsLike != null) feelsLike = global.conversion.FtoC(feelsLike);
            if (wetBulb != null) wetBulb = global.conversion.FtoC(wetBulb);
        }

        if (rh != null) rh = Math.round(rh);
        if (t != null) t = Math.round(t);
        if (feelsLike != null) wetBulb = Math.round(feelsLike);

        // format wind speed
        if (windPref != 'mph' && ws != null) {
            ws = global.conversion.speed(ws, windPref);
            wunit = windPref;
        }

        const updated = timeAgo(new Date(obs.air_temp_value_1.date_time).getTime()),
            wind = (ws != null ? (ws == 0 ? 'Calm' : `${wd} at ${Math.round(ws)} ${wunit}`) : 'N/A');

        popup.update('Current Conditions', {
            'Station Name': p.name,
            Temperature: `${Math.round(t)}&deg;${tunit}`,
            'Feels Like': feelsLike != null ? `${feelsLike}&deg;${tunit}` : 'N/A',
            'Wet-Bulb Temp.': wetBulb != null ? `${wetBulb}&deg;${tunit}` : 'N/A',
            Humidity: rh ? `${rh}%` : 'N/A',
            Wind: wind,
            'Last report': updated
        },
            !hasPermissions ? `<a href="#" data-action="marketing-cta" data-utm="wx_stn" onclick="return false" class="btn btn-sm btn-yellow" style="display:block;margin:0 auto">Upgrade to see more data</a>` : null
        );
    }

    fireWxFcst() {
        global.inits.clickListener.openModal('wwa firewx');

        setHeaders(`Daily Fire Weather Forecast for ${this.lat}, ${this.lon}`, `weather/forecast/${this.lat},${this.lon}`,
            `Daily fire weather forecast from the National Weather Service for ${this.lat}, ${this.lon}.`);

        ////getWorker('fwf');

        config.workers.fwf.postMessage({
            lat: this.lat,
            lon: this.lon,
            units: {
                temp: config.settings.weather().temp() || 'f',
                wind: config.settings.weather().wind() || 'mph'
            }
        });

        config.workers.fwf.onmessage = (event) => {
            if (event.data != null) {
                config.disableClicks = false;
                modal.querySelector('.content').innerHTML = event.data;
            }
        };
    }

    async incidentWX() {
        const holder = document.querySelector('#curwx');
        if (!holder) return;

        const showError = (/*error*/) => {
            //if (error) { console.error(error); }
            holder.innerHTML = '<h2>Nearby Weather Conditions</h2><div class="message error">No current weather conditions are available near this incident.</div>';
        };

        try {
            const wx = await api(`${ENV.apiURL}weather/nearby`, [['radius', `${this.lat},${this.lon},30`], ['latest', 1]]);

            if (!wx?.weather?.obs) return showError();

            const { obs: o, name, updated } = wx.weather;

            if (o.temp?.current == null && !o.rh && !o.wind_speed) return showError();

            const pref = config.settings.weather?.() || {},
                isMetric = pref.temp?.() === 'c',
                windUnit = pref.wind?.() || 'mph',
                formatTemp = (val) => {
                    if (val == null) return '--';
                    const t = Math.round(val);
                    return isMetric ? `${global.conversion.FtoC(t).toFixed(1)}&deg;C` : `${t}&deg;F`;
                },
                formatWind = (val) => {
                    if (!val) return '--';
                    const speed = Math.round(val),
                        converted = windUnit !== 'mph' ? global.conversion.speed(speed, windUnit) : speed;
                    return `${converted} ${windUnit}`;
                },
                domTemp = holder.querySelector('#a h4'),
                domRH = holder.querySelector('#b h4'),
                domWD = holder.querySelector('#c h4'),
                icon = holder.querySelector('#c i'),
                domWS = holder.querySelector('#d h4'),
                u = holder.querySelector('.updated');

            domTemp.innerHTML = formatTemp(o.temp?.current);
            domRH.innerHTML = o.rh ? `${Math.round(o.rh)}%` : '--';

            if (o.raw_wind_dir != null) {
                const arrDir = (Number(o.raw_wind_dir - 45) + 180) % 360;
                domWD.innerHTML = o.wind_dir || '--';
                if (icon) icon.style.transform = `rotate(${arrDir}deg)`;
            } else {
                domWD.innerHTML = '--';
            }

            domWS.innerHTML = formatWind(o.wind_speed);
            u.innerHTML = `Last report ${timeAgo(updated)}${config.settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? `&nbsp;@&nbsp;${name}` : ''}`;
        } catch (err) {
            showError(err);
        }
    }

    async incidentForecast() {
        const holder = document.querySelector('#fcstwx');
        if (!holder) return;

        const showError = (error) => {
            if (error) console.error(error);
            holder.innerHTML = '<h2>24-Hour Fire Weather Analysis</h2><div class="message error">The 24-hour fire forecast is unavailable at this time.</div>';
        };

        const now = Date.now(),
            pref = config.settings.weather() || {},
            isMetric = pref.temp?.() === 'c',
            wUnit = pref.wind?.() || 'mph',
            formatWind = (val) => {
                if (!isFinite(val)) return '--';
                const converted = wUnit !== 'mph' ? global.conversion.speed(Math.round(val), wUnit) : Math.round(val);
                return `${converted} ${wUnit}`;
            };

        try {
            // get pri
            const ap = await api(`https://api.weather.gov/points/${this.lat.toFixed(4)},${this.lon.toFixed(4)}`);

            // if points API is unavailable or returns an error
            if (ap.status) return showError();

            // get hourly forecast grid data from ndfd
            const { properties: prop } = await api(ap.properties.forecastGridData);

            // if no temp data, cancel this process
            if (!prop?.temperature?.values?.length) return showError();

            // map temperatures to time frames
            const valid = prop.temperature.values.map((v, i) => ({
                t: new Date(v.validTime.split('/')[0]).getTime(),
                i
            })).filter(x => x.t >= now && x.t - now < 86400000).map(x => x.i);

            if (!valid.length) return showError();

            const temps = valid.map(i => prop.temperature.values[i].value),
                rhs = valid.map(i => prop.relativeHumidity.values[i]?.value),
                winds = valid.map(i => prop.windSpeed.values[i]?.value).filter(Boolean),
                maxT = Math.max(...temps) * 1.8 + 32,
                minRH = Math.min(...rhs),
                avgW = winds.length ? (winds.reduce((a, b) => a + b, 0) / winds.length) / 1.609 : NaN,
                maxW = winds.length ? Math.max(...winds) / 1.609 : NaN,
                displayT = isMetric ? `${global.conversion.FtoC(maxT).toFixed(1)}&deg;C` : `${Math.round(maxT)}&deg;F`;

            let btnHtml;
            const isPremium = config.settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM),
                domTemp = holder.querySelector('#a h4'),
                domRH = holder.querySelector('#b h4'),
                domAvgW = holder.querySelector('#c h4'),
                domMaxW = holder.querySelector('#d h4'),
                u = holder.querySelector('.updated');

            if (isPremium) {
                btnHtml = `<a href="#" class="btn btn-orange btn-sm" data-lat="${this.lat}" data-lon="${this.lon}" data-action="incident_wx-fwf" onclick="return false">View the full fire forecast</a>`
            } else {
                btnHtml = `<a href="#" class="btn btn-sm btn-orange" data-action="marketing-cta" data-utm="fire_forecast" onclick="return false"><i class="fas fa-lock"></i> Upgrade to view forecast</a>`;
            };

            domTemp.innerHTML = displayT;
            domRH.innerHTML = `${minRH}%`;
            domAvgW.innerHTML = formatWind(avgW);
            domMaxW.innerHTML = formatWind(maxW);
            u.innerHTML = `Latest data retrieved ${timeAgo(new Date(prop.updateTime).getTime())}`;
            u.insertAdjacentHTML('afterend', `<div class="btn-group centered">${btnHtml}</div>`);
        } catch (error) {
            showError(error);
        }
        return this;
    }

    updateRAWSUnits() {
        const isF = config.settings.weather()?.temp() === 'f',
            newBg = this.buildExpression(this.scale.map(s => [s[0], s[1], s[2]])),
            newText = this.buildExpression(this.scale.map(s => [s[0], s[1], s[3]]), false);

        // 2. Apply directly to map layers
        if (global.map.getLayer('stns')) {
            global.map.setPaintProperty('stns', 'circle-color', newBg);
            global.map.setPaintProperty('stns', 'circle-radius', [
                'case', ['>', ['get', 'temp'], isF ? 99 : 37.2], 15, 13
            ]);
        }

        if (global.map.getLayer('stns_text')) global.map.setPaintProperty('stns_text', 'text-color', newText);

        this.raws(true);
    }

    async raws(update = false) {
        const feat = [];
        const b = JSON.parse(getbbox()),
            bx = `${b.xmin},${b.ymin},${b.xmax},${b.ymax}`,
            vars = `token=350409c14c544ec9957effb1c15bcb99&bbox=${bx}&vars=air_temp,relative_humidity,wind_speed,wind_direction&units=temp|f,speed|mph&obtimezone=local&network=2,1,25,65&status=active&networkimportance=2,1`;

        const data = await api(`https://api.synopticlabs.org/v2/stations/latest?${vars}`);

        if (data.STATION) {
            data.STATION
                .filter(s => s.OBSERVATIONS.air_temp_value_1)
                .forEach(s => {
                    const ob = s.OBSERVATIONS;

                    //if (ob.air_temp_value_1) {
                    let t = ob.air_temp_value_1.value;

                    if (config.settings.weather()?.temp() == 'c' && t != '--') t = global.conversion.FtoC(ob.air_temp_value_1.value);

                    s.temp = Math.round(t);
                    //}

                    //if (ob.air_temp_value_1 && ob.relative_humidity_value_1 && ob.wind_speed_value_1) {
                    feat.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(s.LONGITUDE), parseFloat(s.LATITUDE)]
                        },
                        properties: s
                    });
                    //}
                });

            if (update && global.map.getSource('stns')) {
                global.map.getSource('stns').setData({
                    type: 'FeatureCollection',
                    features: feat
                });
            } else {
                if (!global.map.getSource('stns')) {
                    global.map.addSource('stns', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: feat
                        },
                        cluster: true,
                        clusterMaxZoom: 9,
                        clusterMinPoints: 4,
                        clusterRadius: 100
                    });
                }

                if (!global.map.getLayer('stns')) {
                    global.map.addLayer({
                        id: 'stns',
                        source: 'stns',
                        type: 'circle',
                        filter: [
                            'all',
                            ['!=', ['get', 'temp'], ''],
                            ['!', ['has', 'point_count']]
                        ],
                        paint: {
                            'circle-color': this.stnColors.bg,
                            'circle-radius': [
                                'case',
                                ['>', ['get', 'temp'], config.settings.weather()?.temp == 'f' ? 99 : 37.2], 15,
                                13
                            ]
                        }
                    });

                    mapMouseOver('stns');
                }

                if (!global.map.getLayer('stns_text')) {
                    global.map.addLayer({
                        id: 'stns_text',
                        type: 'symbol',
                        source: 'stns',
                        filter: [
                            'all',
                            ['!=', ['get', 'temp'], ''],
                            ['!', ['has', 'point_count']]
                        ],
                        paint: {
                            'text-color': this.stnColors.text
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 150,
                            'text-font': config.fonts.roboto(),
                            'text-field': ['concat', ['get', 'temp'], '°'],
                            'text-justify': 'center',
                            'text-size': 12,
                            'text-offset': [0, 0]
                        }
                    });

                    mapMouseOver('stns_text');
                }
            }
        }

        return this;
    }

    airQColor(v) {
        const ranges = [
            { max: 50, color: '00e400' },
            { max: 100, color: 'ffff00' },
            { max: 150, color: 'ff7e00' },
            { max: 200, color: 'ff0000' },
            { max: 300, color: '8f3f97' },
            { max: 500, color: '7e0023' }
        ];

        const range = ranges.find(r => v <= r.max);
        return `#${(range ? range.color : 'd9d9d9')}`;
    }

    airQDesc(aq) {
        const ranges = [
            { max: 50, label: 'Good', desc: 'Air quality is satisfactory, and air pollution poses little or no risk.' },
            { max: 100, label: 'Moderate', desc: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.' },
            { max: 150, label: 'Unhealthy for Sensitive Groups', desc: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.' },
            { max: 200, label: 'Unhealthy', desc: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.' },
            { max: 300, label: 'Very Unhealthy', desc: 'Health alert: The risk of health effects is increased for everyone.' },
            { max: Infinity, label: 'Hazardous', desc: 'Health warning of emergency conditions: everyone is more likely to be affected.' }
        ];

        const range = ranges.find(r => aq <= r.max);
        return { quality: range.label, desc: range.desc };
    }

    nearbyAQ() {
        if (!this.lat || !this.lon) {
            const c = global.map.getCenter();
            this.lat = c.lat;
            this.lon = c.lng;
        }

        if (!global.dataView.airQualityStns.features) return;

        const distances = [], stns = [];

        global.dataView.airQualityStns.features.forEach(f => {
            const dist = global.conversion.distance(this.lat, this.lon, f.geometry.coordinates[1], f.geometry.coordinates[0]);
            distances.push(dist);
            stns.push(f.properties);
        });

        const stn = stns[distances.indexOf(Math.min(...distances))];

        return {
            ...stn,
            color: this.airQColor(stn.PM25_AQI),
            details: this.airQDesc(stn.PM25_AQI)
        };
    }
}