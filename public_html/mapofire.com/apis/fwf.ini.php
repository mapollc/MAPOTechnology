<?
function format($t) {
    return rtrim(preg_replace('/\s{1,}/', ' ', preg_replace('/\n/', '', $t)));
}

function format2 ($t) {
    $search = ['Valleys/lwr slopes','Ridges/upr slopes','Sky/weather'];
    $replace = ['<i>Valleys/Lower Slopes</i>','<i>Ridges/Upper Slopes</i>','Sky/Weather'];
    for ($i = 0; $i < count($search); $i++) {
        $t = str_replace($search, $replace, $t);
    }

    return '<b>'.ltrim($t).':</b>';
}

if ($method == 'get') {
    $a = get_data('https://api.weather.gov/points/'.rtrim($_REQUEST['lat'], '0').','.rtrim($_REQUEST['lon'], '0'));
    $b = get_data('https://api.weather.gov/products/types/FWF/locations/'.$a['properties']['cwa']);
    $zone = explode('/', $a['properties']['fireWeatherZone'])[5];
    $prodID = $b['@graph'][0]['id'];
} else {
    $prodID = $method;
    $zone = substr($_REQUEST['zone'], 0, 2).'Z'.substr($_REQUEST['zone'], 2);
}

$json = get_data('https://api.weather.gov/products/'.$prodID);
$rawtext = $json['productText'];
preg_match('/National Weather Service ([\w]+),? ([\w]+)/', $rawtext, $wfo);
$updated = strtotime(substr($json['issuanceTime'], 0, -6).' GMT');

$rawtext = str_replace('***Winds are 20 foot 10 minute averages***', '', $rawtext);
$rawtext = str_replace('***CWR-chance of wetting rain 0.10 or greater***', '', $rawtext);
#$disc = rtrim(ltrim(preg_split('/\n..Z[0-9][0-9][0-9]-/', explode('FWFPDT', $rawtext)[1])[0]));
preg_match_all('/DISCUSSION\.\.\.([A-Za-z0-9\W]+)/', $rawtext, $out1);
$disc = rtrim(ltrim(preg_split('/\n[A-Z][A-Z]Z[0-9][0-9][0-9]/', $out1[1][0])[0], '
'), '
');
$disc = preg_replace('/\s{2,}/', ' ', preg_replace('/\n/', ' ', preg_replace('/(\n{2,})/', '<br><br>', $disc)));

preg_match_all('/'.$zone.'\-[0-9]{1,}-\n((\n|.)*?)\$\$/', $rawtext, $out2);
$fwf = rtrim($out2[1][0]);
$parts = preg_split('/\n/', $fwf);
preg_match_all('/(.*)\n/', $fwf, $out3);

$zoneName = str_replace('-', '', $parts[0]);

for ($i = 3; $i < count($out3[0]); $i++) {
    $text .= $out3[0][$i];
}
$fwf = preg_replace_callback('/\.([A-Za-z]+)\.\.\./', function ($m) {
    return strtoupper($m[1]).'...';
}, $text);
preg_match_all('/([A-Z]+\.\.\.)\n/m', $fwf, $out4);
#preg_match_all('/\*\s([A-Za-z\s\/]+)\.{1,}([A-Za-z0-9\s\n\.\/]+)/', $fwf, $out4);

for ($i = 0; $i < 3; $i++) {
    $end = ($i == 2 ? '.Forecast days 3 through 7......' : $out4[0][$i + 1]);
    $string = preg_match_all('/\*\s([A-Za-z0-9\-\s\/]+)\.{1,}([A-Za-z0-9\-\s\n\.\/]+)/', explode($end, explode($out4[0][$i], $fwf)[1])[0], $out5);
    $day = str_replace('.', '', ucwords(strtolower(rtrim($out4[0][$i]))));
    $text = '';

    for ($x = 0; $x < count($out5[1]); $x++) {
        $text .= format2($out5[1][$x]).' '.format($out5[2][$x]).'<br>';
    }

    $fcst[] = array('day' => $day, 'fcst' => rtrim($text, ' <br>'));
}

$returnJson = array('fwf' => array('wfo' => $wfo[1].', '.$wfo[2], 'name' => $zoneName, 'updated' => $updated));

if ($method == 'get') {
    $returnJson['fwf']['zone'] = $zone;
}

$returnJson['fwf']['forecast'] = $fcst;





/*$text = explode($out4[0][1], explode($out4[0][0], $fwf)[1])[0];
$text .= explode($out4[0][2], explode($out4[0][1], $fwf)[1])[0];
$text .= explode('.Forecast days 3 through 7......', explode($out4[0][2], $fwf)[1])[0];

echo $fwf;*/

/*if ($method == 'get') {
    $a = get_data('https://api.weather.gov/points/'.$_REQUEST['lat'].','.$_REQUEST['lon']);
    $b = get_data('https://api.weather.gov/products/types/FWF/locations/'.$a['properties']['cwa']);
    $zone = explode('/', $a['properties']['fireWeatherZone'])[5];
    $prodID = $b['@graph'][0]['id'];
} else {
    $prodID = $method;
    $zone = substr($_REQUEST['zone'], 0, 2).'Z'.substr($_REQUEST['zone'], 2);
}

$json = get_data('https://api.weather.gov/products/'.$prodID);
$updated = strtotime(substr($json['issuanceTime'], 0, -6).' GMT');
$text = $json['productText'];

preg_match_all('/([A-Z0-9\-]+)-([0-9]+)-/', $text, $zones);
//$occ = array_search($zone, $zones[1], false) + 1;

foreach($zones[1] as $k => $z) {
    if (strpos($z, $zone)!==false) {
        $occ = $k + 1;
        break;
    }
}

$a = preg_split('/([A-Z0-9\-]+)-([0-9]+)-/', $text);
$text = preg_replace('/(\.{1})([A-Za-z\s]+)(\.{3})(\w+)/', '$2: $4', trim($a[$occ]));
$text = str_replace('.Forecast days 3 through 7......', '<h3>FORECAST DAYS 3 THROUGH 7</h3>', preg_replace('/(\.{1})([A-Za-z\s]+)(\.{3})/', '<h3>$2</h3>', $text));
$text = str_replace('* CWR (> 0.10 Inch)...', '{CWR}:', str_replace('* CWR (>0.25)...', '{CWR2}:', $text));

preg_match_all('/\*\s([A-Za-z0-9\-\s\/\(\)]+)(\.+)/', $text, $out);
preg_match_all('/([A-Za-z0-9\s\-\/]+)([0-9]{3,})/', trim($a[$occ]), $head);

$name = explode('-', $head[1][0])[0];

for ($i = 0; $i < count($out[0]); $i++) {
    $text = str_replace($out[0][$i], '<b>'.$out[1][$i].':</b> ', $text);
}

$text = str_replace('{CWR}:', '<b>CWR (> 0.10 Inch):</b> ', $text);
$text = str_replace('{CWR2}:', '<b>CWR (> 0.25 Inch):</b> ', $text);
$text = '<h3>'.explode('<h3>', $text, 2)[1];
$text = trim(rtrim(substr(preg_replace('/\n/', '<br>', $text), 0, -2), '<br>'));
$text = str_replace(':</i>:', ':</i>', $text);

$disc = trim(explode('.DISCUSSION...', $a[0])[1]);
$disc = str_replace('<br><br><br><br>', '<br><br>', preg_replace('/(\s{2,})/', ' ', preg_replace('/\n/', ' ', preg_replace('/\n\n/', '<br><br>', $disc))));

preg_match_all('/([A-Za-z0-9]+)\s*<br>/', $text, $c);
for ($i = 0; $i < count($c[0]); $i++) {
    $text = str_replace($c[0][$i], $c[1][$i].' ', $text);
}
//preg_replace('/([A-Z]+)DAY/', '<b>$0</b>', 
$text = preg_replace('/\.\<br\>([A-Za-z0-9]+)/', '. $1', preg_replace('/<\/h3><br>/', '</h3> ', preg_replace('/(\s){2,}/', ' ', preg_replace('/(<br>){1,}<h3>/', ' <h3>', $text))));
$text = preg_replace('/\<b\> (Valleys\/lwr slopes)|(Lower Elevation):\<\/b\>/', '<i>Valleys/Lower Slopes:</i>', $text);
$text = str_replace('Sky/weather', 'Sky/Weather', $text);
$last = preg_replace('/\<b\> (Ridges\/upr slopes)|(Ridge Top):\<\/b\>/', '<i>Ridges/Upper Slopes:</i>', $text);

$text = '<h2 class="fwf">Discussion</h2><div class="sameasp">'.$disc.'</div><h2 class="fwf">Forecast</h2><div class="sameasp">'.str_replace('<br><br><br><h3>', '<h3>', $last).'</div>';
preg_match('/National Weather Service ([\w]+),? ([\w]+)/', $json['productText'], $wfo);

$returnJson = array('fwf' => array('wfo' => $wfo[1].', '.$wfo[2], 'name' => $name, 'updated' => $updated));

if ($method == 'get') {
    $returnJson['fwf']['zone'] = $zone;
    $returnJson['fwf']['discussion'] = $disc;
    $returnJson['fwf']['text'] = str_replace('<h3', '<h3 style="font-size:16px;padding-bottom:0;margin-bottom:0"', $last);
} else {
    $returnJson['fwf']['text'] = $text;
}*/
?>