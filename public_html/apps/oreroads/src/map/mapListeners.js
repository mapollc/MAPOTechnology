import { global } from '../app/global.js';
import { Modal } from '../ui/modal.js';
import * as helpers from '../utils/helpers.js';
import { RoadNetwork } from '../data/roads.js';

export class ClickListener {
    constructor() { }

    onMapClickListener(e) {
        const features = global.map.queryRenderedFeatures([
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ]);

        // return if no features at click location
        if (features == null || features.length == 0) return;

        const point = global.map.unproject(e.point);

        const zoomToCluster = (coords) => {
            global.map.flyTo({
                center: coords,
                zoom: global.map.getZoom() + 2.5
            });
        };

        for (const feature of features) {
            const { source: layer } = feature.layer || {};
            const { properties, geometry, sourceLayer } = feature;
            const coords = geometry.coordinates;

            // Handle mileposts first (not tied to layer)
            if (sourceLayer === 'mileposts-68fgu7') {
                const name = helpers.ucwords(properties.HWYNAME.toLowerCase()),
                    num = properties.HWYNUMB,
                    mp = properties.MP,
                    id = properties.RDWY_ID;

                const direction = num % 2 === 0 ? (id === '1' ? 'East' : 'West') : (id === '1' ? 'South' : 'North');

                helpers.createDialog(
                    'Milepost',
                    `${name} HWY (#${num}) Milepost ${mp} ${direction}bound`
                );

                break;
            }

            switch (layer) {
                case 'webcams': {
                    if (properties.cluster) return zoomToCluster(coords);

                    const cams = properties.cameras;

                    if (cams?.length) new Modal(cams, true).webcam(coords);

                    return;
                }

                case 'rwis': {
                    if (properties.cluster) return zoomToCluster(coords);

                    const nearby = global.globalData.webcams.filter((cam) => {
                        const [lon, lat] = cam.geometry.coordinates;
                        return global.calculate.distance(coords[1], coords[0], lat, lon) <= 1;
                    });

                    new Modal(properties, true).rwis(nearby);
                    return;
                }

                case 'dms':
                    new Modal(properties, true).vms();
                    return;

                case 'plows': {
                    const temp = properties.temp;
                    const where = helpers.nearestCity(coords[1], coords[0]);

                    helpers.createDialog('ODOT Snow Plow', `<div style="line-height:1.3">
                        <b>Speed</b><br>${properties.speed} mph<br>
                        <b>Location</b><br>${where}<br>
                        <b>Air Temperature</b><br>${temp.air}&deg;<br>
                        <b>Road Temperature</b><br>${temp.road}&deg;<br>
                        <b>Last Seen</b><br>${helpers.timeAgo(properties.updated)}
                    </div>`);

                    return;
                }

                case 'incidents':
                case 'roadWork':
                    new Modal(properties, true).incident();
                    return;

                case 'roads': {
                    const report = helpers.compileReports(properties.name);

                    if (!report.length) {
                        new Modal(report, true).roadReport(properties.name);
                        return;
                    }

                    const hwy = report[0]?.hwyID?.toString() || properties.hwy;

                    const range = new RoadNetwork(
                        point.lat,
                        point.lng,
                        hwy
                    ).getRange(
                        report,
                        properties.name,
                        true
                    );

                    const uqid = {
                        lat: point.lat,
                        lon: point.lng,
                        hwy,
                        name: properties.name
                    };

                    new Modal(null, true).updateURI(
                        'road-segment',
                        btoa(JSON.stringify(uqid)),
                        `Road Report for ${helpers.roadName(properties.hwy)} from MP ${range}`
                    );

                    return;
                }
            }
        }
    }
}