export class Calculate {
    distance(lat1, lon1, lat2, lon2) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c;

        return (d / 1.609);
    }

    deg2rad(d) {
        return d * (Math.PI / 180);
    }

    rad2deg(r) {
        return r * (180 / Math.PI);
    }

    getBearing(a, b, c, d) {
        a = this.deg2rad(a);
        b = this.deg2rad(b);
        c = this.deg2rad(c);
        d = this.deg2rad(d);

        const y = Math.sin(d - b) * Math.cos(c);
        const x = Math.cos(a) * Math.sin(c) - Math.sin(a) * Math.cos(c) * Math.cos(d - b);
        const brng = this.rad2deg(Math.atan2(y, x));

        return this.getCompassDirection((brng + 360) % 360);
    }

    direction(dir) {
        const labels = {
            NB: 'Northbound',
            SB: 'Southbound',
            EB: 'Eastbound',
            WB: 'Westbound'
        };

        return labels[dir];
    }

    getCompassDirection(d) {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return directions[Math.round(d / 22.5) % 16];
    }

    rh(t, td) {
        const a = 17.625,
            b = 243.04;

        return (100 * (Math.exp((a * td) / (b + td)) / Math.exp((a * t) / (b + t)))).toFixed(1);
    }

    windChill(t, w) {
        if (t >= 60 || !w) return null;

        return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(w, 0.16)) + (0.4275 * t * Math.pow(w, 0.16)));
    }
}
