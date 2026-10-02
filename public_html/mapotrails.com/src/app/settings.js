import { config } from './config.js';
import { appLayers } from './state.js';

export class Settings {
    constructor(u) {
        this.user = u ?? null;
        this.role = this.user?.role ?? 'GUEST';

        this.defaultSettings = {
            avyOpac: 0.5,
            bearing: 0,
            center: [43.67, -117.15],
            layers: this.defaultLayers,
            pitch: 0,
            tile: 'outdoors',
            toggle3d: '2d',
            zoom: 5
        };

        const saved = this.user?.settings?.mapotrails;

        this.settings = {
            ...this.defaultSettings,
            ...saved,
            layers: Object.fromEntries(
                appLayers.map(layer => [
                    layer.id,
                    saved?.layers?.[layer.id] ?? layer.default
                ])
            )
        };
    }

    toggle3d(is3d) {
        this.settings.toggle3d = is3d ? '3d' : '2d';
    }

    updateLayers(id, checked) {
        this.settings.layers[id] = checked;
    }

    checkboxes() {
        return this.settings['layers'] ?? this.defaultLayers;
    }

    isEnabled(id) {
        return !id ? null : this.checkboxes()?.[id] === true;
    }

    map() {
        return {
            lat: parseFloat(this.settings.center[0]),
            lon: parseFloat(this.settings.center[1]),
            zoom: parseInt(this.settings.zoom),
            basemap: this.settings.tile,
            pitch: this.settings.pitch ?? 0,
            bearing: this.settings.bearing ?? 0,
            is3D: this.settings.toggle3d === '3d' ?? false
        }
    }

    hasPermissions(levels = null) {
        const requiredLevels = Array.isArray(levels) ? levels : [levels];

        if (requiredLevels.length == 0 || this.getUser().role() == config.PERMISSION_LEVELS.ADMIN/* || this.getUser().role() == config.PERMISSION_LEVELS.LICENSEE)*/) {
            return true;
        }

        return false;
    }

    getUser() {
        return {
            getName: () => {
                return {
                    first: () => {
                        return this.user?.first_name ?? null;
                    },
                    last: () => {
                        return this.user?.last_name ?? null;
                    }
                };
            },
            email: () => {
                return this.user?.email ?? null;
            },
            role: () => {
                return this.user ? this.role : null;
            },
            /*token: () => {
                return this.user?.token ?? null;
            },*/
            uid: () => {
                return this.user?.uid ?? null;
            },
            synced: () => {
                return this.user?.settings.synced ?? null;
            }
        };
    }
}

/*{
    "center": [
        44.262063483480375,
        -119.53410752509649
    ],
    "pitch": 0,
    "bearing": 0,
    "toggle3d": "2d",
    "zoom": 8.816224799340164,
    "tile": "outdoors",
    "layers": {
        "avy": false,
        "trailheads": true,
        "trails": true,
        "snotel": false,
        "waypoints": true,
        "fsadmin": false,
        "contours": false,
        "radar": false
    },
    "avyOpac": 0.4
}*/