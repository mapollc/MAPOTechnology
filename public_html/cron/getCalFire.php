<?
////ini_set('display_errors', 1);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$runSQL = true;
$time = time();
$year = date('Y');
$count = 0;

for ($x = 0; $x < 2; $x++) {
    $url = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=POOState+%3D+%27US-CA%27+AND+FireDiscoveryDateTime+>%3D+DATE+%2701%2F01%2F'.$year.'+12%3A00+AM%27+AND+ModifiedOnDateTime_dt+>%3D+DATE+%27'.urlencode(date('m/d/Y g:i A', strtotime('-15 minutes'))).'%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=FireDiscoveryDateTime+DESC&resultOffset='.($x == 1 ? 2000 : '').'&returnExceededLimitFeatures=true&f=geojson';
    ////echo $url;
    ////exit();
    $json = json_decode(file_get_contents($url));

    for ($i = 0; $i < count($json->features); $i++) {
    #for ($i = 10; $i < 15; $i++) {
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
            $incidentType = ($prop->IncidentTypeCategory=='WF' ? 'Wildfire' : ($prop->IncidentTypeCategory=='RX' ? 'Prescribed fire' : ''));
            $lat = $geometry->coordinates[1];
            $lon = $geometry->coordinates[0];
            $geo = getLocation($con, array($lat, $lon));
            $acres = $prop->DailyAcres ? $prop->DailyAcres : $prop->CalculatedAcres;
            $acres = !$acres ? $prop->DiscoveryAcres : $acres;
            $fuel1 = $prop->PredominantFuelGroup;
            $fuel2 = $prop->PrimaryFuelModel;
            $fuel3 = $prop->SecondaryFuelModel;
            $status = [];
            $protectUnit = $prop->POOProtectingUnit;
            $fuels = ($fuel1 ? $fuel1.($fuel2||$fuel3 ? ', ' : '') : '').($fuel2 ? $fuel2.($fuel3 ? ', ' : '') : '').($fuel3 ? $fuel3 : '');
            $updated = $prop->ModifiedOnDateTime ? ($prop->ModifiedOnDateTime / 1000) : $time;

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

            $sqlQueries .= "INSERT INTO wildfires (incidentID,incidentNumOnly,state,agency,unit,`year`,`date`,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display,owner)
            VALUES('$incidentNum','$incNumOnly','$state','CAL FIRE','$protectUnit','$year','$date','$name','$incidentType','$lat','$lon','$geo','$acres','$status','','','$fuels','$time','$updated','America/Los_Angeles','1','system')
            ON DUPLICATE KEY UPDATE state = '$state', agency = VALUES(agency), unit = '$protectUnit', `year` = VALUES(`year`), `date` = VALUES(`date`),  name = '$name', 
            type = '$incidentType', lat = '$lat', lon = '$lon', geo = '$geo', acres = '$acres', status = '$status', notes = VALUES(notes), resources = VALUES(resources),  fuels = '$fuels',
            captured = VALUES(captured), updated = '$updated', timezone = VALUES(timezone), display = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END, owner = VALUES(owner);";
  
            if ($acres != '') {
                $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated) SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum');";
            }

            echo 'Processing CAL FIRE incident '.($i + 1).' of '.count($json->features).'...
';
        }

        $count++;
    }
}

$json = json_decode(file_get_contents('https://incidents.fire.ca.gov/umbraco/api/IncidentApi/List?inactive=false'));

if (count($json) > 0) {
    for ($i = 0; $i < count($json); $i++) {
        $fire = $json[$i];
        $name = str_replace(' Fire', '', $fire->Name);
        $started = strtotime($fire->Started);
        $start = strtotime(date('m/d/Y', $started).' 00:00:00 PST');
        $end = strtotime(date('m/d/Y', $started).' 23:59:59 PST');
        $acres = $fire->AcresBurned;

        $get = mysqli_fetch_assoc(mysqli_query($con, "SELECT incidentId FROM wildfires WHERE year = $year AND state = 'CA' AND name LIKE '%$name%' AND date >= $start AND date <= $end AND display = 1"));
        $incidentNum = $get['incidentId'];

        if ($acres != '' && $incidentNum) {
            $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated) SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum');";
            $sqlQueries .= "UPDATE wildfires SET acres = '$acres', updated = '$time' WHERE year = $year AND state = 'CA' AND name LIKE '%$name%' AND date >= $start AND date <= $end;";
        }
    }
}

$sqlQueries .= "UPDATE dispatch_centers SET cad_update = '$time' WHERE agency = 'CAL FIRE';";

// add or update wildfires in database
if (!$runSQL) {
    echo $sqlQueries;
} else {
    $runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));
    if ($unSQL) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) { }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) { }
        } while (mysqli_next_result($con));
    }
}

echo 'Finished importing '.$count.' CAL FIRE incidents...
';