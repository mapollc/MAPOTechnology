<?
$wfid = $_REQUEST['wfid'];
$incID = $_REQUEST['incidentID'];
$cachefilename = 'fire-incident-' . ($incID ? $incID : $wfid) . ($_REQUEST['history'] ? '_history' : '');

$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211);
$cache = $memcache->get($cachefilename);

if (!$cache || filemtime(root() . 'fire-info.ini.php') > $memcache->get($cachefilename . '-time')) {
    $where = $incID ? "w.incidentID = ?" : "w.wfid = ?";

    $sql = "SELECT w.*, dc.name AS dcname, dc.location AS dcloc, dc.gacc AS gacc, d.agency AS org, d.area, d.unit, d.logo, ws.fuels AS fuelGroups, ws.causes, ws.behavior, ws.cost, ws.people FROM wildfires AS w 
        LEFT JOIN dispatch_centers AS dc ON dc.agency = w.agency
        LEFT JOIN wildfiresSupp AS ws ON ws.incidentID = w.incidentID
        LEFT JOIN dispatch_zones AS d ON d.unit = w.unit WHERE $where LIMIT 1";

    // execute the query
    ////echo $sql;
    $row = prepareQuery($incID ? 's' : 'i', [$incID ? $incID : $wfid], $sql);

    if ($row) {
        date_default_timezone_set($row['timezone'] ? $row['timezone'] : 'America/Los_Angeles');

        // check if this fire is apart of a complex
        ////$getCmplxSQL = mysqli_query($con, "SELECT child_fire AS incidentID, child_name AS childName FROM complexes WHERE child_fire = '$row[incidentID]'");

        // check if there is any inciweb data for this fire
        $getInciweb = mysqli_fetch_assoc(mysqli_query($con, "SELECT incident_info, data, contact, photo, updated AS inciweb_updated, captured AS inciweb_captured FROM inciweb WHERE year = $row[year] AND name LIKE '%$row[name]%' AND state = '$row[state]' LIMIT 1"));

        if ($getInciweb) {
            $row = array_merge($row, $getInciweb);
        }

        // if the json return needs to include the fire's acreage history changes
        if ($_REQUEST['history']) {
            $result = mysqli_query($con, "SELECT acres, updated FROM acres_history WHERE incidentID = '$row[incidentID]' ORDER BY updated DESC");
            while ($track = mysqli_fetch_assoc($result)) {
                $history[] = ['acres' => floatval($track['acres']), 'updated' => floatval($track['updated'])];
            }
        }

        $url = wildfireURL($row['wfid'], $row['name'], $row['state']);
        $dispatch = $row['agency'];
        $contain = time() - $row['date'] < 86400 ? '0%' : 'N/A';
        $name = incidentName($row['name'], $row['incidentID'], $row['type']);
        $notes = rtrim($row['notes']);
        $status = $row['status'] != '' ? unserialize($row['status']) : false;
        $state = convertState(explode(', ', $row['geo'])[1], 1);
        $fuelGroups = json_decode($row['fuelGroups']);
        $causes = json_decode($row['causes']);
        $behavior = json_decode($row['behavior']);

        // if a fire hasn't been updated in a month and is >1k acres, set the status to Out
        if (floatval($row['acres']) > 1000 && (time() - $row['updated'] > (60 * 60 * 24 * 30))) {
            $status = ['Out' => intval($row['updated'])];
        }

        if (is_array($status) && ($status['Contain'] || $status['Out'])) {
            $contain = '100%';
        }
        
        // create JSON Object
        $fire = [
            'geometry' => [
                'lat' => floatval($row['lat']),
                'lon' => floatval($row['lon']),
                'near' => $row['geo'] == '0 miles  of , ' ? 'Unknown' : $row['geo'],
                'geo' => $row['near'] != '' ? json_decode($row['near']) : null,
                'state' => $state
            ],
            'properties' => [
                'wfid' => intval($row['wfid']),
                'incidentId' => $row['incidentID'],
                'fireState' => $row['state'],
                'fireName' => $name,
                'type' => $row['type'],
                'acres' => $row['acres'],
                'resources' => $row['resources'],
                'fuels' => $row['fuels'],
                'notes' => $notes,
                'status' => $status,
                'url' => $url,
                'display' => $row['display']
            ]
        ];

        $protection = [
            'gacc' => $row['gacc'],
            'dispatch' => $dispatch,
            'agency' => $row['org'],
            'area' => $row['area'],
            'unit' => $row['unit'],
            'logo' => $row['logo']
        ];

        $timeObject = [
            'year' => intval($row['year']),
            'discovered' => intval($row['date']),
            'captured' => intval($row['captured']),
            'updated' => intval($row['updated']),
            'timezone' => $row['timezone']
        ];

        if (!empty($fuelGroups)) {
            $fire['properties']['fuels'] = implode(', ', $fuelGroups);
        }

        if (!empty($causes)) {
            $fire['properties']['cause'] = $causes;
        }

        if (!empty($behavior)) {
            $fire['properties']['behavior'] = $behavior;
        }

        if ($row['cost'] != null) {
            $fire['properties']['cost'] = $row['cost'];
        }

        /*if (mysqli_num_rows($getCmplxSQL)) {
            while ($cmp = mysqli_fetch_assoc($getCmplxSQL)) {
                $fire['properties']['complex'][] = $cmp;
            }
        }*/

        if ($row['incident_info'] || $row['data']) {
            $contact = unserialize($row['contact']);
            $inciweb = array('incident_info' => $row['incident_info'], 'current' => unserialize($row['data']));

            if ($row['photo']) {
                $ph = unserialize($row['photo']);
                $inciweb['photo'] = array('url' => $ph[0], 'caption' => $ph[1]);
            }

            $inciweb['contacts'] = empty($contact['contact']) && empty($contact['pio']) ? null : $contact;
            $inciweb['updated'] = floatval($row['inciweb_updated']);

            $fire['inciweb'] = $inciweb;

            // remove coordinates form inciweb data
            for ($i = 0; $i < count($fire['inciweb']['current']['data']['Basic Information']); $i++) {
                if ($fire['inciweb']['current']['data']['Basic Information'][$i]['desc'] == 'Coordinates') {
                    unset($fire['inciweb']['current']['data']['Basic Information'][$i]);
                }
            }

            $aa = unserialize($row['data']);
            foreach ($aa['data']['Current Situation'] as $o) {
                if ($o['desc'] == 'Size') {
                    $bkacres = str_replace([' Acres', ','], ['', ''], $o['info']);
                    break;
                }
            }

            // if acreage reported by inciweb is greater than acres reported by dispatch, use inciweb
            if ($bkacres > $row['acres']) {
                $fire['properties']['acres'] = $bkacres;
            }

            foreach ($aa['data']['Current Situation'] as $k) {
                if ($k['desc'] == 'Containment') {
                    $contain = $k['info'];
                    break;
                }
            }
        }

        if ($contain == '100%' && !is_array($status)) {
            $fire['properties']['status'] = ['Contain' => -1];
        }

        preg_match('/([0-9]+)%\s(contained|contain)/', $fire['properties']['notes'], $nc);

        if ($nc) {
            $contain = "$nc[1]%";
        }

        $fire['properties']['containment'] = $contain;

        if ($_REQUEST['history']) {
            if ($history) {
                for ($i = 0; $i < count($history); $i++) {
                    $x = $i + 1;
                    $hist[] = array(
                        'acres' => $history[$i]['acres'],
                        'change' => $history[$i]['acres'] - $history[$x]['acres'],
                        'updated' => $history[$i]['updated']
                    );
                }
            } else {
                $hist = null;
            }

            $fire['properties']['acres_history'] = $hist;
        }
        
        $fire['protection'] = $protection;
        $fire['time'] = $timeObject;
    } else {
        $fire = array('error' => 404, 'desc' => 'No results found for ' . ($incID ? 'incident ID #' . $incID : 'WFID #' . $wfid));
    }

    $returnJson = array('fire' => $fire);
    $memcache->set($cachefilename, json_encode($returnJson), 1200);
    $memcache->set($cachefilename . '-time', time(), 1200);
} else {
    $isCached = true;
    $cache = json_decode($cache);
    $returnJson = $cache;
}
