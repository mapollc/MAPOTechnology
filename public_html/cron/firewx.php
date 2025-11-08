<?
/*set_time_limit(900);
ini_set('memory_limit','1024M');
ini_set('display_errors', 1);
error_reporting(E_PARSE && E_ERROR);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$year = 2010;

$count = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/InFORM_FireOccurrence_Public/FeatureServer/0/query?where=FireDiscoveryDateTime+%3E%3D+DATE+%2701%2F01%2F'.$year.'+00%3A00%3A00%27+AND+FireDiscoveryDateTime+%3C%3D+DATE+%2712%2F31%2F'.$year.'+23%3A59%3A59%27&returnCountOnly=true&f=json'))->count;

#for ($x = 0; $x < 1; $x++) {
for ($x = 0; $x < ceil($count / 2000); $x++) {
    $sqlQueries = '';
    $start = 2000 * $x;

    $json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/InFORM_FireOccurrence_Public/FeatureServer/0/query?where=FireDiscoveryDateTime+%3E%3D+DATE+%2701%2F01%2F'.$year.'+00%3A00%3A00%27+AND+FireDiscoveryDateTime+%3C%3D+DATE+%2712%2F31%2F'.$year.'+23%3A59%3A59%27&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=6&outSR=4326&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=FireDiscoveryDateTime+DESC&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset='.$start.'&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson'));

    #for ($i = 0; $i < 1; $i++) {
    for ($i = 0; $i < count($json->features); $i++) {
        $prop = $json->features[$i]->properties;
        $date = round($prop->FireDiscoveryDateTime / 1000, 0);
        $updated = $prop->ModifiedOnDateTime == 0 ? $date : round($prop->ModifiedOnDateTime / 1000, 0);
        $year = date('Y', $date);
        $incID = $prop->UniqueFireIdentifier;
        $agency = $prop->POODispatchCenterID;
        $state = substr($prop->POOState, 3, 2);
        $name = mysqli_real_escape_string($con, incidentName($prop->IncidentName, $incID));
        $type = $prop->IncidentTypeCategory == 'RX' ? 'Prescribed Fire' : ($prop->IncidentTypeCategory == 'CX' ? 'Complex' : 'Wildfire');
        $lat = $json->features[$i]->geometry->coordinates[1];
        $lon = $json->features[$i]->geometry->coordinates[0];
        $coords = [$lat, $lon];
        $fuel1 = $prop->PredominantFuelGroup;
        $fuel2 = $prop->PrimaryFuelModel;
        $fuel3 = $prop->SecondaryFuelModel;
        $fuels = ($fuel1 ? $fuel1.($fuel2||$fuel3 ? ', ' : '') : '').($fuel2 ? $fuel2.($fuel3 ? ', ' : '') : '').($fuel3 ? $fuel3 : '');
        $status = [];
        #$timezone = getTimezone($coords);
        #$geo = getLocation($con, $coords);
        $a1 = $prop->IncidentSize;
        $a2 = $prop->CalculatedAcres;
        $a3 = $prop->FinalAcres;
        $acar = [];

        if ($a1 != null) {
            $acar[] = $a1;
        }

        if ($a2 != null) {
            $acar[] = $a2;
        }

        if ($a3 != null) {
            $acar[] = $a3;
        }

        $acres = $a1 == null && $a2 == null && $a3 == null ? '' : max($acar);

        if ($prop->ContainmentDateTime != null) {
            $status['Contain'] = round($prop->ContainmentDateTime / 1000);
        }

        if ($prop->ControlDateTime != null) {
            $status['Control'] = round($prop->ControlDateTime / 1000);
        }

        if ($prop->FireOutDateTime != null) {
            $status['Out'] = round($prop->FireOutDateTime / 1000);
        }

        $status = count($status) == 0 ? '' : serialize($status);

        $sqlQueries .= "INSERT IGNORE INTO wildfires (incidentID,state,agency,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display,owner)
        VALUES('$incID','$state','$agency','$year','$date','$name','$type','$lat','$lon','','$acres','$status','','','$fuels','$date','$updated','','1','system');";

    echo 'Done with fire '.$i.' of '.count($json->features).'...
';
    }

    #echo $sqlQueries;
    $runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));

    if ($runSQL) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) {}
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) {}
        } while (mysqli_next_result($con));

        echo 'Done with group: '.$start.' - '.($start + 2000).'...
';
    }
}

mysqli_close($con);

/*ini_set('display_errors',0);
error_reporting(E_ALL);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$dzones = json_decode(file_get_contents('./dispatch_zones.json'));

function dispatchZones($id) {
    global $dzones;
    $r = ['agency' => null, 'area' => null, 'logo' => null];

    for ($i = 0; $i < count($dzones); $i++) {
        $unit = $dzones[$i]->unit;
        if ($unit == explode('-', $id)[1]) {
            $r = $dzones[$i];
            break;
        }
    }

    return $r;
}

function upload($id, $json) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/datasets/v1/mapollc/cm8ynzsnq2ohu1no2n21pn74n/features/'.$id.'?access_token=sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));

    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $output = curl_error($ch);
    } else {
        $output = $result;
    }
    curl_close($ch);

    return $output;
}

$year = 2024;
$yearstart = strtotime("1/1/$year 00:00:00");
$yearend = strtotime("12/31/$year 23:59:59");

$result = mysqli_query($con, "SELECT * FROM wildfires WHERE agency != 'CIFFC' AND date >= $yearstart AND date <= $yearend AND display = 1 ORDER BY CAST(date AS float) DESC");

while ($row = mysqli_fetch_assoc($result)) {
    $status = unserialize($row['status']);
    $show_fire = wildfireAlgorithm('all', $row['type'], $status, $row, $year);

    if ($show_fire && $row['state'] != '') {
        $name = incidentName($row['name'], $row['incidentID']);
        $url = wildfireURL($row['wfid'], $name, $row['state']);

        /*if (strpos($row['incidentID'], '-NWCG-') !== false) {
            $inciweb[] = $row['state'].$name;
        }*/

        /*$zone = dispatchZones($row['incidentID']);
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

        /*$feature = array('id' => $row['wfid'], 'type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => array(floatval($row['lon']), floatval($row['lat']))), 'properties' => $fire);
        //print_r($feature);
        upload($row['wfid'], $feature);
    }
}




/*
date_default_timezone_set('UTC');

/*if (($handle = fopen("fires.csv", "r")) !== FALSE) {
    $row = 0;
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        if ($row > 0) {
            $fires[] = $data;
        }
        $row++;
    }
    fclose($handle);
}

foreach ($fires as $fire) {
    $time = strtotime($fire[1]);
    mysqli_query($con, "INSERT INTO excel (id, lat, lon, time) VALUES('$fire[0]', '$fire[2]', '$fire[3]', '$time')");
}*/

/*function getData($lat, $lon, $time) {
    $url = "https://api.mesowest.net/v2/stations/nearesttime?token=04f9ba4a7550477a9533d12a10b544ae&attime=$time&within=120&radius=$lat,$lon,20&units=english&vars=air_temp,relative_humidity,wind_speed&limit=3&networkimportance=9,7";
    $file = file_get_contents($url);

    #return json_decode($file);
    return $url;
}

$result = mysqli_query($con, "SELECT * FROM excel LIMIT 1");

while ($row = mysqli_fetch_assoc($result)) {
    $t = date('YmdHi', $row['time']);
    $json = getData($row['lat'], $row['lon'], $t);

    print_r($json);
}*/