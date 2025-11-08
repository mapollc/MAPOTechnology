<?
ini_set('display_errors', 0);
#error_reporting(E_ALL);
include_once '/home/mapo/database.inc.php';

function getResults($lat, $lon) {
    $json = json_decode(file_get_contents("https://p3eplmys2rvchkjx.svcs.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Counties/FeatureServer/0/query?where=1%3D1&objectIds=&geometry=$lon%2C$lat&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&resultType=none&distance=0.0&units=esriSRUnit_StatuteMile&relationParam=&returnGeodetic=false&outFields=NAME%2CFIPS&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json"));

    if ($json && count($json->features) > 0) {
        return [str_replace(' County', '', $json->features[0]->attributes->NAME), $json->features[0]->attributes->FIPS];
    } else {
        return null;
    }
}

$result = mysqli_query($con, "SELECT wfid, near, lat, lon FROM wildfires WHERE year = 2025 AND near like '%county\":null%' LIMIT 1000");

while ($row = mysqli_fetch_assoc($result)) {
    $data = getResults($row['lat'], $row['lon']);

    if ($data != null) {
        $near = json_decode($row['near']);
        $near->county = $data[0];
        $near->fips = $data[1];

        $new = mysqli_real_escape_string($con, json_encode($near));
        echo "UPDATE wildfires SET near = '$new' WHERE wfid = $row[wfid];
    ";
    }
}

/*ini_set('display_errors', 1);
error_reporting(E_PARSE && E_ERROR);
#include_once '/home/mapo/database.inc.php';

echo '<table>';

for ($year = 2017; $year < 2024; $year++) {
    for ($month = 1; $month < 13; $month++) {
        $start = $year . '-' . ($month < 10 ? '0' : '') . $month . '-01';
        $end = date("Y-m-t", strtotime($start));
        $json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/InFORM_FireOccurrence_Public/FeatureServer/0/query?where=FireDiscoveryDateTime%3E%3DTIMESTAMP+%27'.$start.'+00%3A00%3A00%27+AND+FireDiscoveryDateTime%3C%3DTIMESTAMP+%27'.$end.'+23%3A59%3A59%27&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=COUNT%28*%29+AS+total%2C+SUM%28CalculatedAcres%29+AS+acres&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json&token='));

        $count[$month] += $json->features[0]->attributes->total;
        $acres[$month] += $json->features[0]->attributes->acres;
#        echo '<tr><td>'.date('F', strtotime($start)).'</td><td>'.$json->features[0]->attributes->total.'</td><td>'.$json->features[0]->attributes->acres.'</td></tr>';
    }
}

for ($i = 1; $i < 13; $i++) {
    echo '<tr><td>'.$i.'</td><td>'.$count[$i].'</td><td>'.$acres[$i].'</td></tr>';
}

echo '</table>';

### get populations ###
/*for ($fip = 3; $fip < 51; $fip++) {
    $sqlQueries = '';
    $json = json_decode(file_get_contents('https://api.census.gov/data/2020/dec/pl?get=NAME,P1_001N&for=place:*&in=state:'.str_pad($fip, 2, '0', STR_PAD_LEFT)));

    if ($json) {
        for ($i = 1; $i < count($json); $i++) {
            preg_match('/(.*)\s([A-Za-z]+),\s([A-Za-z\s]+)$/', $json[$i][0], $matches);
            $city = mysqli_real_escape_string($con, $matches[1]);
            $state = $matches[3];
            $pop = $json[$i][1];
            $fips = str_pad($json[$i][2], 2, '0', STR_PAD_LEFT).str_pad($json[$i][3], 8, '0', STR_PAD_LEFT);

            $sqlQueries .= "UPDATE cities SET population = $pop, fips = '$fips' WHERE (city = '$city' AND state_name = '$state');";
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

        echo 'Updated state: '.$fip.'
';
    }
}*/

### process wildfire risk data ###
/*function rthmath($v) {
    return $v ? number_format(floatval(str_replace('%', '', $v) / 100), 2) : 0.00;
}

$json = json_decode(file_get_contents('https://data.mapotechnology.com/cache/wrc.json'));

for ($i = 0; $i < count($json); $i++) {
    $data = $json[$i];

    if ($data) {
        $state = $data->state;
        $name = mysqli_real_escape_string($con, explode(', ', $data->name)[0]);
        $fips = str_pad($data->STATEFP, 2, '0', STR_PAD_LEFT).str_pad($data->PLACEFP, 8, '0', STR_PAD_LEFT);
        $pop = $data->POP;
        $totalbldg = $data->TOTAL_BUILDINGS;
        $bme = rthmath($data->BUILDINGS_FRACTION_ME);
        $bie = rthmath($data->BUILDINGS_FRACTION_IE);
        $bde = rthmath($data->BUILDINGS_FRACTION_DE);
        $bpsr = rthmath($data->BP_STATE_RANK);
        $bpnr = rthmath($data->BP_NATIONAL_RANK);
        $rsr = rthmath($data->RISK_STATE_RANK);
        $rnr = rthmath($data->RISK_NATIONAL_RANK);

        $risk = [
            'pop' => $pop,
            'buildings' => [
                'count' => $totalbldg,
                'me' => $bme,
                'ie' => $bie,
                'de' => $bde
            ],
            'bp' => [
                'rank' => null,
                'state' => $bpsr,
                'us' => $bpnr
            ],
            'rps' => [
                'rank' => null,
                'state' => $rsr,
                'us' => $rnr
            ]
        ];

        $risk = serialize(json_encode($risk));
        mysqli_query($con, "INSERT IGNORE INTO risk (fips,type,state,name,data) VALUES('$fips','community','$state','$name','$risk')");
        echo 'Finished at '.$i.'...
';
    }
}*/

#mysqli_close($con);