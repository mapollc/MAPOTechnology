<?
ini_set('memory_limit', '1024M');
include('../db.ini.php');

$result = mysqli_query($con, "select * from wildfires where date <= 7200");
while($row = mysqli_fetch_assoc($result)) {
    if ($row['date'] == '') {
        $date = strtotime($row['captured']);
        $data = mysqli_query($con, "update wildfires set date = '$date' where wfid = '$row[wfid]'");

    if (!$data) {
        $bad[] = $row['wfid'];
    }
}
    echo $row['incidentID'].' ---> '.$new.'
';
}

foreach($bad as $b) {
    echo "DELETE FROM wildfires WHERE wfid = '$b';";
}

/*$csv = array_map('str_getcsv', file('wildfires.csv'));

function status($t) {
    if ($t) {
        $a = explode(' | ', $t);
        foreach ($a as $b) {
            $c = explode(': ', $b);
            preg_match('/([0-9\/]+)\s([0-9]{4,})/', $c[1], $match);
            $time = strtotime($match[1].' '.substr($match[2], 0, 2).':'.substr($match[2], 2, 2));

            if ($c[0] == 'Contain') {
                $s['Contain'] = $time;
            }
            if ($c[0] == 'Control') {
                $s['Control'] = $time;
            }
            if ($c[0] == 'Out') {
                $s['Out'] = $time;
            }
        }
    }
    return ($s ? serialize($s) : '');
}

for ($i = 0; $i < count($csv); $i++) {
if ($csv[$i][8] == 'Complex') {
    $incidentId = $csv[$i][6];
    $state = $csv[$i][1];
    $agency = $csv[$i][2];
    $year = $csv[$i][4];
    $date = $csv[$i][5];
    $name = $csv[$i][7];
    $type = $csv[$i][8];
    $lat = $csv[$i][10];
    $lon = $csv[$i][11];
    $geo = preg_replace('/\s(N)\s/', ' North ', preg_replace('/\s(W)\s/', ' West ', preg_replace('/\s(E)\s/', ' East ', preg_replace('/\s(S)\s/', ' South ', unserialize($csv[$i][9])['location']))));
    $acres = $csv[$i][13];
    $status = status($csv[$i][15]);
    $notes = $csv[$i][14];
    $resources = $csv[$i][12];
    $fuels = $csv[$i][16];
    $captured = $csv[$i][17];
    $updated = $csv[$i][18];
    $timezone = $csv[$i][19];
    $display = $csv[$i][21];

        mysqli_query($con, "INSERT INTO wildfires (incidentID,state,agency,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display)
        VALUES('$incidentId','$state','$agency','$year','$date','$name','$type','$lat','$lon','$geo','$acres','$status','$notes','$resources','$fuels','$captured','$updated','$timezone','$display')");
    }

    echo 'Done with '.($i + 1).' of '.count($csv).'...
';
}*/
?>