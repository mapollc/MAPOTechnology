function upload() {
    modal.innerHTML = uploadContent;
    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'Upload a File';
}

async function mbdraw() {
    const res = await api(host + 'api/v1/session/objects/list/custom'),
        res2 = await api(host + 'api/v1/session/folders/list'),
        res3 = await api(host + 'api/v1/session/objects/list/uploads');

    userFeatures = res.features;
    userFolders = res2.folders;
    userUploadFeatures = res3.features;

    colorOptions.forEach((c) => {
        map.loadImage(cdn + 'icons/user-waypoint-' + c.name + '.png', (error, image) => {
            if (error) throw error;
            map.addImage('userIcon-' + c.name, image);
        });
    });

    loadScript('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v' + mbDrawVersion + '/mapbox-gl-draw.js')
        .then(() => {
            /* load helper scripts asynchronously before allowing any drawing */
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v' + mbDrawVersion + '/mapbox-gl-draw.css';
            document.head.append(l);

            loadScript(host + 'src/js/turf-' + version + '.js');
            loadScript(host + 'src/js/togeojson-' + version + '.js');

            Draw = new MapboxDraw({
                controls: {
                    point: true,
                    line_string: true,
                    polygon: true,
                    trash: true,
                    combine_features: false,
                    uncombine_features: false
                },
                userProperties: true,
                styles: [
                    {
                        id: 'gl-draw-polygon-fill-inactive',
                        type: 'fill',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Polygon'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'fill-color': mbcolors,
                            'fill-outline-color': mbcolors,
                            'fill-opacity': 0.2
                        }
                    },
                    {
                        id: 'gl-draw-polygon-fill-active',
                        type: 'fill',
                        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
                        paint: {
                            'fill-color': '#fbb03b',
                            'fill-outline-color': '#fbb03b',
                            'fill-opacity': 0.1
                        }
                    },
                    {
                        id: 'gl-draw-polygon-midpoint',
                        type: 'circle',
                        filter: ['all',
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'midpoint']],
                        paint: {
                            'circle-radius': 3,
                            'circle-color': BLU,
                            'circle-stroke-color': '#fff',
                            'circle-stroke-width': 2
                        }
                    },
                    {
                        id: 'gl-draw-polygon-stroke-inactive',
                        type: 'line',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Polygon'],
                            ['!=', 'mode', 'static']
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': mbcolors,
                            'line-width': 3
                        }
                    },
                    {
                        id: 'gl-draw-polygon-stroke-active',
                        type: 'line',
                        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#fbb03b',
                            'line-dasharray': [0.2, 2],
                            'line-width': 3
                        }
                    },
                    {
                        id: 'gl-draw-line-inactive',
                        type: 'line',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'LineString'],
                            ['!=', 'mode', 'static']
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': mbcolors,
                            'line-width': 4
                        }
                    },
                    {
                        id: 'gl-draw-line-active',
                        type: 'line',
                        filter: ['all',
                            ['==', '$type', 'LineString'],
                            ['==', 'active', 'true']
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#fbb03b',
                            'line-dasharray': [0.2, 2],
                            'line-width': 3
                        }
                    },
                    {
                        id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
                        type: 'circle',
                        filter: ['all',
                            ['==', 'meta', 'vertex'],
                            ['==', '$type', 'Point'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'circle-radius': 5,
                            'circle-color': '#fff'
                        }
                    },
                    {
                        id: 'gl-draw-polygon-and-line-vertex-inactive',
                        type: 'circle',
                        filter: ['all',
                            ['==', 'meta', 'vertex'],
                            ['==', '$type', 'Point'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'circle-radius': 3,
                            'circle-color': '#fbb03b'
                        }
                    },
                    {
                        id: 'gl-draw-point-point-stroke-inactive',
                        type: 'circle',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'feature'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'circle-radius': 5,
                            'circle-opacity': 1,
                            'circle-color': '#fff'
                        }
                    },
                    {
                        id: 'gl-draw-point-inactive',
                        type: 'symbol',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'feature'],
                            ['!=', 'mode', 'static']
                        ],
                        layout: {
                            'icon-image': mbicons,
                            'icon-size': 0.4
                        }
                    }/*,
                    {
                        id: 'gl-draw-point-stroke-active',
                        type: 'symbol',
                        filter: ['all',
                            ['==', '$type', 'Point'],
                            ['==', 'active', 'true'],
                            ['!=', 'meta', 'midpoint']
                        ],
                        layout: {
                            'icon-image': mbicons,
                            'icon-size': 0.5
                        }
                    }*/,
                    {
                        id: 'gl-draw-point-active',
                        type: 'circle',
                        filter: ['all',
                            ['==', '$type', 'Point'],
                            ['!=', 'meta', 'midpoint'],
                            ['==', 'active', 'true']
                        ],
                        paint: {
                            'circle-radius': 6,
                            'circle-stroke-width': 2,
                            'circle-color': ONG,
                            'circle-stroke-color': '#fff'
                        }
                    },
                    {
                        id: 'gl-draw-polygon-fill-static',
                        type: 'fill',
                        filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
                        paint: {
                            'fill-color': '#404040',
                            'fill-outline-color': '#404040',
                            'fill-opacity': 0.1
                        }
                    },
                    {
                        id: 'gl-draw-polygon-stroke-static',
                        type: 'line',
                        filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#404040',
                            'line-width': 2
                        }
                    },
                    {
                        id: 'gl-draw-line-static',
                        type: 'line',
                        filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#404040',
                            'line-width': 2
                        }
                    }
                ]
            });

            let selected = false,
                edited = false,
                editedID = null;

            if (!map.hasControl(Draw)) {
                map.addControl(Draw, 'top-right');
                map.on('draw.create', (e) => {
                    new Design(e).create()
                }).on('draw.update', (e) => {
                    new Design(e).update();
                    edited = true;
                    editedID = e.features[0].id;
                }).on('draw.selectionchange', (e) => {
                    if (e.features.length == 0) {
                        selected = false;
                    } else {
                        selected = true;
                    }

                    if (!selected && edited) {
                        new Design(null).syncUpdate(editedID);
                        edited = false;
                        editedID = null;
                    }
                }).on('draw.delete', (e) => {
                    new Design(e).delete()
                });
            }
        });
}

class Design {
    constructor(e) {
        if (e != null) {
            if (e.type && e.type == 'FeatureCollection') {
                this.event = e;
                this.features = this.event.features;
                this.type = null;
                this.coords = null;
                this.id = null;
            } else {
                this.event = e;
                this.feat = this.event.features[0];
                this.type = this.feat.geometry.type;
                this.name = (this.type == 'Point' ? 'Waypoint' : (this.type == 'LineString' ? 'Track' : 'Polygon'));
                this.coords = this.feat.geometry.coordinates;
                this.id = this.feat.id;
            }
        }
    }

    now() {
        return Math.round(new Date().getTime() / 1000);
    }

    async save(id, modified, fields = []) {
        fields.push(['id', id]);
        fields.push(['modified', modified]);

        await api(host + 'api/v1/session/objects/update', fields);
    }

    slopeAspect(lng, lat) {
        const PRECISION = 6,
            calc = new Calculate(),
            px = map.project([lng, lat], map.getZoom()),
            x = px.x,
            y = px.y,
            N = map.unproject(new mapboxgl.Point(x, y - 1)),
            E = map.unproject(new mapboxgl.Point(x + 1, y)),
            S = map.unproject(new mapboxgl.Point(x, y + 1)),
            W = map.unproject(new mapboxgl.Point(x - 1, y)),
            eleN = calc.getElevation(N.lat, N.lng, PRECISION, true),
            eleE = calc.getElevation(E.lat, E.lng, PRECISION, true),
            eleS = calc.getElevation(S.lat, S.lng, PRECISION, true),
            eleW = calc.getElevation(W.lat, W.lng, PRECISION, true),
            dy = calc.distance(N.lat, N.lng, S.lat, S.lng) * 1609,
            dx = calc.distance(E.lat, E.lng, W.lat, W.lng) * 1609,
            dzdx = (eleE - eleW) / dx,
            dzdy = (eleN - eleS) / dy,
            slope = Math.atan(Math.sqrt(dzdx ** 2 + dzdy ** 2)) * (180 / Math.PI),
            aspect = dx !== 0 ? (Math.atan2(dzdy, dzdx) * (180 / Math.PI) + 180) % 360 : (90 * (dy > 0 ? 1 : -1) + 180) % 360;

        return {
            slope: slope.toFixed(2),
            aspect: aspect
        };
    }

    counter(arr) {
        const counts = {};
        const values = [];

        arr.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });

        for (const [value, count] of Object.entries(counts)) {
            values.push({ value, count });
        }

        return values.sort((a, b) => (a.count < b.count ? 1 : -1));
    }

    stats(ty = null, cds = null) {
        let calc = new Calculate(),
            ret = {},
            type = (ty == null ? this.type : ty),
            coords = (cds != null ? (cds.length == 1 ? cds[0] : cds) : (type == 'Polygon' ? this.coords[0] : this.coords));

        if (type == 'Point') {
            const sa = this.slopeAspect(coords[0], coords[1]);

            ret.elevation = calc.getElevation(coords[1], coords[0], 1);
            ret.slope = sa.slope;
            ret.aspect = sa.aspect;
        } else if (type == 'MultiPolygon') {
            let pts = 0;

            coords.forEach((ec) => {
                pts += ec[0].length;
            });

            ret.points = pts;
            ret.shapes = coords.length;
            ret.area = {
                area: turf.area(turf.multiPolygon(coords)),
                avy: null
            };
        } else {
            let el = [],
                slopes = [],
                aspects = [],
                distance = 0,
                lastCoords,
                pavy = null,
                avy = 0,
                gain = 0,
                loss = 0;

            /* get elevation, slope, and aspect for each point along the linestring or perimeter of polygon */
            coords.forEach((c, n) => {
                const sa = this.slopeAspect(c[0], c[1]);

                /* if slope of a point along linestring or polygon perimeter is 30-45 degrees, count it as an avalanche-able slope */
                if (sa.slope >= 30 && sa.slope <= 45) {
                    avy++;
                }

                /* calculate distance from point a to b, b to c, c to etc. */
                if (n > 0) {
                    distance += new Calculate().distance(c[0], c[1], lastCoords[0], lastCoords[1]);
                }

                /* create an array of values for linestring, or perimeter of polygon */
                el.push(parseFloat(calc.getElevation(c[1], c[0], 1)));
                slopes.push(sa.slope);
                aspects.push(sa.aspect);
                lastCoords = c;
            });

            /* if polygon, calculate avalanche statistics for the area of the polygon */
            if (type == 'Polygon') {
                let points = [],
                    ad = [],
                    counter = 0,
                    pol = turf.polygon([coords]),
                    grid = turf.pointGrid(turf.bbox(pol), 50, {
                        units: 'feet'
                    });

                grid.features.forEach((g) => {
                    if (turf.booleanPointInPolygon(g.geometry.coordinates, pol)) {
                        points.push(this.slopeAspect(g.geometry.coordinates[0], g.geometry.coordinates[1]));
                    }
                });

                points.forEach((p) => {
                    if (parseFloat(p.slope) >= 30 && parseFloat(p.slope) <= 45) {
                        counter++;
                    }

                    ad.push(calc.aspectDirection(p.aspect));
                });

                pavy = {
                    pctOfArea: counter / points.length,
                    aspect: this.counter(ad)
                };

                ret.area = {
                    area: turf.area(turf.polygon([coords])),
                    avy: pavy
                };
            }

            for (let i = 1; i < el.length; i++) {
                const x = i - 1;

                if (el[i] > el[x]) {
                    gain += el[i] - el[x];
                } else {
                    loss += el[i] - el[x];
                }
            }

            ret.points = coords.length;
            ret.distance = distance;
            ret.elevation = {
                computed: {
                    min: Math.min.apply(null, el),
                    avg: calc.average(el),
                    max: Math.max.apply(null, el)
                },
                height: {
                    gain: gain,
                    loss: loss
                },
                points: el
            };
            ret.slope = {
                min: Math.min.apply(null, slopes),
                avg: calc.average(slopes),
                max: Math.max.apply(null, slopes),
                avalanche: avy
            };
            ret.aspect = {
                all: aspects,
                avg: calc.average(aspects)
            };

            /*if (type == 'Polygon') {
                ret.area = {
                    area: turf.area(turf.polygon([coords])),
                    avy: pavy
                };
            }*/
        }

        return ret;
    }

    createFromUpload(file) {
        const fts = [];

        this.features.forEach(async (feat) => {
            const type = feat.geometry.type,
                name = feat.properties.name ? feat.properties.name : (type == 'Point' ? 'Waypoint' : (type == 'LineString' ? 'Track' : 'Polygon'));

            this.type = type;
            this.id = crypto.randomUUID().replaceAll('-', '');
            this.coords = feat.geometry.coordinates;

            let item = [
                ['id', this.id],
                ['name', name],
                ['type', type],
                ['coords', this.coords],
                ['stats', null],
                ['notes', ''],
                ['color', DEFAULT_COLOR],
                ['created', (feat.properties.time ? Math.round(new Date(feat.properties.time).getTime() / 1000) : this.now())],
                ['modified', this.now()]
            ],
                json = Object.fromEntries(item);

            fts.push(json);

            /* convert coords and stats array elements to string for data transport*/
            item[3] = [item[3][0], JSON.stringify(item[3][1])];
            item[4] = [item[4][0], JSON.stringify(item[4][1])];

            /* add file ID to the request */
            item.push(['fid', file.fid]);

            await api(host + 'api/v1/session/objects/create', item);
        });

        /* add new feature to user feature array */
        userUploadFeatures.unshift({
            fid: file.fid,
            fileName: file.name,
            file: file.file,
            type: file.type,
            size: file.size,
            features: fts
        });
    }

    async create() {
        let item = [
            ['id', this.id],
            ['name', this.name],
            ['type', this.type],
            ['coords', this.coords],
            ['stats', this.stats()],
            ['notes', ''],
            ['color', DEFAULT_COLOR],
            ['created', this.now()],
            ['modified', this.now()]
        ],
            json = Object.fromEntries(item);

        /* add new feature to user feature array */
        userFeatures.unshift(json);

        /* convert coords and stats array elements to string for data transport*/
        item[3] = [item[3][0], JSON.stringify(item[3][1])];
        item[4] = [item[4][0], JSON.stringify(item[4][1])];

        await api(host + 'api/v1/session/objects/create', item);

        modal.innerHTML = userContent;
        modal.style.display = 'flex';
        modal.querySelector('#a').innerHTML = 'My Content';
        const guc = new GetUserContent();
        guc.getDraw('features', true);
        guc.displayUploads(true);
    }

    syncUpdate(id) {
        let coords,
            stats,
            mod,
            store = document.querySelector('.user-tracks li[data-id="' + id + '"]').parentElement.classList.contains('uploads') ? 'uploads' : 'features';

        if (store == 'features') {
            userFeatures.forEach((f) => {
                if (f.id == id) {
                    coords = f.coords;
                    stats = f.stats;
                    mod = f.modified;
                }
            });
        } else {
            userUploadFeatures.forEach((g) => {
                g.features.forEach((f) => {
                    if (f.id == id) {
                        coords = f.coords;
                        stats = f.stats;
                        mod = f.modified;
                    }
                });
            });
        }

        this.save(id, mod, [['coords', JSON.stringify(coords)], ['stats', JSON.stringify(stats)]]);
    }

    update() {
        let stats = this.stats(),
            feat,
            mod = this.now(),
            coords = this.coords,
            parent = document.querySelector('.user-tracks li[data-id="' + this.id + '"]'),
            ol = parent.querySelector('ol'),
            store = parent.parentElement.classList.contains('uploads') ? 'uploads' : 'features';

        if (store == 'features') {
            userFeatures.forEach((f, n) => {
                if (f.id == this.id) {
                    userFeatures[n].coords = coords;
                    userFeatures[n].modified = mod;
                    userFeatures[n].stats = stats;

                    feat = userFeatures[n];
                }
            });
        } else {
            userUploadFeatures.forEach((g, m) => {
                g.features.forEach((f, n) => {
                    if (f.id == this.id) {
                        userUploadFeatures[m].features[n].coords = coords;
                        userUploadFeatures[m].features[n].modified = mod;
                        userUploadFeatures[m].features[n].stats = stats;

                        feat = userUploadFeatures[m].features[n];
                    }
                });
            });
        }

        parent.querySelector('.dt').innerHTML = 'Modified ' + timeAgo(mod);
        parent.querySelector('.dt').setAttribute('title', prettyDT(mod));

        ol.innerHTML = new GetUserContent(feat).getStats();
    }

    async delete(id) {
        await api(host + 'api/v1/session/objects/delete', [['id', id]]);
    }
}

class GetUserContent {
    constructor(f = null) {
        this.feature = f;
    }

    toggleFolder(fid) {
        userFolders.forEach((folder) => {
            if (fid == folder.id) {
                if (folder.items.length > 0) {
                    document.querySelector('.tab-content[data-tab=draw] ul.user-tracks li[data-id="' + folder.id + '"]').classList.toggle('folder-collapsed');

                    for (let i = 0; i < folder.items.length; i++) {
                        const item = document.querySelector('.tab-content[data-tab=draw] ul.user-tracks li[data-id="' + folder.items[i] + '"]');

                        item.classList.toggle('collapsed');
                    }
                }
            }
        });
    }

    makeDraggable() {
        let draggedItem = null,
            draggedID = null;

        document.querySelectorAll('.tab-content[data-tab=draw] ul.user-tracks > li').forEach((li) => {
            li.setAttribute('draggable', true);

            li.addEventListener('dragstart', (e) => {
                if (li.dataset.type === 'folder') {
                    e.preventDefault();
                    return;
                }

                draggedID = li.dataset.id;
                draggedItem = li;
                e.dataTransfer.setData('text/plain', '');
            });

            li.addEventListener('dragover', (e) => {
                e.preventDefault();

                if (li.dataset.type === 'folder') {
                    const data = isItem(e.target).dataset;

                    if (data.id && userFolders.some((f) => f.id === data.id && f.items.includes(draggedID))) {
                        e.preventDefault();
                    }
                }
            });

            li.addEventListener('drop', async (e) => {
                e.preventDefault();
                const data = isItem(e.target).dataset;

                if (data.type == 'folder') {
                    let curItems,
                        folderID = data.id,
                        fol = document.querySelector('.tab-content[data-tab=draw] ul.user-tracks li[data-id=' + folderID + ']'),
                        expfol = fol.querySelector('.expandFolder');

                    userFolders.forEach((f) => {
                        if (f.id == folderID) {
                            curItems = f.items;
                        }
                    });

                    /* item is already in this folder */
                    if (curItems.includes(draggedID)) {
                        notify('error', 'This item is already in that folder');
                    } else {
                        let allItems;

                        userFolders.forEach((f, n) => {
                            if (f.id == folderID) {
                                userFolders[n].modified = Math.round(new Date().getTime() / 1000);
                                userFolders[n].items.push(draggedID);

                                allItems = userFolders[n].items;
                            }
                        });

                        if (expfol == null) {
                            const c = '<div style="position:relative"><i class="fas fa-chevron-up expandFolder" title="Expand" style="color:#626262;cursor:pointer"></i></div>';
                            fol.querySelector('.h').insertAdjacentHTML('beforeend', c);
                        }

                        draggedItem.classList.add('in-folder');

                        await api(host + 'api/v1/session/folders/update', [
                            ['id', folderID],
                            ['items', JSON.stringify(allItems)],
                            ['modified', Math.round(new Date().getTime() / 1000)]
                        ]);

                        const parent = li.parentNode;
                        const nextSibling = e.target.nextSibling;

                        if (nextSibling) {
                            parent.insertBefore(draggedItem, nextSibling);
                        } else {
                            parent.appendChild(draggedItem);
                        }

                        if (fol.querySelector('.expandFolder').style.display == 'none') {
                            fol.querySelector('.expandFolder').style.display = 'block';

                            if (fol.querySelector('.expandFolder').getAttribute('title') == 'Expand') {
                                fol.querySelector('.expandFolder').setAttribute('title', 'Collapse');
                                fol.querySelector('.expandFolder').classList.add('fa-chevron-up');
                                fol.querySelector('.expandFolder').classList.remove('fa-chevron-down');
                            }
                        }
                    }
                } else {
                    let hasParentFolder = false;

                    userFolders.forEach((f) => {
                        if (f.items.includes(draggedID)) {
                            hasParentFolder = true;
                        }
                    });

                    /* remove from the parent folde r*/
                    if (hasParentFolder) {
                        userFolders.forEach(async (f) => {
                            if (f.items.includes(draggedID)) {
                                const folderIndex = userFolders.indexOf(f);
                                userFolders[folderIndex].items.splice(userFolders[folderIndex].items.indexOf(draggedID), 1);
                                userFolders[folderIndex].modified = Math.round(new Date().getTime() / 1000);

                                await api(host + 'api/v1/session/folders/update', [
                                    ['id', f.id],
                                    ['items', JSON.stringify(userFolders[folderIndex].items)],
                                    ['modified', Math.round(new Date().getTime() / 1000)]
                                ]);
                            }

                            /* if the folder doesn't have any items in it */
                            if (f.items.length == 0) {
                                const ef = document.querySelector('.tab-content[data-tab=draw] ul.user-tracks li[data-id="' + f.id + '"] .expandFolder');
                                ef.style.display = 'none';
                                ef.setAttribute('title', 'Expand');
                            }
                        });

                        if (draggedItem.classList.contains('last-in-folder')) {
                            draggedItem.classList.remove('last-in-folder');
                        } else {
                            draggedItem.classList.remove('in-folder');
                        }
                    }

                    let parent = li.parentNode/*,
                        nextSibling = e.target.nextSibling;

                    if (!nextSibling || nextSibling.parentNode !== parent) {
                        nextSibling = parent.lastChild;
                    }

                    if (nextSibling) {
                        parent.insertBefore(draggedItem, nextSibling);
                    } else {*/
                    parent.appendChild(draggedItem);
                    //}
                }

                draggedID = null;
                draggedItem = null;
                this.organize();
                this.toggleFolder(data.id);
            });

            /*li.addEventListener('dragleave', (e) => {
                if (isItem(e.target).dataset.type == 'folder') {
                    document.body.style.cursor = 'auto';
                }
            });

            li.addEventListener('dragend', () => {
                document.body.style.cursor = 'auto';
            });*/
        });
    }

    organize(expand = false) {
        userFolders.forEach((folder) => {
            if (folder.items != null && folder.items.length > 0) {
                folder.items.forEach((ea, n) => {
                    const item = document.querySelector('.tab-content[data-tab=draw] ul.user-tracks li[data-id="' + ea + '"]'),
                        source = document.querySelector('.tab-content[data-tab=draw] ul.user-tracks li[data-id="' + folder.id + '"]');

                    source.classList.add('has-data');

                    if (!expand) {
                        source.classList.add('folder-collapsed');
                        item.classList.add('collapsed');
                    }

                    if (n == 0) {
                        item.classList.add('last-in-folder');
                    } else {
                        item.classList.add('in-folder');
                    }

                    document.querySelector('.tab-content[data-tab=draw] ul.user-tracks').insertBefore(item, source.nextSibling);
                });
            }
        });
    }

    getFolders(expand) {
        if (userFolders != null && userFolders.length > 0) {
            userFolders.forEach((folder) => {
                let id = folder.id,
                    name = folder.name,
                    /*timestamp = (folder.created == folder.modified ? folder.created : folder.modified),
                    time = (folder.created == folder.modified ? 'Created' : 'Modified') + ' ' + timeAgo(timestamp),*/
                    add = '<div class="trk"><div class="h" style="align-items:center"><div class="p"><i class="fad fa-folders" style="width:20px;font-size:20px;color:#ffce45"></i>' +
                        '<div class="j"><h6 class="title"><span style="display: block">' + name + '</span><input type="text" id="' + id + '" placeholder="Folder name..." value="' + name + '" style="display:none">' +
                        '<div class="controls" data-id="' + id + '"><span class="fas fa-check saveFolder" data-type="folder" style="display:none;margin-right:1em" title="Save Folder"></span>' +
                        '<span class="far fa-pen editFolder" title="Rename this folder"></span><span class="fas fa-trash deleteFolder" data-type="folder" title="Delete folder"></span></div></h6>' +
                        '<span class="dt" title="' + prettyDT(folder.created) + '">Created ' + timeAgo(folder.created) + '</span></div></div>' + (folder.items != null && folder.items.length > 0 ? '<div style="position:relative">' +
                            '<i class="fas fa-chevron-' + (expand ? 'down' : 'up') + ' expandFolder" title="' + (expand ? 'Collapse' : 'Expand') + '" style="color:#626262;cursor:pointer"></i></div>' : '') + '</div></div>';

                const li = document.createElement('li');
                li.setAttribute('data-type', 'folder');
                li.setAttribute('data-id', id);
                li.innerHTML = add;

                document.querySelector('.tab-content[data-tab=draw] ul.user-tracks').prepend(li);
            });

            this.organize(expand);
            this.makeDraggable();
        }
    }

    colorChooser(sel, st) {
        let colors = '<div class="colors" data-store="' + st + '">';

        colorOptions.forEach((c) => {
            colors += '<div class="clr' + (sel == c.name ? ' selected' : '') + '" title="' +
                ucwords(c.name) + '" data-color="' + c.name + '" style="background-color:' + c.value + '"></div>';
        });

        return colors + '</div>';
    }

    getDraw(storeName = 'features', expanded = false) {
        let app = (storeName == 'features' ? userFeatures : userUploadFeatures),
            mbDraw = document.querySelector('.tab-content[data-tab=' + (storeName == 'features' ? 'draw' : 'uploads') + ']'),
            content = '';

        if (app == null || app == '') {
            mbDraw.innerHTML = '<p style="text-align:center">' + missingIcon +
                (storeName == 'features' ? 'You currently don\'t have any waypoints, tracks, or polygons.' : 'You haven\'t uploaded any content yet. ' +
                    '<a href="#" onclick="upload();return false" class="btn btn-sm btn-orange" style="display:block;margin-bottom:0">Upload a file</a>') + '</p>';
        } else {
            if (modal.style.display != 'none') {
                let exportable,
                    fids = [],
                    json = app,
                    recent = [],
                    file = null,
                    all = Draw.getAll();

                if (all != null && all.features.length > 0) {
                    all.features.forEach((f) => {
                        recent.push(f.id);
                    });
                }

                if (storeName == 'features') {
                    exportable = '<div><a href="#" id="newFolder" class="btn btn-black btn-sm" style="margin:0" onclick="return false"><i class="fas fa-folder"></i>New Folder</a>' +
                        '<a href="#" class="btn btn-yellow btn-sm exportAllFeatures" style="margin:0" data-mode="all" data-store="' + storeName +
                        '" title="Export all of your content" onclick="return false"><i class="far fa-file-export"></i>Export all</a></div></div>';
                } else {
                    exportable = '<div><a href="#" class="btn btn-black btn-sm" style="margin:0" id="uploadFromContent" onclick="return false"><i class="far fa-upload"></i>Upload</a>' +
                        '<a href="#" class="btn btn-yellow btn-sm exportAllFeatures" style="margin:0" data-mode="all" data-store="' + storeName +
                        '" title="Download your uploads as one file" onclick="return false"><i class="fas fa-file-arrow-down"></i>Download all</a></div></div>';
                }

                for (let x = 0; x < (storeName == 'features' ? 1 : userUploadFeatures.length); x++) {
                    if (storeName != 'features') {
                        file = userUploadFeatures[x];
                        json = file.features;
                    }

                    for (let i = 0; i < json.length; i++) {
                        this.feature = json[i];

                        const id = json[i].id,
                            type = json[i].type,
                            ptype = (type == 'LineString' ? 'Track' : (type == 'Point' ? 'Waypoint' : (type == 'MultiPolygon' ? 'Multi-Polygon' : type))),
                            icon = (type == 'Point' ? 'fas fa-location-dot' : (type == 'LineString' ? 'far fa-route' : 'fad fa-draw-polygon')),
                            name = json[i].name,
                            notes = json[i].notes,
                            color = json[i].color ? json[i].color : DEFAULT_COLOR,
                            timestamp = (json[i].created == json[i].modified ? json[i].created : json[i].modified),
                            time = (json[i].created == json[i].modified ? (storeName == 'features' ? 'Creat' : 'Upload') + 'ed' : 'Modified') + ' ' + timeAgo(timestamp);

                        /* stats content */
                        let showStats = (json[i].stats == null ? '<span class="gentext">This file doesn\'t have any statistics. Do you want to generate them?</span>' +
                            '<a href="#" class="btn centered btn-sm btn-orange generateStats" style="margin:0 auto" title="Generate statistics for this ' + ptype.toLowerCase() + '" data-id="' + id + '">Generate Stats</a></ol>' :
                            this.getStats() + '</ol>' + (type == 'LineString' && this.feature.stats.aspect.avg != null || type == 'Polygon' && this.feature.stats.area != null ? slopeRose.replace('{{slopeRoseID}}', id) : ''));

                        /* create controls for each geojson feature */
                        const controls = '<div class="controls" data-id="' + id + '"><span class="fas fa-check saveFeature" data-type="' + storeName + '" style="display:none;margin-right:1em" title="Save ' + ptype + '"></span>' +
                            '<span class="far fa-pen editFeature" title="Edit ' + ptype + '"></span>' +
                            (type == 'LineString' ? '<span class="fas fa-chart-area chartFeature" data-type="' + storeName + '" title="Show elevation profile"></span>' : '') +
                            '<span class="fas fa-download exportFeature" data-store="' + storeName + '" data-mode="single" title="Export this ' + ptype.toLowerCase() + '"></span>' +
                            '<span class="fas fa-trash deleteFeature" data-store="' + storeName + '" data-type="' + ptype.toLowerCase() + '" title="Delete this ' + ptype.toLowerCase() + '"></span></div>';

                        /* add header for features within an uploaded feature collection folder */
                        if (file != null) {
                            if (!fids.includes(file.fid)) {
                                content += '<h3 class="fileName" data-id="' + file.fid + '"><i class="fad fa-folders" style="width:20px;font-size:20px;color:#ffce45"></i><span>' + file.fileName + '</span>' +
                                    '<span class="badge" title="This is a ' + (file.type.search('json') >= 0 ? 'geojson' : file.type) + ' file">' + (file.type.search('json') >= 0 ? 'geojson' : file.type) + '</span></h3>';
                            }

                            fids.push(file.fid);
                        }

                        /* create HTML list for feature display */
                        content += '<li data-type="item" ' + (storeName != 'features' ? 'class="in-folder" ' : '') + 'data-id="' + id + '"' + (type == 'LineString' || type == 'Polygon' ? ' data-points="' + (json[i].stats && json[i].stats.points ? json[i].stats.points : '') + '" data-aspect="' +
                            ((type == 'LineString' && this.feature.stats.aspect != null) || (type == 'Polygon' && this.feature.stats.area != null) ? this.slopeRose() : '') + '"' : '') + '>' +
                            '<div class="trk"><div class="h"><div class="p"><i class="' + icon + '" title="' + ptype + '" style="width:20px;font-size:20px;color:#676989"></i>' +
                            '<div class="j"><h6 class="title"><span>' + name + '</span><input type="text" id="' + id + '" placeholder="Name..." value="' + name + '">' + controls + '</h6>' +
                            '<span class="dt" title="' + prettyDT(timestamp) + '">' + ptype + ' &middot; ' + time + '</span></div></div>' +
                            '<div class="checkbox"><input type="checkbox" class="toggleUF" title="Toggle visibility" data-type="' + storeName + '" data-id="' + id + '"' + (recent.includes(id) ? ' checked' : '') + '></div></div>' +
                            '<div id="ts"' + (recent.includes(id) ? ' style="display:block"' : '') + '>' +
                            this.colorChooser(color, storeName) + '<textarea id="notes-' + id + '" placeholder="' + (name ? name : ptype) + ' notes...">' + (notes ? notes : '') + '</textarea>' +
                            '<a href="#" class="btn btn-sm btn-blue saveNotes"  data-type="' + storeName + '" data-id="' + id + '" style="display:block;margin:0 0 0.5em auto;font-size:12px" onclick="return false">Save</a>' +
                            '<ol>' + showStats + '</div></div></li>';
                    }
                }

                const syncTime = localStorage.getItem('mt-lastSync');

                mbDraw.innerHTML = '<div class="user-content-head"><p id="synced"><i class="fas fa-cloud-arrow-up" style="font-size:15px"></i>' +
                    '<span title="' + prettyDT(syncTime) + '">Last synced ' + (syncTime != null ? timeAgo(syncTime) : 'never') + '</span></p>' +
                    exportable + '<ul class="user-tracks' + (storeName != 'features' ? ' uploads' : '') + '">' + content + '</ul>';

                if (storeName == 'features') {
                    this.getFolders(expanded);
                }
                this.drawSlopeRose();
            }
        }
    }

    displayUploads(expanded = false) {
        this.getDraw('uploads', expanded);
    }

    slopeRose() {
        let dirs = [],
            counter = {};

        if (this.feature.type == 'Polygon') {
            if (this.feature.stats.area.avy) {
                this.feature.stats.area.avy.aspect.forEach((e) => {
                    counter[e.value] = e.count;
                });

                return JSON.stringify(counter).replaceAll('"', '\'');
            } else {
                return null;
            }
        } else {
            if (this.feature.stats.aspect.all) {
                this.feature.stats.aspect.all.forEach((e) => {
                    dirs.push(new Calculate().aspectDirection(e));
                });

                dirs.forEach(ele => {
                    if (counter[ele]) {
                        counter[ele] += 1;
                    } else {
                        counter[ele] = 1;
                    }
                });

                return JSON.stringify(counter).replaceAll('"', '\'');
            } else {
                return null;
            }
        }
    }

    drawSlopeRose() {
        document.querySelectorAll('.user-tracks svg[id^=sr-]').forEach((sr) => {
            const par = sr.parentElement.parentElement.parentElement,
                total = par.getAttribute('data-points'),
                data = JSON.parse(par.getAttribute('data-aspect').replaceAll('\'', '"')),
                arr = [];
            if (par.getAttribute('data-aspect')) {
                sr.remove();
            } else {
                if (data) {
                    /* calculate the percent of this slope compared to the total and that's the opacity we'll use to fill in the svg paths*/
                    Object.keys(data).forEach((e) => {
                        arr[bearings[e].toLowerCase()] = (data[e] / total * 100).toFixed(3);
                    });

                    Object.keys(arr).forEach((p) => {
                        sr.querySelectorAll('path').forEach((path) => {
                            if (path.getAttribute('data-id').search(p + ' ') >= 0) {
                                path.style.fill = 'rgba(241, 143, 1, ' + arr[p] + '%)';
                                path.querySelector('title').textContent = ucfirst(p);
                            }
                        });
                    });
                }
            }
        });
    }

    /* return statistics of geometries drawn on the map */
    statistics(data) {
        if (data == null) {
            return null;
        } else {
            return {
                distance: () => {
                    return {
                        raw: () => {
                            return data.distance;
                        },
                        unit: () => {
                            if (data.distance == null) {
                                return null;
                            } else {
                                return data.distance < 1 ? ' ft.' : ' mi';
                            }
                        },
                        formatted: () => {
                            if (data.distance == null) {
                                return null;
                            } else {
                                if (data.distance < 1) {
                                    return numberFormat(data.distance * 5280, 1);
                                } else {
                                    return numberFormat(data.distance, (data.distance > 5 ? 1 : 2));
                                }
                            }
                        }
                    }
                },
                area: () => {
                    return {
                        area: () => {
                            return data.area.area ? data.area.area : null;
                        },
                        avalanche: () => {
                            const avy = data.area.avy;

                            return {
                                pctOfArea: () => {
                                    return avy ? avy.pctOfArea : null;
                                },
                                aspects: () => {
                                    return avy ? avy.aspect : null;
                                },
                                top3: () => {
                                    if (avy) {
                                        let sum = 0,
                                            asp = [];

                                        avy.aspect.forEach((e) => {
                                            sum += e.count;
                                        });

                                        for (let i = 0; i < 3; i++) {
                                            asp.push({
                                                dir: avy.aspect[i].value,
                                                pct: avy.aspect[i].count / sum
                                            });
                                        }

                                        return asp;
                                    } else {
                                        return null;
                                    }
                                }
                            };
                        }
                    }
                },
                points: () => {
                    return data.points;
                },
                shapes: () => {
                    return data.shapes;
                },
                elevation: () => {
                    const elevation = data.elevation;

                    return {
                        raw: () => {
                            return elevation;
                        },
                        height: () => {
                            const height = elevation.height;

                            return {
                                gain: () => {
                                    return height.gain;
                                },
                                loss: () => {
                                    return height.loss;
                                }
                            }
                        },
                        computed: () => {
                            return {
                                min: () => {
                                    return elevation == null ? null : elevation.computed.min;
                                },
                                avg: () => {
                                    return elevation == null ? null : elevation.computed.avg;
                                },
                                max: () => {
                                    return elevation == null ? null : elevation.computed.max;
                                }
                            }
                        }
                    }
                },
                slope: () => {
                    const slope = data.slope;

                    return {
                        raw: () => {
                            return slope;
                        },
                        min: () => {
                            return slope.min;
                        },
                        avg: () => {
                            return slope.avg;
                        },
                        max: () => {
                            return slope.max;
                        },
                        avalanche: () => {
                            return slope.avalanche;
                        }
                    }
                },
                aspect: () => {
                    const aspect = data.aspect;

                    return {
                        raw: () => {
                            return aspect;
                        },
                        min: () => {
                            return aspect.min;
                        },
                        avg: () => {
                            return aspect.avg;
                        },
                        max: () => {
                            return aspect.max;
                        }
                    }
                }
            }
        }
    }

    getFeature(feature) {
        return {
            stats: feature.stats,
            type: () => {
                return feature.type;
            },
            coords: () => {
                return feature.coords;
            },
            pointLat: (round = false) => {
                return round ? feature.coords[1].toFixed(4) : feature.coords[1];
            },
            pointLon: (round = false) => {
                return round ? feature.coords[0].toFixed(4) : feature.coords[0];
            }
        };
    }

    getStats() {
        let feat = this.getFeature(this.feature),
            stats = this.statistics(feat.stats),
            calc = new Calculate(),
            s = '';

        if (stats != null) {
            let dist = stats.distance().formatted() + stats.distance().unit(),
                distKM = numberFormat(stats.distance().raw() < 1 ? calc.ftToM(stats.distance().raw() * 5280) : calc.miToKm(stats.distance().raw()), 2);

            if (feat.type() == 'LineString') {
                s += '<li><div class="w">Distance</div><div class="v" title="' + distKM + (stats.distance().raw() >= 1 ? 'k' : '') + 'm">' + dist + '</div></li>' +
                    '<li><div class="w">Avalanche Slopes<i class="fas fa-circle-question" id="helper" data-info="avy slopes"></i></div><div class="v">' + (stats.slope().avalanche() == 0 ? 'None' : stats.slope().avalanche()) + '</div></li>{{elev}}';

                /* elevation gain */
                if (stats.elevation().height().gain() != null) {
                    s += '<li><div class="w">Elevation Gain</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation().height().gain()), 1) + ' m">' +
                        numberFormat(stats.elevation().height().gain(), 1) + ' ft.</div></li>';
                }

                /* elevation loss */
                if (stats.elevation().height().loss() != null) {
                    s += '<li><div class="w">Elevation Loss</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation().height().loss()), 1) + ' m">' +
                        numberFormat(stats.elevation().height().loss(), 1) + ' ft.</div></li>';
                }

                /* min slope */
                if (stats.slope().min() && stats.slope().max()) {
                    s += '<li><div class="w">Slope Range</div><div class="v" title="' + calc.deg2pct(stats.slope().min()).toFixed(1) + '%-' + calc.deg2pct(stats.slope().max()).toFixed(1) + '%">' +
                        stats.slope().min().toFixed(1) + '-' + stats.slope().max().toFixed(1) + '&deg;</div></li>';
                }

                /* average slope */
                if (stats.slope().avg()) {
                    s += '<li><div class="w">Average Slope</div><div class="v">' + Math.round(stats.slope().avg()) + '&deg;</div></li>';
                }

                /* average aspect */
                if (stats.aspect().avg()) {
                    s += '<li><div class="w">Average Aspect</div><div class="v">' + calc.getCompassDirection(stats.aspect().avg()) + '</div></li>';
                }

            } else if (feat.type() == 'Polygon') {
                let pa = '',
                    top = stats.area().avalanche().top3();

                if (top != null) {
                    top.forEach((p) => {
                        pa += '<div><span style="font-weight:600">' + Math.round(p.pct * 100) + '% is</span> ' + p.dir + '</div>';
                    });
                }

                s += '<li><div class="w">Area</div><div class="v" title="' + calc.sqmiToAcres(stats.area().area()) + ' acres">' + numberFormat(stats.area().area() * 3.861E-7, 2) + ' sq. mi.</div></li>' +
                    '<li><div class="w">Perimeter</div><div class="v">' + dist + '</div></li>{{elev}}' +
                    '<li><div class="w">Avalanche Terrain<i class="fas fa-circle-question" id="helper" data-info="avy terrain"></i></div><div class="v">' + Math.round(stats.area().avalanche().pctOfArea() * 100) + '%</div></li>' +
                    '<li><div class="w">Predominate Aspects<i class="fas fa-circle-question" id="helper" data-info="predom"></i></div><div class="v" style="text-align:right"><div style="display:inline-flex;gap:4px;flex-direction:column">' + (pa == '' ? 'N/A' : pa) + '</div></div></li>' +
                    '<li><div class="w">Points</div><div class="v">' + numberFormat(stats.points()) + '</div></li>';

            } else if (feat.type() == 'MultiPolygon') {
                s += '<li><div class="w">Area</div><div class="v" title="' + calc.sqmiToAcres(stats.area().area()) + ' acres">' + numberFormat(stats.area().area() * 3.861E-7, 2) + ' sq. mi.</div></li>' +
                    '<li><div class="w">Shapes<i class="fas fa-circle-question" id="helper" data-info="shapes"></i></div><div class="v">' + numberFormat(stats.shapes()) + '</div></li>' +
                    '<li><div class="w">Points</div><div class="v">' + numberFormat(stats.points()) + '</div></li>';
            }

            if (feat.type() == 'Point') {
                const compass = calc.getCompassDirection(stats.aspect().raw());

                s += '<li><div class="w">Coordinates</div><div class="v">' + feat.pointLat(true) + ', ' + feat.pointLon(true) + copyData.replace('{content}', feat.pointLat() + ', ' + feat.pointLon()) + '</div></li>' +
                    '<li><div class="w">Elevation</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation()), 1) + ' m">' + numberFormat(stats.elevation().raw(), 1) + ' ft.</div></li>' +
                    '<li><div class="w">Slope</div><div class="v" title="' + calc.deg2pct(stats.slope().raw()) + '%">' + Math.round(stats.slope().raw()) + '&deg;</div></li>' +
                    '<li><div class="w">Avalanche Terrain<i class="fas fa-circle-question" id="helper" data-info="avyable"></i></div><div class="v">' + (stats.slope().raw() >= 30 && stats.slope().raw() <= 45 ? 'Yes' : 'No') + '</div></li>' +
                    '<li><div class="w">Aspect</div><div class="v" title="' + bearings[compass] + ' / ' + Math.round(stats.aspect().raw()) + '°">' + compass + '</div></li>';
            } else {
                let fresh = '';

                /* maximum elevation */
                if (stats.elevation().computed().max()) {
                    fresh += '<li><div class="w">Max' + (feat.type() == 'Polygon' ? '. Perimeter' : 'imum') + ' Elevation</div>' +
                        '<div class="v" title="' + numberFormat(calc.ftToM(stats.elevation().computed().max()), 1) + ' m">' + numberFormat(stats.elevation().computed().max(), 1) + ' ft.</div></li>';
                }

                /* minimum elevation */
                if (stats.elevation().computed().min()) {
                    fresh += '<li><div class="w">Min' + (feat.type() == 'Polygon' ? '. Perimeter' : 'imum') + ' Elevation</div>' +
                        '<div class="v" title="' + numberFormat(calc.ftToM(stats.elevation().computed().min()), 1) + ' m">' + numberFormat(stats.elevation().computed().min(), 1) + ' ft.</div></li>';
                }

                s = s.replace('{{elev}}', fresh);
            }
        }

        return s;
    }
}