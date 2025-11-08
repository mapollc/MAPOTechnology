<?
function color($a)
{
    switch ($a) {
        case 'Tsunami Warning':
            $color = 'fd6347';
            break;
        case 'Tornado Warning':
            $color = 'ff0000';
            break;
        case 'Extreme Wind Warning':
            $color = 'ff8c00';
            break;
        case 'Severe Thunderstorm Warning':
            $color = 'ffa500';
            break;
        case 'Flash Flood Warning':
            $color = '8b0000';
            break;
        case 'Flash Flood Statement':
            $color = '8b0000';
            break;
        case 'Severe Weather Statement':
            $color = '00ffff';
            break;
        case 'Shelter In Place Warning':
            $color = 'fa8072';
            break;
        case 'Evacuation Immediate':
            $color = '7fff00';
            break;
        case 'Civil Danger Warning':
            $color = 'ffb6c1';
            break;
        case 'Nuclear Power Plant Warning':
            $color = '4b0082';
            break;
        case 'Radiological Hazard Warning':
            $color = '4b0082';
            break;
        case 'Hazardous Materials Warning':
            $color = '4b0082';
            break;
        case 'Fire Warning':
            $color = 'a0522d';
            break;
        case 'Civil Emergency Message':
            $color = 'ffb6c1';
            break;
        case 'Law Enforcement Warning':
            $color = 'c0c0c0';
            break;
        case 'Storm Surge Warning':
            $color = 'b524f7';
            break;
        case 'Hurricane Force Wind Warning':
            $color = 'cd5c5c';
            break;
        case 'Hurricane Warning':
            $color = 'dc143c';
            break;
        case 'Typhoon Warning':
            $color = 'dc143c';
            break;
        case 'Special Marine Warning':
            $color = 'ffa500';
            break;
        case 'Blizzard Warning':
            $color = 'ff4500';
            break;
        case 'Snow Squall Warning':
            $color = 'c71585';
            break;
        case 'Ice Storm Warning':
            $color = '8b008b';
            break;
        case 'Winter Storm Warning':
            $color = 'ff69b4';
            break;
        case 'High Wind Warning':
            $color = 'daa520';
            break;
        case 'Tropical Storm Warning':
            $color = 'b22222';
            break;
        case 'Storm Warning':
            $color = '9400d3';
            break;
        case 'Tsunami Advisory':
            $color = 'd2691e';
            break;
        case 'Tsunami Watch':
            $color = 'ff00ff';
            break;
        case 'Avalanche Warning':
            $color = '1e90ff';
            break;
        case 'Earthquake Warning':
            $color = '8b4513';
            break;
        case 'Volcano Warning':
            $color = '2f4f4f';
            break;
        case 'Ashfall Warning':
            $color = 'a9a9a9';
            break;
        case 'Coastal Flood Warning':
            $color = '228b22';
            break;
        case 'Lakeshore Flood Warning':
            $color = '228b22';
            break;
        case 'Flood Warning':
            $color = '00ff00';
            break;
        case 'High Surf Warning':
            $color = '228b22';
            break;
        case 'Dust Storm Warning':
            $color = 'ffe4c4';
            break;
        case 'Blowing Dust Warning':
            $color = 'ffe4c4';
            break;
        case 'Lake Effect Snow Warning':
            $color = '008b8b';
            break;
        case 'Excessive Heat Warning':
            $color = 'c71585';
            break;
        case 'Tornado Watch':
            $color = 'ffff00';
            break;
        case 'Severe Thunderstorm Watch':
            $color = 'db7093';
            break;
        case 'Flash Flood Watch':
            $color = '2e8b57';
            break;
        case 'Gale Warning':
            $color = 'dda0dd';
            break;
        case 'Flood Statement':
            $color = '00ff00';
            break;
        case 'Wind Chill Warning':
            $color = 'b0c4de';
            break;
        case 'Extreme Cold Warning':
            $color = '0000ff';
            break;
        case 'Hard Freeze Warning':
            $color = '9400d3';
            break;
        case 'Freeze Warning':
            $color = '483d8b';
            break;
        case 'Red Flag Warning':
            $color = 'ff1493';
            break;
        case 'Storm Surge Watch':
            $color = 'db7ff7';
            break;
        case 'Hurricane Watch':
            $color = 'ff00ff';
            break;
        case 'Hurricane Force Wind Watch':
            $color = '9932cc';
            break;
        case 'Typhoon Watch':
            $color = 'ff00ff';
            break;
        case 'Tropical Storm Watch':
            $color = 'f08080';
            break;
        case 'Storm Watch':
            $color = 'ffe4b5';
            break;
        case 'Hurricane Local Statement':
            $color = 'ffe4b5';
            break;
        case 'Typhoon Local Statement':
            $color = 'ffe4b5';
            break;
        case 'Tropical Storm Local Statement':
            $color = 'ffe4b5';
            break;
        case 'Tropical Depression Local Statement':
            $color = 'ffe4b5';
            break;
        case 'Avalanche Advisory':
            $color = 'cd853f';
            break;
        case 'Winter Weather Advisory':
            $color = '7b68ee';
            break;
        case 'Wind Chill Advisory':
            $color = 'afeeee';
            break;
        case 'Heat Advisory':
            $color = 'ff7f50';
            break;
        case 'Urban and Small Stream Flood Advisory':
            $color = '00ff7f';
            break;
        case 'Small Stream Flood Advisory':
            $color = '00ff7f';
            break;
        case 'Arroyo and Small Stream Flood Advisory':
            $color = '00ff7f';
            break;
        case 'Flood Advisory':
            $color = '00ff7f';
            break;
        case 'Hydrologic Advisory':
            $color = '00ff7f';
            break;
        case 'Lakeshore Flood Advisory':
            $color = '7cfc00';
            break;
        case 'Coastal Flood Advisory':
            $color = '7cfc00';
            break;
        case 'High Surf Advisory':
            $color = 'ba55d3';
            break;
        case 'Heavy Freezing Spray Warning':
            $color = '00bfff';
            break;
        case 'Dense Fog Advisory':
            $color = '708090';
            break;
        case 'Dense Smoke Advisory':
            $color = 'f0e68c';
            break;
        case 'Small Craft Advisory For Hazardous Seas':
            $color = 'd8bfd8';
            break;
        case 'Small Craft Advisory for Rough Bar':
            $color = 'd8bfd8';
            break;
        case 'Small Craft Advisory for Winds':
            $color = 'd8bfd8';
            break;
        case 'Small Craft Advisory':
            $color = 'd8bfd8';
            break;
        case 'Brisk Wind Advisory':
            $color = 'd8bfd8';
            break;
        case 'Hazardous Seas Warning':
            $color = 'd8bfd8';
            break;
        case 'Dust Advisory':
            $color = 'bdb76b';
            break;
        case 'Blowing Dust Advisory':
            $color = 'bdb76b';
            break;
        case 'Lake Wind Advisory':
            $color = 'd2b48c';
            break;
        case 'Wind Advisory':
            $color = 'd2b48c';
            break;
        case 'Frost Advisory':
            $color = '6495ed';
            break;
        case 'Ashfall Advisory':
            $color = '696969';
            break;
        case 'Freezing Fog Advisory':
            $color = '008080';
            break;
        case 'Freezing Spray Advisory':
            $color = '00bfff';
            break;
        case 'Low Water Advisory':
            $color = 'a52a2a';
            break;
        case 'Local Area Emergency':
            $color = 'c0c0c0';
            break;
        case 'Avalanche Watch':
            $color = 'f4a460';
            break;
        case 'Blizzard Watch':
            $color = 'adff2f';
            break;
        case 'Rip Current Statement':
            $color = '40e0d0';
            break;
        case 'Beach Hazards Statement':
            $color = '40e0d0';
            break;
        case 'Gale Watch':
            $color = 'ffc0cb';
            break;
        case 'Winter Storm Watch':
            $color = '4682b4';
            break;
        case 'Hazardous Seas Watch':
            $color = '483d8b';
            break;
        case 'Heavy Freezing Spray Watch':
            $color = 'bc8f8f';
            break;
        case 'Coastal Flood Watch':
            $color = '66cdaa';
            break;
        case 'Lakeshore Flood Watch':
            $color = '66cdaa';
            break;
        case 'Flood Watch':
            $color = '2e8b57';
            break;
        case 'High Wind Watch':
            $color = 'b8860b';
            break;
        case 'Excessive Heat Watch':
            $color = '800000';
            break;
        case 'Extreme Cold Watch':
            $color = '0000ff';
            break;
        case 'Wind Chill Watch':
            $color = '5f9ea0';
            break;
        case 'Lake Effect Snow Watch':
            $color = '87cefa';
            break;
        case 'Hard Freeze Watch':
            $color = '4169e1';
            break;
        case 'Freeze Watch':
            $color = '00ffff';
            break;
        case 'Fire Weather Watch':
            $color = 'ffdead';
            break;
        case 'Extreme Fire Danger':
            $color = 'e9967a';
            break;
        case '911 Telephone Outage':
            $color = 'c0c0c0';
            break;
        case 'Coastal Flood Statement':
            $color = '6b8e23';
            break;
        case 'Lakeshore Flood Statement':
            $color = '6b8e23';
            break;
        case 'Special Weather Statement':
            $color = 'ffe4b5';
            break;
        case 'Marine Weather Statement':
            $color = 'ffdab9';
            break;
        case 'Air Quality Alert':
            $color = '808080';
            break;
        case 'Air Stagnation Advisory':
            $color = '808080';
            break;
        case 'Hazardous Weather Outlook':
            $color = 'eee8aa';
            break;
        case 'Hydrologic Outlook':
            $color = '90ee90';
            break;
        case 'Short Term Forecast':
            $color = '98fb98';
            break;
        case 'Administrative Message':
            $color = 'c0c0c0';
            break;
        case 'Test':
            $color = 'f0ffff';
            break;
        case 'Child Abduction Emergency':
            $color = 'ffffff';
            break;
        case 'Blue Alert':
            $color = 'ffffff';
            break;
    }
    return $color;
}

function text($t)
{
    return preg_replace('/\n/', ' ', preg_replace('/\n\n/', '</p>', preg_replace('/\*\s([A-Z\s]+).../', '<p><b>$1</b><br>', $t))) . '</p>';
}

function text2($t)
{
    return '<p>' . preg_replace('/\n/', ' ', preg_replace('/\n\n/', '<br><br>', preg_replace('/([A-Z]+)\.\.\./', '<b>$1</b><br>', $t))) . '</p>';
}

function text3($t)
{
    $o = '';
    $a = preg_split('/\n\n/', $t);

    foreach ($a as $b) {
        $o .= preg_replace('/\*\s([A-Z\s]+)\.\.\.\s?/', '<b>$1</b><br>', preg_replace('/\n/', ' ', $b)) . '<br><br>';
    }

    if (substr($o, -8) == '<br><br>') {
        $o = substr($o, 0, -8);
    }

    return $o;
}

function text4($t)
{
    $o = '';
    $a = explode('{br}', preg_replace('/\n/', ' ', preg_replace('/\n\n/', '{br}', $t)));

    foreach ($a as $b) {
        preg_match('/\*\s?([A-Za-z\s]+)...(.*)/', $b, $m);
        if ($m[1]) {
            $o .= '<p><b>' . strtoupper($m[1]) . '</b><br>' . $m[2] . '</p>';
        } else {
            preg_match('/\.\.\.(.*)\.\.\./', $b, $m);
            if ($m[1]) {
                $o .= '<p>' . $m[1] . '</p><br>';
            }
        }
    }
    return $o;
}

$cachefilename = isset($_REQUEST['point']) ? $_REQUEST['point'] : $_REQUEST['id'];
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211);
#$cache = $memcache->get($cachefilename);

if (!$cache || filemtime(root() . 'getWWA.ini.php') > $memcache->get($cachefilename . '-time')) {
    if (isset($_REQUEST['point'])) {
        $p = get_data('https://api.weather.gov/alerts/active?point=' . $_REQUEST['point'])['features'][0]['properties'];
    } else {
        $p = get_data('https://api.weather.gov/alerts/' . $_REQUEST['id'])['properties'];
    }

    preg_match('/-([0-9]+):/', $p['sent'], $match);

    if ($match[1] == '08' && date('I') == 0 || $match[1] == '07' && date('I') == 1) {
        $tz = 'Los_Angeles';
    } else if ($match[1] == '07' && date('I') == 0 || $match[1] == '06' && date('I') == 1) {
        $tz = 'Denver';
    } else if ($match[1] == '06' && date('I') == 0 || $match[1] == '05' && date('I') == 1) {
        $tz = 'Chicago';
    } else if ($match[1] == '05' && date('I') == 0 || $match[1] == '04' && date('I') == 1) {
        $tz = 'New_York';
    }

    date_default_timezone_set('America/' . $tz);

    $title = $p['event'];
    $headline = str_replace('... ...', '...', ($p['parameters']['NWSheadline'][0] ? $p['parameters']['NWSheadline'][0] : $p['headline']));
    $area = $p['areaDesc'];
    $wfo = substr($p['parameters']['AWIPSidentifier'][0], -3);
    $office = substr(str_replace('NWS ', '', $p['senderName']), 0, -3) . ', ' . substr(str_replace('NWS ', '', $p['senderName']), -2);
    $issued = strtotime($p['sent']);
    $exp = strtotime($p['ends']);
    $onset = strtotime($p['onset']);
    $expires = date('g:i A T', $exp) . ' ';
    $help = '<p>' . preg_replace('/\n/', ' ', preg_replace('/\n\n/', ' ', $p['instruction'])) . '</p>';
    $parameters = [];

    if ($_REQUEST['app'] == 1) {
        $help = preg_replace('/<p>(.*?)<\/p>/', '$1', $help);
    }

    if ($title == 'Tornado Warning' || $title == 'Severe Thunderstorm Warning') {
        $desc = text2($p['description']);

        if ($_REQUEST['app'] == 1) {
            $desc = preg_replace('/<p>(.*?)<\/p>/', '$1', $desc);
        }

        $params = $p['parameters'];

        if ($params['windThreat']) {
            $parameters['windThreat'] = $params['windThreat'][0];
        }

        if ($params['maxWindGust']) {
            $parameters['maxWindGust'] = $params['maxWindGust'][0];
        }

        if ($params['hailThreat']) {
            $parameters['hailThreat'] = $params['hailThreat'][0];
        }

        if ($params['maxHailSize']) {
            $parameters['maxHailSize'] = $params['maxHailSize'][0];
        }

        if ($params['thunderstormDamageThreat']) {
            $parameters['thunderstormDamageThreat'] = $params['thunderstormDamageThreat'][0];
        }
    } else if ($title == 'Red Flag Warning' || $title == 'Fire Weather Watch') {
        $desc = text4($p['description']);
    } else {
        $desc = $_REQUEST['app'] == 1 ? text3($p['description']) :  text($p['description']);
    }

    if (date('njY') == date('njY', $exp)) {
        $expires .= 'Today';
    } else if (date('njY', strtotime('+1 day')) == date('njY', $exp)) {
        $expires .= 'Tomorrow';
    } else {
        $expires .= date('l', $exp);
    }

    $wwa = array('title' => $title, 'headline' => $headline, 'area' => $area, 'issued' => ago($issued), 'expires' => $expires, 'wfo' => $wfo, 'office' => $office, 'text' => $desc, 'help' => $help, 'color' => '#' . color($title));

    if (!empty($parameters)) {
        $wwa['parameters'] = $parameters;
    }

    if ($onset > time()) {
        $wwa['onset'] = date('g:i A T', $onset) . ' ';
        if (date('njY') == date('njY', $onset)) {
            $wwa['onset'] .= 'Today';
        } else if (date('njY', strtotime('+1 day')) == date('njY', $onset)) {
            $wwa['onset'] .= 'Tomorrow';
        } else {
            $wwa['onset'] .= date('l', $onset);
        }
    }

    $returnJson = array('wwa' => $wwa);
    $memcache->set($cachefilename, json_encode($returnJson), 900);
    $memcache->set($cachefilename . '-time', time(), 900);
} else {
    $isCached = true;
    $cache = json_decode($cache);
    $returnJson = $cache;
}
