class Tools {
    constructor() {
        this.target = null;
        this.activeTool = null;
        this.filterControls = document.querySelector('.filter-controls .tools');
        this.defaultMyContent = impactHeader + '<div class="content"><div id="spinner" class="centered"></div></div>';
        this.markerIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="{{color}}" d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/><ellipse style="fill:#ffffff;stroke:#ffffff" cx="320.212" cy="256.449" rx="64.157" ry="64.157"/></svg>';
        this.selectedColor = null;

        this.tools = [
            { name: 'measure', icon: { weight: 300, content: 'f545' } },
            { name: 'polygon', icon: { weight: 400, content: 'f5ee' } },
            { name: 'marker', icon: { weight: 900, content: 'f3c5' } }
        ];

        this.measureGeojson = { type: 'FeatureCollection', features: [] };
        this.markerGeojson = { type: 'FeatureCollection', features: [] };

        this.overallDistance = 0;
        this.isMeasuring = false;

        this.measureClickListener = (e) => this.handleMeasureClick(e);
        this.markerClickListener = (e) => this.handleMarkerClick(e);

        this.measureSource = 'measure-geojson';
        this.markerSource = 'marker-geojson';

        this.allFeatures = {
            type: 'FeatureCollection',
            features: []
        }
    }

    use() {
        // add tool options to a controls bar
        this.tools.forEach(tool => {
            const div = document.createElement('div');
            div.classList.add('tool', `w${tool.icon.weight}`, tool.icon.content);
            div.style.display = 'inline-flex';
            div.setAttribute('title', ucwords(tool.name));
            div.setAttribute('data-action', 'tools');
            div.setAttribute('data-tool', tool.name);
            this.filterControls.appendChild(div);
        });

        // add a 'my content' menu item to the nav menu
        const myc = document.createElement('li');
        myc.classList.add('ttip');
        myc.id = 'my-content';
        myc.setAttribute('data-action', 'back-my-content');
        myc.setAttribute('data-tooltip', 'My Content');
        myc.innerHTML = '<i class="fal fa-folder-open"></i><span>Content</span>';

        document.querySelector('nav ul li#legend').after(myc);
    }

    clickListener(target) {
        if (!target) return;

        this.target = target;
        const tool = target.dataset.tool;

        if (this.activeTool === tool) {
            this.end();
            this.target.classList.remove('active');
        } else {
            if (this.activeTool) this.end();
            this.activeTool = tool;
            this.target.classList.add('active');
            this.start();
        }
    }

    start() {
        if (this.activeTool === 'measure') this.startMeasure();
        else if (this.activeTool === 'polygon') this.createPolygon();
        else if (this.activeTool === 'marker') this.createMarker();
    }

    end() {
        // Clean up measure tool
        if (this.activeTool === 'measure' && this.isMeasuring) {
            ['measure-points', 'measure-lines', 'measure-distance'].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });

            if (map.getSource(this.measureSource)) map.removeSource(this.measureSource);

            map.off('click', this.measureClickListener);

            const d = document.querySelector('#distance');
            if (d) d.remove();

            this.measureGeojson.features = [];
            this.overallDistance = 0;
            this.isMeasuring = false;
        }

        // Clean up marker tool (listener only, layer stays)
        if (this.activeTool === 'marker') {
            map.off('click', this.markerClickListener);
        }

        this.activeTool = null;
        map.getCanvas().style.cursor = 'auto';
        if (this.target) this.target.classList.remove('active');
    }

    getDistance(segment) {
        if (!segment.geometry || !segment.geometry.coordinates || segment.geometry.coordinates.length < 2) return 0;
        const [coord1, coord2] = segment.geometry.coordinates;
        return parseFloat(distance(coord1[1], coord1[0], coord2[1], coord2[0]));
    }

    // ---------------------- MEASURE ----------------------
    startMeasure() {
        this.isMeasuring = true;
        this.measureGeojson.features = [];
        this.overallDistance = 0;

        if (!map.getSource(this.measureSource)) {
            map.addSource(this.measureSource, { type: 'geojson', data: this.measureGeojson });
        } else {
            map.getSource(this.measureSource).setData(this.measureGeojson);
        }

        // Add measure layers
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
            filter: ['in', '$type', 'Point']
        });

        map.addLayer({
            id: 'measure-lines',
            type: 'line',
            source: this.measureSource,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#444', 'line-width': 2, 'line-dasharray': [2, 2] },
            filter: ['in', '$type', 'LineString']
        }, 'measure-points');

        map.addLayer({
            id: 'measure-distance',
            type: 'symbol',
            source: this.measureSource,
            paint: { 'text-color': '#eee', 'text-halo-color': '#111', 'text-halo-blur': 1, 'text-halo-width': 1 },
            layout: {
                'symbol-placement': 'line-center',
                'symbol-spacing': 3000,
                'text-font': config.fonts.roboto(),
                'text-field': ['to-string', ['get', 'distance']],
                'text-justify': 'auto',
                'text-size': 14,
                'text-max-width': 12,
                'text-max-angle': 30,
                'text-anchor': 'center',
                'text-offset': [0, 0],
                'text-letter-spacing': 0,
                'text-rotation-alignment': 'map',
                'text-keep-upright': true
            },
            filter: ['in', '$type', 'LineString']
        });

        map.on('click', this.measureClickListener);
        map.getCanvas().style.cursor = 'crosshair';
    }

    handleMeasureClick(e) {
        if (!this.measureGeojson) return;

        const features = map.queryRenderedFeatures(e.point, { layers: ['measure-points'] });

        // Keep only points
        this.measureGeojson.features = this.measureGeojson.features.filter(f => f.geometry.type === 'Point');
        this.overallDistance = 0;

        if (features.length) {
            const id = features[0].properties.id;
            this.measureGeojson.features = this.measureGeojson.features.filter(p => p.properties.id !== id);
        } else {
            const point = {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] },
                properties: { id: String(Date.now()) }
            };
            this.measureGeojson.features.push(point);
        }

        // Create segments & distances
        const points = this.measureGeojson.features.filter(f => f.geometry.type === 'Point');
        if (points.length > 1) {
            for (let i = 1; i < points.length; i++) {
                const segment = {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [points[i - 1].geometry.coordinates, points[i].geometry.coordinates] },
                    properties: {}
                };
                const dist = this.getDistance(segment);
                segment.properties.distance = numberFormat(dist, 1) + ' mi.';
                this.overallDistance += dist;
                this.measureGeojson.features.push(segment);
            }
        }

        // Update distance container
        let d = document.querySelector('#distance');
        if (!d) {
            d = document.createElement('div');
            d.id = 'distance';
            document.body.appendChild(d);
        }
        d.innerHTML = `Distance: ${numberFormat(this.overallDistance, 1)} mi.`;

        // Update map
        map.getSource(this.measureSource).setData(this.measureGeojson);
    }

    async makeMarkerImage(color = null) {
        const finalColor = color ?? this.selectedColor,
            iconId = 'marker-icon-' + finalColor.replace('#', '');

        async function loadSvgDataUri(uri) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = uri;
            });
        }

        const iconSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
            this.markerIcon.replace('{{color}}', finalColor)
        );
        const image = await loadSvgDataUri(iconSvg);

        if (map.hasImage(iconId)) {
            map.updateImage(iconId, image);
        } else {
            map.addImage(iconId, image);
        }
    }

    // ---------------------- MARKER ----------------------
    async createMarker() {
        this.doImpact().create('Create Waypoint');
        this.createItemForm('marker');
        this.doImpact().back();
        this.markerGeojson.features = [];

        localStorage.removeItem('mapofire.userContent');
        await this.makeMarkerImage();

        /*const image = await map.loadImage('https://maplibre.org/maplibre-gl-js/docs/assets/custom_marker.png');
            if (!map.hasImage('custom-marker')) map.addImage('custom-marker', image.data);*/

        if (!map.getSource(this.markerSource)) {
            map.addSource(this.markerSource, { type: 'geojson', data: this.markerGeojson });
        } else {
            map.getSource(this.markerSource).setData(this.markerGeojson);
        }

        if (!map.getLayer('draw-marker')) {
            map.addLayer({
                id: 'draw-marker',
                type: 'symbol',
                source: this.markerSource,
                layout: {
                    'icon-image': 'marker-icon-FF5733',
                    'icon-size': 0.25,
                    'icon-allow-overlap': true
                }
            });
        }

        map.getCanvas().style.cursor = 'crosshair';
        map.on('click', this.markerClickListener);
    }

    handleMarkerClick(e) {
        if (!this.markerGeojson) return;

        const point = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] },
            properties: { id: String(Date.now()) }
        };
        this.markerGeojson.features.push(point);

        map.getSource(this.markerSource).setData(this.markerGeojson);

        const form = impact.querySelector('#user-content-form');
        form.querySelector('input[name="lat"]').value = e.lngLat.lat;
        form.querySelector('input[name="lon"]').value = e.lngLat.lng;

        // Deactivate marker tool but leave layer
        this.activeTool = null;
        if (this.target) this.target.classList.remove('active');
        map.getCanvas().style.cursor = 'auto';
        map.off('click', this.markerClickListener);
    }

    // ---------------------- POLYGON ----------------------
    createPolygon() {
        console.log('create polygon');
    }

    formatDate(time = new Date().getTime(), showTime = true) {
        const date = new Date(time),
            afternoon = date.getHours() >= 12 ? true : false,
            prettyDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
            hr = `${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}`,
            min = `${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;

        return `${prettyDate}${showTime ? ` ${hr}:${min} ${afternoon ? 'PM' : 'AM'}` : ''}`;
    }

    createItemForm(type, edit = false) {
        let colors = '';
        const date = new Date(),
            prettyDT = this.formatDate(),
            colorOptions = [
                "#FF5733", // orange-red
                "#33B5FF", // sky blue
                "#28A745", // green
                "#FFC107", // amber
                "#9B59B6", // purple
                "#E91E63", // pink
                "#795548", // cyan
                "#2C3E50"  // dark blue-gray
            ];

        this.selectedColor = colorOptions[0];

        for (let i = 0; i < colorOptions.length; i++) {
            colors += `<div class="cmarker${i == 0 ? ' select' : ''}" data-color="${colorOptions[i]}" style="background-color:${colorOptions[i]}"></div>`;
        }

        const form = `<form action="" id="user-content-form" method="post">
            <input type="hidden" name="type" value="${type}">
            <input type="hidden" name="id" value="${date.getTime()}">
            <input type="hidden" name="created" value="${Math.round(date.getTime() / 1000)}">
            <input type="hidden" name="lat" value="">
            <input type="hidden" name="lon" value="">
            <input type="hidden" name="color" value="${this.selectedColor}">

            <div class="field">
                <label for="waypoint_name">${type == 'marker' ? 'Waypoint' : ucfirst(type)} Name</label>
                <div><input type="text" id="name" name="name" value="${prettyDT}"><span class="fat fa-xmark"></span></div>
            </div>

            <div class="field">
                <label for="notes">${type == 'marker' ? 'Waypoint' : ucfirst(type)} Notes</label>
                <div><textarea id="notes" name="notes" style="min-height:125px" placeholder="Waypoint notes..."></textarea></div>
            </div>

            <div id="colors">${colors}</div>

            <div class="btn-group centered" style="width:100%">
                <input type="submit" class="btn btn-green btn-large" style="width:100%" value="Save">
                <div id="spinner" style="display:none"></div>
            </div>
        </form>`;

        impact.querySelector('.content').innerHTML = form;

        const ucf = impact.querySelector('#user-content-form'),
            colorPicker = impact.querySelectorAll('#colors .cmarker');

        // change GIS item color
        colorPicker.forEach(c => {
            c.addEventListener('click', async (e) => {
                colorPicker.forEach(i => {
                    i.classList.remove('select');
                });

                this.selectedColor = e.target.dataset.color;
                ucf.querySelector('input[name="color"]').value = this.selectedColor;
                e.target.classList.add('select');
                await this.makeMarkerImage();
            });
        });

        // save item to server
        this.saveFeature(ucf, type, edit);
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
                const save = await api(config.apiURL + 'userContent/' + (edit ? 'update' : 'create'), [['token', settings.getUser().token()], ['data', encodeURIComponent(fields)]]);

                if (save && save.response == 'success') {
                    notify('success', `Your ${type == 'marker' ? 'waypoint' : type} was successfully saved.`);

                    if (edit) this.myContent();
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

        const store = localStorage.getItem('mapofire.userContent');
        const addedColors = {};

        if (store == null) {
            gis = await api(config.apiURL + 'userContent/list', [['token', settings.getUser().token()]]);

            // user has no saved GIS features
            if (!gis || !gis.features || gis.features.length == 0) {
                console.info('No saved GIS features');
                // TODO: add a message to the my content impact modal
            } else {
                localStorage.setItem('mapofire.userContent', JSON.stringify(gis));
            }
        } else {
            gis = JSON.parse(store); console.log(gis);
        }

        impact.querySelector('.content').innerHTML = '<ul class="user-content"></ul>';

        // loop through all features
        for (let i = 0; i < gis.features.length; i++) {
            const feat = gis.features[i],
                objectID = feat.objectID,
                type = feat.type == 'marker' ? 'Waypoint' : ucfirst(feat.type),
                geojson = feat.geojson,
                name = decodeURIComponent(geojson.properties.name),
                ////notes = geojson.properties.notes,
                color = geojson.properties.color,
                created = feat.created,
                modified = feat.modified ?? 0,
                mod = new Date().getTime() / 1000 - modified > 43200 ? this.formatDate(modified * 1000, false) : timeAgo(modified).replace('Just', 'just');

            // add all features to global json array
            this.allFeatures.features.push(geojson);

            if (feat.type === 'marker' && !addedColors[color]) {
                await this.makeMarkerImage(color);
                addedColors[color] = true;
            }

            const item = document.createElement('li'),
                ic = feat.type == 'marker' ? 'location-dot' : 'xmark';

            // set attributes and html for each li element
            item.setAttribute('data-id', objectID);
            item.setAttribute('data-local-id', geojson.properties.id);
            item.setAttribute('data-type', feat.type);
            item.setAttribute('data-color', color);
            item.setAttribute('title', `${name} (${type})`);
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
                        point = map.project([lng, lat]),
                        impactWidth = impact.offsetWidth,
                        offsetPoint = {
                            x: point.x - impactWidth / 2,
                            y: point.y
                        },
                        offsetLngLat = map.unproject([offsetPoint.x, offsetPoint.y]);

                    map.flyTo({
                        center: offsetLngLat,
                        zoom: 12,
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

        if (!map.getSource('user-features')) {
            map.addSource('user-features', {
                type: 'geojson',
                data: this.allFeatures
            });
        } else {
            map.getSource('user-features').setData(this.allFeatures);
        }

        if (!map.getLayer('user-features-markers')) {
            map.addLayer({
                id: 'user-features-markers',
                type: 'symbol',
                source: 'user-features',
                layout: {
                    'icon-image': ['concat', 'marker-icon-', ['slice', ['get', 'color'], 1, 7]],
                    'icon-size': 0.25,
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
    }

    editUserFeature(attrs) {
        const attributes = [];

        for (const attr of attrs) {
            attributes[attr.name] = attr.value;
        }

        this.doImpact().setTitle('Edit ' + (attributes['data-type'] == 'marker' ? 'Waypoint' : ucfirst(attributes['data-type'])));
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
        ucf.querySelector('input[name="lat"]').value = thisFeature[0].geometry.coordinates[1];
        ucf.querySelector('input[name="lon"]').value = thisFeature[0].geometry.coordinates[0];

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

                    item.remove();
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