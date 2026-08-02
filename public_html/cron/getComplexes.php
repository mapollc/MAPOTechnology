<?
ini_set('display_errors', 1);
error_reporting(E_ALL);
include_once '../config.inc.php';
include_once '../apis/functions.inc.php';

function inc($s)
{
    if (substr($s, 0, 2) == date('y')) {
        return $s;
    } else {
        return str_pad($s, 6, '0', STR_PAD_LEFT);
    }
}

$runQuery = true;

$time = time();
$year = date('Y');

$sqlQueries = [];
$irwins = [];

echo '=========  Getting list of complexes =========' . PHP_EOL;

$baseURL = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query';
$url = "$baseURL?where=FireDiscoveryDateTime+%3E%3D+DATE+%2701%2F01%2F{$year}+00%3A00%3A00%27+AND+IncidentTypeCategory+%3D+%27CX%27&returnGeometry=false&outFields=IrwinID,IncidentName,UniqueFireIdentifier&f=json";
$json = json_decode(file_get_contents($url));

if (!$json->features) return;

foreach ($json->features as $fire) {
    $attr = $fire->attributes;
    $incidentID = $attr->UniqueFireIdentifier;
    $orginalName = $attr->IncidentName;
    $name = incidentName($attr->IncidentName, $incidentID, 'Wildfire');
    $irwinID = $attr->IrwinID;

    $irwins[] = [
        $irwinID,
        [
            $year,
            $incidentID,
            $name,
            $time
        ]
    ];

    echo "Getting complex: $orginalName ===> $name ($incidentID) | IRWIN ID: $irwinID" . PHP_EOL;
}

echo '=========  Finding child fires of each complex =========' . PHP_EOL;

foreach ($irwins as $irwin) {
    $json = json_decode(file_get_contents("$baseURL?where=CpxID+LIKE+%27{$irwin[0]}%27&outFields=IncidentName%2C+UniqueFireIdentifier&returnGeometry=true&f=json"));

    if (!$json->features) continue;

    foreach ($json->features as $feat) {
        $prop = $feat->attributes;
        $lat = $feat->geometry->y ?? 'NULL';
        $lon = $feat->geometry->x ?? 'NULL';

        $id = explode('-', $prop->UniqueFireIdentifier);
        $incNum = "$id[0]-$id[1]-" . inc($id[2]);
        $childName = mysqli_real_escape_string($con, incidentName($prop->IncidentName, $incNum, 'Wildfire'));

        $year = $irwin[1][0];
        $incID = $irwin[1][1];
        $name = mysqli_real_escape_string($con, $irwin[1][2]);
        $time = $irwin[1][3];

        $sqlQueries[] = "INSERT INTO complexes (
                year,incidentID,irwinID,name,lat,lon,child_fire,child_name,updated
            ) VALUES(
                $year,'$incID','$irwin[0]','$name',$lat,$lon,'$incNum','$childName',$time
            )
            ON DUPLICATE KEY UPDATE
                irwinID = VALUES(irwinID),
                name = VALUES(name),
                lat = VALUES(lat),
                lon = VALUES(lon),
                child_name = VALUES(child_name),
                updated = VALUES(updated)
        ";
    }
}

$queries = implode(';', $sqlQueries);

if ($runQuery) {
    $runSQL = mysqli_multi_query($con, $queries) or die(mysqli_error($con));

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
    }

    echo '=========  Finished parsing complexes & children fires =========' . PHP_EOL;
} else {
    echo $queries;
}

mysqli_close($con);
