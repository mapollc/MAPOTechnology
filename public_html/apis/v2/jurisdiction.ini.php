<?
$lat = $_REQUEST['lat'];
$lon = $_REQUEST['lon'];

if (!isset($lat) && !isset($_lon)) {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid latitude & longitude was supplied');
} else {
    $url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/DMP_JurisdictionalUnits_Public/FeatureServer/0/query?where=1%3D1&objectIds=&geometry=%7B%22x%22%3A$lon%2C%22y%22%3A$lat%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=JurisdictionalUnitID_sansUS%2CJurisdictionalKind%2CJurisdictionalUnitName%2CLocalName%2CJurisdictionalCategory&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson";

    $json = json_decode(file_get_contents($url));
    $juris = null;

    if (count($json->features) > 0) {
        $id = $json->features[0]->properties->JurisdictionalUnitID_sansUS;
        $juris = ['unitID' => $id, 'kind' => $json->features[0]->properties->JurisdictionalKind,
        'abbrev' => $json->features[0]->properties->JurisdictionalCategory,
        'unitName' => $json->features[0]->properties->JurisdictionalUnitName,
        'localName' => $json->features[0]->properties->LocalName,
        'agency' => $json->features[0]->properties->JurisdictionalCategory];

        if ($id) {
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT state, agency FROM dispatch_zones WHERE unit = '$id' LIMIT 1"));

            if ($row) {
                foreach ($row as $k => $v) {
                    $juris[$k] = $v;
                }
            }
        }
    }

    $returnJson = array('jurisdiction' => $juris);
}