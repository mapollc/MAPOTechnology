<?
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$time = time();
$year = date('Y');
$count = 0;

for ($x = 0; $x < 2; $x++) {
    $url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=POOState+%3D+%27US-$theState%27+AND+FireDiscoveryDateTime+>%3D+DATE+%2701%2F01%2F{$year}+12%3A00+AM%27+AND+ModifiedOnDateTime_dt+>%3D+DATE+%27" . urlencode(date('m/d/Y g:i A', strtotime('-15 minutes'))) . "%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=FireDiscoveryDateTime+DESC&resultOffset=" . ($x == 1 ? 2000 : '') . "&returnExceededLimitFeatures=true&f=geojson";
    $json = json_decode(file_get_contents($url));

    if (!$json->features) continue;

    for ($i = 0; $i < count($json->features); $i++) {
        #for ($i = 10; $i < 12; $i++) {
        $fire = $json->features[$i];
        $geometry = $fire->geometry;
        $prop = $fire->properties;

        if ($prop->IncidentTypeCategory == 'WF' || $prop->IncidentTypeCategory == 'RX') {
            $state = str_replace('US-', '', $prop->POOState);
            $agency = $theState == 'CA' ? 'CAL FIRE' : $prop->POODispatchCenterID;
            $date = round($prop->FireDiscoveryDateTime / 1000);
            $year = date('Y', $date);
            $incidentNum = $prop->UniqueFireIdentifier;
            $incParts = explode('-', $incidentNum);
            $incidentUnit = $incParts[1];
            $incNumOnly = $incParts[2];
            $name = mysqli_real_escape_string($con, incidentName($prop->IncidentName, $incidentNum));
            $incidentType = $prop->IncidentTypeCategory == 'WF' ? 'Wildfire' : ($prop->IncidentTypeCategory == 'RX' ? 'Prescribed fire' : '');
            $lat = $geometry->coordinates[1];
            $lon = $geometry->coordinates[0];
            $getLocation = getLocation($con, [$lat, $lon], false, $state);
            $getCounty = getCounty($con, [$lat, $lon]);
            $geo = mysqli_real_escape_string($con, $getLocation);
            $acres = $prop->DailyAcres ? $prop->DailyAcres : $prop->CalculatedAcres;
            $acres = !$acres ? $prop->DiscoveryAcres : $acres;
            $fuel1 = $prop->PredominantFuelGroup;
            $fuel2 = $prop->PrimaryFuelModel;
            $fuel3 = $prop->SecondaryFuelModel;
            $status = [];
            $fuels = ($fuel1 ? $fuel1 . ($fuel2 || $fuel3 ? ', ' : '') : '') . ($fuel2 ? $fuel2 . ($fuel3 ? ', ' : '') : '') . ($fuel3 ? $fuel3 : '');
            $updated = $prop->ModifiedOnDateTime ? ($prop->ModifiedOnDateTime / 1000) : $time;

            if ($getCounty) {
                $near = $getCounty;
            } else {
                $near = [
                    'county' => null,
                    'fips' => null
                ];
            }
            $near['near'] = $getLocation ? $getLocation : null;
            $near = mysqli_real_escape_string($con, json_encode($near));

            if ($prop->ContainmentDateTime != null) {
                $status['Contain'] = round($prop->ContainmentDateTime / 1000);
            }

            if ($prop->ControlDateTime != null) {
                $status['Control'] = round($prop->ControlDateTime / 1000);
            }

            if ($prop->FireOutDateTime != null) {
                $status['Out'] = round($prop->FireOutDateTime / 1000);
            }

            $status = count($status) > 0 ? json_encode($status) : '';

            $sqlQueries .= "INSERT INTO wildfires (
                incidentID,incidentNumOnly,state,agency,unit,`year`,`date`,name,type,
                lat,lon,geo,near,acres,`status`,notes,resources,fuels,captured,updated,
                timezone,display,owner
            )
            VALUES(
                '$incidentNum','$incNumOnly','$state','$agency','$incidentUnit','$year','$date',
                '$name','$incidentType','$lat','$lon','$geo','$near','$acres',
                '$status','','','$fuels','$time','$updated','$timezone','1','system'
            )
            ON DUPLICATE KEY UPDATE
                state = IF('$state' = '', state, '$state'),
                agency = VALUES(agency),
                unit = VALUES(unit),
                `year` = VALUES(`year`),
                `date` = VALUES(`date`),
                name = VALUES(name),
                type = VALUES(type),
                lat = VALUES(lat),
                lon = VALUES(lon),
                geo = VALUES(geo),
                near = VALUES(near),
                acres = VALUES(acres),
                `status` = VALUES(`status`),
                notes = CASE WHEN (notes IS NULL OR notes = '') AND VALUES(notes) <> '' THEN VALUES(notes) ELSE notes END,
                resources = CASE WHEN (resources IS NULL OR resources = '') AND VALUES(resources) <> '' THEN VALUES(resources) ELSE resources END,
                fuels = CASE WHEN (fuels IS NULL OR fuels = '') AND VALUES(fuels) <> '' THEN VALUES(fuels) ELSE fuels END,
                updated = '$time',
                timezone = VALUES(timezone),
                display = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END,
                owner = VALUES(owner);
            ";

            if ($acres != '') {
                $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated)
                    SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS
                    (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum');";
            }

            echo "Processing $theAgency incident " . ($i + 1) . " of " . count($json->features) . "...
";
        }

        $count++;
    }
}

$sqlQueries .= "UPDATE dispatch_centers SET cad_update = '$time' WHERE agency = '$theAgency';";

// add or update wildfires in database
if ($runQuery) {
    $runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));

    if ($runSQL) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) {
                }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) {
            }
        } while (mysqli_next_result($con));

        echo "Finished with $theAgency (modified $count incidents)...
";
    } else {
        echo "Unable to update data for $theAgency...
";
    }
} else {
    echo $sqlQueries;
}

logEvent("Processed $theAgency wildfire data", true);