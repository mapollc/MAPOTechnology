import { config } from './config.js';
import { api, storage, Snackbar, createDialog } from '../utils/helpers.js';

export class Settings {
    constructor(u) {
        this.user = u ?? null;
        this.role = this.user?.role ?? 'GUEST';

        this.settings = u != null && u.settings.allsettings ? u.settings.allsettings : this.defaultSettings;

        if (this.getRoadReports() != null) {
            storage('favorites_roadReports', JSON.stringify(this.getRoadReports()));
        }

        if (this.getRWIS() != null) {
            storage('favorites_rwis', JSON.stringify(this.getRWIS()));
        }

        if (this.getCameras() != null) {
            storage('favorites_cameras', JSON.stringify(this.getCameras()));
        }
    }

    /*subscriptions() {
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
    }*/

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
            token: () => {
                return this.user?.token ?? null;
            },
            uid: () => {
                return this.user?.uid ?? null;
            },
            synced: () => {
                return this.user?.settings.synced ?? null;
            }
        };
    }

    favorites() {
        return this.user?.settings?.oreroads ?? null;
    }

    getCameras() {
        return this.user?.settings?.oreroads?.cameras ?? null;
    }

    getRoadReports() {
        return this.user?.settings?.oreroads?.roadReports ?? null;
    }

    getRWIS() {
        return this.user?.settings?.oreroads?.rwis ?? null;
    }

    getSyncTime() {
        return this.user?.settings?.synced ?? null;
    }

    syncFavorites(success = false) {
        const save = async (success) => {
            let data = {
                "roadReports": JSON.parse(storage('favorites_roadReports')),
                "rwis": JSON.parse(storage('favorites_rwis')),
                "cameras": JSON.parse(storage('favorites_cameras'))
            };

            //const sync = Math.round(new Date().getTime() / 1000);

            const response = await api(config.apiURL + 'oreroads', [
                ['token', this.getUser().token()],
                ['settings', JSON.stringify(data)]
            ]);

            if (response) {
                if (response.success == 1) {
                    if (success) {
                        createDialog('Sync Success', 'Your favorite road reports, cameras, and weather stations were successfully synced to your account.');
                    }
                    console.info('User favorites were successfully synced.');
                } else {
                    if (success) {
                        createDialog('Sync Error', 'There was an error syncing your favorite road reports, cameras, and weather stations to your account.');
                    }
                    console.error('There was en error syncing user favorites.');
                }
            }
        };

        if (this.user != null) {
            save(success);
        } else {
            return null;
        }
    }

    isFavorite(cat, id) {
        const s = storage('favorites_' + cat);

        if (s == null || s == 'null' || s == '') {
            return false;
        } else {
            return (JSON.parse(s).includes(id) ? true : false);
        }
    }

    doFavorites(action, category, id, title) {
        const key = `favorites_${category}`;
        const cur = storage(key);
        let favorites = cur && cur !== 'null' ? JSON.parse(cur) : [];

        id = id.toString();

        if (action === 'add') {
            if (favorites.includes(id)) {
                console.error('This item already exists in the user\'s favorites');
            } else {
                favorites.push(id);
                localStorage.setItem(key, JSON.stringify(favorites));
                Snackbar(`${title} was successfully added to your favorites.`);
            }
        } else if (action === 'remove') {
            favorites = favorites.filter(e => e !== id);
            localStorage.setItem(key, JSON.stringify(favorites));
            Snackbar(`${title} was successfully removed from your favorites.`);
        }

        storage('modTime', Math.floor(Date.now() / 1000));
    }
}