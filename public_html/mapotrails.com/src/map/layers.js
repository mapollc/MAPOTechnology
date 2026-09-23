import { ENV, mfFonts } from '../app/config.js';
import { global } from '../app/state.js';

export const icons = ['info', 'hike', 'mtb', 'road', 'gravel', 'dirtbike', 'climb', 'atski', 'nordic', 'alpine', 'snowmobile', 'camp', 'camp2', 'lake', 'media', 'parking', 'restroom', 'river', 'sledding', 'bridge', 'cabin', 'caution', 'fantasy', 'fishing', '4x4', 'big_ride', 'big_air', 'bigfoot', 'summit', 'ski', 'swim'];

export const osm = {
    version: 8,
    glyphs: mfFonts,
    sources: {
        'openstreetmap': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    layers: [{
        id: 'osm',
        type: 'raster',
        source: 'openstreetmap',
        minzoom: 0,
        maxzoom: 19
    }]
};

export const topofire = {
    version: 8,
    glyphs: mfFonts,
    sources: {
        'topofire': {
            type: 'raster',
            tiles: [`${ENV.domain}assets/images/tiles/6/{z}/{x}/{y}.png`],
            tileSize: 256,
            attribution: '&copy; <a href="umt.edu">UMT</a>, USFS, NOAA, NIDIS, NASA'
        }
    },
    layers: [{
        id: 'topofire',
        type: 'raster',
        source: 'topofire',
        minzoom: 0,
        maxzoom: 13
    }]
};

export const terrain = {
    version: 8,
    glyphs: mfFonts,
    sources: {
        'esri': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.arcgis.com">ESRI</a>'
        }
    },
    layers: [{
        id: 'terrain',
        type: 'raster',
        source: 'esri',
        minzoom: 3,
        maxzoom: 18
    }]
};

export const caltopo = {
    version: 8,
    glyphs: mfFonts,
    sources: {
        'ct': {
            type: 'raster',
            tiles: [`${ENV.domain}assets/images/tiles/2/{z}/{x}/{y}.png`],
            tileSize: 256,
            attribution: '&copy; <a href="https://caltopo.com">CalTopo</a>'
        }
    },
    layers: [{
        id: 'caltopo',
        type: 'raster',
        source: 'ct',
        minzoom: 5,
        maxzoom: 16
    }]
};

export const fs16 = {
    version: 8,
    glyphs: mfFonts,
    sources: {
        'usfs2016': {
            type: 'raster',
            tiles: [`${ENV.domain}assets/images/tiles/3/{z}/{x}/{y}.png`],
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
};

export async function getContourLibrary() {
    if (window.__DEBUG__ || __DEBUG__) return;

    if (!mlcontour) {
        const module = await import('maplibre-contour');
        mlcontour = module.default;
    }

    return mlcontour;
}

export function reorderLayers() {
    [
        'trails',
        'trailheads',
        'waypoints',
        'trails_title',
        'cluster-ths',
        'cluster-count'
    ].forEach(id => {
        if (global.map.getLayer(id)) {
            global.map.moveLayer(id);
        }
    });
}