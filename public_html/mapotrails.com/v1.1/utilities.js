let SYNC_REMINDER = 30, /* ==> time in minutes */
    copyToCB = '<span class="copyData fas fa-copy" title="Copy to clipboard"></span>',
    slopeRose = '<svg data-v-0b6c2a78="" id="sr-{{slopeRoseID}}" width="150px" height="150px" viewBox="0 0 1050 1050" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" class="rose-svg" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round; stroke-miterlimit: 1.5;"><path data-v-0b6c2a78="" data-id="north upper" d="M529.716,527l68.371,-166.7l-138.1,0l69.729,166.7Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="north middle" d="M666.581,193.63l-277.081,0l69.27,166.67l138.541,0l69.27,-166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="north lower" d="M734.1,26.997l-414.2,0l69.943,166.67l275.865,0l68.392,-166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northeast upper" d="M529.716,527l166.22,-69.529l-97.651,-97.652l-68.569,167.181Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northeast middle" d="M862.222,388.05l-195.925,-195.926l-68.873,166.835l97.963,97.963l166.835,-68.872Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northeast lower" d="M1027.79,317.966l-292.884,-292.884l-68.396,167.311l195.066,195.066l166.214,-69.493Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="east upper" d="M527.716,528.339l166.7,68.371l0,-138.1l-166.7,69.729Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="east middle" d="M861.086,665.204l0,-277.081l-166.67,69.27l0,138.541l166.67,69.27Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="east lower" d="M1027.72,732.723l0,-414.2l-166.67,69.943l0,275.865l166.67,68.392Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southeast upper" d="M527.716,528.339l69.529,166.22l97.652,-97.651l-167.181,-68.569Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southeast middle" d="M666.666,860.845l195.926,-195.925l-166.835,-68.872l-97.963,97.962l68.872,166.835Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southeast lower" d="M736.75,1026.42l292.884,-292.884l-167.311,-68.396l-195.066,195.066l69.493,166.214Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="south upper" d="M527.918,528.416l-68.371,166.7l138.1,0l-69.729,-166.7Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="south middle" d="M391.053,861.786l277.081,0l-69.27,-166.67l-138.541,0l-69.27,166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="south lower" d="M323.534,1028.42l414.2,0l-69.943,-166.67l-275.865,0l-68.392,166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southwest upper" d="M527.918,528.416l-166.22,69.529l97.651,97.652l68.569,-167.181Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southwest middle" d="M195.412,667.366l195.926,195.926l68.872,-166.835l-97.963,-97.963l-166.835,68.872Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southwest lower" d="M29.841,737.451l292.884,292.883l68.396,-167.31l-195.066,-195.067l-166.214,69.494Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="west upper" d="M528.918,527.077l-166.7,-68.371l0,138.1l166.7,-69.729Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="west middle" d="M195.548,390.212l0,277.081l166.67,-69.27l0,-138.541l-166.67,-69.27Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="west lower" d="M28.915,322.693l0,414.2l166.67,-69.943l0,-275.865l-166.67,-68.392Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northwest upper" d="M529.918,527.077l-69.529,-166.22l-97.652,97.651l167.181,68.569Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northwest middle" d="M390.968,194.571l-195.926,195.926l166.835,68.872l97.963,-97.963l-68.872,-166.835Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northwest lower" d="M318.884,27l-292.884,292.884l167.311,68.396l195.066,-195.066l-69.493,-166.214Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path></svg>';

const getScript = url => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onerror = reject;

    script.onload = script.onreadystatechange = function () {
        const loadState = this.readyState;

        if (loadState && loadState !== 'loaded' && loadState !== 'complete') {
            return script.onload = script.onreadystatechange = null;
        }

        resolve();
    };

    document.head.appendChild(script);
});

function avySafety(e) {
    var c = (e < 20 ? 'var(--gray)' : (e >= 20 && e < 30 ? '#07c907' : (e >= 30 && e < 45 ? 'var(--red)' : (e >= 45 && e < 55 ? 'yellow' : '#07c907')))),
        s;

    if (e < 1) {
        s = 'Avalanches cannot slide on 0&deg; slopes';
    } else if (e >= 1 && e < 25) {
        s = 'Avalanches unlikely at this slope';
    } else if (e >= 25 && e < 30) {
        s = 'Slab avalanches very unlikely, but not impossible';
    } else if (e >= 30 && e < 34) {
        s = 'Slab avalanches likely only in very unstable conditions';
    } else if (e >= 34 && e < 45) {
        s = 'Slab avalanches highly likely at this slope';
    } else if (e >= 45 && e < 55) {
        s = 'Avalanches unlikely, but small slabs and sluffs possible';
    } else {
        s = 'Avalanches unlikely; frequent sluffing';
    }

    return '<div class="avy-terrain" title="' + s + '" style="background-color:' + c + '"></div>';
}

function assignLayerID() {
    var dt = new Date(),
        m = (((dt.getMonth() + 1) < 10 ? '0' : '') + (dt.getMonth() + 1)).toString(),
        d = ((dt.getDate() < 10 ? '0' : '') + dt.getDate()).toString(),
        h = ((dt.getHours() < 10 ? '0' : '') + dt.getHours()).toString(),
        mi = ((dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes()).toString(),
        s = ((dt.getSeconds() < 10 ? '0' : '') + dt.getSeconds()).toString();

    return dt.getFullYear() + m + d + h + mi + s + '-' + Math.floor(Math.random() * (100000 - 0 + 1) + 0)
}

function downloadFile(json, fileName, ext) {
    let file = document.createElement('a');
    file.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(json)));
    file.setAttribute('download', fileName.toLowerCase().replaceAll(' ', '_') + '.' + ext);

    file.style.display = 'none';
    document.body.appendChild(file);
    file.click();
    document.body.removeChild(file);
}

/*class DoStats {
    constructor(src, type) {
        this.src = src;
        this.type = type;
    }

    get geoJSON() {
        return this.geoJsonStats();
    }

    get topoLayer() {
        return this.topoStats();
    }

    geoJsonStats() {
        let coords = this.src.coordinates,
            dist = 0,
            gain = 0,
            loss = 0;

        for (let i = 0; i < coords.length; i++) {
            const z = i + 1;

            if (z < coords.length) {
                dist += new Calculate().distance(coords[i][1], coords[i][0], coords[z][1], coords[z][0]);

                if (coords[0].length == 3) {
                    gain += (coords[z][2] >= coords[i][2] ? coords[z][2] - coords[i][2] : 0);
                    loss += (coords[z][2] < coords[i][2] ? coords[z][2] - coords[i][2] : 0);
                }
            }
        }

        return {
            distance: dist,
            gain: gain,
            loss: loss
        }
    }

    topoStats() {
        return this.src;
    }
}*/

async function parseTrack(files, single, ofid = null) {
    const temp = localStorage.getItem(files.file);

    /* if the file hasn't been loaded before */
    if (temp == null || files.modify * 1000 > new Date().getTime()) {
        await fetch(host + 'api/v1/upload/retreive?key=' + key + '&fid=' + btoa(files.file))
            .then(async (f) => {
                const content = await f.text();

                localStorage.setItem(files.file, content);

                addTrack(files, single, ofid, content);
            });
    } else {
        addTrack(files, single, ofid, temp);
    }
}

async function addTrack(files, single, ofid, resp) {
    let fid = files.fid,
        name = files.name,
        file = files.file,
        create = files.create,
        modify = files.modify,
        type = file.split('.')[1],
        data,
        colors = ['cb2626', '40d740', 'ff973a', 'ebeb2e', 'f977dd', '6daee3', '9873f0'];

    /* determine file type and convert it all to geojson */
    if (type == 'geojson') {
        data = JSON.parse(resp);
    } else {
        const xmlDoc = (new DOMParser()).parseFromString(resp, 'text/xml');

        if (type == 'gpx') {
            data = toGeoJSON.gpx(xmlDoc);
        } else if (type == 'kml') {
            data = toGeoJSON.kml(xmlDoc);
        }
    }

    let track = '<li><div class="title"><div class="a"><input type="text" name="fileName" placeholder="New file name" value="' + name + '" style="display:none" data-fid="' + fid + '">' +
        '<span data-name-fid="' + fid + '">' + name + '</span><i class="far fa-pen" id="editFileName" data-fid="' + fid + '" title="edit name"></i></div>' +
        '<span class="b" title="Uploaded ' + timeAgo(create) + '">' + prettyTime(create) + '</span></div><div class="selectGroup"><div class="checkbox">' +
        '<label for="selectGroup" style="padding:0 10px 0 0">Select group</label><input type="checkbox" id="selectGroup" data-tid="' + create + '"></div></div>';

    /* likely if the file uploaded was a GEOJSON file and has multiple features */
    if (data.features) {
        for (let i = 0; i < data.features.length; i++) {
            var frame = data.features[i],
                prop = frame.properties,
                geo = frame.geometry,
                ts = '<div id="ts" data-tid="' + create + '" data-c="' + i + '"' + (fid == ofid ? ' style="display:block"' : '') + '>';

            /* if feature type is a polyline */
            if (geo.type == 'LineString') {
                var stats = doStats(geo);

                if (stats.length > 0) {
                    var deg1 = (Math.atan(stats[5] / 100) * (180.0 / Math.PI)).toFixed(1) + '&deg;',
                        deg2 = (Math.atan(stats[6] / 100) * (180.0 / Math.PI)).toFixed(1) + '&deg;';

                    ts += '<ol>' +
                        '<li><div class="w">Distance</div><div class="v">' + numberFormat(stats[0]) + ' mi' + copyToCB + '</div></li>' +
                        (stats[1] != undefined ? '<li><div class="w">Maximum Altitude</div><div class="v">' + numberFormat(stats[1]) + ' ft.</div></li>' : '') +
                        (stats[2] != undefined ? '<li><div class="w">Minimum Altitude</div><div class="v">' + numberFormat(stats[2]) + ' ft.</div></li>' : '') +
                        (stats[3] != undefined ? '<li><div class="w">Elevation Gain</div><div class="v">' + numberFormat(stats[3]) + ' ft.</div></li>' : '') +
                        (stats[4] != undefined ? '<li><div class="w">Elevation Loss</div><div class="v">' + numberFormat(stats[4]) + ' ft.</div></li>' : '') +
                        (stats[5] != undefined ? '<li><div class="w">Maximum Trail Slope</div><div class="v">' + stats[5] + '%&nbsp;/&nbsp;' + deg1 + '</div></li>' : '') +
                        (stats[6] != undefined ? '<li><div class="w">Average Trail Slope</div><div class="v">' + stats[6] + '%&nbsp;/&nbsp;' + deg2 + '</div></li>' : '') +
                        '</ol>';
                }
            } else if (geo.type == 'Polygon') {
                var tmpArr = [];

                for (let z = 0; z < geo.coordinates[0].length - 1; z++) {
                    tmpArr.push({
                        lat: geo.coordinates[0][z][1],
                        lng: geo.coordinates[0][z][0]
                    });
                }

                var stats = [new Calculate().calculateArea(tmpArr)];

                ts += '<ol><li><div class="w">Area</div><div class="v" title="' + new Calculate().toAcres(stats[0]) + ' acres">' + stats[0] + ' sq. mi.' + copyToCB + '</div></li>' +
                    '<li><div class="w">Perimeter</div><div class="v">' + new Calculate().perimeter(tmpArr) + ' mi.</div></li>' +
                    '<li><div class="w">Points</div><div class="v">' + (geo.coordinates[0].length - 1) + '</div></li></ol>';
            } else {
                var pc = numberFormat(geo.coordinates[1], 4) + ', ' + numberFormat(geo.coordinates[0], 4);
                ts += '<ol><li><div class="w">Coordinates</div><div class="v">' + pc + copyToCB + '</div></li></ol>';
            }

            /* assign an ID to each feature */
            prop.id = i;

            /* parse track data for DOM */
            track += '<div class="trk"><div class="h"><div class="j">' + uTi(geo.type) + '<div class="d"><div>' +
                (prop.name ? prop.name : 'Untitled ' + (geo.type == 'LineString' ? 'Track' : geo.type)) +
                (geo.type == 'LineString' ? '<span class="fas fa-chart-area" onclick="drawChart(\'upload\', \'' + create + '\', ' + i + ')"></span>' : '') +
                '</div><span class="ab">' + (geo.type == 'LineString' ? 'Track' : geo.type) +
                (stats && geo.type != 'Point' ? ' &middot; ' + stats[0] + (geo.type == 'Polygon' ? ' sq.' : '') + ' mi.' : '') + '</span></div>' +
                '</div><div class="checkbox"><input type="checkbox" id="gtust" data-tid="' + create + '" data-c="' + i + '"' + (fid == ofid ? ' checked' : '') + '></div></div>' + ts + '</div></div>';
        }
    } else {
        /* if feature type is a polyline */
        if (data[0].geometry.type == 'LineString') {
            var ts = '<div id="ts" data-tid="' + create + '" data-c="0">',
                stats = doStats(data[0].geometry);

            if (stats.length > 0) {
                var deg1 = (Math.atan(stats[5] / 100) * (180.0 / Math.PI)).toFixed(1) + '&deg;',
                    deg2 = (Math.atan(stats[6] / 100) * (180.0 / Math.PI)).toFixed(1) + '&deg;';

                ts += '<ol>' +
                    '<li><div class="w">Distance</div><div class="v">' + numberFormat(stats[0]) + ' mi</div></li>' +
                    (stats[1] != undefined ? '<li><div class="w">Maximum Altitude</div><div class="v">' + numberFormat(stats[1]) + ' ft.</div></li>' : '') +
                    (stats[2] != undefined ? '<li><div class="w">Minimum Altitude</div><div class="v">' + numberFormat(stats[2]) + ' ft.</div></li>' : '') +
                    (stats[3] != undefined ? '<li><div class="w">Elevation Gain</div><div class="v">' + numberFormat(stats[3]) + ' ft.</div></li>' : '') +
                    (stats[4] != undefined ? '<li><div class="w">Elevation Loss</div><div class="v">' + numberFormat(stats[4]) + ' ft.</div></li>' : '') +
                    (stats[5] != undefined ? '<li><div class="w">Maximum Trail Slope</div><div class="v">' + stats[5] + '% / ' + deg1 + '</div></li>' : '') +
                    (stats[6] != undefined ? '<li><div class="w">Average Trail Slope</div><div class="v">' + stats[6] + '% / ' + deg2 + '</div></li>' : '') +
                    '</ol>';
            }
        } else if (data[0].geometry.type == 'Polygon') {
            var tmpArr = [];

            for (let z = 0; z < data[0].geometry.coordinates[0].length - 1; z++) {
                tmpArr.push({
                    lat: data[0].geometry.coordinates[0][z][1],
                    lng: data[0].geometry.coordinates[0][z][0]
                });
            }

            var stats = [new Calculate().calculateArea(tmpArr)];

            ts += '<ol><li><div class="w">Area</div><div class="v">' + numberFormat(stats[0]) + ' sq. mi.</div></li>' +
                '<li><div class="w">Points</div><div class="v">' + (data[0].geometry.coordinates[0].length - 1) + '</div></li></ol>';
        } else {
            var pc = numberFormat(data[0].geometry.coordinates[1].toFixed(4)) + ', ' + numberFormat(data[0].geometry.coordinates[0].toFixed(4));
            ts += '<ol><li><div class="w">Coordinates</div><div class="v">' + pc + copyToCB + '</div></li></ol>';
        }

        /* assign an ID to the feature */
        data[0].properties.id = 0;

        /* parse track data for DOM */
        track += '<div class="trk"><div class="h"><div class="j">' + uTi(data[0].geometry.type) + '<div class="d">' + name.split('.')[0] + '<span class="ab">' +
            (data[0].geometry.type == 'LineString' ? 'Track' : data[0].geometry.type) +
            (stats ? ' &middot; ' + numberFormat(stats[0]) + (data[0].geometry.type == 'Polygon' ? ' sq.' : '') + ' mi.' : '') + '</span></div></div>' +
            '<div class="checkbox"><input type="checkbox" id="gtust" data-tid="' + create + '" data-c="0"' + (fid == ofid ? ' checked' : '') + '></div></div>' + ts + '</div></div>';
    }

    track += '</li>';

    /* create the geojson elements */
    var om = L.geoJson(data, {
        id: create,
        title: name,
        style: function (feature) {
            if (feature.geometry.type != 'Point') {
                return {
                    color: '#' + colors[Math.floor(Math.random() * 7)]/*'#00385c'*/,
                    weight: 6,
                    fillOpacity: 0.3
                }
            }
        },
        pointToLayer: function (_, latlng) {
            return L.marker(latlng, {
                icon: userIcon
            });
        },
        onEachFeature: function (feature, layer) {
            var name = (feature.properties.name ? feature.properties.name : 'Untitled ' + (feature.geometry.type == 'LineString' ? 'Track' : feature.geometry.type));

            layer.bindPopup(popup('Uploaded Track', name), {
                className: 'trail-popup',
                minWidth: 225,
                maxWidth: 250
            });
        }
    });

    /* push all features to an array */
    userDefinedTracks.push(om);

    /* if file was just uploaded, zoom directly to it */
    if (single && ofid == fid) {
        om.addTo(map);
        map.fitBounds(om.getBounds());
    }

    /* append track data to modal */
    const spin = document.querySelector('#modal .content .tab-content[data-tab=import] .spinner');

    if (spin != null) {
        spin.remove();
    }

    document.querySelector('#modal .content .tab-content[data-tab=import] ul').insertAdjacentHTML('beforeend', track);
    /*});*/
}

/* edit custom drawn tracks from the map */
function editDraw(el) {
    var id = el.getAttribute('data-id'),
        type = el.getAttribute('data-type'),
        mode = el.getAttribute('data-mode');

    if (!el.parentElement.parentElement.parentElement.querySelector('input[type=checkbox]').checked) {
        alert('Check the checkbox to enable this ' + type.toLowerCase() + ' for editing.', 'error');
    } else {
        /* save changes to objects */
        if (mode == 'save') {
            var newName,
                theType;

            el.style.display = 'none';
            el.parentElement.querySelector('a[id=deleteDraw]').style.display = 'none';
            el.parentElement.querySelector('i[id=editDraw]').style.display = 'inline-block';
            el.parentElement.parentElement.parentElement.querySelectorAll('span[id=objName]').forEach((u) => {
                if (u.getAttribute('data-id') == id) {
                    newName = u.querySelector('input[type=text]').value;
                    ls = JSON.parse(store.getItem('draw'));

                    for (var x = 0; x < ls.length; x++) {
                        if (ls[x][0] == id) {
                            ls[x][6] = newName;

                            theType = ls[x][2];
                        }
                    }

                    store.setItem('draw', JSON.stringify(ls));
                    u.innerHTML = newName;
                }
            });

            editableLayers.getLayers().forEach(function (l) {
                if (l.options.id == id) {
                    l.pm.disable();
                    l.options.title = newName;
                    l.closePopup().setPopupContent(l._popup._content.replace(/<h3>(.*?)<\/h3>/g, '<h3>' + newName + '</h3>'));
                    l.setTooltipContent('').unbindTooltip();

                    if (theType == 'Track') {
                        /*getProfile(id, l.getLatLngs());*/
                    }
                }
            });

            saveUserObjects();
        } else {
            /* allow user to edit objects and change name of items */
            var input = '<input type="text" name="objectName" placeholder="New ' + type.toLowerCase() + ' name" value="{value}" data-id="' + id + '"></input>';

            /*[data-id=' + id + ']*/
            el.style.display = 'none';
            el.parentElement.querySelector('a[id=editDraw]').style.display = 'inline-block';
            el.parentElement.querySelector('a[id=deleteDraw]').style.display = 'inline-block';
            el.parentElement.parentElement.parentElement.querySelectorAll('span[id=objName]').forEach((u) => {
                if (u.getAttribute('data-id') == id) {
                    var val = u.innerHTML;
                    u.innerHTML = input.replace('{value}', val);
                    u.querySelector('input[type=text]').focus();
                }
            });

            editableLayers.getLayers().forEach((layer) => {
                if (layer && layer.options.id == id) {
                    layer.pm.enable();

                    if (type == 'Point') {
                        layer.bindTooltip('Drag marker to a new spot', {
                            sticky: false
                        })
                            .openTooltip();

                        layer.on('pm:edit', (e) => {
                            updateCustomLayers(id, type, e.target);
                            layer.unbindTooltip();
                        })
                    }

                    layer.on('pm:dragend', (e) => {
                        updateCustomLayers(id, type, e.target);
                    }).on('pm:markerdragend', (e) => {
                        updateCustomLayers(id, type, e.target);
                    }).on('pm:vertexadded', (e) => {
                        updateCustomLayers(id, type, e.target);
                    }).on('pm:vertexremoved', (e) => {
                        updateCustomLayers(id, type, e.target);
                    });
                }
            });
        }
    }
}

/* remove custom drawn tracks from the map */
function deleteDraw(el) {
    var id = el.getAttribute('data-id'),
        d = JSON.parse(store.getItem('draw')),
        p = JSON.parse(store.getItem('profile'));

    editableLayers.getLayers().forEach((l) => {
        if (l.options.id == id) {
            map.removeLayer(l);
            editableLayers.removeLayer(l);

            if (d) {
                if (d.length == 1) {
                    store.removeItem('draw');
                    store.removeItem('drawSync');

                    if (p) {
                        store.removeItem('profile');
                    }
                } else {
                    d.forEach(function (e) {
                        if (e[0] == id) {
                            d.splice(d.findIndex(p => p[0] == id), 1);
                        }
                    });

                    if (p) {
                        p.forEach(function (e) {
                            if (e[0] == id) {
                                p.splice(p.findIndex(y => y[0] == id), 1);
                            }
                        });

                        store.setItem('profile', JSON.stringify(p));
                    }

                    customLayersIDS.splice(customLayersIDS.indexOf(id), 1);
                    store.setItem('draw', JSON.stringify(d));
                }

                document.querySelectorAll('.tab-content[data-tab=draw] ul.user-tracks li').forEach((p) => {
                    if (p.getAttribute('data-id') == id) {
                        p.remove();
                    }
                });
            }
        }
    });

    if (document.querySelectorAll('.tab-content[data-tab=draw] ul.user-tracks li').length == 0) {
        document.querySelector('#modal .content .tab-content[data-tab=draw]').innerHTML = '<p class="message error">You don\'t have any custom points, tracks, or polygons.</p>';
    }

    saveUserObjects();
}

async function getUserFiles(recent = false, fid = null) {
    document.querySelector('#modal #a').innerHTML = 'My Content';

    if (store.getItem('files') == null) {
        document.querySelector('#modal .content .tab-content[data-tab=import]').innerHTML = '<p class="message error">You haven\'t uploaded any files.</p>';
    } else {
        document.querySelector('.tab-content[data-tab=import] .selectAll').style.display = 'flex';
        var files = JSON.parse(store.getItem('files'));

        for (let i = 0; i < files.length; i++) {
            await parseTrack(files[i], (recent ? true : false), fid);
        }

        document.querySelector('#modal').scrollTo(0, document.querySelector('#modal').scrollHeight);
    }
}

function drilldownStats(trackStats) {
    let aspects = [],
        as = [],
        ae = [],
        ea = 0,
        ed = 0,
        es = 0,
        das = 0,
        gain = 0,
        loss = 0,
        directions = { 'N': 0, 'NE': 0, 'E': 0, 'SE': 0, 'S': 0, 'SW': 0, 'W': 0, 'NW': 0 };

    for (let z = 0; z < trackStats.length; z++) {
        const q = z + 1;
        ae.push(trackStats[z][0]);
        as.push(trackStats[z][1]);
        ed += trackStats[z][1];
        ea += trackStats[z][2];

        if (q < trackStats.length) {
            if (trackStats[q][0] >= trackStats[z][0]) {
                gain += trackStats[q][0] - trackStats[z][0];
            } else {
                loss += trackStats[q][0] - trackStats[z][0];
            }
        }

        if (trackStats[z][1] >= 30 && trackStats[z][1] <= 45) {
            das++;
        }

        let dir = new Calculate().getCompassDirection(trackStats[z][2]);

        if (dir == 'NNW') {
            dir = 'NW';
        } else if (dir == 'WNW') {
            dir = 'NW';
        } else if (dir == 'WSW') {
            dir = 'SW';
        } else if (dir == 'SSW') {
            dir = 'SW';
        } else if (dir == 'SSE') {
            dir = 'SE';
        } else if (dir == 'ESE') {
            dir = 'SE';
        } else if (dir == 'ENE') {
            dir = 'NE';
        } else if (dir == 'NNE') {
            dir = 'NE';
        }

        directions[dir] = directions[dir] + 1;
    }

    Object.keys(directions).forEach((e) => {
        let pct = (directions[e] / trackStats.length) * 100;

        if (e == 'N') {
            aspects.push({ 'north': pct });
        } else if (e == 'NE') {
            aspects.push({ 'northeast': pct });
        } else if (e == 'E') {
            aspects.push({ 'east': pct });
        } else if (e == 'SE') {
            aspects.push({ 'southeast': pct });
        } else if (e == 'S') {
            aspects.push({ 'south': pct });
        } else if (e == 'SW') {
            aspects.push({ 'southwest': pct });
        } else if (e == 'W') {
            aspects.push({ 'west': pct });
        } else if (e == 'NW') {
            aspects.push({ 'northwest': pct });
        }
    });

    return '<li data-aspects=\'' + JSON.stringify(aspects) + '\'><div class="w">Avalanche Slopes</div><div class="v">' + das + '</div></li>' +
        '<li><div class="w">Maximum Elevation</div><div class="v">' + Math.max.apply(null, ae).toFixed(1) + ' ft.</div></li>' +
        '<li><div class="w">Minimum Elevation</div><div class="v">' + Math.min.apply(null, ae).toFixed(1) + ' ft.</div></li>' +
        '<li><div class="w">Elevation Gain</div><div class="v">' + parseFloat(gain).toFixed(1) + ' ft.</div></li>' +
        '<li><div class="w">Elevation Loss</div><div class="v">' + parseFloat(loss).toFixed(1) + ' ft.</div></li>' +
        '<li><div class="w">Slope Range</div><div class="v">' + Math.min.apply(null, as).toFixed(1) + '&deg; - ' + Math.max.apply(null, as).toFixed(1) + '&deg;</div></li>' +
        '<li><div class="w">Average Slope</div><div class="v">' + parseFloat(ed / trackStats.length).toFixed(1) + '&deg;</div></li>' +
        '<li><div class="w">Average Aspect</div><div class="v">' + new Calculate().getCompassDirection(Math.round(ea / trackStats.length)) + '</div></li>';
}

async function updateCustomLayers(id, type, layer) {
    var dist = 0,
        coords,
        elev,
        perim = 0,
        popcnt = '',
        trackStats = [];

    if (type == 'Point') {
        coords = layer.getLatLng();
        /*let u = await getElevation([coords.lat, coords.lng]);
        elev = [parseFloat((u.value * 3.28084).toFixed(1)), u.processedValues[1], u.processedValues[2]];*/
        extra = '';
        popcnt = '<div class="row"><div class="col title">Coordinates</div><div class="col">' + numberFormat(coords.lat, 4) + ', ' + numberFormat(coords.lng, 4) + '</div></div>' +
            '<div class="row"><div class="col title">Elevation</div><div class="col">' + numberFormat(elev[0], 1) + ' ft.</div></div>' +
            '<div class="row"><div class="col title">Slope</div><div class="col">' + elev[1] + '&deg;</div></div>' +
            '<div class="row"><div class="col title">Aspect</div><div class="col">' + aspect[new Calculate().getCompassDirection(elev[2])] + '</div></div>';
    } else if (type == 'Polygon') {
        coords = layer.getLatLngs()[0];
        extra = new Calculate().calculateArea(coords);
        perim = new Calculate().perimeter(coords);
        popcnt = '<div class="row"><div class="col title">Area</div><div class="col" title="' + new Calculate().toAcres(extra) + ' acres">' + extra + ' sq. mi.</div></div>' +
            '<div class="row"><div class="col title">Perimeter</div><div class="col">' + perim + ' mi.</div></div>' +
            '<div class="row"><div class="col title">Points</div><div class="col">' + coords.length + '</div></div>';
    } else {
        coords = layer.getLatLngs();

        for (let i = 1; i < coords.length; i++) {
            var x = i - 1;

            await Topography.getTopography({
                lat: coords[i].lat,
                lng: coords[i].lng
            }, {
                token: mapboxToken
            }).then(async (data) => {
                trackStats.push([
                    data.elevation * 3.28084,
                    data.slope,
                    data.aspect
                ]);
            });

            dist += new Calculate().distance(coords[i].lat, coords[i].lng, coords[x].lat, coords[x].lng);
        }

        extra = numberFormat(dist.toFixed(2));
        popcnt = '<div class="row"><div class="col title">Distance</div><div class="col">' + extra + ' mi.</div></div>';
    }

    var s = JSON.parse(store.getItem('draw'));

    for (var x = 0; x < s.length; x++) {
        if (s[x][0] == id) {
            s[x][3] = (extra ? extra : '');
            s[x][4] = coords;
            s[x][5] = (elev ? elev : 0);
            s[x][7] = (trackStats ? trackStats : null);
            break;
        }
    }

    /* update the popup content for this layer */
    document.querySelectorAll('#modal .tab-content[data-tab=draw] .user-tracks li').forEach((e) => {
        if (e.getAttribute('data-id') == id) {
            layer.getPopup().setContent(popup(e.querySelector('input[name=objectName]').value, popcnt));
        }
    });

    /* update stats in modal */
    document.querySelectorAll('#modal .content #ts').forEach((c) => {
        if (c.getAttribute('data-tid') == id) {
            const rose = document.getElementById('sr-' + id);
            var s = '';

            if (type == 'Polygon') {
                s = '<ol><li><div class="w">Area</div><div class="v" title="' + new Calculate().toAcres(extra) + ' acres">' + extra + ' sq. mi.</div></li>' +
                    '<li><div class="w">Perimeter</div><div class="v">' + perim + ' mi.</div></li>' +
                    '<li><div class="w">Points</div><div class="v">' + layer.getLatLngs()[0].length + '</div></li></ol>';
            } else if (type == 'Track') {
                s = '<ol><li><div class="w">Distance</div><div class="v">' + extra + ' mi.</div></li>' +
                    (trackStats != null ? drilldownStats(trackStats) : '') + '</ol>'/* + (trackStats != null ? slopeRose.replace('{{slopeRoseID}}', id) : '')*/;
            } else {
                s = '<ol><li><div class="w">Coordinates</div><div class="v">' + numberFormat(coords.lat, 4) + ', ' + numberFormat(coords.lng, 4) + '</div></li>' +
                    '<li><div class="w">Elevation</div><div class="v">' + numberFormat(elev[0], 1) + ' ft.</div></li>' +
                    '<li><div class="w">Slope</div><div class="v">' + elev[1] + '&deg;' + (settings.category == 'snow' ? avySafety(elev[1]) : '') + '</div></li>' +
                    '<li><div class="w">Aspect</div><div class="v">' + aspect[new Calculate().getCompassDirection(elev[2])] + '</div></li></ol>';
            }

            c.innerHTML = s;
        }
    });

    /*[data-id=' + id + ']*/
    document.querySelectorAll('.tab-content[data-tab=draw] .user-tracks li .ab').forEach((k) => {
        if (k.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute('data-id') == id) {
            k.innerHTML = type + (extra ? ' &middot; ' + extra + (type == 'Polygon' ? ' sq.' : '') + ' mi.' : '');
        }
    });

    store.setItem('draw', JSON.stringify(s));
}

function getCustomDraw(check = 0) {
    var a = JSON.parse(store.getItem('draw')),
        /*profile = JSON.parse(store.getItem('profile')),*/
        sync = store.getItem('drawSync');

    if (a) {
        const pmsg = document.querySelector('.tab-content[data-tab=draw] p.message');

        if (pmsg != null) {
            pmsg.remove();
        }

        document.querySelector('.tab-content[data-tab=draw] .selectAll').style.display = 'flex';

        if ((new Date().getTime() / 1000) - sync < SYNC_REMINDER * 60) {
            const suo = document.querySelector('#saveUserObjects');
            suo.classList.add('btn-green');
            suo.classList.remove('btn-red');
        }

        /* loop through all objects in local storage array */
        for (let i = 0; i < a.length; i++) {
            var id = a[i][0],
                time = a[i][1],
                type = a[i][2],
                ex = a[i][3],
                g = a[i][4],
                elev = a[i][5],
                name = a[i][6],
                trackStats = (a[i][7] ? a[i][7] : null),
                p,
                isChk = false,
                track = '';

            /* prevents duplicated layers by checking a master list of IDs */
            if (customLayersIDS.includes(id) === false) {
                var stats = '',
                    pstats = '',
                    popcnt = '',
                    expop = '';

                /* if modal is closed the layer is already showing on the map */
                if (editableLayers.getLayers().length > 0 && editableLayers.getLayers()[i] != undefined) {
                    isChk = (map.hasLayer(editableLayers.getLayers()[i]) ? true : false);
                    //isChk = false;
                }

                /* start forming the header of the object for the list of tracks to append to the container */
                track += '<li data-id="' + id + '"><div class="title"><div class="a"><span>' + type + ' #' + (i + 1) + '</span>' +
                    '<i class="far fa-pen" id="editDraw" data-mode="edit" data-id="' + id + '" data-type="' + type + '" title="Edit ' + type + '" aria-hidden="true"></i>' +
                    (type == 'Track' ? '<span class="fas fa-chart-area" onclick="drawChart(\'custom\', \'' + id + '\')"></span>' : '') +
                    '<span class="fad fa-file-export" title="Export feature" data-id="' + id + '" data-geo="' + type + '" data-name="' + (name ? name : 'Untitled ' + type) + '" data-type="item"></span>' +
                    '<a href="#" id="editDraw" data-id="' + id + '" data-mode="save" data-type="' + type + '" class="btn btn-sm btn-green retro" onclick="return false">Save</a>' +
                    '<a href="#" id="deleteDraw" data-id="' + id + '" class="btn btn-sm btn-red retro" style="margin-left:5px" onclick="return false">Delete</a></div>' +
                    '<span class="b" title="Created ' + timeAgo(time / 1000) + '">' + prettyTime(time / 1000) + '</span></div>' +
                    '<div class="trk"><div class="h"><div class="j">' + uTi(type) + '<div class="d"><span id="objName" data-id="' + id + '">' + (name ? name : 'Untitled ' + type) + '</span>' +
                    '<span class="ab">' + type + (ex ? ' &middot; ' + ex + (type == 'Polygon' ? ' sq.' : '') + ' mi.' : '') + '</span></div></div>' +
                    '<div class="checkbox"><input type="checkbox" id="slde" ' + ((check != 0 && check == id) || isChk ? 'checked ' : '') + 'data-id="' + id + '" data-c="' + i + '"></div></div>' +
                    '<div id="ts" data-tid="' + id + '" data-c="' + i + '"' + ((check != 0 && check == id) || isChk ? ' style="display:block"' : '') + '>';

                /* if object is a marker */
                if (type == 'Point') {
                    p = L.marker([g.lat, g.lng], {
                        id: id,
                        icon: userIcon,
                        pane: 'trail'
                    });

                    stats = '<ol><li><div class="w">Coordinates</div><div class="v">' + numberFormat(g.lat, 4) + ', ' + numberFormat(g.lng, 4) + copyToCB + '</div></li>' +
                        '<li><div class="w">Elevation</div><div class="v">' + numberFormat(elev[0], 1) + ' ft.</div></li>' +
                        '<li><div class="w">Slope</div><div class="v">' + Math.round(elev[1]) + '&deg;' + (settings.category == 'snow' ? avySafety(elev[1]) : '') + '</div></li>' +
                        '<li><div class="w">Aspect</div><div class="v">' + aspect[new Calculate().getCompassDirection(elev[2])] + '</div></li></ol>';

                    popcnt = '<div class="row"><div class="col title">Coordinates</div><div class="col">' + numberFormat(g.lat, 4) + ', ' + numberFormat(g.lng, 4) + '</div></div>' +
                        '<div class="row"><div class="col title">Elevation</div><div class="col">' + numberFormat(elev[0], 1) + ' ft.</div></div>' +
                        '<div class="row"><div class="col title">Slope</div><div class="col">' + elev[1] + '&deg;</div></div>' +
                        '<div class="row"><div class="col title">Aspect</div><div class="col">' + new Calculate().getCompassDirection(elev[2]) + '</div></div>';

                    /* if object is a polyline */
                } else if (type == 'Track') {
                    p = L.polyline(g, {
                        id: id,
                        weight: 6,
                        color: '#00385c',
                        pane: 'trail'
                    });

                    stats = '<ol><li><div class="w">Distance</div><div class="v">' + ex + ' mi.</div></li>';

                    /* if stats were computed for individual points along the track */
                    if (trackStats != null) {
                        stats += drilldownStats(trackStats);
                    }

                    stats += '</ol>' + (trackStats != null ? slopeRose.replace('{{slopeRoseID}}', id) : '');

                    popcnt = '<div class="row"><div class="col title">Distance</div><div class="col">' + ex + ' mi.</div></div>' + (expop ? expop : '');

                    /* if object is a polygon */
                } else {
                    p = L.polygon(g, {
                        id: id,
                        weight: 6,
                        color: '#00385c',
                        opacity: 1,
                        fillOpacity: 0.3,
                        pane: 'trail'
                    });
                    let perim = new Calculate().perimeter(p.getLatLngs()[0]),
                        ac = new Calculate().toAcres(ex);

                    stats = '<ol><li><div class="w">Area</div><div class="v" title="' + ac + ' acres">' + ex + ' sq. mi.</div></li>' +
                        '<li><div class="w">Perimeter</div><div class="v">' + perim + ' mi.</div></li>' +
                        '<li><div class="w">Points</div><div class="v">' + g.length + '</div></li></ol>';
                    popcnt = '<div class="row"><div class="col title">Area</div><div class="col" title="' + ac + ' acres">' + ex + ' sq. mi.</div></div>' +
                        '<div class="row"><div class="col title">Perimeter</div><div class="col">' + perim + ' mi.</div></div>' +
                        '<div class="row"><div class="col title">Points</div><div class="col">' + g.length + '</div></div>';
                }

                /* bind popup and on click events to leaflet layer */
                p.bindPopup(popup((name ? name : 'Untitled ' + type), popcnt), {
                    className: 'trail-popup',
                    closeOnClick: false,
                    minWidth: 275,
                    maxWidth: 300
                }).on('click', function () {
                    openUserUploadsModal();
                    document.querySelector('#modal .content li[rel=import]').classList.remove('active');
                    document.querySelector('#modal .content li[rel=draw]').classList.add('active');
                    document.querySelector('#modal .tab-content[data-tab=import]').classList.remove('active');
                    document.querySelector('#modal .tab-content[data-tab=draw]').classList.add('active');
                });

                track += stats + '</div></div></div></li>';

                editableLayers.addLayer(p);
                customLayersIDS.push(id);

                document.querySelector('.tab-content[data-tab=draw] ul').insertAdjacentHTML('beforeend', track);
            }
        }
    }
}

function drawChart(type, id, inst = null) {
    let profile = [],
        saved = store.getItem('profile');

    if (document.querySelector('#chart') == null) {
        document.querySelector('body').insertAdjacentHTML('beforeend', '<div class="chart" style="display:block"><div class="spinner" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);width:35px;height:35px">' +
            '</div><i id="closeChart" class="fat fa-close"></i><canvas id="chart" style="width:100%;height:100%"></canvas></div>');
    }

    let cacheProfile = function (id, inst, profile) {
        let modify = (saved != null ? JSON.parse(saved) : []),
            useable = false;

        if (saved != null) {
            modify.forEach((p) => {
                if (p.id == id && p.inst == inst) {
                    p.profile = profile;
                    useable = true;
                }
            });
        }

        if (!useable) {
            modify.push({
                id: id,
                inst: inst,
                profile: profile
            });
        }

        store.setItem('profile', JSON.stringify(modify));
    };

    let processData = function () {
        let cache = false;

        if (saved != null && JSON.parse(saved).length > 0) {
            JSON.parse(saved).forEach((p) => {
                if (p.id == id && p.inst == inst) {
                    doChart(p.profile);
                    cache = true;
                }
            });

            if (!cache) {
                refreshData();
            }
        } else {
            refreshData();
        }
    };

    let refreshData = function () {
        if (type == 'upload') {
            userDefinedTracks.forEach((u) => {
                if (u.options.id == id) {
                    u.getLayers().forEach(async (l, n) => {
                        if (n == inst) {
                            let coords = l.getLatLngs();

                            if (coords[0].alt == undefined || (coords[0].alt == 0 && coords[1].alt == 0)) {
                                let dist = 0;

                                for (let i = 0; i < coords.length - 1; i++) {
                                    let x = i + 1,
                                        elev;

                                    await Topography.getTopography({
                                        lat: coords[i].lat,
                                        lng: coords[i].lng
                                    }, {
                                        token: mapboxToken
                                    }).then((data) => {
                                        elev = parseFloat((data.elevation * 3.28084).toFixed(1));
                                    });

                                    dist += new Calculate().distance(coords[i].lat, coords[i].lng, coords[x].lat, coords[x].lng);

                                    profile.push([dist, elev]);
                                }

                                cacheProfile(id, inst, profile);
                                doChart(profile);
                            } else {
                                let dist = 0;

                                for (let i = 0; i < coords.length - 1; i++) {
                                    let x = i + 1,
                                        elev = parseFloat((coords[i].alt * 3.28084).toFixed(1));

                                    dist += new Calculate().distance(coords[i].lat, coords[i].lng, coords[x].lat, coords[x].lng);

                                    profile.push([dist, elev]);
                                }

                                cacheProfile(id, inst, profile);
                                doChart(profile);
                            }
                        }
                    });
                }
            });
        } else {
            editableLayers.getLayers().forEach(async (l) => {
                if (l.options.id == id) {
                    const coords = l.getLatLngs();

                    let dist = 0;

                    for (let i = 0; i < coords.length - 1; i++) {
                        let x = i + 1,
                            elev;

                        await Topography.getTopography({
                            lat: coords[i].lat,
                            lng: coords[i].lng
                        }, {
                            token: mapboxToken
                        }).then((data) => {
                            elev = parseFloat((data.elevation * 3.28084).toFixed(1));
                        });

                        dist += new Calculate().distance(coords[i].lat, coords[i].lng, coords[x].lat, coords[x].lng);

                        profile.push([dist, elev]);
                    }

                    cacheProfile(id, inst, profile);
                    doChart(profile);
                }
            });
        }
    };


    if (isChartJS === false) {
        getScript('https://cdn.jsdelivr.net/npm/chart.js')
            .then(() => {
                processData();
                isChartJS = true;
            }).catch(() => {
                alert('Unable to load elevation chart', 'error');
            });
    } else {
        processData();
    }
}

function doChart(profile) {
    let odist = [],
        dist = [],
        elev = [];

    document.querySelector('.chart .spinner').remove();

    profile.forEach((e) => {
        dist.push(parseFloat(e[0].toFixed(1)));
        odist.push(e[0]);
        elev.push(e[1]);
    });

    var totalDist = odist[odist.length - 1],
        maxSteps = Math.ceil(totalDist / (totalDist < 3 ? 0.1 : (totalDist < 8 ? 0.5 : 2))) + 1,
        minScale = Math.floor((Math.min.apply(null, elev) - 1000) / 500) * 500,
        maxScale = Math.ceil((Math.max.apply(null, elev) + 1000) / 500) * 500;

    elevProfile = new Chart(chart, {
        type: 'line',
        data: {
            labels: dist,
            datasets: [{
                xAxisID: 'xAxis',
                yAxisID: 'yAxis',
                fill: true,
                label: '',
                data: elev,
                pointStyle: false,
                borderWidth: 5,
                borderColor: 'rgb(112 162 136)',
                backgroundColor: 'rgb(112 162 136 / 15%)',
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                yAxis: {
                    beginAtZero: true,
                    min: minScale,
                    max: maxScale,
                    title: {
                        display: true,
                        text: 'Elevation (ft)',
                        padding: 10,
                        font: {
                            family: 'Noto Sans',
                            size: 13,
                            weight: 600
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Noto Sans',
                            size: 14
                        }
                    }
                },
                xAxis: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Distance (mi)',
                        padding: 10,
                        font: {
                            family: 'Noto Sans',
                            size: 13,
                            weight: 600
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: maxSteps,
                        font: {
                            family: 'Noto Sans',
                            size: 14
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: '#f1f1f1',
                    titleColor: '#000',
                    bodyColor: '#000',
                    titleFont: {
                        family: 'Noto Sans',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Noto Sans',
                        size: 14
                    },
                    displayColors: false,
                    callbacks: {
                        title: function () {
                            return 'Track Point';
                        },
                        label: function (context) {
                            return ['Distance: ' + context.label + ' mi.', 'Elevation: ' + numberFormat(context.parsed.y) + ' ft.'];
                        }
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'Noto Sans',
                            size: 16
                        }
                    },
                    display: false
                }
            }
        }
    });

    /*var p = JSON.parse(store.getItem('profile')),
        dist = [],
        elev = [],
        chart = document.querySelector('canvas#chart');
 
    p.forEach((e) => {
        if (e[0] == id) {
            for (let i = 0; i < e[1].points.length; i++) {
                dist.push(e[1].points[i].distance);
                elev.push(e[1].points[i].elevation);
            }
        }
    });
 
    var totalDist = dist[dist.length - 1],
        maxSteps = Math.ceil(totalDist / (totalDist < 3 ? 0.1 : (totalDist < 8 ? 0.5 : 2))) + 1,
        minScale = Math.floor((Math.min.apply(null, elev) - 1000) / 500) * 500,
        maxScale = Math.ceil((Math.max.apply(null, elev) + 1000) / 500) * 500;
 
    if (elevProfile) {
        elevProfile.clear();
        elevProfile.data.labels = dist;
        elevProfile.data.datasets[0].data = elev;
        elevProfile.update();
    } else {
        elevProfile = new Chart(chart, {
            type: 'line',
            data: {
                labels: dist,
                datasets: [{
                    xAxisID: 'xAxis',
                    yAxisID: 'yAxis',
                    fill: true,
                    label: '',
                    data: elev,
                    pointStyle: false,
                    borderWidth: 5,
                    borderColor: 'rgb(112 162 136)',
                    backgroundColor: 'rgb(112 162 136 / 15%)',
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    yAxis: {
                        beginAtZero: true,
                        min: minScale,
                        max: maxScale,
                        title: {
                            display: true,
                            text: 'Elevation (ft)',
                            padding: 10,
                            font: {
                                family: 'Noto Sans',
                                size: 13,
                                weight: 600
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Noto Sans',
                                size: 14
                            }
                        }
                    },
                    xAxis: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Distance (mi)',
                            padding: 10,
                            font: {
                                family: 'Noto Sans',
                                size: 13,
                                weight: 600
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: maxSteps,
                            font: {
                                family: 'Noto Sans',
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#f1f1f1',
                        titleColor: '#000',
                        bodyColor: '#000',
                        titleFont: {
                            family: 'Noto Sans',
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            family: 'Noto Sans',
                            size: 14
                        },
                        displayColors: false,
                        callbacks: {
                            title: function () {
                                return 'Track Point';
                            },
                            label: function (context) {
                                return ['Distance: ' + context.label + ' mi.', 'Elevation: ' + numberFormat(context.parsed.y) + ' ft.'];
                            }
                        }
                    },
                    legend: {
                        labels: {
                            font: {
                                family: 'Noto Sans',
                                size: 16
                            }
                        },
                        display: false
                    }
                }
            }
        });
    }
 
    return true;*/
}

/*async function getProfile(id, c, layer = null) {
    var p = store.getItem('profile'),
        pexist = false,
        container = document.querySelectorAll('.tab-content[data-tab=draw] #ts ol');
    /*[data-tid=' + id + '] ol*//*

container.forEach((ea) => {
if (ea.parentElement.getAttribute('data-tid') == id) {
ea.innerHTML = '<li><div class="w">Getting stats...</div><div class="v"><div class="spinner" style="width:25px;height:25px;border-width:2.5px"></div></div></li>';
}
});

var fd = new FormData();
fd.append('geo', JSON.stringify(c));

const resp = await fetch(host + 'api/v1/createChart?key=' + key, {
method: 'POST',
body: fd
});

if (resp.ok) {
const api = await resp.json();

if (api.error) {
container.forEach((ea) => {
if (ea.getAttribute('data-tid') == id) {
ea.innerHTML = '<ol><li><div class="w message error" style="margin:0">There was an error calculating stats for this object.</div></li></ol>';
}
});
} else {
var data = {
0: id,
1: api.track
},
deg1 = (Math.atan(api.track.slope.max / 100) * (180.0 / Math.PI)).toFixed(1) + '&deg;',
deg2 = (Math.atan(api.track.slope.avg / 100) * (180.0 / Math.PI)).toFixed(1) + '&deg;',
pop = '',
content = '<li data-id="' + id + '"><div class="w">Maximum Altitude</div><div class="v">' + numberFormat(api.track.elevation.max, 1) + ' ft.</div></li>' +
'<li><div class="w">Minimum Altitude</div><div class="v">' + numberFormat(api.track.elevation.min, 1) + ' ft.</div></li>' +
'<li><div class="w">Elevation Gain</div><div class="v">' + numberFormat(api.track.altitude.gain, 1) + ' ft.</div></li>' +
'<li><div class="w">Elevation Loss</div><div class="v">' + numberFormat(api.track.altitude.loss, 1) + ' ft.</div></li>' +
'<li><div class="w">Maximum Track Slope</div><div class="v">' + numberFormat(api.track.slope.max, 1) + '% / ' + deg1 + '</div></li>' +
'<li><div class="w">Average Track Slope</div><div class="v">' + numberFormat(api.track.slope.avg, 1) + '% / ' + deg2 + '</div></li>';

if (layer != null) {
var a = layer._popup._content;
pop = a.substr(0, a.length - 6);

pop += '<div class="row"><div class="col title">Max. Altitude</div><div class="col">' + numberFormat(api.track.elevation.max, 1) + ' ft.</div></div>' +
'<div class="row"><div class="col title">Min. Altitude</div><div class="col">' + numberFormat(api.track.elevation.min, 1) + ' ft.</div></div>' +
'<div class="row"><div class="col title">Elev. Gain</div><div class="col">' + numberFormat(api.track.altitude.gain, 1) + ' ft.</div></div>' +
'<div class="row"><div class="col title">Elev. Loss</div><div class="col">' + numberFormat(api.track.altitude.loss, 1) + ' ft.</div></div>' +
'<div class="row"><div class="col title">Max. Slope</div><div class="col">' + numberFormat(api.track.slope.max, 1) + '% / ' + deg1 + '</div></div>' +
'<div class="row"><div class="col title">Min. Slope</div><div class="col">' + numberFormat(api.track.slope.avg, 1) + '% / ' + deg2 + '</div></div>';

layer.setPopupContent(pop + '</div>');
}

if (!p) {
store.setItem('profile', JSON.stringify([data]));
} else {
var arr = JSON.parse(p);

arr.forEach(function (t, n) {
if (t[0] == id) {
arr[n] = data;
pexist = true;
}
});

if (pexist === false) {
arr.push(data);
}

store.setItem('profile', JSON.stringify(arr));
}

/*document.querySelector('.tab-content[data-tab=draw] #ts[data-tid=' + id + '] ol li:nth-child(2)').remove();*//*
                container.forEach((ea) => {
                if (ea.parentElement.getAttribute('data-tid') == id) {
                ea.innerHTML = content;
                }
                });
                }
                }
                }*/

function openUserUploadsModal(tab = null) {
    const modal = document.querySelector('#modal');

    if (!isVisible(modal)) {
        if (document.querySelector('#userFiles').length == 1) {
            modal.innerHTML = document.querySelector('#userFiles').innerHTML;
            modal.style.display = 'flex';
            document.querySelector('#userFiles').remove();
        } else {
            modal.innerHTML = userFiles;
            modal.style.display = 'flex';
            document.querySelector('#modal .content .tab-content[data-tab=import] .selectAll').insertAdjacentHTML('afterend', '<div class="spinner" style="margin:1em auto;display: block;width: 30px;height: 30px"></div>');
            getCustomDraw();
        }

        document.querySelector('#lastsynced').innerHTML = 'Last synced ' + timeAgo(store.getItem('drawSync'));
        getUserFiles();
    } else {
        customLayersIDS = [];
        document.querySelector('#modal').innerHTML = userFiles;
        document.querySelector('#modal').style.display = 'flex';
        document.querySelector('#modal .content .tab-content[data-tab=import] .selectAll').insertAdjacentHTML('afterend', '<div class="spinner" style="margin:1em auto;display: block;width: 30px;height: 30px"></div>');

        getCustomDraw();
        getUserFiles();

        document.querySelector('#lastsynced').innerHTML = 'Last synced ' + timeAgo(store.getItem('drawSync'));
    }

    if (tab == 'custom') {
        document.querySelector('ol.tabs li:first-child').classList.remove('active');
        document.querySelector('ol.tabs li:last-child').classList.add('active');
        document.querySelector('.tab-content[data-tab=import]').classList.remove('active');
        document.querySelector('.tab-content[data-tab=draw]').classList.add('active');
    }
}

async function saveUserObjects(b = null) {
    document.querySelector('#lastsynced').innerHTML = 'Syncing...';

    if (b == null) {
        b = document.querySelector('#saveUserObjects');
    }

    b.innerHTML = 'Syncing...';

    /*if (!d) {
        b.html('<i class="fas fa-cloud-arrow-up"></i> Sync Your Data');
        alert('You don\'t have any custom objects to sync');
    } else {*/
    if (store.getItem('draw')) {
        const fd = new FormData();
        fd.append('geo', store.getItem('draw'));
        fd.append('profile', store.getItem('profile'));

        const resp = await fetch(host + 'api/v1/upload/custom?key=' + key, {
            method: 'POST',
            body: fd
        });

        if (resp.ok) {
            const r = await resp.json();

            if (r.success == 1) {
                store.setItem('drawSync', (new Date().getTime() / 1000));
                document.querySelector('#lastsynced').innerHTML = 'Last synced ' + timeAgo(new Date().getTime() / 1000);
                alert('Your data was successfully synced to the cloud.');
            } else if (r.error == 1) {
                alert('There was an error syncing your data.', 'error')
            }

            b.classList.add('btn-green');
            b.classList.remove('btn-yellow');
            b.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Sync Your Data';
        }
    }
}

/* when a dynamically created object is clicked on */
document.onclick = (e) => {
    const el = e.target;

    /* save user created objects to database, not just local storage */
    if (el.id.search('saveUserObjects') >= 0) {
        saveUserObjects(el);
    }

    /* close chart on click */
    if (el.id.search('closeChart') >= 0) {
        document.querySelector('.chart').style.display = 'none';
        document.querySelector('.chart').remove();
    }

    if (el.id.search('editDraw') >= 0) {
        editDraw(el);
    }

    if (el.id.search('deleteDraw') >= 0) {
        deleteDraw(el);
    }

    if (el.classList.contains('avy-terrain')) {
        alert(el.getAttribute('title'), 'info');
    }

    /* edit file names of user uploaded tracks */
    if (el.id.search('editFileName') >= 0) {
        var fid = el.getAttribute('data-fid');

        el.style.display = 'none';
        const fnid = document.querySelector('input[name=fileName][data-fid=' + CSS.escape(fid) + ']');
        fnid.style.display = 'block';
        fnid.focus();
        document.querySelector('span[data-name-fid=' + CSS.escape(fid) + ']').style.display = 'none';

        /* cancel on blur */
        fnid.onblur = () => {
            var name = fnid.value;

            document.querySelector('i[id=editFileName][data-fid=' + CSS.escape(fid) + ']').style.display = 'inline-block';
            document.querySelector('input[name=fileName][data-fid=' + CSS.escape(fid) + ']').style.display = 'none';
            document.querySelector('span[data-name-fid=' + CSS.escape(fid) + ']').innerHTML = name;
            document.querySelector('span[data-name-fid=' + CSS.escape(fid) + ']').style.display = 'inline-block';
        };

        /* save the user input when they press enter or cancel on esc */
        fnid.onkeydown = async (e) => {
            if (e.keyCode == 27 || e.keyCode == 13) {
                var name = fnid.value;

                document.querySelector('i[id=editFileName][data-fid=' + CSS.escape(fid) + ']').style.display = 'inline-block';
                document.querySelector('input[name=fileName][data-fid=' + CSS.escape(fid) + ']').style.display = 'none';
                document.querySelector('span[data-name-fid=' + CSS.escape(fid) + ']').innerHTML = name;
                document.querySelector('span[data-name-fid=' + CSS.escape(fid) + ']').style.display = 'inline-block';

                if (e.keyCode == 13) {
                    const fd = new FormData();
                    fd.append('fid', fid);
                    fd.append('n', name);

                    const resp = await fetch(host + 'api/v1/upload/rename?key=' + key, {
                        method: 'POST',
                        body: fd
                    });

                    if (resp.ok) {
                        const r = await resp.json();

                        if (r.success == 1) {
                            var p = JSON.parse(store.getItem('files'));

                            p.forEach((f, n) => {
                                if (f.fid == fid) {
                                    p[n].name = name;
                                }
                            });

                            store.setItem('files', JSON.stringify(p));

                            alert('Your track was successfully renamed.');
                        }
                    }
                }
            }
        };
    }
};

document.onchange = async (e) => {
    const el = e.target;

    /* upload a file */
    if (el.name == 'file') {
        var fd = new FormData();
        let files = document.querySelector('form#fileUpload input[type=file]').files[0];
        fd.append('file', files);

        document.querySelectorAll('form#fileUpload .message').forEach((m) => {
            m.remove();
        });

        el.style.display = 'none';
        document.querySelector('form#fileUpload .uploading').style.display = 'flex';

        fetch(host + 'api/v1/upload/do?key=' + key, {
            method: 'POST',
            body: fd
        }).then(async (get) => {
            const resp = await get.json();

            if (resp.success == 1) {
                var allFiles = [],
                    fid = resp.fid,
                    fileName = resp.file,
                    create = resp.create,
                    modify = resp.modify,
                    original = resp.name;

                if (store.getItem('files') != null) {
                    allFiles = JSON.parse(store.getItem('files'));
                }

                allFiles.push({
                    fid: fid,
                    name: original,
                    file: fileName,
                    create: create,
                    modify: modify
                });

                store.setItem("files", JSON.stringify(allFiles));

                document.querySelector('#modal').innerHTML = userFiles;
                getUserFiles(true, fid);
            } else {
                document.querySelector('form#fileUpload input[type=file]').style.display = 'block';
                document.querySelector('form#fileUpload input[type=file]').parentElement.insertAdjacentHTML('afterbegin', '<p class="message error">' + resp.error + '</p>');
                document.querySelector('form#fileUpload .uploading').style.display = 'none';
            }
        });
    }

    /* on checkbox check of user created geometries */
    if (el.id.search('slde') >= 0) {
        const id = el.getAttribute('data-id'),
            c = el.getAttribute('data-c'),
            chk = el.checked;

        editableLayers.getLayers().forEach((l) => {
            if (l.options.id == id) {
                if (chk) {
                    if (l instanceof L.Marker) {
                        l.setIcon(userIcon);
                    }
                    map.addLayer(l);

                    if (l instanceof L.Marker) {
                        map.setView([l.getLatLng().lat, l.getLatLng().lng], 13);
                    } else {
                        map.fitBounds(l.getBounds());
                    }
                } else {
                    map.removeLayer(l);
                }
            }
        });

        document.querySelectorAll('#modal .content #ts').forEach((p) => {
            const rose = document.getElementById('sr-' + id);

            if (p.getAttribute('data-tid') == id && c == p.getAttribute('data-c')) {
                p.style.display = (chk ? 'block' : 'none');

                /* fill in colors on the compass (slope) rose */
                if (rose != null) {
                    JSON.parse(p.querySelectorAll('ol li[data-aspects]')[0].getAttribute('data-aspects')).forEach((da) => {
                        const key = Object.keys(da)[0];

                        rose.querySelectorAll('path').forEach((path) => {
                            if (path.getAttribute('data-id').search(key + ' ') >= 0) {
                                path.style.fill = 'rgb(241 143 1 / ' + da[key] + '%)';
                            }
                        });
                    });
                }
            }
        });
    }

    /* on checkbox check of a group of geojson/files */
    if (el.id.search('selectGroup') >= 0) {
        const fg = L.featureGroup(),
            tid = el.getAttribute('data-tid');

        document.querySelector('#modal').scrollTo(0, el.parentElement.parentElement.parentElement.offsetTop - 5);

        userDefinedTracks.forEach((t) => {
            if (tid == t.options.id) {
                t.getLayers().forEach((ea) => {
                    if (el.checked) {
                        ea.addTo(map);

                        fg.addLayer(ea);
                    } else {
                        ea.removeFrom(map);
                    }
                });

            }

            document.querySelectorAll('#modal .content #ts').forEach((p) => {
                if (tid == p.getAttribute('data-tid')) {
                    p.style.display = (el.checked ? 'block' : 'none');
                }
            });
        });

        /* check or uncheck boxes in the group */
        document.querySelectorAll('.user-tracks li .trk input[type=checkbox]').forEach((ec) => {
            if (tid == ec.getAttribute('data-tid')) {
                ec.checked = el.checked;
            }
        });

        /* fit map to bounds of geojson elements */
        if (el.checked) {
            map.fitBounds(fg.getBounds());
        }
    }

    /* on checkbox check of user uploaded geojson/gpx files */
    if (el.id.search('gtust') >= 0) {
        const tid = el.getAttribute('data-tid'),
            c = el.getAttribute('data-c');

        userDefinedTracks.forEach((t) => {
            if (tid == t.options.id) {
                t.getLayers().forEach((ea) => {
                    if (c == ea.feature.properties.id) {
                        if (el.checked) {
                            ea.addTo(map);

                            if (ea.feature.geometry.type == 'Point') {
                                var cc = userDefinedTracks[2].getLayers()[0].getLatLng();
                                map.setView([cc.lat, cc.lng], 10);
                            } else {
                                map.fitBounds(ea.getBounds());
                            }
                        } else {
                            ea.removeFrom(map);
                        }
                    }
                });

                /*if (v.is(':checked')) {
                    map.fitBounds(t.addTo(map).getBounds());
                } else {
                    t.removeFrom(map);
                }*/
            }

            document.querySelectorAll('#modal .content #ts').forEach((p) => {
                if (tid == p.getAttribute('data-tid') && c == p.getAttribute('data-c')) {
                    p.style.display = (el.checked ? 'block' : 'none');
                }
            });
        });
    }

    /* select all checkboxes for user content */
    if (el.id == 'selectAll') {
        var chk = el.checked,
            tab = el.getAttribute('data-tab');

        document.querySelectorAll('.tab-content[data-tab=' + tab + '] input[type=checkbox]').forEach((p) => {
            p.checked = (chk ? true : false);
        });

        document.querySelectorAll('#modal .content .tab-content[data-tab=' + tab + '] #ts').forEach((p) => {
            p.style.display = (chk ? 'block' : 'none');
        });

        if (tab == 'draw') {
            editableLayers.getLayers().forEach((l) => {
                if (chk) {
                    map.addLayer(l);
                } else {
                    map.removeLayer(l);
                }
            });

            if (chk) {
                map.fitBounds(editableLayers.getBounds());
            }
        } else if (tab == 'import') {
            var fl = new L.FeatureGroup();

            userDefinedTracks.forEach((l) => {
                map.addLayer(l);
                fl.addLayer(l);
            });

            map.fitBounds(fl.getBounds());
        }
    }
};