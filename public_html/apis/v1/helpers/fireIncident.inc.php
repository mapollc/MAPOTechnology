<?
$useIncCache = true;

$memcache = new Memcached();
if (!count($memcache->getServerList())) $memcache->addServer('127.0.0.1', 11211);

$wfid = $_REQUEST['wfid'];
$incID = $_REQUEST['incidentID'];
$showHistory = !empty($_REQUEST['history']);

$cacheKey = 'fire-incident-' . ($incID ?: $wfid) . ($showHistory ? '_history' : '');
if ($useIncCache) {
    $cachedData = $memcache->get($cacheKey);
} else {
    $memcache->delete($cacheKey);
}

$where = $incID ? "w.incidentID = ?" : "w.wfid = ?";

$sql = "SELECT w.*, dc.name AS dcname, dc.location AS dcloc, dc.gacc AS gacc, d.agency AS org, d.area, d.unit, d.logo, ws.fuels AS fuelGroups, ws.causes, ws.behavior, ws.cost, ws.people, ws.image AS incPhoto, ws.resources AS sitRep
        FROM wildfires w 
        LEFT JOIN dispatch_centers dc ON dc.agency = w.agency
        LEFT JOIN wildfiresSupp ws ON ws.incidentID = w.incidentID
        LEFT JOIN dispatch_zones d ON d.unit = w.unit WHERE $where LIMIT 1";

// execute the query
////echo $sql;exit();

if ($useIncCache && $cachedData !== false) {
    $isCached = true;
    return $returnJson = json_decode($cachedData);
}

$row = executeQuery($incID ? 's' : 'i', [$incID ?: $wfid], $sql);

if ($row) {
    date_default_timezone_set($row['timezone'] ?: 'America/Los_Angeles');

    //// check if this fire is apart of a complex
    ////$getCmplxSQL = mysqli_query($con, "SELECT child_fire AS incidentID, child_name AS childName FROM complexes WHERE child_fire = '$row[incidentID]'");

    // check if there is any inciweb data for this fire
    $getInciweb = executeQuery(
        'iss',
        [$row['year'], "%{$row['name']}%", $row['state']],
        "SELECT incident_info, data, contact, photo, updated AS inciweb_updated, captured AS inciweb_captured
        FROM inciweb FORCE INDEX(idx_year_state_name)
        WHERE year = ? AND name LIKE ? AND state = ?
        LIMIT 1"
    );

    if ($getInciweb) $row = [...$row, ...$getInciweb];

    // if the json return needs to include the fire's acreage history changes
    $history = [];
    if ($showHistory) {
        $histResult = executeQuery(
            's',
            [$row['incidentID']],
            "SELECT acres, updated FROM acres_history WHERE incidentID = ? GROUP BY updated ORDER BY updated DESC"
        );

        if (!empty($histResult) && array_key_exists('acres', $histResult)) {
            $histResult = [$histResult];
        }

        foreach ($histResult as $track) {
            $history[] = ['acres' => (float)$track['acres'], 'updated' => (int)$track['updated']];
        }
    }

    $status = empty($row['status']) ? false : json_decode($row['status'], true);
    $contain = time() - $row['date'] < 86400 ? '0%' : 'N/A';

    // if a fire hasn't been updated in a month and is >1k acres, set the status to Out
    if (floatval($row['acres']) > 1000 && (time() - $row['updated'] > (60 * 60 * 24 * 30))) {
        $status = ['Out' => intval($row['updated'])];
    }

    if (is_array($status) && ($status['Contain'] || $status['Out'])) {
        $contain = '100%';
    }

    $url = wildfireURL($row['wfid'], $row['name'], $row['state']);
    $dispatch = $row['agency'];
    $name = incidentName($row['name'], $row['incidentID'], $row['type']);
    $notes = rtrim($row['notes']);

    $geoParts = explode(', ', $row['geo'] ?? '');
    $state = convertState($geoParts[1] ?? '', 1);

    $fuelGroups = json_decode($row['fuelGroups']);
    $causes = json_decode($row['causes']);
    $behavior = json_decode($row['behavior']);

    // create JSON Object
    $fire = [
        'geometry' => [
            'lat' => (float) $row['lat'],
            'lon' => (float) $row['lon'],
            'near' => $row['geo'] == '0 miles  of , ' ? 'Unknown' : $row['geo'],
            'geo' => !empty($row['near']) ? json_decode($row['near']) : null,
            'state' => $state
        ],
        'properties' => [
            'wfid' => (int) $row['wfid'],
            'incidentId' => $row['incidentID'],
            'fireState' => $row['state'],
            'fireName' => $name,
            'type' => $row['type'],
            'acres' => $row['acres'],
            'resources' => $row['resources'],
            'sitRep' => $row['sitRep'] != null ? json_decode($row['sitRep']) : null,
            'fuels' => !empty($fuelGroups) ? implode(', ', $fuelGroups) : $row['fuels'],
            'notes' => $notes,
            'status' => $status,
            'url' => $url,
            'image' => $row['incPhoto'],
            'display' => $row['display']
        ],
        'protection' => [
            'gacc' => $row['gacc'],
            'dispatch' => $dispatch,
            'agency' => $row['org'],
            'area' => $row['area'],
            'unit' => $row['unit'],
            'logo' => $row['logo']
        ],
        'time' => [
            'year' => (int) $row['year'],
            'discovered' => (int) $row['date'],
            'captured' => (int) $row['captured'],
            'updated' => (int) $row['updated'],
            'timezone' => $row['timezone']
        ]
    ];

    // add fire cause, behavior, and cost to output object
    if (!empty($causes)) $fire['properties']['cause'] = $causes;
    if (!empty($behavior)) $fire['properties']['behavior'] = $behavior;
    if ($row['cost'] != null) $fire['properties']['cost'] = $row['cost'];

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

        $fire['inciweb'] = $inciweb;

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
        if ($bkacres > $row['acres']) $fire['properties']['acres'] = $bkacres;

        // remove coordinates from inciweb data
        $fire['inciweb']['current']['data']['Basic Information'] = array_values(
            array_filter(
                $fire['inciweb']['current']['data']['Basic Information'],
                fn($item) => !in_array($item['desc'], ['Coordinates', 'Last Updated', 'Fire Discovered'], true)
            )
        );

        // remove size (acres) from inciweb data
        $cs = $fire['inciweb']['current']['data']['Current Situation'];
        if (!empty($cs)) {
            $situation = array_values(array_filter($cs, fn($item) => $item['desc'] !== 'Size'));
            $fire['inciweb']['current']['data']['Current Situation'] = $situation;
        }
    }

    if ($contain == '100%' && !is_array($status)) $fire['properties']['status'] = ['Contain' => -1];
    preg_match('/([0-9]+)%\s(contained|contain)/', $fire['properties']['notes'] ?? '', $nc);

    if ($nc) $contain = "$nc[1]%";
    $fire['properties']['containment'] = $status['Out'] ? '100%' : $contain;

    // add fire history if requested from API
    if ($showHistory && !empty($history)) {
        $histCalculated = [];
        for ($i = 0, $c = count($history); $i < $c; $i++) {
            $histCalculated[] = [
                'acres' => $history[$i]['acres'],
                'change' => $history[$i]['acres'] - ($history[$i + 1]['acres'] ?? $history[$i]['acres']),
                'updated' => $history[$i]['updated']
            ];
        }
        $fire['properties']['acres_history'] = $histCalculated;
    }
} else {
    $fire = ['error' => 404, 'desc' => 'No results found for ' . ($incID ? "incident ID # $incID" : "WFID #$wfid")];
}

$returnJson = ['fire' => $fire];
if ($useIncCache) $memcache->set($cacheKey, json_encode($returnJson), 1200);
