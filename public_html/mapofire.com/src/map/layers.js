let mlcontour;

import { ENV, config, mfFonts } from "../app/config.js";
import { global, impact } from "../app/state.js";

import { NWS, Weather } from "../data/weather.js";

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
},
    topofire = {
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
    },
    terrain = {
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
    },
    caltopo = {
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
    },
    fs16 = {
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

export const layerActions = Object.freeze({
    // wildfire related
    'newFires': { layers: ['new_fires', 'new_fires_title'] },
    'allFires': { layers: ['all_fires', 'all_fires_title', 'ca_fires', 'ca_fire_title', 'complexes', 'complexes_title'] },
    'smokeChecks': { layers: ['smk_fires', 'smk_fires_title'] },
    'rxBurns': { layers: ['rx_fires', 'rx_fires_title'] },
    'perimeters': {
        layers: ['perimeters_outline', 'perimeters_fill', 'perimeters_title', 'ca_perimeters_outline',
            'ca_perimeters_fill', 'ca_perimeters_title', 'aus_perimeters_outline', 'aus_perimeters_fill', 'aus_perimeters_title']
    },

    // modis
    'modis24': { layers: ['modis24'], exe: () => { config.layersHandler.modis(1); } },
    'modis48': { layers: ['modis48'], exe: () => { config.layersHandler.modis(2); } },
    'modis72': { layers: ['modis72'], exe: () => { config.layersHandler.modis(3); } },

    // evacuations & firemed
    'evac': { layers: ['evac', 'evac_bg', 'evac_outline', 'evac_title'] },
    'firemed': { layers: ['firemed'], exe: () => { config.layersHandler.firemed(); } },
    'tfrs': { layers: ['tfrs', 'tfrs_outline', 'tfrs_title'], exe: () => { config.layersHandler.tfrs(); } },

    // weather
    'lightning1': { layers: ['lightning1'] },
    'lightning24': { layers: ['lightning24'] },
    //'wwas': { layers: ['wwas_fill', 'wwas_outline', 'wwas_title'], exe: async () => { new NWS().get(); } },
    'wwas': { layers: ['wwas'], exe: async () => { new NWS().get(); } },
    'stns': { layers: ['stns', 'stns_text'], exe: () => { new Weather().raws(); } },
    'visSatellite': { layers: ['satellite1'], exe: async () => { new NWS().satellite(1); } },
    'irSatellite': { layers: ['satellite2'], exe: async () => { new NWS().satellite(2); } },
    'wvSatellite': { layers: ['satellite3'], exe: async () => { new NWS().satellite(3); } },
    'airq': { layers: ['airQuality', 'airQuality_text'], exe: () => { config.layersHandler.airQuality(); } },
    'spc': {
        run: async (checked) => {
            if (impact.style.display == 'flex' && impact.dataset.display == 'layers') {
                document.querySelector('#otlkType').disabled = !checked;
                document.querySelector('#otlkDay').disabled = !checked;
            }

            if (global.map.getSource('outlook')) {
                ['outlook_fill', 'outlook_outline', 'outlook_title'].forEach(n => global.map.setLayoutProperty(n, 'visibility', checked ? 'visible' : 'none'));
            } else if (checked) {
                new NWS().spc();
            }
        }
    },
    'radar': {
        run: (checked) => {
            if (checked) {
                config.layersHandler.radarInit();
            } else {
                document.querySelector('.radar').remove();

                for (let i = 0; i < global.radar.mapFrames.length; i++) {
                    if (global.map.getLayer(`radar-layer-${i}`)) global.map.removeLayer(`radar-layer-${i}`);
                    if (global.map.getSource(`radar-${i}`)) global.map.removeSource(`radar-${i}`);
                }

                global.radar = {
                    mapFrames: [],
                    animationPosition: 0,
                    animationTimer: false,
                    currentLayerId: null,
                    isLoading: false,
                    loadedPositions: new Set()
                };
            }
        }
    },
    'ndfd': {
        run: async (checked) => {
            const visibility = checked ? 'visible' : 'none';

            if (impact.style.display == 'flex') {
                document.querySelector('#forecastModel').disabled = !checked;
                document.querySelector('#fcstTime').disabled = !checked;
            }

            if (global.map.getSource('ndfd')) {
                global.map.setLayoutProperty('ndfd', 'visibility', visibility);

                if (!checked) document.querySelector('.ndfdLegend')?.remove();
            } else if (checked) {
                new NWS().ndfd();
            }
        }
    },
    'erc': {
        run: (checked) => {
            if (impact.style.display == 'flex') document.querySelector('#erc_time').disabled = !checked;

            if (global.map.getSource('erc')) {
                ['erc_fill', 'erc_outline'].forEach(n => global.map.setLayoutProperty(n, 'visibility', checked ? 'visible' : 'none'));
            } else if (checked) {
                config.layersHandler.erc();
            }
        }
    },

    // planning, hazard & vunerability
    'ev': { layers: ['ev'], exe: () => { config.layersHandler.pnwVulnerability(); } },
    'spcClimo': {
        run: (checked) => {
            if (checked) {
                config.layersHandler.spcClimo();
            } else {
                ['spc_climo_fill', 'spc_climo_outline', 'spc_climo_prob'].forEach(a => global.map.removeLayer(a));
                global.map.removeSource('spc_climo');
                document.querySelector('.spcTimeline').remove();
            }
        }
    },
    'nri': { layers: ['nri_outline', 'nri_fill'], exe: () => { config.layersHandler.nri(); } },
    'rth': { layers: ['rth'], exe: () => { config.layersHandler.rth(); } },
    'bp': { layers: ['bp'], exe: () => { config.layersHandler.bp(); } },
    'whp': { layers: ['whp'], exe: () => { config.layersHandler.whp(); } },
    'wet': { layers: ['wet'], exe: () => { config.layersHandler.wet(); } },
    'drought': { layers: ['drought', 'drought_outline', 'drought_title'], exe: () => { config.layersHandler.drought(); } },
    'power': { layers: ['power'], exe: () => { config.layersHandler.power(); } },
    'fuels': { layers: ['fuels', 'fuelsAK'], exe: () => { config.layersHandler.fuels(); } },
    'sfp': {
        run: (checked) => {
            if (impact.style.display == 'flex') document.querySelector('#sfpDateSelect').disabled = !checked;

            if (global.map.getSource('sfp')) {
                global.map.setLayoutProperty('sfp', 'visibility', checked ? 'visible' : 'none');
            } else if (checked) {
                config.layersHandler.sfp();
            }
        }
    },

    // administrative bounds
    'nwsCWAs': { layers: ['nwsCWAs'], exe: () => { config.layersHandler.nwsCWAs(); } },
    'roads': { layers: ['roads'], exe: () => { config.layersHandler.roads(); } },
    'lands': { layers: ['lands'], exe: () => { config.layersHandler.lands(); } },
    'plss': { layers: ['plss'], exe: () => { config.layersHandler.plss(); } },
    'dispatch': { layers: ['dispatch_outline', 'dispatch_title'], exe: () => { config.layersHandler.dispatch(); } },
    'gaccBounds': { layers: ['gaccBounds', 'gaccBounds_title'], exe: () => { config.layersHandler.gaccBounds(); } },
    'countyBounds': { layers: ['countyBounds'], exe: () => { config.layersHandler.countyBounds(); } },

    // smoke
    'hms': { layers: ['hms', 'hms_title'], exe: () => { config.layersHandler.hms(); } },
    'smokeFcst': { layers: ['smokeFcst'], exe: () => { config.layersHandler.smokeFcst(); } },
    'sfcSmoke': {
        run: async (checked) => {
            if (impact.style.display == 'flex' && impact.dataset.display == 'layers') {
                document.querySelector('#sfc_smoke_time').disabled = !checked;
            }

            if (global.map.getSource('sfcSmoke')) {
                global.map.setLayoutProperty('sfcSmoke', 'visibility', checked ? 'visible' : 'none');
            } else if (checked) {
                config.layersHandler.sfcSmoke();
            }
        }
    },
    'viSmoke': {
        run: async (checked) => {
            if (impact.style.display == 'flex' && impact.dataset.display == 'layers') {
                document.querySelector('#vi_smoke_time').disabled = !checked;
            }

            if (global.map.getSource('viSmoke')) {
                global.map.setLayoutProperty('viSmoke', 'visibility', checked ? 'visible' : 'none');
            } else if (checked) {
                config.layersHandler.viSmoke();
            }
        }
    },

    // state-specific
    'odfFDR': { layers: ['odfFDR', 'odfFDR_outline', 'odfFDR_title'], exe: () => { config.layersHandler.odfFDR(); } },
    'calfireUnits': { layers: ['calfireUnits', 'calfireUnits_title'], exe: () => { config.layersHandler.calfireUnits(); } },
    'cdfFHSZ': { layers: ['cdfFHSZ', 'cdfFHSZ_title'], exe: () => { config.layersHandler.cdfFHSZ(); } },
    'calfireAircraft': { layers: ['calfireAircraft', 'calfireAircraft_title'], exe: () => { config.layersHandler.calfireAircraft(); } }
});

export async function getContourLibrary() {
    if (window.__DEBUG__ || __DEBUG__) return;

    if (!mlcontour) {
        const module = await import('maplibre-contour');
        mlcontour = module.default;
    }

    return mlcontour;
}

// Added: Enforce desired layer order regardless of load order
export function reorderLayers() {
    [
        'evac',
        'evac_bg',
        'evac_outline',

        'perimeters_fill',
        'perimeters_outline',

        'evac_title',
        'perimeters_title',

        'rx_fires',
        'rx_fires_title',
        'smk_fires',
        'smk_fires_title',
        'new_fires',
        'new_fires_title',
        'all_fires',
        'all_fires_title',

        'complexes',
        'complexes_title'
    ].forEach(id => {
        if (global.map.getLayer(id)) {
            global.map.moveLayer(id);
        }
    });
}