<?
$wfid = $_REQUEST['wfid'];
$cachefilename = './cache/api-incident-'.$wfid.'.json';

if (time() - filemtime($cachefilename) > 600 || !file_exists($cachefilename)) {
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT w.*, incident_info, data, contact, photo, i.updated AS inciweb_updated, i.captured AS inciweb_captured, image, ip.time AS photo_uploaded, d.agency AS org, d.area, d.unit, d.logo FROM wildfires AS w 
                                                    LEFT JOIN incident_photos AS ip ON ip.wfid = w.wfid
                                                    LEFT JOIN inciweb AS i ON i.state = w.state AND i.name = w.name AND i.year = w.year
                                                    LEFT JOIN dispatch_zones AS d ON d.unit = CONCAT(w.state, SUBSTRING(incidentID, 8, 3)) WHERE w.wfid = '$wfid'")) or die(mysqli_error($con));

    /*"SELECT w.wfid, w.state AS fire_state, agency, wxstn, w.year, w.date, w.num, w.name AS fire_name, type, geo, lat, lon, resources, acres, notes, status, fuels, w.captured, w.updated, w.timezone, notification, 
    `show` AS show_fire, image, ip.time AS photo_uploaded, incident_info, data, contact, photo, i.updated AS inciweb_updated, i.captured AS inciweb_captured, cost, cause FROM fwavyc5_fwac.wildfires AS w 
    LEFT JOIN fwavyc5_fwac.incident_photos AS ip ON ip.wfid = w.wfid LEFT JOIN fwavyc5_fwac.inciweb AS i ON i.state = w.state AND i.name = w.name AND i.year = w.year LEFT JOIN fwavyc5_fwac.supp AS p 
    ON p.num = w.num AND p.state = w.state AND p.year = w.year WHERE w.wfid = '$_REQUEST[wfid]' ORDER BY ip.time DESC";*/

    if ($row) {
        $url = url($row['wfid'], $row['name'], $row['state']);

        $fire = array('properties' => array('wfid' => $row['wfid'], 'incidentId' => $row['incidentID'], 'fireState' => $row['state'], 'fireName' => $row['name'], 'type' => $row['type'], 'acres' => $row['acres'], 'resources' => $row['resources'], 'fuels' => $row['fuels'], 'notes' => $row['notes'], 'status' => unserialize($row['status']), 'url' => $url, 'display' => $row['display']),
                    'geometry' => array('lat' => floatval($row['lat']), 'lon' => floatval($row['lon']), 'near' => $row['geo']),
                    'protection' => array('dispatch' => $row['agency'], 'agency' => $row['org'], 'area' => $row['area'], 'unit' => $row['unit'], 'logo' => $row['logo']),
                    'time' => array('year' => $row['year'], 'discovered' => $row['date'], 'captured' => $row['captured'], 'updated' => $row['updated'], 'timezone' => $row['timezone']));

        if ($row['incident_info'] || $row['data']) {
            $inciweb = array('incident_info' => $row['incident_info'], 'current' => unserialize($row['data']), 'contacts' => unserialize($row['contact']), 'updated' => $row['inciweb_updated']);

            if ($row['photo']) {
                $inciweb['photo'] = unserialize($row['photo']);
            }

            $fire['inciweb'] = $inciweb;
        }
    } else {
        $fire = null;
    }

    $returnJson = array('fire' => $fire);

    $save = fopen($cachefilename, 'w');
    fwrite($save, json_encode($returnJson));
    fclose($save);
} else {
    $cache = json_decode(file_get_contents($cachefilename));
    $cache->cached = 1;
    $returnJson = $cache;
}