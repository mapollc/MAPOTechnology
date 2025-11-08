<?
$lay = array(
    'fire' => [
        [
            'id' => 'newFires',
            'name' => 'New Fires',
            'perms' => false,
            'perms2' => [],
            'default' => true,
            'app' => true
        ],
        [
            'id' => 'allFires',
            'name' => 'All Fires',
            'perms' => false,
            'perms2' => [],
            'default' => true,
            'app' => true
        ],
        [
            'id' => 'smokeChecks',
            'name' => 'Smoke Checks',
            'perms' => false,
            'perms2' => [],
            'default' => true,
            'app' => true
        ],
        [
            'id' => 'rxBurns',
            'name' => 'Prescribed Burns',
            'perms' => false,
            'perms2' => [],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'perimeters',
            'name' => 'Wildfire Perimeters',
            'perms' => false,
            'perms2' => [],
            'default' => true,
            'app' => true
        ],
        [
            'id' => 'modis24',
            'name' => '24-hr Satellite Heat Detection',
            'perms' => false,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'modis48',
            'name' => '48-hr Satellite Heat Detection',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'modis72',
            'name' => '72-hr Satellite Heat Detection',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ]
    ],
    'evac' => [
        [
            'id' => 'evac',
            'name' => 'Evacuations',
            'perms' => false,
            'perms2' => [],
            'default' => false,
            'app' => true
        ]
    ],
    'wx' => [
        [
            'id' => 'lightning1',
            'name' => '1-hr Lightning',
            'perms' => false,
            'perms2' => ['PREMIUM'],
            'default' => true,
            'app' => true
        ],
        [
            'id' => 'lightning24',
            'name' => '24-hr Lightning',
            'perms' => false,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => true,
            'app' => true
        ],
        [
            'id' => 'airq',
            'name' => 'Air Quality',
            'perms' => false,
            'perms2' => [],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'wwas',
            'name' => 'Weather Alerts',
            'perms' => false,
            'perms2' => [],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'spc',
            'name' => 'Outlooks',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],       
        [
            'id' => 'stns',
            'name' => 'Current Observations',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'radar',
            'name' => 'Doppler Radar',
            'perms' => false,
            'perms2' => [],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'ndfd',
            'name' => 'Forecast Models',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'visSatellite',
            'name' => 'Visible Satellite',
            'perms' => false, 'perms2' => [],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'irSatellite',
            'name' => 'Infrared Satellite',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'wvSatellite',
            'name' => 'Water Vapor Satellite',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ]
    ],
    'plan' => [
        /*[
            'id' => 'nfdrs',
            'name' => 'Fire Danger',
            'perms' => false, 'perms2' => [],
            'default' => false,
            'app' => true
        ],*/
        [
            'id' => 'erc',
            'name' => 'Energy Release Component',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'ev',
            'name' => 'PNW Evacuation Vulnerability',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'sfp',
            'name' => 'Significant Fire Potential',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'nri',
            'name' => 'Wildfire Risk Index',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'rth',
            'name' => 'Wildfire Risk to Homes',
            'perms' => false,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'bp',
            'name' => 'Wildfire Likelihood',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'whp',
            'name' => 'Wildfire Hazard Potential',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'drought',
            'name' => 'Drought Monitor',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'fuels',
            'name' => 'Fuels/Vegetation',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ]
    ],
    'gis' => [
        /*[
            'id' => 'countyBounds',
            'name' => 'County Boundaries',
            'perms' => false, 'perms2' => [],
            'default' => false,
        ],*/
        [
            'id' => 'nwsCWAs',
            'name' => 'NWS County Warning Areas',
            'perms' => false,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'roads',
            'name' => 'USFS Road Network',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'lands',
            'name' => 'Federal Lands',
            'perms' => false,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'plss',
            'name' => 'Township Range Section',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'dispatch',
            'name' => 'Dispatch Boundaries',
            'perms' => false,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'gaccBounds',
            'name' => 'GACC Boundaries',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ]
    ],
    'smoke' => [
        [
            'id' => 'hms',
            'name' => 'Smoke Detection',
            'perms' => true,
            'perms2' => ['PREMIUM'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'smokeFcst',
            'name' => 'Smoke Forecast',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'sfcSmoke',
            'name' => 'Surface Smoke',
            'perms' => false,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'viSmoke',
            'name' => 'Vertically Integrated Smoke',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ]
    ],
    'state' => [
        [
            'id' => 'odfFDR',
            'name' => 'ODF Fire Danger',
            'perms' => true,
            'perms2' => ['PREMIUM', 'PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'cdfFHSZ',
            'name' => 'CA Fire Hazard Severity Zones',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'calfireUnits',
            'name' => 'Cal Fire Administrative Units',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ],
        [
            'id' => 'calfireAircraft',
            'name' => 'Cal Fire Aircraft',
            'perms' => true,
            'perms2' => ['PRO'],
            'default' => false,
            'app' => true
        ]
    ]
);

$layerDesc = array(
    'fire' => [
        'New wildfires in the last 12 hours',
        'All wildfire incidents reported more than 12 hours ago',
        'Non-wildfire, smoke checks reported to dispatch centers',
        'Active or planned prescribed burns',
        'Show latest, active mapped wildfire perimeters (some fires only)',
        'See hotspots in the last 24 hours',
        'See hotspots over the last 24-48 hours',
        'See hotspots over the last 48-72 hours'
    ],
    'evac' => [
        'See detailed mapping of evacuation areas in Oregon & California'
    ],
    'wx' => [
        'Overlay lightning strikes within the last hour',
        'Overlay lightning strikes from the last 24 hours',
        'See current air quality conditions from the EPA',
        'View current weather alerts from the NWS',
        'Review current severe & fire outlooks from the SPC',
        'View observed and forecasted energy release component (ERC) values for fire danger',
        /*'Read the technical fire weather forecast from the NWS',*/
        'See current weather obs at remote automatic weather stations (RAWS)',
        'See radar imagery from the last 2 hours',
        'Visualize various weather forecast models',
        'Visualize the most recent visible satellite imagery',
        'Visualize the most recent infrared satellite imagery',
        'Visualize the most recent water vapor satellite imagery'
    ],
    'plan' => [
        'See current national fire danger (NFDRS)',
        'View evacuation vulnerabilities from the PNW\'s most rural areas',
        'Show significant fire potential outlooks',
        'See each county\'s wildfire risk based on annual loss, vulnerability & resilience',
        'Overlay wildfire risk to homes model',
        'Overlay wildfire likelihood (burn probability) model',
        'Overlay wildfire supression difficulty model',
        'Overlay current drought conditions',
        'Overlay fuel/vegatation LANDFIRE model',
    ],
    'gis' => [
        //'Overlay counties boundaries',
        'Overlay NWS county warning areas',
        'Show USFS road network',
        'Show federal land ownership',
        'Overlay TRS boundaries',
        //'Show USFS national forest & wilderness boundaries',
        'Show interagency dispatch center boundaries',
        'Show national Geographic Area Coordination Centers (GACCs)'
    ],
    'smoke' => [
        'Overlay NOAA\'s smoke detection and concentrations from GOES-16 & 18 satellite data',
        'See surface smoke forecast for the next hour',
        'See HRRR near-surface smoke models (µg/m<sup>3</sup>)',
        'See HRRR vertically integrated smoke models (µg/m<sup>3</sup>)'
    ],
    'state' => [
        'Public fire danger on Oregon Department of Forestry lands',
        'Overlay Cal Fire administrative unit boundaries',
        'Overlay Cal Fire fire hazard severity zones (FHSZ)',
        'Track Cal Fire\'s firefighting aircraft'
    ]
);

foreach ($lay as $k => $v) {    
    for ($i = 0; $i < count($lay[$k]); $i++) {
        $lay[$k][$i]['desc'] = $layerDesc[$k][$i];
        $count++;
    }
}

$layers = array(
    'categories' => array(
        'fire' => 'Wildfire',
        'evac' => 'Evacuations',
        'wx' => 'Weather',
        'plan' => 'Planning Tools',
        'gis' => 'GIS Layers',
        'smoke' => 'Smoke',
        'state' => 'State-Specific'
    ),
    'layers' => $lay
);

if (isset($_REQUEST['json'])) {
    $ts = gmdate("D, d M Y H:i:s", time() + 60 * 60 * 24 * 14) . ' GMT';
    header('Expires: '.$ts);
    header('Pragma: cache');
    header('Cache-control: max-age='.$ts);
    header('Content-type: application/json');

    echo json_encode($layers);
}