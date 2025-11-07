let map,
    mapContainer = document.querySelector('#map'),
    host = 'https://www.mapofire.com/',
    domain = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    apiKey = '50e2c43f8f63ff0ed20127ee2487f15e',
    sub_id = 'price_1MgxhSIpCdpJm6cTaKp2dqf5',
    productName = 'Map of Fire',
    company = 'MAPO LLC',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    defaultAttr = '&copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a> ',
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    curTime = new Date(),
    tileNames = ['outdoors', 'satellite', 'caltopo', 'fs16', 'dark',/* 'delorme',*/ 'osm', 'terrain'],
    tilePerms = [0, 0, 1, 1, 1, 0, 0],
    icons = ['', 'out', 'big', 'controlled', 'contained', 'large', 'new', 'new-big', 'rx'],
    wildfire,
    user,
    fog = {
        range: [2.5, 5.5],
        'horizon-blend': 1,
        color: '#f4fcff',
        'high-color': '#87c8dd',
        'space-color': '#a2d9f5',
        'star-intensity': 0.5
    },
    osm = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'openstreetmap': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        },
        layers: [{
            id: 'osm',
            type: 'raster',
            source: 'openstreetmap',
            minzoom: 0,
            maxzoom: 22
        }]
    },
    /*terrain = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'esri': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.esri.com">ESRI</a>'
            }
        },
        layers: [{
            id: 'terrain',
            type: 'raster',
            source: 'esri',
            minzoom: 3,
            maxzoom: 18
        }]
    },*/
    caltopo = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'ct': {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/2/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://caltopo.com">CalTopo</a>'
            }
        },
        layers: [{
            id: 'caltopo',
            type: 'raster',
            source: 'ct',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    fs16 = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'usfs2016': {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/3/{z}/{x}/{y}.png'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'fs16',
            type: 'raster',
            source: 'usfs2016',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    tiles = {
        'outdoors': 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9',
        'satellite': 'mapbox://styles/mapollc/clvh22ic505rn01pkdic7evid',
        'osm': osm,
        'fs16': fs16,
        'caltopo': caltopo,
        /*'terrain': terrain*/
        'dark': 'mapbox://styles/mapbox/dark-v11',
        'terrain': 'mapbox://styles/mapbox/streets-v12'
    };

!function (e) { if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var n; "undefined" != typeof window ? n = window : "undefined" != typeof global ? n = global : "undefined" != typeof self && (n = self), n.geojsonExtent = e() } }(function () { return function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = "function" == typeof require && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } for (var i = "function" == typeof require && require, o = 0; o < r.length; o++)s(r[o]); return s }({ 1: [function (require, module, exports) { function getExtent(_) { for (var ext = extent(), coords = geojsonCoords(_), i = 0; i < coords.length; i++)ext.include(coords[i]); return ext } var geojsonCoords = require("@mapbox/geojson-coords"), traverse = require("traverse"), extent = require("@mapbox/extent"), geojsonTypesByDataAttributes = { features: ["FeatureCollection"], coordinates: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"], geometry: ["Feature"], geometries: ["GeometryCollection"] }, dataAttributes = Object.keys(geojsonTypesByDataAttributes); module.exports = function (_) { return getExtent(_).bbox() }, module.exports.polygon = function (_) { return getExtent(_).polygon() }, module.exports.bboxify = function (_) { return traverse(_).map(function (value) { if (value) { var isValid = dataAttributes.some(function (attribute) { return value[attribute] ? -1 !== geojsonTypesByDataAttributes[attribute].indexOf(value.type) : !1 }); isValid && (value.bbox = getExtent(value).bbox(), this.update(value)) } }) } }, { "@mapbox/extent": 2, "@mapbox/geojson-coords": 4, traverse: 7 }], 2: [function (require, module, exports) { function Extent(bbox) { return this instanceof Extent ? (this._bbox = bbox || [1 / 0, 1 / 0, -(1 / 0), -(1 / 0)], void (this._valid = !!bbox)) : new Extent(bbox) } module.exports = Extent, Extent.prototype.include = function (ll) { return this._valid = !0, this._bbox[0] = Math.min(this._bbox[0], ll[0]), this._bbox[1] = Math.min(this._bbox[1], ll[1]), this._bbox[2] = Math.max(this._bbox[2], ll[0]), this._bbox[3] = Math.max(this._bbox[3], ll[1]), this }, Extent.prototype.equals = function (_) { var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] == other[0] && this._bbox[1] == other[1] && this._bbox[2] == other[2] && this._bbox[3] == other[3] }, Extent.prototype.center = function (_) { return this._valid ? [(this._bbox[0] + this._bbox[2]) / 2, (this._bbox[1] + this._bbox[3]) / 2] : null }, Extent.prototype.union = function (_) { this._valid = !0; var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] = Math.min(this._bbox[0], other[0]), this._bbox[1] = Math.min(this._bbox[1], other[1]), this._bbox[2] = Math.max(this._bbox[2], other[2]), this._bbox[3] = Math.max(this._bbox[3], other[3]), this }, Extent.prototype.bbox = function () { return this._valid ? this._bbox : null }, Extent.prototype.contains = function (ll) { if (!ll) return this._fastContains(); if (!this._valid) return null; var lon = ll[0], lat = ll[1]; return this._bbox[0] <= lon && this._bbox[1] <= lat && this._bbox[2] >= lon && this._bbox[3] >= lat }, Extent.prototype.intersect = function (_) { if (!this._valid) return null; var other; return other = _ instanceof Extent ? _.bbox() : _, !(this._bbox[0] > other[2] || this._bbox[2] < other[0] || this._bbox[3] < other[1] || this._bbox[1] > other[3]) }, Extent.prototype._fastContains = function () { if (!this._valid) return new Function("return null;"); var body = "return " + this._bbox[0] + "<= ll[0] &&" + this._bbox[1] + "<= ll[1] &&" + this._bbox[2] + ">= ll[0] &&" + this._bbox[3] + ">= ll[1]"; return new Function("ll", body) }, Extent.prototype.polygon = function () { return this._valid ? { type: "Polygon", coordinates: [[[this._bbox[0], this._bbox[1]], [this._bbox[2], this._bbox[1]], [this._bbox[2], this._bbox[3]], [this._bbox[0], this._bbox[3]], [this._bbox[0], this._bbox[1]]]] } : null } }, {}], 3: [function (require, module, exports) { module.exports = function (list) { function _flatten(list) { return Array.isArray(list) && list.length && "number" == typeof list[0] ? [list] : list.reduce(function (acc, item) { return Array.isArray(item) && Array.isArray(item[0]) ? acc.concat(_flatten(item)) : (acc.push(item), acc) }, []) } return _flatten(list) } }, {}], 4: [function (require, module, exports) { var geojsonNormalize = require("@mapbox/geojson-normalize"), geojsonFlatten = require("geojson-flatten"), flatten = require("./flatten"); module.exports = function (_) { if (!_) return []; var normalized = geojsonFlatten(geojsonNormalize(_)), coordinates = []; return normalized.features.forEach(function (feature) { feature.geometry && (coordinates = coordinates.concat(flatten(feature.geometry.coordinates))) }), coordinates } }, { "./flatten": 3, "@mapbox/geojson-normalize": 5, "geojson-flatten": 6 }], 5: [function (require, module, exports) { function normalize(gj) { if (!gj || !gj.type) return null; var type = types[gj.type]; return type ? "geometry" === type ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: gj }] } : "feature" === type ? { type: "FeatureCollection", features: [gj] } : "featurecollection" === type ? gj : void 0 : null } module.exports = normalize; var types = { Point: "geometry", MultiPoint: "geometry", LineString: "geometry", MultiLineString: "geometry", Polygon: "geometry", MultiPolygon: "geometry", GeometryCollection: "geometry", Feature: "feature", FeatureCollection: "featurecollection" } }, {}], 6: [function (require, module, exports) { module.exports = function e(t) { switch (t && t.type || null) { case "FeatureCollection": return t.features = t.features.reduce(function (t, r) { return t.concat(e(r)) }, []), t; case "Feature": return t.geometry ? e(t.geometry).map(function (e) { var r = { type: "Feature", properties: JSON.parse(JSON.stringify(t.properties)), geometry: e }; return void 0 !== t.id && (r.id = t.id), r }) : [t]; case "MultiPoint": return t.coordinates.map(function (e) { return { type: "Point", coordinates: e } }); case "MultiPolygon": return t.coordinates.map(function (e) { return { type: "Polygon", coordinates: e } }); case "MultiLineString": return t.coordinates.map(function (e) { return { type: "LineString", coordinates: e } }); case "GeometryCollection": return t.geometries.map(e).reduce(function (e, t) { return e.concat(t) }, []); case "Point": case "Polygon": case "LineString": return [t] } } }, {}], 7: [function (require, module, exports) { function Traverse(obj) { this.value = obj } function walk(root, cb, immutable) { var path = [], parents = [], alive = !0; return function walker(node_) { function updateState() { if ("object" == typeof state.node && null !== state.node) { state.keys && state.node_ === state.node || (state.keys = objectKeys(state.node)), state.isLeaf = 0 == state.keys.length; for (var i = 0; i < parents.length; i++)if (parents[i].node_ === node_) { state.circular = parents[i]; break } } else state.isLeaf = !0, state.keys = null; state.notLeaf = !state.isLeaf, state.notRoot = !state.isRoot } var node = immutable ? copy(node_) : node_, modifiers = {}, keepGoing = !0, state = { node: node, node_: node_, path: [].concat(path), parent: parents[parents.length - 1], parents: parents, key: path.slice(-1)[0], isRoot: 0 === path.length, level: path.length, circular: null, update: function (x, stopHere) { state.isRoot || (state.parent.node[state.key] = x), state.node = x, stopHere && (keepGoing = !1) }, "delete": function (stopHere) { delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, remove: function (stopHere) { isArray(state.parent.node) ? state.parent.node.splice(state.key, 1) : delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, keys: null, before: function (f) { modifiers.before = f }, after: function (f) { modifiers.after = f }, pre: function (f) { modifiers.pre = f }, post: function (f) { modifiers.post = f }, stop: function () { alive = !1 }, block: function () { keepGoing = !1 } }; if (!alive) return state; updateState(); var ret = cb.call(state, state.node); return void 0 !== ret && state.update && state.update(ret), modifiers.before && modifiers.before.call(state, state.node), keepGoing ? ("object" != typeof state.node || null === state.node || state.circular || (parents.push(state), updateState(), forEach(state.keys, function (key, i) { path.push(key), modifiers.pre && modifiers.pre.call(state, state.node[key], key); var child = walker(state.node[key]); immutable && hasOwnProperty.call(state.node, key) && (state.node[key] = child.node), child.isLast = i == state.keys.length - 1, child.isFirst = 0 == i, modifiers.post && modifiers.post.call(state, child), path.pop() }), parents.pop()), modifiers.after && modifiers.after.call(state, state.node), state) : state }(root).node } function copy(src) { if ("object" == typeof src && null !== src) { var dst; if (isArray(src)) dst = []; else if (isDate(src)) dst = new Date(src.getTime ? src.getTime() : src); else if (isRegExp(src)) dst = new RegExp(src); else if (isError(src)) dst = { message: src.message }; else if (isBoolean(src)) dst = new Boolean(src); else if (isNumber(src)) dst = new Number(src); else if (isString(src)) dst = new String(src); else if (Object.create && Object.getPrototypeOf) dst = Object.create(Object.getPrototypeOf(src)); else if (src.constructor === Object) dst = {}; else { var proto = src.constructor && src.constructor.prototype || src.__proto__ || {}, T = function () { }; T.prototype = proto, dst = new T } return forEach(objectKeys(src), function (key) { dst[key] = src[key] }), dst } return src } function toS(obj) { return Object.prototype.toString.call(obj) } function isDate(obj) { return "[object Date]" === toS(obj) } function isRegExp(obj) { return "[object RegExp]" === toS(obj) } function isError(obj) { return "[object Error]" === toS(obj) } function isBoolean(obj) { return "[object Boolean]" === toS(obj) } function isNumber(obj) { return "[object Number]" === toS(obj) } function isString(obj) { return "[object String]" === toS(obj) } var traverse = module.exports = function (obj) { return new Traverse(obj) }; Traverse.prototype.get = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) { node = void 0; break } node = node[key] } return node }, Traverse.prototype.has = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) return !1; node = node[key] } return !0 }, Traverse.prototype.set = function (ps, value) { for (var node = this.value, i = 0; i < ps.length - 1; i++) { var key = ps[i]; hasOwnProperty.call(node, key) || (node[key] = {}), node = node[key] } return node[ps[i]] = value, value }, Traverse.prototype.map = function (cb) { return walk(this.value, cb, !0) }, Traverse.prototype.forEach = function (cb) { return this.value = walk(this.value, cb, !1), this.value }, Traverse.prototype.reduce = function (cb, init) { var skip = 1 === arguments.length, acc = skip ? this.value : init; return this.forEach(function (x) { this.isRoot && skip || (acc = cb.call(this, acc, x)) }), acc }, Traverse.prototype.paths = function () { var acc = []; return this.forEach(function (x) { acc.push(this.path) }), acc }, Traverse.prototype.nodes = function () { var acc = []; return this.forEach(function (x) { acc.push(this.node) }), acc }, Traverse.prototype.clone = function () { var parents = [], nodes = []; return function clone(src) { for (var i = 0; i < parents.length; i++)if (parents[i] === src) return nodes[i]; if ("object" == typeof src && null !== src) { var dst = copy(src); return parents.push(src), nodes.push(dst), forEach(objectKeys(src), function (key) { dst[key] = clone(src[key]) }), parents.pop(), nodes.pop(), dst } return src }(this.value) }; var objectKeys = Object.keys || function (obj) { var res = []; for (var key in obj) res.push(key); return res }, isArray = Array.isArray || function (xs) { return "[object Array]" === Object.prototype.toString.call(xs) }, forEach = function (xs, fn) { if (xs.forEach) return xs.forEach(fn); for (var i = 0; i < xs.length; i++)fn(xs[i], i, xs) }; forEach(objectKeys(Traverse.prototype), function (key) { traverse[key] = function (obj) { var args = [].slice.call(arguments, 1), t = new Traverse(obj); return t[key].apply(t, args) } }); var hasOwnProperty = Object.hasOwnProperty || function (obj, key) { return key in obj } }, {}] }, {}, [1])(1) });

function plural(v) {
    return (v > 1 ? 's' : '');
}

function matheq(d, s, r) {
    return Math.floor(((d / s) - Math.floor(d / s)) * r);
}

function timeAgo(t, w, c) {
    var val,
        d = (c ? c : Math.round(new Date().getTime() / 1000)) - t;

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

async function api(url, fields = null) {
    let result,
        ops = {
            method: url.search('weather.gov') >= 0 ? 'GET' : 'POST',
        },
        fd = new FormData();

    if (url.search(apiURL) >= 0 || url.search(host) >= 0) {
        fd.append('key', apiKey);
    }

    if (fields != null) {
        fields.forEach((v) => {
            fd.append(v[0], v[1]);
        });
    }

    if (url.search('weather.gov') < 0) {
        ops['body'] = fd;
    }

    if (navigator.onLine) {
        await fetch(url, ops).then(async (resp) => {
            result = await resp.json();
        }).catch((e) => {
            console.error(e.message);
        });

        return result;
    } else {
        console.error('You are not connected to the internet');
        return null;
    }
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

function getbbox() {
    var b = map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast();

    return (b ? JSON.stringify({
        xmin: ne.lng,
        ymin: sw.lat,
        xmax: sw.lng,
        ymax: ne.lat,
        spatialReference: {
            wkid: 4326
        }
    }) : false);
}

class Wildfire {
    fireIcon(t) {
        let exp = '',
            now = new Date().getTime() / 1000;

        if (t == 'new') {
            exp = [
                'case',
                ['has', 'Out'],
                'fire-icon-out',
                ['has', 'Contain'],
                'fire-icon-contained',
                ['has', 'Control'],
                'fire-icon-controlled',
                [
                    'all',
                    [
                        '<',
                        ['-', now, ['to-number', ['get', 'discovered', ['get', 'time', ['properties']]]]],
                        ['to-number', (12 * 60 * 60)]
                    ],
                    [
                        '>=',
                        ['to-number', ['get', 'acres']],
                        100
                    ]
                ],
                'fire-icon-new-big',
                'fire-icon-new'
            ];
        } else if (t == 'rx') {
            exp = 'fire-icon-rx';
        } else if (t == 'smk') {
            exp = 'fire-icon';
        } else {
            exp = [
                'case',
                [
                    '<',
                    ['to-number', ['get', 'year', ['get', 'time', ['properties']]]],
                    curTime.getFullYear()
                ],
                'fire-icon-out',
                ['has', 'Out'],
                'fire-icon-out',
                ['has', 'Contain'],
                'fire-icon-contained',
                ['has', 'Control'],
                'fire-icon-controlled',
                [
                    'case',
                    [
                        '>=',
                        ['to-number', ['get', 'acres']],
                        1000
                    ],
                    'fire-icon-large',
                    [
                        '>=',
                        ['to-number', ['get', 'acres']],
                        100
                    ],
                    'fire-icon-big',
                    'fire-icon'
                ]
            ];
        }

        return exp;
    }

    perimeterColor(c) {
        let pc;

        switch (c) {
            case 'default':
            case 'red':
                pc = '#f35a5a';
                break;
            case 'blue':
                pc = '#3289d5';
                break;
            case 'orange':
                pc = '#fb8c00';
                break;
            case 'green':
                pc = '#388e3c';
                break;
            case 'purple':
                pc = '#9c27b0';
                break;
            case 'brown':
                pc = '#795548';
                break;
            case 'black':
                pc = '#333';
                break;
        }

        return /*settings.archive == null ? */pc/* : '#727272'*/;
    }

    async perimeters() {
        let y = /*(settings.archive ? settings.archive : */curTime.getFullYear()/*)*/,
            min = 500/*settings.get('perimeters').minSize*/,
            pc = this.perimeterColor('default'),
            perimName,
            w,
            o;

        /*if (settings.archive) {
            w = 'FEATURE_CA <> \'Wildfire\' AND FIRE_YEAR=' + settings.archive;
            o = 'OBJECTID,UNQE_FIRE_ID,INCIDENT,GIS_ACRES,DATE_CUR';
            perimName = 'INCIDENT';
        } else {*/
        w = 'attr_FireDiscoveryDateTime>=TIMESTAMP \'' + y + '-01-01 00:00:00\' AND attr_FireDiscoveryDateTime<=TIMESTAMP \'' + y + '-12-31 23:59:59\' AND (poly_GISAcres > ' + min + ' OR poly_Acres_AutoCalc > ' + min + ') AND attr_FireOutDateTime IS NULL';
        o = 'OBJECTID,poly_IncidentName,attr_POOState';
        perimName = 'attr_IncidentName';
        /*}*/

        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/' + /*(settings.archive ? 'InterAgencyFirePerimeterHistory_All_Years_View' : */'WFIGS_Interagency_Perimeters'/*)*/ + '/FeatureServer/0/query', [
            ['where', w],
            ['outFields', o],
            ['resultType', 'tile'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['returnGeometry', true],
            ['f', 'geojson']
        ]);

        if (!map.getSource('perimeters')) {
            map.addSource('perimeters', {
                type: 'geojson',
                data: data
            });
        }

        if (!map.getLayer('perimeters_outline')) {
            map.addLayer({
                id: 'perimeters_outline',
                type: 'line',
                source: 'perimeters',
                paint: {
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'click'], false],
                        3,
                        2
                    ],
                    'line-color': pc
                }
            }, 'fire').addLayer({
                id: 'perimeters_fill',
                type: 'fill',
                source: 'perimeters',
                paint: {
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'click'], false],
                        0.5,
                        0.35
                    ],
                    'fill-color': pc
                }
            }, 'fire').addLayer({
                id: 'perimeters_title',
                type: 'symbol',
                source: 'perimeters',
                minzoom: 11.8,
                paint: {
                    'text-color': '#fff',
                    'text-halo-color': /*settings.archive ? '#333' : */'#ff0000',
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 200,
                    'text-font': ['DIN Pro Medium'],
                    'text-field': ['upcase', ['concat', ['get', perimName], ' Fire']],
                    'text-justify': 'center',
                    'text-size': 13,
                    'text-max-width': 8,
                    'text-anchor': 'center',
                    'text-offset': [0, 1],
                    'text-letter-spacing': 0.05
                }
            }, 'fire').on('load', 'perimeters_fill', (e) => {
                const features = map.querySourceFeatures('perimeters');

                if (features.length > 0) {
                    features.forEach((f) => {
                        if (f.properties.attr_POOState == 'US-' + incident.properties.fireState && f.properties.poly_IncidentName.toLowerCase() == incident.properties.fireName.toLowerCase()) {
                            map.fitBounds(geojsonExtent(f.geometry), {
                                padding: 60
                            });
                        }
                    });
                }
            });
        }
    }

    incident() {
        /* add this specific fire to the map */
        if (!map.getSource('fire')) {
            let prop = incident.properties;
            prop.time = incident.time;

            if (prop.status.Out) {
                prop.Out = true;
            }
            if (prop.status.Contain) {
                prop.Contain = true;
            }
            if (prop.status.Control) {
                prop.Control = true;
            }

            map.addSource('fire', {
                type: 'geojson',
                data: {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [
                            incident.geometry.lon,
                            incident.geometry.lat
                        ]
                    },
                    'properties': prop
                }
            });
        }

        if (!map.getLayer('fire')) {
            map.addLayer({
                id: 'fire',
                type: 'symbol',
                source: 'fire',
                layout: {
                    'icon-image': this.fireIcon('all'),
                    'icon-size': 0.4,
                    'icon-allow-overlap': true,
                },
                paint: {
                    'icon-opacity': [
                        'case',
                        ['has', 'Out'],
                        0.5,
                        1
                    ]
                }
            });

            /* add titles to wildfires */
            map.addLayer({
                id: 'fire_title',
                type: 'symbol',
                source: 'fire',
                minzoom: 7,
                paint: {
                    'text-color': '#000',
                    'text-halo-color': '#fff',
                    'text-halo-blur': 1,
                    'text-halo-width': 2
                },
                layout: {
                    'symbol-placement': 'point',
                    'symbol-spacing': 150,
                    'text-font': ['DIN Pro Medium'],
                    'text-field': [
                        'case',
                        [
                            '==',
                            ['get', 'type'],
                            'Wildfire'
                        ],
                        ['concat', ['get', 'fireName'], ' Fire'],
                        ['get', 'name']
                    ],
                    'text-justify': 'center',
                    'text-size': 12,
                    'text-max-width': 8,
                    'text-anchor': 'top',
                    'text-offset': [0, 1.3],
                    'text-letter-spacing': 0.05
                }
            });
        }
    }
}

function init() {
    let lon = -110.57147861823876,
        lat = 43.524355803511895;

    if (mapContainer.getAttribute('data-lat') != '') {
        lat = parseFloat(mapContainer.getAttribute('data-lat'));
        lon = parseFloat(mapContainer.getAttribute('data-lon'));
    }

    mapContainer.innerHTML = '';

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: tiles['outdoors'],
        projection: 'mercator',
        hash: false,
        attributionControl: false,
        collectResourceTiming: true,
        zoom: mapContainer.getAttribute('data-lat') != '' ? 9.5 : 4.1,
        center: [lon, lat]
    }).on('style.load', () => {
        /* create fire marker icons */
        icons.forEach((icon, n) => {
            icon = (icon ? '-' : '') + icon;

            if (!map.hasImage('fire-icon' + icon)) {
                map.loadImage('https://www.mapotechnology.com/images/icons/fire/fire-icon' + icon + '.png', (error, image) => {
                    if (error) throw error;
                    map.addImage('fire-icon' + icon, image);

                    if (n == icons.length - 1) {
                        /* put incident marker on map */
                        wildfire.incident();

                        /* get wildfire perimeters */
                        wildfire.perimeters();
                    }
                });
            }
        });
    });
}

/*function county() {
    const box = map.project([incident.geometry.lon, incident.geometry.lat]),
    features = map.queryRenderedFeatures(box);

    if (features.length > 0) {
        features.forEach((feat) => {
            if (feat.layer.id == 'county-boundaries-polygon') {
                const p = document.querySelector('.juris p'); 
                
                document.querySelector('.juris p').innerHTML = p.innerHTML.replace(feat.properties.STATE_NAME, feat.properties.NAME + ', ' + feat.properties.STATE_NAME);
            }
        });
    }
}*/

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

function doChart() {
    const hist = incident.properties.acres_history,
        data = [],
        data2 = [];

    if (hist.length <= 1) {
        document.querySelector('#acres_history').parentNode.parentNode.remove();
    } else {
        loadScript('https://code.highcharts.com/highcharts.js').then(() => {
            loadScript('https://code.highcharts.com/modules/exporting.js').then(() => {
                hist.forEach((h) => {
                    data.push([h.updated * 1000, h.acres])
                    data2.push([h.updated * 1000, h.change])
                });
                data.reverse();
                data2.reverse();

                const fmt = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                },
                    dates = Intl.DateTimeFormat('en-US', fmt).format(data[0][0]) + ' to ' + Intl.DateTimeFormat('en-US', fmt).format(data[data.length - 1][0]);

                Highcharts.setOptions({
                    time: {
                        timezone: 'America/Los_Angeles'
                    }
                });

                chart = Highcharts.chart('acres_history', {
                    chart: {
                        type: 'line'
                    },
                    events: {
                        render() {
                            document.querySelector('#acres_history').style.backgroundColor = 'transparent';
                        }
                    },
                    title: {
                        text: 'Incident Growth History',
                        align: 'left'
                    },
                    subtitle: {
                        text: '<b>' + incident.properties.fireName + ' Fire (' + incident.properties.incidentId + ') growth history from ' + dates + '.</b><br>&copy; ' + new Date().getFullYear() + ' MAPO LLC',
                        useHTML: true,
                        verticalAlign: 'bottom',
                        align: 'left'
                    },
                    accessibility: {
                        enabled: false
                    },
                    navigation: {
                        buttonOptions: {
                            enabled: true
                        }
                    },
                    tooltip: {
                        xDateFormat: '%a, %b %e, %Y %l:%M %p',
                        shared: true
                    },
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            format: '{value:%b %e}'
                        }
                    },
                    yAxis: [{
                        title: {
                            text: 'Total Acres',
                            style: {
                                color: '#888'
                            }
                        },
                        min: 0
                    }, {
                        title: {
                            text: 'Change in Acres',
                            style: {
                                color: '#888'
                            }
                        },
                        min: 0,
                        opposite: true
                    }],
                    series: [{
                        name: 'Total Acres',
                        type: 'line',
                        data: data
                    }, {
                        name: 'Change in Acres',
                        type: 'line',
                        data: data2,
                        yAxis: 1
                    }],
                    panning: true,
                    panKey: 'ctrl',
                    zooming: {
                        type: 'xy'
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                symbol: 'circle',
                                fillColor: '#fff',
                                enabled: true,
                                radius: 3,
                                lineWidth: 1,
                                lineColor: null
                            }
                        }
                    },
                    responsive: {
                        rules: [{
                            condition: {
                                maxWidth: 600
                            },
                            chartOptions: {
                                yAxis: {
                                    title: {
                                        text: ''
                                    }
                                }
                            }
                        }]
                    },
                    colors: ['#e41616', '#ffd54f']
                });
            });
        });
    }
}

class Weather {
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }

    init() {
        this.current();
        this.forecast();
    }

    async current() {
        let template = '';
        const wx = await api(apiURL + 'weather/nearby', [
            ['radius', this.lat + ',' + this.lon + ',30'],
            ['latest', 1]
        ]);

        if (wx) {
            const wd = wx.weather.obs.wind_dir,
                ws = wx.weather.obs.wind_speed;

            template += '<div class="elmt"><i class="fal fa-temperature-high"></i><label>Temperature</label>' +
                '<h3>' + (wx.weather.obs.temp.current == null ? 'N/A' : wx.weather.obs.temp.current + '&deg;F') + '</h3></div>';

            template += '<div class="elmt"><i class="fal fa-droplet-percent"></i><label>Humidity</label>' +
                '<h3>' + (wx.weather.obs.rh ? wx.weather.obs.rh + '%' : 'N/A') + '</h3></div>';
            /*<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(264deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>*/
            template += '<div class="elmt"><i class="fal fa-wind"></i><label>Winds</label>' +
                '<h3>' + (wd == 'V' && ws == 0 ? 'N/A' : wd + '/' + ws + ' mph') + '</h3></div>';

            document.querySelector('#curwx').innerHTML = template;
            document.querySelector('#curwx').insertAdjacentHTML('afterend', '<p class="updated">Last reported ' + timeAgo(wx.weather.updated).toLowerCase() + '</p>');
        } else {
            document.querySelector('#curwx').innerHTML = '<p>Nearby current weather conditions are unavailable.';
        }
    }

    async forecast() {
        let template = '',
            temp = [],
            rh = [],
            wind = [];

        const a = await api('https://api.weather.gov/points/' + parseFloat(this.lat).toFixed(4) + '000000,' + parseFloat(this.lon).toFixed(4) + '0000');
        const data = await api(a.properties.forecastGridData);

        if (data) {
            for (var i = 0; i < data.properties.temperature.values.length; i++) {
                const t = new Date(data.properties.temperature.values[i].validTime.split('/')[0]).getTime();

                if (t >= new Date().getTime() && (t - new Date().getTime()) < 86400000) {
                    temp.push(data.properties.temperature.values[i].value);
                    rh.push(data.properties.relativeHumidity.values[i].value);

                    if (data.properties.transportWindSpeed.values[i]) {
                        wind.push(data.properties.transportWindSpeed.values[i].value);
                    }
                }
            }

            let t = Math.round((Math.max.apply(null, temp) * 1.8) + 32),
                h = Math.min.apply(null, rh),
                w1 = Math.round((wind.reduce((partialSum, a) => partialSum + a, 0) / wind.length) / 1.609),
                w2 = Math.round(Math.max.apply(null, wind) / 1.609),
                updated = new Date(data.properties.updateTime).getTime() / 1000;

            template += '<div class="elmt"><i class="fal fa-temperature-high"></i><label>Max. Temp.</label>' +
                '<h3>' + t + '&deg;F</h3></div>';

            template += '<div class="elmt"><i class="fal fa-droplet-percent"></i><label>Min. Humidity</label>' +
                '<h3>' + h + '%</h3></div>';

            template += '<div class="elmt"><i class="fal fa-wind"></i><label>Avg. Wind Spd.</label>' +
                '<h3>' + w1 + ' mph</h3></div>';

            template += '<div class="elmt"><i class="fal fa-wind"></i><label>Max. Wind Spd.</label>' +
                '<h3>' + w2 + ' mph</h3></div>';

            document.querySelector('#fcstwx').innerHTML = template;
            document.querySelector('#fcstwx').insertAdjacentHTML('afterend', '<p class="updated">Last forecasted ' + timeAgo(updated) + '</p>');
        } else {
            document.querySelector('#fcstwx').innerHTML = '<p>The 24-hour weather forecast is unavailable right now.';
        }
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
        return this.sub ? Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(this.sub.ends * 1000) : null;
    }
}

class User {
    constructor(user) {
        this.user = user;
    }
    
    getRole() {
        return this.user.role;
    }

    subscriptions() {
        let sub = new Subscription(this.user);

        return {
            valid: () => {
                return sub.valid();
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
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        wildfire = new Wildfire();

        let usr = null,
            token = (/token=(.*?)(?=;|$)/gm).exec(document.cookie);

        if (token != null) {
            const get = await api(apiURL + 'user/get/mapofire', [['token', token[1]]]);
            usr = get.user;
        }

        user = new User(usr);

        /* check if user has permissions for some premium features */
        if (user.getRole() == 'ADMIN' || user.subscriptions().valid()) {
            document.querySelector('span.coords').innerHTML = incident.geometry.lat.toFixed(4) + ', ' + incident.geometry.lon.toFixed(4);
            document.querySelector('span.coords').classList.remove('blur');
        }

        /* initialize map */
        init();
    } else {
        document.querySelector('.menuIcon').addEventListener('click', () => {
            document.querySelector('.menuIcon i').classList.toggle('fa-bars');
            document.querySelector('.menuIcon i').classList.toggle('fa-times');
            document.querySelector('header nav ul').classList.toggle('open');
        });

        doChart();
        new Weather(incident.geometry.lat, incident.geometry.lon).init();
    }
};

window.addEventListener('resize', () => {
    chart.redraw();
});

window.addEventListener('click', (e) => {
    const target = e.target;

    /* follow a wildfire incident */
    if (target.id == 'follow') {
        target.classList.toggle('btn-red');
        target.classList.toggle('btn-yellow');

        if (target.dataset.mode == 'follow') {
            target.dataset.mode = 'unfollow';
            target.innerHTML == '<i class="far fa-check"></i>Following this incident';
        } else {
            target.dataset.mode = 'follow';
            target.innerHTML == '<i class="far fa-plus"></i>Follow this incident';
        }
    }

    if (target.id == 'sharer') {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            });
        }
    }

    if (target.id == 'tiktok') {
        window.open('https://tiktok.com/search?q=' + incident.properties.fireName + ' Fire');
    }

    if (target.id == 'fb') {
        window.open('https://www.facebook.com/sharer/sharer.php?kid_directed_site=0&sdk=joey&u=' + encodeURIComponent(window.location.href) + '&display=popup&ref=plugin&src=share_button');
    }

    if (target.id == 'X') {
        let p = window.location.pathname,
            s = p.split('/'),     
            near = incident.geometry.near_long.split(', '),
            where = ucwords(near[0].replaceAll('-', ' ')).replaceAll(' ', '') + ',' + ucwords(near[1].replaceAll('-', ' ')).replaceAll(' ', ''),
            hashtags = where + ',' + ucwords(s[4].toString().replaceAll('-', ' ')).replaceAll(' ', '');

        window.open('https://twitter.com/intent/tweet?hashtags=' + hashtags + '&original_referer=' + encodeURIComponent(window.location.href) + 
        '&url=' + encodeURIComponent(window.location.href) + '&ref_src=twsrc%5Etfw&tw_p=tweetbutton');
    }
});
