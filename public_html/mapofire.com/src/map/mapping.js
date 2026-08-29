import { global } from '../app/state.js';
import { ENV, config } from '../app/config.js';

import * as helper from '../utils/helpers.js';
import { legend, stateLabels, ODF_DISTRICT_NAMES } from '../utils/constants.js';
import { getCounties } from '../utils/geometry.js';

import { NWS, Weather } from '../data/weather.js';
import { Wildfires } from '../data/wildfires.js';

import { notify, startReportProcess } from '../ui/components.js';

const { numberFormat, geojsonExtent, Popup } = helper;

const SIMPLE_LAYERS = [
    'erc',
    'hms',
    'smokeFcst',
    'nri',
    'power',
    'dispatch',
    'gaccBounds',
    'calfireUnits',
    'cdfFHSZ'
];

const ZOOM_DEPENDENT_LAYERS = [
    { key: 'firemed', handler: () => config.layersHandler.firemed(true), minZoom: config.firemedZoomLevel },
    { key: 'modis24', handler: () => config.layersHandler.modis(1, true), minZoom: config.modisZoomLevel },
    { key: 'modis48', handler: () => config.layersHandler.modis(2, true), minZoom: config.modisZoomLevel },
    { key: 'modis72', handler: () => config.layersHandler.modis(3, true), minZoom: config.modisZoomLevel }
];

function moveEndImpl() {
    global.map.getCanvas().style.cursor = 'auto';

    //config.settings.logMovement();

    /*if (!config.settings.user || !config.settings.checkboxes() || config.settings.isEnabled('perimeters')) {
        config.perimeters.get(true);
    }*/

    if ((!config.settings.checkboxes() || config.settings.isEnabled('allFires')) && config.settings.archive != null) {
        config.wildfire.getWildfires(true);
    }

    // control zoom dependent layers
    ZOOM_DEPENDENT_LAYERS.forEach(layer => {
        if (config.settings.isEnabled(layer.key) && global.map.getZoom() >= layer.minZoom) layer.handler();
    });

    // update simple layers
    SIMPLE_LAYERS.forEach(key => {
        if (config.settings.isEnabled(key)) {
            config.layersHandler[key](true);
        }
    });

    // get wwas
    if (config.settings.isEnabled('wwas')) {
        new NWS().get(true);
    }

    if (config.settings.isEnabled('stns')) {
        const intv = setInterval(() => {
            if (typeof Weather !== 'undefined') {
                new Weather().raws(true);
                clearInterval(intv);
            }
        }, 500);
    }
}

export function contextMenu(e, isTouch = false) {
    const menu = document.querySelector('.context-menu');

    if (menu) menu.remove();

    let point, coords;

    if (isTouch) {
        const rect = global.map.getContainer().getBoundingClientRect();
        point = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        coords = global.map.unproject([point.x, point.y]);
    } else {
        point = e.point;
        coords = e.lngLat;
    }

    const ele = global.map.queryTerrainElevation([coords.lng, coords.lat]) ?? null,
        elevation = ele != null ? ele * 3.28084 : null;

    const div = document.createElement('div'),
        ul = document.createElement('ul'),
        options = [
            { text: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, hasPerms: true },
            { text: 'Copy coordinates', task: () => { global.inits.clickListener.copy(`${coords.lat}, ${coords.lng}`) }, hasPerms: true },
            {
                text: 'Copy elevation',
                task: async () => {
                    if (elevation == null) {
                        notify('info', 'Unable to get elevation here')
                    } else {
                        global.inits.clickListener.copy(`${numberFormat(elevation, 1)} ft.`, 'Elevation copied to clipboard');
                    }
                },
                hasPerms: config.settings?.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)
            },
            {
                text: 'Zoom here',
                task: () => {
                    global.map.easeTo({
                        center: [coords.lng, coords.lat],
                        zoom: 12,
                        duration: 1400
                    });
                },
                hasPerms: true
            },
            {
                text: 'Get fire weather',
                task: () => new Weather(coords.lat, coords.lng).fireWxFcst(),
                hasPerms: config.settings?.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)
            },
            { text: 'Report new fire', task: async () => startReportProcess(e), hasPerms: true }
        ];

    div.className = 'context-menu';
    document.body.appendChild(div);
    div.appendChild(ul);

    options.forEach((i, n) => {
        const li = document.createElement('li');
        if (n == 0) li.style = 'padding:1em 1em 0.5em 1em;font-weight:600;cursor:default;user-select:none';
        if (!i.hasPerms) li.classList.add('disabled');
        li.textContent = i.text;
        li.addEventListener('click', () => {
            if (!i.hasPerms) return;    // maybe suggest they subscribe?

            if (i.task) {
                i.task();
                div.remove();
            }
        });

        ul.appendChild(li);
    });

    const menuWidth = div.offsetWidth,
        menuHeight = div.offsetHeight,
        mapRect = global.map.getContainer().getBoundingClientRect();

    let top = point.y;
    let left = point.x;

    if (left + menuWidth > mapRect.width) left = mapRect.width - menuWidth;
    if (top + menuHeight > mapRect.height) top = mapRect.height - menuHeight;
    if (left < 0) left = 0;
    if (top < 0) top = 0;

    div.style.top = `${top}px`;
    div.style.left = `${left}px`;

    div.innerHTML = '';
    div.appendChild(ul);
}

export const modalZoom = (coordsOrLng, lat) => {
    let coords;

    if (Array.isArray(coordsOrLng) && coordsOrLng.length === 2) {
        coords = coordsOrLng;
    } else if (typeof coordsOrLng === 'number' && typeof lat === 'number') {
        coords = [coordsOrLng, lat];
    }

    const mapHeight = global.map.getContainer().clientHeight,
        modalHeight = mapHeight * global.inits.clickListener.modalHeightFromTop,
        visibleHeight = mapHeight - modalHeight,
        offsetY = -visibleHeight / 2;

    global.map.easeTo({
        center: coords,
        zoom: 8.75,
        offset: [0, Number.isFinite(offsetY) ? offsetY : 0],
        easing: t => t * (2 - t),
        duration: 1000
    });
};

export const moveEnd = helper.debounce(moveEndImpl, 500);

async function onRasterLayerClick(e) {
    const getLayer = (name) => global.map.getStyle().layers.find(l => l.id === name);

    const coords = e.lngLat;
    const fuels = getLayer('fuels'),
        bp = getLayer('bp'),
        rth = getLayer('rth'),
        whp = getLayer('whp'),
        wet = getLayer('wet'),
        wwas = getLayer('wwas');

    const wildfireRiskLayer = [
        { ref: rth, id: 'rth', key: 'rps', title: 'Wildfire Risk', label: 'Risk to Homes' },
        { ref: bp, id: 'bp', key: 'bp', title: 'Wildfire Likelihood', label: 'Wildfire Likelihood' }
    ].find(l => l.ref?.layout?.visibility === 'visible');

    if (wwas && wwas.layout.visibility.toString() === 'visible') {
        new NWS().find(e.lngLat.lat, e.lngLat.lng);
    }

    if (fuels && fuels.layout.visibility.toString() === 'visible') {
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
            notify('error', 'Unable to get fuels information. Try again.');
        }
    }

    if (wildfireRiskLayer && global.map.getZoom() >= 6) {
        const { id, key, title, label } = wildfireRiskLayer;
        const popup = new Popup(title, true).loading();

        const [respRes, pcRes] = await Promise.allSettled([
            helper.api(`${ENV.apiURL}risk`, [['lat', coords.lat], ['lon', coords.lng]]),
            global.conversion.getRasterColor(e.lngLat, id)
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
                'State Comparison': getComp(d.state, stateLabels[data.state].name),
                'US Comparison': getComp(d.us, 'the US')
            }).link(`https://apps.wildfirerisk.org/explore/${title === 'Wildfire Risk' ? 'risk-to-homes' : 'wildfire-likelihood'}/${String(data.fips).slice(0, 2)}/${data.fips}/`);
        } else {
            popup.update(null, `<p>Unable to retrieve ${title.toLowerCase()} risk report.</p>`);
        }
    }

    if (whp && whp.layout.visibility == 'visible' && global.map.getZoom() >= 6) {
        const popup = new Popup('Wildfire Hazard Potential', true).loading();

        const pc = await global.conversion.getRasterColor(e.lngLat, 'whp'),
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

        const pc = await global.conversion.getRasterColor(e.lngLat, 'wet'),
            val = legend.items.wet.find(i => i[2] === pc),
            desc = `A home at this location is ${val[3].toLowerCase()} to wildfire from adjacent vegetation or indirect sources (such as embers).`;

        popup.update(null, val ? `<div class="item"><div class="t">Exposure</div><div class="v">${desc}</div></div>` : '<p>Unable to retrieve wildfire hazard potential data.</p>');
    }
}

export async function onMapClick(e) {
    const features = global.map.queryRenderedFeatures([
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
    ]);

    // check for specific raster layers
    onRasterLayerClick(e);

    // if there are no features returned, then exit early
    if (features.length == 0) return;

    let clickedCounty = null;

    const sources = [],
        tfrs = [],
        fire_layers = ['all_fires', 'new_fires', 'smk_fires', 'rx_fires'];

    const wfClass = new Wildfires();

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
        if ((!sources.includes(src) && global.map.getSource(src)) || global.selected[selKey] != null) {
            global.map.removeFeatureState({
                source: src,
                id: global.selected[selKey],
                ...(selKey === 'perim' && { sourceLayer: 'perimeters' }),
                ...(selKey === 'evac' && { sourceLayer: 'evacuations' })
            });
            global.selected[selKey] = null;
        }
    });

    // loop through all features to see if county data is available
    clickedCounty = features.find(f => f.layer.id === 'counties')?.properties.NAME ?? null;

    // loop through all features
    for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        const prop = feature.properties;

        if (feature.source == 'complexes') {
            wfClass.showComplex(prop, feature.geometry);

            break;
        }

        // display wildfire incident
        if (fire_layers.includes(feature.source)) {
            if (feature.properties.cluster) {
                global.map.zoomIn();
            } else {
                const t = typeof prop.time === 'string' ? JSON.parse(prop.time) : prop.time;
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
        if (config.settings?.hasPermissions(config.PERMISSION_LEVELS.ADMIN)) {
            if (config.toolsInstance != null && (feature.source == 'user-features' || feature.source == 'marker-geojson' || feature.source == 'polygon-geojson')) {
                // TODO: if user clicks on a marker or polygon they created
                global.map.easeTo({
                    center: feature.geometry.coordinates,
                    zoom: 12,
                    duration: 1000
                });

                break;
            }
        }

        if (feature.source == 'ca_fires') {
            const name = prop.name,
                state = stateLabels?.[prop.province]?.name,
                time = JSON.parse(prop.time),
                acres = prop.acres,
                status = prop.status,
                near = prop.near;

            global.map.flyTo({
                center: feature.geometry.coordinates,
                zoom: 10
            });

            new Popup('Canadian Wildfire').create({
                'Incident Name': name,
                'Start Date': helper.dateTime(time.discovered),
                'Province': state,
                'Size': `${numberFormat(acres / 2.471, 2)} ha (${acres} acres)`,
                'Status': status,
                'Near': near
            }, `<span style="margin-top:1em;font-size:12px;color:#8d8d8d">Last update received ${helper.timeAgo(time.updated)}</span>`);
        }

        // on canada perimeter click
        if (feature.source == 'ca_perimeters') {
            global.selected.caperim = feature.id;

            global.map.setFeatureState({
                source: 'ca_perimeters',
                id: global.selected.caperim
            }, {
                click: true
            });

            if (config.settings.perimeters().zoom()) {
                global.map.fitBounds(geojsonExtent(feature.geometry), {
                    padding: 60
                });
            }

            break;
        }

        // on austrailia perimeter click
        if (feature.source == 'aus_perimeters') {
            const name = prop.fire_name,
                size = global.conversion.sizeFormat(prop.area_ha * 2.471),
                discovered = prop.ignition_date ? helper.dateTime(prop.ignition_date, true, true) : 'Unknown',
                updated = helper.timeAgo(prop.capt_date),
                istate = prop.state == 'WA' ? 'WAA' : (prop.state == 'NT' ? 'NTT' : prop.state),
                state = stateLabels?.[istate]?.name ?? istate;

            global.selected.ausperim = feature.id;

            global.map.setFeatureState({
                source: 'aus_perimeters',
                id: global.selected.ausperim
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

            if (config.settings.perimeters().zoom()) {
                global.map.fitBounds(geojsonExtent(feature.geometry), {
                    padding: 60
                });
            }

            break;
        }

        if (feature.source == 'perimeters') {
            const affectedCounties = getCounties(feature) ?? '';

            const name = `${prop.attr_IncidentName.replace(' Fire', '').toLowerCase().ucwords()} Fire`,
                ago = helper.timeAgo(prop.poly_DateCurrent),
                acres = prop.poly_Acres_AutoCalc > prop.poly_GISAcres ? prop.poly_Acres_AutoCalc : prop.poly_GISAcres,
                size = global.conversion.sizeFormat(acres);

            const wfid = config.wildfire.findFire(null, prop.attr_UniqueFireIdentifier)?.properties?.wfid ?? null;

            global.selected.perim = feature.id;

            global.map.setFeatureState({
                source: 'perimeters',
                sourceLayer: 'perimeters',
                id: global.selected.perim
            }, {
                click: true
            });

            helper.setHeaders(
                `Current ${name} Perimeter`,
                `perimeter/${prop.attr_UniqueFireIdentifier}`,
                `Current fire perimeter for the ${name} in ${stateLabels[prop.attr_POOState.replace('US-', '')]?.name}.`
            );

            new Popup('Wildfire Perimeter').create({
                'Incident Name': name,
                'Last Mapped': ago,
                'Perimeter Size': size,
                'Affected Counties': affectedCounties
            }, wfid ? `<a href="#" class="popup-btn" data-action="popupToInc" data-wfid="${wfid}">View fire details</a>` : null);

            if (config.settings?.perimeters().zoom()) {
                global.map.fitBounds(geojsonExtent(feature.geometry), {
                    padding: 60
                });
            }

            break;
        }

        // powerlines
        if (feature.source == 'power') {
            new Popup('Powerline').create({
                Owner: prop.OWNER,
                Type: prop.TYPE,
                Voltage: `${prop.VOLTAGE} kV`
            });

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
                ago = helper.timeAgo(new Date(prop.LocalTimeString).getTime());

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
        /*if (feature.source == 'wwas') {
            new NWS().find(e.lngLat.lat, e.lngLat.lng);
            break;
        }*/

        // on SPC outlook click
        if (feature.source == 'outlook') {
            const color = (prop.fill == '#66A366' || prop.fill == '#ff3333' ? '#fff' : '#242424');

            new Popup(`${(config.settings.special().otlkType() == 'severe' ? 'Severe' : 'Fire')} Weather Outlook - Day ${config.settings.special().otlkDay()}`)
                .create({
                    Risk: `<span class="spc" style="background-color:${prop.fill};color:${color}">${prop.name}</span>`,
                    Issued: helper.dateTime(prop.issue, true, true),
                    'Forecast Valid': helper.dateTime(prop.valid, true, true),
                    'Valid Until': helper.dateTime(prop.expires, true, true)
                },
                    `<a href="#" data-action="readSPC" data-type="${config.settings.special().otlkType()}" data-day="${config.settings.special().otlkDay()}" onclick="return false" class="popup-btn">Read the forecast</a>`
                );

            break;
        }

        /* modis heat spot click
        if (modis_layers.includes(feature.source)) {
            new Popup('Satellite-Detected Hotspot').create({
                Detected: helper.timeAgo(prop.acq_time),
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
                dt = helper.dateTime(new Date(`${prop.update_date} ${time} UTC`).getTime(), true);

            const isObs = config.settings.special().erc() == null || config.settings.special().erc() === 'obs';

            const popup = new Popup('')
                .loading('<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting ERC data...</p>')
                .update('Energy Release Component', {
                    'ERC Date': `${isObs ? 'Today' : 'Tomorrow'} (${helper.dateTime(Date.now() + (isObs ? 0 : 86400000))})`,
                    'Area (PSA)': psa,
                    'PSA Code': config.settings?.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? code : null,
                    'Current ERC Value': prop.avg_erc,
                    'ERC Percentile': `${isObs ? obs_pct : fcst_pct}%`,
                    'ERC Trend': isObs ? obs_trend : fcst_trend,
                    'NFDRS Obs Date': dt
                });

            if (chart != null && chart != '') popup.link(chart, 'View ERC Chart');

            global.selected.erc = feature.id;

            global.map.setFeatureState({
                source: 'erc',
                id: global.selected.erc
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
                'State': stateLabels[prop.State].name,
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

            global.selected.nri = feature.id;

            global.map.setFeatureState({
                source: 'nri',
                id: global.selected.nri
            }, { click: true });

            break;
        }

        // on ODF fire danger areas click
        if (feature.source == 'odfFDR') {
            let danger = '';
            const ifpl = prop.ifplrestrictionlevel ? prop.ifplrestrictionlevel : 'N/A';

            switch (prop.firedanger) {
                case 1: danger = 'Low'; break;
                case 2: danger = 'Moderate'; break;
                case 3: danger = 'High'; break;
                case 4: danger = 'Extreme'; break;
                default: danger = 'N/A'; break;
            }

            new Popup('ODF Fire Danger').create({
                District: ODF_DISTRICT_NAMES[prop.regusearea],
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
                'Last Updated': helper.timeAgo(prop.ddate)
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
                u = helper.timeAgo(prop.updated);

            new Popup('Evacuations').create({
                Level: `<span class="evac-circ l${prop.level}"></span>Level ${prop.level}`,
                Status: d,
                [prop.county ? 'County' : 'State']: (prop.county ? `${prop.county} County, ${prop.state}` : stateLabels[prop.state].name),
                'Last Updated': u,
                Notes: n
            });

            global.map.fitBounds(geojsonExtent(feature.geometry), {
                padding: 60
            });

            global.selected.evac = feature.id;

            global.map.setFeatureState({
                source: 'evac',
                sourceLayer: 'evacuations',
                id: global.selected.evac
            }, {
                click: true
            });

            break;
        }
    }

    // if there are any TFRs clicked on, show that info
    if (tfrs.length) {
        processTFRs(tfrs);
    }
}

function processTFRs(tfrs) {
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

    helper.createDataForm('TFRs', `<p class="updated" style="text-align:left;color:#555">Refer to the FAA website for official airspace information.</p>${content.join('')}`);
}