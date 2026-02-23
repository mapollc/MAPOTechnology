let map, init, clock, settings = null, stats = null, dashboardType = document.body.id;
const config = {
    host: `https://${window.location.host}/`,
    domain: 'https://www.mapotechnology.com/',
    apiURL: 'https://api.mapotechnology.com/v1/',
    productName: 'Wi-Fire',
    company: 'MAPO LLC',
    apiKey: () => { return '50e2c43f8f63ff0ed20127ee2487f15e' },
    incidents: new Map(),
    REFRESH_IN: 5,
    HOURS_NEW: 12
};
const listOfGACCs = {
    'AICC': 'Alaska',
    'EACC': 'Eastern Area',
    'GBCC': 'Great Basin',
    'NRCC': 'Northern Rockies',
    'NWCC': 'Northwest',
    'ONCC': 'Northern California',
    'OSCC': 'Southern California',
    'RMCC': 'Rocky Mountain',
    'SACC': 'Southern Area',
    'SWCC': 'Southwest'
},
    federalAgencies = [
        'Bureau of Indian Affairs',
        'Bureau of Land Management',
        'Bureau of Reclamation',
        'National Park Service',
        'National Business Center',
        'National Business Center',
        'US Bureau of Reclamation',
        'US Fish & Wildlife Service',
        'US Forest Service',
        'US Geological Survey',
        'Department of Energy'
    ],
    stateAgencies = [
        'Alaska Division of Forestry',
        'Alaska Native Corporation',
        'Arizona Department of Forestry and Fire Management',
        'Bureau of Forest Fire Control',
        'California Department of Forestry & Fire Protection',
        'California Department of Forestry and Fire Protection',
        'California Office of Emergency Services Fire and Rescure',
        'Department of Natural Resources',
        'Department of Natural Resources and Conservation',
        'Department of Natural Resources Forest Service',
        'Division of Forests and Land',
        'Division of Forest Resources',
        'Division of Forest Environment',
        'Division of Forest Resources',
        'Division of Forestry',
        'Division of Forestry Fire & State Lands',
        'Division of Wildland Fire',
        'Department of Natural Resources Forest Service',
        'Department of Conservation',
        'Idaho Department of Lands',
        'Nebraska Forest Service',
        'New Mexico State Forestry Division',
        'Florida Office of Emergency Services',
        'Nebraska Office of Emergency Services',
        'Georgia Department of Forestry',
        'Louisiana Department of Forestry',
        'Virginia Department of Forestry',
        'Oregon Department of Forestry',
        'South Carolina Forestry Commission',
        'State Forest Service',
        'State Forestry',
        'State Parks',
        'Washington State Patrol',
        'Michigan State/Highway - Patrol/Police',
        'Forestry Commission',
        'Forest Fire Service',
        'Forest Fire Protection',
        'Forest Fire Service',
        'Forest Fire Protection'
    ],
    stateLabels = {
        'AB': { name: 'Alberta', center: [-113.5, 54.5] },
        'ACT': { name: 'Australian Capital Territory', center: [149.0014, -35.4900] },
        'AL': { name: 'Alabama', center: [-86.8295337, 33.2588817] },
        'AK': { name: 'Alaska', center: [-149.680909, 64.4459613] },
        'AZ': { name: 'Arizona', center: [-111.7632755, 34.395342] },
        'AR': { name: 'Arkansas', center: [-92.4479108, 35.2048883] },
        'BC': { name: 'British Columbia', center: [-123.5, 54.5] },
        'CA': { name: 'California', center: [-118.7559974, 36.7014631] },
        'CO': { name: 'Colorado', center: [-105.6077167, 38.7251776] },
        'CT': { name: 'Connecticut', center: [-72.7342163, 41.6500201] },
        'DE': { name: 'Delaware', center: [-75.4013315, 38.6920451] },
        'DC': { name: 'District of Columbia', center: [-77.0365529, 38.8948932] },
        'FL': { name: 'Florida', center: [-81.4639835, 27.7567667] },
        'GA': { name: 'Georgia', center: [-83.1137366, 32.3293809] },
        'HI': { name: 'Hawaii', center: [-157.975203, 21.2160437] },
        'ID': { name: 'Idaho', center: [-114.74121, 45.61788] },
        'IL': { name: 'Illinois', center: [-89.4337288, 40.0796606] },
        'IN': { name: 'Indiana', center: [-86.1746933, 40.3270127] },
        'IA': { name: 'Iowa', center: [-93.3122705, 41.9216734] },
        'KS': { name: 'Kansas', center: [-98.5821872, 38.27312] },
        'KY': { name: 'Kentucky', center: [-85.1551411, 37.5726028] },
        'LA': { name: 'Louisiana', center: [-92.007126, 30.8703881] },
        'MB': { name: 'Manitoba', center: [-97.8, 55.0] },
        'ME': { name: 'Maine', center: [-68.8590201, 45.709097] },
        'MD': { name: 'Maryland', center: [-76.9382069, 39.5162234] },
        'MA': { name: 'Massachusetts', center: [-72.032366, 42.3788774] },
        'MI': { name: 'Michigan', center: [-84.6824346, 43.6211955] },
        'MN': { name: 'Minnesota', center: [-94.6113288, 45.9896587] },
        'MS': { name: 'Mississippi', center: [-89.7348497, 32.9715645] },
        'MO': { name: 'Missouri', center: [-92.5617875, 38.7604815] },
        'MT': { name: 'Montana', center: [-109.6387579, 47.3752671] },
        'NB': { name: 'New Brunswick', center: [-66.0, 46.5] },
        'NE': { name: 'Nebraska', center: [-99.5873816, 41.7370229] },
        'NL': { name: 'Newfoundland', center: [-58.0, 53.0] },
        'NS': { name: 'Nova Scotia', center: [-63.5, 45.0] },
        'NSW': { name: 'New South Wales', center: [147.0167, -32.1633] },
        'NV': { name: 'Nevada', center: [-116.8537227, 39.5158825] },
        'NH': { name: 'New Hampshire', center: [-71.6553992, 43.4849133] },
        'NJ': { name: 'New Jersey', center: [-74.4041622, 40.0757384] },
        'NM': { name: 'New Mexico', center: [-105.993007, 34.5708167] },
        'NY': { name: 'New York', center: [-74.0060152, 40.7127281] },
        'NC': { name: 'North Carolina', center: [-79.0392919, 35.6729639] },
        'ND': { name: 'North Dakota', center: [-100.540737, 47.6201461] },
        'NT': { name: 'Northwest Territories', center: [-117.0, 64.0] },
        'NTT': { name: 'Northern Territory', center: [133.3578, -19.3833] },
        'NU': { name: 'Nunavut', center: [-90.0, 71.0] },
        'OH': { name: 'Ohio', center: [-82.6881395, 40.2253569] },
        'OK': { name: 'Oklahoma', center: [-97.2684063, 34.9550817] },
        'ON': { name: 'Ontario', center: [-84.0, 50.0] },
        'OR': { name: 'Oregon', center: [-120.737257, 43.9792797] },
        'PA': { name: 'Pennsylvania', center: [-77.7278831, 40.9699889] },
        'PE': { name: 'Prince Edward Island', center: [-63.5, 46.3] },
        'QC': { name: 'Quebec', center: [-71.5, 52.0] },
        'QLD': { name: 'Queensland', center: [144.4317, -22.4870] },
        'RI': { name: 'Rhode Island', center: [-71.5992372, 41.7962409] },
        'SA': { name: 'South Australia', center: [135.7633, -30.0583] },
        'SC': { name: 'South Carolina', center: [-80.4363743, 33.6874388] },
        'SD': { name: 'South Dakota', center: [-100.348761, 44.6471761] },
        'SK': { name: 'Saskatchewan', center: [-106.0, 52.0] },
        'TAS': { name: 'Tasmania', center: [146.5933, -42.0214] },
        'TN': { name: 'Tennessee', center: [-86.2820081, 35.7730076] },
        'TX': { name: 'Texas', center: [-99.5120986, 31.8160381] },
        'UT': { name: 'Utah', center: [-111.7143584, 39.4225192] },
        'VIC': { name: 'Victoria', center: [144.2800, -36.8542] },
        'VT': { name: 'Vermont', center: [-72.5002608, 44.5990718] },
        'VA': { name: 'Virginia', center: [-78.4927721, 37.1232245] },
        'WA': { name: 'Washington', center: [-120.74014, 47.75107] },
        'WAA': { name: 'Western Australia', center: [122.2983, -25.3281] },
        'WV': { name: 'West Virginia', center: [-80.8408415, 38.4758406] },
        'WI': { name: 'Wisconsin', center: [-89.6884637, 44.4308975] },
        'WY': { name: 'Wyoming', center: [-107.5685348, 43.1700264] },
        'YT': { name: 'Yukon', center: [-135.0, 62.0] }
    };

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

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function ucwords(s) {
    const smallWords = new Set(['a', 'an', 'the', 'is', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'with']);
    return s.split(' ').map((word, i) => i === 0 || !smallWords.has(word.toLowerCase()) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(' ');
}

async function api(url, fields = null) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let result;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu'),
        isInternal = url.includes(config.apiURL) || url.includes(config.apiURL.replace('v1', 'v2')) || url.includes(config.host),
        ops = {
            method: isExternal ? 'GET' : 'POST'
        },
        fd = new FormData();

    if (isInternal) fd.append('key', config.apiKey());

    if (fields && Array.isArray(fields)) {
        for (const [k, v] of fields) {
            fd.append(k, v);
        }
    }

    if (!isExternal) ops['body'] = fd;

    try {
        const resp = await fetch(url, ops);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`HTTP error! Status: ${resp.status}, URL: ${url}, Response: ${errorText}`);

            return null;
        }

        // Attempt to parse JSON
        result = await resp.json();
    } catch (e) {
        console.error(`Fetch or JSON parsing error for URL: ${url}`, e.message);
        result = null
    }

    return result;
}

function saveSettings() {
    const typeFilter = document.querySelector('#typeFilter'),
        sizeFilter = document.querySelector('#sizeFilter'),
        gacc = document.querySelector('#gacc'),
        landowner = document.querySelector('#landowners'),
        tabs = document.querySelector('ul.tabs li.active');

    const settings = {
        tab: tabs?.dataset.tab || null,
        gacc: gacc.options[gacc.selectedIndex].value,
        landowner: landowner.options[landowner.selectedIndex].value,
        size: sizeFilter.options[sizeFilter.selectedIndex].value,
        types: Array.from(typeFilter.selectedOptions).map(opt => opt.value),
        saved: new Date().getTime(),
        dataSync: stats.lastUpdatedFire
    };

    localStorage.setItem('mapofire.dashboard.settings', JSON.stringify(settings));
}

function timeAgo(t, w, c) {
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
    let val = Math.floor(d / range.div) + ' ' + range.unit + plural(Math.floor(d / range.div));

    if (range.sub) {
        const subVal = subUnit(d, range.div, range.sub.div);
        if (subVal !== 0) {
            val += `,&nbsp;${subVal} ${range.sub.unit}${plural(subVal)}`;
        }
    }

    if (w === 1) val = val.split(',')[0];

    return val + ' ago';
}

class Init {
    constructor() {
        this.howManyFires = 15;
        this.wildfires = [];
    }

    processFires(json, type) {
        if (!json || !json.features?.length) return;

        const key = type === 'new' || type === 'all' ? 'all' : type;

        const existing = config.incidents.get(key) || [];
        config.incidents.set(key, [...existing, ...json.features]);
    }

    updated() {
        let timeLeft = config.REFRESH_IN * 60;
        const el = document.querySelector('#now');

        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60),
                seconds = timeLeft % 60;

            if (window.getComputedStyle(el).display == 'none') el.style.display = 'block';
            el.textContent = 'Next update in ' + String(minutes).padStart(1, '0') + ':' + String(seconds).padStart(2, '0');

            if (timeLeft === 0) {
                clearInterval(timer);
                document.querySelectorAll('p.stat').forEach(item => {
                    item.innerHTML = '<span class="loading"></span>';
                });
                document.querySelector('#fetchTime').textContent = '';
                document.querySelector('#wildfireList').innerHTML = '<span class="loading"></span>';
                document.querySelector('#newFiresList').innerHTML = '<span class="loading"></span>';

                config.incidents.clear('all');
                config.incidents.clear('smk');
                config.incidents.clear('rx');

                init.getFireData();
            }

            timeLeft--;
        }, 1000);
    }

    async getFireData() {
        try {
            stats = new Stats();

            const types = ['all', 'new', 'smk', 'rx'];

            await Promise.all(types.map(async (type, _) => {
                const fires = await api(`${config.apiURL}wildfires/${type}`);
                this.processFires(fires, type);
            }));

            this.updated();

            const outStats = '%5B%7B"onStatisticField"%3A"TotalIncidentPersonnel"%2C"outStatisticFieldName"%3A"PEOPLE"%2C"statisticType"%3A"sum"%7D%2C%7B"onStatisticField"%3A"EstimatedCostToDate"%2C"outStatisticFieldName"%3A"COST"%2C"statisticType"%3A"sum"%7D%2C%7B"onStatisticField"%3A"FireCause"%2C"outStatisticFieldName"%3A"CAUSE"%2C"statisticType"%3A"count"%7D%2C%7B"onStatisticField"%3A"CASE+WHEN+FinalAcres+>%3D+IncidentSize+AND+FinalAcres+>%3D+DiscoveryAcres+THEN+FinalAcres+WHEN+IncidentSize+>%3D+DiscoveryAcres+THEN+IncidentSize+ELSE+DiscoveryAcres+END"%2C"outStatisticFieldName"%3A"ACRES"%2C"statisticType"%3A"sum"%7D%5D',
                outStats2 = '%5B%7B"onStatisticField"%3A"PrimaryFuelModel"%2C"outStatisticFieldName"%3A"COUNT"%2C"statisticType"%3A"count"%7D%5D';

            stats.supp = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=FireOutDateTime+IS+NULL+AND+IncidentTypeCategory+%3D+%27WF%27&&outFields=*&returnGeometry=false&returnCountOnly=false&groupByFieldsForStatistics=FireCause&outStatistics=' + outStats + '&f=json');
            stats.fuels = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=FireOutDateTime+IS+NULL+AND+IncidentTypeCategory+%3D+%27WF%27&&outFields=*&returnGeometry=false&returnCountOnly=false&groupByFieldsForStatistics=PrimaryFuelModel&outStatistics=' + outStats2 + '&f=json');

            stats.init();
        } catch (e) {
            console.error(e);
        }
    }

    ucwords(s) {
        const smallWords = new Set([
            "a",
            "an",
            "the",
            "is",
            "of",
            "and",
            "or",
            "for",
            "to",
            "in",
            "on",
            "at",
            "by",
            "with"
        ]);
        return s
            .split(" ")
            .map((word, i) =>
                i === 0 || !smallWords.has(word.toLowerCase())
                    ? word.charAt(0).toUpperCase() + word.slice(1)
                    : word.toLowerCase()
            )
            .join(" ");
    }

    fireName(n) {
        const cleanedName = n.replace(/^\d+(?=\D)\s?/, "");
        return ucwords(cleanedName.toLowerCase()) + " Fire";
    }

    async getTopFires() {
        const list = document.querySelector("table#data tbody");
        const fires = await api(
            "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query?geometryPrecision=5&returnGeometry=false&where=1%3D1&outFields=OBJECTID,attr_InitialLatitude,attr_InitialLongitude,attr_FireDiscoveryDateTime,attr_POOState,attr_IncidentName,attr_UniqueFireIdentifier,poly_GISAcres,poly_Acres_AutoCalc&orderByFields=poly_GISAcres DESC&resultRecordCount=" + this.howManyFires + "&f=json"
        );

        document.querySelector("table#data tbody").innerHTML = "";

        fires.features.forEach((fire, i) => {
            const attr = fire.attributes;

            this.wildfires.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [
                        attr.attr_InitialLongitude,
                        attr.attr_InitialLatitude
                    ]
                },
                properties: attr
            });

            const date = Intl.DateTimeFormat("en-US", {
                year: "numeric"
            }).format(attr.attr_FireDiscoveryDateTime),
                name = this.fireName(attr.attr_IncidentName),
                state = attr.attr_POOState.replace("US-", ""),
                acres = Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 0
                }).format(attr.poly_GISAcres);

            const row = document.createElement("tr");
            row.addEventListener('click', () => {
                this.goToPerimeter(attr.OBJECTID);
            });

            row.innerHTML = `<td>#${i + 1}</td><td data-label="State">${state}</td><td data-label="Fire Name">${name}</td>
                <td class="acres" data-label="Acres Burned">${acres}</td><td data-label="Year">${date}</td>`;

            list.appendChild(row);
        });

        this.plotFires();
    }

    mapping() {
        map = new maplibregl.Map({
            container: 'map',
            zoom: 3.3,
            center: [-97.20712626971056, 40.642220251322556],
            style: config.host + 'data/maps/terrain.json',
            projection: 'mercator',
            hash: false,
            maxPitch: 0,
            attributionControl: false
        });

        map.once('load', () => {
            map.addControl(new maplibregl.NavigationControl({
                showCompass: false,
                showZoom: true,
                visualizePitch: true
            }), 'bottom-right');
        });

        map.on('style.load', async () => {
            const img = await map.loadImage(`${config.domain}assets/images/icons/fire/fire-icon-large.png`);
            map.addImage('fire-icon', img.data);
        });
    }

    async plotFires() {
        if (!map.getSource('fires')) {
            map.addSource('fires', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: this.wildfires
                }
            });
        }

        if (!map.getLayer('fires')) {
            map.addLayer({
                id: 'fires',
                type: 'symbol',
                source: 'fires',
                layout: {
                    'icon-image': 'fire-icon',
                    'icon-size': 0.35,
                    'icon-allow-overlap': true
                }
            });

            map.on('mouseenter', 'fires', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'fires', () => {
                map.getCanvas().style.cursor = 'default';
            });
        }

        map.on('click', 'fires', (e) => {
            const query = map.queryRenderedFeatures(e.point);

            if (query) {
                query.forEach(feat => {
                    if (feat.layer.id == 'fires') {
                        this.goToPerimeter(feat.properties.OBJECTID);
                        return;
                    }
                });
            }
        });
    }

    async goToPerimeter(id) {
        if (document.querySelector('#standby') == null) {
            const div = document.createElement('div');
            div.id = 'standby';
            div.innerHTML = '<div class="loading"></div>';
            document.body.append(div);
        }

        const fire = await api(
            "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query?geometryPrecision=5&returnGeometry=true&where=OBJECTID%3D" + id + "&outFields=OBJECTID,attr_InitialLatitude,attr_InitialLongitude,attr_FireDiscoveryDateTime,attr_POOState,attr_IncidentName,attr_UniqueFireIdentifier,poly_GISAcres,poly_Acres_AutoCalc&f=geojson"
        );

        if (!map.getSource('perimeter')) {
            map.addSource('perimeter', {
                type: 'geojson',
                data: fire
            });
        } else {
            map.getSource('perimeter').setData(fire);
        }

        document.querySelector('#standby')?.remove();

        map.fitBounds(geojsonExtent(fire.features[0].geometry), {
            padding: 40
        });

        if (!map.getLayer('perimeter_outline')) {
            map.addLayer({
                id: 'perimeter_outline',
                type: 'line',
                source: 'perimeter',
                paint: {
                    'line-width': 2,
                    'line-color': '#ed254e',
                    'line-opacity': 0.85
                }
            });
        }

        if (!map.getLayer('perimeter')) {
            map.addLayer({
                id: 'perimeter',
                type: 'fill',
                source: 'perimeter',
                paint: {
                    'fill-color': '#ed254e',
                    'fill-opacity': 0.375
                }
            }, 'fires');

            map.on('mouseenter', 'perimeter', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'perimeter', () => {
                map.getCanvas().style.cursor = 'default';
            });
        }

        map.on('click', 'perimeter', (e) => {
            const query = map.queryRenderedFeatures(e.point);

            if (query) {
                query.forEach(feat => {
                    if (feat.layer.id == 'perimeter') {
                        map.fitBounds(geojsonExtent(feat.geometry), {
                            padding: 40
                        });
                        return;
                    }
                });
            }
        });
    }
}

class Stats {
    constructor() {
        this.allFires = null;
        this.smokeChecks = null;
        this.rxBurns = null;
        this.supp = null;
        this.fuels = null;
        this.allItems = null;
        this.lastUpdatedFire = null;
        this.newDataAvailable = true;

        this.totalIncidents = 0;
        this.totalNew = 0;
        this.totalAll = 0;
        this.totalSmoke = 0;
        this.totalRX = 0;
        this.contained = 0;
        this.controlled = 0;
        this.out = 0;
        this.acres = 0;
        this.YTDacres = 0;
        this.people = 0;
        this.costTotal = 0;
        this.fuelModels = {
            grass: 0,
            brush: 0,
            slash: 0,
            timber: 0,
            other: 0
        };
        this.cause = {
            human: 0,
            natural: 0,
            unknown: 0
        };
        this.gaccs = new Map();
        this.ownership = {
            federal: 0,
            state: 0,
            other: 0
        };
        this.tableFires = null;

        this.activeFires = document.querySelector('#af');
        this.currentAcres = document.querySelector('#cb');
        this.personnel = document.querySelector('#psnl');
        this.cost = document.querySelector('#cost');
        this.fireCause = document.querySelector('#cause');
        this.fireCause2 = document.querySelector('#cause2');
        this.active = document.querySelector('#act');
        this.contain = document.querySelector('#contain');
        this.control = document.querySelector('#control');
        this.statusOut = document.querySelector('#out');
        this.newIncs = document.querySelector('#newinc');
        this.typeWF = document.querySelector('#type_wf');
        this.typeSC = document.querySelector('#type_sc');
        this.typeRX = document.querySelector('#type_rx');
        this.timber = document.querySelector('#timber');
        this.grass = document.querySelector('#grass');
        this.brush = document.querySelector('#brush');
        this.slash = document.querySelector('#slash');
        this.other = document.querySelector('#other');
        this.gaccCount = document.querySelector('#gaccCount');
        this.gaccAcresCount = document.querySelector('#gaccAcresCount');
        this.landownerCount = document.querySelector('#landownerCount');
        this.wildfireList = document.querySelector('#wildfireList');
        this.newFiresTitle = document.querySelector('#newFiresTitle');
        this.newFiresList = document.querySelector('#newFiresList');
        this.filterGACCs = document.querySelector('select#gacc');
        this.filterLandowners = document.querySelector('select#landowners');
        this.sizeFilter = document.querySelector('#sizeFilter');
        this.typeFilter = document.querySelector('#typeFilter');
    }

    init() {
        this.allFires = config.incidents.get('all') || [];
        this.smokeChecks = config.incidents.get('smk') || [];
        this.rxBurns = config.incidents.get('rx') || [];

        this.calculate();
    }

    fireName(n, t, i) {
        let o = '';

        if (t == 'Prescribed Fire') {
            o = (n.includes('RX') ? n : n + ' RX');
        } else if (t == 'Smoke Check') {
            o = 'Smoke Check' + (i !== undefined ? ' #' + i.split('-')[1] + '-' + parseInt(i.split('-')[2]) : '');
        } else {
            if (n === undefined || n == '') {
                o = 'Incident #' + parseInt(i.split('-')[2]);
            } else {
                const cleanedName = n.replace(/^\d+(?=\D)\s?/, '');
                o = ucwords(cleanedName.toLowerCase()) + ' Fire';
            }
        }
        return o;
    }

    syncManagement() {
        this.lastUpdatedFire = this.allItems.reduce((maxItem, item) => {
            return !maxItem || item.properties.time.updated > maxItem.properties.time.updated ? item : maxItem;
        }, 0).properties.time.updated * 1000;

        if (settings) this.newDataAvailable = this.lastUpdatedFire - settings.dataSync > 0;
    }

    calculate() {
        this.totalAll = this.allFires.length;
        this.totalSmoke = this.smokeChecks.length;
        this.totalRX = this.rxBurns.length;
        this.totalIncidents = this.totalAll + this.totalSmoke + this.totalRX;
        this.allItems = [...this.allFires, ...this.smokeChecks, ...this.rxBurns];

        this.syncManagement();

        this.allItems.forEach(feat => {
            const prop = feat.properties,
                protect = prop.protection;

            // count fire statuses
            if (prop.status.Contain) this.contained++;
            if (prop.status.Control) this.controlled++;
            if (prop.status.Out) this.out++;

            // calculate acres and determine # of fires per GACC
            const g = protect.gacc,
                acres = (prop.acres && !isNaN(Number(prop.acres))) ? Number(prop.acres) : 0,
                current = this.gaccs.get(g) || { count: 0, acres: 0 };

            this.acres += acres;

            current.count += 1;
            current.acres += acres;
            this.gaccs.set(g, current);

            // calculate number of federal vs state vs other # of fires
            if (protect.agency) {
                if (federalAgencies.includes(protect.agency)) {
                    this.ownership.federal += 1;
                }

                if (stateAgencies.includes(protect.agency)) {
                    this.ownership.state += 1;
                }
            }

            // calculate # of new fires in last 'x' hours
            if ((new Date().getTime() / 1000) - prop.time.discovered < 60 * 60 * config.HOURS_NEW) {
                this.totalNew += 1;
            }
        });

        this.ownership.other = this.totalIncidents - this.ownership.federal - this.ownership.state;

        // create list of fires for table
        this.tableFires = this.allItems.slice()
            .sort((a, b) => {
                const diff = this.getAcres(b) - this.getAcres(a);
                if (diff !== 0) return diff;

                return this.getDiscovery(b) - this.getDiscovery(a);
            });

        // determine fire cause
        const human = this.supp.features.filter(a => a.attributes.FireCause == 'Human')[0].attributes,
            natural = this.supp.features.filter(a => a.attributes.FireCause == 'Natural')[0].attributes,
            unknown = this.supp.features.filter(a => a.attributes.FireCause == 'Undetermined' || a.attributes.FireCause == '')[0].attributes;

        [human, natural, unknown].forEach(item => {
            this.people += item.PEOPLE;
            this.costTotal += item.COST;
            this.YTDacres += item.ACRES;
        });

        this.cause.human += human.CAUSE;
        this.cause.natural += natural.CAUSE;
        this.cause.unknown += unknown.CAUSE;

        // count fires by fuels
        this.fuels?.features.forEach(feat => {
            if (feat.attributes.PrimaryFuelModel == null) return;
            const fuel = feat.attributes.PrimaryFuelModel.toLowerCase();

            if (fuel.search('grass') >= 0) this.fuelModels.grass += feat.attributes.COUNT;
            else if (fuel.search('brush') >= 0 || fuel.search('rough') >= 0) this.fuelModels.brush += feat.attributes.COUNT;
            else if (fuel.search('timber') >= 0) this.fuelModels.timber += feat.attributes.COUNT;
            else if (fuel.search('slash') >= 0) this.fuelModels.slash += feat.attributes.COUNT;
            else this.fuelModels.other += feat.attributes.COUNT;
        });

        // get fires per GACC and set options in the select
        const initial = this.doGACC();
        this.animateValue(initial?.count ?? 0, this.gaccCount);
        this.animateValue(initial?.acres ?? 0, this.gaccAcresCount);

        // save settings as is and display all this data
        saveSettings();
        this.display();
    }

    getAcres(fire) {
        const val = fire.properties.acres;
        return (!val || val === "Unknown") ? 0 : Number(val);
    };

    getDiscovery(fire) {
        return fire.properties.time.discovered ? Date.parse(fire.properties.time.discovered) : 0;
    };

    doGACC() {
        this.filterGACCs.innerHTML = '';

        [...this.gaccs.keys()].sort((a, b) => a.localeCompare(b))
            .forEach(g => {
                const opt = document.createElement('option');
                opt.text = listOfGACCs[g];
                opt.value = g;
                this.filterGACCs.appendChild(opt);
            });

        this.filterGACCs.disabled = false;

        if (settings && settings.gacc && this.gaccs.has(settings.gacc)) {
            this.filterGACCs.value = settings.gacc;
        }

        this.filterGACCs.addEventListener('change', (e) => {
            const current = this.gaccs.get(e.target.value);

            this.animateValue(current?.count ?? 0, this.gaccCount);
            this.animateValue(current?.acres ?? 0, this.gaccAcresCount);
            saveSettings();
        });

        return this.gaccs.get(this.filterGACCs.value);
    }

    display() {
        document.querySelector('#fetchTime').textContent = `, at ${Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(new Date(this.lastUpdatedFire))}`;

        this.animateValue(this.totalIncidents, this.activeFires);
        this.animateValue(this.totalNew, this.newIncs);
        this.animateValue(this.totalAll, this.typeWF);
        this.animateValue(this.totalSmoke, this.typeSC);
        this.animateValue(this.totalRX, this.typeRX);

        this.animateValue(this.contained, this.contain);
        this.animateValue(this.controlled, this.control);
        this.animateValue(this.out, this.statusOut);
        this.animateValue(this.totalIncidents - this.contained - this.controlled, this.active);

        this.updateTable(
            this.sizeFilter.options[this.sizeFilter.selectedIndex].value,
            Array.from(this.typeFilter.selectedOptions).map(opt => opt.value)
        );
        this.createNewFiresTable();

        this.animateValue(this.cause.human, this.fireCause);
        this.animateValue(this.cause.natural, this.fireCause2);
        this.animateValue(this.people, this.personnel);

        this.animateValue(this.costTotal, this.cost, true);
        this.animateValue(this.acres, this.currentAcres);

        // display fires by landownership
        this.filterLandowners.disabled = false;
        this.animateValue(this.ownership[settings && settings.landowner ? settings.landowner : 'federal'], this.landownerCount);

        this.filterLandowners.addEventListener('change', (e) => {
            const value = e.target.options[e.target.selectedIndex].value,
                dp = this.ownership[value];
            this.animateValue(dp, this.landownerCount);
            saveSettings();
        });

        // display # of fires burning in a specific fuel model
        this.animateValue(this.fuelModels.timber, this.timber);
        this.animateValue(this.fuelModels.grass, this.grass);
        this.animateValue(this.fuelModels.brush, this.brush);
        this.animateValue(this.fuelModels.slash, this.slash);
        //this.animateValue(this.fuelModels.other, this.other);

        this.newFiresTitle.textContent = 'New Wildfires (last ' + config.HOURS_NEW + ' hours)';
    }

    animateValue(target, displayField, currency = false) {
        let i = 0;
        const step = Math.ceil(target / 50),
            numFmt = Intl.NumberFormat('en-US'),
            moneyFmt = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

        const count = setInterval(() => {
            i += step;
            if (i >= target) {
                i = target;
                clearInterval(count);
            }
            displayField.innerHTML = currency ? moneyFmt.format(i) : numFmt.format(i);
        }, 16);
    }

    createTableRow(table, fire) {
        const prop = fire.properties,
            div = document.createElement('div');

        div.classList.add('row');
        div.addEventListener('click', () => {
            window.open('https://mapofire.com/' + prop.url + '?utm_campaign=mapofire&utm_medium=button&utm_source=blazeboard', 'wildfire');
        });

        div.innerHTML = `<div>${this.fireName(prop.name, prop.type, prop.incidentId)}</div>
                    <div class="state">${stateLabels[prop.state]?.name}</div>
                    <div>${Intl.NumberFormat('en-US', {}).format(prop.acres)} acres</div>
                    <div class="date">${timeAgo(prop.time.discovered)}</div>`;

        table.querySelector('.scroll').appendChild(div);
    }

    createNewFiresTable() {
        this.newFiresList.innerHTML = '<div class="thead"><div class="inline"><div>Name</div><div class="state">State</div><div>Size</div><div>Discovered</div></div></div><div class="scroll"></div>';

        this.tableFires
            .filter(feat => {
                return new Date().getTime() - (feat.properties.time.discovered * 1000) < 60 * 60 * config.HOURS_NEW * 1000
            })
            .sort((a, b) => b.properties.time.discovered - a.properties.time.discovered)
            .forEach(fire => this.createTableRow(this.newFiresList, fire));
    }

    updateTable(size, types) {
        this.wildfireList.innerHTML = '<div class="thead"><div class="inline"><div>Name</div><div class="state">State</div><div>Size</div><div>Discovered</div></div></div><div class="scroll"></div>';

        this.tableFires
            .filter(feat => {
                const type = feat.properties.type,
                    typeMatch = (type === 'Wildfire' && types.includes('all')) ||
                        (type === 'Smoke Check' && types.includes('smk')) ||
                        (type === 'Prescribed Fire' && types.includes('rx'));

                return ((size == 0 && Number(feat.properties.acres) < 100) ||
                    (size != 0 && Number(feat.properties.acres) >= size)) && typeMatch
            })
            .forEach(fire => this.createTableRow(this.wildfireList, fire));

        this.typeFilter.disabled = false;
        this.sizeFilter.disabled = false;
    }
}

function updateTabPos(tab) {
    document.querySelectorAll('ul.tabs li').forEach(t => t.classList.remove('active'));
    document.querySelector('ul.tabs li[data-tab="' + tab + '"]').classList.add('active');

    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab-content[data-tab="' + tab + '"]').classList.add('active');
}

document.onreadystatechange = () => {
    init = new Init();

    if (document.readyState != 'complete') {
        if (dashboardType != 'top') {
            settings = JSON.parse(localStorage.getItem('mapofire.dashboard.settings')) ?? null;

            if (settings != null) {
                const typeFilter = document.querySelector('#typeFilter'),
                    sizeFilter = document.querySelector('#sizeFilter');

                Array.from(sizeFilter.options).forEach(opt => {
                    opt.selected = settings.size == opt.value;
                });

                Array.from(typeFilter.options).forEach(opt => {
                    opt.selected = settings.types.includes(opt.value);
                });

                typeFilter.dispatchEvent(new Event('change'));
                sizeFilter.dispatchEvent(new Event('change'));
            }

            updateTabPos(settings?.tab || 'largest');
        }
    } else {
        if (dashboardType == 'top') {
            init.getTopFires();
            init.mapping();
        } else {
            init.getFireData();
        }
    }
};

window.addEventListener('click', (e) => {
    const menu = document.querySelector('header .heading .data'),
        icon = document.getElementById('menuIcon'),
        clickedIcon = icon.contains(e.target),
        clickedMenu = menu.contains(e.target);

    if (clickedIcon && window.innerWidth <= 425) {
        menu.classList.toggle('mobile');
        return;
    }

    if (!clickedIcon && !clickedMenu) {
        menu.classList.remove('mobile');
    }

    if (e.target.closest('.title')) {
        window.location.href = 'https://mapofire.com/?utm_campaign=mapofire&utm_medium=logo&utm_source=blazeboard';
    }

    if (e.target.closest('.card')?.id == 'goToNewFires') {
        updateTabPos('new');
    }

    if (e.target.closest('.tabs li')) {
        const tab = e.target.dataset.tab;

        updateTabPos(tab);
        saveSettings();
    }
});

window.addEventListener('change', (e) => {
    const target = e.target,
        typeFilter = document.querySelector('#typeFilter'),
        sizeFilter = document.querySelector('#sizeFilter');

    if (target.id == 'sizeFilter') {
        const size = target.value;

        stats.updateTable(
            size,
            Array.from(typeFilter.selectedOptions).map(opt => opt.value)
        );

        saveSettings();
    }

    if (target.id == 'typeFilter') {
        stats.updateTable(
            sizeFilter.options[sizeFilter.selectedIndex].value,
            Array.from(target.selectedOptions).map(opt => opt.value)
        );

        saveSettings();
    }
});