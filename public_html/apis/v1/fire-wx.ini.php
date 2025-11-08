<?
date_default_timezone_set('UTC');

$lat = $_REQUEST['lat'];
$lon = $_REQUEST['lon'];

if ($lat && $lon) {
    $a = get_data('https://api.weather.gov/points/'.rtrim(round($_REQUEST['lat'], 4), '0').','.rtrim(round($_REQUEST['lon'], 4)), '0');
    $wfo = $a['properties']['gridId'];
    $fwz = explode('/', $a['properties']['fireWeatherZone'])[5];

    $b = get_data("https://api.weather.gov/products/types/FWF/locations/$wfo");
    $fcst = get_data('https://api.weather.gov/products/' . $b['@graph'][0]['id']);

    preg_match('/('.$fwz.'.*?)\$\$/s', $fcst['productText'], $match);
    $text = ltrim(rtrim($match[1]));

    echo $fcst['productText'];

    /*$returnJson = [
        'wfo' => $wfo,
        'zone' => $fwz,
        'issued' => strtotime($fcst['issuanceTime']),
        'text' => $fcst['productText']
    ];*/
} else {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'A latitude and longitude were not provided');
}