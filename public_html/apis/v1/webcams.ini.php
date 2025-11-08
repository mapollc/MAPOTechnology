<?
function getODOT($url) {
    $curl = curl_init($url);

    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Cache-Control: no-cache', 'Ocp-Apim-Subscription-Key: 3bd2f1c1c6bd40b5b9c00c44a6241209'));

    $resp = curl_exec($curl);
    curl_close($curl);

    return $resp;
}

function getCams() {
    return getODOT('http://api.odot.state.or.us/tripcheck/Cctv/Inventory');
}

function road($s) {
    return str_replace(['OR','I'], ['ORE','I-'], $s);
}

if ($_REQUEST['network'] == 'ODOT') {
    // create instance of memcache
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $cachefilename = 'odot_webcams';
    $cache = $memcache->get($cachefilename);

    if (!$cache || time() - $memcache->get($cachefilename.'-time') > 900 || filemtime(root() . 'webcams.ini.php') > $memcache->get($cachefilename.'-time')) {
        $json = json_decode(getCams())->CCTVInventoryRequest;

        $result = mysqli_query($con, "SELECT lat, lon, county FROM odot_webcams");
        while ($row = mysqli_fetch_assoc($result)) {
            $county[$row['lat'].$row['lon']] = $row['county'];
        }

        foreach($json as $cam) {
            $lat = $cam->latitude;
            $lon = $cam->longitude;
            $prop = array(
                'id' => $cam->{'device-id'},
                'hwy' => road($cam->{'route-id'}),
                'route' => $cam->{'hwy-id'},
                'milepost' => $cam->milepoint,
                'county' => $county[$lat.$lon],
                'name' => $cam->{'cctv-other'},
                'url' => base64_encode(str_replace('http://', 'https://', $cam->{'cctv-url'})),
                'updated' => strtotime($cam->{'last-update-time'})
            );
            $cams[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => [$lon, $lat]), 'properties' => $prop);
        }

        $memcache->set($cachefilename, json_encode($cams), 1200);
        $memcache->set($cachefilename.'-time', time(), 1200);
    } else {
        $isCached = true;
        $cams = json_decode($cache);
    }

    /*$result = mysqli_query($con, "SELECT * FROM odot_webcams ORDER BY road ASC, CAST(mp as FLOAT) ASC");
    while ($row = mysqli_fetch_assoc($result)) {
        $prop = array('id' => $row['id'], 'hwy' => $row['road'], 'milepost' => $row['mp'], 'county' => $row['county'], 'name' => $row['name'], 'url' => base64_encode($row['url']));

        if (!isset($_REQUEST['radius']) || (isset($_REQUEST['radius']) && distance($lat, $lon, $row['lat'], $row['lon']) <= $r)) {
            $cams[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => [floatval($row['lon']), floatval($row['lat'])]), 'properties' => $prop);
        }
    }*/
} else {
    $where = 'WHERE 1=1';

    if (isset($_REQUEST['state'])) {
        $where .= " AND state = '".$_REQUEST['state']."'";
    }

    if (isset($_REQUEST['county'])) {
        $where .= " AND county = '".$_REQUEST['county']."'";
    }

    if (isset($_REQUEST['network'])) {
        $where .= " AND network = '".$_REQUEST['network']."'";
    }

    if (isset($_REQUEST['source'])) {
        $where .= " AND source = '".$_REQUEST['source']."'";
    }

    if ($method == 'bbox') {
        $bbox = json_decode($_REQUEST['bbox']);
        $latmax = $bbox->ymax;
        $latmin = $bbox->ymin;
        $lonmax = $bbox->xmin;
        $lonmin = $bbox->xmax;

        $where .= " AND ((CAST(lat AS FLOAT) >= $latmin AND CAST(lat AS FLOAT) <= $latmax) AND (CAST(lon AS FLOAT) >= $lonmin AND CAST(lon AS FLOAT) <= $lonmax))";
    } else if ($method == 'radius') {
        $e = explode(',', $_REQUEST['radius']);
        $lat = $e[0];
        $lon = $e[1];
        $r = ($e[2] > 75 ? 75 : $e[2]);
        $v = $r / 69;
        $h = $r / 54.583;
        $latmin = $lat - $v;
        $latmax = $lat + $v;
        $lonmin = $lon - $h;
        $lonmax = $lon + $h;

        $where .= " AND ((CAST(lat AS FLOAT) >= $latmin AND CAST(lat AS FLOAT) <= $latmax) AND (CAST(lon AS FLOAT) >= $lonmin AND CAST(lon AS FLOAT) <= $lonmax))";
    }

    if ($method == 'get') {
        $sql = "SELECT * FROM webcams WHERE id = '$_REQUEST[id]'";
    } else {
        $sql = "SELECT * FROM webcams ".$where." ORDER BY ".($_REQUEST['sort'] ? $_REQUEST['sort'] : 'name')." ".($_REQUEST['order'] ? $_REQUEST['order'] : 'ASC').($_REQUEST['limit'] ? " LIMIT ".$_REQUEST['limit'] : '');
    }

    $result = mysqli_query($con, $sql);
    while ($row = mysqli_fetch_assoc($result)) {
        $prop = array('id' => $row['id'], 'state' => $row['state'], 'county' => $row['county'], 'name' => $row['name'], 'url' => base64_encode($row['url']), 'network' => $row['network']);

        if (!isset($_REQUEST['radius']) || (isset($_REQUEST['radius']) && distance($lat, $lon, $row['lat'], $row['lon']) <= $r)) {
            $cams[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => [floatval($row['lon']), floatval($row['lat'])]), 'properties' => $prop);
        }
    }
}

if ($cams == null || count($cams) == 0) {
    $returnJson = array('error' => 1, 'message' => 'No webcams exist for this criteria');
} else {
    $returnJson = array('type' => 'FeatureCollection', 'features' => $cams, 'total' => count($cams));
}