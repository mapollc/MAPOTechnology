<?
$fips = $method;

if ($fips == '') {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid FIPS location was specified');
} else {
    if (strlen($fips) > 6) {
        $sql = "SELECT r.*, county, zip_code FROM risk AS r LEFT JOIN cities AS c ON c.fips = r.fips WHERE r.fips = ?";
    } else {
        $sql = "SELECT * FROM risk WHERE fips = ?";
    }

    $row = prepareQuery('s', [$fips], $sql);

    if (!isset($row['error']) && count($row) > 0) {
        $row['data'] = json_decode(unserialize($row['data']));
        $row['data']->buildings->count = intval($row['data']->buildings->count);
        $row['data']->pop = intval($row['data']->pop);

        $returnJson = [
            'id' => intval($row['id']),
            'fips' => intval($row['fips']),
            'type' => $row['type'],
            'name' => $row['name'],
            'county' => $row['county'],
            'state' => $row['state'],
            'data' => $row['data']
        ];
    } else {
        $returnJson = ['response' => 'error', 'code' => 1, 'The risk location requested does not exist'];
    }
}

/*function fetch($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_ENCODING , 'gzip');
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_URL, $url);
    $result = curl_exec($ch);
    curl_close($ch);

    return json_decode($result);
}

function rank1($n) {
    if ($n < 0.4) {
        $l = 'Low';
    } else if ($n >= 0.4 && $n < 0.7) {
        $l = 'Medium';
    } else if ($n >= 0.7 && $n < 0.9) {
        $l = 'High';
    } else if ($n >= 0.9) {
        $l = 'Very High';
    }
    return $l;
}

function rank2($de, $ie, $te) {
    $de /= $te;
    $te = ($de + $ie) / $te;

    if ($te < 0.5) {
        $l = 'Low';
    } else if ($te > 0.5 && $te < 0.9) {
        $l = 'Medium';
    } else if ($te > 0.9 && $de < 0.5) {
        $l = 'High';
    } else if ($te > 0.9 && $de > 0.5) {
        $l = 'Very High';
    }

    return $l;
}

if (!isset($method) && !isset($_REQUEST['q'])) {
    $returnJson = array('error' => 'No FIPS specified');
} else {
    if ($_REQUEST['q']) {
        $e = explode(', ', $_REQUEST['q']);
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT fips FROM `cities` WHERE city LIKE '%".$e[0]."%' AND state_prefix LIKE '%".$e[1]."%'"));

        $method = $row['fips'];
    }

    $data = mysqli_fetch_assoc(mysqli_query($con, "SELECT data FROM wildfireRisk WHERE fips = '$method' LIMIT 1"));

    if (!$data) {
        if ($method) {
            $json = fetch('https://api.headwaterseconomics.org/wrc/place/'.$method);
        } else {
            $json = fetch('https://api.headwaterseconomics.org/wrc/place/'.$_REQUEST['q']);
        }

        $level = $json->geo_level;
        $ex = explode('/', $json->breadcrumb);
        $sfips = $ex[0];
        $cfips = $ex[1];
        $tfips = $ex[2];

        if ($tfips) {
            mysqli_query($con, "UPDATE cities SET fips = '$tfips' WHERE city = '%".$e[0]."%' AND state_prefix LIKE '%".$e[1]."%'");
        }

        $json2 = fetch('https://api.headwaterseconomics.org/wrc/wildfireData/'.($level == 'county' ? $sfips : $cfips).'/'.($level == 'county' ? $level : 'community').'/risk_to_homes.json');

        $riskToHomesState = $json->ranks->rps_within_state;
        $riskToHomesNation = $json->ranks->rps_within_nation;
        $fireLikeState = $json->ranks->bp_within_state;
        $fireLikeNation = $json->ranks->bp_within_nation;
        $de = $json2->$method->d->hu_count_de;
        $ie = $json2->$method->d->hu_count_ie;
        $te = $json2->$method->d->hu_count_te;

        //print_r($json2);
        $name = $json->name_short;
        $state = $json->state->name;

        $returnJson = array('area' => array('name' => $name, 'state' => $state, 'level' => $level), 
                            'data' => array('wl' => array('state' => $fireLikeState, 'us' => $fireLikeNation, 'rank' => rank1($fireLikeNation)),
                                            'rth' => array('state' => $riskToHomesState, 'us' => $riskToHomesNation, 'rank' => rank1($riskToHomesNation)),
                                            'exposure' => array('count' => $te, 'none' => ($te - $de - $ie) / $te, 'direct' => $de / $te, 'indirect' => $ie / $te, 'rank' => rank2($de, $ie, $te))));

        if ($name && $state) {
            $serialize = serialize($returnJson);
            mysqli_query($con, "INSERT INTO wildfireRisk (fips,name,state,type,data) VALUES('$method','$name','$state','$level','$serialize')");
        }
    } else {
        $isCached = true;
        $cache = json_decode(json_encode(unserialize($data['data'])));
        $cache->cached = 1;
        $returnJson = $cache;
    }
}*/