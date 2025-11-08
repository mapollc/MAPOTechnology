<?
include_once '../db.ini.php';
#include_once '../apis/functions.inc.php';
date_default_timezone_set('America/Los_Angeles');

$last = strtotime('-1 hour');
$agency = 'ORBMC';
$result = mysqli_query($con, "SELECT w2.incidentID AS id FROM wildfires AS w1 LEFT JOIN wildfires AS w2 ON w2.incidentID NOT LIKE '%-$agency%' AND RIGHT(w2.incidentID, 6) = RIGHT(w1.incidentID, 6) AND w2.agency = '$agency' AND w2.date >= $last AND w2.display = 1 WHERE w1.agency = '$agency' AND w1.incidentID LIKE '%-$agency%' AND w1.date >= $last AND w1.display = 1 ORDER BY w1.captured DESC");

while ($row = mysqli_fetch_assoc($result)) {
    $sqlQueries .= "UPDATE wildfires SET display = 2 WHERE incidentID = '" . preg_replace('/([0-9]+)\-([A-Z0-9]+)\-([0-9]+)/', "$1-$agency-$3", $row['id']) . "';";
}

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

    echo 'Reviewed duplicates for agency: ' . $agency . '...
';
}


#$sql = "UPDATE wildfires SET display = 2 WHERE ".substr($ids, 0, -4);
#mysqli_query($con, $sql);

/*$category = 'smk';
$outAgo = strtotime('-3 days');
#$result = mysqli_query($con, "SELECT w.*, i.data FROM wildfires AS w LEFT JOIN inciweb AS i ON i.state = w.state AND i.name = w.name AND i.year = w.year WHERE w.agency = 'ORBMC' AND w.year = '2024' AND type = 'Smoke Check' AND (status NOT LIKE '%s:3:\"Out\";%' OR (status LIKE '%s:3:\"Out\";%' AND REPLACE(SUBSTRING_INDEX(status, '\"Out\";i:', -1), \";}\", \"\") > ".$outAgo.")) AND display = 1 ORDER BY CAST(date AS float) DESC");
$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM wildfires WHERE wfid = 99426989"));
$status = unserialize($row['status']);
$show_fire = wildfireAlgorithm($category, $row['type'], $status, $row, $_REQUEST['archive']);

#echo getLocation($con, [45.32, -118.1]);

echo 'SHOW ON MAP,';

foreach ($row as $k => $v) {
    echo $k.',';
}
echo '
';

echo ($show_fire ? 'TRUE' : 'FALSE').',';

foreach ($row as $k => $v) {
    if ($k == 'date' || $k == 'updated' || $k == 'captured') {
        $v = date('m/j/y g:i A', $v);
    }

    echo '"'.$v.'",';
}*/

mysqli_close($con);
