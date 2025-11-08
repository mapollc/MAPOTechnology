<?
#ini_set('display_errors',1);
#error_reporting(E_ALL);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

function inc($s) {
    if (substr($s, 0, 2) == date('y')) {
        return $s;
    } else {
        return str_pad($s, 6, '0', STR_PAD_LEFT);
    }
}

$sqlQueries = '';
$time = time();
$year = date('Y');
$irwins = [];
$url = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=FireDiscoveryDateTime+%3E%3D+DATE+%2701%2F01%2F'.$year.'+00%3A00%3A00%27+AND+IncidentTypeCategory+%3D+%27CX%27&returnGeometry=false&outFields=IrwinID,IncidentName,UniqueFireIdentifier&f=json';
$json = json_decode(file_get_contents($url), true);

for ($x = 0; $x < count($json['features']); $x++) {
    $prop = $json['features'][$x]['attributes'];  
    $name = ucwords(strtolower($prop['IncidentName']));
    $irwinID = $prop['IrwinID'];
    $id = explode('-', $prop['UniqueFireIdentifier']);
    $incID = $id[0].'-'.$id[1].'-'.inc($id[2]);

    $irwins[] = [
        $irwinID,
        [
            $year, $incID, $name, $time
        ]
    ];
}

foreach ($irwins as $irwin) {
    $json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=CpxID+LIKE+%27'.$irwin[0].'%27&outFields=IncidentName%2C+UniqueFireIdentifier&returnGeometry=false&f=json'));

    foreach ($json->features as $feat) {
        $id = explode('-', $feat->attributes->UniqueFireIdentifier);
        $incNum = $id[0].'-'.$id[1].'-'.inc($id[2]);
        $childName = incidentName($feat->attributes->IncidentName, $incNum);
        $year = $irwin[1][0];
        $incID = $irwin[1][1];
        $name = $irwin[1][2];
        $time = $irwin[1][3];

        $sqlQueries .= "INSERT IGNORE INTO complexes (year,incidentID,irwinID,name,child_fire,child_name,updated) VALUES('$year','$incID','$irwin[0]','$name','$incNum','$childName','$time');";
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

    echo 'Finished updating wildfire complexes...
';
} else {
    echo 'Unable to update wildfire complexes...
';
}

mysqli_close($con);