<?
ini_set('display_errors', 1);
error_reporting(E_ALL);

$con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_odot');

if (mysqli_connect_errno()) {
    echo 'Failed to connect to MySQL: '.mysqli_connect_error();
}

$result = mysqli_query($con, "SELECT unit, region, district FROM `sections` GROUP BY unit, region, district ORDER BY unit ASC");

while ($row = mysqli_fetch_assoc($result)) {
    mysqli_query($con, "UPDATE crews SET region = $row[region], district = '$row[district]' WHERE id = $row[unit]") or die(mysqli_error($con));
}

/*$json = json_decode(file_get_contents('https://gis.odot.state.or.us/arcgis1006/rest/services/transgis/catalog/MapServer/310/query?where=HWYNUMB+%3D+%27066%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=json'));

for ($i = 0; $i < count($json->features); $i++) {
    $s = $json->features[$i]->attributes;
    $hwy = $s->HWYNUMB;
    $name = mysqli_real_escape_string($con, $s->HWYNAME);
    $sfx = $s->ST_HWY_SFX;
    $mp1 = $s->BEGMP;
    $mp2 = $s->ENDMP;
    $unit = $s->UNIT;
    $reg = $s->ODOT_REG;
    $dist = $s->ODOT_DIST;
    $county = $s->CNTY_CODE;

    print_r($s);

    /*mysqli_query($con, "INSERT INTO sections (county,region,district,crew,hwy,name,sfx,start_mp,end_mp)
    VALUES('$county','$reg','$dist','$unit','$hwy','$name','$sfx','$mp1','$mp2')") or die(mysqli_error($con));
}

/*$json = json_decode(file_get_contents('https://gis.odot.state.or.us/arcgis1006/rest/services/transgis/catalog/MapServer/284/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=CNTY_CODE%2CCNTY_NAME&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=CNTY_CODE&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=true&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=json'));;

for ($i = 0; $i < 36; $i++) {
    echo "'".$json->features[$i]->attributes->CNTY_CODE."' => '".$json->features[$i]->attributes->CNTY_NAME."',
";
}

/*$result = mysqli_query($con, "SELECT * FROM road_network WHERE start_mp = 0 AND end_mp = 0 ORDER BY id ASC");

while ($row = mysqli_fetch_assoc($result)) {
    $hwy = $row['hwy'];
    $road = urlencode($row['name']);
    $url = 'https://gis.odot.state.or.us/arcgis1006/rest/services/transgis/catalog/MapServer/170/query?where=HWYNUMB+%3D+%27'.$hwy.'%27+AND+HWYNAME+%3D+%27'.$road.'%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=BEGMP%2CENDMP&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=BEGMP+ASC%2C+ENDMP+ASC&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=json';
    $json = json_decode(file_get_contents($url));

    $mp1 = $json->features[0]->attributes->BEGMP;
    $mp2 = $json->features[count($json->features) - 1]->attributes->ENDMP;

    mysqli_query($con, "UPDATE road_network SET start_mp = '$mp1', end_mp = '$mp2' WHERE id = '$row[id]'");
    echo "Updated $hwy: $road...
";
}


/*$numbs = json_decode(file_get_contents('https://gis.odot.state.or.us/arcgis1006/rest/services/transgis/catalog/MapServer/166/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=HWYNUMB&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=HWYNUMB+ASC&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=true&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=json'));

for ($x = 0; $x < count($numbs->features); $x++) {
    $road = [];
    $hwynum = $numbs->features[$x]->attributes->HWYNUMB;

    if ($hwynum) {
        $json = json_decode(file_get_contents('https://gis.odot.state.or.us/arcgis1006/rest/services/transgis/catalog/MapServer/166/query?where=HWYNUMB+%3D+%27'.$hwynum.'%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=HWYNAME%2CHWYNUMB%2CRDWY_ID%2CALL_RTE%2CI_SIGN%2CUS_SIGN_1%2COR_SIGN_1%2CUS_SIGN_2%2COR_SIGN_2&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=true&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=json'));

        for ($i = 0; $i < count($json->features); $i++) {
            $s = $json->features[$i]->attributes;

            if ($s->I_SIGN) {
            $road[] = 'I-'.$s->I_SIGN.'|'.$s->HWYNAME;
            }
            if ($s->US_SIGN_1) {
            $road[] = 'US-'.$s->US_SIGN_1.'|'.$s->HWYNAME;
            }
            if ($s->OR_SIGN_1) {
            $road[] = 'OR-'.$s->OR_SIGN_1.'|'.$s->HWYNAME;
            }
            if ($s->US_SIGN_2) {
            $road[] = 'US-'.$s->US_SIGN_2.'|'.$s->HWYNAME;
            }
            if ($s->OR_SIGN_2) {
            $road[] = 'OR-'.$s->OR_SIGN_2.'|'.$s->HWYNAME;
            }

            //print_r($s);
        }
        $road = array_values(array_unique($road));

        foreach ($road as $r) {
            $s = explode('|', $r);
            $hwy = $s[0];
            $name = mysqli_real_escape_string($con, $s[1]);

            mysqli_query($con, "INSERT INTO road_network (hwy,road,name) VALUES('$hwynum','$hwy','$name')") or die(mysqli_error($con));
        }
    }
}*/