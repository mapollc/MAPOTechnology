!function (e) { if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var n; "undefined" != typeof window ? n = window : "undefined" != typeof global ? n = global : "undefined" != typeof self && (n = self), n.geojsonExtent = e() } }(function () { return function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = "function" == typeof require && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } for (var i = "function" == typeof require && require, o = 0; o < r.length; o++)s(r[o]); return s }({ 1: [function (require, module, exports) { function getExtent(_) { for (var ext = extent(), coords = geojsonCoords(_), i = 0; i < coords.length; i++)ext.include(coords[i]); return ext } var geojsonCoords = require("@mapbox/geojson-coords"), traverse = require("traverse"), extent = require("@mapbox/extent"), geojsonTypesByDataAttributes = { features: ["FeatureCollection"], coordinates: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"], geometry: ["Feature"], geometries: ["GeometryCollection"] }, dataAttributes = Object.keys(geojsonTypesByDataAttributes); module.exports = function (_) { return getExtent(_).bbox() }, module.exports.polygon = function (_) { return getExtent(_).polygon() }, module.exports.bboxify = function (_) { return traverse(_).map(function (value) { if (value) { var isValid = dataAttributes.some(function (attribute) { return value[attribute] ? -1 !== geojsonTypesByDataAttributes[attribute].indexOf(value.type) : !1 }); isValid && (value.bbox = getExtent(value).bbox(), this.update(value)) } }) } }, { "@mapbox/extent": 2, "@mapbox/geojson-coords": 4, traverse: 7 }], 2: [function (require, module, exports) { function Extent(bbox) { return this instanceof Extent ? (this._bbox = bbox || [1 / 0, 1 / 0, -(1 / 0), -(1 / 0)], void (this._valid = !!bbox)) : new Extent(bbox) } module.exports = Extent, Extent.prototype.include = function (ll) { return this._valid = !0, this._bbox[0] = Math.min(this._bbox[0], ll[0]), this._bbox[1] = Math.min(this._bbox[1], ll[1]), this._bbox[2] = Math.max(this._bbox[2], ll[0]), this._bbox[3] = Math.max(this._bbox[3], ll[1]), this }, Extent.prototype.equals = function (_) { var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] == other[0] && this._bbox[1] == other[1] && this._bbox[2] == other[2] && this._bbox[3] == other[3] }, Extent.prototype.center = function (_) { return this._valid ? [(this._bbox[0] + this._bbox[2]) / 2, (this._bbox[1] + this._bbox[3]) / 2] : null }, Extent.prototype.union = function (_) { this._valid = !0; var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] = Math.min(this._bbox[0], other[0]), this._bbox[1] = Math.min(this._bbox[1], other[1]), this._bbox[2] = Math.max(this._bbox[2], other[2]), this._bbox[3] = Math.max(this._bbox[3], other[3]), this }, Extent.prototype.bbox = function () { return this._valid ? this._bbox : null }, Extent.prototype.contains = function (ll) { if (!ll) return this._fastContains(); if (!this._valid) return null; var lon = ll[0], lat = ll[1]; return this._bbox[0] <= lon && this._bbox[1] <= lat && this._bbox[2] >= lon && this._bbox[3] >= lat }, Extent.prototype.intersect = function (_) { if (!this._valid) return null; var other; return other = _ instanceof Extent ? _.bbox() : _, !(this._bbox[0] > other[2] || this._bbox[2] < other[0] || this._bbox[3] < other[1] || this._bbox[1] > other[3]) }, Extent.prototype._fastContains = function () { if (!this._valid) return new Function("return null;"); var body = "return " + this._bbox[0] + "<= ll[0] &&" + this._bbox[1] + "<= ll[1] &&" + this._bbox[2] + ">= ll[0] &&" + this._bbox[3] + ">= ll[1]"; return new Function("ll", body) }, Extent.prototype.polygon = function () { return this._valid ? { type: "Polygon", coordinates: [[[this._bbox[0], this._bbox[1]], [this._bbox[2], this._bbox[1]], [this._bbox[2], this._bbox[3]], [this._bbox[0], this._bbox[3]], [this._bbox[0], this._bbox[1]]]] } : null } }, {}], 3: [function (require, module, exports) { module.exports = function (list) { function _flatten(list) { return Array.isArray(list) && list.length && "number" == typeof list[0] ? [list] : list.reduce(function (acc, item) { return Array.isArray(item) && Array.isArray(item[0]) ? acc.concat(_flatten(item)) : (acc.push(item), acc) }, []) } return _flatten(list) } }, {}], 4: [function (require, module, exports) { var geojsonNormalize = require("@mapbox/geojson-normalize"), geojsonFlatten = require("geojson-flatten"), flatten = require("./flatten"); module.exports = function (_) { if (!_) return []; var normalized = geojsonFlatten(geojsonNormalize(_)), coordinates = []; return normalized.features.forEach(function (feature) { feature.geometry && (coordinates = coordinates.concat(flatten(feature.geometry.coordinates))) }), coordinates } }, { "./flatten": 3, "@mapbox/geojson-normalize": 5, "geojson-flatten": 6 }], 5: [function (require, module, exports) { function normalize(gj) { if (!gj || !gj.type) return null; var type = types[gj.type]; return type ? "geometry" === type ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: gj }] } : "feature" === type ? { type: "FeatureCollection", features: [gj] } : "featurecollection" === type ? gj : void 0 : null } module.exports = normalize; var types = { Point: "geometry", MultiPoint: "geometry", LineString: "geometry", MultiLineString: "geometry", Polygon: "geometry", MultiPolygon: "geometry", GeometryCollection: "geometry", Feature: "feature", FeatureCollection: "featurecollection" } }, {}], 6: [function (require, module, exports) { module.exports = function e(t) { switch (t && t.type || null) { case "FeatureCollection": return t.features = t.features.reduce(function (t, r) { return t.concat(e(r)) }, []), t; case "Feature": return t.geometry ? e(t.geometry).map(function (e) { var r = { type: "Feature", properties: JSON.parse(JSON.stringify(t.properties)), geometry: e }; return void 0 !== t.id && (r.id = t.id), r }) : [t]; case "MultiPoint": return t.coordinates.map(function (e) { return { type: "Point", coordinates: e } }); case "MultiPolygon": return t.coordinates.map(function (e) { return { type: "Polygon", coordinates: e } }); case "MultiLineString": return t.coordinates.map(function (e) { return { type: "LineString", coordinates: e } }); case "GeometryCollection": return t.geometries.map(e).reduce(function (e, t) { return e.concat(t) }, []); case "Point": case "Polygon": case "LineString": return [t] } } }, {}], 7: [function (require, module, exports) { function Traverse(obj) { this.value = obj } function walk(root, cb, immutable) { var path = [], parents = [], alive = !0; return function walker(node_) { function updateState() { if ("object" == typeof state.node && null !== state.node) { state.keys && state.node_ === state.node || (state.keys = objectKeys(state.node)), state.isLeaf = 0 == state.keys.length; for (var i = 0; i < parents.length; i++)if (parents[i].node_ === node_) { state.circular = parents[i]; break } } else state.isLeaf = !0, state.keys = null; state.notLeaf = !state.isLeaf, state.notRoot = !state.isRoot } var node = immutable ? copy(node_) : node_, modifiers = {}, keepGoing = !0, state = { node: node, node_: node_, path: [].concat(path), parent: parents[parents.length - 1], parents: parents, key: path.slice(-1)[0], isRoot: 0 === path.length, level: path.length, circular: null, update: function (x, stopHere) { state.isRoot || (state.parent.node[state.key] = x), state.node = x, stopHere && (keepGoing = !1) }, "delete": function (stopHere) { delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, remove: function (stopHere) { isArray(state.parent.node) ? state.parent.node.splice(state.key, 1) : delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, keys: null, before: function (f) { modifiers.before = f }, after: function (f) { modifiers.after = f }, pre: function (f) { modifiers.pre = f }, post: function (f) { modifiers.post = f }, stop: function () { alive = !1 }, block: function () { keepGoing = !1 } }; if (!alive) return state; updateState(); var ret = cb.call(state, state.node); return void 0 !== ret && state.update && state.update(ret), modifiers.before && modifiers.before.call(state, state.node), keepGoing ? ("object" != typeof state.node || null === state.node || state.circular || (parents.push(state), updateState(), forEach(state.keys, function (key, i) { path.push(key), modifiers.pre && modifiers.pre.call(state, state.node[key], key); var child = walker(state.node[key]); immutable && hasOwnProperty.call(state.node, key) && (state.node[key] = child.node), child.isLast = i == state.keys.length - 1, child.isFirst = 0 == i, modifiers.post && modifiers.post.call(state, child), path.pop() }), parents.pop()), modifiers.after && modifiers.after.call(state, state.node), state) : state }(root).node } function copy(src) { if ("object" == typeof src && null !== src) { var dst; if (isArray(src)) dst = []; else if (isDate(src)) dst = new Date(src.getTime ? src.getTime() : src); else if (isRegExp(src)) dst = new RegExp(src); else if (isError(src)) dst = { message: src.message }; else if (isBoolean(src)) dst = new Boolean(src); else if (isNumber(src)) dst = new Number(src); else if (isString(src)) dst = new String(src); else if (Object.create && Object.getPrototypeOf) dst = Object.create(Object.getPrototypeOf(src)); else if (src.constructor === Object) dst = {}; else { var proto = src.constructor && src.constructor.prototype || src.__proto__ || {}, T = function () { }; T.prototype = proto, dst = new T } return forEach(objectKeys(src), function (key) { dst[key] = src[key] }), dst } return src } function toS(obj) { return Object.prototype.toString.call(obj) } function isDate(obj) { return "[object Date]" === toS(obj) } function isRegExp(obj) { return "[object RegExp]" === toS(obj) } function isError(obj) { return "[object Error]" === toS(obj) } function isBoolean(obj) { return "[object Boolean]" === toS(obj) } function isNumber(obj) { return "[object Number]" === toS(obj) } function isString(obj) { return "[object String]" === toS(obj) } var traverse = module.exports = function (obj) { return new Traverse(obj) }; Traverse.prototype.get = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) { node = void 0; break } node = node[key] } return node }, Traverse.prototype.has = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) return !1; node = node[key] } return !0 }, Traverse.prototype.set = function (ps, value) { for (var node = this.value, i = 0; i < ps.length - 1; i++) { var key = ps[i]; hasOwnProperty.call(node, key) || (node[key] = {}), node = node[key] } return node[ps[i]] = value, value }, Traverse.prototype.map = function (cb) { return walk(this.value, cb, !0) }, Traverse.prototype.forEach = function (cb) { return this.value = walk(this.value, cb, !1), this.value }, Traverse.prototype.reduce = function (cb, init) { var skip = 1 === arguments.length, acc = skip ? this.value : init; return this.forEach(function (x) { this.isRoot && skip || (acc = cb.call(this, acc, x)) }), acc }, Traverse.prototype.paths = function () { var acc = []; return this.forEach(function (x) { acc.push(this.path) }), acc }, Traverse.prototype.nodes = function () { var acc = []; return this.forEach(function (x) { acc.push(this.node) }), acc }, Traverse.prototype.clone = function () { var parents = [], nodes = []; return function clone(src) { for (var i = 0; i < parents.length; i++)if (parents[i] === src) return nodes[i]; if ("object" == typeof src && null !== src) { var dst = copy(src); return parents.push(src), nodes.push(dst), forEach(objectKeys(src), function (key) { dst[key] = clone(src[key]) }), parents.pop(), nodes.pop(), dst } return src }(this.value) }; var objectKeys = Object.keys || function (obj) { var res = []; for (var key in obj) res.push(key); return res }, isArray = Array.isArray || function (xs) { return "[object Array]" === Object.prototype.toString.call(xs) }, forEach = function (xs, fn) { if (xs.forEach) return xs.forEach(fn); for (var i = 0; i < xs.length; i++)fn(xs[i], i, xs) }; forEach(objectKeys(Traverse.prototype), function (key) { traverse[key] = function (obj) { var args = [].slice.call(arguments, 1), t = new Traverse(obj); return t[key].apply(t, args) } }); var hasOwnProperty = Object.hasOwnProperty || function (obj, key) { return key in obj } }, {}] }, {}, [1])(1) });

class NearbyEvacuations {
    constructor(y, x) {
        this.bufferMiles = 25;
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
        const px = this.x, py = this.y;
        const vx = v[0], vy = v[1];
        const wx = w[0], wy = w[1];

        const t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) /
            ((wx - vx) ** 2 + (wy - vy) ** 2);

        if (t < 0) return distToV;
        if (t > 1) return distToW;

        const projX = vx + t * (wx - vx);
        const projY = vy + t * (wy - vy);

        return conversion.distance(this.y, this.x, projY, projX);
    }

    isPointInPolygon(polygon) {
        let inside = false;
        const [x, y] = this.point;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const intersect = yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    isPointNearPolygon(polygon) {
        if (this.isPointInPolygon(polygon)) return true;
        for (let i = 0; i < polygon.length; i++) {
            const v = polygon[i];
            const w = polygon[(i + 1) % polygon.length];
            if (this.distanceToSegmentMiles(v, w) <= this.bufferMiles) return true;
        }
        return false;
    }

    get() {
        return new Promise((resolve, reject) => {
            if (evacsLoaded) {
                resolve(this.process());
            } else {
                const loop = setInterval(() => {
                    if (evacsLoaded) {
                        clearInterval(loop);
                        resolve(this.process());
                    }
                }, 500);
            }
        });
    }

    process() {
        let active = null,
            grouped = {};

        activeEvacuations.forEach(feature => {
            const geom = feature.geometry;
            let fnotes = '',
                polygons = [];

            if (geom.type === "Polygon") {
                polygons = [geom.coordinates[0]];
            } else if (geom.type === "MultiPolygon") {
                polygons = geom.coordinates.flat();
            }

            const isNear = polygons.some(ring =>
                this.isPointNearPolygon(ring)
            );

            if (isNear) {
                const level = feature.properties.level,
                    notes = feature.properties.notes || "",
                    county = feature.properties.county || "";

                if (!grouped[level]) {
                    grouped[level] = {
                        level: level,
                        notes: new Set(),
                        counties: new Set()
                    };
                }

                if (notes.search('Evac Zone Name') >= 0) {
                    fnotes = RegExp(/Evac Zone Name: (.*?)\s\//gm).exec(notes)[1]
                }

                grouped[level].notes.add(fnotes);
                grouped[level].counties.add(county);
            }
        });

        active = Object.values(grouped).map(group => ({
            level: group.level,
            notes: Array.from(group.notes),
            counties: Array.from(group.counties),
        }));

        return active;
    }
}

class Popup {
    constructor(title, tall = false) {
        this.header = '<div class="header"' + (!title ? ' style="margin-bottom:0"' : '') + '><h1>' + title + '</h1><span id="close-popup" data-action="close-popup" title="Close popup" class="far fa-xmark-large"></span></div>';
        this.tall = tall;
        this.dialog = null;

        if (isVisible('#modal')) new ClickListener().closeModal();
    }

    create(content) {
        this.close();

        const pop = document.createElement('div');
        pop.classList.add('popup');
        if (this.tall) {
            pop.classList.add('tall');
        }
        pop.innerHTML = `<div class="content">${this.header}<div class="data">${content}</div></div>`;

        this.dialog = pop;
        this.open();

        return this;
    }

    update(content, title = null) {
        if (title) {
            const h = this.dialog.querySelector('.header h1');
            h.innerHTML = title;
            h.parentElement.removeAttribute('style');
        }

        this.dialog.querySelector('.content .data').innerHTML = content;
    }

    open() {
        document.body.appendChild(this.dialog);
    }

    close() {
        if (document.querySelector('.popup') != null) {
            document.querySelector('.popup').remove();


        }
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
                if (!settings.isEnabled('stns')) config.layerActions['stns'].exe();

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
        setHeaders('Current Fire Weather at ' + p.NAME, 'weather/current/' + p.STID, 'See current fire weather conditions at ' + p.NAME + '.');

        const hasPermissions = settings.hasPermissions('PRO'),
            popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>');

        let obs = typeof p.OBSERVATIONS === 'string' ? JSON.parse(p.OBSERVATIONS) : p.OBSERVATIONS,
            t = obs.air_temp_value_1.value,
            rh = obs.relative_humidity_value_1.value,
            wetBulb = conversion.wetBulb(t, rh),
            wd = obs.wind_direction_value_1.value ? conversion.getCompassDirection(obs.wind_direction_value_1.value) : 'Variable',
            ws = obs.wind_speed_value_1.value,
            feelsLike = (t < 60 && ws ? conversion.windChill(t, ws) : (t && rh ? conversion.heatIndex(t, rh) : null)),
            tunit = 'F',
            wunit = 'mph';

        /* format temperature */
        if (settings.weather()?.temp() == 'c' && t != null) {
            tunit = 'C';
            t = conversion.FtoC(t);
            feelsLike = feelsLike != null ? conversion.FtoC(feelsLike).toFixed(1) : null;
        } else {
            feelsLike = feelsLike != null ? Math.round(conversion.FtoC(feelsLike)) : null;
            t = Math.round(t);
        }

        /* format wind speed */
        if (settings.weather()?.wind() != 'mph' && ws != null) {
            ws = ws != null ? conversion.speed(ws, settings.weather().wind()) : null;
            wunit = settings.weather().wind();
        }

        const stnData = `<div class="item"><div class="t">Station Name</div><div class="v">${p.NAME}</div></div>
            <div class="item"><div class="t">Temperature</div><div class="v">${Math.round(t)}&deg;${tunit}</div></div>
            <div class="item"><div class="t">Feels Like</div><div class="v">${feelsLike != null ? `${feelsLike}&deg;${tunit}` : 'N/A'}</div></div>
            <div class="item"><div class="t">Wet-Bulb Temp.</div><div class="v">${wetBulb != null ? `${wetBulb.toFixed(1)}&deg;${tunit}` : 'N/A'}</div></div>
            <div class="item"><div class="t">Humidity</div><div class="v">${Math.round(rh)}%</div></div>
            <div class="item"><div class="t">Wind</div><div class="v">${(ws != null ? (ws == 0 ? 'Calm' : `${wd} at ${Math.round(ws)} ${wunit}`) : 'N/A')}</div></div>
            <div class="item"><div class="t">Last report</div><div class="v">${timeAgo(new Date(obs.air_temp_value_1.date_time).getTime())}</div></div>
            ${(!hasPermissions ? `<a href="${config.purchaseLink('wx_stn')}" class="btn btn-sm btn-yellow" style="display:block;margin:0 auto">Upgrade to see more data</a>` : '')}`;

        popup.update(stnData, 'Current Conditions');
    }

    windIndicator(d) {
        return '<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(' + d + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>';
    }

    fireWxFcst() {
        new ClickListener().openModal('wwa');

        setHeaders('Daily Fire Weather Forecast for ' + this.lat + ', ' + this.lon, 'weather/forecast/' + this.lat + ',' + this.lon,
            'Daily fire weather forecast from the National Weather Service for ' + this.lat + ', ' + this.lon + '.');

        if (config.workers.fwf == null) {
            config.workers.fwf = new Worker(config.specificURL + (debugMode ? 'v' + version + '/fwf.js' : 'src/js/fwf-' + version + '.js'));
        }

        config.workers.fwf.postMessage({
            lat: this.lat,
            lon: this.lon,
            units: {
                temp: settings.weather().temp() ? settings.weather().temp() : 'f',
                wind: settings.weather().wind() ? settings.weather().wind() : 'mph'
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

        try {
            const wx = await api(config.apiURL + 'weather/nearby', [['radius', this.lat + ',' + this.lon + ',30'], ['latest', 1]]);

            if (wx.weather) {
                let o = wx.weather.obs,
                    name = wx.weather.name,
                    t = (o.temp.current ? Math.round(o.temp.current) : '--'),
                    rh = (o.rh ? Math.round(o.rh) : '--'),
                    wd = (o.wind_dir ? o.wind_dir : '--'),
                    ws = (o.wind_speed ? Math.round(o.wind_speed) : '--'),
                    u = timeAgo(wx.weather.updated),
                    tunit = 'F',
                    wunit = 'mph';

                /* format temperature */
                if (settings.weather()?.temp() == 'c' && t != '--') {
                    t = conversion.FtoC(t).toFixed(1);
                    tunit = 'C';
                }

                /* format wind speed */
                if (settings.weather()?.wind() != 'mph' && ws != '--') {
                    ws = conversion.speed(ws, settings.weather().wind());
                    wunit = settings.weather().wind();
                }

                const t1 = document.querySelector('#curwx #a h4'),
                    rh1 = document.querySelector('#curwx #b h4'),
                    w1 = document.querySelector('#curwx #c h4'),
                    up = document.querySelector('#curwx .updated');

                if (t1 && rh1 && w1) {
                    t1.innerHTML = `${t}&deg;${tunit}`;
                    rh1.innerHTML = (!o.rh || rh == '--' ? '--' : rh + '%');
                    //w1.querySelector('svg').style.transform = 'rotate(' + rwd + 'deg)';
                    w1.innerHTML = `${wd} @ ${ws} ${ws != '--' ? wunit : ''}`;
                    //w1.setAttribute('title', 'Winds are ' + wd + ' at ' + ws);

                    up.innerHTML = `Last report ${u}${settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? ' @ ' + name : ''}`;
                }
            } else {
                console.error('There is an error getting current conditions', error);

                if (holder != null) {
                    holder.innerHTML = '<h2>Nearby Weather Conditions</h2><div class="message error">No current weather conditions are available near this incident.</div>';
                }
            }
        } catch (error) {
            console.error('There is an error getting current conditions', error);

            if (holder != null) {
                holder.innerHTML = '<h2>Nearby Weather Conditions</h2><div class="message error">No current weather conditions are available near this incident.</div>';
            }
        }
    }

    async incidentForecast() {
        const holder = document.querySelector('#fcstwx'),
            now = Date.now(),
            pref = settings.weather() || {},
            isMetric = pref.temp?.() === 'c',
            wUnit = pref.wind?.() || 'mph',
            formatWind = (val) => {
                if (!isFinite(val)) return '--';
                const converted = wUnit !== 'mph' ? conversion.speed(Math.round(val), wUnit) : Math.round(val);
                return `${converted} ${wUnit}`;
            }

        try {
            const ap = await api(`https://api.weather.gov/points/${this.lat.toFixed(4)},${this.lon.toFixed(4)}`);
            const { properties: prop } = await api(ap.properties.forecastGridData);

            if (!prop.temperature) throw new Error('No temp data');

            const validIndices = prop.temperature.values
                .map((v, i) => ({ t: new Date(v.validTime.split('/')[0]).getTime(), i }))
                .filter(item => item.t >= now && item.t - now < 86400000)
                .map(item => item.i);
            const tempArray = validIndices.map(i => prop.temperature.values[i].value),
                rhArray = validIndices.map(i => prop.relativeHumidity.values[i].value),
                windArray = validIndices.filter(i => prop.windSpeed.values[i]).map(i => prop.windSpeed.values[i].value);

            let maxT = Math.max(...tempArray) * 1.8 + 32,
                minRH = Math.min(...rhArray),
                avgW = (windArray.reduce((a, b) => a + b, 0) / windArray.length) / 1.609,
                maxW = Math.max(...windArray) / 1.609;

            const displayT = isMetric ? `${conversion.FtoC(maxT).toFixed(1)}&deg;C` : `${Math.round(maxT)}&deg;F`,
                displayAvgW = formatWind(avgW),
                displayMaxW = formatWind(maxW);

            // 5. Update DOM
            const q = (sel) => modal.querySelector(`#fcstwx ${sel}`);
            q('#a h4').innerHTML = displayT;
            q('#b h4').innerHTML = `${minRH}%`;
            q('#c h4').innerHTML = displayAvgW;
            q('#d h4').innerHTML = displayMaxW;
            q('.updated').innerHTML = `Last forecasted ${timeAgo(new Date(prop.updateTime).getTime())}`;

            // 6. Premium Button Logic
            const isPremium = settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM);
            const btnHtml = isPremium
                ? `<a href="#" class="btn btn-orange btn-sm" style="margin:0" data-lat="${this.lat}" data-lon="${this.lon}" data-action="incident_wx-fwf" onclick="return false">View the full fire forecast</a>`
                : `<a href="#" class="btn btn-sm btn-orange" style="margin:0" data-action="upgrade-subscription" data-medium="acres_history" onclick="return false"><i class="fas fa-lock"></i> Upgrade to view forecast</a>`;

            q('.updated').insertAdjacentHTML('afterend', `<div class="btn-group centered" style="margin:0">${btnHtml}</div>`);

        } catch (error) {
            console.error('Incident weather error:', error);
            if (holder) {
                holder.innerHTML = `<h3>Incident Weather Concerns</h3><div class="message error">The 24-hour fire forecast is unavailable at this time.</div>`;
            }
        }
        return this;
    }

    updateRAWSUnits() {
        const isF = settings.weather()?.temp() === 'f';

        const newBg = this.buildExpression(this.scale.map(s => [s[0], s[1], s[2]]));
        const newText = this.buildExpression(this.scale.map(s => [s[0], s[1], s[3]]), false);

        // 2. Apply directly to map layers
        if (map.getLayer('stns')) {
            map.setPaintProperty('stns', 'circle-color', newBg);
            map.setPaintProperty('stns', 'circle-radius', [
                'case', ['>', ['get', 'temp'], isF ? 99 : 37.2], 15, 13
            ]);
        }

        if (map.getLayer('stns_text')) {
            map.setPaintProperty('stns_text', 'text-color', newText);
        }

        this.raws(true);
    }

    async raws(update = false) {
        let feat = [],
            b = JSON.parse(getbbox()),
            bx = b.xmax + ',' + b.ymin + ',' + b.xmin + ',' + b.ymax,
            vars = 'token=350409c14c544ec9957effb1c15bcb99' +
                '&bbox=' + bx +
                '&vars=air_temp,relative_humidity,wind_speed,wind_direction' +
                '&units=temp|f,speed|mph' +
                '&obtimezone=local' +
                '&status=active' +
                '&network=2,1' +
                '&networkimportance=2,1';

        const data = await api('https://api.synopticlabs.org/v2/stations/latest?' + vars);

        if (data.STATION) {
            data.STATION.forEach((s) => {
                if (s.OBSERVATIONS.air_temp_value_1) {
                    let t = s.OBSERVATIONS.air_temp_value_1.value;

                    if (settings.weather()?.temp() == 'c' && t != '--') {
                        t = conversion.FtoC(s.OBSERVATIONS.air_temp_value_1.value);
                    }

                    s.temp = Math.round(t);
                }

                feat.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(s.LONGITUDE), parseFloat(s.LATITUDE)]
                    },
                    properties: s
                });
            });

            if (update) {
                if (feat.length > 0 && map.getSource('stns') != null) {
                    map.getSource('stns').setData({
                        type: 'FeatureCollection',
                        features: feat
                    });
                }
            } else {
                if (!map.getSource('stns')) {
                    map.addSource('stns', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: feat
                        },
                        cluster: true,
                        clusterMaxZoom: 7,
                        clusterMinPoints: 5,
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
                            'text-size': 13,
                            'text-offset': [0, 0]
                        }
                    });

                    map.on('mouseenter', 'stns', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });

                    map.on('mouseleave', 'stns', () => {
                        map.getCanvas().style.cursor = 'auto';
                    });

                    map.on('mouseenter', 'stns_text', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });

                    map.on('mouseleave', 'stns_text', () => {
                        map.getCanvas().style.cursor = 'auto';
                    });
                }
            }
        }

        return this;
    }

    airQColor(v) {
        let r = '';

        if (v <= 50) {
            r = '00e400';
        } else if (v > 50 && v <= 100) {
            r = 'ffff00';
        } else if (v > 100 && v <= 150) {
            r = 'ff7e00';
        } else if (v > 150 && v <= 200) {
            r = 'ff0000';
        } else if (v > 200 && v <= 300) {
            r = '8f3f97';
        } else if (v > 300 && v <= 500) {
            r = '7e0023';
        } else {
            r = 'd9d9d9';
        }

        return '#' + r;
    }

    airQDesc(aq) {
        let l, hm;

        if (aq <= 50) {
            l = 'Good';
            hm = 'Air quality is satisfactory, and air pollution poses little or no risk.';
        } else if (aq > 50 && aq <= 100) {
            l = 'Moderate';
            hm = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
        } else if (aq > 100 && aq <= 150) {
            l = 'Unhealthy for Sensitive Groups';
            hm = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
        } else if (aq > 150 && aq <= 200) {
            l = 'Unhealthy';
            hm = 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
        } else if (aq > 200 && aq <= 300) {
            l = 'Very Unhealthy';
            hm = 'Health alert: The risk of health effects is increased for everyone.';
        } else if (aq > 300) {
            l = 'Hazardous';
            hm = 'Health warning of emergency conditions: everyone is more likely to be affected.';
        }

        return { 'quality': l, 'desc': hm };
    }

    nearbyAQ() {
        const g = setInterval(() => {
            if (airQualityStns.features) {
                clearInterval(g);

                if (airQualityStns.features.length > 0) {
                    const aqh = modal.querySelector('#aq'),
                        distances = [],
                        stns = [];

                    airQualityStns.features.forEach((f) => {
                        const dist = conversion.distance(this.lat, this.lon, f.geometry.coordinates[1], f.geometry.coordinates[0]);

                        distances.push(dist);
                        stns.push(f.properties);
                    });

                    const minDist = Math.min.apply(null, distances);

                    const stn = stns[distances.indexOf(minDist)],
                        aq = stn.PM25_AQI,
                        color = this.airQColor(aq),
                        details = this.airQDesc(aq);

                    aqh.querySelector('.desc').innerHTML = '<span class="air_quality" onclick="notify(\'info\', \'' + details.desc + '\');return false" title="' + details.quality + ': ' + details.desc +
                        '" style="color:#' + (aq <= 100 ? '000' : 'fff') + ';background-color:' + color + '">' + details.quality.replace('Unhealthy for Sensitive Groups', 'Unhealthy') + '</span>';
                } else {
                    aqh.parentElement.classList.remove('max25');
                    aqh.parentElement.classList.add('max33');
                    aqh.remove();
                }
            }
        }, 500);

        return this;
    }
}

class ChangeListener {
    constructor(target) {
        this.target = target;
    }

    changeBasemap(tile = null) {
        if (tile == null) {
            tile = this.target.getAttribute('data-tile');
        }

        settings.settings.tile = tile;

        map.setStyle(config.tiles[tile]);

        map.once('styledata', () => {
            config.layersHandler.add3D();
            config.layersHandler.init();
            config.wildfire.getWildfires();
            config.wildfire.perimeters();

            const dont = ['newFires', 'allFires', 'smokeChecks', 'rxBurns', 'perimeters'];

            if (settings.checkboxes()) {
                settings.checkboxes().forEach((c) => {
                    if (!dont.includes(c)) {
                        toggleLayer({ id: c, checked: true });
                    }
                });
            }
        });
    }

    minPerimSize() {
        const v = this.target.value;

        settings.updatePSize(v);

        document.querySelector('#pSize').innerHTML = v + ' acres';

        map.removeLayer('perimeters_outline')
            .removeLayer('perimeters_fill')
            .removeLayer('perimeters_title')
            .removeSource('perimeters');

        new Wildfires().perimeters();
    }

    /*darkMode() {
        let useTile = '',
            url = config.specificURL + (debugMode ? 'v' + version + '/mf.app-dark_mode.css' : 'src/css/mf.app-dark_mode-' + version + '.css'),
            on = this.target.checked ? true : false,
            sheets = Array.from(document.styleSheets),
            isLoaded = () => {
                sheets.forEach(sheet => {
                    if (sheet.href && sheet.href.includes(url)) {
                        return true;
                    }
                });

                return false;
            };

        if (on) {
            if (!isLoaded()) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                document.head.appendChild(link);
            }

            useTile = 'dark';
            document.body.classList.add('dark-mode');
        } else {
            sheets.forEach(sheet => {
                if (sheet.href && sheet.href.includes(url)) {
                    sheet.ownerNode.remove();
                }
            });
            
            useTile = 'outdoors';
            document.body.classList.remove('dark-mode');
        }

        this.changeBasemap(useTile);

        const ts = new Date();
        const date = ts.setTime(ts.getTime() + (60 * 60 * 24 * 30 * 1000)),
            expires = `; expires=${new Date(date).toGMTString()}`;

        document.cookie = `dark_mode=${on ? 'true' : 'false'}` + expires + '; domain=.' + window.location.hostname + '; path=/; secure';
    }*/

    toggle() {
        const layers = [];

        document.querySelectorAll('.layChkBx').forEach((e) => {
            if (e.checked) {
                layers.push(e.id);
            }
        });

        // update settings to reflect anytime a checkbox is selected or not
        settings.updateLayers(layers);

        // toggle the layer on or off
        const id = this.target.id,
            checked = this.target.checked;

        toggleLayer({ id, checked });
    }

    smoke(sfc) {
        const selected = this.target.options[this.target.selectedIndex].value;

        if (sfc) {
            config.layersHandler.sfcSmoke(selected);
        } else {
            config.layersHandler.viSmoke(selected);
        }
    }

    spc() {
        const type = document.querySelector('#otlkType'),
            days = document.querySelector('#otlkDay'),
            day3 = days.querySelector('option[value="3"]');

        /* add or remove day 3 depending on if the user is looking at severe or fire wx outlooks */
        if (type.value == 'severe') {
            if (!day3) {
                const opt = document.createElement('option');
                opt.value = 3;
                opt.text = 'Day 3';
                days.appendChild(opt);
            }
        } else {
            if (day3) {
                day3.remove();
            }
        }

        settings.updateSpecial();
        new NWS().spc(true);
    }

    personalize() {
        if (document.querySelector('#impact #settings') != null) {
            document.querySelectorAll('#impact #settings select').forEach((s) => {
                settings.updatePersonal(s);
            });

            saveSession(true);
        }
    }

    archive() {
        const ay = document.querySelector('#archive_years'),
            s = ay.options[ay.selectedIndex].value;

        if (s != '- Choose a year -') {
            window.location.href = config.host + 'archive/' + s + (window.location.search ? window.location.search : '') + (window.location.hash ? window.location.hash : '');
        }
    }
}

function isVisible(div) {
    const element = document.querySelector(div);

    if (element != null) {
        const rect = element.getBoundingClientRect(),
            windowHeight = window.innerHeight;

        return rect.top >= 0 && rect.bottom <= windowHeight;
    }
}

function plural(v) {
    return (v > 1 ? 's' : '');
}

function matheq(d, s, r) {
    return Math.floor(((d / s) - Math.floor(d / s)) * r);
}

function timeAgo(t, w, c) {
    let val,
        now = c ? c : new Date().getTime(),
        d = Math.round((now - (t.toString().length == 10 ? t * 1000 : t)) / 1000);

    if (d < 10) {
        val = 'Just now';
    } else if (d >= 10 && d < 60) {
        val = d + ' sec' + plural(d);
    } else if (d >= 60 && d < 3600) {
        val = Math.floor(d / 60) + ' min' + plural(Math.floor(d / 60)) + ((matheq(d, 60, 60) !== 0) ? ',&nbsp;' + matheq(d, 60, 60) + ' sec' + plural(matheq(d, 60, 60)) : '');
    } else if (d >= 3600 && d < 86400) {
        val = Math.floor(d / 3600) + ' hour' + plural(Math.floor(d / 3600)) + ((matheq(d, 3600, 60) !== 0) ? ',&nbsp;' + matheq(d, 3600, 60) + ' min' + plural(matheq(d, 3600, 60)) : '');
    } else if (d >= 86400 && d < 172800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400)) + ((matheq(d, 86400, 24) !== 0) ? ',&nbsp;' + matheq(d, 86400, 24) + ' hour' + plural(matheq(d, 86400, 24)) : '');
    } else if (d >= 172800 && d < 604800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400));
    } else if (d >= 604800 && d < 2419200) {
        val = Math.floor(d / 604800) + ' week' + plural(Math.floor(d / 604800));
    } else if (d >= 2419200 && d < 31536000) {
        val = Math.floor(d / 2419200) + ' month' + plural(Math.floor(d / 2419200));
    } else if (d >= 31536000) {
        val = Math.floor(d / 31536000) + ' year' + plural(Math.floor(d / 31536000));
    }

    if (w == 1) {
        val = val.split(', ')[0];
    }

    if (val == 'Just now') {
        return val;
    } else {
        return val === undefined ? 'unknown' : val + ' ago';
    }
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function ucwords(s) {
    if (s.search(/\s/g) >= 0) {
        var a = s.split(' '),
            o = '';

        a.forEach(function (s) {
            o += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
        });

        return o.substring(0, o.length - 1);
    } else {
        return ucfirst(s);
    }
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function loadScript(src) {
    return new Promise(function (resolve, reject) {
        var s;
        s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function dateTime(it, time = false, timezone = false, longMonth = false) {
    let t = new Date(it.toString().length == 10 ? it * 1000 : it),
        h = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())),
        m = (t.getMinutes() < 10 ? '0' : '') + t.getMinutes(),
        a = h + ':' + m + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M',
        s = (/\((.*?)\)/g).exec(new Date().toString())[1].split(' '),
        tz = s[0].substring(0, 1) + s[1].substring(0, 1) + s[2].substring(0, 1),
        month = longMonth ? config.longMonths[t.getMonth()] : config.months[t.getMonth()];

    return month + ' ' + t.getDate() + ',&nbsp;' + t.getFullYear() + (time ? ' at ' + a : '') + (timezone ? ' ' + tz : '');
}

/* social media shares */
function socialShare(se) {
    let p = window.location.pathname,
        s = p.split('/');

    if (se == 'tt') {
        window.open('https://tiktok.com/search?q=' + s[4].replaceAll('-', '%20').toLowerCase());
    } else {
        let ref = config.host.substring(0, config.host.length - 1) + p;

        if (se == 'fb') {
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + ref + '&src=sdkpreparse';
        } else {
            let hashtags = ucwords(s[3].toString().replaceAll('-', ' ')).replaceAll(' ', '') + ',' + ucwords(s[4].toString().replaceAll('-', ' ')).replaceAll(' ', '');
            url = 'https://x.com/intent/post?hashtags=' + hashtags + '&original_referer=' + ref + '&url=' + ref + '&ref_src=twsrc%5Etfw&tw_p=tweetbutton';
        }

        let h = 425,
            w = 700,
            t = (window.innerHeight - h) / 2,
            l = (window.innerWidth - w) / 2;

        window.open(url, 'social', 'location=no,menubar=no,status=no,resizable=no,top=' + t + ',left=' + l + ',width=' + w + ',height=' + h);
    }
}

function ndfdTime(add = null) {
    var a = new Date(),
        e = a.toString().split(' GMT')[0],
        b = (a.getMonth() + 1) + '/' + a.getDate() + '/' + a.getFullYear();
    c = e.match(/([0-9:]{8,})/gm)[0].split(':'),
        h = parseInt(c[0]);

    if (c[1] > 0) {
        h += 1;
    }

    var t = b + ' ' + h + ':00:00';

    return new Date(t).getTime() + (add ? (add * 60 * 60 * 1000) : 0);
}

function initNDFDTimes() {
    let o = '';

    for (let i = 0; i < 24; i++) {
        let t = new Date(ndfdTime(i)),
            y = t.getUTCFullYear(),
            m1 = (t.getUTCMonth() + 1),
            m = (m1 < 10 ? '0' : '') + m1,
            d1 = t.getUTCDate(),
            d = (d1 < 10 ? '0' : '') + d1,
            h1 = t.getUTCHours(),
            h = (h1 < 10 ? '0' : '') + h1,
            ts = y + '-' + m + '-' + d + 'T' + h + ':00:00.000Z',
            lh = (t.getHours() > 12 ? t.getHours() - 12 : (t.getHours() == 0 ? '12' : t.getHours())) + ':00';

        o += `<option ${settings.special().fcstTime() == ts ? 'selected ' : ''}value="${ts}">${lh == 0 ? '12' : lh} ${t.getHours() >= 12 ? 'P' : 'A'}M</option>`;
    }

    return o;
}

function setHeaders(title, urlPath, description) {
    const fullUrl = `${config.specificURL}${urlPath.replace(/incident\/|wildfire\//g, 'fires/')}${window.location.search}${window.location.hash}`;
    const pageTitle = `${title} | ${config.productName}`;

    // Use a single line to decide which history method to use
    (modal.classList.contains('open') ? window.history.replaceState : window.history.pushState).call(window.history, {
        "pageTitle": pageTitle
    }, '', fullUrl);

    // Update document metadata
    document.title = pageTitle;
    const metaTags = [{
        property: 'og:title',
        name: 'twitter:title',
        content: pageTitle
    }, {
        name: 'description',
        property: 'og:description',
        name: 'twitter:description',
        content: description
    }];

    metaTags.forEach(tag => {
        if (tag.property) {
            document.querySelector(`meta[property="${tag.property}"]`).setAttribute('content', tag.content);
        }
        if (tag.name) {
            document.querySelector(`meta[name="${tag.name}"]`).setAttribute('content', tag.content);
        }
    });
}

function unsetHeaders() {
    const h = window.location.href;

    if (h.search('fires') >= 0 || h.search('weather/') >= 0 || h.search('risk') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', h.replace(window.location.pathname, (settings.archive == null ? '' : '/archive/' + settings.archive)));

        document.title = defaultTitle;
        document.querySelector('meta[property="og:title"]').setAttribute('content', defaultTitle);
        document.querySelector('meta[name="twitter:title"]').setAttribute('content', defaultTitle);
        document.querySelector('meta[name="description"]').setAttribute('content', defaultDesc);
        document.querySelector('meta[property="og:description"]').setAttribute('content', defaultDesc);
        document.querySelector('meta[name="twitter:description"]').setAttribute('content', defaultDesc);
    }
}

async function saveSession(method = true, msg) {
    if (navigator.onLine) {
        let c = map.getCenter(),
            lat = c.lat,
            lon = c.lng,
            z = map.getZoom(),
            p = map.getPitch(),
            b = map.getBearing(),
            t = settings.getBasemap(),
            set = settings.settings,
            sy = document.querySelector('li#save span');

        set.center = [lat, lon];
        set.zoom = z;
        set.pitch = p;
        set.bearing = b;
        set.tile = t;

        if (set.weather == null) {
            set.weather = {
                temp: 'f',
                wind: 'mph'
            };
        }

        if (sy != null) {
            sy.innerHTML = 'Syncing...';
        }

        if (impact.querySelector('#sync')) {
            impact.querySelector('#sync span').innerHTML = 'Syncing...';
        }

        const send = [
            ['method', method],
            ['settings', JSON.stringify(set)]
        ];

        if (settings.user) {
            send.push(['token', settings.getUser().token()]);
        }

        const data = await api(config.host + 'api/v1/session', send);

        if (data.success == 1) {
            if (settings.user != null) {
                settings.user.settings.synced = Date.now();
            }

            if (sy) {
                sy.innerHTML = 'Sync';
            }

            if (impact.querySelector('#sync')) {
                impact.querySelector('#sync span').innerHTML = 'Account synced just now';
            }

            notify('success', 'Your settings were successfully synced.');
        }
    } else {
        notify('error', 'Unable to sync your settings due to no internet.');
    }
}

function newFiresReport() {
    let content = document.createElement('ul');
    content.classList.add('new_fires');

    newFires.forEach(fire => {
        const li = document.createElement('li'),
            name = fire.properties.name.replace(' Fire', '') + (fire.properties.type == 'Wildfire' ? ' Fire' : ''),
            near = fire.properties.near,
            acres = fire.properties.acres,
            size = conversion.sizeFormat(acres);
        //size = conversion.sizing(2, acres) + ' ' + conversion.sizing(1).toLowerCase(),
        //ago = timeAgo(fire.properties.time.discovered);

        li.setAttribute('data-action', 'new-fires');
        li.setAttribute('data-lat', fire.geometry.coordinates[1]);
        li.setAttribute('data-lon', fire.geometry.coordinates[0]);
        li.innerHTML = '<div class="pert"><h3>' + name + '</h3><span class="near">' + near + '</div></div><span class="disc">' + size + '</span>';
        content.appendChild(li);
    });

    createDataForm('New, Fast Growing Fires', content.outerHTML);
}

function createDataForm(title, content, center = false) {
    if (document.querySelector('#data-form')) {
        document.querySelector('#data-form').classList.remove('bg');
        document.querySelector('#data-form').remove();
    }

    const el = document.createElement('div');
    el.id = 'data-form';
    el.innerHTML = '<span id="exit" data-action="close-data-form" class="far fa-xmark"></span><div class="wrapper' + (center ? ' center' : '') + '"><h1>' + title + '</h1>' + content + '</div>';
    document.body.append(el);
}

/* allow user to submit report to MAPO of a new wildfire incident */
function doReport(data, lat, lon) {
    /*let county = '';
    const e = map.project([lon, lat]),
        f = map.queryRenderedFeatures(([
            [e.x - 5, e.y - 5],
            [e.x + 5, e.y + 5]
        ]));

    if (f.length > 0) {
        f.forEach((g) => {
            if (g.layer.id == 'us-counties') {
                county = g.properties.NAME;
            }
        });
    }*/

    if (settings.user != null) {
        document.querySelector('#newReport input[name=authUser]').value = 1;
        document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<input type="hidden" name="uid" value="' + settings.user.uid + '">');
    }

    document.querySelector('#newReport input[name=lat]').value = lat;
    document.querySelector('#newReport input[name=lon]').value = lon;
    document.querySelector('#newReport input[id=gc]').value = data.geocode.county.county ? data.geocode.county.county : 'Undetermined';
    document.querySelector('#newReport input[id=gl]').value = data.geocode.near;
    document.querySelector('#newReport input[id=gs]').value = data.geocode.state ? stateLabels[data.geocode.state].v : 'Undetermined';
    document.querySelector('#newReport input[name=geolocation]').value = data.geocode.near;
    document.querySelector('#newReport input[name=state]').value = data.geocode.state + ' / ' + stateLabels[data.geocode.state].v;

    document.querySelector('#newReport input[name=size]').addEventListener('keyup', (e) => {
        document.querySelector('#newReport #alab').innerHTML = 'acre' + (e.target.value != 1 ? 's' : '');
    });

    config.disableClicks = false;
}

async function onRasterLayerClick(e) {
    const coords = e.lngLat,
        fuels = map.getStyle().layers.find(l => l.id === 'fuels'),
        drought = map.getStyle().layers.find(l => l.id === 'drought'),
        bp = map.getStyle().layers.find(l => l.id === 'bp'),
        rth = map.getStyle().layers.find(l => l.id === 'rth'),
        whp = map.getStyle().layers.find(l => l.id === 'whp'),
        wildfireRiskLayer = [
            { ref: rth, id: 'rth', key: 'rps', title: 'Wildfire Risk', label: 'Risk to Homes' },
            { ref: bp, id: 'bp', key: 'bp', title: 'Wildfire Likelihood', label: 'Wildfire Likelihood' }
        ].find(l => l.ref?.layout?.visibility === 'visible');

    if (fuels && fuels.layout.visibility.toString() == 'visible') {
        const popup = new Popup('', true).create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>'),
            year = 25,
            getFuelType = async (year, where) => {
                const url = 'https://lfps.usgs.gov/arcgis/rest/services/Landfire_LF' + year + '0/' + where + '_' + year + '0EVT/ImageServer/identify?geometry=' + encodeURIComponent('{"spatialReference":{"latestWkid":4326,"wkid":102100},"x":' + coords.lng + ',"y":' + coords.lat + '}') + '&geometryType=esriGeometryPoint&mosaicRule=' + encodeURIComponent('{"ascending":true,"mosaicMethod":"esriMosaicNorthwest","mosaicOperation":"MT_FIRST"}') + '&renderingRule=&renderingRules=' + encodeURIComponent('[{"rasterFunction":"' + where + '_' + year + '0EVT"}]') + '&pixelSize=' + encodeURIComponent('{"spatialReference":{"latestWkid":3857,"wkid":102100},"x":152.87405657041106,"y":152.87405657041106}') + '&sliceId=&time=&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=json';

                try {
                    const data = await fetch(url);

                    if (!data.ok) {
                        return null;
                    }

                    const json = await data.json();
                    return json.processedValues && json.processedValues[0] === 'NoData' ? null : json;
                } catch (e) {
                    console.error('Error trying to retreive fuels:', e);
                    return null;
                }
            };

        let where = "US",
            fuelType = 'Unknown',
            fuels = await getFuelType(year, where);

        if (fuels === null) {
            where = "AK";
            fuels = await getFuelType(year, where);
        }

        if (fuels.processedValues && fuels.processedValues[0]) {
            const found = config.fuelsData.find(fuel => fuel.attributes.Value == fuels.processedValues[0]);

            if (found) {
                fuelType = found.attributes.EVT_NAME;
            }

            popup.update(`<div class="item"><div class="t">Existing Vegetation Type</div><div class="v">${fuelType}</div></div>
                <div class="item"><div class="t">Model</div><div class="v">${where == 'US' ? 'United States' : 'Alaska'}</div></div>
                <div class="item"><div class="t">Data Year</div><div class="v">20${year}</div></div>`, 'Fuels Type');
        } else {
            popup.close();
            notify('error', 'Unable to get fuels information. Try again.');
        }
    }

    if (drought && drought.layout.visibility.toString() == 'visible') {
        const popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>'),
            geo = encodeURIComponent(`{"x":${coords.lng},"y":${coords.lat},"spatialReference":{"latestWkid":4326}}`);

        //https://rhvpkkiftonktxq3.svcs9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/1/query?where=admin_fips+%3D+41061+AND+period+%3D+20250916&objectIds=&resultType=none&outFields=name%2Cstate_abbr%2Cd0%2Cd1%2Cd2%2Cd3%2Cd4&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=html&token=
        await fetch(`https://rhvpkkiftonktxq3.svcs9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3/query?where=1%3D1&geometry=${geo}&geometryType=esriGeometryPoint&inSR=4326&outFields=dm,ddate&returnGeometry=false&f=json`)
            .then(async (resp) => {
                let level = 'No Drought',
                    upd = 'N/A',
                    data = await resp.json();

                if (data.features.length > 0) {
                    const p = data.features[0].attributes;
                    upd = timeAgo(p.ddate);

                    switch (p.dm) {
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
                }

                popup.update(`<div class="item"><div class="t">Drought Level</div><div class="v">${level}</div></div>
                <div class="item"><div class="t">Last Updated</div><div class="v">${upd}</div></div>`, 'Drought Monitor');
            });
    }

    if (wildfireRiskLayer && map.getZoom() >= 6) {
        const { id, key, title, label } = wildfireRiskLayer,
            popup = new Popup(title, true).create('<div id="spinner" class="sm" style="display:block;margin:0 auto"></div>');

        const [respRes, pcRes] = await Promise.allSettled([
            api(`${config.apiURL}risk`, [['lat', coords.lat], ['lon', coords.lng]]),
            new Convert().getRasterColor(e.lngLat, id)
        ]);

        const resp = respRes.status === 'fulfilled' ? respRes.value : null,
            pc = pcRes.status === 'fulfilled' ? pcRes.value : null;

        if (resp?.risk) {
            const data = resp.risk, d = data.data[key];
            const localVal = legend.items[id].find(i => i[2] === pc)?.[3] || 'Unknown';

            // Short function to generate the comparison text
            const getComp = (val, region) => {
                const pct = Math.round(val * 100);
                return `On average, ${data.name} has a ${pct < 5 ? 'lower' : 'greater'} risk than ${pct < 5 ? 'nearly all' : pct + '% of'} other counties in ${region}`;
            };

            const content = `<div class="item"><div class="t">Location</div><div class="v">${data.name}, ${data.state}</div></div>
                ${pc ? `<div class="item"><div class="t">${title === 'Wildfire Risk' ? 'Risk' : 'Likelihood'} at this Location</div><div class="v">${localVal}</div></div>` : ''}
                <div class="item"><div class="t">${label} in this County</div><div class="v">${d.rank}</div></div>
                <div class="item"><div class="t">State Comparison</div><div class="v">${getComp(d.state, stateLabels[data.state].v)}</div></div>
                <div class="item"><div class="t">US Comparison</div><div class="v">${getComp(d.us, 'the US')}</div></div>
                <a target="_blank" href="https://apps.wildfirerisk.org/explore/${title.toLowerCase().replace(/ /g, '-')}/${String(data.fips).slice(0, 2)}/${data.fips}/">Learn More</a>`;

            popup.update(content);
        } else {
            popup.update(`<p>Unable to retrieve ${title.toLowerCase()} risk report.</p>`);
        }
    }

    if (whp && whp.layout.visibility == 'visible' && map.getZoom() >= 6) {
        const popup = new Popup('Wildfire Hazard Potential', true).create('<div id="spinner" class="sm" style="display:block;margin:0 auto"></div>');

        const pc = await new Convert().getRasterColor(e.lngLat, 'whp'),
            val = legend.items.whp.find(i => i[2] === pc);

        if (val) {
            const desc = `There is a ${val[3].toLowerCase()} potential for a wildfire that may be difficult to manage`;

            popup.update(`<div class="item"><div class="t">Difficulty</div><div class="v">${desc}</div></div>`);
        } else {
            popup.update('<p>Unable to retrieve wildfire hazard potential data.</p>');
        }
    }
}

async function onMapClick(e) {
    const features = map.queryRenderedFeatures([
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
    ]);

    onRasterLayerClick(e);

    if (features.length > 0) {
        const wfClass = new Wildfires();
        let clickedCounty = null,
            sources = [],
            fire_layers = ['all_fires', 'new_fires', 'smk_fires', 'rx_fires']/*,
            modis_layers = ['modis24', 'modis48', 'modis72']*/;

        features.forEach((feature) => {
            sources.push(feature.source);
        });

        /* highlight specific features on the map when clicked on */
        if (!sources.includes('ca_perimeters') && map.getSource('ca_perimeters') !== undefined || selected.caperim != null) {
            map.removeFeatureState({
                source: 'ca_perimeters',
                id: selected.caperim
            });

            selected.caperim = null;
        }

        if (!sources.includes('perimeters') && map.getSource('perimeters') !== undefined || selected.perim != null) {
            map.removeFeatureState({
                source: 'perimeters',
                id: selected.perim
            });

            selected.perim = null;
        }

        if (!sources.includes('evac') && map.getSource('evac') !== undefined || selected.evac != null) {
            map.removeFeatureState({
                source: 'evac',
                id: selected.evac
            });

            selected.evac = null;
        }

        if (!sources.includes('nri') && map.getSource('nri') !== undefined || selected.nri != null) {
            map.removeFeatureState({
                source: 'nri',
                id: selected.nri
            });

            selected.nri = null;
        }

        if (!sources.includes('erc') && map.getSource('erc') !== undefined || selected.erc != null) {
            map.removeFeatureState({
                source: 'erc',
                id: selected.erc
            });

            selected.erc = null;
        }

        /* loop through all features to see if county data is available */
        for (let i = 0; i < features.length; i++) {
            if (features[i].layer.id == 'us-counties') {
                clickedCounty = features[i].properties.NAME;
            }
        }

        /* loop through all features */
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];

            /* display wildfire incident */
            if (fire_layers.includes(feature.source)) {
                if (feature.properties.cluster) {
                    map.zoomIn();
                } else {
                    const time = JSON.parse(feature.properties.time),
                        data = {
                            wfid: feature.properties.wfid,
                            name: feature.properties.name,
                            state: feature.properties.state,
                            type: feature.properties.type,
                            incidentID: feature.properties.incidentId,
                            acres: feature.properties.acres,
                            discovered: parseFloat(time.discovered),
                            updated: parseFloat(time.updated)
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
                const name = feature.properties.name,
                    state = stateLabels[feature.properties.province].v,
                    time = JSON.parse(feature.properties.time),
                    acres = feature.properties.acres,
                    status = feature.properties.status,
                    near = feature.properties.near;

                map.flyTo({
                    center: feature.geometry.coordinates,
                    zoom: 10
                });

                new Popup('Canadian Wildfire').create('<div class="item"><div class="t">Incident Name</div><div class="v">' + name + '</div></div>' +
                    '<div class="item"><div class="t">Start Date</div><div class="v">' + timeAgo(time.discovered) + '</div></div>' +
                    '<div class="item"><div class="t">Province</div><div class="v">' + state + '</div></div>' +
                    '<div class="item"><div class="t">Size</div><div class="v">' + numberFormat(acres / 2.471, 2) + ' ha (' + acres + ' acres)</div></div>' +
                    '<div class="item"><div class="t">Status</div><div class="v">' + status + '</div></div>' +
                    (near != null ? '<div class="item"><div class="t">Near</div><div class="v">' + near + '</div></div>' : '') +
                    '<span style="margin-top:1em;font-size:12px;color:#8d8d8d">Last update received ' + timeAgo(time.updated) + '</span>'
                );
            }

            /* on perimeter click */
            if (feature.source == 'ca_perimeters') {
                selected.caperim = feature.id;

                map.setFeatureState({
                    source: 'ca_perimeters',
                    id: selected.caperim
                }, {
                    click: true
                });

                if (settings.perimeters().zoom() == '1') {
                    map.fitBounds(geojsonExtent(feature.geometry), {
                        padding: 60
                    });
                }

                break;
            }

            if (feature.source == 'perimeters') {
                const name = ucwords(feature.properties.attr_IncidentName.replace(' Fire', '').toLowerCase()) + ' Fire',
                    ago = timeAgo(feature.properties.poly_DateCurrent),
                    acres = feature.properties.poly_Acres_AutoCalc > feature.properties.poly_GISAcres ? feature.properties.poly_Acres_AutoCalc : feature.properties.poly_GISAcres,
                    size = conversion.sizeFormat(acres);
                //size = conversion.sizing(2, acres) + ' ' + conversion.sizing(1).toLowerCase();

                selected.perim = feature.id;

                map.setFeatureState({
                    source: 'perimeters',
                    id: selected.perim
                }, {
                    click: true
                });

                new Popup('Wildfire Perimeter').create('<div class="item"><div class="t">Incident Name</div><div class="v">' + name + '</div></div>' +
                    '<div class="item"><div class="t">Last Mapped</div><div class="v">' + ago + '</div></div>' +
                    '<div class="item"><div class="t">Perimeter Size</div><div class="v">' + size + '</div></div>');

                if (settings.perimeters().zoom() == '1') {
                    map.fitBounds(geojsonExtent(feature.geometry), {
                        padding: 60
                    });
                }

                break;
            }

            if (feature.source == 'firemed') {
                const cityState = `${feature.properties.CITY}, ${feature.properties.STATE} ${feature.properties.ZIPCODE}`,
                    type = feature.properties.type == 'hosp' ? 'Hospital' : (feature.properties.type == 'ems' ? 'Emergency Medical Service' : 'Fire Department');

                new Popup('Emergency Response').create('<div class="item"><div class="t">Type</div><div class="v">' + type + '</div></div>' +
                    '<div class="item"><div class="t">Name</div><div class="v">' + feature.properties.NAME + '</div></div>' +
                    '<div class="item"><div class="t">Address</div><div class="v">' + feature.properties.ADDRESS + '</div></div>' +
                    '<div class="item"><div class="t">City/State</div><div class="v">' + cityState + '</div></div>'
                )

                break;
            }

            /* on air quality click */
            if (feature.source == 'airq') {
                const w = new Weather(),
                    aqi = feature.properties.PM25_AQI,
                    d = w.airQDesc(aqi),
                    ago = timeAgo(new Date(feature.properties.LocalTimeString).getTime());

                new Popup('Air Quality', true).create(`<div class="item"><div class="t">Station Name</div><div class="v">${feature.properties.SiteName}</div></div>
                    <div class="item"><div class="t">Air Quality</div><div class="v">
                    <span class="air_quality" style="display:inline-block;color:#${aqi <= 100 ? '000' : 'fff'};background-color:${w.airQColor(feature.properties.PM25_AQI)}">
                    ${d.quality}</span></div></div>
                    <div class="item"><div class="t">Details</div><div class="v">${d.desc}</div></div>
                    <div class="item"><div class="t">Last Reported</div><div class="v">${ago}</div></div>`);

                break;
            }

            /* on wwas click */
            if (feature.source == 'wwas') {
                new NWS().find(e.lngLat.lat, e.lngLat.lng);
                break;
            }

            /* on SPC outlook click */
            if (feature.source == 'outlook') {
                const color = (feature.properties.fill == '#66A366' || feature.properties.fill == '#ff3333' ? '#fff' : '#242424'),
                    content = `<div class="item">
                        <div class="t">Risk</div><div class="v"><span class="spc" style="background-color:${feature.properties.fill};color:${color}">${feature.properties.name}</span></div>
                    </div><div class="item">
                        <div class="t">Issued</div><div class="v">${dateTime(feature.properties.issue, true, true)}</div>
                    </div><div class="item">
                        <div class="t">Forecast Valid</div><div class="v">${dateTime(feature.properties.valid, true, true)}</div>
                    </div><div class="item">
                        <div class="t">Valid Until</div><div class="v">${dateTime(feature.properties.expires, true, true)}</div>
                    </div>
                    <a href="#" data-action="readSPC" data-type="${settings.special().otlkType()}" data-day="${settings.special().otlkDay()}" onclick="return false" style="display:block;text-align:center">Read the forecast</a>`;

                new Popup((settings.special().otlkType() == 'severe' ? 'Severe' : 'Fire') + ' Weather Outlook - Day ' + settings.special().otlkDay()).create(content);
                break;
            }

            /* modis heat spot click */
            /*if (modis_layers.includes(feature.source)) {
                const p = feature.properties,
                    when = timeAgo(p.acq_time),
                    dn = p.daynight == 'D' ? 'Day' : 'Night',
                    con = ucfirst(p.confidence),
                    content = `<div class="item"><div class="t">Detected</div><div class="v">${when}</div></div>
                <div class="item"><div class="t">Day or Night</div><div class="v">${dn}</div></div>
                <div class="item"><div class="t">Satellite</div><div class="v">modis/${p.satellite}</div></div>
                <div class="item"><div class="t">Confidence</div><div class="v">${con}</div></div>
                <div class="item"><div class="t">Fire Radiative Power</div><div class="v">${p.frp} megawatts</div></div>`;

                new Popup('Satellite-Detected Hotspot').create(content);
                break;
            }*/

            /* ERC PSA click */
            if (feature.source == 'erc') {
                /*const psaCode = feature.properties.PSANationalCode,
                    data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/NFDRS_ERC_and_BI_Percentiles_and_Trends/FeatureServer/5/query', [
                        ['where', 'PSANationalCode = \'' + psaCode + '\''],
                        ['outFields', 'OBJECTID,PSANAME,avg_erc_fcast_percentile,avg_erc_fcast_trend,avg_erc_percentile,avg_erc_trend,update_date,update_time'],
                        ['f', 'json']
                    ]);

                if (data.features && data.features.length > 0) {
                    const prop = data.features[0].attributes,
                        psa = prop.PSANAME,
                        obs_pct = prop.avg_erc_percentile,
                        obs_trend = prop.avg_erc_trend,
                        fcst_pct = prop.avg_erc_fcast_percentile,
                        fcst_trend = prop.avg_erc_fcast_trend,
                        time = prop.update_time.substring(0, 2) + ':' + prop.update_time.substring(2, 4),
                        dt = dateTime(new Date(`${prop.update_date} ${time} UTC`).getTime(), true),
                        popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>' +
                            '<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting ERC data...</p>');

                    const ercContent = `<div class="item"><div class="t">Area (PSA)</div><div class="v">${psa}</div></div>
                        ${settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? `<div class="item"><div class="t">PSA Code</div><div class="v">${psaCode}</div></div>` : ``}
                        <div class="item"><div class="t">ERC Percentile (Today)</div><div class="v">${obs_pct}%</div></div>
                        <div class="item"><div class="t">ERC Trend (Today)</div><div class="v">${obs_trend}</div></div>
                        <div class="item"><div class="t">ERC Percentile (Tomorrow)</div><div class="v">${fcst_pct}%</div></div>
                        <div class="item"><div class="t">ERC Trend (Tomorrow)</div><div class="v">${fcst_trend}</div></div>
                        <div class="item"><div class="t">Last Updated</div><div class="v">${dt}</div></div>`;

                    popup.update(ercContent, 'Energy Release Component');
                }*/

                let p = feature.properties,
                    psa = p.PSANAME,
                    code = p.PSANationalCode,
                    obs_pct = p.avg_erc_percentile,
                    obs_trend = p.avg_erc_trend.replace('ase', 'asing'),
                    fcst_pct = p.avg_erc_fcast_percentile,
                    fcst_trend = p.avg_erc_fcast_trend.replace('ase', 'asing'),
                    chart = p.ERC_Chart_URL,
                    time = p.update_time.substring(0, 2) + ':' + p.update_time.substring(2, 4),
                    dt = dateTime(new Date(`${p.update_date} ${time} UTC`).getTime(), true),
                    erc = '',
                    date = '',
                    popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>' +
                        '<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting ERC data...</p>');;

                if (settings.special().erc() == null || settings.special().erc() == 'obs') {
                    date = 'Today (' + dateTime(new Date().getTime()) + ')';
                    erc = '<div class="item"><div class="t">ERC Percentile</div><div class="v">' + obs_pct + '%</div></div>' +
                        '<div class="item"><div class="t">ERC Trend</div><div class="v">' + obs_trend + '</div></div>';
                } else {
                    date = 'Tomorrow (' + dateTime((new Date().getTime()) + 86400000) + ')';
                    erc = '<div class="item"><div class="t">ERC Percentile</div><div class="v">' + fcst_pct + '%</div></div>' +
                        '<div class="item"><div class="t">ERC Trend</div><div class="v">' + fcst_trend + '</div></div>';
                }

                const ercContent = `<div class="item"><div class="t">ERC Date</div><div class="v">${date}</div></div>
                        <div class="item"><div class="t">Area (PSA)</div><div class="v">${psa}</div></div>
                        ${settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? `<div class="item"><div class="t">PSA Code</div><div class="v">${code}</div></div>` : ``}
                        <div class="item"><div class="t">Current ERC Value</div><div class="v">${p.avg_erc}</div></div>
                        ${erc}
                        <div class="item"><div class="t">NFDRS Obs Date</div><div class="v">${dt}</div></div>
                        ${chart != null && chart != '' ? `<a target="blank" href="${chart}" style="display:block;text-align:center">View ERC Chart</a>` : ``}`;

                popup.update(ercContent, 'Energy Release Component');

                selected.erc = feature.id;

                map.setFeatureState({
                    source: 'erc',
                    id: selected.erc
                }, {
                    click: true
                });

                break;
            }

            /* PNW EVACUATION VULNERABILITY */
            if (feature.source == 'ev') {
                const p = feature.properties,
                    rank = (v) => {
                        if (v <= 174) return 'Severe';
                        if (v > 174 && v <= 348) return 'High';
                        if (v > 348 && v <= 522) return 'Moderate';
                        return 'Minimal';
                    },
                    content = '<div class="item"><div class="t">City</div><div class="v">' + p.City + '</div></div>' +
                        '<div class="item"><div class="t">State</div><div class="v">' + stateLabels[p.State].v + '</div></div>' +
                        '<div class="item"><div class="t">Rank</div><div class="v">' + p.Overall_Vu + ' of 696</div></div>' +
                        '<div class="item"><div class="t">Vulnerability</div><div class="v">' + (p.Overall_Vu / 6.96).toFixed(1) + '/100 (<b>' + rank(p.Overall_Vu) + '</b>)</div></div>';

                new Popup('Evacuation Vulnerability').create(content);
            }

            /* FEMA NRI click */
            if (feature.source == 'nri') {
                const p = feature.properties,
                    name = p.COUNTY + ' County, ' + p.STATEABBRV,
                    value = {
                        build: numberFormat(p.BUILDVALUE, 0),
                        ag: numberFormat(p.AGRIVALUE, 0)
                    },
                    pop = numberFormat(p.POPULATION, 0),
                    psm = numberFormat(p.POPULATION / p.AREA, 1),
                    risk = p.WFIR_RISKR,
                    score = parseFloat(p.WFIR_RISKS).toFixed(1),
                    content = `<div class="item"><div class="t">Location</div><div class="v">${name}</div></div>
                    <div class="item"><div class="t">Wildfire Risk</div><div class="v">${risk}</div></div>
                    <div class="item"><div class="t">Wildfire Risk Score</div><div class="v">${score}/100</div></div>
                    <div class="item"><div class="t">Population</div><div class="v">${pop}</div></div>
                    <div class="item"><div class="t">People/Square Mile</div><div class="v">${psm}</div></div>
                    <div class="item"><div class="t">Agricultural Value</div><div class="v">$${value.ag}</div></div>
                    <div class="item"><div class="t">Building Values</div><div class="v">$${value.build}</div></div>
                    <a target="blank" href="https://www.fema.gov/flood-maps/products-tools/national-risk-index" style="display:block;text-align:center">Learn about NRI</a>`;

                selected.nri = feature.id;

                map.setFeatureState({
                    source: 'nri',
                    id: selected.nri
                }, {
                    click: true
                });

                new Popup('FEMA Risk Index').create(content);

                break;
            }

            /* on ODF fire danger areas click */
            if (feature.source == 'odfFDR') {
                const ODF_DISTRICT_NAMES = {
                    "EL-1": "South Cascade",
                    "SW-2": "Southwest Oregon",
                    "MR-1": "North Cascade",
                    "QC": "South Cascade",
                    "UA-2": "Douglas FPA",
                    "DE-1": "Central Oregon",
                    "SW-1": "Southwest Oregon",
                    "DG-1": "Douglas FPA",
                    "SK-1": "Coos FPA",
                    "RWSC": "Southwest Oregon",
                    "NW-1": "Northwest",
                    "CM-2": "North Cascade",
                    "WR-1": "Walker Range FPA",
                    "BR-1": "North Cascade",
                    "NE-2": "Northeast Oregon",
                    "MH-4": "Central Oregon",
                    "NE-4": "Northeast Oregon",
                    "SW-3": "Southwest Oregon",
                    "SL-2": "Western Lane",
                    "MA-1": "Central Oregon",
                    "CM-1": "North Cascade",
                    "KF-1": "Klamath-Lake",
                    "WO-3": "West Oregon",
                    "NE-3": "Northeast Oregon",
                    "RR-2": "Southwest Oregon",
                    "UA-3": "South Cascade",
                    "WC-2": "Central Oregon",
                    "WC-1": "Central Oregon",
                    "WL-1": "South Cascade",
                    "UA-1": "Douglas FPA",
                    "NE-1": "Northeast Oregon",
                    "SK-3": "Southwest Oregon",
                    "MH-3": "North Cascade",
                    "WO-2": "West Oregon",
                    "WL-3": "South Cascade",
                    "LN-1": "South Cascade",
                    "KR": "Klamath-Lake",
                    "CS-5": "Coos FPA",
                    "NW-3": "Northwest",
                    "WW-2": "Northeast Oregon",
                    "MH-1": "Central Oregon",
                    "DG-2": "Douglas FPA",
                    "HLD": "North Cascade",
                    "WN-1": "Klamath-Lake",
                    "WT-1": "Western Lane",
                    "WO-1": "West Oregon",
                    "MA-2": "Central Oregon",
                    "KF-2": "Klamath-Lake",
                    "SW-4": "Southwest Oregon",
                    "CS-1": "Coos FPA",
                    "MH-2": "North Cascade",
                    "CR-1": "Central Oregon",
                    "UM-1": "Northeast Oregon",
                    "RR-1": "Southwest Oregon",
                    "OC-2": "Central Oregon",
                    "EC-1": "Central Oregon",
                    "WL-2": "South Cascade",
                    "RR-3": "Southwest Oregon",
                    "HC-1": "Northeast Oregon",
                    "EC-2": "Central Oregon",
                    "CS-2": "Coos FPA",
                    "NW-2": "Northwest",
                    "SK-2": "Coos FPA",
                    "CS-4": "Coos FPA"
                };

                let danger = '',
                    ifpl = feature.properties.ifplrestrictionlevel ? feature.properties.ifplrestrictionlevel : 'N/A';

                switch (feature.properties.firedanger) {
                    case 1: danger = 'Low'; break;
                    case 2: danger = 'Moderate'; break;
                    case 3: danger = 'High'; break;
                    case 4: danger = 'Extreme'; break;
                    default: danger = 'N/A'; break;
                }

                new Popup('ODF Fire Danger').create(
                    '<div class="item"><div class="t">District</div><div class="v">' + ODF_DISTRICT_NAMES[feature.properties.regusearea] + '</div></div>' +
                    '<div class="item"><div class="t">Reg. Use Area</div><div class="v">' + feature.properties.regusearea + '</div></div>' +
                    '<div class="item"><div class="t">Fire Danger</div><div class="v">' + danger + '</div></div>' +
                    '<div class="item"><div class="t">IFPL</div><div class="v">' + ifpl + '</div></div>'
                );

                break;
            }

            /* on CAL FIRE FHSZ click */
            if (feature.source == 'cdfFHSZ') {
                const level = feature.properties.FHSZ,
                    desc = level == 1 ? 'Moderate' : (level == 2 ? 'High' : 'Very High');

                new Popup('Fire Hazard Severity Zone').create(
                    (clickedCounty != null ? '<div class="item"><div class="t">County</div><div class="v">' + clickedCounty + '</div></div>' : '') +
                    '<div class="item"><div class="t">FHSZ</div><div class="v">' + desc + '</div></div>'
                );

                break;
            }

            /* on weather stations click */
            if (feature.source == 'stns') {
                new Weather().currentConds(feature.properties);

                break;
            }

            /* on oregon evacuations click */
            if (feature.source == 'evac') {
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

                const p = feature.properties,
                    d = p.level == 1 ? 'Be Ready' : p.level == 2 ? 'Be SET' : 'GO NOW',
                    n = p.notes,
                    u = timeAgo(p.updated);

                new Popup('Evacuations').create('<div class="item"><div class="t">Level</div><div class="v"><span class="evac-circ l' + p.level + '"></span>Level ' + p.level + '</div></div>' +
                    '<div class="item"><div class="t">Status</div><div class="v">' + d + '</div></div>' +
                    '<div class="item"><div class="t">' + (p.county ? 'County' : 'State') + '</div><div class="v">' + (p.county ? p.county + ' County, ' + p.state : stateLabels[p.state].v) + '</div></div>' +
                    '<div class="item"><div class="t">Last Updated</div><div class="v">' + u + '</div></div>' +
                    (n ? '<div class="item"><div class="t">Notes</div><div class="v">' + n + '</div></div>' : '')
                );

                break;
            }
        }
    }
}

window.addEventListener('popstate', () => {
    popstate();
});

window.addEventListener('submit', async (e) => {
    /* submit user NEW INCIDENT form */
    if (e.target.id == 'newReport') {
        e.preventDefault();

        let error = false,
            errorMsg = '';

        if (document.querySelector('#nrerrors')) {
            document.querySelector('#nrerrors').remove();
        }

        /* error checking */
        if (document.querySelector('#newReport select[name=type]').options[document.querySelector('#newReport select[name=type]').selectedIndex].value == '- Choose -') {
            error = true;
            errorMsg += '<li>Please choose an incident type</li>';
        }

        if (document.querySelector('#newReport input[name=size]').value == '') {
            error = true;
            errorMsg += '<li>Please estimate the size of the fire (even if it\'s 0)</li>';
        } else if (!document.querySelector('#newReport input[name=size]').value.match(/([0-9.]+)/)) {
            error = true;
            errorMsg += '<li>Your incident size cannot contain non-numeric characters</li>'
        }

        if (document.querySelector('#newReport textarea[name=notes]').value == '') {
            error = true;
            errorMsg += '<li>Please provide some details about this incident</li>';
        }

        if (error === true) {
            document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<ul id="nrerrors" style="margin: 0 0 1em 1em;font-size:14px;color:var(--red)">' + errorMsg + '</ul>');
        } else {
            if (confirm('Are you sure this is a new incident? If so, click "OK." Otherwise, please click "Cancel."')) {
                const sub = document.querySelector('#newReport input[type=submit]'),
                    canc = document.querySelector('#newReport .btn-group a'),
                    fd = [],
                    ent = new URLSearchParams(new FormData(document.querySelector('form#newReport')).entries());

                document.querySelector('li#report').setAttribute('data-active', '0');
                sub.disabled = true;
                sub.value = 'Submitting...';
                canc.style.display = 'none';

                for (const [key, value] of ent) {
                    fd.push([key, value]);
                }

                const send = await api(config.apiURL + 'newReport', fd);

                if (send.success == 1) {
                    setTimeout(() => {
                        document.querySelector('#data-form').remove();
                        notify('success', 'Your report was sent to us for review before it may be added to the map.');
                    }, 500);
                } else {
                    sub.disabled = false;
                    sub.value = 'Submit Report';
                    canc.style.display = 'block';

                    notify('error', 'There was an error submitting your report. Please try again.');
                }
            }
        }
    }
});

window.addEventListener('input', (e) => {
    /* perimeter min size change text */
    if (e.target.parentElement.id == 'perimeterSize' && e.target.classList.contains('slider')) {
        /*settings.updatePSize(e.target.value);*/
        document.querySelector('#pSize').innerHTML = e.target.value + ' acres';
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
            //'dark_mode': () => changeListener.darkMode(),
            'toggle-layer': () => changeListener.toggle(),
            'erc_time': () => {
                settings.updateSpecial();
                config.layersHandler.erc(false, true);
            },
            'sfc_smoke_time': () => changeListener.smoke(true),
            'vi_smoke_time': () => changeListener.smoke(false),
            'spc-outlook': () => changeListener.spc(),
            'ndfd': () => {
                settings.updateSpecial();
                new NWS().ndfd(true);
            },
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