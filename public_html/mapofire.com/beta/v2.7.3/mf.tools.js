class Tools {
    constructor() {
        this.target = null;
        this.activeTool = null;

        this.filterControls = document.querySelector('.filter-controls .tools');
        this.navLegend = document.querySelector('nav ul li#legend');

        this.defaultMyContent = impactHeader + '<div class="content"><div id="spinner" class="centered"></div></div>';
        this.markerIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="{{color}}" d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/><ellipse style="fill:#ffffff;stroke:#ffffff" cx="320.212" cy="256.449" rx="64.157" ry="64.157"/></svg>';
        this.defaultColor = '#FF5733';
        this.selectedColor = null;
        this.storeName = 'mapofire.userContent';

        this.tools = [
            { name: 'measure', icon: { weight: 300, content: 'f545' } },
            { name: 'polygon', icon: { weight: 400, content: 'f5ee' } },
            { name: 'marker', icon: { weight: 900, content: 'f3c5' } }
        ];

        this.measureGeojson = { type: 'FeatureCollection', features: [] };
        this.markerGeojson = { type: 'FeatureCollection', features: [] };
        this.drawGeojson = { type: 'FeatureCollection', features: [] };
        this.allFeatures = { type: 'FeatureCollection', features: [] }

        this.drawCoords = [];
        this.overallDistance = 0;
        this.isMeasuring = false;

        this.measureClickListener = (e) => this.handleMeasureClick(e);
        this.markerClickListener = (e) => this.handleMarkerClick(e);
        this.drawClickListener = (e) => this.handleDrawClick(e);
        this.drawDoubleClickListener = (e) => this.handleDrawDone(e);
        this.drawMouseMoveListener = (e) => this.handleDrawMove(e);

        this.measureSource = 'measure-geojson';
        this.markerSource = 'marker-geojson';
        this.drawSource = 'draw-source';
    }

    ensureSource(id, data) {
        if (!map.getSource(id)) {
            map.addSource(id, { type: 'geojson', data });
        } else {
            map.getSource(id).setData(data);
        }
    }

    formatDate(time = new Date().getTime(), showTime = true) {
        const date = new Date(time),
            afternoon = date.getHours() >= 12 ? true : false,
            prettyDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
            hr = `${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}`,
            min = `${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;

        return `${prettyDate}${showTime ? ` ${hr}:${min} ${afternoon ? 'PM' : 'AM'}` : ''}`;
    }

    removeLayers(ids) {
        ids.forEach(id => {
            map.getLayer(id) && map.removeLayer(id);
        });
    }

    use() {
        const frag = document.createDocumentFragment();

        // add tool options to a controls bar
        this.tools.forEach(tool => {
            const div = document.createElement('div');
            div.className = `tool w${tool.icon.weight} ${tool.icon.content}`;
            div.style.display = 'inline-flex';
            div.title = tool.name.ucwords();
            div.dataset.action = 'tools';
            div.dataset.tool = tool.name;
            frag.appendChild(div);
        });

        this.filterControls.appendChild(frag);

        // add a 'my content' menu item to the nav menu
        const myc = document.createElement('li');
        myc.className = 'ttip';
        myc.id = 'my-content';
        myc.dataset.action = 'back-my-content';
        myc.dataset.tooltip = 'My Content';
        myc.innerHTML = '<i class="fal fa-folder-open"></i><span>Content</span>';

        this.navLegend.after(myc);
    }

    clickListener(target) {
        if (!target) return;

        this.target = target;
        const tool = target.dataset.tool;

        if (this.activeTool === tool) {
            this.end();
            return;
        }

        if (this.activeTool) this.end();

        this.activeTool = tool;
        this.target.classList.add('active');
        this.start();
    }

    start() {
        if (this.activeTool === 'measure') return this.startMeasure();
        if (this.activeTool === 'polygon') return this.createPolygon();
        if (this.activeTool === 'marker') return this.createMarker();
    }

    end() {
        if (this.activeTool === 'measure' && this.isMeasuring) {
            this.removeLayers(['measure-points', 'measure-lines', 'measure-distance']);
            map.getSource(this.measureSource) && map.removeSource(this.measureSource);
            map.off('click', this.measureClickListener);

            document.querySelector('#distance')?.remove();

            this.measureGeojson.features.length = 0;
            this.overallDistance = 0;
            this.isMeasuring = false;
        }

        if (this.activeTool === 'marker') {
            map.off('click', this.markerClickListener);
        }

        this.activeTool = null;
        map.getCanvas().style.cursor = 'auto';
        this.target?.classList.remove('active');
    }

    getDistance(segment) {
        const c = segment.geometry?.coordinates;
        if (!c || c.length < 2) return 0;
        return +distance(c[0][1], c[0][0], c[1][1], c[1][0]);
    }

    getMeasurements(geojson) {
        const type = geojson.geometry.type,
            coords = geojson.geometry.coordinates,
            data = {};

        if (type == 'Point') {
            data['elevation'] = map.queryTerrainElevation(coords) * 3.28084;
        }

        if (type == 'LineString') {
            data['length'] = this.calculatePathLength(coords);
            data['elevation'] = this.calculateElevations(coords);
        }

        if (type == 'Polygon') {
            data['perimeter'] = this.calculatePathLength(coords[0]);
            data['area'] = this.calculateArea(coords[0]);
            data['elevation'] = {
                perimeter: this.calculateElevations(coords[0])
            };
        }

        return data;
    }

    calculateElevations(coords) {
        const elevs = [];

        for (let i = 0; i < coords.length; i++) {
            elevs.push(map.queryTerrainElevation(coords[i]));
        }

        return {
            min: Math.min.apply(null, elevs) * 3.28084,
            mean: (elevs.reduce((a, b) => a + b, 0) / elevs.length) * 3.28084,
            max: Math.max.apply(null, elevs) * 3.28084
        }
    }

    calculatePathLength(coords) {
        let dist = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            dist += distance(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
        }
        return dist;
    }

    calculateArea(coords) {
        let area = 0;
        const R = 3958.8; 
        if (coords.length > 2) {
            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i], p2 = coords[i + 1];
                area += (p2[0] - p1[0]) * (2 + Math.sin(p1[1] * Math.PI / 180) + Math.sin(p2[1] * Math.PI / 180));
            }
            area = Math.abs(area * R * R * Math.PI / 360);
        }
        return area
    }

    /* ---------------------- MEASURE ---------------------- */
    startMeasure() {
        this.isMeasuring = true;
        this.measureGeojson.features.length = 0;
        this.overallDistance = 0;

        /* CHANGED: use helper */
        this.ensureSource(this.measureSource, this.measureGeojson);

        if (!map.getLayer('measure-points')) {
            map.addLayer({
                id: 'measure-points',
                type: 'circle',
                source: this.measureSource,
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#fff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#f97316'
                },
                filter: ['==', '$type', 'Point']
            });
        }

        if (!map.getLayer('measure-lines')) {
            map.addLayer({
                id: 'measure-lines',
                type: 'line',
                source: this.measureSource,
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: { 'line-color': '#444', 'line-width': 2, 'line-dasharray': [2, 2] },
                filter: ['==', '$type', 'LineString']
            });
        }

        if (!map.getLayer('measure-distance')) {
            map.addLayer({
                id: 'measure-distance',
                type: 'symbol',
                source: this.measureSource,
                layout: {
                    'symbol-placement': 'line-center',
                    'text-field': ['to-string', ['get', 'distance']],
                    'text-size': 14,
                    'text-font': config.fonts.roboto()
                },
                paint: {
                    'text-color': '#eee',
                    'text-halo-color': '#111',
                    'text-halo-width': 1
                },
                filter: ['==', '$type', 'LineString']
            });
        }

        map.on('click', this.measureClickListener);
        map.getCanvas().style.cursor = 'crosshair';
    }

    handleMeasureClick(e) {
        const src = this.measureGeojson;
        src.features = src.features.filter(f => f.geometry.type === 'Point');
        this.overallDistance = 0;

        const hits = map.queryRenderedFeatures(e.point, { layers: ['measure-points'] });

        if (hits.length) {
            const id = hits[0].properties.id;
            src.features = src.features.filter(p => p.properties.id !== id);
        } else {
            src.features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] },
                properties: { id: String(Date.now()) }
            });
        }

        const points = src.features.slice();

        for (let i = 1; i < points.length; i++) {
            const seg = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        points[i - 1].geometry.coordinates,
                        points[i].geometry.coordinates
                    ]
                },
                properties: {}
            };

            const d = this.getDistance(seg);
            seg.properties.distance = numberFormat(d, 1) + ' mi.';
            this.overallDistance += d;

            src.features.push(seg);
        }

        let d = document.querySelector('#distance');

        if (!d) {
            d = document.createElement('div');
            d.id = 'distance';
            document.body.appendChild(d);
        }

        d.textContent = `Distance: ${numberFormat(this.overallDistance, 1)} mi.`;

        map.getSource(this.measureSource).setData(src);
    }

    async makeMarkerImage(color = this.selectedColor) {
        const iconId = 'marker-icon-' + color.replace('#', '');

        const svg = 'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent(this.markerIcon.replace('{{color}}', color));

        const img = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = svg;
        });

        map.hasImage(iconId) ? map.updateImage(iconId, img) : map.addImage(iconId, img);
    }

    /* ---------------------- MARKER ---------------------- */
    async createMarker() {
        this.doImpact().create('Create Waypoint');
        this.createItemForm('marker');
        this.doImpact().back();

        this.markerGeojson.features.length = 0;
        //localStorage.removeItem(this.storeName);

        this.selectedColor = this.defaultColor;
        await this.makeMarkerImage();

        this.ensureSource(this.markerSource, this.markerGeojson);

        if (!map.getLayer('draw-marker')) {
            map.addLayer({
                id: 'draw-marker',
                type: 'symbol',
                source: this.markerSource,
                layout: {
                    'icon-image': ['concat', 'marker-icon-', ['slice', ['get', 'color'], 1, 7]],
                    'icon-size': 0.25,
                    'icon-anchor': 'bottom',
                    'icon-allow-overlap': true
                }
            });
        }

        map.getCanvas().style.cursor = 'crosshair';
        map.on('click', this.markerClickListener);
    }

    handleMarkerClick(e) {
        this.markerGeojson.features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] },
            properties: { id: String(Date.now()), color: this.selectedColor ?? this.defaultColor }
        });

        map.getSource(this.markerSource).setData(this.markerGeojson);

        const form = impact.querySelector('#user-content-form');
        form.lat.value = e.lngLat.lat;
        form.lon.value = e.lngLat.lng;

        this.end();
    }

    createPolygon() {
        this.doImpact().create('Create Track');
        this.createItemForm('polygon');
        this.doImpact().back();

        this.drawCoords = [];
        this.drawGeojson.features = [];
        this.ensureSource(this.drawSource, this.drawGeojson);

        const color = this.selectedColor ?? this.defaultColor;

        // Line Layer (Outer boundary/path)
        if (!map.getLayer('draw-line')) {
            map.addLayer({
                id: 'draw-line',
                type: 'line',
                source: this.drawSource,
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': ['coalesce', ['get', 'color'], color],
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                },
                filter: ['in', '$type', 'LineString', 'Polygon']
            });
        }

        // Fill Layer (Only visible if it's a Polygon)
        if (!map.getLayer('draw-fill')) {
            map.addLayer({
                id: 'draw-fill',
                type: 'fill',
                source: this.drawSource,
                paint: {
                    'fill-color': ['coalesce', ['get', 'color'], color],
                    'fill-opacity': 0.3
                },
                filter: ['==', ['geometry-type'], 'Polygon']
            });
        }

        // Vertex Points
        if (!map.getLayer('draw-pts')) {
            map.addLayer({
                id: 'draw-pts',
                type: 'circle',
                source: this.drawSource,
                paint: {
                    'circle-radius': 4,
                    'circle-color': '#fff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': ['coalesce', ['get', 'color'], color]
                },
                filter: ['==', '$type', 'Point']
            });
        }

        map.getCanvas().style.cursor = 'crosshair';
        map.on('click', this.drawClickListener);
        map.on('mousemove', this.drawMouseMoveListener);
        map.on('dblclick', this.drawDoubleClickListener);
        map.doubleClickZoom.disable();
    }

    handleDrawClick(e) {
        const coord = [e.lngLat.lng, e.lngLat.lat];

        if (this.drawCoords.length > 2) {
            const startPos = map.project(this.drawCoords[0]);
            const clickPos = e.point;
            const dx = startPos.x - clickPos.x;
            const dy = startPos.y - clickPos.y;

            // If within 15px of start, finish immediately
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
                return this.handleDrawDone(null, true); // Added 'true' flag
            }
        }

        const last = this.drawCoords[this.drawCoords.length - 1];
        if (last && last[0] === coord[0] && last[1] === coord[1]) return;

        this.drawCoords.push(coord);
        this.updateDrawSource();

        // UI Title logic
        const titleEl = impact.querySelector('#a');
        const newTitle = `Create ${this.drawCoords.length > 2 ? 'Area' : 'Track'}`;
        if (titleEl && titleEl.innerText !== newTitle) titleEl.innerHTML = newTitle;
    }

    handleDrawMove(e) {
        if (this.drawCoords.length === 0) return;

        let tempCoord = [e.lngLat.lng, e.lngLat.lat];

        if (this.drawCoords.length > 2) {
            const startPos = map.project(this.drawCoords[0]);
            const dist = Math.sqrt(Math.pow(startPos.x - e.point.x, 2) + Math.pow(startPos.y - e.point.y, 2));

            if (dist < 15) {
                tempCoord = this.drawCoords[0]; // Snap the dashed line to start
                map.getCanvas().style.cursor = 'pointer';
            } else {
                map.getCanvas().style.cursor = 'crosshair';
            }
        }

        this.updateDrawSource(tempCoord);
    }

    handleDrawDone(e, isSnap = false) {
        if (!isSnap) {
            this.drawCoords = this.drawCoords.slice(0, -2);
        }

        if (this.drawCoords.length < 2) return this.cleanupDraw();

        const isPolygon = this.drawCoords.length > 2,
            type = isPolygon ? 'Polygon' : 'LineString',
            finalCoords = isPolygon ? [[...this.drawCoords, this.drawCoords[0]]] : this.drawCoords;

        const feature = {
            type: 'Feature',
            geometry: {
                type,
                coordinates: finalCoords
            },
            properties: {
                id: String(Date.now()),
                color: this.selectedColor,
            }
        };

        // Switch view to Polygon mode and clear temp listeners
        this.drawGeojson.features = [feature];
        map.getSource(this.drawSource).setData(this.drawGeojson);
        this.cleanupDraw();

        const form = impact.querySelector('#user-content-form');

        form.querySelector('input[name="type"]').value = type.toLowerCase();
        form.querySelector('input[name="coords"]').value = JSON.stringify(this.drawGeojson.features[0].geometry.coordinates);
    }

    updateDrawSource(tempCoord = null) {
        const currentColor = this.selectedColor ?? this.defaultColor;
        const feats = [];

        // Permanent vertices
        this.drawCoords.forEach(c => {
            feats.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: c },
                properties: { color: currentColor }
            });
        });

        // Line preview (includes the moving mouse coordinate)
        if (this.drawCoords.length > 0) {
            const lineCoords = tempCoord ? [...this.drawCoords, tempCoord] : this.drawCoords;

            if (lineCoords.length > 1) {
                feats.push({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: lineCoords },
                    properties: { color: currentColor }
                });
            }
        }

        this.drawGeojson.features = feats;
        map.getSource(this.drawSource).setData(this.drawGeojson);
    }

    cleanupDraw() {
        map.off('click', this.drawClickListener);
        map.off('dblclick', this.drawDoubleClickListener);
        map.off('mousemove', this.drawMouseMoveListener);

        map.doubleClickZoom.enable();
        map.getCanvas().style.cursor = 'auto';
    }

    createItemForm(type, edit = false) {
        const date = new Date();
        const prettyDT = this.formatDate();
        const container = impact.querySelector('.content');

        const colorOptions = [
            this.defaultColor, // orange-red
            "#33B5FF", // sky blue
            "#28A745", // green
            "#FFC107", // amber
            "#9B59B6", // purple
            "#E91E63", // pink
            "#795548", // brown
            "#2C3E50"  // dark blue-gray
        ];

        this.selectedColor = colorOptions[0];

        const colorsHtml = colorOptions.map((color, i) => `
            <div class="cmarker${i === 0 ? ' select' : ''}"
                 data-color="${color}"
                 style="background-color:${color}">
            </div>
        `).join('');

        const formHtml = `<form id="user-content-form" method="post" autocomplete="off">
            <input type="hidden" name="type" value="${type}">
            <input type="hidden" name="id" value="${date.getTime()}">
            <input type="hidden" name="created" value="${Math.round(date.getTime() / 1000)}">
            ${type == 'marker' ? '<input type="hidden" name="lat"><input type="hidden" name="lon">' : '<input type="hidden" name="coords" value="">'}
            <input type="hidden" name="color" value="${this.selectedColor}">

            <div class="field">
                <label for="item-name">${type === 'marker' ? 'Waypoint' : (type === 'polygon' ? 'Area' : 'Track')} Name</label>
                <div>
                    <input type="text" id="item-name" name="name" value="${prettyDT}" autocomplete="off">
                    <span class="fat fa-xmark"></span>
                </div>
            </div>

            <div class="field">
                <label for="notes">${type === 'marker' ? 'Waypoint' : (type === 'polygon' ? 'Area' : 'Track')} Notes</label>
                <div>
                    <textarea id="notes" name="notes" style="min-height:125px" placeholder="Waypoint notes..."></textarea>
                </div>
            </div>

            <div id="colors">${colorsHtml}</div>

            <div class="btn-group centered" style="width:100%">
                <input type="submit" class="btn btn-green btn-large" style="width:100%" value="Save">
                <input type="button" data-method="${edit ? 'edit' : 'create'}" id="delete-item" class="btn btn-gray btn-large" style="width:100%" value="Delete">
                <div id="spinner" style="display:none"></div>
            </div>
        </form>`;

        container.innerHTML = formHtml;

        const form = container.querySelector('#user-content-form');
        const colorMarkers = form.querySelectorAll('#colors .cmarker');
        const colorInput = form.querySelector('input[name="color"]');

        const updateColorSelection = async (marker) => {
            colorMarkers.forEach(m => m.classList.remove('select'));
            marker.classList.add('select');

            this.selectedColor = marker.dataset.color;
            colorInput.value = this.selectedColor;

            await this.makeMarkerImage();
        };

        colorMarkers.forEach(marker => {
            marker.addEventListener('click', () => updateColorSelection(marker));
        });

        // save the feature
        this.saveFeature(form, type, edit);

        // delete the feature
        form.querySelector('#delete-item').addEventListener('click', async (e) => {
            const method = e.target.dataset.method;

            if (method == 'edit') {
                const objectID = form.querySelector('input[name="objectID"]').value,
                    id = form.querySelector('input[name="id"]').value;

                this.deleteUserFeature(objectID, id);
            } else {
                this.markerGeojson.features = [];
                this.ensureSource(this.markerSource, this.markerGeojson);
                this.selectedColor = null;
            }

            this.myContent();
        });
    }

    saveFeature(ucf, type, edit) {
        function reset() {
            ucf.querySelector('input[type="submit"]').value = 'Save';
            ucf.querySelector('input[type="submit"]').disabled = false;
            ucf.querySelector('.btn-group #spinner').style.display = 'none';
        }

        ucf.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = new FormData(e.target);

            ucf.querySelector('input[type="submit"]').value = 'Saving...';
            ucf.querySelector('input[type="submit"]').disabled = true;
            ucf.querySelector('.btn-group #spinner').style.display = 'block';

            const fields = JSON.stringify(Object.fromEntries(data.entries()));

            try {
                const save = await api(config.apiURL + 'userContent/' + (edit ? 'update' : 'create'), [
                    ['token', settings.getUser().token()],
                    ['data', encodeURIComponent(fields)]
                ]);

                if (save && save.response == 'success') {
                    notify('success', `Your ${type == 'marker' ? 'waypoint' : type} was successfully saved.`);

                    //if (edit) localStorage.removeItem(this.storeName);
                    this.myContent();
                } else {
                    if (!edit) reset();
                    notify('error', `Your ${type == 'marker' ? 'waypoint' : type} was unable to be saved.`);
                }
            } catch (err) {
                reset();
                console.error(err);
                notify('error', `Your ${type == 'marker' ? 'waypoint' : type} was unable to be saved.`);
            }
        });
    }

    doImpact() {
        return {
            create: (title = '') => {
                impact.innerHTML = this.defaultMyContent;
                impact.setAttribute('data-display', 'my-content');
                this.doImpact().show();
                this.doImpact().setTitle(title);
            },
            setTitle: (title = '') => {
                impact.querySelector('#a').innerHTML = title;
            },
            back: () => {
                const mclose = impact.querySelector('#mclose'),
                    mci = mclose.querySelector('#mclose i');

                mclose.classList.add('back');
                impact.querySelector('header').style.flexDirection = 'row-reverse';
                mclose.setAttribute('data-action', 'back-my-content');
                mci.setAttribute('data-action', 'back-my-content');
                mci.classList.remove('fa-xmark');
                mci.classList.add('fa-chevron-left');
            },
            show: () => {
                impact.style.display = 'flex';
            }
        };
    }

    async myContent() {
        if (this.activeTool != null) {
            this.end();
        }

        this.doImpact().create('My Content');

        let gis;
        this.allFeatures = {
            type: 'FeatureCollection',
            features: []
        };

        //const store = localStorage.getItem(this.storeName);
        const addedColors = {};

        //if (store == null) {
            gis = await api(config.apiURL + 'userContent/list', [['token', settings.getUser().token()]]);

            // user has no saved GIS features
            if (gis.features && gis.features.length > 0) {
                //localStorage.setItem(this.storeName, JSON.stringify(gis));
            }
        /*} else {
            gis = JSON.parse(store);
        }*/

        // user has no saved GIS features
        if (!gis || !gis.features || gis.features.length == 0) {
            impact.querySelector('.content').innerHTML = '<p>You currently don\'t have any saved items right now.</p>'
            return;
        }

        impact.querySelector('.content').innerHTML = '<ul class="user-content"></ul>';

        // loop through all features
        for (let i = 0; i < gis.features.length; i++) {
            const feat = gis.features[i],
                objectID = feat.objectID,
                type = feat.type == 'marker' ? 'Waypoint' : feat.type.ucfirst(),
                geojson = feat.geojson,
                name = decodeURIComponent(geojson.properties.name),
                ////notes = geojson.properties.notes,
                color = geojson.properties.color,
                created = feat.created,
                modified = feat.modified ?? 0,
                mod = new Date().getTime() / 1000 - modified > 43200 ? this.formatDate(modified * 1000, false) : timeAgo(modified).replace('Just', 'just'),
                measurements = this.getMeasurements(geojson);

            // add all features to global json array
            this.allFeatures.features.push(geojson);

            console.log(measurements);

            if (feat.type === 'marker' && !addedColors[color]) {
                await this.makeMarkerImage(color);
                addedColors[color] = true;
            }

            const item = document.createElement('li'),
                ic = feat.type == 'marker' ? 'location-dot' : 'draw-polygon';

            // set attributes and html for each li element
            item.dataset.id = objectID;
            item.setAttribute('data-local-id', geojson.properties.id);
            item.dataset.type = feat.type;
            item.dataset.color = color;
            item.title = `${name} (${type})`;
            item.innerHTML = `<div class="meta"><div class="icon fas fa-${ic}" style="background-color:${color}"></div>
                <div class="text">
                    <h2>${name}</h2>
                    <p>${created != modified ? `Modified ${mod} &middot; ` : ''}Created ${this.formatDate(created * 1000, false)}</p>
                </div></div><span id="context-control" style="padding:0 0.5em" title="Open context menu" data-id="${geojson.properties.id}" class="fas fa-ellipsis-vertical"></span>`;

            // add listener to each li element
            item.addEventListener('click', (e) => {
                if (e.target.closest('#control')) return;

                const localId = item.getAttribute('data-local-id'),
                    feature = this.allFeatures.features.find(f =>
                        f.properties && String(f.properties.id) === String(localId)
                    );

                if (!feature) return;

                const geom = feature.geometry;

                if (geom.type === 'Point') {
                    const [lng, lat] = geom.coordinates,
                        mapEl = map.getContainer(),
                        mapWidth = mapEl.offsetWidth,
                        impactWidth = impact.offsetWidth,
                        visibleWidth = mapWidth - impactWidth,
                        offsetX = (visibleWidth / 2) - (mapWidth / 2);

                    map.flyTo({
                        center: [lng, lat],
                        zoom: 12,
                        offset: [-offsetX, 0],
                        duration: 1200
                    });
                } else if (geom.type === 'LineString') {
                    const bounds = geom.coordinates.reduce(
                        (b, c) => b.extend(c),
                        new maplibregl.LngLatBounds(geom.coordinates[0], geom.coordinates[0])
                    );

                    map.fitBounds(bounds, {
                        padding: 60,
                        maxZoom: 15,
                        duration: 1200
                    });
                } else if (geom.type === 'Polygon') {
                    const coords = geom.coordinates[0],
                        bounds = coords.reduce(
                            (b, c) => b.extend(c),
                            new maplibregl.LngLatBounds(coords[0], coords[0])
                        );

                    map.fitBounds(bounds, {
                        padding: 60,
                        maxZoom: 15,
                        duration: 1200
                    });
                }
            });

            // add click listener to ellipsis control for context menu to pop
            item.querySelector('#context-control').addEventListener('click', (e) => {
                e.stopPropagation();

                const rect = e.target.getBoundingClientRect();

                this.createContextMenu({
                    x: rect.right,
                    y: rect.bottom + 6,
                    item
                });
            });

            // add li element to ul list
            impact.querySelector('.user-content').appendChild(item);
        }

        this.ensureSource('user-features', this.allFeatures);

        if (!map.getLayer('user-features-markers')) {
            map.addLayer({
                id: 'user-features-markers',
                type: 'symbol',
                source: 'user-features',
                layout: {
                    'icon-image': ['concat', 'marker-icon-', ['slice', ['get', 'color'], 1, 7]],
                    'icon-size': 0.25,
                    'icon-anchor': 'bottom',
                    'icon-allow-overlap': true
                },
                filter: ['==', ['geometry-type'], 'Point']
            });

            map.on('mouseenter', 'user-features-markers', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'user-features-markers', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        if (!map.getLayer('user-features-lines')) {
            map.addLayer({
                id: 'user-features-lines',
                type: 'line',
                source: 'user-features',
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': ['coalesce', ['get', 'color'], this.defaultColor],
                    'line-width': 3
                },
                filter: ['any', 
                    ['==', '$type', 'LineString'], 
                    ['==', '$type', 'Polygon']
                ]
            });

            map.on('mouseenter', 'user-features-lines', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'user-features-lines', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        if (!map.getLayer('user-features-polygon-fill')) {
            map.addLayer({
                id: 'user-features-polygon-fill',
                type: 'fill',
                source: 'user-features',
                paint: {
                    'fill-color': ['coalesce', ['get', 'color'], this.defaultColor],
                    'fill-opacity': 0.25
                },
                filter: ['==', ['geometry-type'], 'Polygon']
            });

            map.on('mouseenter', 'user-features-polygon-fill', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'user-features-polygon-fill', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }
    }

    editUserFeature(attrs) {
        const attributes = [];

        for (const attr of attrs) {
            attributes[attr.name] = attr.value;
        }

        this.doImpact().setTitle('Edit ' + (attributes['data-type'] == 'marker' ? 'Waypoint' : (attributes['data-type'] == 'polygon' ? 'Area' : 'Track')));
        this.doImpact().back();
        this.createItemForm(attributes['data-type'], true);

        const ucf = impact.querySelector('#user-content-form'),
            thisFeature = config.toolsInstance.allFeatures.features.filter(f => String(f.id) === String(attributes['data-local-id']));

        // update form element with current feature data
        const obj = document.createElement('input');
        obj.type = 'hidden';
        obj.name = 'objectID';
        obj.value = attributes['data-id'];

        ucf.querySelector('input[name="created"]').remove();
        ucf.prepend(obj);

        ucf.querySelector('input[name="name"]').value = thisFeature[0].properties.name;
        ucf.querySelector('textarea[name="notes"]').value = thisFeature[0].properties.notes;
        ucf.querySelector('input[name="type"]').value = attributes['data-type'];
        ucf.querySelector('input[name="id"]').value = attributes['data-local-id'];
        ucf.querySelector('input[name="color"]').value = attributes['data-color'];

        if (attributes['data-type'] == 'marker') {
            ucf.querySelector('input[name="lat"]').value = thisFeature[0].geometry.coordinates[1];
            ucf.querySelector('input[name="lon"]').value = thisFeature[0].geometry.coordinates[0];
        } else {
            ucf.querySelector('input[name="coords"]').value = JSON.stringify(thisFeature[0].geometry.coordinates);
        }

        ucf.querySelectorAll('#colors .cmarker').forEach(async (c) => {
            if (c.dataset.color == attributes['data-color']) {
                c.classList.add('select');
            } else {
                c.classList.remove('select');
            }

            c.addEventListener('click', (e) => {
                const feats = this.allFeatures.features;

                if (feats) {
                    for (let i = 0; i < feats.length; i++) {
                        if (String(feats[i].id) == attributes['data-local-id']) {
                            this.allFeatures.features[i].properties.color = e.target.dataset.color;
                            break;
                        }
                    }

                    map.getSource('user-features').setData(this.allFeatures);
                }
            });
        });
    }

    async deleteUserFeature(id, localID, item) {
        if (confirm('Are you sure you want to permanently delete this?')) {
            try {
                const send = await api(config.apiURL + 'userContent/delete', [['token', settings.getUser().token()], ['id', id]]);

                if (send.response && send.response == 'success') {
                    this.allFeatures.features = this.allFeatures.features.filter(f => String(f.id) !== String(localID));

                    if (map.getSource('user-features')) {
                        map.getSource('user-features').setData(this.allFeatures);
                    }

                    if (item) item.remove();

                    /*if (localStorage.getItem(this.storeName)) {
                        const ls = JSON.parse(localStorage.getItem(this.storeName));

                        if (ls.features && ls.features.length > 0) {
                            const newF = ls.features.filter(f => String(f.localID) !== String(id));

                            localStorage.setItem(this.storeName, JSON.stringify({ features: newF }));
                        } else {
                            localStorage.removeItem(this.storeName);
                        }
                    }*/

                    notify('success', 'Your item was successfully deleted.');
                } else {
                    notify('error', 'We were unable to delete this item. Try again later.');
                }
            } catch (err) {
                console.error(err);
                notify('error', 'We were unable to delete this item. Try again later.');
            }
        }
    }

    createContextMenu({ x, y, item }) {
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'user-context-menu';

        menu.innerHTML = `<button data-action="zoom">Zoom to</button>
            <button data-action="edit">Edit</button>
            <button data-action="delete" class="danger">Delete</button>`;

        menu.style.right = `${window.innerWidth - x}px`;
        menu.style.top = `${y}px`;

        menu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (!action) return;

            const id = item.getAttribute('data-id'),
                localID = item.getAttribute('data-local-id');

            switch (action) {
                case 'zoom':
                    item.click();
                    break;

                case 'edit':
                    this.editUserFeature(item.attributes);
                    break;

                case 'delete':
                    this.deleteUserFeature(id, localID, item);
                    break;
            }

            this.closeContextMenu();
        });

        document.body.appendChild(menu);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', this._contextCloser = () => {
                this.closeContextMenu();
            }, { once: true });
        });
    }

    closeContextMenu() {
        const menu = document.querySelector('.user-context-menu');
        if (menu) menu.remove();
    }
}