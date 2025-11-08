!function (e) { if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var n; "undefined" != typeof window ? n = window : "undefined" != typeof global ? n = global : "undefined" != typeof self && (n = self), n.geojsonExtent = e() } }(function () { return function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = "function" == typeof require && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } for (var i = "function" == typeof require && require, o = 0; o < r.length; o++)s(r[o]); return s }({ 1: [function (require, module, exports) { function getExtent(_) { for (var ext = extent(), coords = geojsonCoords(_), i = 0; i < coords.length; i++)ext.include(coords[i]); return ext } var geojsonCoords = require("@mapbox/geojson-coords"), traverse = require("traverse"), extent = require("@mapbox/extent"), geojsonTypesByDataAttributes = { features: ["FeatureCollection"], coordinates: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"], geometry: ["Feature"], geometries: ["GeometryCollection"] }, dataAttributes = Object.keys(geojsonTypesByDataAttributes); module.exports = function (_) { return getExtent(_).bbox() }, module.exports.polygon = function (_) { return getExtent(_).polygon() }, module.exports.bboxify = function (_) { return traverse(_).map(function (value) { if (value) { var isValid = dataAttributes.some(function (attribute) { return value[attribute] ? -1 !== geojsonTypesByDataAttributes[attribute].indexOf(value.type) : !1 }); isValid && (value.bbox = getExtent(value).bbox(), this.update(value)) } }) } }, { "@mapbox/extent": 2, "@mapbox/geojson-coords": 4, traverse: 7 }], 2: [function (require, module, exports) { function Extent(bbox) { return this instanceof Extent ? (this._bbox = bbox || [1 / 0, 1 / 0, -(1 / 0), -(1 / 0)], void (this._valid = !!bbox)) : new Extent(bbox) } module.exports = Extent, Extent.prototype.include = function (ll) { return this._valid = !0, this._bbox[0] = Math.min(this._bbox[0], ll[0]), this._bbox[1] = Math.min(this._bbox[1], ll[1]), this._bbox[2] = Math.max(this._bbox[2], ll[0]), this._bbox[3] = Math.max(this._bbox[3], ll[1]), this }, Extent.prototype.equals = function (_) { var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] == other[0] && this._bbox[1] == other[1] && this._bbox[2] == other[2] && this._bbox[3] == other[3] }, Extent.prototype.center = function (_) { return this._valid ? [(this._bbox[0] + this._bbox[2]) / 2, (this._bbox[1] + this._bbox[3]) / 2] : null }, Extent.prototype.union = function (_) { this._valid = !0; var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] = Math.min(this._bbox[0], other[0]), this._bbox[1] = Math.min(this._bbox[1], other[1]), this._bbox[2] = Math.max(this._bbox[2], other[2]), this._bbox[3] = Math.max(this._bbox[3], other[3]), this }, Extent.prototype.bbox = function () { return this._valid ? this._bbox : null }, Extent.prototype.contains = function (ll) { if (!ll) return this._fastContains(); if (!this._valid) return null; var lon = ll[0], lat = ll[1]; return this._bbox[0] <= lon && this._bbox[1] <= lat && this._bbox[2] >= lon && this._bbox[3] >= lat }, Extent.prototype.intersect = function (_) { if (!this._valid) return null; var other; return other = _ instanceof Extent ? _.bbox() : _, !(this._bbox[0] > other[2] || this._bbox[2] < other[0] || this._bbox[3] < other[1] || this._bbox[1] > other[3]) }, Extent.prototype._fastContains = function () { if (!this._valid) return new Function("return null;"); var body = "return " + this._bbox[0] + "<= ll[0] &&" + this._bbox[1] + "<= ll[1] &&" + this._bbox[2] + ">= ll[0] &&" + this._bbox[3] + ">= ll[1]"; return new Function("ll", body) }, Extent.prototype.polygon = function () { return this._valid ? { type: "Polygon", coordinates: [[[this._bbox[0], this._bbox[1]], [this._bbox[2], this._bbox[1]], [this._bbox[2], this._bbox[3]], [this._bbox[0], this._bbox[3]], [this._bbox[0], this._bbox[1]]]] } : null } }, {}], 3: [function (require, module, exports) { module.exports = function (list) { function _flatten(list) { return Array.isArray(list) && list.length && "number" == typeof list[0] ? [list] : list.reduce(function (acc, item) { return Array.isArray(item) && Array.isArray(item[0]) ? acc.concat(_flatten(item)) : (acc.push(item), acc) }, []) } return _flatten(list) } }, {}], 4: [function (require, module, exports) { var geojsonNormalize = require("@mapbox/geojson-normalize"), geojsonFlatten = require("geojson-flatten"), flatten = require("./flatten"); module.exports = function (_) { if (!_) return []; var normalized = geojsonFlatten(geojsonNormalize(_)), coordinates = []; return normalized.features.forEach(function (feature) { feature.geometry && (coordinates = coordinates.concat(flatten(feature.geometry.coordinates))) }), coordinates } }, { "./flatten": 3, "@mapbox/geojson-normalize": 5, "geojson-flatten": 6 }], 5: [function (require, module, exports) { function normalize(gj) { if (!gj || !gj.type) return null; var type = types[gj.type]; return type ? "geometry" === type ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: gj }] } : "feature" === type ? { type: "FeatureCollection", features: [gj] } : "featurecollection" === type ? gj : void 0 : null } module.exports = normalize; var types = { Point: "geometry", MultiPoint: "geometry", LineString: "geometry", MultiLineString: "geometry", Polygon: "geometry", MultiPolygon: "geometry", GeometryCollection: "geometry", Feature: "feature", FeatureCollection: "featurecollection" } }, {}], 6: [function (require, module, exports) { module.exports = function e(t) { switch (t && t.type || null) { case "FeatureCollection": return t.features = t.features.reduce(function (t, r) { return t.concat(e(r)) }, []), t; case "Feature": return t.geometry ? e(t.geometry).map(function (e) { var r = { type: "Feature", properties: JSON.parse(JSON.stringify(t.properties)), geometry: e }; return void 0 !== t.id && (r.id = t.id), r }) : [t]; case "MultiPoint": return t.coordinates.map(function (e) { return { type: "Point", coordinates: e } }); case "MultiPolygon": return t.coordinates.map(function (e) { return { type: "Polygon", coordinates: e } }); case "MultiLineString": return t.coordinates.map(function (e) { return { type: "LineString", coordinates: e } }); case "GeometryCollection": return t.geometries.map(e).reduce(function (e, t) { return e.concat(t) }, []); case "Point": case "Polygon": case "LineString": return [t] } } }, {}], 7: [function (require, module, exports) { function Traverse(obj) { this.value = obj } function walk(root, cb, immutable) { var path = [], parents = [], alive = !0; return function walker(node_) { function updateState() { if ("object" == typeof state.node && null !== state.node) { state.keys && state.node_ === state.node || (state.keys = objectKeys(state.node)), state.isLeaf = 0 == state.keys.length; for (var i = 0; i < parents.length; i++)if (parents[i].node_ === node_) { state.circular = parents[i]; break } } else state.isLeaf = !0, state.keys = null; state.notLeaf = !state.isLeaf, state.notRoot = !state.isRoot } var node = immutable ? copy(node_) : node_, modifiers = {}, keepGoing = !0, state = { node: node, node_: node_, path: [].concat(path), parent: parents[parents.length - 1], parents: parents, key: path.slice(-1)[0], isRoot: 0 === path.length, level: path.length, circular: null, update: function (x, stopHere) { state.isRoot || (state.parent.node[state.key] = x), state.node = x, stopHere && (keepGoing = !1) }, "delete": function (stopHere) { delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, remove: function (stopHere) { isArray(state.parent.node) ? state.parent.node.splice(state.key, 1) : delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, keys: null, before: function (f) { modifiers.before = f }, after: function (f) { modifiers.after = f }, pre: function (f) { modifiers.pre = f }, post: function (f) { modifiers.post = f }, stop: function () { alive = !1 }, block: function () { keepGoing = !1 } }; if (!alive) return state; updateState(); var ret = cb.call(state, state.node); return void 0 !== ret && state.update && state.update(ret), modifiers.before && modifiers.before.call(state, state.node), keepGoing ? ("object" != typeof state.node || null === state.node || state.circular || (parents.push(state), updateState(), forEach(state.keys, function (key, i) { path.push(key), modifiers.pre && modifiers.pre.call(state, state.node[key], key); var child = walker(state.node[key]); immutable && hasOwnProperty.call(state.node, key) && (state.node[key] = child.node), child.isLast = i == state.keys.length - 1, child.isFirst = 0 == i, modifiers.post && modifiers.post.call(state, child), path.pop() }), parents.pop()), modifiers.after && modifiers.after.call(state, state.node), state) : state }(root).node } function copy(src) { if ("object" == typeof src && null !== src) { var dst; if (isArray(src)) dst = []; else if (isDate(src)) dst = new Date(src.getTime ? src.getTime() : src); else if (isRegExp(src)) dst = new RegExp(src); else if (isError(src)) dst = { message: src.message }; else if (isBoolean(src)) dst = new Boolean(src); else if (isNumber(src)) dst = new Number(src); else if (isString(src)) dst = new String(src); else if (Object.create && Object.getPrototypeOf) dst = Object.create(Object.getPrototypeOf(src)); else if (src.constructor === Object) dst = {}; else { var proto = src.constructor && src.constructor.prototype || src.__proto__ || {}, T = function () { }; T.prototype = proto, dst = new T } return forEach(objectKeys(src), function (key) { dst[key] = src[key] }), dst } return src } function toS(obj) { return Object.prototype.toString.call(obj) } function isDate(obj) { return "[object Date]" === toS(obj) } function isRegExp(obj) { return "[object RegExp]" === toS(obj) } function isError(obj) { return "[object Error]" === toS(obj) } function isBoolean(obj) { return "[object Boolean]" === toS(obj) } function isNumber(obj) { return "[object Number]" === toS(obj) } function isString(obj) { return "[object String]" === toS(obj) } var traverse = module.exports = function (obj) { return new Traverse(obj) }; Traverse.prototype.get = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) { node = void 0; break } node = node[key] } return node }, Traverse.prototype.has = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) return !1; node = node[key] } return !0 }, Traverse.prototype.set = function (ps, value) { for (var node = this.value, i = 0; i < ps.length - 1; i++) { var key = ps[i]; hasOwnProperty.call(node, key) || (node[key] = {}), node = node[key] } return node[ps[i]] = value, value }, Traverse.prototype.map = function (cb) { return walk(this.value, cb, !0) }, Traverse.prototype.forEach = function (cb) { return this.value = walk(this.value, cb, !1), this.value }, Traverse.prototype.reduce = function (cb, init) { var skip = 1 === arguments.length, acc = skip ? this.value : init; return this.forEach(function (x) { this.isRoot && skip || (acc = cb.call(this, acc, x)) }), acc }, Traverse.prototype.paths = function () { var acc = []; return this.forEach(function (x) { acc.push(this.path) }), acc }, Traverse.prototype.nodes = function () { var acc = []; return this.forEach(function (x) { acc.push(this.node) }), acc }, Traverse.prototype.clone = function () { var parents = [], nodes = []; return function clone(src) { for (var i = 0; i < parents.length; i++)if (parents[i] === src) return nodes[i]; if ("object" == typeof src && null !== src) { var dst = copy(src); return parents.push(src), nodes.push(dst), forEach(objectKeys(src), function (key) { dst[key] = clone(src[key]) }), parents.pop(), nodes.pop(), dst } return src }(this.value) }; var objectKeys = Object.keys || function (obj) { var res = []; for (var key in obj) res.push(key); return res }, isArray = Array.isArray || function (xs) { return "[object Array]" === Object.prototype.toString.call(xs) }, forEach = function (xs, fn) { if (xs.forEach) return xs.forEach(fn); for (var i = 0; i < xs.length; i++)fn(xs[i], i, xs) }; forEach(objectKeys(Traverse.prototype), function (key) { traverse[key] = function (obj) { var args = [].slice.call(arguments, 1), t = new Traverse(obj); return t[key].apply(t, args) } }); var hasOwnProperty = Object.hasOwnProperty || function (obj, key) { return key in obj } }, {}] }, {}, [1])(1) });

class Popup {
    constructor(title, tall = false) {
        this.header = '<div class="header"' + (!title ? ' style="margin-bottom:0"' : '') + '><h1>' + title + '</h1><span id="close-popup" data-action="close-popup" title="Close popup" class="far fa-xmark-large"></span></div>';
        this.tall = tall;
        this.dialog = null;
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

class UTM {
    constructor() {
        this.k0 = 0.9996; // scale factor
        this.e = 0.00669438; // eccentricity
        this.e1sq = 0.006739497; // second eccentricity squared
        this.a = 6378137; // major radius of the WGS84 ellipsoid
    }

    toUTM(lat, lon) {
        let zoneNumber = Math.floor((lon + 180) / 6) + 1;

        // Special zone for Norway
        if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) {
            zoneNumber = 32;
        }

        // Special zones for Svalbard
        if (lat >= 72.0 && lat < 84.0) {
            if (lon >= 0.0 && lon < 9.0) {
                zoneNumber = 31;
            } else if (lon >= 9.0 && lon < 21.0) {
                zoneNumber = 33;
            } else if (lon >= 21.0 && lon < 33.0) {
                zoneNumber = 35;
            } else if (lon >= 33.0 && lon < 42.0) {
                zoneNumber = 37;
            }
        }

        let lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;
        let lonOriginRad = deg2rad(lonOrigin);

        let latRad = deg2rad(lat);
        let lonRad = deg2rad(lon);

        let N = this.a / Math.sqrt(1 - this.e * Math.sin(latRad) * Math.sin(latRad));
        let T = Math.tan(latRad) * Math.tan(latRad);
        let C = this.e1sq * Math.cos(latRad) * Math.cos(latRad);
        let A = Math.cos(latRad) * (lonRad - lonOriginRad);

        let M = this.a * ((1 - this.e / 4 - 3 * this.e * this.e / 64 - 5 * this.e * this.e * this.e / 256) * latRad
            - (3 * this.e / 8 + 3 * this.e * this.e / 32 + 45 * this.e * this.e * this.e / 1024) * Math.sin(2 * latRad)
            + (15 * this.e * this.e / 256 + 45 * this.e * this.e * this.e / 1024) * Math.sin(4 * latRad)
            - (35 * this.e * this.e * this.e / 3072) * Math.sin(6 * latRad));

        let UTMEasting = this.k0 * N * (A + (1 - T + C) * A * A * A / 6
            + (5 - 18 * T + T * T + 72 * C - 58 * this.e1sq) * A * A * A * A * A / 120) + 500000.0;

        let UTMNorthing = this.k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
            + (61 - 58 * T + T * T + 600 * C - 330 * this.e1sq) * A * A * A * A * A * A / 720));

        if (lat < 0) {
            UTMNorthing += 10000000.0; // 10000000 meter offset for southern hemisphere
        }

        return zoneNumber + 'T ' + UTMEasting.toFixed(1) + 'E ' + UTMNorthing.toFixed(1) + 'N';
    }
}

class Subscription {
    constructor(u) {
        this.sub = null;
        this.user = u;

        if (this.user && this.user.subscriptions != null) {
            this.user.subscriptions.forEach((s) => {
                if (s.plan == config.sub_id) {
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

class Weather {
    constructor(lat = null, lon = null) {
        this.lat = lat != null ? parseFloat(lat) : null;
        this.lon = lon != null ? parseFloat(lon) : null;
    }

    windIndicator(d) {
        return '<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(' + d + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>';
    }

    async incidentWX() {
        try {
            const wx = await api(config.apiURL + 'weather/nearby', [['radius', this.lat + ',' + this.lon + ',30'], ['latest', 1]]);

            if (wx.weather) {
                let o = wx.weather.obs,
                    name = wx.weather.name,
                    t = (o.temp.current ? Math.round(o.temp.current) : '--'),
                    rh = (o.rh ? Math.round(o.rh) : '--'),
                    wd = (o.wind_dir ? o.wind_dir : '--'),
                    rwd = (o.raw_wind_dir ? o.raw_wind_dir : null),
                    ws = (o.wind_speed ? Math.round(o.wind_speed) : '--'),
                    u = timeAgo(wx.weather.updated);

                /* format temperature */
                if (settings.weather() && settings.weather().temp() == 'c' && t != '--') {
                    t = conversion.FtoC(t) + '&deg;C';
                } else {
                    t += '&deg;F';
                }

                /* format wind speed */
                if (settings.weather() && settings.weather().wind() != 'mph' && ws != '--') {
                    ws = conversion.speed(ws, settings.weather().wind()) + ' ' + settings.weather().wind();
                } else {
                    ws += ' mph';
                }

                const t1 = document.querySelector('#curwx #a h3'),
                    rh1 = document.querySelector('#curwx #b h3'),
                    w1 = document.querySelector('#curwx #c h3'),
                    up = document.querySelector('#curwx .updated');

                if (t1 && rh1 && w1) {
                    t1.innerHTML = t;
                    rh1.innerHTML = (!o.rh || rh == '--' ? '--' : rh + '%');
                    w1.querySelector('svg').style.transform = 'rotate(' + rwd + 'deg)';
                    w1.querySelector('span').innerHTML = wd == 'V' && ws == '-- mph' && rwd != null ? '--' : ws;
                    w1.setAttribute('title', 'Winds are ' + wd + ' at ' + ws);

                    up.innerHTML = `Last report ${u}${settings.hasPermissions('PREMIUM') ? ' @ ' + name : ''}`;
                }
            } else {
                document.querySelector('#curwx').innerHTML = '<h2>Nearby Weather Conditions</h2><div class="message error">No current weather conditions are available near this incident.</div>';
            }
        } catch (error) {
            console.error('There is an error getting current conditions', error);
            document.querySelector('#curwx').innerHTML = '<h2>Nearby Weather Conditions</h2><div class="message error">No current weather conditions are available near this incident.</div>';
        }
    }

    async incidentForecast() {
        let temp = [],
            rh = [],
            wind = [];

        try {
            const ap = await api('https://api.weather.gov/points/' + this.lat.toFixed(4) + ',' + this.lon.toFixed(4));
            const data = await api(ap.properties.forecastGridData),
                prop = data.properties;

            if (prop.temperature) {
                for (let i = 0; i < prop.temperature.values.length; i++) {
                    let t = new Date(prop.temperature.values[i].validTime.split('/')[0]).getTime();

                    if (t >= new Date().getTime() && (t - new Date().getTime()) < 86400000) {
                        temp.push(prop.temperature.values[i].value);
                        rh.push(prop.relativeHumidity.values[i].value);

                        if (prop.windSpeed.values[i]) {
                            wind.push(prop.windSpeed.values[i].value);
                        }
                    }
                }

                let a = Math.round((Math.max.apply(null, temp) * 1.8) + 32),
                    b = Math.min.apply(null, rh),
                    c = Math.round((wind.reduce((partialSum, a) => partialSum + a, 0) / wind.length) / 1.609),
                    d = Math.round(Math.max.apply(null, wind) / 1.609),
                    mt = document.querySelector('#fcstwx #a h3'),
                    mh = document.querySelector('#fcstwx #b h3'),
                    aw = document.querySelector('#fcstwx #c h3'),
                    mw = document.querySelector('#fcstwx #d h3'),
                    u = document.querySelector('#fcstwx .updated');

                /*rating(a, b, c, d);*/

                if (settings.weather() && settings.weather().temp() == 'c') {
                    a = conversion.FtoC(a) + '&deg;C';
                } else {
                    a += '&deg;F';
                }

                if (settings.weather() && settings.weather().wind() != 'mph') {
                    c = conversion.speed(c, settings.weather().wind()) + ' ' + settings.weather().wind();
                    d = conversion.speed(d, settings.weather().wind()) + ' ' + settings.weather().wind();
                } else {
                    c += ' mph';
                    d += ' mph';
                }

                mt.innerHTML = a;
                mh.innerHTML = b + '%';
                aw.innerHTML = (c.toString() == 'NaN mph' ? '--' : c);
                mw.innerHTML = (d.toString() == '-Infinity mph' ? '--' : d);

                u.innerHTML = `Last forecasted ${timeAgo(new Date(prop.updateTime).getTime())}`;
            } else {
                console.error('There is an error getting FWF', error);
                document.querySelector('#fcstwx').innerHTML = '<h2>Incident Weather Concerns</h2><div class="message error">The 24-hour fire forecast is unavailable at this time.</div>';
            }
        } catch (error) {
            console.error('There is an error getting FWF', error);
            document.querySelector('#fcstwx').innerHTML = '<h2>Incident Weather Concerns</h2><div class="message error">The 24-hour fire forecast is unavailable at this time.</div>';
        }

        return this;
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
                    const t = s.OBSERVATIONS.air_temp_value_1.value;

                    if (settings.weather() && settings.weather().temp() == 'c' && t != '--') {
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
                            'circle-color': [
                                'case',
                                ['all', ['>=', ['get', 'temp'], -20], ['<', ['get', 'temp'], -10]], 'rgb(117,107,177)',
                                ['all', ['>=', ['get', 'temp'], -10], ['<', ['get', 'temp'], 0]], 'rgb(13,0,125)',
                                ['all', ['>=', ['get', 'temp'], 0], ['<', ['get', 'temp'], 10]], 'rgb(0,102,194)',
                                ['all', ['>=', ['get', 'temp'], 10], ['<', ['get', 'temp'], 20]], 'rgb(74,199,255)',
                                ['all', ['>=', ['get', 'temp'], 20], ['<', ['get', 'temp'], 30]], 'rgb(173,255,255)',
                                ['all', ['>=', ['get', 'temp'], 30], ['<', ['get', 'temp'], 40]], 'rgb(0,153,150)',
                                ['all', ['>=', ['get', 'temp'], 40], ['<', ['get', 'temp'], 50]], 'rgb(6,109,44)',
                                ['all', ['>=', ['get', 'temp'], 50], ['<', ['get', 'temp'], 60]], 'rgb(116,196,118)',
                                ['all', ['>=', ['get', 'temp'], 60], ['<', ['get', 'temp'], 70]], 'rgb(211,255,190)',
                                ['all', ['>=', ['get', 'temp'], 70], ['<', ['get', 'temp'], 80]], 'rgb(255,237,160)',
                                ['all', ['>=', ['get', 'temp'], 80], ['<', ['get', 'temp'], 90]], 'rgb(254,174,42)',
                                ['all', ['>=', ['get', 'temp'], 90], ['<', ['get', 'temp'], 100]], 'rgb(252,78,42)',
                                ['all', ['>=', ['get', 'temp'], 100], ['<', ['get', 'temp'], 110]], 'rgb(177,0,38)',
                                ['all', ['>=', ['get', 'temp'], 110], ['<', ['get', 'temp'], 120]], 'rgb(89,0,66)',
                                'rgb(40,0,40)'
                            ],
                            'circle-radius': [
                                'case',
                                ['>', ['get', 'temp'], 99], 15,
                                13
                            ]
                        }
                    }).addLayer({
                        id: 'stns_text',
                        type: 'symbol',
                        source: 'stns',
                        filter: [
                            'all',
                            ['!=', ['get', 'temp'], ''],
                            ['!', ['has', 'point_count']]
                        ],
                        paint: {
                            'text-color': [
                                'case',
                                ['all', ['>=', ['get', 'temp'], -20], ['<', ['get', 'temp'], -10]], '#222',
                                ['all', ['>=', ['get', 'temp'], -10], ['<', ['get', 'temp'], 0]], '#fff',
                                ['all', ['>=', ['get', 'temp'], 0], ['<', ['get', 'temp'], 10]], '#fff',
                                ['all', ['>=', ['get', 'temp'], 10], ['<', ['get', 'temp'], 20]], '#222',
                                ['all', ['>=', ['get', 'temp'], 20], ['<', ['get', 'temp'], 30]], '#222',
                                ['all', ['>=', ['get', 'temp'], 30], ['<', ['get', 'temp'], 40]], '#fff',
                                ['all', ['>=', ['get', 'temp'], 40], ['<', ['get', 'temp'], 50]], '#fff',
                                ['all', ['>=', ['get', 'temp'], 50], ['<', ['get', 'temp'], 60]], '#222',
                                ['all', ['>=', ['get', 'temp'], 60], ['<', ['get', 'temp'], 70]], '#222',
                                ['all', ['>=', ['get', 'temp'], 70], ['<', ['get', 'temp'], 80]], '#222',
                                ['all', ['>=', ['get', 'temp'], 80], ['<', ['get', 'temp'], 90]], '#222',
                                ['all', ['>=', ['get', 'temp'], 90], ['<', ['get', 'temp'], 100]], '#222',
                                ['all', ['>=', ['get', 'temp'], 100], ['<', ['get', 'temp'], 110]], '#222',
                                ['all', ['>=', ['get', 'temp'], 110], ['<', ['get', 'temp'], 120]], '#222',
                                '#222'
                            ]
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 150,
                            'text-font': ['Roboto Regular'],
                            'text-field': ['concat', ['get', 'temp'], '°'],
                            'text-justify': 'center',
                            'text-size': 13,
                            'text-offset': [0, 0.2]
                        }
                    }).on('mouseenter', 'stns', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'stns', () => {
                        map.getCanvas().style.cursor = 'auto';
                    })/*.on('click', 'stns', (e) => {
                    const stn = map.queryRenderedFeatures(e.point, {
                        layers: ['stns']
                    });

                    if (stn.length > 0) {
                        let p = stn[0].properties,
                            obs = JSON.parse(p.OBSERVATIONS),
                            t = obs.air_temp_value_1.value,
                            rh = obs.relative_humidity_value_1.value,
                            wd = obs.wind_direction_value_1.value,
                            ws = obs.wind_speed_value_1.value,
                            fl = (t < 60 && ws ? conversion.windChill(t, ws) : (t && rh ? conversion.heatIndex(t, rh) : null));

                        /* format temperature *//*
                        if (settings.weather() && settings.weather().temp() == 'c' && t != '--') {
                            t = conversion.FtoC(t) + '&deg;C';
                            fl = fl == null ? null : conversion.FtoC(fl) + '&deg;C';
                        } else {
                            t += '&deg;F';
                            fl += fl == null ? '' : '&deg;F';
                        }

                        if (wd) {
                            wd = conversion.getCompassDirection(wd);
                        } else {
                            wd = 'Variable';
                        }

                        /* format wind speed *//*
                        if (settings.weather() && settings.weather().wind() != 'mph' && ws != '--') {
                            ws = conversion.speed(ws, settings.weather().wind()) + ' ' + settings.weather().wind();
                        } else {
                            ws += ' mph';
                        }

                        new mapboxgl.Popup()
                            .setLngLat(stn[0].geometry.coordinates)
                            .setHTML('<h1>' + p.NAME + '</h1><p><b>Temperature:</b> ' + Math.round(t) + '</p>' + (fl != null ? '<p><b>Feels Like:</b> ' + fl : '') + '<p><b>Humidity:</b> ' + Math.round(rh) + '%</p>' +
                                '<p><b>Wind:</b> ' + (ws == 0 ? 'Calm' : wd + ' at ' + ws) + '</p><p class="updated">Last report ' + timeAgo(new Date(obs.air_temp_value_1.date_time).getTime()) + '</p>')
                            .addTo(map);
                    }
                })*/;
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
                        const dist = distance(this.lat, this.lon, f.geometry.coordinates[1], f.geometry.coordinates[0]);

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

    changeBasemap() {
        const tile = this.target.getAttribute('data-tile');

        map.setStyle(config.tiles[tile], {
            diff: false
        }).on('style.load', () => {
            const wf = new Wildfires();
            wf.displayFires('all', 0);
            wf.displayFires('new', 1);
            wf.displayFires('smk', 2);
            wf.displayFires('rx', 3);
        });

        settings.settings.tile = tile;
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

    darkMode() {
        let useTile = '',
            url = `${config.host}src/css/mf.app-dark_mode-${version}.css`,
            on = target.checked ? true : false,
            isLoaded = () => {
                const sheets = document.styleSheets;

                for (let i = 0; i < sheets.length; i++) {
                    if (sheets[i].href && sheets[i].href.indexOf(url) !== -1) {
                        return true;
                    }
                }

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
            useTile = settings.getBasemap();
            document.body.classList.remove('dark-mode');
        }

        map.setStyle(config.tiles[useTile], {
            diff: false
        }).on('style.load', () => {
            const wf = new Wildfires();
            wf.displayFires('all', 0);
            wf.displayFires('new', 1);
            wf.displayFires('smk', 2);
            wf.displayFires('rx', 3);
        });

        const ts = new Date();
        const date = ts.setTime(ts.getTime() + (60 * 60 * 24 * 30 * 1000)),
            expires = `; expires=${new Date(date).toGMTString()}`;

        document.cookie = `dark_mode=${on ? 'true' : 'false'}` + expires + '; domain=.' + window.location.hostname + '; path=/; secure';
    }

    toggle() {
        const layers = [];

        document.querySelectorAll('.layChkBx').forEach((e) => {
            if (e.checked) {
                layers.push(e.id);
            }
        });

        /* update settings to reflect anytime a checkbox is selected or not */
        settings.updateLayers(layers);

        /* toggle the layer on or off*/
        toggleLayer(this.target);
    }

    smoke(sfc) {
        const layers = new Layers(),
            selected = this.target.options[target.selectedIndex].value;

        if (sfc) {
            layers.sfcSmoke(selected);
        } else {
            layers.viSmoke(selected);
        }
    }

    spc() {
        const type = document.querySelector('#otlkType'),
            days = document.querySelector('#otlkDay');

        /* add or remove day 3 depending on if the user is looking at severe or fire wx outlooks */
        if (type.value == 'severe') {
            const li = document.createElement('option');
            li.value = 3;
            li.text = 'Day 3';
            days.appendChild(li);
        } else {
            for (let i = 0; i < days.options.length; i++) {
                if (days.options[i].value == '3') {
                    days.options[i].remove();
                    break;
                }
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

function convertToDms(dd, isLng) {
    var dir = dd < 0
        ? isLng ? 'W' : 'S'
        : isLng ? 'E' : 'N';

    var absDd = Math.abs(dd),
        deg = absDd | 0,
        frac = absDd - deg,
        min = (frac * 60) | 0,
        sec = Math.round((frac * 3600 - min * 60) * 100) / 100;

    return deg + "&deg; " + min + "' " + sec + '" ' + dir;
}

function rad2deg(rad) {
    return rad / Math.PI * 180;
}

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371,
        dLat = deg2rad(lat2 - lat1),
        dLon = deg2rad(lon2 - lon1),
        a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c;

    return (d / 1.609);
}

function dateTime(it, time = false, timezone = false) {
    let t = new Date(it.toString().length == 10 ? it * 1000 : it),
        h = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())),
        m = (t.getMinutes() < 10 ? '0' : '') + t.getMinutes(),
        a = h + ':' + m + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M',
        s = (/\((.*?)\)/g).exec(new Date().toString())[1].split(' '),
        tz = s[0].substring(0, 1) + s[1].substring(0, 1) + s[2].substring(0, 1);

    return config.months[t.getMonth()] + ' ' + t.getDate() + ',&nbsp;' + t.getFullYear() + (time ? ' at ' + a : '') + (timezone ? ' ' + tz : '');
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

        o += '<option ' + (settings.get('special') && settings.get('special').fcstTime == ts ? 'selected ' : '') + 'value="' + ts + '">' + (lh == 0 ? '12' : lh) + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M</option>';
    }

    return o;
}

function sfpTimes() {
    let o = '';

    for (let z = 0; z < 6; z++) {
        let t = new Date(new Date().getTime() + (z * 24 * 60 * 60 * 1000)),
            d = config.days[t.getUTCDay()] + ', ' + config.months[t.getUTCMonth()] + ' ' + t.getUTCDate(),
            v = t.getUTCFullYear() + '-' + (t.getUTCMonth() < 10 ? '0' : '') + (t.getUTCMonth() + 1) + '-' + (t.getUTCDate() < 10 ? '0' : '') + t.getUTCDate() + 'T00:00:00.0Z';

        o += '<option value="' + v + '">' + d + (z == 0 ? ' (Today)' : (z == 1 ? ' (Tomorrow)' : '')) + '</option>';
    }

    return o;
}

function setHeaders(a, b, c) {
    const title = `${a} | ${config.productName}`,
        s = window.location.search,
        h = window.location.hash;

    window.history.pushState({
        "pageTitle": title
    }, '', config.specificURL + b.replace('incident/', '').replace('wildfire/', 'fires/') + (s ? s : '') + (h ? h : ''));

    document.title = title;
    document.querySelector('meta[property="og:title"]').setAttribute('content', title);
    document.querySelector('meta[name="twitter:title"]').setAttribute('content', title);
    document.querySelector('meta[name="description"]').setAttribute('content', c);
    document.querySelector('meta[property="og:description"]').setAttribute('content', c);
    document.querySelector('meta[name="twitter:description"]').setAttribute('content', c);
}

function unsetHeaders() {
    const h = window.location.href;

    if (h.search('fires') >= 0 || h.search('weather/') >= 0 || h.search('risk') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', h.replace(window.location.pathname, ''));

        document.title = defaultTitle;
        document.querySelector('meta[property="og:title"]').setAttribute('content', defaultTitle);
        document.querySelector('meta[name="twitter:title"]').setAttribute('content', defaultTitle);
        document.querySelector('meta[name="description"]').setAttribute('content', defaultDesc);
        document.querySelector('meta[property="og:description"]').setAttribute('content', defaultDesc);
        document.querySelector('meta[name="twitter:description"]').setAttribute('content', defaultDesc);
    }
}

function notify(t, m) {
    const timing = (((m.split(' ').length / 5) + 0.5) * 1000) + 500,
        el = document.createElement('div');

    if (document.querySelector('div.alert')) {
        document.querySelector('div.alert').remove();
    }

    el.classList.add('alert', t);

    if (modal.classList.contains('open')) {
        el.classList.add('mo');
    }

    el.style.display = 'flex';
    el.innerHTML = '<i class="fas ' + (t == 'success' ? 'fa-check' : (t == 'info' ? 'fa-circle-info' : 'fa-circle-exclamation')) + '"></i><p>' + m + '</p>';
    document.body.append(el);

    setTimeout(() => {
        el.remove();
    }, timing);
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
            send.push(['token', settings.getToken()]);
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

            console.info('Settings saved ' + (method ? 'automatic' : 'manu' + 'ally'));
            notify('success', 'Your settings were successfully synced.');
        }
    } else {
        notify('error', 'Unable to sync your settings due to no internet.');
    }
}

function newFiresReport() {
    let content = document.createElement('ul');
    content.classList.add('new_fires');

    newFires.forEach((fire) => {
        const li = document.createElement('li'),
            name = fire.properties.name + (fire.properties.type == 'Wildfire' ? ' Fire' : ''),
            near = fire.properties.near,
            acres = fire.properties.acres,
            size = conversion.sizing(2, acres) + ' ' + conversion.sizing(1).toLowerCase()/*,
            ago = timeAgo(fire.properties.time.discovered)*/;

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
    let county = '';
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
    }

    if (settings.user != null) {
        document.querySelector('#newReport input[name=authUser]').value = 1;
        document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<input type="hidden" name="uid" value="' + settings.user.uid + '">');
    }

    document.querySelector('#newReport input[name=lat]').value = lat;
    document.querySelector('#newReport input[name=lon]').value = lon;
    document.querySelector('#newReport input[id=gc]').value = county ? county : 'Undetermined';
    document.querySelector('#newReport input[id=gl]').value = data.geocode.near;
    document.querySelector('#newReport input[id=gs]').value = data.geocode.state ? stateLabels[data.geocode.state].v : 'Undetermined';
    document.querySelector('#newReport input[name=geolocation]').value = data.geocode.near;
    document.querySelector('#newReport input[name=state]').value = data.geocode.state + ' / ' + stateLabels[data.geocode.state].v;

    document.querySelector('#newReport input[name=size]').addEventListener('keyup', (e) => {
        document.querySelector('#newReport #alab').innerHTML = 'acre' + (e.target.value != 1 ? 's' : '');
    });

    config.disableClicks = false;
}

async function onRasterLayerClick(coords) {
    const drought = map.getStyle().layers.find(l => l.id === 'drought'),
        bp = map.getStyle().layers.find(l => l.id === 'bp'),
        rth = map.getStyle().layers.find(l => l.id === 'rth');

    if (drought && drought.layout.visibility.toString() == 'visible') {
        const popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>'),
            geo = encodeURIComponent(`{"x":${coords.lng},"y":${coords.lat},"spatialReference":{"latestWkid":4326}}`);

        await fetch(`https://gis.fema.gov/arcgis/rest/services/Partner/Drought_Current/MapServer/0/query?where=1%3D1&geometry=${geo}&geometryType=esriGeometryPoint&inSR=4326&outFields=dm,update_dat&returnGeometry=false&f=json`)
            .then(async (resp) => {
                let level = 'No Drought',
                    upd = 'N/A',
                    data = await resp.json();

                if (data.features.length > 0) {
                    const p = data.features[0].attributes;
                    upd = timeAgo(p.update_dat);

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

    if (rth && rth.layout.visibility.toString() == 'visible' && map.getZoom() >= 6) {
        const popup = new Popup('Wildfire Risk', true).create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>'),
            f = map.queryRenderedFeatures(map.project(coords)),
            getRisk = async (fips) => {
                const data = await api(config.apiURL + 'risk/' + fips);

                a = Math.round(data.data.rps.state * 100),
                    b = Math.round(data.data.rps.us * 100),
                    state = 'On average, ' + data.name + ' has a ' + (a < 5 ? 'lower' : 'greater') + ' risk than ' + (a < 5 ? 'nearly all' : a + '% of') + ' other counties in ' + stateLabels[data.state].v,
                    us = 'On average, ' + data.name + ' has a ' + (b < 5 ? 'lower' : 'greater') + ' risk than ' + (b < 5 ? 'nearly all' : b + '% of') + ' other counties in the US',
                    content = `<div class="item"><div class="t">Location</div><div class="v">${data.name}, ${data.state}</div></div>
                        <div class="item"><div class="t">Risk to Homes</div><div class="v">${data.data.rps.rank}</div></div>
                        <div class="item"><div class="t">State Comparison</div><div class="v">${state}</div></div>
                        <div class="item"><div class="t">US Comparison</div><div class="v">${us}</div></div>
                        <a target="blank" href="https://wildfirerisk.org/explore/risk-to-homes/${fips.substring(0, 2)}/${fips}/">Learn More</a>`;

                popup.update(content);
            };

        for (let i = 0; i < f.length; i++) {
            if (f[i].layer.id == 'us-counties') {
                getRisk(f[i].properties.FIPS);
                break;
            }
        }
    }

    if (bp && bp.layout.visibility.toString() == 'visible' && map.getZoom() >= 6) {
        const popup = new Popup('Wildfire Likelihood', true).create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>'),
            f = map.queryRenderedFeatures(map.project(coords)),
            getRisk = async (fips) => {
                const data = await api(config.apiURL + 'risk/' + fips);

                a = Math.round(data.data.bp.state * 100),
                    b = Math.round(data.data.bp.us * 100),
                    state = 'On average, ' + data.name + ' has a ' + (a < 5 ? 'lower' : 'greater') + ' risk than ' + (a < 5 ? 'nearly all' : a + '% of') + ' other counties in ' + stateLabels[data.state].v,
                    us = 'On average, ' + data.name + ' has a ' + (b < 5 ? 'lower' : 'greater') + ' risk than ' + (b < 5 ? 'nearly all' : b + '% of') + ' other counties in the US',
                    content = `<div class="item"><div class="t">Location</div><div class="v">${data.name}, ${data.state}</div></div>
                        <div class="item"><div class="t">Wildfire Likelihood</div><div class="v">${data.data.bp.rank}</div></div>
                        <div class="item"><div class="t">State Comparison</div><div class="v">${state}</div></div>
                        <div class="item"><div class="t">US Comparison</div><div class="v">${us}</div></div>
                        <a target="blank" href="https://wildfirerisk.org/explore/wildfire-likelihood/${fips.substring(0, 2)}/${fips}/">Learn More</a>`;

                popup.update(content);
            };

        for (let i = 0; i < f.length; i++) {
            if (f[i].layer.id == 'us-counties') {
                getRisk(f[i].properties.FIPS);
                break;
            }
        }
    }
}

async function onMapClick(e) {
    const features = map.queryRenderedFeatures([
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
    ]);

    onRasterLayerClick(e.lngLat);

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

                if (settings.fire().display()) {
                    wfClass.incident(data.wfid, true);
                } else {
                    window.open(config.host + feature.properties.url);
                }

                break;
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
                const name = feature.properties.attr_IncidentName.replace(' Fire', '') + ' Fire',
                    ago = timeAgo(feature.properties.poly_DateCurrent),
                    acres = feature.properties.poly_Acres_AutoCalc > feature.properties.poly_GISAcres ? feature.properties.poly_Acres_AutoCalc : feature.properties.poly_GISAcres,
                    size = conversion.sizing(2, acres) + ' ' + conversion.sizing(1).toLowerCase();

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
                const color = (feature.properties.fill == '#66A366' || feature.properties.fill == '#ff3333' ? ';color:#fff' : ''),
                    content = `<div class="item">
                        <div class="t">Risk</div><div class="v"><span class="spc" style="background-color:${feature.properties.fill}${color}">${feature.properties.name}</span></div>
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
                let p = feature.properties,
                    psa = p.PSANAME,
                    code = p.PSANationalCode,
                    obs_pct = p.avg_ec_percentile,
                    obs_trend = p.avg_ec_trend.replace('ase', 'asing'),
                    fcst_pct = p.avg_ec_fcast_percentile,
                    fcst_trend = p.avg_ec_fcast_trend.replace('ase', 'asing'),
                    chart = p.ERC_Chart_URL,
                    dt = dateTime(new Date(p.nfdr_dt).getTime()),
                    erc = '',
                    date = '',
                    popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>' +
                        '<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting ERC data...</p>');;

                if (settings.special().erc() == null || settings.special().erc() == 'obs') {
                    date = dateTime(new Date().getTime()) + ' (Today)';
                    erc = '<div class="item"><div class="t">ERC Percentile</div><div class="v">' + obs_pct + '%</div></div>' +
                        '<div class="item"><div class="t">ERC Trend</div><div class="v">' + obs_trend + '</div></div>';
                } else {
                    date = dateTime((new Date().getTime()) + 86400000) + ' (Tomorrow)';
                    erc = '<div class="item"><div class="t">ERC Percentile</div><div class="v">' + fcst_pct + '%</div></div>' +
                        '<div class="item"><div class="t">ERC Trend</div><div class="v">' + fcst_trend + '</div></div>';
                }

                const ec = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/DRAFT_NFDRS_v3_view/FeatureServer/0/query?where=PSA+%3D+%27' + code + '%27&returnGeometry=false&outFields=AVG(ec)%20AS%20average&f=json');

                    const ercContent = `<div class="item"><div class="t">ERC Date</div><div class="v">${date}</div></div>
                        <div class="item"><div class="t">Area (PSA)</div><div class="v">${psa}</div></div>
                        ${settings.hasPermissions() ? `<div class="item"><div class="t">PSA Code</div><div class="v">${code}</div></div>` : ``}
                        ${ec ? `<div class="item"><div class="t">Current ERC Value</div><div class="v">${ec.features[0].attributes.average.toFixed(2)}</div></div>` : ``}
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
                        '<div class="item"><div class="t">Vulnerability</div><div class="v">' + (p.Overall_Vu / 6.96).toFixed(1) + '/100 (' + rank(p.Overall_Vu) + ')</div></div>';

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
                    <a target="blank" href="https://hazards.fema.gov/nri/report/viewer?dataLOD=Counties&dataIDs=${p.NRI_ID}" style="display:block;text-align:center">Full Report</a>`;

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
                const popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>'),
                    fdr = (r) => {
                        r = r.replace(' ', '');

                        switch (r) {
                            case 'L': return 'Low';
                            case 'M': return 'Moderate';
                            case 'H': return 'High';
                            case 'E': return 'Extreme';
                        }
                    };
                let p = feature.properties,
                    stnID = p.STID;
                    
                const raws = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/DRAFT_NFDRS_v3_view/FeatureServer/0/query?where=MesoWestURL+LIKE+%27%25' + stnID + '%25%27&resultRecordCount=1&outFields=one_hr%2Cten_hr%2Chu_hr%2Cth_hr%2Cic%2Csc%2Cec%2Cbi%2Cadj%2Ckbdi&returnGeometry=false&f=json');

                let rawsData = '',
                    obs = JSON.parse(p.OBSERVATIONS),
                    t = obs.air_temp_value_1.value,
                    rh = obs.relative_humidity_value_1.value,
                    wd = obs.wind_direction_value_1.value,
                    ws = obs.wind_speed_value_1.value,
                    fl = (t < 60 && ws ? conversion.windChill(t, ws) : (t && rh ? conversion.heatIndex(t, rh) : null));

                /* format temperature */
                if (settings.weather() && settings.weather().temp() == 'c' && t != null) {
                    t = conversion.FtoC(t) + '&deg;C';
                    fl = fl == null ? null : conversion.FtoC(fl) + '&deg;C';
                } else {
                    t = Math.round(t) + '&deg;F';
                    fl += fl == null ? '' : '&deg;F';
                }

                if (wd) {
                    wd = conversion.getCompassDirection(wd);
                } else {
                    wd = 'Variable';
                }

                /* format wind speed */
                if (settings.weather() && settings.weather().wind() != 'mph' && ws != null) {
                    ws = conversion.speed(ws, settings.weather().wind()) + ' ' + settings.weather().wind();
                } else {
                    ws += ' mph';
                }

                if (raws && raws.features.length > 0) {
                    rawsData = '<div class="item"><div class="t">1-hr Fuel Moisture</div><div class="v">' + raws.features[0].attributes.one_hr.toFixed(1) + '%</div></div>' +
                        '<div class="item"><div class="t">10-hr Fuel Moisture</div><div class="v">' + raws.features[0].attributes.ten_hr.toFixed(1) + '%</div></div>' +
                        '<div class="item"><div class="t">100-hr Fuel Moisture</div><div class="v">' + raws.features[0].attributes.hu_hr.toFixed(1) + '%</div></div>' +
                        '<div class="item"><div class="t">1000-hr Fuel Moisture</div><div class="v">' + raws.features[0].attributes.th_hr.toFixed(1) + '%</div></div>' +
                        '<div class="item"><div class="t">Ignition Component</div><div class="v">' + raws.features[0].attributes.ic + '</div></div>' +
                        '<div class="item"><div class="t">Spread Component</div><div class="v">' + raws.features[0].attributes.sc + '</div></div>' +
                        '<div class="item"><div class="t">Energy Release Component</div><div class="v">' + raws.features[0].attributes.ec + '</div></div>' +
                        '<div class="item"><div class="t">Burning Index</div><div class="v">' + raws.features[0].attributes.bi + '</div></div>' +
                        '<div class="item"><div class="t">Keetch-Byram Drought Index</div><div class="v">' + raws.features[0].attributes.kbdi + '</div></div>' +
                        '<div class="item"><div class="t">Fire Danger</div><div class="v">' + fdr(raws.features[0].attributes.adj) + '</div></div>';
                }

                popup.update('<div class="item"><div class="t">Station Name</div><div class="v">' + p.NAME + '</div></div>' +
                    '<div class="item"><div class="t">Temperature</div><div class="v">' + t + '</div></div>' +
                    (fl != null ? '<div class="item"><div class="t">Feels Like</div><div class="v">' + fl + '</div></div>' : '') +
                    '<div class="item"><div class="t">Humidity</div><div class="v">' + Math.round(rh) + '%</div></div>' +
                    '<div class="item"><div class="t">Wind</div><div class="v">' + (ws == 0 ? 'Calm' : wd + ' at ' + ws) + '</div></div>' +
                    (/*settings.hasPermissions() && (*/raws && raws.features.length > 0/*)*/ ? rawsData : '') +
                    '<div class="item"><div class="t">Last reported</div><div class="v">' + timeAgo(new Date(obs.air_temp_value_1.date_time).getTime()) + '</div></div>',
                    'Current Weather'
                );

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
                    d = p.level == 1 ? 'Prepare to evacuate' : p.level == 2 ? 'Prepare to leave at a moment\'s notice' : 'Leave immediately',
                    n = p.notes,
                    u = timeAgo(p.updated);

                new Popup('Evacuations').create('<div class="item"><div class="t">Level</div><div class="v">Level ' + p.level + '</div></div>' +
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
            'dark_mode': () => changeListener.darkMode(),
            'toggle-layer': () => changeListener.toggle(),
            'erc_time': () => {
                settings.updateSpecial();
                new Layers().erc(false, true);        
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
                new Layers().sfp(true);
            },
            'user-setting': () => changeListener.personalize(),
            'archive_years': () => changeListener.archive()
        };

    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }
});