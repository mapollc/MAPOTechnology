import { config } from '../app/config.js';
import { global } from '../app/state.js';

import { mapMouseOver } from '../utils/helpers.js';

import { ArcGISFeature } from '../map/arcgis.js';
import { reorderLayers } from '../map/layers.js';

export class Perimeters {
    constructor() {
        this.REGION_BBOX = {
            ca: [-141.0, 41.7, -52.6, 83.1],        // Canada approx
            aus: [112.0, -44.0, 154.0, -10.0]       // Australia approx
        };
    }

    get settings() {
        return config.settings;
    }

    getAssociatedPerim(fireName) {
        if (!this.settings.isEnabled('perimeters')) return;

        const src = global.map.getSource('perimeters')._data.geojson.features,
            wait = setInterval(() => {
                if (src) {
                    const name = fireName.replace(/\s/gm, '').toLowerCase();
                    clearInterval(wait);

                    const results = src.filter(feat => {
                        const p = feat.properties;

                        return p.attr_IncidentName.replace(/\s/gm, '').toLowerCase() == name ||
                            p.poly_IncidentName.replace(/\s/gm, '').toLowerCase() == name;
                    });

                    console.log(results);
                }
            }, 200);
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

        return this.settings.archive == null ? [
            'case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#777', pc] : '#777';
    }

    async intlPerimeters(/*update = false*/) {
        const vis = !this.settings.user || !this.settings.checkboxes() || this.settings.isEnabled('perimeters') ? 'visible' : 'none',
            min = this.settings.perimeters().minSize() / 2.471,    // convert to hectres for the metric countries
            pc = this.perimeterColor(this.settings.perimeters().color()),
            b = global.map.getBounds(),
            viewBBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
            intersects = (view, region) => {
                return !(view[2] < region[0] || view[0] > region[2] || view[3] < region[1] || view[1] > region[3]);
            },
            loadPerimeter = async ({ id, url, where }) => {
                const src = `${id}_perimeters`,
                    outline = `${id}_perimeters_outline`,
                    fill = `${id}_perimeters_fill`;

                // the map isn't over Canada or Australia so there's no need to fetch perimeters for those areas
                if (!intersects(viewBBox, this.REGION_BBOX[id])) return null;

                if (!global.map.getSource(src)) {
                    new ArcGISFeature(src, global.map, {
                        url: url,
                        precision: 6,
                        where: where,
                        outFields: '*'
                    });
                }
                /*const data = await api(url, [
                    ['where', where],
                    ['outFields', '*'],
                    ['resultType', 'tile'],
                    ['geometry', getbbox()],
                    ['geometryPrecision', 6],
                    ['geometryType', 'esriGeometryEnvelope'],
                    ['spatialRel', 'esriSpatialRelIntersects'],
                    ['returnGeometry', true],
                    ['f', 'geojson']
                ]);
     
                if (update && global.map.getSource(src)) {
                    global.map.getSource(src).setData(data);
                    return;
                }
     
                if (!global.map.getSource(src)) {
                    global.map.addSource(src, { type: 'geojson', data });
                }*/

                if (!global.map.getLayer(outline)) {
                    global.map.addLayer({
                        id: outline,
                        type: 'line',
                        source: src,
                        paint: {
                            'line-width': [
                                'case',
                                ['boolean', ['feature-state', 'click'], false],
                                3,
                                1
                            ],
                            'line-color': pc
                        },
                        layout: { visibility: vis }
                    });
                }

                if (!global.map.getLayer(fill)) {
                    global.map.addLayer({
                        id: fill,
                        type: 'fill',
                        source: src,
                        paint: {
                            'fill-opacity': 0.45,
                            'fill-color': pc
                        },
                        layout: { visibility: vis }
                    });

                    mapMouseOver(fill);
                }
            };

        await Promise.all([
            loadPerimeter({
                id: 'ca',
                url: 'https://services.arcgis.com/wjcPoefzjpzCgffS/ArcGIS/rest/services/Active_Wildfire_Perimeters_in_Canada_View/FeatureServer/0',
                where: `1=1 AND LASTDATE >= TIMESTAMP '${new Date().getFullYear()}-01-01 00:00:00' AND AREA >= ${min}`
            }),
            loadPerimeter({
                id: 'aus',
                url: 'https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Near_Real_Time_Bushfire_Boundaries_view/FeatureServer/3',
                where: `1=1 AND fire_name IS NOT NULL AND area_ha >= ${min}`
            })
        ]);

        return this;
    }

    async get(update = false) {
        let vis = !this.settings.user || !this.settings.checkboxes() || this.settings.isEnabled('perimeters') ? 'visible' : 'none',
            y = (this.settings.archive ? this.settings.archive : config.curTime.getFullYear()),
            min = this.settings.perimeters().minSize(),
            pc = this.perimeterColor(this.settings.perimeters().color()),
            o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_ContainmentDateTime,attr_PercentContained,attr_FireOutDateTime',
            perimName = 'attr_IncidentName',
            w = `attr_FireDiscoveryDateTime>=TIMESTAMP '${y}-01-01 00:00:00'`;

        if (!this.settings.archive) w += ` AND (poly_GISAcres > ${min} OR poly_Acres_AutoCalc > ${min}) AND attr_FireOutDateTime IS NULL`;

        // get Canada wildfire perimeters if not in archive mode
        if (!this.settings.archive) this.intlPerimeters(update);

        if (!global.map.getSource('perimeters')) {
            new ArcGISFeature('perimeters', global.map, {
                url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0',
                precision: 6,
                where: w,
                outFields: o
            });
        }

        if (!global.map.getLayer('perimeters_fill')) {
            global.map.addLayer({
                id: 'perimeters_fill',
                type: 'fill',
                source: 'perimeters',
                paint: {
                    'fill-opacity': 0.45,
                    'fill-color': pc
                },
                layout: {
                    visibility: vis
                }
            });
        }

        if (!global.map.getLayer('perimeters_outline')) {
            global.map.addLayer({
                id: 'perimeters_outline',
                type: 'line',
                source: 'perimeters',
                paint: {
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'click'], false],
                        3,
                        1
                    ],
                    'line-color': pc
                },
                layout: {
                    visibility: vis
                }
            });
        }

        if (!global.map.getLayer('perimeters_title')) {
            global.map.addLayer({
                id: 'perimeters_title',
                type: 'symbol',
                source: 'perimeters',
                minzoom: 5.8,
                paint: {
                    'text-color': this.settings.archive ? '#fff' : ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#333', '#fff'],
                    'text-halo-color': this.settings.archive ? '#333' : ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#fff', '#ff0000'],
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 200,
                    'text-font': config.fonts.din(),
                    'text-field': ['upcase', ['concat', ['get', perimName], ' Fire']],
                    'text-size': 13,
                    'text-max-angle': 30,
                    'text-padding': 5,
                    'text-pitch-alignment': 'viewport',
                    'text-rotation-alignment': 'map',
                    'text-offset': [0, 1],
                    visibility: vis
                }
            });

            mapMouseOver('perimeters_fill');
        }

        reorderLayers();

        return this;
    }
}