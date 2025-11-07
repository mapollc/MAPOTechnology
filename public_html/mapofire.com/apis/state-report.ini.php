<?
$noMysql = true;
include_once('/home/mapo/public_html/db.ini.php');

function stdDev($total, $arr) {
    $num_of_elements = count($arr);
    $variance = 0.0;
    $average = $total / $num_of_elements;

    foreach ($arr as $i) {
        $variance += pow(($i - $average), 2);
    }

    return (float)sqrt($variance / $num_of_elements);
}

$state = convertState(str_replace('-', ' ', $method), 2);
$years = ($_REQUEST['years'] > 20 ? 20 : $_REQUEST['years']);
$end = date('Y', strtotime('-1 year')) . '-12-31';
$start = date('Y', strtotime('-' . $years . ' years')) . '-01-01';

$count = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=POOState+%3D+%27US-' . $state . '%27+AND+%28FireDiscoveryDateTime+%3E%3D+DATE+%27' . $start . '%27+AND+FireDiscoveryDateTime+%3C%3D+DATE+%27' . $end . '%27%29&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=true&returnUniqueIdsOnly=false&returnCountOnly=true&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json'))->count;

for ($z = 1; $z <= ceil($count / 2000); $z++) {
    $x = $z * 2000;
    $json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=POOState+%3D+%27US-' . $state . '%27+AND+%28FireDiscoveryDateTime+%3E%3D+DATE+%27' . $start . '%27+AND+FireDiscoveryDateTime+%3C%3D+DATE+%27' . $end . '%27%29&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=IncidentSize%2CFinalAcres%2CPOOLandownerCategory%2CPOOLandownerKind%2CPOOCounty&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=' . $x . '&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token='));

    for ($i = 0; $i < count($json->features); $i++) {
        $atr = $json->features[$i]->attributes;
        $size = ($atr->IncidentSize == '' || $atr->FinalAcres > $atr->IncidentSize ? $atr->FinalAcres : $atr->IncidentSize);

        if ($size != '') {
            $acres[] = $size;
        }

        $kinds[] = $atr->POOLandownerKind;
        $agencies[] = $atr->POOLandownerCategory;
        $counties[] = $atr->POOCounty;

        $coco[$atr->POOCounty] += $size;
    }
}

$totalAcres = array_sum($acres);
$min = min($acres);
$avg = $totalAcres / count($acres);
$max = max($acres);
$stdev = stdDev($totalAcres, $acres);
$kd = array_count_values($kinds);
$ag = array_count_values($agencies);
$cos = array_count_values($counties);

asort($kd);
asort($ag);
asort($cos);

$kd = array_reverse($kd);
$ag = array_reverse($ag);
$cos = array_reverse($cos);

foreach ($cos as $j => $n) {
    $county[$j] = array('count' => $n, 'acres' => $coco[$j]);
}

foreach ($acres as $s) {
    if ($s <= 0.1) {
        $a++;
    } else if ($s > 0.1 && $s < 1) {
        $b++;
    } else if ($s >= 1 && $s < 100) {
        $c++;
    } else if ($s >= 100 && $s < 1000) {
        $d++;
    } else if ($s >= 1000 && $s < 100000) {
        $e++;
    } else {
        $f++;
    }
}

$groups = array('0.1' => $a, '0.1-1' => $b, '1-100' => $c, '100-1k' => $d, '1k-100k' => $e, '100k' => $f);
$stats = array('count' => $count, 'min' => $min, 'average' => $avg, 'max' => $max, 'stdev' => $stdev, 'total' => $totalAcres, 'groups' => $groups,
                'responsible' => array('landowners' => $kd, 'agencies' => $ag, 'counties' => $county));

$returnJson = array('report' => array('years' => array('start' => date('Y', strtotime($start)), 'end' => date('Y', strtotime($end))), 'stats' => $stats));
