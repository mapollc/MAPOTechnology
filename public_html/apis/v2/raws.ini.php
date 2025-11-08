<?
function rating($erc) {
    global $fdra;

    if ($erc >= $fdra['rate'][0] && $erc < $fdra['rate'][1]) {
        return [
            'level' => 1,
            'class' => 'Low'
        ];
    } else if ($erc >= $fdra['rate'][1] && $erc < $fdra['rate'][2]) {
        return [
            'level' => 2,
            'class' => 'Moderate'
        ];
    } else if ($erc >= $fdra['rate'][2] && $erc < $fdra['rate'][3]) {
        return [
            'level' => 3,
            'class' => 'High'
        ];
    } else {
        return [
            'level' => 4,
            'class' => 'Extreme'
        ];
    }
}

$fireDanger = [
    'orbmc' => [
        'FDRA 1 Union-Baker County Valleys' => [
            'stns' => [352124, 352416, 352418, 352123],
            'rate' => [0, 35, 45, 53]
        ],
        'FDRA 2 Canyon Grasslands' => [
            'stns' => [351518, 351520, 351502],
            'rate' => [0, 33, 48, 61]
        ],
        'FDRA 3 Western Blues' => [
            'stns' => [351202, 351414, 352329],
            'rate' => [0, 30, 41, 54]
        ],
        'FDRA 4 John Day Valley' => [
            'stns' => [352332, 352330, 352327],
            'rate' => [0, 33, 43, 55]
        ],
        'FDRA 5 Central Blues' => [
            'stns' => [352124, 352327, 352416],
            'rate' => [0, 31, 44, 55]
        ],
        'FDRA 6 Eagle Caps' => [
            'stns' => [351518, 352418, 351502],
            'rate' => [0, 37, 48, 56]
        ],
        'FDRA 7 Northern Blues' => [
            'stns' => [351319, 351518, 453803],
            'rate' => []
        ],
        'FDRA 8 Elkhorns NFJD' => [
            'stns' => [351414, 352126, 352416],
            'rate' => []
        ]
    ]
];

$fdra = $fireDanger[$_REQUEST['dispatch']][$_REQUEST['area']];
$stns = implode(',', $fdra['stns']);

$json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/DRAFT_NFDRS_v3_view/FeatureServer/0/query?where=' . urlencode('NWSID_Clean IN ('.$stns.')') . '&f=json&returnGeometry=false&outFields=AVG%28ec%29+AS+erc'));

$erc = round($json->features[0]->attributes->erc, 0);

$returnJson = [
    'dispatch' => $_REQUEST['dispatch'],
    'fdra' => $_REQUEST['area'],
    'fd' => [
        'erc' => $erc,
        'rating' => rating($erc)
    ]
];