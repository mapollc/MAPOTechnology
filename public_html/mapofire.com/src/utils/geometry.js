import { global } from '../app/state.js';

export function getRings(geometry) {
    if (geometry?.type === 'Polygon') {
        return geometry.coordinates;
    }

    if (geometry?.type === 'MultiPolygon') {
        return geometry.coordinates.flat();
    }

    return [];
}

function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect =
            ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

export function getCounties(feature) {
    if (!feature) return '';

    const bounds = global.map.getBounds(),
        x = global.map.project(bounds.getNorthWest()),
        y = global.map.project(bounds.getSouthEast());

    const counties = map.queryRenderedFeatures([x, y], {
        layers: ['counties']
    });

    const perimeterRings = getRings(feature.geometry);

    const matches = counties.filter(county => {
        const countyRings = getRings(county.geometry);

        return perimeterRings.some(perimeterRing =>
            perimeterRing.some(point =>
                countyRings.some(countyRing =>
                    pointInPolygon(point, countyRing)
                )
            )
        );
    });

    const all = matches
        .map(c => c.properties.NAME?.replace(' County', ''))
        .filter(Boolean);

    const list = [...new Set(all)].sort();

    if (list.length === 1) {
        return `${list[0]} County`
    } else if (list.length === 2) {
        return `${list[0]} & ${list[1]} Counties`;
    } else {
        return list.length > 2
            ? `${list.slice(0, -1).join(', ')} & ${list.at(-1)} Counties`
            : '';
    }
}