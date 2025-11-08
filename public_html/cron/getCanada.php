<?
////ini_set('display_errors', 1);
////error_reporting(E_PARSE);

include_once '../db.ini.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';

function tz($z) {
    if ($z == 'PDT' || $z == 'PST') {
        return 'America/Los_Angeles';
    } else if ($z == 'MDT' || $z == 'MST') {
        return 'America/Denver';
    } else if ($z == 'CDT' || $z == 'CST') {
        return 'America/Chicago';
    } else if ($z == 'EDT' || $z == 'EST') {
        return 'America/New_York';
    } else if ($z == 'NDT' || $z == 'NST') {
        return 'America/St_Johns';
    } else {
        return 'UTC';
    }
}

function castatus($s) {
    switch ($s) {
        case 'UC':
            $r = 'Under Control';
            break;
        case 'OC':
            $r = 'Out of control';
            break;
        case 'BH':
            $r = 'Being held';
            break;
        case 'OUT':
            $r = 'Out';
            break;
    }

    return $r;
}

$count = 0;
$sqlQueries = '';
$year = date('Y');
$url = 'https://services.arcgis.com/wjcPoefzjpzCgffS/ArcGIS/rest/services/activefires/FeatureServer/0/query?where=1%3D1+AND+Agency+%3C%3E+%27conus%27+AND+Start_Date+%3E%3D+TIMESTAMP+%27'.$year.'-01-01+00%3A00%3A00%27&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&geometryPrecision=6&outSR=4326&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=Start_Date+DESC&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=geojson';
$json = json_decode(file_get_contents($url));

for ($i = 0; $i < count($json->features); $i++) {
    $feat = $json->features[$i];
    $prop = $feat->properties;

    $time = time();
    $name = mysqli_real_escape_string($con, $prop->Fire_Name);
    $state = strtoupper($prop->Agency);
    $discovered = $prop->Start_Date / 1000;
    $acres = round($prop->{'Hectares__Ha_'} * 2.471, 2);
    $lat = $feat->geometry->coordinates[1];
    $lon = $feat->geometry->coordinates[0];
    $geo = getLocation($con, [$lat, $lon]);
    $near = $geo == '0 miles  of , ' ? '' : $geo;
    $timezone = tz($prop->Time_Zone);
    $status = castatus($prop->Stage_of_Control);

    $sqlQueries .= "INSERT INTO ca_wildfires (province,year,date,name,lat,lon,geo,acres,status,captured,updated,timezone,display) 
    VALUES('$state','$year','$discovered','$name','$lat','$lon','$near','$acres','$status','$time','$time','$timezone',1)
    ON DUPLICATE KEY UPDATE name = VALUES(name), lat = '$lat', lon = '$lon', geo = '$near', acres = '$acres', status = '$status', updated = '$time', timezone = '$timezone';";

    $count++;
}

$runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));

if ($runSQL) {
    do {
        if ($result = mysqli_store_result($con)) {
            while ($row = mysqli_fetch_row($result)) {}
            mysqli_free_result($result);
        }
        if (mysqli_more_results($con)) {}
    } while (mysqli_next_result($con));

    echo 'Finished with Canadian fires (modified '.$count.' incidents)...
';
} else {
    echo 'Unable to update Canadian data...
';
}



/*$unwanted_array = array(    'Š'=>'S', 'š'=>'s', 'Ž'=>'Z', 'ž'=>'z', 'À'=>'A', 'Á'=>'A', 'Â'=>'A', 'Ã'=>'A', 'Ä'=>'A', 'Å'=>'A', 'Æ'=>'A', 'Ç'=>'C', 'È'=>'E', 'É'=>'E',
                            'Ê'=>'E', 'Ë'=>'E', 'Ì'=>'I', 'Í'=>'I', 'Î'=>'I', 'Ï'=>'I', 'Ñ'=>'N', 'Ò'=>'O', 'Ó'=>'O', 'Ô'=>'O', 'Õ'=>'O', 'Ö'=>'O', 'Ø'=>'O', 'Ù'=>'U',
                            'Ú'=>'U', 'Û'=>'U', 'Ü'=>'U', 'Ý'=>'Y', 'Þ'=>'B', 'ß'=>'Ss', 'à'=>'a', 'á'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'å'=>'a', 'æ'=>'a', 'ç'=>'c',
                            'è'=>'e', 'é'=>'e', 'ê'=>'e', 'ë'=>'e', 'ì'=>'i', 'í'=>'i', 'î'=>'i', 'ï'=>'i', 'ð'=>'o', 'ñ'=>'n', 'ò'=>'o', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o',
                            'ö'=>'o', 'ø'=>'o', 'ù'=>'u', 'ú'=>'u', 'û'=>'u', 'ý'=>'y', 'þ'=>'b', 'ÿ'=>'y' );

$cities = explode('
', file_get_contents('./canadacities.csv'));

$x = 0;
foreach ($cities as $a) {
    if ($x > 0) {
        $b = explode(',', str_replace('"', '', $a));
        $city = mysqli_real_escape_string($con, strtr($b[0], $unwanted_array));
        $state_prefix = $b[2];
        $state_name = $b[3];
        $lat = $b[4];
        $lon = $b[5];
        $pop = round($b[6], 0);
        $tz = $b[8];

        echo "INSERT INTO cities (zip_code,city,county,state_name,state_prefix,area_code,timezone,lat,lon,elevation,population)
        VALUES('','$city','','$state_name','$state_prefix','','$tz','$lat','$lon','','$pop');";
    }
    $x++;
}

exit();*//*

function castatus($s) {
    switch ($s) {
        case 'UC':
            $r = 'Control';
            break;
        case 'OC':
            $r = '';
            break;
        case 'Staffed/Uncontained':
            $r = '';
            break;
        case 'BH':
            $r = 'Contain';
            break;
        case 'Unstaffed/Contained':
            $r = 'Contain';
            break;
    }

    if ($r == '') {
        $out = '';
    } else {
        $out[$r] = null;
    }

    return $out;
}

$count = 0;
$sqlQueries = '';
$time = time();
$IDs = [];

#$json = json_decode(file_get_contents('canada.json'));
$json = json_decode(file_get_contents('https://services.arcgis.com/zmLUiqh7X11gGV2d/ArcGIS/rest/services/Active_Fires_Csv/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson'));

foreach ($json->features as $fire) {
    /*$ts = $fire->properties->Start_Date;
    $date = strtotime(substr($ts, 6, 2).'/'.substr($ts, 9, 2).'/'.substr($ts, 1, 4).' '.explode(' ', $ts)[2]);*//*
    $date = $fire->properties->Start_Date / 1000;
    $year = date('Y', time());
    $state = 'CA'.strtoupper($fire->properties->Agency);
    $name = ltrim(rtrim($fire->properties->Fire_Name, ' '), ' ');
    $lat = $fire->geometry->coordinates[1];
    $lon = $fire->geometry->coordinates[0];
    $acres = round(floatval($fire->properties->Hectares__Ha_ * 2.47105), 2);
    $st = castatus(trim($fire->properties->Stage_of_Control));
    $status = ($st == '' ? '' : serialize($st));
    preg_match('/(.*)-([A-Z]{0,2}[0-9]+)(-[0-9]+)?|([0-9]+)/', $name, $output);
    $id = str_replace($year.'-', '', $output[0]);
    //$num = $year.'-'.$state.'-'.str_pad($fire->properties->ObjectId, 6, '0', STR_PAD_LEFT);
    $num = $fire->properties->GlobalID;

    if ($date && !in_array($num, $IDs)) {
        $geo = mysqli_real_escape_string($con, str_replace('é', 'e', getLocation($con, [$lat, $lon])));

        $sqlQueries .= "INSERT INTO wildfires (incidentID,state,agency,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display)
        VALUES('$num','$state','CIFFC','$year','$date','$name','Wildfire','$lat','$lon','$geo','$acres','$status','','','','$time','$time','America/Los_Angeles','1')
        ON DUPLICATE KEY UPDATE incidentID = VALUES(incidentID), state = VALUES(state), agency = VALUES(agency), year = VALUES(year), date = VALUES(date), name = '$name', 
        type = VALUES(type), lat = '$lat', lon = '$lon', geo = '$geo', acres = '$acres', status = '$status', notes = VALUES(notes), resources = VALUES(resources), fuels = VALUES(fuels), captured = VALUES(captured), updated = '$time', timezone = VALUES(timezone), display = VALUES(display);";

        $IDs[] = $num;
        $count++;
    }
}
$sqlQueries .= "UPDATE dispatch_centers SET cad_update = '$time' WHERE agency = 'CIFFC';";

echo $sqlQueries;
/*$runSQL = mysqli_multi_query($con, $sqlQueries);
if ($runSQL) {
    do {
        if ($result = mysqli_store_result($con)) {
            while ($row = mysqli_fetch_row($result)) { }
            mysqli_free_result($result);
        }
        if (mysqli_more_results($con)) { }
    } while (mysqli_next_result($con));
}
mysqli_close($con);*//*

echo 'Finished with Canada (modified '.$count.' incidents)...
';*/