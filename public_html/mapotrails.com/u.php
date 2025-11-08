<?
$file = json_decode(json_encode(simplexml_load_string(file_get_contents('./data/gpx/ladd_to_anthony_lakes.gpx'))));

#for ($i = 0; $i < 1; $i++) {
for ($i = 0; $i < count($file->trk->trkseg->trkpt); $i++) {
    $lat = $file->trk->trkseg->trkpt[$i]->{'@attributes'}->lat;
    $lon = $file->trk->trkseg->trkpt[$i]->{'@attributes'}->lon;

    $dem = json_decode(file_get_contents('https://api.open-elevation.com/api/v1/lookup?locations='.$lat.','.$lon))->results[0]->elevation;
    $lines .= '<trkpt lat="'.$lat.'" lon="'.$lon.'">
    <ele>'.$dem.'</ele>
</trkpt>';
}

echo $lines;
?>