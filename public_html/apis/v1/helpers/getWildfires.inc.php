<?
if ($category == 'complexes') {
    $features = [];
    $year = date('Y');
    $result = mysqli_query($con, "SELECT year, incidentID, name, lat, lon, child_fire, child_name, c.unit, agency, area, logo
        FROM complexes c
        LEFT JOIN dispatch_zones dz ON dz.unit = c.unit
        WHERE year = $year
        ORDER BY name, child_name");

    while ($row = mysqli_fetch_assoc($result)) {
        $id = $row['incidentID'];

        // check if there is any inciweb data for this fire
        $getInciweb = executeQuery(
            'is',
            [$row['year'], "%{$row['name']}%"],
            "SELECT incident_info, data, contact, photo, updated AS inciweb_updated, captured AS inciweb_captured
                    FROM inciweb FORCE INDEX(idx_year_state_name)
                    WHERE year = ? AND name LIKE ?
                    LIMIT 1"
        );

        if ($getInciweb) $row = [...$row, ...$getInciweb];

        if (!isset($features[$id])) {
            $features[$id] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [
                        (float)$row['lon'],
                        (float)$row['lat']
                    ]
                ],
                'properties' => [
                    'incidentID' => $row['incidentID'],
                    'name'       => $row['name'],
                    'year'       => (int)$row['year'],
                    'protection' => [
                        'agency' => $row['agency'],
                        'area'   => $row['area'],
                        'unit'   => $row['unit'],
                        'logo'   => $row['logo']
                    ],
                    'children'   => []
                ]
            ];

            // create inciweb json object
            if (!empty($row['incident_info']) || !empty($row['data'])) {
                $bkacres = '';
                $contact = json_decode($row['contact'], true);
                $inciweb = ['incident_info' => $row['incident_info'], 'current' => json_decode($row['data'], true)];

                if ($row['photo']) {
                    $ph = json_decode($row['photo'], true);
                    $inciweb['photo'] = ['url' => $ph[0], 'caption' => $ph[1]];
                }

                $inciweb['contacts'] = empty($contact['contact']) && empty($contact['pio']) ? null : $contact;
                $inciweb['updated'] = floatval($row['inciweb_updated']);

                $features[$id]['properties']['inciweb'] = $inciweb;

                $aa = json_decode($row['data'], true);
                foreach (($aa['data']['Current Situation'] ?? []) as $k) {
                    if ($k['desc'] == 'Size') {
                        $bkacres = str_replace([' Acres', ','], ['', ''], $k['info']);
                    }

                    if ($k['desc'] == 'Containment') {
                        $contain = $k['info'];
                    }
                }

                // if acreage reported by inciweb is greater than acres reported by dispatch, use inciweb
                if ($bkacres > $row['acres']) {
                    $fire['properties']['acres'] = $bkacres;
                }

                // remove coordinates from inciweb data
                $seen = [];
                $features[$id]['properties']['inciweb']['current']['data']['Basic Information'] = array_values(
                    array_filter(
                        $features[$id]['properties']['inciweb']['current']['data']['Basic Information'],
                        function ($item) use (&$seen) {
                            if (in_array($item['desc'], [
                                'Coordinates',
                                'Last Updated',
                                'Fire Discovered'
                            ], true)) {
                                return false;
                            }

                            if (isset($seen[$item['desc']])) {
                                return false;
                            }

                            $seen[$item['desc']] = true;
                            return true;
                        }
                    )
                );

                // remove size (acres) from inciweb data
                $cs = $features[$id]['properties']['inciweb']['current']['data']['Current Situation'];
                if (!empty($cs)) {
                    $situation = array_values(array_filter($cs, fn($item) => $item['desc'] !== 'Size'));
                    $features[$id]['properties']['inciweb']['current']['data']['Current Situation'] = $situation;
                }
            }
        }

        $features[$id]['properties']['children'][] = [
            'incidentID' => $row['child_fire'],
            'name'       => $row['child_name']
        ];
    }

    return $returnJson = ['type' => 'FeatureCollection', 'features' => array_values($features)];
}

$moreThanJustAll = ['smk', 'rx', 'all,new', 'all,new,smk', 'all,new,rx', 'all,new,smk,rx', 'smk,rx', 'canada'];

$wheres = [];
$sql = "SELECT w.wfid, w.incidentID, w.name, w.state, w.agency, w.type, w.acres, w.status, 
    w.notes, w.resources, w.fuels, w.geo, w.near, w.lat, w.lon, w.year, w.date, 
    w.captured, w.updated, w.timezone, dc.gacc FROM wildfires w FORCE INDEX (idx_filter) LEFT JOIN dispatch_centers dc ON dc.agency = w.agency WHERE display = 1 AND ";

// if retrieving archived fires
if ($_REQUEST['archive']) {
    $wheres[] = "date >= " . strtotime('1/1/' . $_REQUEST['archive'] . ' 00:00:00') . " AND date <= " . strtotime('12/31/' . $_REQUEST['archive'] . ' 23:59:59');
} else {
    // filter by date/time range
    if ($_REQUEST['start'] && $_REQUEST['end']) {
        $wheres[] = "date >= {$_REQUEST['start']} AND date <= {$_REQUEST['end']} AND ";
    } else {
        // new fires, within the last 12 hours
        if ($category == 'new') {
            $wheres[] = "date >= " . strtotime('-12 hours') . " AND ";
            // all, new, rx or smoke checks
        } else if (in_array($category, $moreThanJustAll)) {
            $wheres[] = "";
            // all fires, older than 12 hours ago
        } else {
            $wheres[] = "date < " . strtotime('-12 hours') . " AND ";
        }
    }
    $wheres[] = "year = $year AND ";

    $typeMap = [
        'all' => ['Wildfire', 'Complex'],
        'new' => ['Wildfire', 'Complex'],
        'all,new' => ['Wildfire', 'Complex'],
        'canada' => ['Wildfire', 'Complex'],
        'smk' => ['Smoke Check'],
        'rx' => ['Prescribed Fire'],
        'all,new,smk' => ['Wildfire', 'Complex', 'Smoke Check'],
        'all,new,rx' => ['Wildfire', 'Complex', 'Prescribed Fire'],
        'all,new,smk,rx' => ['Wildfire', 'Complex', 'Smoke Check', 'Prescribed Fire']
    ];

    if (isset($typeMap[$category])) {
        $types = "'" . implode("','", $typeMap[$category]) . "'";
        $wheres[] = " type IN ($types)";
    } else {
        return $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The type of wildfire data requested does not exist.'];
    }
}

// filter by agency
if ($_REQUEST['agency'] == 'NWCG') {
    $wheres[] = " AND agency = ''";
} else if ($_REQUEST['agency']) {
    $wheres[] = " AND agency = '{$_REQUEST['agency']}'";
}

// filter by state
if ($_REQUEST['state']) {
    $wheres[] = " AND state = '{$_REQUEST['state']}'";
}

// if retrieving wildfires based on bounding box
if (isset($_REQUEST['bbox'])) {
    $wheres[] = " AND ((lat BETWEEN $ymin AND $ymax) AND (lon BETWEEN $xmin AND $xmax))";
}

// finish sql statement
$sortColumn = $_REQUEST['order'] ?? 'date';
$allowedSorts = ['date', 'updated', 'acres', 'captured', 'name'];

if (!in_array($sortColumn, $allowedSorts, true)) $sortColumn = 'date';

$sql .= implode(' AND ', $wheres) . " ORDER BY $sortColumn DESC";
$sql = str_replace(' AND  AND ', ' AND ', $sql);

////if ($category == 'test') {
////$sql = "SELECT * FROM wildfires WHERE geo LIKE '%la grande%' AND year = 2024 AND display = 1 ORDER BY date DESC LIMIT 5";
////}

// run MySQL query
////if ($_GET['test'] == 1) {echo $sql;exit();}
$result = mysqli_query($con, $sql);
$total = 0;
$features = [];

while ($row = mysqli_fetch_assoc($result)) {
    $status = !empty($row['status']) ? json_decode($row['status']) : [];

    if ($category == 'test') {
        $show_fire = true;
    } else {
        $show_fire = wildfireAlgorithm($category, $row['type'], $status, $row, $_REQUEST['archive'], false);
    }

    if ($show_fire && $row['state'] != '') {
        if (!isset($_REQUEST['bbox']) || ($_REQUEST['bbox'] && bbox($_REQUEST['bbox'], $row['lat'], $row['lon']))) {
            $name = incidentName($row['name'], $row['incidentID'], $row['type']);
            $url = wildfireURL($row['wfid'], $name, $row['state']);

            if (strpos($row['incidentID'], '-NWCG-') !== false) {
                $inciweb[] = $row['state'] . $name;
            }

            // if a fire hasn't been updated in a month and is >1k acres, set the status to Out
            if (floatval($row['acres']) > 1000 && time() - $row['updated'] > 60 * 60 * 24 * 30) {
                $status = ['Out' => intval($row['updated'])];
            }

            $zone = dispatchZones($row['incidentID']);
            $fire = [
                'wfid' => (int)$row['wfid'],
                'incidentId' => $row['incidentID'],
                'county' => json_decode($row['near'])->county,
                'state' => $row['state'],
                'dispatch' => $row['agency'] ?: 'NWCG',
                'name' => $name,
                'type' => $row['type'],
                'acres' => floatval($row['acres']),
                'status' => empty($status) ? '' : $status,
                'notes' => $row['notes'],
                'resources' => $row['resources'],
                'fuels' => $row['fuels'],
                'near' => $row['geo'],
                'url' => $url,
                'protection' => [
                    'gacc' => $row['gacc'] ?? null,
                    'agency' => $zone->agency,
                    'area' => $zone->area,
                    'logo' => $zone->logo
                ],
                'time' => [
                    'year' => intval($row['year']),
                    'discovered' => floatval($row['date']),
                    'captured' => floatval($row['captured']),
                    'updated' => floatval($row['updated']),
                    'timezone' => $row['timezone']
                ]
            ];

            $features[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [
                        floatval($row['lon']),
                        floatval($row['lat'])
                    ]
                ],
                'properties' => $fire
            ];

            $total++;
        }
    }
}

// remove duplicate inciweb fires from features array
if ($inciweb) {
    $n = 0;
    foreach ($features as $a) {
        $prop = $a['properties'];
        if (in_array($prop['state'] . $prop['name'], $inciweb) && $prop['type'] != 'Complex' && $prop['dispatch'] == 'NWCG') {
            unset($features[$n]);
            $total -= 1;
        }
        $n++;
    }
}

if ($features) {
    $features = array_values($features);
}

$returnJson = ['type' => 'FeatureCollection', 'features' => $features, 'totalFires' => $total];
