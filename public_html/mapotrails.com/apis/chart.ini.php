<?
$geo = json_decode($_REQUEST['geo']);

function getElevation($lat, $lon) {
    return round(json_decode(file_get_contents('https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify?geometry=%7B%22y%22%3A'.$lat.'%2C%22x%22%3A'.$lon.'%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&mosaicRule=&renderingRule=&renderingRules=&pixelSize=&time=&returnGeometry=false&returnCatalogItems=false&f=json'))->value * 3.28084, 1);
}

if (count($geo) < 2) {
    $out = array('error' => 'There are not enough points to chart this line.');
} else {
    $dist = $gain = $loss = 0;

    for ($i = 0; $i < count($geo); $i++) {
        $x = $i - 1;
        
        $elev = getElevation($geo[$i]->lat, $geo[$i]->lng);
        $elevations[] = $elev;

        if ($i > 0) {
            $distance = distance($geo[$i]->lat, $geo[$i]->lng, $geo[$x]->lat, $geo[$x]->lng);
            $dist += $distance;
            $gain += ($elev > $prevElev ? $elev - $prevElev : 0);
            $loss += ($elev < $prevElev ? $elev - $prevElev : 0);

            $slope = round(($elev - $prevElev) / (($dist * 5280) - ($prevDist * 5280)) * 100, 1);
            if (!is_nan($slope)) {
                $slopes[] = $slope;
            }
        }

        $point[] = array(/*'coords' => array($geo[$i]->lat, $geo[$i]->lng), */'distance' => $dist, 'elevation' => $elev);
        $prevElev = $elev;
        $prevDist = $dist;
    }

    $out = array('track' => array('points' => $point,
                                'slope' => array('avg' => round(array_sum($slopes) / count($slopes), 1), 'max' => (max($slopes) == 0 ? min($slope) : max($slopes))),
                                'elevation' => array('min' => min($elevations), 'max' => max($elevations)),
                                'altitude' => array('gain' => $gain, 'loss' => $loss)));
}

$returnJson = $out;
?>