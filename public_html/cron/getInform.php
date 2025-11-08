<?
/*ini_set('display_errors', 1);
error_reporting(E_ALL);*/

include_once '../db.ini.php';

function nullCheck($arr) {
    return array_filter($arr, fn($v) => !is_null($v));
}

$runQuery = true;
$count = 0;
$sqlQueries = '';
$dt = urlencode(date('Y-m-d H:i:s', strtotime('-7 days')));
$json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=ModifiedOnDateTime_dt+%3E%3DTIMESTAMP+%27'.$dt.'%27+AND+FireOutDateTime+IS+NULL&fullText=&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=EstimatedCostToDate%2CUniqueFireIdentifier%2CFireBehaviorGeneral%2CFireBehaviorGeneral1%2CFireBehaviorGeneral2%2CFireBehaviorGeneral3%2CFireCause%2CFireCauseGeneral%2CFireCauseSpecific%2CPrimaryFuelModel%2CSecondaryFuelModel%2CTotalIncidentPersonnel&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json'));

for ($i = 0; $i < count($json->features); $i++) {
//for ($i = 0; $i < 10; $i++) {
    $fire = $json->features[$i]->attributes;
    $id = $fire->UniqueFireIdentifier;

    // Collect values
    $fb = array_filter([$fire->FireBehaviorGeneral, $fire->FireBehaviorGeneral1, $fire->FireBehaviorGeneral2, $fire->FireBehaviorGeneral3]);
    $c  = array_filter([$fire->FireCause, $fire->FireCauseGeneral, $fire->FireCauseSpecific]);
    $f  = array_filter([$fire->PrimaryFuelModel, $fire->SecondaryFuelModel]);

    $ppl  = $fire->TotalIncidentPersonnel !== NULL ? $fire->TotalIncidentPersonnel : 'NULL';
    $cost = $fire->EstimatedCostToDate !== NULL ? $fire->EstimatedCostToDate : 'NULL';

    // Detect undetermined-only causes
    $isUndeterminedOnly = (count($c) === 1 && strcasecmp(reset($c), 'Undetermined') === 0);

    // Skip insert if everything is empty / null / undetermined
    if (
        (empty($f) || json_encode($f) === '[]') &&
        (empty($fb) || json_encode($fb) === '[]') &&
        $cost === 'NULL' &&
        $ppl === 'NULL' &&
        ($isUndeterminedOnly || empty($c))
    ) {
        echo "Skipping $id (no valid data)" . PHP_EOL;
        continue;
    }

    // Escape JSON values for DB
    $behave = mysqli_real_escape_string($con, json_encode(array_values($fb)));
    $cause  = mysqli_real_escape_string($con, json_encode(array_values($c)));
    $fuels  = mysqli_real_escape_string($con, json_encode(array_values($f)));

    // Only insert if at least one JSON array or numeric field has real data
    if ($fuels !== '[]' || $behave !== '[]' || $cause !== '[]' || $cost !== 'NULL' || $ppl !== 'NULL') {
        $sqlQueries .= "
            INSERT INTO wildfiresSupp (incidentID, fuels, causes, behavior, cost, people)
            VALUES ('$id', '$fuels', '$cause', '$behave', $cost, $ppl)
            ON DUPLICATE KEY UPDATE
                fuels = VALUES(fuels),
                causes = VALUES(causes),
                behavior = VALUES(behavior),
                cost = VALUES(cost),
                people = VALUES(people);
        ";
        $count++;
        echo "Data processed for incident $count of " . count($json->features) . "..." . PHP_EOL;
    } else {
        echo "Skipping $id (no usable data)" . PHP_EOL;
    }
}

if ($runQuery) {
    $runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));

    if ($runSQL) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) {}
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) {}
        } while (mysqli_next_result($con));

        echo 'Processing complete!
';
    }
} else {
    echo $sqlQueries;
}

/*for ($year = 2015; $year < 2023; $year++) {
    $total = 1;
    $count = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=FireDiscoveryDateTime%3E%3DTIMESTAMP+%27'.$year.'-01-01+00%3A00%3A00%27+AND+FireDiscoveryDateTime%3C%3DTIMESTAMP+%27'.$year.'-12-31+23%3A59%3A59%27&fullText=&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=EstimatedCostToDate%2CUniqueFireIdentifier%2CFireBehaviorGeneral%2CFireBehaviorGeneral1%2CFireBehaviorGeneral2%2CFireBehaviorGeneral3%2CFireCause%2CFireCauseGeneral%2CFireCauseSpecific%2CPrimaryFuelModel%2CSecondaryFuelModel%2CTotalIncidentPersonnel&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=true&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json'));
    $count = $count->count;
    $pages = ceil($count / 1000);

    for ($x = 0; $x < $pages; $x++) {
        $sqlQueries = '';
        $offset = 1000 * ($x + 1);
        $json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=FireDiscoveryDateTime%3E%3DTIMESTAMP+%27'.$year.'-01-01+00%3A00%3A00%27+AND+FireDiscoveryDateTime%3C%3DTIMESTAMP+%27'.$year.'-12-31+23%3A59%3A59%27&fullText=&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=EstimatedCostToDate%2CUniqueFireIdentifier%2CFireBehaviorGeneral%2CFireBehaviorGeneral1%2CFireBehaviorGeneral2%2CFireBehaviorGeneral3%2CFireCause%2CFireCauseGeneral%2CFireCauseSpecific%2CPrimaryFuelModel%2CSecondaryFuelModel%2CTotalIncidentPersonnel&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset='.$offset.'&resultRecordCount=1000&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json'));

        for ($i = 0; $i < count($json->features); $i++) {
            $fire = $json->features[$i]->attributes;
            $id = $fire->UniqueFireIdentifier;
            $fb = array();
            $c = array();
            $f = array();
        
            $fb[] = $fire->FireBehaviorGeneral;
            $fb[] = $fire->FireBehaviorGeneral1;
            $fb[] = $fire->FireBehaviorGeneral2;
            $fb[] = $fire->FireBehaviorGeneral3;
        
            $c[] = $fire->FireCause;
            $c[] = $fire->FireCauseGeneral;
            $c[] = $fire->FireCauseSpecific;
        
            $f[] = $fire->PrimaryFuelModel;
            $f[] = $fire->SecondaryFuelModel;
        
            $ppl = $fire->TotalIncidentPersonnel != NULL ? $fire->TotalIncidentPersonnel : 'NULL';
            $cost = $fire->EstimatedCostToDate != NULL ? $fire->EstimatedCostToDate : 'NULL';
        
            $behave = mysqli_real_escape_string($con, json_encode(nullCheck($fb)));
            $cause = mysqli_real_escape_string($con, json_encode(nullCheck($c)));
            $fuels = mysqli_real_escape_string($con, json_encode(nullCheck($f)));

            if (!empty($behave) && !empty($cause) && !empty($fuels)) {
                $sqlQueries .= "INSERT INTO wildfiresSupp (incidentID,fuels,causes,behavior,cost,people) VALUES ('$id','$fuels','$cause','$behave',$cost,$ppl)
                ON DUPLICATE KEY UPDATE incidentID = VALUES(incidentID), fuels = '$fuels', causes = '$cause', behavior = '$behave', cost = $cost, people = $ppl;";
        
                echo 'Data processed for incident '.$total.' of '.$count.'...
        ';
                $total++;
            }
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
        }

        echo 'Processing complete for page '.$x.'!
';    
    }

    echo 'Processing complete for '.$year.'!
';
}*/

mysqli_close($con);