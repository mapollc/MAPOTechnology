import { config } from '../app/config.js';
import maplibregl from '../map/maplibre.js';
import { ucwords, setHeaders, unsetHeaders } from '../utils/helpers.js';

function ing(t) {
    return t.endsWith('e')
        ? t.slice(0, -1) + 'ing'
        : (t.endsWith('i') || t.endsWith('b') ? t + 'ing' : t);
}

export function updateTaxonomy(isTrail, index, value) {
    const activity = index === 0 ? null : value.replace(/\s/, '-').toLowerCase();

    config.taxonomy.category = isTrail ? 'trail' : 'snow';
    config.taxonomy.activity = activity;

    if (activity == null) {
        unsetHeaders();
    } else {
        setHeaders(
            `${activity ? ing(ucwords(activity.replace('-', ' '))) : ''} Trail Maps`,
            `${isTrail ? 'trail' : 'snow'}/${activity}`
        );
    }
}

export class TerrainControl {
    onAdd(map) {
        this.map = map;

        this.container = document.createElement('div');
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        const button = document.createElement('button');
        button.dataset.mode = '2d';
        button.type = 'button';
        button.className = 'maplibregl-ctrl-terrain ttip';
        button.title = 'Toggle 3D terrain';
        button.innerHTML = '3D';

        // button click listener
        button.addEventListener('click', () => {
            const is3d = button.dataset.mode === '2d';

            button.dataset.mode = is3d ? '3d' : '2d';
            button.innerHTML = is3d ? '2D' : '3D';
            config.settings.toggle3d(is3d);

            is3d ? config.layersHandler.addTerrain() : global.map.setTerrain(null);
        });

        this.container.appendChild(button);

        return this.container;
    }

    onRemove() {
        this.container?.remove();
        this.map = null;
    }
}

export class MFAttribControl extends maplibregl.AttributionControl {
    constructor(options) {
        super(options);

        this._collapseBelow = options.collapseBelow ?? 500;
    }

    onAdd(map) {
        const container = super.onAdd(map);
        map.on('resize', this._applyViewportRule);
        this._applyViewportRule();
        return container;
    }

    onRemove() {
        if (this._map) this._map.off('resize', this._applyViewportRule);
        super.onRemove();
    }

    _applyViewportRule = () => {
        if (!this._map || !this._container) return;

        const width = this._map.getCanvasContainer().offsetWidth;
        const shouldShow = width > this._collapseBelow;

        // Explicitly NOT compact → always open
        if (this.options?.compact === false) {
            this._container.classList.remove('maplibregl-compact', 'maplibregl-compact-show');
            this._container.setAttribute('open', '');
            return;
        }

        // Compact mode is ON (default MapLibre behavior)
        this._container.classList.add('maplibregl-compact');

        if (shouldShow) {
            // Expanded compact attribution
            this._container.classList.add('maplibregl-compact-show');
            this._container.setAttribute('open', '');
        } else {
            // Collapsed compact attribution
            this._container.classList.remove('maplibregl-compact-show');
            this._container.removeAttribute('open');
        }
    };

    _updateAttributions() {
        ////super._updateAttributions();
        this._innerContainer.innerHTML = `<a target="blank" href="https://maplibre.org/">MapLibre</a> | ` +
            `© <a target="blank" href="https://www.esri.com">Esri</a>, ` +
            `<a target="blank" href="https://mapterhorn.com">Mapterhorn</a>, ` +
            `<a target="blank" href="https://carto.com/about-carto/" rel="noopener">CARTO</a>, ` +
            `<a target="blank" href="http://www.openstreetmap.org/about/">OpenStreetMap</a> contributors`;
    }
}