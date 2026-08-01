import { global } from '../app/state.js';
import { config } from '../app/config.js';

export class UTM {
    constructor() {
        this.a = 6378137;         // WGS84 Major Axis
        this.f = 1 / 298.257223563; // Flattening
        this.k0 = 0.9996;        // Scale factor
        this.e2 = 2 * this.f - Math.pow(this.f, 2); // Eccentricity squared (e^2)
        this.e2prime = this.e2 / (1 - this.e2);      // e'2
    }

    toUTM(lat, lon) {
        const letters = 'CDEFGHJKLMNPQRSTUVWXX',
            latRad = Convert.deg2rad(lat),
            lonRad = Convert.deg2rad(lon);

        let zone = Math.floor((lon + 180) / 6) + 1;
        // Handle Svalbard/Norway exceptions
        if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
        if (lat >= 72 && lat < 84) {
            if (lon >= 0 && lon < 9) zone = 31;
            else if (lon >= 9 && lon < 21) zone = 33;
            else if (lon >= 21 && lon < 33) zone = 35;
            else if (lon >= 33 && lon < 42) zone = 37;
        }

        const lonOriginRad = Convert.deg2rad((zone - 1) * 6 - 180 + 3);

        const N = this.a / Math.sqrt(1 - this.e2 * Math.pow(Math.sin(latRad), 2)),
            T = Math.pow(Math.tan(latRad), 2),
            C = this.e2prime * Math.pow(Math.cos(latRad), 2),
            A = Math.cos(latRad) * (lonRad - lonOriginRad);

        const M = this.a * (
            (1 - this.e2 / 4 - 3 * Math.pow(this.e2, 2) / 64 - 5 * Math.pow(this.e2, 3) / 256) * latRad -
            (3 * this.e2 / 8 + 3 * Math.pow(this.e2, 2) / 32 + 45 * Math.pow(this.e2, 3) / 1024) * Math.sin(2 * latRad) +
            (15 * Math.pow(this.e2, 2) / 256 + 45 * Math.pow(this.e2, 3) / 1024) * Math.sin(4 * latRad) -
            (35 * Math.pow(this.e2, 3) / 3072) * Math.sin(6 * latRad)
        );

        let easting = this.k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + Math.pow(T, 2) + 72 * C - 58 * this.e2prime) * Math.pow(A, 5) / 120) + 500000,
            northing = this.k0 * (M + N * Math.tan(latRad) * (Math.pow(A, 2) / 2 + (5 - T + 9 * C + 4 * Math.pow(C, 2)) * Math.pow(A, 4) / 24 + (61 - 58 * T + Math.pow(T, 2) + 600 * C - 330 * this.e2prime) * Math.pow(A, 6) / 720));

        if (lat < 0) northing += 10000000;

        return `${zone}${letters[Math.floor((lat + 80) / 8)] || 'X'} ${easting.toFixed(1)}E ${northing.toFixed(1)}N`;
    }
}

export class Convert {
    static coords(a, b) {
        if (!config.settings.get().coordsDisplay() || config.settings.get().coordsDisplay() == 'dec') {
            return `${parseFloat(a).toFixed(4)}, ${parseFloat(b).toFixed(4)}`;
        }
        
        if (config.settings.get().coordsDisplay() == 'dms') {
            return `${this.convertToDms(a, false)}, ${this.convertToDms(b, true)}`;
        }
        
        if (config.settings.get().coordsDisplay() == 'utm') {
            return this.utm(Number(a), Number(b));
        }
    }

    static async utm(a, b) {
        return new UTM().toUTM(a, b);
    }

    static convertToDms(dd, isLng) {
        var dir = dd < 0 ? isLng ? 'W' : 'S' : isLng ? 'E' : 'N';

        var absDd = Math.abs(dd),
            deg = absDd | 0,
            frac = absDd - deg,
            min = (frac * 60) | 0,
            sec = Math.round((frac * 3600 - min * 60) * 100) / 100;

        return `${deg}&deg; ${min}' ${sec}" ${dir}`;
    }

    static rad2deg(r) {
        return r / (Math.PI * 180);
    }

    static deg2rad(d) {
        return d * (Math.PI / 180);
    }

    static speed(spd, u) {
        if (!spd) return;
        const v = parseFloat(spd);

        if (u == 'km/h') {
            return Math.round(v * 1.609);
        } else {
            return (u == 'mph' ? v : Math.round(v / (u == 'm/s' ? 2.237 : (u == 'kts' ? 1.151 : 1))));
        }
    }

    static sizeUnit(customUnit = null) {
        return customUnit != null ? customUnit : (config.settings.get().acres() ? config.settings.get().acres() : 'acres');
    }

    static sizeFormat(size, returnSize = true, returnUnit = true, customUnit = null) {
        let displayUnit = 'acre';
        const unit = this.sizeUnit(customUnit);

        if (size.toString().toLowerCase() === 'unknown' || size.toString() == '') {
            return returnSize ? '0' : (returnUnit ? unit : '');
        } else if (size !== null && size !== '') {
            let v = parseFloat(size);

            switch (unit) {
                case 'hectares':
                    v /= 2.471;
                    displayUnit = 'hectare';
                    break;
                case 'sqmi':
                    v /= 640;
                    displayUnit = 'square mile';
                    break;
                case 'sqkm':
                    v /= 247.1;
                    displayUnit = 'square km.';
                    break;
            }

            if ((unit === 'acre' || unit === 'hectares') && v > 100000) {
                v = Math.floor(v);
            } else if ((unit === 'sqmi' || unit === 'sqkm') && v > 100000) {
                v = Math.floor(v * 10) / 10;
            }

            const formattedSize = v.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: (unit === 'acre' || unit === 'hectares') && v > 100000 ? 0 : 2,
            });

            // Use the original number 'v' to check for pluralization
            const isOne = (v >= 0.995 && v < 1.005);
            const unitPlural = (isOne || unit === 'sqkm') ? displayUnit : `${displayUnit}s`;

            return (returnSize ? formattedSize : '') + (returnUnit ? ` ${unitPlural}` : '');
        } else {
            return '';
        }
    }

    static heatIndex(t, rh) {
        var hi;

        if (t > 80) {
            hi = -42.379 + (2.04901523 * t) + (10.14333127 * rh) - (0.22475541 * t * rh) - (0.00683783 * Math.pow(t, 2)) -
                (0.05481717 * Math.pow(rh, 2)) + (0.00122874 * Math.pow(t, 2) * rh) + (0.00085282 * t * Math.pow(rh, 2)) -
                (0.00000199 * Math.pow(t, 2) * Math.pow(rh, 2));

            if (rh < 13 && (t > 80 && t < 112)) {
                hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
            } else if (rh > 85 && (t > 80 && t < 87)) {
                hi += ((rh - 85) / 10) * ((87 - t) / 5);
            }
        } else {
            hi = 0.5 * (t + 61 + ((t - 68) * 1.2) + (rh * 0.094));
        }

        return Math.round(hi);
    }

    static windChill(t, w) {
        if (t >= 60 || !w) return null;

        return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(w, 0.16)) + (0.4275 * t * Math.pow(w, 0.16)));
    }

    static wetBulb(it, hum) {
        if (it == null || hum == null) return null;

        const t = this.FtoC(it),
            rh = Number(hum),
            wetC = t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
                Math.atan(t + rh) -
                Math.atan(rh - 1.676331) +
                0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
                4.686035;

        return Number(config.settings.weather()?.temp() == 'f' ? this.CtoF(wetC) : wetC);
    }

    static FtoC(t) {
        return Number((t - 32) * 5 / 9);
    }

    static CtoF(t) {
        return Number((t * 1.8) + 32);
    }

    static distance(lat1, lon1, lat2, lon2, metric = false) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            km = R * c,
            dist = metric ? km : km / 1.60934;

        return dist;
    }

    static getCompassDirection(bearing) {
        const dir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return dir[Math.round(bearing / 22.5) % 16];
    }

    static async getRasterColor(coords, layerId) {
        if (!global.map.getLayer(layerId)) return null;

        const source = global.map.getSource(global.map.getLayer(layerId).source),
            z = Math.floor(global.map.getZoom()),
            tileX = Math.floor((coords.lng + 180) / 360 * Math.pow(2, z)),
            tileY = Math.floor((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z)),
            getBBox = (tx, ty, z) => {
                const s = 20037508.34 * 2;
                const res = s / Math.pow(2, z);
                const minX = -20037508.34 + tx * res;
                const maxY = 20037508.34 - ty * res;
                return `${minX},${maxY - res},${minX + res},${maxY}`;
            };

        const url = source.tiles[0].replace('{bbox-epsg-3857}', getBBox(tileX, tileY, z)),
            img = new Image();

        img.crossOrigin = "Anonymous";
        await new Promise(res => { img.onload = res; img.src = url; });

        const canvas = new OffscreenCanvas(1, 1),
            ctx = canvas.getContext('2d'),
            px = Math.floor(((coords.lng + 180) / 360 * Math.pow(2, z) % 1) * 256),
            py = Math.floor(((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z) % 1) * 256);

        ctx.drawImage(img, px, py, 1, 1, 0, 0, 1, 1);

        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
}