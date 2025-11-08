<?
ini_set('display_errors', 1);
include_once '../db.ini.php';

function getODOT($url) {

    $curl = curl_init($url);


    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Cache-Control: no-cache', 'Ocp-Apim-Subscription-Key: 3bd2f1c1c6bd40b5b9c00c44a6241209'));

    $resp = curl_exec($curl);
    curl_close($curl);

    return $resp;
}

function getRW() {
    return getODOT('https://api.odot.state.or.us/tripcheck/RW/Reports');
}

function format($s) {

    return str_replace(['Lk Of The Woods', ' Of ', ' The '], ['Lake of the Woods', ' of ', ' the '], preg_replace('/\s([N|S|W|E])b/', ' $1B', implode('/', array_map('ucwords',explode('/', implode('-', array_map('ucwords', explode('-', ucwords(strtolower($s))))))))));

}

function chainReq($n) {

    switch ($n) {

        case '0': $d = 'No restrictions'; break;
        case 'A': $d = 'Carry chains or traction tires'; break;
        case 'B': $d = 'Chains required on vehicles towing or over 10,000 GVW'; break;
        case 'B1': $d = 'Chains required on vehicles towing or single drive axle over 10,000 GVW'; break;
        case 'C': $d = 'CHAINS REQUIRED: Traction tires allowed in place of chains on vehicles under 10,000 GVW and not towing. Vehicles towing must use chains'; break;
        case 'D': $d = 'CHAINS REQUIRED: Traction tires alone are not sufficient'; break;
    }
    return $d;
}

function restrict($d, $c) {
    $desc = chainReq($c->{'restriction-id'});
    $cmv = ($d->{'restriction-id'} == 1 ? 'Visibility of less than 500 feet. Oversized loads drive by your permit.' : 'No restrictions');
    $o['chains'] = array('cond' => $c->{'restriction-id'}, 'desc' => $desc);
    $o['cmv'] = array('restrict' => $cmv);

    if ($c->{'restriction-start-milepost'} != 0 && $c->{'restriction-end-milepost'} != 0) {
        $o['chains']['mileposts'] = [$c->{'restriction-start-milepost'}, $c->{'restriction-end-milepost'}];
    }

    return $o;
}

function weather($n) {

    switch ($n) {

        case 0: return 'No Report';
        case 1: return 'Clear/No Precipitation';
        case 2: return 'Partly Cloudy';
        case 3: return 'Overcast';
        case 4: return 'Ground Fog';
        case 5: return 'Intermittent Showers';
        case 6: return 'Rain';
        case 7: return 'Snow Flurries';
        case 8: return 'Snowing Hard & Continuously';
        case 9: return 'Severe Weather Alert';
        case 91: return 'Severe Weather Alert - Freezing Rain';
        case 92: return 'Severe Weather Alert - High Winds';
        case 93: return 'Severe Weather Alert - Blizzard Conditions';
        case 94: return 'Severe Weather Alert - Dust Storm';
        case 95: return 'Severe Weather Alert - Falling Trees';
    }
}

function cond($n) { 
    switch ($n) {
        case 0: return 'No Report';
        case 1: return 'Bare Pavement';
        case 2: return 'Spots of Ice';
        case 3: return 'Black Ice';
        case 4: return 'Standing Water/Flooding';
        case 5: return 'Snow Pack (Breaking Up)';
        case 6: return 'Packed Snow';
    }
}

$hwys = ['US26', 'ORE6', 'I84', 'US97', 'I205', 'I5'];

$getrw = json_decode(getRW())->{'road-weather-reports'};

if (count($getrw) > 0) {
    /* get reprots*/
    foreach ($getrw as $road) {
        $hwy = $road->location->{'route-id'};
        $name = format($road->location->{'location-name'});
        $mps = [$road->location->{'start-location'}->{'start-milepost'}, $road->location->{'end-location'}->{'end-milepost'}];
        $temp = round(($road->{'air-temperature'} * (9 / 5)) + 32, 0);
        $wx = weather($road->{'weather-conditions'}->{'weather-id'});
        $cond = cond($road->{'road-conditions'}->{'road-cond-id'});
        $updated = strtotime($road->{'entry-time'});
        $chains = restrict($road->{'commercial-vehicle-restriction'}, $road->{'driving-restriction'});

        $data = serialize(array('weather' => $wx, 'road' => ['id' => $road->{'road-conditions'}->{'road-cond-id'}, 'condition' => $cond], 'restrict' => $chains));
        $mps = serialize($mps);
        $uqid = $road->{'station-id'}.'-'.$updated;

        if (in_array($hwy, $hwys)) {
            mysqli_query($con, "INSERT IGNORE INTO road_reports (uqid,hwy,name,mileposts,data,time) VALUES('$uqid','$hwy','$name','$mps','$data','$updated')");
        }
    }
}

mysqli_close($con);