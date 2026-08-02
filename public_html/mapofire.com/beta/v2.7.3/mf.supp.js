let utils;
loadUtils().then(u => utils = u);

(function (global) {
    function Extent() {
        this._bbox = [Infinity, Infinity, -Infinity, -Infinity];
        this._valid = false;
    }
    Extent.prototype.include = function ([lng, lat]) {
        this._valid = true;
        this._bbox[0] = Math.min(this._bbox[0], lng);
        this._bbox[1] = Math.min(this._bbox[1], lat);
        this._bbox[2] = Math.max(this._bbox[2], lng);
        this._bbox[3] = Math.max(this._bbox[3], lat);
        return this;
    };
    Extent.prototype.bbox = function () { return this._valid ? this._bbox : null; };
    Extent.prototype.polygon = function () {
        if (!this._valid) return null;
        const [minX, minY, maxX, maxY] = this._bbox;
        return { type: "Polygon", coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] };
    };

    function geojsonCoords(gj) {
        const coords = [];
        function flatten(obj) {
            if (!obj) return;
            switch (obj.type) {
                case "FeatureCollection": obj.features.forEach(flatten); break;
                case "Feature": flatten(obj.geometry); break;
                case "GeometryCollection": obj.geometries.forEach(flatten); break;
                default:
                    if (Array.isArray(obj.coordinates)) {
                        const stack = [obj.coordinates];
                        while (stack.length) {
                            const item = stack.pop();
                            typeof item[0] === "number" ? coords.push(item) : stack.push(...item);
                        }
                    }
            }
        }
        flatten(gj);
        return coords;
    }

    function traverse(obj, fn) {
        if (!obj || typeof obj !== "object") return;
        fn(obj);
        Object.values(obj).forEach(v => traverse(v, fn));
    }

    function geojsonExtent(gj) {
        const ext = new Extent();
        geojsonCoords(gj).forEach(c => ext.include(c));
        return ext.bbox();
    }

    geojsonExtent.polygon = function (gj) {
        const ext = new Extent();
        geojsonCoords(gj).forEach(c => ext.include(c));
        return ext.polygon();
    };

    geojsonExtent.bboxify = function (obj) {
        const geojsonTypes = ["FeatureCollection", "Feature", "GeometryCollection", "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"];
        traverse(obj, function (v) {
            if (v && v.type && geojsonTypes.includes(v.type)) {
                v.bbox = geojsonExtent(v);
            }
        });
    };

    global.geojsonExtent = geojsonExtent;
})(window);

class NearbyEvacuations {
    constructor(y, x) {
        this.bufferMiles = 17.5;
        this.x = x;
        this.y = y;
        this.point = [x, y];
    }

    distanceToSegmentMiles(v, w) {
        const distToV = conversion.distance(this.y, this.x, v[1], v[0]); // distance from p to v
        const distToW = conversion.distance(this.y, this.x, w[1], w[0]); // distance from p to w
        const lineLength = conversion.distance(v[1], v[0], w[1], w[0]);

        if (lineLength === 0) return distToV;

        // Treat points as cartesian (approximate) for projection
        const px = this.x, py = this.y,
            vx = v[0], vy = v[1],
            wx = w[0], wy = w[1],
            t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) /
                ((wx - vx) ** 2 + (wy - vy) ** 2);

        if (t < 0) return distToV;
        if (t > 1) return distToW;

        const projX = vx + t * (wx - vx),
            projY = vy + t * (wy - vy);

        return conversion.distance(this.y, this.x, projY, projX);
    }

    isPointInPolygon(polygon) {
        let inside = false;
        const [x, y] = this.point;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i],
                [xj, yj] = polygon[j],
                intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    isPointNearPolygon(polygon) {
        if (this.isPointInPolygon(polygon)) return true;
        for (let i = 0; i < polygon.length; i++) {
            const v = polygon[i],
                w = polygon[(i + 1) % polygon.length];
            if (this.distanceToSegmentMiles(v, w) <= this.bufferMiles) return true;
        }
        return false;
    }

    get() {
        return new Promise((resolve, reject) => {
            if (inits.evacuations?.evacsLoaded) {
                resolve(this.process());
            } else {
                const wait = setInterval(() => {
                    if (inits.evacuations?.evacsLoaded) {
                        clearInterval(wait);
                        resolve(this.process());
                    }
                }, 500);
            }
        });
    }

    process() {
        let active = null,
            grouped = {};

        inits.evacuations.activeEvacuations.forEach(feature => {
            const geom = feature.geometry;
            let fnotes = '',
                polygons = geom?.type === 'Polygon' ? [geom.coordinates[0]] : geom.coordinates.flat();

            const isNear = polygons.some(ring =>
                this.isPointNearPolygon(ring)
            );

            if (isNear) {
                const level = feature.properties.level,
                    notes = feature.properties.notes || '',
                    county = feature.properties.county || '',
                    state = feature.properties.state || '',
                    time = feature.properties.updated || 0;

                if (!grouped[level]) grouped[level] = {
                    level: level,
                    notes: new Set(),
                    counties: new Set(),
                    states: new Set(),
                    updated: new Set()
                };

                if (notes.search('Evac Zone Name') >= 0) fnotes = RegExp(/Evac Zone Name: (.*?)\s\//gm).exec(notes)[1];

                grouped[level].notes.add(fnotes);
                grouped[level].counties.add(county);
                grouped[level].states.add(state);
                grouped[level].updated.add(time);
            }
        });

        active = Object.values(grouped).map(group => ({
            level: group.level,
            notes: Array.from(group.notes),
            counties: Array.from(group.counties),
            state: Array.from(group.states),
            updated: Math.max.apply(null, Array.from(group.updated))
        }));

        return active;
    }
}

class Popup {
    constructor(title, tall = false) {
        this.header = `<div class="header"${(!title ? ' style="margin-bottom:0"' : '')}>
            <h1>${title}</h1>
            <span id="close-popup" data-action="close-popup" title="Close popup" class="far fa-xmark-large"></span>
        </div>`;
        this.tall = tall;
        this.dialog = null;

        if (isVisible('#modal')) inits.clickListener.closeModal();
    }

    createContent(data) {
        if (!data) return '';
        if (typeof data === 'string') return data;

        return Object.entries(data)
            .map(i => {
                if (i[1] == null) return '';

                return `<div class="item">
                    <div class="t">${i[0]}</div>
                    <div class="v">${i[1]}</div>
                </div>`;
            }).join('');
    }

    create(data, extraHTML = null) {
        this.close();

        const pop = document.createElement('div');
        pop.classList.add('popup');
        if (this.tall) pop.classList.add('tall');

        pop.innerHTML = `<div class="content">${this.header}
            <div class="data">
                ${this.createContent(data)}${extraHTML ?? ''}
            </div>
        </div>`;

        this.dialog = pop;
        this.open();

        return this;
    }

    loading(extraHTML = null) {
        this.create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>' + (extraHTML ?? ''));
        return this;
    }

    update(title = null, data, extraHTML = null) {
        if (title) {
            const h = this.dialog.querySelector('.header h1');
            h.innerHTML = title;
            h.parentElement.removeAttribute('style');
        }

        this.dialog.querySelector('.content .data').innerHTML = `${this.createContent(data)}${(extraHTML ?? '')}`;

        return this;
    }

    link(url, text = "Learn More") {
        this.dialog.querySelector('.content .data').insertAdjacentHTML('afterend', `<a class="popup-btn" target="_blank" href="${url}">${text}</a>`);
        return this;
    }

    open() {
        document.body.appendChild(this.dialog);
        return this;
    }

    close() {
        const p = document.querySelector('.popup');
        if (p) p.remove();
        return this;
    }
}

class Weather {
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
            const isF = settings.weather()?.temp() == 'f',
                expr = ['case'];

            steps.forEach(([fMin, fMax, val]) => {
                const min = isF ? fMin : +conversion.FtoC(fMin).toFixed(1),
                    max = isF ? fMax : +conversion.FtoC(fMax).toFixed(1);

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

            map.easeTo({
                center: [lon, lat],
                zoom: 9.2,
                duration: 1000
            });

            map.once('moveend', () => {
                // get weather stations without checking the layer
                if (!settings.isEnabled('stns')) layerActions['stns'].exe();

                const wait = setInterval(() => {
                    if (map.getSource('stns')) {
                        clearInterval(wait);
                        const data = map.getSource('stns')._data.geojson.features.filter(feat => feat.properties.STID == stn);

                        if (data.length == 0) return;

                        this.currentConds(data[0].properties);
                    }
                }, 200);
            });
        }
    }

    currentConds(p) {
        if (!p) return;

        const weatherSettings = settings.weather(),
            tempPref = weatherSettings?.temp(),
            windPref = weatherSettings?.wind(),
            hasPermissions = settings.hasPermissions('PRO');

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

        let wd = obs.wind_direction_value_1?.value ? conversion.getCompassDirection(obs.wind_direction_value_1?.value) : 'Variable';

        let tunit = 'F',
            wunit = 'mph';

        let wetBulb = (t != null && rh != null) ? conversion.wetBulb(t, rh) : null;

        // calculate heat index or wind chill
        let feelsLike = t;

        if (t != null) {
            if (ws != null && t <= 50 && ws >= 3) {
                feelsLike = conversion.windChill(t, ws);
            } else if (rh != null && t >= 80/* && rh >= 40*/) {
                feelsLike = conversion.heatIndex(t, rh);
            }
        }

        // format temperature
        if (tempPref == 'c') {
            tunit = 'C';

            if (t != null) t = conversion.FtoC(t);
            if (feelsLike != null) feelsLike = conversion.FtoC(feelsLike);
            if (wetBulb != null) wetBulb = conversion.FtoC(wetBulb);
        }

        if (rh != null) rh = Math.round(rh);
        if (t != null) t = Math.round(t);
        if (feelsLike != null) wetBulb = Math.round(feelsLike);

        // format wind speed
        if (windPref != 'mph' && ws != null) {
            ws = conversion.speed(ws, windPref);
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
        inits.clickListener.openModal('wwa firewx');

        setHeaders(`Daily Fire Weather Forecast for ${this.lat}, ${this.lon}`, `weather/forecast/${this.lat},${this.lon}`,
            `Daily fire weather forecast from the National Weather Service for ${this.lat}, ${this.lon}.`);

        getWorker('fwf');

        config.workers.fwf.postMessage({
            lat: this.lat,
            lon: this.lon,
            units: {
                temp: settings.weather().temp() || 'f',
                wind: settings.weather().wind() || 'mph'
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

        const onError = (/*error*/) => {
            //if (error) { console.error(error); }
            holder.innerHTML = '<h2>Nearby Weather Conditions</h2><div class="message error">No current weather conditions are available near this incident.</div>';
        };

        try {
            const wx = await api(`${ENV.apiURL}weather/nearby`, [['radius', `${this.lat},${this.lon},30`], ['latest', 1]]);

            if (!wx?.weather?.obs) return showError();

            const { obs: o, name, updated } = wx.weather;

            if (o.temp?.current == null && !o.rh && !o.wind_speed) return showError();

            const pref = settings.weather?.() || {},
                isMetric = pref.temp?.() === 'c',
                windUnit = pref.wind?.() || 'mph',
                formatTemp = (val) => {
                    if (val == null) return '--';
                    const t = Math.round(val);
                    return isMetric ? `${conversion.FtoC(t).toFixed(1)}&deg;C` : `${t}&deg;F`;
                },
                formatWind = (val) => {
                    if (!val) return '--';
                    const speed = Math.round(val),
                        converted = windUnit !== 'mph' ? conversion.speed(speed, windUnit) : speed;
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
            u.innerHTML = `Last report ${timeAgo(updated)}${settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? `&nbsp;@&nbsp;${name}` : ''}`;
        } catch (err) {
            onError(err);
        }
    }

    async incidentForecast() {
        const holder = document.querySelector('#fcstwx');
        if (!holder) return;

        const onError = (error) => {
            if (error) console.error(error);
            holder.innerHTML = '<h2>24-Hour Fire Weather Analysis</h2><div class="message error">The 24-hour fire forecast is unavailable at this time.</div>';
        };

        const now = Date.now(),
            pref = settings.weather() || {},
            isMetric = pref.temp?.() === 'c',
            wUnit = pref.wind?.() || 'mph',
            formatWind = (val) => {
                if (!isFinite(val)) return '--';
                const converted = wUnit !== 'mph' ? conversion.speed(Math.round(val), wUnit) : Math.round(val);
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
                displayT = isMetric ? `${conversion.FtoC(maxT).toFixed(1)}&deg;C` : `${Math.round(maxT)}&deg;F`;

            let btnHtml;
            const isPremium = settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM),
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
        const isF = settings.weather()?.temp() === 'f',
            newBg = this.buildExpression(this.scale.map(s => [s[0], s[1], s[2]])),
            newText = this.buildExpression(this.scale.map(s => [s[0], s[1], s[3]]), false);

        // 2. Apply directly to map layers
        if (map.getLayer('stns')) {
            map.setPaintProperty('stns', 'circle-color', newBg);
            map.setPaintProperty('stns', 'circle-radius', [
                'case', ['>', ['get', 'temp'], isF ? 99 : 37.2], 15, 13
            ]);
        }

        if (map.getLayer('stns_text')) map.setPaintProperty('stns_text', 'text-color', newText);

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

                    if (settings.weather()?.temp() == 'c' && t != '--') t = conversion.FtoC(ob.air_temp_value_1.value);

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

            if (update && map.getSource('stns')) {
                map.getSource('stns').setData({
                    type: 'FeatureCollection',
                    features: feat
                });
            } else {
                if (!map.getSource('stns')) {
                    map.addSource('stns', {
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

                if (!map.getLayer('stns')) {
                    map.addLayer({
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
                                ['>', ['get', 'temp'], settings.weather()?.temp == 'f' ? 99 : 37.2], 15,
                                13
                            ]
                        }
                    });

                    mapMouseOver('stns');
                }

                if (!map.getLayer('stns_text')) {
                    map.addLayer({
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
            const c = map.getCenter();
            this.lat = c.lat;
            this.lon = c.lng;
        }

        if (!dataView.airQualityStns.features) return;

        const distances = [], stns = [];

        dataView.airQualityStns.features.forEach(f => {
            const dist = conversion.distance(this.lat, this.lon, f.geometry.coordinates[1], f.geometry.coordinates[0]);
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

class ChangeListener {
    constructor(target) {
        this.target = target;
    }

    changeBasemap(tile = null) {
        if (tile == null) tile = this.target.dataset.tile;

        settings.settings.tile = tile;

        map.setStyle(config.tiles[tile]);

        map.once('styledata', () => {
            config.layersHandler.addTerrain();
            config.layersHandler.init();
            config.wildfire.getWildfires();
            config.wildfire.perimeters();

            const dont = ['newFires', 'allFires', 'smokeChecks', 'rxBurns', 'perimeters'];

            if (settings.checkboxes()) {
                settings.checkboxes().filter(c => !dont.includes(c)).forEach(c => toggleLayer({ id: c, checked: true }));
            }
        });
    }

    minPerimSize() {
        const v = this.target.value;

        settings.updatePSize(v);
        document.querySelector('#pSize').innerHTML = `${v} acres`;

        ['perimeters_outline', 'perimeters_fill', 'perimeters_title'].forEach(lay => map.removeLayer(lay));
        map.removeSource('perimeters');

        config.wildfire.perimeters();
    }

    toggle() {
        const layers = [];

        document.querySelectorAll('.layChkBx').forEach(e => { if (e.checked) layers.push(e.id); });

        // update settings to reflect anytime a checkbox is selected or not
        settings.updateLayers(layers);

        // toggle the layer on or off
        const id = this.target.id,
            checked = this.target.checked;

        toggleLayer({ id, checked });
    }

    smoke(sfc) {
        const handler = sfc ? config.layersHandler.sfcSmoke : config.layersHandler.viSmoke;
        handler(this.target.options[this.target.selectedIndex].value);
    }

    async spc() {
        const type = document.querySelector('#otlkType'),
            days = document.querySelector('#otlkDay'),
            day3 = days.querySelector('option[value="3"]');

        // add or remove day 3 depending on if the user is looking at severe or fire wx outlooks
        if (type.value == 'severe') {
            if (!day3) {
                const opt = document.createElement('option');
                opt.value = 3;
                opt.text = 'Day 3';
                days.appendChild(opt);
            }
        } else {
            if (day3) day3.remove();
        }

        settings.updateSpecial();
        new utils.NWS().spc(true);
    }

    personalize() {
        if (document.querySelector('#impact #settings') != null) {
            document.querySelectorAll('#impact #settings select').forEach(s => settings.updatePersonal(s));

            saveSession(true);
        }
    }

    archive() {
        const ay = document.querySelector('#archive_years'),
            s = ay.options[ay.selectedIndex].value,
            win = window.location;

        if (s != '- Choose a year -') win.href = `${ENV.host}archive/${s}${(win.search ? win.search : '')}${(win.hash ? win.hash : '')}`;
    }

    spcClimo() {
        const offset = parseInt(this.target.value, 10);
        config.layersHandler.spcClimo(offset, true, true);
    }
}

function mapMouseOver(layer) {
    map.on('mouseenter', layer, () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', layer, () => map.getCanvas().style.cursor = 'auto');
}

function isVisible(div) {
    const element = document.querySelector(div);

    if (element != null) {
        const rect = element.getBoundingClientRect(),
            windowHeight = window.innerHeight;

        return rect.top >= 0 && rect.bottom <= windowHeight;
    }
}

function timeAgo(t, w, c) {
    if (t === 'undefined' || !t) return '';

    const plural = (v) => { return v > 1 ? 's' : ''; },
        subUnit = (d, s, r) => { return Math.floor(((d / s) - Math.floor(d / s)) * r); },
        now = c ?? Date.now(),
        timestamp = t.toString().length === 10 ? t * 1000 : t,
        d = Math.round((now - timestamp) / 1000);

    if (d < 10) return 'Just now';

    const ranges = [
        { limit: 60, unit: 'sec', div: 1, sub: null },
        { limit: 3600, unit: 'min', div: 60, sub: { div: 60, unit: 'sec' } },
        { limit: 86400, unit: 'hour', div: 3600, sub: { div: 60, unit: 'min' } },
        { limit: 172800, unit: 'day', div: 86400, sub: { div: 24, unit: 'hour' } },
        { limit: 604800, unit: 'day', div: 86400 },
        { limit: 2419200, unit: 'week', div: 604800 },
        { limit: 31536000, unit: 'month', div: 2419200 },
        { limit: Infinity, unit: 'year', div: 31536000 }
    ];

    const range = ranges.find(r => d < r.limit);
    let val = `${Math.floor(d / range.div)} ${range.unit}${plural(Math.floor(d / range.div))}`;

    if (range.sub) {
        const subVal = subUnit(d, range.div, range.sub.div);
        if (subVal !== 0) {
            val += `,&nbsp;${subVal} ${range.sub.unit}${plural(subVal)}`;
        }
    }

    if (w === 1) val = val.split(',')[0];

    return `${val} ago`;
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function dateTime(it, time = false, timezone = false, longMonth = false) {
    if (it == null || it === '') return '';

    let t = new Date(it.toString().length == 10 ? it * 1000 : it),
        h = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())),
        m = (t.getMinutes() < 10 ? '0' : '') + t.getMinutes(),
        a = `${h}:${m} ${(t.getHours() >= 12 ? 'P' : 'A')}M`,
        s = (/\((.*?)\)/g).exec(new Date().toString())[1].split(' '),
        tz = s[0].substring(0, 1) + s[1].substring(0, 1) + s[2].substring(0, 1),
        month = longMonth ? config.longMonths[t.getMonth()] : config.months[t.getMonth()];

    return `${month} ${t.getDate()}, ${t.getFullYear()}${(time ? `&nbsp;at ${a}` : '')}${(timezone ? ` ${tz}` : '')}`;
}

// social media shares
function socialShare(se) {
    const p = window.location.pathname,
        s = p.split('/'),
        clean = v => String(v).replaceAll('-', ' ').ucwords().replaceAll(' ', '');

    if (se == 'tt') {
        window.open(`https://tiktok.com/search?q=${s[4].replaceAll('-', '%20').toLowerCase()}`);
    } else {
        const ref = ENV.host.substring(0, ENV.host.length - 1).replace('www.', '') + p;

        if (se == 'fb') {
            url = `https://www.facebook.com/sharer/sharer.php?u=${ref}&src=sdkpreparse`;
        } else {
            const hashtags = `${clean(s[3])},${clean(s[4])}`;
            url = `https://x.com/intent/post?hashtags=${hashtags}&original_referer=${ref}&url=${ref}&ref_src=twsrc%5Etfw&tw_p=tweetbutton`;
        }

        const h = 425, w = 700,
            t = (window.innerHeight - h) / 2,
            l = (window.innerWidth - w) / 2;

        window.open(url, 'social', `location=no,menubar=no,status=no,resizable=no,top=${t},left=${l},width=${w},height=${h}`);
    }
}

function sfpTimes() {
    return Array.from({ length: 7 }, (_, z) => {
        const t = new Date();
        t.setDate(t.getDate() + z);

        const y = t.getFullYear(),
            m = String(t.getMonth() + 1).padStart(2, '0'),
            d = String(t.getDate()).padStart(2, '0'),
            dayLabel = z === 0 ? ' (Today)' : (z === 1 ? ' (Tomorrow)' : '');

        return {
            key: `${y}-${m}-${d}T00:00:00.0Z`,
            value: `${config.days[t.getDay()]}, ${config.months[t.getMonth()]} ${t.getDate()}${dayLabel}`
        };
    });
}

function ndfdTime(add = 0) {
    const now = new Date(),
        dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
        [hours, minutes] = now.toTimeString().split(':');

    let h = parseInt(hours, 10);
    if (parseInt(minutes, 10) > 0) h += 1;

    const t = `${dateStr} ${h}:00:00`;
    return new Date(t).getTime() + add * 3600 * 1000;
}

function initNDFDTimes() {
    const options = [];
    const fcstTime = settings.special().fcstTime();
    let selectedApplied = false;

    for (let i = 0; i < 24; i++) {
        const t = new Date(ndfdTime(i)),
            ts = t.toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z');

        const selected = !selectedApplied && (fcstTime >= ts || (i === 0 && fcstTime < ts)) ? (selectedApplied = true, 'selected ') : '',
            hours = t.getHours(),
            lh = hours % 12 || 12,
            period = hours >= 12 ? 'PM' : 'AM';

        options.push(`<option ${selected}value="${ts}">${lh}:00 ${period}</option>`);
    }

    return options;
}

function setHeaders(title, urlPath, description) {
    const fullUrl = `${ENV.baseURL}${urlPath.replace(/incident\/|wildfire\//g, 'fires/')}${window.location.search}${window.location.hash}`,
        pageTitle = `${title} | ${config.productName}`;

    // Use a single line to decide which history method to use
    (modal.classList.contains('open') ? window.history.replaceState : window.history.pushState).call(window.history, {
        "pageTitle": pageTitle
    }, '', fullUrl);

    // Update document metadata
    document.title = pageTitle;
    const metaTags = [
        {
            property: 'og:title',
            name: 'twitter:title',
            content: pageTitle
        }, {
            name: 'description',
            property: 'og:description',
            name: 'twitter:description',
            content: description
        }
    ];

    metaTags.forEach(tag => {
        if (tag.property) document.querySelector(`meta[property="${tag.property}"]`).setAttribute('content', tag.content);
        if (tag.name) document.querySelector(`meta[name="${tag.name}"]`).setAttribute('content', tag.content);
    });
}

function unsetHeaders() {
    const h = window.location.href;

    if (h.search('fires') >= 0 || h.search('perimeter') >= 0 || h.search('weather/') >= 0 || h.search('risk') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', h.replace(window.location.pathname, (settings.archive == null ? '' : `/archive/${settings.archive}`)));

        document.title = defaultTitle;

        ['meta[property="og:title"]', 'meta[name="twitter:title"]']
            .forEach(n => document.querySelector(n).setAttribute('content', defaultTitle));
        ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']
            .forEach(n => document.querySelector(n).setAttribute('content', defaultDesc));
    }
}

async function saveSession(method = true) {
    if (!navigator.onLine) return utils.notify('error', 'Unable to sync due to no internet.');

    const sy = document.querySelector('li#save span'),
        syncStatus = impact.querySelector('#sync span'),
        set = {
            ...settings.settings,
            center: [map.getCenter().lat, map.getCenter().lng],
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
            tile: settings.getBasemap(),
            weather: settings.settings.weather || { temp: 'f', wind: 'mph' }
        };

    if (sy) sy.innerHTML = 'Syncing...';
    if (syncStatus) syncStatus.innerHTML = 'Syncing...';

    const data = await api(`${ENV.host}api/v1/session`, [['method', method], ['settings', JSON.stringify(set)]], false, true);

    if (data?.success === 1) {
        if (settings.user) settings.user.settings.synced = Date.now();
        if (sy) sy.innerHTML = 'Sync';
        if (syncStatus) syncStatus.innerHTML = 'Account synced just now';

        utils.notify('success', 'Your settings were successfully synced.');
    } else {
        if (sy) sy.innerHTML = 'Sync Error';

        utils.notify('error', 'Sync failed. Server might be down.');
    }
}

function newFiresReport() {
    let content = document.createElement('ul');
    content.classList.add('new_fires');

    dataView.newFires
        .sort((a, b) => Number(b.properties.acres ?? 0) - Number(a.properties.acres ?? 0))
        .forEach(fire => {
            const li = document.createElement('li'),
                name = `${fire.properties.name.replace(' Fire', '')}${(fire.properties.type == 'Wildfire' ? ' Fire' : '')}`,
                near = fire.properties.near,
                size = conversion.sizeFormat(fire.properties.acres);

            li.dataset.action = 'new-fires';
            li.dataset.lat = fire.geometry.coordinates[1];
            li.dataset.lon = fire.geometry.coordinates[0];
            li.innerHTML = `<div class="pert"><h3>${name}</h3><span class="near">${near}</div></div><span class="disc">${size}</span>`;
            content.appendChild(li);
        });

    createDataForm('New, Fast Growing Fires', content.outerHTML);
}

function createDataForm(title, content, center = false) {
    const df = document.querySelector('#data-form');

    df?.classList.remove('bg');
    df?.remove();

    const el = document.createElement('dialog');
    el.id = 'data-form';
    el.innerHTML = `<span id="exit" data-action="close-data-form" class="far fa-xmark"></span>
        <div class="wrapper${(center ? ' center' : '')}">
            <h1>${title}</h1>${content}
        </div>`;
    document.body.append(el);
}

// allow user to submit report to MAPO of a new wildfire incident
async function createCSReport(data, lat, lon) {
    const form = document.querySelector('#newReport'),
        theState = utils.stateLabels[data.geocode.state];

    if (settings.user != null) {
        form.querySelector('input[name=authUser]').value = 1;
        form.insertAdjacentHTML('afterbegin', `<input type="hidden" name="uid" value="${settings.user.uid}">`);
    }

    form.querySelector('input[name=lat]').value = lat;
    form.querySelector('input[name=lon]').value = lon;
    form.querySelector('input[id=gc]').value = data.geocode.county.county ? data.geocode.county.county : 'Undetermined';
    form.querySelector('input[id=gl]').value = data.geocode.near;
    form.querySelector('input[id=gs]').value = data.geocode.state ? theState?.name : 'Undetermined';
    form.querySelector('input[name=geolocation]').value = data.geocode.near;
    form.querySelector('input[name=state]').value = `${data.geocode.state} / ${theState?.name}`;

    form.querySelector('input[name=size]').addEventListener('keyup', (e) => {
        form.querySelector('#alab').innerHTML = `acre${(e.target.value != 1 ? 's' : '')}`;
    });

    config.disableClicks = false;
}

async function onRasterLayerClick(e) {
    const getLayer = (name) => map.getStyle().layers.find(l => l.id === name);

    const coords = e.lngLat;
    const fuels = getLayer('fuels'),
        bp = getLayer('bp'),
        rth = getLayer('rth'),
        whp = getLayer('whp'),
        wet = getLayer('wet');

    const wildfireRiskLayer = [
        { ref: rth, id: 'rth', key: 'rps', title: 'Wildfire Risk', label: 'Risk to Homes' },
        { ref: bp, id: 'bp', key: 'bp', title: 'Wildfire Likelihood', label: 'Wildfire Likelihood' }
    ].find(l => l.ref?.layout?.visibility === 'visible');

    const { legend } = await loadUtils();

    if (fuels && fuels.layout.visibility.toString() == 'visible') {
        const year = 2024;
        const popup = new Popup('', true).loading();

        const getFuelType = async (year, where) => {
            const url = `https://lfps.usgs.gov/arcgis/rest/services/Landfire_LF${year}/LF${year}_EVT_${where}/ImageServer/identify?geometry=${encodeURIComponent(`{"spatialReference":{"latestWkid":4326,"wkid":102100},"x":${coords.lng},"y":${coords.lat}}`)}
                &geometryType=esriGeometryPoint&mosaicRule=${encodeURIComponent('{"ascending":true,"mosaicMethod":"esriMosaicNorthwest","mosaicOperation":"MT_FIRST"}')}
                &renderingRule=&renderingRules=${encodeURIComponent(`[{"rasterFunction":"LF${year}_EVT_${where}"}]`)}
                &pixelSize=${encodeURIComponent('{"spatialReference":{"latestWkid":3857,"wkid":102100},"x":152.87405657041106,"y":152.87405657041106}')}
                &sliceId=&time=&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=json`;

            try {
                const data = await fetch(url);

                if (!data.ok) return null;

                const json = await data.json();
                return json.processedValues && json.processedValues[0] === 'NoData' ? null : json;
            } catch (e) {
                console.error('Error trying to retreive fuels:', e);
                return null;
            }
        };

        let where = "CONUS",
            fuelType = 'Unknown',
            fuels = await getFuelType(year, where);

        if (fuels === null) {
            where = "AK";
            fuels = await getFuelType(year, where);
        }

        if (fuels.processedValues && fuels.processedValues[0]) {
            const found = config.fuelsData.find(fuel => fuel.attributes.Value === fuels.processedValues[0]);

            if (found) fuelType = found.attributes.EVT_NAME;

            popup.update('Fuels Type', {
                'Existing Vegetation Type': fuelType,
                'Model': (where == 'CONUS' ? 'United States' : 'Alaska'),
                'Data Year': year
            });
        } else {
            popup.close();
            utils.notify('error', 'Unable to get fuels information. Try again.');
        }
    }

    if (wildfireRiskLayer && map.getZoom() >= 6) {
        const { id, key, title, label } = wildfireRiskLayer;
        const popup = new Popup(title, true).loading();

        const [respRes, pcRes] = await Promise.allSettled([
            api(`${ENV.apiURL}risk`, [['lat', coords.lat], ['lon', coords.lng]]),
            conversion.getRasterColor(e.lngLat, id)
        ]);

        const resp = respRes.status === 'fulfilled' ? respRes.value : null,
            pc = pcRes.status === 'fulfilled' ? pcRes.value : null;

        if (resp?.risk) {
            const data = resp.risk, d = data.data[key];
            const localVal = legend.items[id].find(i => i[2] === pc)?.[3] || 'Unknown';

            // Short function to generate the comparison text
            const getComp = (val, region) => {
                const pct = Math.round(val * 100);
                return `On average, ${data.name} has a ${pct < 5 ? 'lower' : 'greater'} risk than ${pct < 5 ? 'nearly all' : `${pct}% of`} other counties in ${region}`;
            };

            popup.update(null, {
                Location: `${data.name}, ${data.state}`,
                [`${title === 'Wildfire Risk' ? 'Risk' : 'Likelihood'} at this Location`]: pc ? localVal : null,
                [`${label} in this County`]: d.rank,
                'State Comparison': getComp(d.state, utils.stateLabels[data.state].name),
                'US Comparison': getComp(d.us, 'the US')
            }).link(`https://apps.wildfirerisk.org/explore/${title === 'Wildfire Risk' ? 'risk-to-homes' : 'wildfire-likelihood'}/${String(data.fips).slice(0, 2)}/${data.fips}/`);
        } else {
            popup.update(null, `<p>Unable to retrieve ${title.toLowerCase()} risk report.</p>`);
        }
    }

    if (whp && whp.layout.visibility == 'visible' && map.getZoom() >= 6) {
        const popup = new Popup('Wildfire Hazard Potential', true).loading();

        const pc = await conversion.getRasterColor(e.lngLat, 'whp'),
            val = legend.items.whp.find(i => i[2] === pc);

        if (val) {
            popup.update(null,
                {
                    Difficulty: val[3],
                    Description: `There is a ${val[3].toLowerCase()} potential for a wildfire that may be difficult to manage.`
                });
        } else {
            popup.update(null, '<p>Unable to retrieve wildfire hazard potential data.</p>');
        }
    }

    if (wet && wet.layout.visibility == 'visible') {
        const popup = new Popup('Wildfire Exposure Type', true).loading();

        const pc = await conversion.getRasterColor(e.lngLat, 'wet'),
            val = legend.items.wet.find(i => i[2] === pc),
            desc = `A home at this location is ${val[3].toLowerCase()} to wildfire from adjacent vegetation or indirect sources (such as embers).`;

        popup.update(null, val ? `<div class="item"><div class="t">Exposure</div><div class="v">${desc}</div></div>` : '<p>Unable to retrieve wildfire hazard potential data.</p>');
    }
}

async function onMapClick(e) {
    const features = map.queryRenderedFeatures([
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
    ]);

    onRasterLayerClick(e);

    if (features.length > 0) {
        const wfClass = new utils.Wildfires();
        let clickedCounty = null,
            sources = [],
            tfrs = [],
            fire_layers = ['all_fires', 'new_fires', 'smk_fires', 'rx_fires'];

        features.forEach(feature => sources.push(feature.source));

        // highlight specific features on the map when clicked on
        Object.entries({
            ca_perimeters: 'caperim',
            aus_perimeters: 'ausperim',
            perimeters: 'perim',
            evac: 'evac',
            nri: 'nri',
            erc: 'erc'
        }).forEach(([src, selKey]) => {
            if ((!sources.includes(src) && map.getSource(src)) || selected[selKey] != null) {
                map.removeFeatureState({
                    source: src,
                    id: selected[selKey]
                });
                selected[selKey] = null;
            }
        });

        // loop through all features to see if county data is available
        for (let i = 0; i < features.length; i++) {
            if (features[i].layer.id == 'us_counties') {
                clickedCounty = features[i].properties.NAME;
                break;
            }
        }

        // loop through all features
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            const prop = feature.properties;

            // display wildfire incident
            if (fire_layers.includes(feature.source)) {
                if (feature.properties.cluster) {
                    map.zoomIn();
                } else {
                    const t = JSON.parse(prop.time);
                    const data = {
                        wfid: prop.wfid,
                        name: prop.name,
                        state: prop.state,
                        type: prop.type,
                        incidentID: prop.incidentId,
                        acres: prop.acres,
                        discovered: Number(t.discovered),
                        updated: Number(t.updated)
                    };

                    wfClass.logFire(data.wfid, data);
                    wfClass.incident(data.wfid, true);
                }

                break;
            }

            // if user has ADMIN permissions and clicked on a user-created marker, polygon, etc
            if (settings.hasPermissions(config.PERMISSION_LEVELS.ADMIN)) {
                if (config.toolsInstance != null && (feature.source == 'user-features' || feature.source == 'marker-geojson' || feature.source == 'polygon-geojson')) {
                    // TODO: if user clicks on a marker or polygon they created
                    map.easeTo({
                        center: feature.geometry.coordinates,
                        zoom: 12,
                        duration: 1000
                    });

                    break;
                }
            }

            if (feature.source == 'ca_fires') {
                const name = prop.name,
                    state = utils.stateLabels?.[prop.province]?.name,
                    time = JSON.parse(prop.time),
                    acres = prop.acres,
                    status = prop.status,
                    near = prop.near;

                map.flyTo({
                    center: feature.geometry.coordinates,
                    zoom: 10
                });

                new Popup('Canadian Wildfire').create({
                    'Incident Name': name,
                    'Start Date': dateTime(time.discovered),
                    'Province': state,
                    'Size': `${numberFormat(acres / 2.471, 2)} ha (${acres} acres)`,
                    'Status': status,
                    'Near': near
                }, `<span style="margin-top:1em;font-size:12px;color:#8d8d8d">Last update received ${timeAgo(time.updated)}</span>`);
            }

            // on canada perimeter click
            if (feature.source == 'ca_perimeters') {
                selected.caperim = feature.id;

                map.setFeatureState({
                    source: 'ca_perimeters',
                    id: selected.caperim
                }, {
                    click: true
                });

                if (settings.perimeters().zoom()) {
                    map.fitBounds(geojsonExtent(feature.geometry), {
                        padding: 60
                    });
                }

                break;
            }

            // on austrailia perimeter click
            if (feature.source == 'aus_perimeters') {
                const name = prop.fire_name,
                    size = conversion.sizeFormat(prop.area_ha * 2.471),
                    discovered = prop.ignition_date ? dateTime(prop.ignition_date, true, true) : 'Unknown',
                    updated = timeAgo(prop.capt_date),
                    istate = prop.state == 'WA' ? 'WAA' : (prop.state == 'NT' ? 'NTT' : prop.state),
                    state = utils.stateLabels?.[istate]?.name ?? istate;

                selected.ausperim = feature.id;

                map.setFeatureState({
                    source: 'aus_perimeters',
                    id: selected.ausperim
                }, {
                    click: true
                });

                new Popup('Austrailia Bushfire', true)
                    .create({
                        'Incident Name': name,
                        'State': state,
                        'Discovered': discovered,
                        'Perimeter Size': size,
                        'Last Mapped': updated
                    });

                if (settings.perimeters().zoom()) {
                    map.fitBounds(geojsonExtent(feature.geometry), {
                        padding: 60
                    });
                }

                break;
            }

            if (feature.source == 'perimeters') {
                const name = `${prop.attr_IncidentName.replace(' Fire', '').toLowerCase().ucwords()} Fire`,
                    ago = timeAgo(prop.poly_DateCurrent),
                    acres = prop.poly_Acres_AutoCalc > prop.poly_GISAcres ? prop.poly_Acres_AutoCalc : prop.poly_GISAcres,
                    size = conversion.sizeFormat(acres);

                const wfid = config.wildfire.findFire(null, prop.attr_UniqueFireIdentifier)?.properties?.wfid ?? null;

                selected.perim = feature.id;

                map.setFeatureState({
                    source: 'perimeters',
                    id: selected.perim
                }, {
                    click: true
                });

                setHeaders(
                    `Current ${name} Perimeter`,
                    `perimeter/${prop.attr_UniqueFireIdentifier}`,
                    `Current fire perimeter for the ${name} in ${utils.stateLabels[prop.attr_POOState.replace('US-', '')]?.name}.`
                );

                new Popup('Wildfire Perimeter').create({
                    'Incident Name': name,
                    'Last Mapped': ago,
                    'Perimeter Size': size
                }, wfid ? `<a href="#" class="popup-btn" data-action="popupToInc" data-wfid="${wfid}">View fire details</a>` : null);

                if (settings.perimeters().zoom()) {
                    map.fitBounds(geojsonExtent(feature.geometry), {
                        padding: 60
                    });
                }

                break;
            }

            // fire department and hospital locations
            if (feature.source == 'firemed') {
                const cityState = `${prop.CITY}, ${prop.STATE} ${prop.ZIPCODE}`,
                    type = prop.type == 'hosp' ? 'Hospital' : (prop.type == 'ems' ? 'Emergency Medical Services' : 'Fire Department');

                new Popup('Emergency Response').create({
                    Type: type,
                    Name: prop.NAME,
                    Address: prop.ADDRESS,
                    'City/State': cityState
                });

                break;
            }

            // TFRs
            if (feature.source == 'tfrs') {
                tfrs.push(feature);
            }

            // on air quality click
            if (feature.source == 'airq') {
                const aqi = prop.PM25_AQI,
                    d = new Weather().airQDesc(aqi),
                    ago = timeAgo(new Date(prop.LocalTimeString).getTime());

                new Popup('Air Quality', true)
                    .create({
                        'Station Name': prop.SiteName,
                        'Air Quality Index': `<b>${aqi}</b>&nbsp;&ndash;&nbsp;${d.quality}`,
                        'Concentration': `${prop.PM25} µg/m³`,
                        'Details': d.desc,
                        'Last Reported': ago
                    })
                    .link(`https://www.airnow.gov/?reportingArea=${prop.ReportingArea_PipeDelimited}&stateCode=${prop.StateName}`);

                break;
            }

            // on wwas click
            if (feature.source == 'wwas') {
                new utils.NWS().find(e.lngLat.lat, e.lngLat.lng);
                break;
            }

            // on SPC outlook click
            if (feature.source == 'outlook') {
                const color = (prop.fill == '#66A366' || prop.fill == '#ff3333' ? '#fff' : '#242424');

                new Popup(`${(settings.special().otlkType() == 'severe' ? 'Severe' : 'Fire')} Weather Outlook - Day ${settings.special().otlkDay()}`)
                    .create({
                        Risk: `<span class="spc" style="background-color:${prop.fill};color:${color}">${prop.name}</span>`,
                        Issued: dateTime(prop.issue, true, true),
                        'Forecast Valid': dateTime(prop.valid, true, true),
                        'Valid Until': dateTime(prop.expires, true, true)
                    },
                        `<a href="#" data-action="readSPC" data-type="${settings.special().otlkType()}" data-day="${settings.special().otlkDay()}" onclick="return false" class="popup-btn">Read the forecast</a>`
                    );

                break;
            }

            /* modis heat spot click
            if (modis_layers.includes(feature.source)) {
                new Popup('Satellite-Detected Hotspot').create({
                    Detected: timeAgo(prop.acq_time),
                    'Day or Night': prop.daynight == 'D' ? 'Day' : 'Night',
                    Satellite: `modis/${prop.satellite}`,
                    Confidence: prop.confidence.ucfirst(),
                    Fire Radiative Power: `${prop.frp} megawatts`
                });

                break;
            }*/

            // ERC PSA click
            if (feature.source == 'erc') {
                const psa = prop.PSANAME,
                    code = prop.PSANationalCode,
                    obs_pct = prop.avg_erc_percentile,
                    obs_trend = prop.avg_erc_trend.replace('ase', 'asing'),
                    fcst_pct = prop.avg_erc_fcast_percentile,
                    fcst_trend = prop.avg_erc_fcast_trend.replace('ase', 'asing'),
                    chart = prop.ERC_Chart_URL,
                    time = `${prop.update_time.substring(0, 2)}:${prop.update_time.substring(2, 4)}`,
                    dt = dateTime(new Date(`${prop.update_date} ${time} UTC`).getTime(), true);

                const isObs = settings.special().erc() == null || settings.special().erc() === 'obs';

                const popup = new Popup('')
                    .loading('<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting ERC data...</p>')
                    .update('Energy Release Component', {
                        'ERC Date': `${isObs ? 'Today' : 'Tomorrow'} (${dateTime(Date.now() + (isObs ? 0 : 86400000))})`,
                        'Area (PSA)': psa,
                        'PSA Code': settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? code : null,
                        'Current ERC Value': prop.avg_erc,
                        'ERC Percentile': `${isObs ? obs_pct : fcst_pct}%`,
                        'ERC Trend': isObs ? obs_trend : fcst_trend,
                        'NFDRS Obs Date': dt
                    });

                if (chart != null && chart != '') popup.link(chart, 'View ERC Chart');

                selected.erc = feature.id;

                map.setFeatureState({
                    source: 'erc',
                    id: selected.erc
                }, {
                    click: true
                });

                break;
            }

            // PNW EVACUATION VULNERABILITY
            if (feature.source == 'ev') {
                const rank = (v) => {
                    if (v <= 174) return 'Severe';
                    if (v > 174 && v <= 348) return 'High';
                    if (v > 348 && v <= 522) return 'Moderate';
                    return 'Minimal';
                };

                new Popup('Evacuation Vulnerability').create({
                    'City': prop.City,
                    'State': utils.stateLabels[prop.State].name,
                    'Rank': `${prop.Overall_Vu} of 696`,
                    'Vulnerability': `${(prop.Overall_Vu / 6.96).toFixed(1)}/100 (<b>${rank(prop.Overall_Vu)}</b>)`
                });
            }

            // FEMA NRI click
            if (feature.source == 'nri') {
                const name = `${prop.COUNTY} County, ${prop.STATEABBRV}`,
                    value = {
                        build: numberFormat(prop.BUILDVALUE, 0),
                        ag: numberFormat(prop.AGRIVALUE, 0)
                    },
                    pop = numberFormat(prop.POPULATION, 0),
                    psm = numberFormat(prop.POPULATION / prop.AREA, 1),
                    risk = prop.WFIR_RISKR,
                    score = parseFloat(prop.WFIR_RISKS).toFixed(1);

                new Popup('FEMA Risk Index').create({
                    Location: name,
                    'Wildfire Risk': risk,
                    'Wildfire Risk Score': `${score}/100`,
                    'Population': pop,
                    'People/Square Mile': psm,
                    'Agricultural Value': `$${value.ag}`,
                    'Building Values': `$${value.build}`
                }).link('https://www.fema.gov/flood-maps/products-tools/national-risk-index', 'Learn about NRI');

                selected.nri = feature.id;

                map.setFeatureState({
                    source: 'nri',
                    id: selected.nri
                }, { click: true });

                break;
            }

            // on ODF fire danger areas click
            if (feature.source == 'odfFDR') {
                let danger = '',
                    ifpl = prop.ifplrestrictionlevel ? prop.ifplrestrictionlevel : 'N/A';

                switch (prop.firedanger) {
                    case 1: danger = 'Low'; break;
                    case 2: danger = 'Moderate'; break;
                    case 3: danger = 'High'; break;
                    case 4: danger = 'Extreme'; break;
                    default: danger = 'N/A'; break;
                }

                new Popup('ODF Fire Danger').create({
                    District: utils.ODF_DISTRICT_NAMES[prop.regusearea],
                    'Reg. Use Area': prop.regusearea,
                    'Fire Danger': danger,
                    'IFPL': ifpl
                });

                break;
            }

            // on CAL FIRE FHSZ click
            if (feature.source == 'cdfFHSZ') {
                const level = prop.FHSZ;
                const desc = level == 1 ? 'Moderate' : (level == 2 ? 'High' : 'Very High');

                new Popup('Fire Hazard Severity Zone').create({
                    County: clickedCounty,
                    FHSZ: desc
                });

                break;
            }

            // on drought click
            if (feature.source == 'drought') {
                let level;
                switch (prop.dm) {
                    case 0:
                        level = 'Abnormally Dry';
                        break;
                    case 1:
                        level = 'Moderate Drought';
                        break;
                    case 2:
                        level = 'Severe Drought';
                        break;
                    case 3:
                        level = 'Extreme Drought';
                        break;
                    case 4:
                        level = 'Exceptional Drought';
                        break;
                }

                new Popup('Drought Monitor').create({
                    'Drought Level': level,
                    'Last Updated': timeAgo(prop.ddate)
                });
            }

            // on weather stations click
            if (feature.source == 'stns') {
                new Weather().currentConds(feature.properties);
                break;
            }

            // on oregon evacuations click
            if (feature.source == 'evac') {
                const d = prop.level == 1 ? 'Be Ready' : prop.level == 2 ? 'Be SET' : 'GO NOW',
                    n = prop.notes,
                    u = timeAgo(prop.updated);

                new Popup('Evacuations').create({
                    Level: `<span class="evac-circ l${prop.level}"></span>Level ${prop.level}`,
                    Status: d,
                    [prop.county ? 'County' : 'State']: (prop.county ? `${prop.county} County, ${prop.state}` : utils.stateLabels[prop.state].name),
                    'Last Updated': u,
                    Notes: n
                });

                map.fitBounds(geojsonExtent(feature.geometry), {
                    padding: 60
                });

                selected.evac = feature.id;

                map.setFeatureState({
                    source: 'evac',
                    id: selected.evac
                }, {
                    click: true
                });

                break;
            }
        }

        // if there are any TFRs clicked on, show that info
        if (tfrs.length) {
            const content = [];

            tfrs.sort((a, b) => b.properties.issued - a.properties.issued)
                .forEach(ea => {
                    const prop = ea.properties;
                    const airspace = JSON.parse(prop.airspace);
                    const artcc = JSON.parse(prop.artcc);
                    const time = JSON.parse(prop.valid);
                    const alt = `From ${airspace.altitude[0] == '0 ft' ? 'the surface' : airspace.altitude[0]} up to 
                    ${airspace.upper ? 'and including' : ''} ${airspace.altitude[1]} MSL`;

                    const utc = (unix) => new Intl.DateTimeFormat('en-US', {
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZoneName: 'short'
                    }).format(new Date(unix * 1000)).replace(/,(?=\s\d{2}:\d{2})\s/, ' at ');

                    content.push(`<div class="tfrs">
                    <a href="https://tfr.faa.gov/tfr3/?page=detail_${prop.id.replace('/', '_')}" target="blank"><h4>TFR ${prop.id}</h4></a>
                    <div class="row">
                        <b>Issued</b>
                        <p>${utc(prop.issued)}</p>
                    </div>
                    <div class="row">
                        <b>Effective Date(s)</b>
                        <p>From ${utc(time.from)} to ${utc(time.to)}</p>
                    </div>
                    <div class="row">
                        <b>Location</b>
                        <p>${prop.location}</p>
                    </div>
                    <div class="row">
                        <b>Purpose</b>
                        <p>${prop.purpose}</p>
                    </div>
                    <div class="row">
                        <b>Altitude</b>
                        <p>${alt}</p>
                    </div>
                    <div class="row" style="color:var(--blue-gray)">
                        <b>Contact</b>
                        <p>${artcc.name} Center (${artcc.id}), Phone ${artcc.phone}, Frequency ${artcc.freq}</p>
                    </div>
                </div>`);
                });

            createDataForm('TFRs', `<p class="updated" style="text-align:left;color:#555">Refer to the FAA website for official airspace information.</p>${content.join('')}`);
        }
    }
}

window.addEventListener('submit', async (e) => {
    // submit user NEW INCIDENT form
    if (e.target.id == 'newReport') {
        e.preventDefault();

        const form = document.querySelector('form#newReport');
        let error = false,
            errorMsg = '';

        document.querySelector('#nrerrors')?.remove();

        // error checking
        if (form.querySelector('select[name=type]').options[form.querySelector('select[name=type]').selectedIndex].value == '- Choose -') {
            error = true;
            errorMsg += '<li>Please choose an incident type</li>';
        }

        if (form.querySelector('input[name=size]').value == '') {
            error = true;
            errorMsg += '<li>Please estimate the size of the fire (even if it\'s 0)</li>';
        } else if (!form.querySelector('input[name=size]').value.match(/([0-9.]+)/)) {
            error = true;
            errorMsg += '<li>Your incident size cannot contain non-numeric characters</li>'
        }

        if (form.querySelector('textarea[name=notes]').value == '') {
            error = true;
            errorMsg += '<li>Please provide some details about this incident</li>';
        }

        if (error === true) {
            form.insertAdjacentHTML('afterbegin', `<ul id="nrerrors" style="margin: 0 0 1em 1em;font-size:14px;color:var(--red)">${errorMsg}</ul>`);
        } else {
            if (confirm('Are you sure this is a new incident? If so, click "OK." Otherwise, please click "Cancel."')) {
                const sub = form.querySelector('input[type=submit]'),
                    canc = form.querySelector('.btn-group a'),
                    fd = [],
                    ent = new URLSearchParams(new FormData(form).entries());

                let type, state;

                document.querySelector('li#report').dataset.active = '0';
                sub.disabled = true;
                sub.value = 'Submitting...';
                canc.style.display = 'none';

                for (const [key, value] of ent) {
                    fd.push([key, value]);
                    if (key == 'type') type = value;
                    if (key == 'state') state = value;
                }

                const send = await api(`${ENV.apiURL}newReport`, fd);

                if (send.success == 1) {
                    gtag('event', 'submit_report', {
                        type: type,
                        state: state.split(' / ')[1],
                        platform: 'web'
                    });

                    setTimeout(async () => {
                        document.querySelector('#data-form').remove();
                        utils.notify('success', 'Your report was sent to us for review before it may be added to the map.');
                    }, 500);
                } else {
                    sub.disabled = false;
                    sub.value = 'Submit Report';
                    canc.style.display = 'block';

                    utils.notify('error', 'There was an error submitting your report. Please try again.');
                }
            }
        }
    }
});

window.addEventListener('input', (e) => {
    // perimeter min size change text
    if (e.target.parentElement.id == 'perimeterSize' && e.target.classList.contains('slider')) {
        document.querySelector('#pSize').innerHTML = `${e.target.value} acres`;
    }
});

window.addEventListener('change', (e) => {
    const target = e.target,
        actionElement = target.closest('[data-action]'),
        action = actionElement ? actionElement.dataset.action : null,
        changeListener = new ChangeListener(target),
        actionHandlers = {
            'change-basemap': () => changeListener.changeBasemap(),
            'change-perim-size': () => changeListener.minPerimSize(),
            'toggle-layer': () => changeListener.toggle(),
            'erc_time': () => {
                settings.updateSpecial();
                config.layersHandler.erc(false, true);
            },
            'sfc_smoke_time': () => changeListener.smoke(true),
            'vi_smoke_time': () => changeListener.smoke(false),
            'spc-outlook': () => changeListener.spc(),
            'ndfd': async () => {
                settings.updateSpecial();
                new utils.NWS().ndfd(true, target.id);
            },
            'spcDates': () => changeListener.spcClimo(),
            'sfp-date': () => {
                settings.updateSpecial();
                config.layersHandler.sfp(true);
            },
            'user-setting': () => changeListener.personalize(),
            'archive_years': () => changeListener.archive()
        };

    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }
});