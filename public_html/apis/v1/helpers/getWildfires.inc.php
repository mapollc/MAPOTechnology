<?
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
    $wheres[] = " AND (lat >= $ymin AND lat <= $ymax) AND (lon >= $xmax AND lon <= $xmin)";
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
////echo $sql;exit();
$result = mysqli_query($con, $sql);
$total = 0;

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
                'dispatch' => ($row['agency'] ? $row['agency'] : 'NWCG'),
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