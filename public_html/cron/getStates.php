<?
set_time_limit(900);
ini_set('memory_limit','1024M');

$states = [
    "AL", "AK", "AZ", "AR", /*"CA",*/ "CO", "CT", "DE", "DC", "FL", "GA",
    "HI", /*"ID",*/ "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
    "MI", "MN", "MS", "MO", /*"MT",*/ "NE", "NV", "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", /*"OR",*/ "PA", "RI", "SC", "SD", "TN", "TX",
    "UT", "VT", "VA", /*"WA",*/ "WV", "WI", "WY"
];
$states2 = ['OR', 'ID','CA','WA','MT'];

$geometry = 'true';

function sendToMapbox($id, $json) {
    $token = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';
    $datasetID = 'clz3a8hkg0m371sqgb0i5okkw';
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/datasets/v1/mapollc/'.$datasetID.'/features/'.$id.'?access_token='.$token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));

    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $output = curl_error($ch);
    } else {
        $output = $result;
    }
    curl_close($ch);

    return $output;
}

for ($x = 0; $x < count($states); $x++) {
    $state = $states[$x];
    $json = json_decode(file_get_contents('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0/query?where=STATE_ABBR+%3D+%27'.$state.'%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry='.$geometry.'&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson&token='));

    for ($i = 0; $i < count($json->features); $i++) {
        #if ($json->features[$i]->properties->NAME == 'Union County') {
            $content = array('type' => 'Feature', 'geometry' => $json->features[$i]->geometry, 'properties' => $json->features[$i]->properties);
           
            sendToMapbox(strval($json->features[$i]->properties->OBJECTID), $content);
            echo 'Done with '.$json->features[$i]->properties->NAME.'...
';
        #}
    }

    echo '**** Done with state: '.$state.' ****
';
}