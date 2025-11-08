<?
$lat = $_REQUEST['lat'];
$lon = $_REQUEST['lon'];

$json1 = json_decode(file_get_contents('https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/GTAC_IVMQuery_01/MapServer/4/query?geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%7D%2C+%22y%22%3A+'.$lat.'%2C+%22x%22%3A+'.$lon.'%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=COMMONNAME&returnGeometry=false&f=json'));
$json2 = json_decode(file_get_contents('https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/GTAC_IVMQuery_01/MapServer/5/query?geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%7D%2C+%22y%22%3A+'.$lat.'%2C+%22x%22%3A+'.$lon.'%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=WILDERNESSNAME&returnGeometry=false&f=json'));
$json3 = json_decode(file_get_contents('https://epqs.nationalmap.gov/v1/json?x='.$lon.'&y='.$lat.'&units=Feet&output=json'));

$natl = $json1->features[0]->attributes->COMMONNAME;
$wild = $json2->features[0]->attributes->WILDERNESSNAME;
$elev = number_format($json3->value, 1);

$returnJson = array('data' => array('forest' => $natl, 'wilderness' => $wild, 'elevation' => $elev));
?>