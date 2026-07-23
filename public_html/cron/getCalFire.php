<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

$timezone = 'America/Los_Angeles';
$theAgency = 'CAL FIRE';
$theState = 'CA';
$runQuery = true;

require_once 'getState.inc.php';

// ADDITIONAL CAL FIRE PROCESSING
$json = json_decode(file_get_contents('https://incidents.fire.ca.gov/umbraco/api/IncidentApi/List?inactive=false'));

if (count($json) > 0) {
    for ($i = 0; $i < count($json); $i++) {
        $fire = $json[$i];
        $name = str_replace(' Fire', '', $fire->Name);
        $started = strtotime($fire->Started);
        $start = strtotime(date('m/d/Y', $started) . ' 00:00:00 PST');
        $end = strtotime(date('m/d/Y', $started) . ' 23:59:59 PST');
        $acres = $fire->AcresBurned;

        $get = mysqli_fetch_assoc(mysqli_query($con, "SELECT incidentId FROM wildfires WHERE year = $year AND state = 'CA' AND name LIKE '%$name%' AND date >= $start AND date <= $end AND display = 1"));
        $incidentNum = $get['incidentId'];

        if ($acres != '' && $incidentNum) {
            $sqlQueries[] = "INSERT INTO acres_history (incidentID,acres,updated) SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum')";
            $sqlQueries[] = "UPDATE wildfires SET acres = '$acres', updated = '$time' WHERE year = $year AND state = 'CA' AND name LIKE '%$name%' AND date >= $start AND date <= $end";
        }
    }
}

$sqlQueries[] = "UPDATE dispatch_centers SET cad_update = '$time' WHERE agency = 'CAL FIRE'";

// add or update wildfires in database
if ($runQuery && !empty($sqlQueries) && count($sqlQueries) > 0) {
    $runSQL = implode(';', $sqlQueries);

    if (mysqli_multi_query($con, $runSQL)) {
        do {
            if ($result = mysqli_store_result($con)) {
                mysqli_free_result($result);
            }
        } while (mysqli_next_result($con));

        echo "Finished with $theAgency (modified $count incidents)...
";
    }
}

echo "Finished importing $count CAL FIRE incidents...
";

mysqli_close($con);