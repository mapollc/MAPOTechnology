import { config } from '../app/config.js';
import { global } from '../app/state.js';

import { layerActions } from './layers.js';

export function toggleLayer(e) {
    const { id: layerId, checked } = e,
        action = layerActions[layerId],
        getLayer = config.listOfLayers.find(layer => layer.id === layerId),
        layerPerms = getLayer ? getLayer.perms : false;

    const executeToggle = (sourceId, action, checked) => {
        const visibility = checked ? 'visible' : 'none';

        if (sourceId == 'visSatellite') sourceId = 'satellite1';
        else if (sourceId == 'irSatellite') sourceId = 'satellite2';
        else if (sourceId == 'wvSatellite') sourceId = 'satellite3';

        if (global.map.getSource(sourceId)) {
            action.layers.forEach(id => global.map.setLayoutProperty(id, 'visibility', visibility));
        } else if (checked) {
            action.exe();
        }
    };

    if (!action || !config.settings.hasPermissions(layerPerms)) return;

    if (action.run) {
        action.run(checked);
    } else if (action.exe) {
        executeToggle(layerId, action, checked);
    } else {
        action.layers.forEach(id => global.map.setLayoutProperty(id, 'visibility', checked ? 'visible' : 'none'));
    }
}