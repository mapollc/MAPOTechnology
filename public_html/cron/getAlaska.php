<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$time = time();
$year = date('Y');
$count = 0;

$url = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=POOState+%3D+%27US-AK%27+AND+FireDiscoveryDateTime+%3E%3D+DATE+%271%2F1%2F'.$year.'%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson';
$json = json_decode(file_get_contents($url));

for ($i = 0; $i < count($json->features); $i++) {
    $fire = $json->features[$i];
    $geometry = $fire->geometry;
    $prop = $fire->properties;

    if ($prop->IncidentTypeCategory == 'WF' || $prop->IncidentTypeCategory == 'RX') {
        $state = str_replace('US-', '', $prop->POOState);
        $agency = $prop->POODispatchCenterID;
        $date = round($prop->FireDiscoveryDateTime / 1000);
        $year = date('Y', $date);
        $incidentNum = $prop->UniqueFireIdentifier;
        $incNumOnly = explode($incidentNum, '-')[2];
        $name = mysqli_real_escape_string($con, incidentName($prop->IncidentName, $incidentNum));
        $incidentType = $prop->IncidentTypeCategory=='WF' ? 'Wildfire' : ($prop->IncidentTypeCategory=='RX' ? 'Prescribed fire' : '');
        $lat = $geometry->coordinates[1];
        $lon = $geometry->coordinates[0];
        $geo = getLocation($con, array($lat, $lon));
        $acres = ($prop->DailyAcres ? $prop->DailyAcres : $prop->CalculatedAcres);
        $acres = (!$acres ? $prop->DiscoveryAcres : $acres);
        $fuel1 = $prop->PredominantFuelGroup;
        $fuel2 = $prop->PrimaryFuelModel;
        $fuel3 = $prop->SecondaryFuelModel;
        $status = [];
        $fuels = ($fuel1 ? $fuel1.($fuel2||$fuel3 ? ', ' : '') : '').($fuel2 ? $fuel2.($fuel3 ? ', ' : '') : '').($fuel3 ? $fuel3 : '');
        $updated = ($prop->ModifiedOnDateTime ? ($prop->ModifiedOnDateTime / 1000) : $time);

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

        $sqlQueries .= "INSERT INTO wildfires (incidentID,incidentNumOnly,state,agency,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display)
        VALUES('$incidentNum','$incNumOnly','$state','AICC','$year','$date','$name','$incidentType','$lat','$lon','$geo','$acres','$status','','','$fuels','$time','$updated','America/Juneau','1')
        ON DUPLICATE KEY UPDATE state = '$state', name = '$name', type = '$incidentType', lat = '$lat', lon = '$lon', geo = '$geo', acres = '$acres', status = '$status', fuels = '$fuels', updated = '$updated';";
    
        echo 'Processing AICC incidents '.($i + 1).' of '.count($json->features).'...
';
    }

    $count++;
}

$sqlQueries .= "UPDATE dispatch_centers SET cad_update = '$time' WHERE agency = 'AICC';";

// add or update wildfires in database
////echo $sqlQueries;
$runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));
if ($runSQL) {
    do {
        if ($result = mysqli_store_result($con)) {
            while ($row = mysqli_fetch_row($result)) { }
            mysqli_free_result($result);
        }
        if (mysqli_more_results($con)) { }
    } while (mysqli_next_result($con));
}

echo 'Finished importing '.$count.' AICC incidents...
';