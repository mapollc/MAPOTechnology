<?
function errFix($s)
{
    $r = str_replace(array('mt', 'mt.'), array('mount', 'mount'), $s);

    if (substr($r, -2) == ' f') {
        $r = $r . 'ire';
    } else if (substr($r, -3) == ' fi') {
        $r = $r . 're';
    } else if (substr($r, -4) == ' fir') {
        $r = $r . 'e';
    }

    return $r;
}

function gsd($state)
{
    switch ($state) {
        case 'alabama':
            $mapcenter = array('33.2588817', '-86.8295337');
            break;
        case 'alaska':
            $mapcenter = array('64.4459613', '-149.680909');
            break;
        case 'arizona':
            $mapcenter = array('34.395342', '-111.7632755');
            break;
        case 'arkansas':
            $mapcenter = array('35.2048883', '-92.4479108');
            break;
        case 'california':
            $mapcenter = array('36.7014631', '-118.7559974');
            break;
        case 'colorado':
            $mapcenter = array('38.7251776', '-105.6077167');
            break;
        case 'connecticut':
            $mapcenter = array('41.6500201', '-72.7342163');
            break;
        case 'delaware':
            $mapcenter = array('38.6920451', '-75.4013315');
            break;
        case 'florida':
            $mapcenter = array('27.7567667', '-81.4639835');
            break;
        case 'georgia':
            $mapcenter = array('32.3293809', '-83.1137366');
            break;
        case 'hawaii':
            $mapcenter = array('21.2160437', '-157.975203');
            break;
        case 'idaho':
            $mapcenter = array('43.6447642', '-114.0154071');
            break;
        case 'illinois':
            $mapcenter = array('40.0796606', '-89.4337288');
            break;
        case 'indiana':
            $mapcenter = array('40.3270127', '-86.1746933');
            break;
        case 'iowa':
            $mapcenter = array('41.9216734', '-93.3122705');
            break;
        case 'kansas':
            $mapcenter = array('38.27312', '-98.5821872');
            break;
        case 'kentucky':
            $mapcenter = array('37.5726028', '-85.1551411');
            break;
        case 'louisiana':
            $mapcenter = array('30.8703881', '-92.007126');
            break;
        case 'maine':
            $mapcenter = array('45.709097', '-68.8590201');
            break;
        case 'maryland':
            $mapcenter = array('39.5162234', '-76.9382069');
            break;
        case 'massachusetts':
            $mapcenter = array('42.3788774', '-72.032366');
            break;
        case 'michigan':
            $mapcenter = array('43.6211955', '-84.6824346');
            break;
        case 'minnesota':
            $mapcenter = array('45.9896587', '-94.6113288');
            break;
        case 'mississippi':
            $mapcenter = array('32.9715645', '-89.7348497');
            break;
        case 'missouri':
            $mapcenter = array('38.7604815', '-92.5617875');
            break;
        case 'montana':
            $mapcenter = array('47.3752671', '-109.6387579');
            break;
        case 'nebraska':
            $mapcenter = array('41.7370229', '-99.5873816');
            break;
        case 'nevada':
            $mapcenter = array('39.5158825', '-116.8537227');
            break;
        case 'new hampshire':
            $mapcenter = array('43.4849133', '-71.6553992');
            break;
        case 'new jersey':
            $mapcenter = array('40.0757384', '-74.4041622');
            break;
        case 'new mexico':
            $mapcenter = array('34.5708167', '-105.993007');
            break;
        case 'new york':
            $mapcenter = array('40.7127281', '-74.0060152');
            break;
        case 'north carolina':
            $mapcenter = array('35.6729639', '-79.0392919');
            break;
        case 'north dakota':
            $mapcenter = array('47.6201461', '-100.540737');
            break;
        case 'ohio':
            $mapcenter = array('40.2253569', '-82.6881395');
            break;
        case 'oklahoma':
            $mapcenter = array('34.9550817', '-97.2684063');
            break;
        case 'oregon':
            $mapcenter = array('43.9792797', '-120.737257');
            break;
        case 'pennsylvania':
            $mapcenter = array('40.9699889', '-77.7278831');
            break;
        case 'rhode island':
            $mapcenter = array('41.7962409', '-71.5992372');
            break;
        case 'south carolina':
            $mapcenter = array('33.6874388', '-80.4363743');
            break;
        case 'south dakota':
            $mapcenter = array('44.6471761', '-100.348761');
            break;
        case 'tennessee':
            $mapcenter = array('35.7730076', '-86.2820081');
            break;
        case 'texas':
            $mapcenter = array('31.8160381', '-99.5120986');
            break;
        case 'utah':
            $mapcenter = array('39.4225192', '-111.7143584');
            break;
        case 'vermont':
            $mapcenter = array('44.5990718', '-72.5002608');
            break;
        case 'virginia':
            $mapcenter = array('37.1232245', '-78.4927721');
            break;
        case 'washington':
            $mapcenter = array('38.8948932', '-77.0365529');
            break;
        case 'west virginia':
            $mapcenter = array('38.4758406', '-80.8408415');
            break;
        case 'wisconsin':
            $mapcenter = array('44.4308975', '-89.6884637');
            break;
        case 'wyoming':
            $mapcenter = array('43.1700264', '-107.5685348');
            break;
    }

    return $mapcenter;
}

$count = 0;
$q = mysqli_real_escape_string($con, errFix(strtolower($_REQUEST['q'])));

if ($method == 'oreroads') {
    $result = mysqli_query($con, "SELECT city, lat, lon FROM cities WHERE state_prefix = 'OR' GROUP BY city ORDER BY city ASC");
    while ($row = mysqli_fetch_assoc($result)) {
        $arr[] = $row;
    }
} else {
    $splitq = explode(',', str_replace(', ', ',', $q));
    $extra = " OR ((city LIKE '%$splitq[0]%' OR county LIKE '%$splitq[0]%' OR zip_code LIKE '%$splitq[0]%') AND (state_name LIKE '%$splitq[1]%' OR state_prefix LIKE '%$splitq[1]%'))";
    if ($splitq[0] == '') {
        $extra = '';
    }

    if ($method == 'cities') {
        $sql = "SELECT city AS name, state_prefix AS state, zip_code AS extra, lat, lon, population AS ident, county FROM cities WHERE ((city LIKE '%$q%' OR county LIKE '%$q%') OR (state_name LIKE '%$q%'))$extra ORDER BY city ASC, county ASC, state_name ASC LIMIT 25";
    } else {
        $um = ($_REQUEST['cad'] == 1 ? "" : " AND gis.class != 'place'");
        /*$sql = "(SELECT id AS ident, name, type, county AS county, state, lat, lon, elevation AS extra FROM gis WHERE (name LIKE '%$q%' OR (name LIKE '%$splitq[0]%' AND state LIKE '%$splitq[1]%'))$um) UNION 
                (SELECT population AS ident, city AS name, id AS type, county, state_prefix AS state, lat, lon, zip_code AS extra FROM cities WHERE ((city LIKE '%$q%' OR county LIKE '%$q%') OR (state_name LIKE '%$q%'))$extra) ORDER BY `type` ASC, state ASC, county ASC, name ASC LIMIT 25";*/
        $addZip = is_numeric($q) ? "WHEN zip_code LIKE '$q%' THEN 2" : '';
        $addZip2 = is_numeric($q) ? "(zip_code LIKE '$splitq[0]%' OR zip_code LIKE '%$splitq[0]%') OR " : '';
        $sql = "(SELECT id AS ident, name, type, county AS county, state, lat, lon, elevation AS extra,
                CASE
                WHEN name LIKE '$splitq[0]%' THEN 1
                WHEN name LIKE '%$splitq[0]%' THEN 2
                ELSE 3
                END AS priority
            FROM gis
            WHERE (name LIKE '$q%' OR name LIKE '%$splitq[0]%') AND state LIKE '%$splitq[1]%'$um)
            UNION 
            (SELECT population AS ident, city AS name, id AS type, county, state_prefix AS state, lat, lon, zip_code AS extra,
                CASE
                WHEN city LIKE '$splitq[0]%' THEN 1
                $addZip
                WHEN county LIKE '$splitq[0]%' THEN 3
                WHEN city LIKE '%$splitq[0]%' THEN 4
                WHEN county LIKE '%$splitq[0]%' THEN 5
                ELSE 6
                END AS priority
            FROM cities
            WHERE (city LIKE '$splitq[0]%' OR city LIKE '%$splitq[0]%') OR 
                $addZip2
                 (county LIKE '$splitq[0]%' OR county LIKE '%$splitq[0]%') AND state_name LIKE '%$splitq[1]%')
            ORDER BY priority ASC, `type` ASC, state ASC, county ASC, name ASC
            LIMIT 25";
    }

    $sql2 = mysqli_query($con, "SELECT name, ymax, ymin, xmax, xmin FROM states WHERE name LIKE '%$q%'");

    while ($row = mysqli_fetch_assoc($sql2)) {
        $geo = gsd(strtolower($row['name']));
        $bbox = ['x' => ['min' => floatval($row['xmin']), 'max' => floatval($row['xmax'])], 'y' => ['min' => floatval($row['ymin']), 'max' => floatval($row['ymax'])]];

        $rs[] = array(100, 'data' => array('type' => 'State', 'name' => $row['name'], 'lat' => floatval($geo[0]), 'lon' => floatval($geo[1]), 'bbox' => $bbox));
    }
    /*$states = gsd($q);

    if ($states) {
        $rs[] = array(100, 'data' => array('type' => 'State', 'name' => ucwords($q), 'lat' => floatval($states[0]), 'lon' => floatval($states[1])));
    }*/

    /*$county = trim(preg_replace('/\s+/', ' ', preg_replace('/\b(co|cou|coun|county|cnty)\b/i', '', $splitq[0])));
    $sq = "SELECT name, state_prefix, state_name, population FROM counties WHERE name LIKE '%$county%' AND (state_prefix LIKE '$splitq[1]' OR state_name LIKE '%$splitq[1]%') ORDER BY state_prefix ASC, name ASC";

    $sql3 = mysqli_query($con, $sq);
    
    while ($row = mysqli_fetch_assoc($sql3)) {
        print_r($row);
        similar_text($q, $row['name'].', '.$row['state_prefix'], $p);

        $rs[] = [$p, 'data' => ['id' => 'county_result' . $count, 'type' => 'County', 'name' => $row['name'].', '.$row['state_prefix'], 'pop' => intval($row['population'])]];
        $count++;
    }*/

    $names = [];
    $result = mysqli_query($con, $sql) or die(mysqli_error($con));
    while ($row = mysqli_fetch_assoc($result)) {
        if (strlen($row['extra']) == 5) {
            $place = $row['name'] . ', ' . $row['state'] . ' ' . $row['extra'];
            similar_text($q, $place, $p);

            if (strtolower(substr($place, 0, strlen($q))) == $q) {
                $p += 1;
            }

            $rs[] = array($p, 'data' => array('id' => 'geo_result' . $count, 'type' => 'City', 'name' => $place, 'pop' => intval($row['ident']), 'lat' => floatval($row['lat']), 'lon' => floatval($row['lon']), 'county' => $row['county']));
        } else {
            if ($row['name'] != $row['county'] && $row['type'] != 'Place' && $row['extra'] != '') {
                if ($_REQUEST['cad'] == 1) {
                    $name = $row['name'];
                } else {
                    $name = $row['name'] . ', ' . $row['state'];
                }
                similar_text($name, $q, $p);

                if (!in_array($name, $names)) {
                    $rs[] = array($p, 'data' => array('id' => 'gis_result' . $count, 'type' => 'GIS', 'name' => $name, 'lat' => floatval($row['lat']), 'lon' => floatval($row['lon']), 'county' => $row['county'], 'state' => $row['state'], 'geoType' => $row['type']));
                    $names[] = $name;
                }
            }
        }

        $oldname = ucwords(strtolower($row['name']));
        $oldll = $ll;

        $count++;
    }

    /*if ($rs) {
        rsort($rs);
    }*/

    foreach ($rs as $a => $b) {
        $arr[] = $b['data'];
    }

    $arr = (!$q ? '' : $arr);
}

$returnJson = array('rs' => $arr == '' ? null : $arr);
