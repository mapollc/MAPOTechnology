<?
function getData($url) {
    global $lat;
    global $lon;

    $json = json_decode(file_get_contents(str_replace(['{lat}', '{lon}'], [$lat, $lon], $url)));
    
    if (count($json->features) == 0) {
        return null;
    } else {
        return $json->features[0]->attributes;
    }
}

function erc() {
    $data = getData("https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/DRAFT_NFDRS_ERC_Forecasted/FeatureServer/1/query?where=1%3D1&objectIds=&geometry={lon}%2C{lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json");

    return ['indices' =>
        [
            'erc' => $data->avg_ec_percentile,
            'bi' => $data->avg_bi_percentile
        ]
    ];
}

function fema() {
    global $lat;
    global $lon;
    global $con;

    $loc = getLocation($con, [$lat, $lon]);

    $data = getData("https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=1%3D1&objectIds=&geometry={lon}%2C{lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=NRI_ID%2CCOUNTY%2CSTATEABBRV%2CWFIR_RISKS%2CWFIR_RISKR%2CPOPULATION%2CBUILDVALUE%2CAGRIVALUE%2CAREA&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json");

    return ['location' =>
        [
            'fips' => intval(substr($data->NRI_ID, 1, strlen($data->NRI_ID))),
            'county' => $data->COUNTY,
            'state' => $data->STATEABBRV,
            'near' => $loc,
            'population' => $data->POPULATION,
            'area' => $data->AREA,
            'values' => [
                'buildings' => $data->BUILDVALUE,
                'ag' => $data->AGRIVALUE
            ]
        ],
        'nri' => [
            'risk' => $data->WFIR_RISKS,
            'desc' => $data->WFIR_RISKR
        ]
    ];
}

function nfdrs() {
    global $lat;
    global $lon;
    $ratings = [];
    $rating = 0;

    $json = json_decode(file_get_contents("https://fsapps.nwcg.gov/psp/arcgis/rest/services/npsg/Fire_Danger/MapServer/identify?geometry=$lon%2C$lat&geometryType=esriGeometryPoint&sr=4326&layers=show%3A0&layerDefs=&time=&timeRelation=esriTimeRelationOverlaps&layerTimeOptions=&tolerance=1&mapExtent=-181%2C14%2C-12%2C60&imageDisplay=256%2C256%2C96&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&dynamicLayers=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnUnformattedValues=false&returnFieldName=false&datumTransformations=&layerParameterValues=&mapRangeValues=&layerRangeValues=&clipping=&spatialFilter=&f=json"));

    foreach ($json->results as $rate) {
        $ratings[] = $rate->attributes->FORECAST;
    }

    if (in_array('Extreme', $ratings)) {
        $rating = ['rating' => 5, 'desc' => 'Extreme'];
    } else if (in_array('Very High', $ratings)) {
        $rating = ['rating' => 4, 'desc' => 'Very High'];
    } else if (in_array('High', $ratings)) {
        $rating = ['rating' => 3, 'desc' => 'High'];
    } else if (in_array('Moderate', $ratings)) {
        $rating = ['rating' => 2, 'desc' => 'Moderate'];
    } else {
        $rating = ['rating' => 1, 'desc' => 'Low'];
    }

    return ['nfdrs' => $rating];
}

function drought() {
    $data = getData('https://gis.fema.gov/arcgis/rest/services/Partner/Drought_Current/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&timeRelation=esriTimeRelationOverlaps&geometry=%7B%22x%22%3A{lon}%2C%22y%22%3A{lat}%2C%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=dm%2Cupdate_dat&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&returnExtentOnly=false&sqlFormat=none&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=json');

    return ['drought' => $data == null ? null : $data->dm];
}

$lat = $_REQUEST['lat'];
$lon = $_REQUEST['lon'];

if ($lat && $lon) {
    $data = fema();
    $fips = $data['location']['fips'];

    $data = array_merge($data, erc());
    $data = array_merge($data, nfdrs());
    $data = array_merge($data, drought());

    $returnJson = ['rundown' => $data];
}