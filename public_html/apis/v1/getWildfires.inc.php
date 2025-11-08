<?
$dzones = json_decode(file_get_contents('../cron/dispatch_zones.json'));
////$sql = "SELECT w.*, i.data FROM wildfires AS w LEFT JOIN inciweb AS i ON i.state = w.state AND i.name = w.name AND i.year = w.year WHERE w.agency ".($category == 'canada' ? "= 'CIFFC'" : "!= 'CIFFC'")." AND ";
$sql = "SELECT * FROM wildfires WHERE agency != 'CIFFC' AND ";

// if retrieving archived fires
if ($_REQUEST['archive']) {
    $sql .= "date >= ".strtotime('1/1/'.$_REQUEST['archive'].' 00:00:00')." AND date <= ".strtotime('12/31/'.$_REQUEST['archive'].' 23:59:59');
} else {
    // filter by date/time range
    if ($_REQUEST['start'] && $_REQUEST['end']) {
        $sql .= "date >= ".$_REQUEST['start']." AND date <= ".$_REQUEST['end']." AND ";
    } else {
        $sql .= "year = '$year' AND ";

        // new fires, within the last 12 hours
        if ($category == 'new') {
            $sql .= "date >= ".strtotime('-12 hours')." AND ";
        // all, new, rx or smoke checks
        } else if ($category == 'smk' || $category == 'rx' || $category == 'all,new' || $category == 'all,new,smk' || $category == 'all,new,rx' || $category == 'all,new,smk,rx' || $category == 'smk,rx' || $category == 'canada') {
            $sql .= "";
        // all fires, older than 12 hours ago
        } else {
            $sql .= "date < ".strtotime('-12 hours')." AND ";
        }
    }
    if ($category == 'all' || $category == 'new' || $category == 'all,new' || $category == 'canada') {
        $sql .= "(type = 'Wildfire' OR type = 'Complex')";
    } else if ($category == 'smk') {
        $sql .= "type = 'Smoke Check'";
    } else if ($category == 'rx') {
        $sql .= "type = 'Prescribed Fire'";
    } else if ($category == 'all,new,smk') {
        $sql .= "(type = 'Wildfire' OR type = 'Complex' OR type = 'Smoke Check')";
    } else if ($category == 'all,new,rx') {
        $sql .= "(type = 'Wildfire' OR type = 'Complex' OR type = 'Prescribed Fire')";
    } else if ($category == 'all,new,smk,rx') {
        $sql .= "(type = 'Wildfire' OR type = 'Complex' OR type = 'Smoke Check' OR type = 'Prescribed Fire')";
    }
}

// filter by agency
if ($_REQUEST['agency'] == 'NWCG') {
    $sql .= " AND agency = ''";
} else if ($_REQUEST['agency']) {
    $sql .= " AND agency = '".$_REQUEST['agency']."'";
}

// filter by state
if ($_REQUEST['state']) {
    $sql .= " AND state = '".$_REQUEST['state']."'";
}

// looks to exclude any fires that have already been out for 3 days or more (to help speed up queries)
/*if (!isset($_REQUEST['archive']) && (!$_REQUEST['start'] || !$_REQUEST['end'])) {
    $outAgo = strtotime('-3 days');
    $sql .= " AND (status NOT LIKE '%s:3:\"Out\";%' OR (status LIKE '%s:3:\"Out\";%' AND REPLACE(SUBSTRING_INDEX(status, '\"Out\";i:', -1), \";}\", \"\") > ".$outAgo."))";
}*/

if (isset($_REQUEST['bbox'])) {
    $sql .= " AND (lat >= ".$ymin." AND lat <= ".$ymax.") AND (lon >= ".$xmax." AND lon <= ".$xmin.")";
}

// finish sql statement
$sql .= " AND display = 1 ORDER BY ".($_REQUEST['order'] ? /*($_REQUEST['order'] == 'acres' ? 'CAST(acres AS float)' : */$_REQUEST['order']/*)*/ : 'date')." DESC";
$sql = str_replace(' AND  AND ', ' AND ', $sql);

/*if ($category == 'test') {
    $sql = "SELECT * FROM wildfires WHERE geo LIKE '%la grande%' AND year = 2024 AND display = 1 ORDER BY date DESC LIMIT 5";
}*/

////echo $sql;exit();
$result = mysqli_query($con, $sql);
$total = 0;

while ($row = mysqli_fetch_assoc($result)) {
    $status = unserialize($row['status']);
    if ($category == 'test') {
        $show_fire = true;
    } else {
        $show_fire = wildfireAlgorithm($category, $row['type'], $status, $row, $_REQUEST['archive']);
    }

    if ($show_fire && $row['state'] != '') {
        if (!isset($_REQUEST['bbox']) || ($_REQUEST['bbox'] && bbox($_REQUEST['bbox'], $row['lat'], $row['lon']))) {
            $name = incidentName($row['name'], $row['incidentID'], $row['type']);
            $url = wildfireURL($row['wfid'], $name, $row['state']);

            if (strpos($row['incidentID'], '-NWCG-') !== false) {
                $inciweb[] = $row['state'].$name;
            }
            
            // if a fire hasn't been updated in a month and is >1k acres, set the status to Out
            if (floatval($row['acres']) > 1000 && (time() - $row['updated'] > (60 * 60 * 24 * 30))) {
                $status = ['Out' => intval($row['updated'])];
            }

            $zone = dispatchZones($row['incidentID']);
            $fire = array('wfid' => $row['wfid'],
                            'incidentId' => $row['incidentID'],
                            'state' => $row['state'],
                            'dispatch' => ($row['agency'] ? $row['agency'] : 'NWCG'),
                            'name' => $name,
                            'type' => $row['type'],
                            'acres' => floatval($row['acres']),
                            'status' => ($status ? $status : ''),
                            'notes' => $row['notes'],
                            'resources' => $row['resources'],
                            'fuels' => $row['fuels'],
                            'near' => $row['geo'],
                            'url' => $url,
                            'protection' => array('agency' => $zone->agency,
                                                'area' => $zone->area,
                                                'logo' => $zone->logo),
                            'time' => array('year' => intval($row['year']),
                                            'discovered' => floatval($row['date']),
                                            'captured' => floatval($row['captured']),
                                            'updated' => floatval($row['updated']),
                                            'timezone' => $row['timezone']));

            /*if ($row['data']) {
                $aa = unserialize($row['data']);

                foreach ($aa['data']['Current Situation'] as $o) {
                    if ($o['desc'] == 'Size (Acres)') {
                        $bkacres = str_replace([' Acres',','], ['',''], $o['info']);
                        break;
                    }
                }

                if ($bkacres > $row['acres']) {
                    $fire['acres'] = $bkacres;
                }
            }*/

            $features[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => array(floatval($row['lon']), floatval($row['lat']))), 'properties' => $fire);
            $total++;
        }
    }
}

// remove duplicate inciweb fires from features array
if ($inciweb) {
    $n = 0;
    foreach ($features as $a) {
        if (in_array($a['properties']['state'].$a['properties']['name'], $inciweb) && $a['properties']['type'] != 'Complex' && $a['properties']['dispatch'] == 'NWCG') {
            unset($features[$n]);
            $total -= 1;
        }
        $n++;
    } 
}

if ($features) {
    $features = array_values($features);
}

$returnJson = array('type' => 'FeatureCollection', 'features' => $features, 'totalFires' => $total);