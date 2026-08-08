import { config } from './config.js';
import { global } from './state.js';

import { Weather } from '../data/weather.js';

import { saveSession, dateTime } from '../utils/helpers.js';

export class Settings {
    constructor(u) {
        this.defaultLayers = [];
        this.defaultSettings = {
            acres: 'acres',
            bearing: 0,
            center: [43.67, -117.15],
            coordsDisplay: 'dec',
            fireDisplay: 'map',
            locallySave: 'y',
            perimeters: { minSize: 500, color: 'default', zoom: 1 },
            pitch: 0,
            saveFreq: 300000,
            special: { erc: 'obs', fcstTime: null, forecastModel: 'air_temperature', otlkDay: 1, otlkType: 'fire', sfpDate: null },
            tile: 'outdoors',
            weather: { temp: 'f', wind: 'mph' },
            zoom: 5
        };

        this.user = u;
        this.role = u?.role ?? 'GUEST';
        this.settings = u?.settings?.allsettings ?? this.defaultSettings;
        this.archive = typeof historical !== 'undefined' && this.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) ? historical : null;

        this.defaultLayers = Object.values(layers.layers).flatMap(group => group.filter(f => f.default).map(f => f.id));

        this.settings.checkboxes ??= this.defaultLayers;
    }

    updateLayers(layers) {
        this.settings.checkboxes = layers;
    }

    updateSpecial() {
        const ot = document.querySelector('#otlkType'),
            od = document.querySelector('#otlkDay'),
            fm = document.querySelector('#forecastModel'),
            ft = document.querySelector('#fcstTime'),
            sf = document.querySelector('#sfpDateSelect'),
            ec = document.querySelector('#erc_time');

        this.settings.special = {
            otlkType: ot.options[ot.selectedIndex].value,
            otlkDay: od.options[od.selectedIndex].value,
            erc: ec.options[ec.selectedIndex].value,
            sfpDate: sf.options[sf.selectedIndex].value,
            forecastModel: fm.options[fm.selectedIndex].value,
            fcstTime: ft.options[ft.selectedIndex].value
        };
    }

    updatePersonal(s) {
        if (s.selectedIndex >= 0) {
            const id = s.id,
                val = s.options[s.selectedIndex].value;

            if (id == 'perimColor') {
                this.settings.perimeters.color = val;

                let c = config.perimeters.perimeterColor(val);
                const pcl = setInterval(() => {
                    if (global.map.isStyleLoaded()) {
                        clearInterval(pcl);

                        global.map.setPaintProperty('perimeters_outline', 'line-color', c)
                            .setPaintProperty('perimeters_fill', 'fill-color', c)
                            .setPaintProperty('ca_perimeters_outline', 'line-color', c)
                            .setPaintProperty('ca_perimeters_fill', 'fill-color', c);
                    }
                }, 500);
            } else if (id == 'perimTtip') {
                this.settings.perimeters.ttip = val;
            } else if (id == 'perimZoom') {
                this.settings.perimeters.zoom = val;
            } else if (id == 'tempUnit') {
                if (!this.settings.weather) this.settings.weather = {};

                this.settings.weather.temp = val;
                new Weather().updateRAWSUnits();
            } else if (id == 'windSpeedUnit') {
                if (!this.settings.weather) this.settings.weather = {};

                this.settings.weather.wind = val;
            } else if (id == 'acresUnit') {
                this.settings.acres = val;
            } else {
                this.settings[id] = val;
            }
        }
    }

    updatePSize(v) {
        this.settings.perimeters.minSize = v;
        saveSession(true);
    }

    checkboxes() {
        return this.settings['checkboxes'];
    }

    get() {
        return {
            coordsDisplay: () => {
                return this.settings['coordsDisplay'] ?? 'dec';
            },
            saveFreq: () => {
                return this.settings['saveFreq'] ?? 300000;
            },
            acres: () => {
                return this.settings['acres'] ?? 'acres';
            },
            locallySave: () => {
                return this.settings['locallySave'] ?? 'n';
            }
        };
    }

    isEnabled(id) {
        return this.checkboxes()?.includes(id) ?? false;
    }

    map() {
        return {
            lat: parseFloat(this.settings.center[0]),
            lon: parseFloat(this.settings.center[1]),
            zoom: parseInt(this.settings.zoom),
            tile: this.settings.tile,
            pitch: this.settings.pitch ? this.settings.pitch : 0,
            bearing: this.settings.bearing ? this.settings.bearing : 0
        }
    }

    getBasemap() {
        return this.settings.tile;
    }

    subscriptions() {
        const sub = new Subscription(this.user);

        return {
            valid: () => {
                return sub.valid();
            },
            customerID: () => {
                return sub.cid();
            },
            subID: () => {
                return sub.sid();
            },
            name: () => {
                return sub.name();
            },
            plan: () => {
                return sub.plan();
            },
            isTrial: () => {
                return sub.isTrial();
            },
            expires: () => {
                return sub.expires();
            }
        }
    }

    hasPermissions(levels = null) {
        const currentPlan = this.subscriptions().plan(),
            hasValidSubscription = this.subscriptions().valid(),
            requiredLevels = Array.isArray(levels) ? levels : [levels];

        if (requiredLevels.length == 0 || (this.getUser().role() == config.PERMISSION_LEVELS.ADMIN || this.getUser().role() == config.PERMISSION_LEVELS.LICENSEE)) {
            return true;
        }

        // if there is no (valid) subscription, return false
        if (!hasValidSubscription) {
            return false;
        }

        const userLevel = config.TIERS[currentPlan] || null,
            userRank = userLevel ? config.RANKS[userLevel] : 0;

        return requiredLevels.some(level => {
            const requiredRank = config.RANKS[level] || 0;
            return userRank >= requiredRank;
        });
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

    fire() {
        return {
            cache: () => {
                return this.settings.locallySave == 'y' ? true : false;
            }/*,
            display: () => {
                return this.settings.fireDisplay == 'page' ? false : true;
            }*/
        }
    }

    perimeters() {
        return {
            zoom: () => {
                const z = this.settings?.perimeters?.zoom;
                if (z == null) return true;
                return z === 1;
            },
            minSize: () => {
                return Number(this.settings.perimeters?.minSize ?? 500);
            },
            color: () => {
                return this.settings.perimeters?.color ?? 'default';
            },
            ttip: () => {
                return this.settings.perimeters?.ttip ?? 1;
            }
        };
    }

    weather() {
        return {
            wind: () => {
                return this.settings.weather?.wind ?? 'mph';
            },
            temp: () => {
                return this.settings.weather?.temp ?? 'f';
            }
        };
    }

    special() {
        return {
            erc: () => {
                return this.settings.special?.erc ?? 'obs';
            },
            otlkDay: () => {
                return this.settings.special?.otlkDay ?? 1;
            },
            otlkType: () => {
                return this.settings.special?.otlkType ?? 'severe';
            },
            sfpDate: () => {
                return this.settings.special?.sfpDate ?? '';
            },
            forecastModel: () => {
                return this.settings.special?.forecastModel ?? 'air_temperature';
            },
            fcstTime: () => {
                return this.settings.special?.fcstTime ?? '';
            }
        };
    }

    /*logMovement() {
        const sn = 'mapofire.movements',
            c = global.map.getCenter(),
            history = JSON.parse(helper.storage(sn) || '[]');

        history.push({
            g: [c.lat, c.lng, global.map.getBearing(), global.map.getPitch()],
            w: Date.now()
        });

        helper.storage(sn, JSON.stringify(history));
    }*/
}

class Subscription {
    constructor(u) {
        this.sub = null;
        this.user = u;

        if (this.user && this.user.subscriptions != null) {
            this.sub = this.user.subscriptions[0];
        }
    }

    name() {
        return this.sub?.name ?? null;
    }

    plan() {
        return this.sub?.id ?? null;
    }

    isTrial() {
        return this.sub ? (this.sub.trial == 1 ? true : false) : false;
    }

    valid() {
        return this.sub != null && this.sub.ends * 1000 > new Date().getTime() ? true : false;
    }

    cid() {
        return this.sub?.cid ?? null;
    }

    sid() {
        return this.sub?.subscription ?? null;
    }

    expires() {
        return this.sub ? dateTime(this.sub.ends, false, false, true) : null;
    }
}