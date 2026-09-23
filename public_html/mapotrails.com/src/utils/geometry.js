class Extent {
    constructor() {
        this._bbox = [Infinity, Infinity, -Infinity, -Infinity];
        this._valid = false;
    }

    include([lng, lat]) {
        this._valid = true;
        this._bbox[0] = Math.min(this._bbox[0], lng);
        this._bbox[1] = Math.min(this._bbox[1], lat);
        this._bbox[2] = Math.max(this._bbox[2], lng);
        this._bbox[3] = Math.max(this._bbox[3], lat);
        return this;
    }

    bbox() {
        return this._valid ? this._bbox : null;
    }

    polygon() {
        if (!this._valid) return null;

        const [minX, minY, maxX, maxY] = this._bbox;

        return {
            type: "Polygon",
            coordinates: [[
                [minX, minY],
                [maxX, minY],
                [maxX, maxY],
                [minX, maxY],
                [minX, minY]
            ]]
        };
    }
}

function geojsonCoords(gj) {
    const coords = [];

    function flatten(obj) {
        if (!obj) return;

        switch (obj.type) {
            case "FeatureCollection":
                obj.features.forEach(flatten);
                break;

            case "Feature":
                flatten(obj.geometry);
                break;

            case "GeometryCollection":
                obj.geometries.forEach(flatten);
                break;

            default:
                if (Array.isArray(obj.coordinates)) {
                    const stack = [obj.coordinates];

                    while (stack.length) {
                        const item = stack.pop();

                        if (typeof item[0] === "number") {
                            coords.push(item);
                        } else {
                            stack.push(...item);
                        }
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

export function geojsonExtent(gj) {
    const ext = new Extent();

    geojsonCoords(gj).forEach(coord => ext.include(coord));

    return ext.bbox();
}

geojsonExtent.polygon = function (gj) {
    const ext = new Extent();

    geojsonCoords(gj).forEach(coord => ext.include(coord));

    return ext.polygon();
};

geojsonExtent.bboxify = function (obj) {
    const geojsonTypes = new Set([
        "FeatureCollection",
        "Feature",
        "GeometryCollection",
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon"
    ]);

    traverse(obj, value => {
        if (value?.type && geojsonTypes.has(value.type)) {
            value.bbox = geojsonExtent(value);
        }
    });
};