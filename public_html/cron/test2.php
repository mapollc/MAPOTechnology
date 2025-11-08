<?
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

function isValidCoordinate($lat, $lon) {
    // Check both are numeric
    if (!is_numeric($lat) || !is_numeric($lon)) {
        return false;
    }

    // Convert to float (in case of string numbers)
    $lat = (float)$lat;
    $lon = (float)$lon;

    // Check valid ranges
    if ($lat < -90 || $lat > 90) return false;
    if ($lon < -180 || $lon > 180) return false;

    return true;
}

$result = mysqli_query($con, "SELECT * FROM wildfires WHERE near LIKE '%county\":null%' AND year = 2024");

while ($row = mysqli_fetch_assoc($result)) {
    if (isValidCoordinate($row['lat'], $row['lon'])) {
        $loc = getLocation($con, [$row['lat'], $row['lon']]);
        $county = getCounty($con, [$row['lat'], $row['lon']]);

        if ($county) {
            $arr = $county;
        }

        $arr['near'] = $loc ? $loc : null;

        $geo = mysqli_real_escape_string($con, $loc);
        $near = mysqli_real_escape_string($con, json_encode($arr));

        if ($geo || $near) {
            mysqli_query($con, "UPDATE wildfires SET geo = '$geo', near = '$near' WHERE wfid = $row[wfid]");
            echo "Done with wfid #$row[wfid]...
";
        }
    }

    /*$arr = [
        'county' => null,
        'fips' => null,
        'near' => $row['geo']
    ];
    $geo = mysqli_real_escape_string($con, json_encode($arr));

    mysqli_query($con, "UPDATE wildfires SET near = '$geo' WHERE wfid = $row[wfid]");
    echo 'Done with wfid #'. $row['wfid'] . ' ('.$row['year'].')...
';*/
}

mysqli_close($con);

/*include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$result = mysqli_query($con, "SELECT wfid, geo, lat, lon FROM wildfires WHERE year = 2025 AND near = '' ORDER BY updated DESC LIMIT 10");
while ($row = mysqli_fetch_assoc($result)) {
    $county = getCounty($con, [$row['lat'], $row['lon']]);

    if ($row['geo'] != '') {
        $county['near'] = $row['geo'];
    }

    if ($county != null) {
        $near = mysqli_real_escape_string($con, json_encode($county));
        $sqlQueries .= "UPDATE wildfires SET near = '$near' WHERE wfid = '$row[wfid]';";
    }
}

/*function bounds($geo)
{
    $xs = [];
    $ys = [];

    if ($geo->type == 'MultiPolygon') {
        foreach ($geo->coordinates as $polygon) {
            foreach ($polygon as $ring) {
                foreach ($ring as $coords) {
                    $xs[] = $coords[0];
                    $ys[] = $coords[1];
                }
            }
        }
    } else { // Polygon
        foreach ($geo->coordinates as $ring) {
            foreach ($ring as $coords) {
                $xs[] = $coords[0];
                $ys[] = $coords[1];
            }
        }
    }

    return [
        'x' => ['min' => max($xs), 'max' => min($xs)],
        'y' => ['min' => min($ys), 'max' => max($ys)]
    ];
}

foreach ($statesArray as $state => $sn) {
    $file = file_get_contents('https://p3eplmys2rvchkjx.svcs.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0/query?where=STATE_ABBR+%3D+%27' . $state . '%27&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=NAME%2CSTATE_ABBR%2CFIPS%2CPOPULATION&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=5&outSR=&defaultSR=&datumTransformation=&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=NAME+ASC&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson');

    if ($file) {
        $json = json_decode($file);

        if (is_array($json->features) && count($json->features) > 0) {
            for ($i = 0; $i < count($json->features); $i++) {
                $feats = $json->features[$i]->properties;
                $geometry = $json->features[$i]->geometry;
                $name = mysqli_real_escape_string($con, str_replace(' County', '', $feats->NAME));
                $state = $feats->STATE_ABBR;
                $pop = $feats->POPULATION;
                $fips = $feats->FIPS;
                $bounds = bounds($geometry);
                $xmin = $bounds['x']['min'];
                $xmax = $bounds['x']['max'];
                $ymin = $bounds['y']['min'];
                $ymax = $bounds['y']['max'];
                $geo = mysqli_real_escape_string($con, gzcompress(json_encode($geometry)));

                mysqli_query($con, "INSERT INTO counties (name,state,fips,population,xmin,xmax,ymin,ymax,geo) VALUES('$name','$state','$fips','$pop','$xmin','$xmax','$ymin','$ymax','$geo')");
                echo 'Added ' . $name . ' County...
';
            }
            echo '-----------Finished with ' . $state . '-----------
';
        }
    }
}
/*ini_set('display_errors', 1);
error_reporting(E_PARSE && E_ERROR);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

$year = date('Y');

class Incident
{
    public $fire;
    public $properties;

    public function __construct($fire = null)
    {
        $this->fire = $fire;
        $this->properties = $fire->attributes;
    }

    function attributes()
    {
        return $this->properties;
    }

    function getLat()
    {
        return $this->fire->geometry->y;
    }

    function getLon()
    {
        return $this->fire->geometry->x;
    }

    function getCoords()
    {
        return [$this->getLat(), $this->getLon()];
    }

    function getState()
    {
        return str_replace('US-', '', $this->properties->POOState);
    }

    function getCounty()
    {
        return $this->properties->POOCounty;
    }

    function geocode($near)
    {
        return json_encode([
            'fips' => intval($this->properties->POOFips),
            'county' => $this->getCounty(),
            'state' => $this->getState(),
            'near' => $near
        ]);
    }

    function fuels()
    {
        $fuels = null;
        $a = $this->properties->PrimaryFuelModel;
        $b = $this->properties->SecondaryFuelModel;

        if ($a) {
            $fuels[] = $a;
        }

        if ($b) {
            $fuels[] = $b;
        }

        return $fuels != null ? implode(', ', $fuels) : '';
    }

    function status()
    {
        $status = [];
        $contain = $this->properties->ContainmentDateTime;
        $control = $this->properties->ControlDateTime;
        $out = $this->properties->FireOutDateTime;

        if ($contain != '') {
            $status['Contain'] = round($contain / 1000, 0);
        }

        if ($control != '') {
            $status['Control'] = round($control / 1000, 0);
        }

        if ($out != '') {
            $status['Out'] = round($out / 1000, 0);
        }

        return count($status) == 0 ? '' : json_encode($status);
    }
}

$batchSize = 500;
$sqlBatch = [];
$counter = 0;

$result = mysqli_query($con, "SELECT wfid, incidentID FROM wildfires WHERE year = $year AND type != 'Smoke Check' ORDER BY wfid DESC");

while ($row = mysqli_fetch_assoc($result)) {
    $url = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query?where=UniqueFireIdentifier+%3D+%27' . $row['incidentID'] . '%27&fullText=&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=POOCounty%2CPOOFips%2CPOOState%2CPrimaryFuelModel%2CSecondaryFuelModel%2CContainmentDateTime%2CControlDateTime%2CFireOutDateTime&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json';
    $json = json_decode(file_get_contents($url));

    $fire = new Incident($json->features[0]);
    $state = $fire->getState();
    $county = $fire->getCounty();
    $fuels = $fire->fuels();
    $status = mysqli_real_escape_string($con, $fire->status());
    $near = mysqli_real_escape_string($con, getLocation($con, $fire->getCoords(), false, $state));
    $geo = mysqli_real_escape_string($con, $fire->geocode($near));

    $sqlBatch[] = "UPDATE wildfires SET
    geo = CASE WHEN geo = '' OR geo IS NULL THEN '$near' ELSE geo END, near = '$geo',
    fuels = CASE WHEN fuels = '' OR fuels IS NULL THEN '$fuels' ELSE fuels END,
    status = CASE WHEN status = '' OR status IS NULL THEN '$status' ELSE status END WHERE wfid = $row[wfid]";

    $counter++;

    if ($counter % $batchSize === 0) {
        if (mysqli_multi_query($con, implode(";", $sqlBatch))) {
            do {
                if ($res = mysqli_store_result($con)) {
                    mysqli_free_result($res);
                }
            } while (mysqli_more_results($con) && mysqli_next_result($con));
        } else {
            die(mysqli_error($con));
        }

        echo "Processed batch of $batchSize, last wfid: {$row['wfid']}...
";
        $sqlBatch = [];
    }
}

if (!empty($sqlBatch)) {
    if (mysqli_multi_query($con, implode(";", $sqlBatch))) {
        do {
            if ($res = mysqli_store_result($con)) {
                mysqli_free_result($res);
            }
        } while (mysqli_more_results($con) && mysqli_next_result($con));
    } else {
        die(mysqli_error($con));
    }

    echo "Processed final batch, last wfid: {$row['wfid']}
";
}

mysqli_close($con);

/*ini_set('display_errors',1);
include_once '../db.ini.php';
include_once '../apis/functions.inc.php';

print_r(getLocation2($con, [45.9629, -118.9953], true));

$thresholds = [
    ['AL' => 17941.681818182],
['AK' => 2769.8780487805],
['AZ' => 15658.552083333],
['AR' => 4119.6983425414],
['CA' => 21365.458082192],
['CO' => 17686.610305958],
['CT' => 12634.113636364],
['DE' => 4114.8252427184],
['DC' => 229848.33333333],
['FL' => 13054.353338969],
['GA' => 5369.3442288049],
['HI' => 7780.362745098],
['ID' => 2885.2234042553],
['IL' => 6886.9033816425],
['IN' => 4073.5063291139],
['IA' => 2233.2327586207],
['KS' => 2682.5925925926],
['KY' => 1609.7391304348],
['LA' => 3870.2163522013],
['ME' => 2301.6015779093],
['MD' => 6556.799744898],
['MA' => 13455.049304054],
['MI' => 9166.8243626062],
['MN' => 8551.8952380952],
['MS' => 2426.610787172],
['MO' => 2910.6475770925],
['MT' => 1402.4600389864],
['NE' => 2454.6458658346],
['NV' => 19076.801282051],
['NH' => 2603.2162162162],
['NJ' => 9020.7570093458],
['NM' => 3087.6465364121],
['NY' => 426081.40385591],
['NC' => 6249.5452755906],
['ND' => 1249.8773006135],
['OH' => 5406.8541801685],
['OK' => 3628.6289954338],
['OR' => 6508.651119403],
['PA' => 3349.5233680958],
['RI' => 7665.8720930233],
['SC' => 14268.671641791],
['SD' => 1459.3646055437],
['TN' => 8663.4661870504],
['TX' => 9210.8625204583],
['UT' => 8071.3187660668],
['VT' => 1495.9419795222],
['VA' => 5771.6099815157],
['WA' => 8048.5281531532],
['WV' => 1514.0900109769],
['WI' => 6492.8139303483],
['WY' => 3538.3423076923]
];

$thresholds = array_merge(...$thresholds);
$coords = [47.7533, -120.5496];
$locations = [];
$bestCity = null;
$closestCity = null;
$bestScore = 1000000;

$minLat = round($coords[0] - 0.5, 1);
$maxLat = round($coords[0] + 0.5, 1);
$minLon = round($coords[1] + 0.5, 1);
$maxLon = round($coords[1] - 0.5, 1);

$result = mysqli_query($con, "SELECT city, county, state_prefix AS state, zip_code, population, lat, lon, 
(3959 * acos(cos(radians($coords[0])) * cos(radians(lat)) * cos(radians(lon) - radians($coords[1])) + 
sin(radians($coords[0])) * sin(radians(lat)))) AS distance FROM cities WHERE (lat BETWEEN $minLat AND $maxLat) AND 
(lon BETWEEN $maxLon AND $minLon) ORDER BY distance ASC, state ASC, city ASC LIMIT 50");

while ($row = mysqli_fetch_assoc($result)) {
    $locations[] = $row;
    $state = $row['state'];
    $population = $row['population'];
    $threshold = $thresholds[$state] ?? 0; // Use the flattened array

    // Check if the current city's population is greater than the state's threshold
    if ($population > $threshold) {
        $bestCity = $row;
        $bestScore = 0; // Set to a value that will prevent further looping
        break; // Exit the loop as we found a suitable city
    }
}

// If no city met the threshold, fallback to the existing "best score" logic
if ($bestCity === null) {
    foreach ($locations as $row) {
        if (!$closestCity) {
            $closestCity = $row;
        }

        $distance = $row['distance'];
        $population = $row['population'];
        $score = $population > 0 ? $distance / log($population + 1) : 0;

        if ($score < $bestScore) {
            $bestScore = $score;
            $bestCity = $row;
            break;
        }
    }
}

$chosenCity = $bestCity ?? $closestCity;

if ($chosenCity && $chosenCity['distance'] > 25) {
    $newBestCity = null;
    $maxPopulation = 0;
    
    $chosenCityId = $chosenCity['city'] . $chosenCity['state'];

    foreach ($locations as $row) {
        $currentCityId = $row['city'] . $row['state'];
        
        if ($currentCityId !== $chosenCityId && $row['population'] > $maxPopulation) {
            $maxPopulation = $row['population'];
            $newBestCity = $row;
        }
    }

    if ($newBestCity) {
        $chosenCity = $newBestCity;
    }
}

if ($chosenCity) {
    $dist = number_format($chosenCity['distance'], 1);
    $bearing = getBearing($chosenCity['lat'], $chosenCity['lon'], $coords[0], $coords[1]);
    $near = $dist . ' miles ' . $bearing . ' of ' . $chosenCity['city'] . ', ' . $chosenCity['state'];

    echo $near;
}

#phpinfo();
#print_r(opcache_get_status());
/*exit();
date_default_timezone_set('UTC');
include_once '../apis/functions.inc.php';

if ($_REQUEST['hour'] == '72') {
    $times = get_html('https://www.wpc.ncep.noaa.gov/Prob_Precip/hourly-data/latest/fcst_time.txt?'.time());
    $year = substr($times, 0, 4);
    $month = substr($times, 4, 2);
    $day = substr($times, 6, 2);
    $hour = substr($times, 8, 2);
    $cycle = new DateTime();
    $cycle->setTimezone(new DateTimeZone('UTC'));
    $cycle->setDate($year, $month, $day);
    $cycle->setTime($hour, 0, 0);

    $accumPeriods = [];
    $cycleHourString = str_pad($cycle->format('H'), 2, '0', STR_PAD_LEFT);

    if (in_array($cycleHourString, ['00', '01', '02', '03', '04', '05', '11', '12', '13', '14', '15', '16', '17', '22', '23'])) {
        $accumPeriods = [24, 72];
    } else if (in_array($cycleHourString, ['06', '07', '08', '09', '10', '18', '19', '20', '21'])) {
        $accumPeriods = [24, 66];
    }

    $offsetValues = [0, 1, 2, 3, 4, 5];
    $offset = $offsetValues[$hour % 6];
    $start = 24 - $offset;
    $fHour = in_array($hour, ['11', '22', '23']) ? max($accumPeriods) + 6 - $offset : max($accumPeriods) - $offset;
    $accumPeriod = array_slice($accumPeriods, -1);

    $url = "https://www.wpc.ncep.noaa.gov/Prob_Precip/hourly-data/latest/points_prob_sn_$accumPeriod[0]h0$fHour.geojson";
} else {
    $fHour = 19;
    $url = "https://www.wpc.ncep.noaa.gov/Prob_Precip/hourly-data/latest/points_prob_sn_24h0$fHour.geojson";
}

$json = json_decode(file_get_contents($url.'?'.time()));

if (str_contains($_REQUEST['id'], ',')) {
    $getID = explode(',', $_REQUEST['id']);
} else {
    $getID = $_REQUEST['id'];
}

for ($i = 0; $i < count($json->features); $i++) {
    if ((isset($_REQUEST['wfo']) && $_REQUEST['wfo'] == $json->features[$i]->properties->WFO) ||
        (isset($_REQUEST['state']) && $_REQUEST['state'] == $json->features[$i]->properties->state) ||
        (isset($_REQUEST['id']) && !str_contains($_REQUEST['id'], ',') && $getID == $json->features[$i]->properties->location_id) ||
        (isset($_REQUEST['id']) && str_contains($_REQUEST['id'], ',') && in_array($json->features[$i]->properties->location_id, $getID))) {

        $prop = $json->features[$i]->properties;
        $prob = ['p01' => $prop->ige0p10, 'p1' => $prop->ige1p00, 'p2' => $prop->ige2p00, 'p4' => $prop->ige4p00,
                'p6' => $prop->ige6p00, 'p8' => $prop->ige8p00, 'p12' => $prop->ige12p0, 'p18' => $prop->ige18p0];
        $accum = ['expected' => ($prop->expected_range ? $prop->expected_range : null), 'prob' => ['p10' => $prop->ip0p10, 'p25' => $prop->ip0p25, 'p75' => $prop->ip0p75, 'p90' => $prop->ip0p90]];
        $data = ['id' => $prop->location_id, 'wfo' => $prop->WFO, 'name' => $prop->name, 'state' => $prop->state,
                    'elevation' => ($prop->elev_in_ft ? $prop->elev_in_ft : null), 'prob' => $prob, 'accum' => $accum];

        if (isset($_REQUEST['geojson'])) {
            $points[] = ['type' => 'Feature', 'geometry' => $json->features[$i]->geometry, 'properties' => $data];
        } else {
            $points[] = $data;
        }
    }
}

usort($points, function ($a, $b) {
    $comp1 = strcmp($a['state'], $b['state']);
    if ($comp1 != 0) {
        return $comp1;
    }

    return strcmp($a['name'], $b['name']);
});


if (isset($_REQUEST['geojson'])) {
    print_r(['type' => 'FeatureCollection', 'features' => $points]);
} else {
    print_r($points);
}

#$json = json_decode(file_get_contents('https://gis.odot.state.or.us/arcgis1006/rest/services/transgis/catalog/MapServer/208/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=ODOT_REG%2CODOT_DIST%2CBLDG_NAME%2CDESC&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=6&outSR=4326&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=pjson'));

/*$string = '{"STATION":[{"ID":"1367","STID":"ANRO3","NAME":"ANEROID LAKE #2","ELEVATION":"7400.0","LATITUDE":"45.21328","LONGITUDE":"-117.19258","STATUS":"ACTIVE","MNET_ID":"25","STATE":"OR","TIMEZONE":"America\/Los_Angeles","ELEV_DEM":"7424.5","PERIOD_OF_RECORD":{"start":"2000-01-20T00:00:00Z","end":"2024-11-17T19:00:00Z"},"UNITS":{"position":"ft","elevation":"ft"},"SENSOR_VARIABLES":{"air_temp":{"air_temp_set_1":{}},"snow_depth":{"snow_depth_set_1":{}}},"OBSERVATIONS":{"date_time":["11\/14\/2024 14:00","11\/14\/2024 15:00","11\/14\/2024 16:00","11\/14\/2024 17:00","11\/14\/2024 18:00","11\/14\/2024 19:00","11\/14\/2024 20:00","11\/14\/2024 21:00","11\/14\/2024 22:00","11\/14\/2024 23:00","11\/15\/2024 00:00","11\/15\/2024 01:00","11\/15\/2024 02:00","11\/15\/2024 03:00","11\/15\/2024 04:00","11\/15\/2024 05:00","11\/15\/2024 06:00","11\/15\/2024 07:00","11\/15\/2024 08:00","11\/15\/2024 09:00","11\/15\/2024 10:00","11\/15\/2024 11:00","11\/15\/2024 12:00","11\/15\/2024 13:00","11\/15\/2024 14:00","11\/15\/2024 15:00","11\/15\/2024 16:00","11\/15\/2024 17:00","11\/15\/2024 18:00","11\/15\/2024 19:00","11\/15\/2024 20:00","11\/15\/2024 21:00","11\/15\/2024 22:00","11\/15\/2024 23:00","11\/16\/2024 00:00","11\/16\/2024 01:00","11\/16\/2024 02:00","11\/16\/2024 03:00","11\/16\/2024 04:00","11\/16\/2024 05:00","11\/16\/2024 06:00","11\/16\/2024 07:00","11\/16\/2024 08:00","11\/16\/2024 09:00","11\/16\/2024 10:00","11\/16\/2024 11:00","11\/16\/2024 12:00","11\/16\/2024 13:00","11\/16\/2024 14:00","11\/16\/2024 15:00","11\/16\/2024 16:00","11\/16\/2024 17:00","11\/16\/2024 18:00","11\/16\/2024 19:00","11\/16\/2024 20:00","11\/16\/2024 21:00","11\/16\/2024 22:00","11\/16\/2024 23:00","11\/17\/2024 00:00","11\/17\/2024 01:00","11\/17\/2024 02:00","11\/17\/2024 03:00","11\/17\/2024 04:00","11\/17\/2024 05:00","11\/17\/2024 06:00","11\/17\/2024 07:00","11\/17\/2024 08:00","11\/17\/2024 09:00","11\/17\/2024 10:00","11\/17\/2024 11:00","11\/17\/2024 12:00"],"air_temp_set_1":[25.2,24.3,23.5,23.4,23.4,19.8,18.3,16.2,15.1,17.8,19.6,17.4,14.9,14.7,14.9,17.1,18.7,20.1,21.9,23.2,23.4,23.2,22.8,22.6,22.3,22.3,21.9,21.2,20.8,20.5,20.5,20.3,19.8,19.6,18.7,17.8,17.6,17.1,16.9,16.3,11.8,8.4,8.1,10.0,15.3,19.6,21.2,21.7,21.9,21.6,19.4,17.1,17.6,21.4,22.3,25.0,27.9,27.9,28.8,30.0,29.8,30.0,29.7,29.5,29.1,30.0,30.2,30.7,30.0,29.8,28.0],"snow_depth_set_1":[13.0,13.0,13.0,13.0,13.0,14.0,14.0,14.0,13.0,13.0,13.0,13.0,13.0,13.0,12.0,10.0,157.0,12.0,157.0,157.0,10.0,157.0,14.0,13.0,12.0,157.0,157.0,157.0,12.0,157.0,157.0,157.0,13.0,157.0,157.0,157.0,9.0,157.0,157.0,157.0,157.0,157.0,157.0,157.0,157.0,9.0,10.0,13.0,13.0,13.0,13.0,14.0,14.0,13.0,13.0,14.0,13.0,14.0,156.0,156.0,156.0,12.0,156.0,14.0,156.0,156.0,156.0,156.0,156.0,156.0,156.0]},"QC_FLAGGED":false,"RESTRICTED":false}],"SUMMARY":{"NUMBER_OF_OBJECTS":1,"RESPONSE_CODE":1,"RESPONSE_MESSAGE":"OK","METADATA_PARSE_TIME":"0.1 ms","METADATA_DB_QUERY_TIME":"2.9 ms","DATA_QUERY_TIME":"5.4 ms","QC_QUERY_TIME":"7.8 ms","DATA_PARSING_TIME":"1.5 ms","TOTAL_DATA_TIME":"14.8 ms","VERSION":"v2.24.8"},"QC_SUMMARY":{"QC_CHECKS_APPLIED":["sl_range_check"],"TOTAL_OBSERVATIONS_FLAGGED":0,"PERCENT_OF_TOTAL_OBSERVATIONS_FLAGGED":0.0},"UNITS":{"position":"ft","elevation":"ft","air_temp":"Fahrenheit","snow_depth":"Inches"}}';

function remove_outliers($array) {
    // Calculate the mean and standard deviation
    $mean = array_sum($array) / count($array);
    $std_dev = sqrt(array_sum(array_map(function($x) use ($mean) { return pow($x - $mean, 2); }, $array)) / count($array));

    // Define a threshold (adjust as needed)
    $threshold = 1 * $std_dev;

    // Filter out outliers
    /*$filtered_array = array_filter($array, function($x) use ($mean, $threshold) {
        return abs($x - $mean) <= $threshold;
    });

    return $filtered_array;*//*

    foreach ($array as $index => $value) {
        if (abs($value - $mean) > $threshold) {
            $array[$index] = null;
        }
    }

    return $array;
}

$json = json_decode($string, true);
$dt = $json['STATION'][0]['OBSERVATIONS']['date_time'];
$snow = $json['STATION'][0]['OBSERVATIONS']['snow_depth_set_1'];

print_r(remove_outliers($snow));*/