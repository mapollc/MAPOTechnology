<?
function priority ($e) {
    switch ($e) {
        case 'Tsunami Warning': $pri = 1; break;
        case 'Tornado Warning': $pri = 2; break;
        case 'Extreme Wind Warning': $pri = 3; break;
        case 'Severe Thunderstorm Warning': $pri = 4; break;
        case 'Flash Flood Warning': $pri = 5; break;
        case 'Flash Flood Statement': $pri = 6; break;
        case 'Severe Weather Statement': $pri = 7; break;
        case 'Shelter In Place Warning': $pri = 8; break;
        case 'Evacuation Immediate': $pri = 9; break;
        case 'Civil Danger Warning': $pri = 10; break;
        case 'Nuclear Power Plant Warning': $pri = 11; break;
        case 'Radiological Hazard Warning': $pri = 12; break;
        case 'Hazardous Materials Warning': $pri = 13; break;
        case 'Fire Warning': $pri = 14; break;
        case 'Civil Emergency Message': $pri = 15; break;
        case 'Law Enforcement Warning': $pri = 16; break;
        case 'Storm Surge Warning': $pri = 17; break;
        case 'Hurricane Force Wind Warning': $pri = 18; break;
        case 'Hurricane Warning': $pri = 19; break;
        case 'Typhoon Warning': $pri = 20; break;
        case 'Special Marine Warning': $pri = 21; break;
        case 'Blizzard Warning': $pri = 22; break;
        case 'Snow Squall Warning': $pri = 23; break;
        case 'Ice Storm Warning': $pri = 24; break;
        case 'Winter Storm Warning': $pri = 25; break;
        case 'High Wind Warning': $pri = 26; break;
        case 'Tropical Storm Warning': $pri = 27; break;
        case 'Storm Warning': $pri = 28; break;
        case 'Tsunami Advisory': $pri = 29; break;
        case 'Tsunami Watch': $pri = 30; break;
        case 'Avalanche Warning': $pri = 31; break;
        case 'Earthquake Warning': $pri = 32; break;
        case 'Volcano Warning': $pri = 33; break;
        case 'Ashfall Warning': $pri = 34; break;
        case 'Coastal Flood Warning': $pri = 35; break;
        case 'Lakeshore Flood Warning': $pri = 36; break;
        case 'Flood Warning': $pri = 37; break;
        case 'High Surf Warning': $pri = 38; break;
        case 'Dust Storm Warning': $pri = 39; break;
        case 'Blowing Dust Warning': $pri = 40; break;
        case 'Lake Effect Snow Warning': $pri = 41; break;
        case 'Excessive Heat Warning': $pri = 42; break;
        case 'Tornado Watch': $pri = 43; break;
        case 'Severe Thunderstorm Watch': $pri = 44; break;
        case 'Flash Flood Watch': $pri = 45; break;
        case 'Gale Warning': $pri = 46; break;
        case 'Flood Statement': $pri = 47; break;
        case 'Wind Chill Warning': $pri = 48; break;
        case 'Extreme Cold Warning': $pri = 49; break;
        case 'Hard Freeze Warning': $pri = 50; break;
        case 'Freeze Warning': $pri = 51; break;
        case 'Red Flag Warning': $pri = 52; break;
        case 'Storm Surge Watch': $pri = 53; break;
        case 'Hurricane Watch': $pri = 54; break;
        case 'Hurricane Force Wind Watch': $pri = 55; break;
        case 'Typhoon Watch': $pri = 56; break;
        case 'Tropical Storm Watch': $pri = 57; break;
        case 'Storm Watch': $pri = 58; break;
        case 'Hurricane Local Statement': $pri = 59; break;
        case 'Typhoon Local Statement': $pri = 60; break;
        case 'Tropical Storm Local Statement': $pri = 61; break;
        case 'Tropical Depression Local Statement': $pri = 62; break;
        case 'Avalanche Advisory': $pri = 63; break;
        case 'Winter Weather Advisory': $pri = 64; break;
        case 'Wind Chill Advisory': $pri = 65; break;
        case 'Heat Advisory': $pri = 66; break;
        case 'Urban and Small Stream Flood Advisory': $pri = 67; break;
        case 'Small Stream Flood Advisory': $pri = 68; break;
        case 'Arroyo and Small Stream Flood Advisory': $pri = 69; break;
        case 'Flood Advisory': $pri = 70; break;
        case 'Hydrologic Advisory': $pri = 71; break;
        case 'Lakeshore Flood Advisory': $pri = 72; break;
        case 'Coastal Flood Advisory': $pri = 73; break;
        case 'High Surf Advisory': $pri = 74; break;
        case 'Heavy Freezing Spray Warning': $pri = 75; break;
        case 'Dense Fog Advisory': $pri = 76; break;
        case 'Dense Smoke Advisory': $pri = 77; break;
        case 'Small Craft Advisory': $pri = 78; break;
        case 'Brisk Wind Advisory': $pri = 79; break;
        case 'Hazardous Seas Warning': $pri = 80; break;
        case 'Dust Advisory': $pri = 81; break;
        case 'Blowing Dust Advisory': $pri = 82; break;
        case 'Lake Wind Advisory': $pri = 83; break;
        case 'Wind Advisory': $pri = 84; break;
        case 'Frost Advisory': $pri = 85; break;
        case 'Ashfall Advisory': $pri = 86; break;
        case 'Freezing Fog Advisory': $pri = 87; break;
        case 'Freezing Spray Advisory': $pri = 88; break;
        case 'Low Water Advisory': $pri = 89; break;
        case 'Local Area Emergency': $pri = 90; break;
        case 'Avalanche Watch': $pri = 91; break;
        case 'Blizzard Watch': $pri = 92; break;
        case 'Rip Current Statement': $pri = 93; break;
        case 'Beach Hazards Statement': $pri = 94; break;
        case 'Gale Watch': $pri = 95; break;
        case 'Winter Storm Watch': $pri = 96; break;
        case 'Hazardous Seas Watch': $pri = 97; break;
        case 'Heavy Freezing Spray Watch': $pri = 98; break;
        case 'Coastal Flood Watch': $pri = 99; break;
        case 'Lakeshore Flood Watch': $pri = 100; break;
        case 'Flood Watch': $pri = 101; break;
        case 'High Wind Watch': $pri = 102; break;
        case 'Excessive Heat Watch': $pri = 103; break;
        case 'Extreme Cold Watch': $pri = 104; break;
        case 'Wind Chill Watch': $pri = 105; break;
        case 'Lake Effect Snow Watch': $pri = 106; break;
        case 'Hard Freeze Watch': $pri = 107; break;
        case 'Freeze Watch': $pri = 108; break;
        case 'Fire Weather Watch': $pri = 109; break;
        case 'Extreme Fire Danger': $pri = 110; break;
        case '911 Telephone Outage': $pri = 111; break;
        case 'Coastal Flood Statement': $pri = 112; break;
        case 'Lakeshore Flood Statement': $pri = 113; break;
        case 'Special Weather Statement': $pri = 114; break;
        case 'Marine Weather Statement': $pri = 115; break;
        case 'Air Quality Alert': $pri = 116; break;
        case 'Air Stagnation Advisory': $pri = 117; break;
        case 'Hazardous Weather Outlook': $pri = 118; break;
        case 'Hydrologic Outlook': $pri = 119; break;
        case 'Short Term Forecast': $pri = 120; break;
        case 'Administrative Message': $pri = 121; break;
        case 'Test': $pri = 122; break;
        case 'Child Abduction Emergency': $pri = 123; break;
        case 'Blue Alert': $pri = 124; break;
    }
    return $pri;
}

if ($method == 'oreroads') {
    if (isset($_REQUEST['lat']) && isset($_REQUEST['lon'])) {
        $a = get_data('https://api.weather.gov/points/'.round($_REQUEST['lat'], 4).','.round($_REQUEST['lon'], 4));
        preg_match('/(OR[A-Z][0-9]{3})/', $a['properties']['forecastZone'], $z1);
        preg_match('/(OR[A-Z][0-9]{3})/', $a['properties']['county'], $z2);
        preg_match('/(OR[A-Z][0-9]{3})/', $a['properties']['fireWeatherZone'], $z3);

        $uzones = array($z1[1], $z2[1], $z3[1]);
    }

    if ($function == 'zone') {
        $returnJson = array('zone' => $z1[1]);
    } else {
        $ignore = array('Beach Hazards Statement','High Surf Advisory','High Surf Warning');
        $zones = array('ORZ001','ORZ002','ORZ003','ORZ004','ORZ005','ORZ006','ORZ007','ORZ008','ORZ010','ORZ011','ORZ012','ORZ013','ORZ014','ORZ015','ORZ016','ORZ021','ORZ022','ORZ023','ORZ024','ORZ025','ORZ026','ORZ027','ORZ028','ORZ029','ORZ030','ORZ031','ORZ041','ORZ044','ORZ049','ORZ050','ORZ061','ORZ062','ORZ063','ORZ064','ORZ502','ORZ503','ORZ505','ORZ506','ORZ507','ORZ508','ORZ509','ORZ510','ORZ511');
        //$zones = ['WYZ012'];
        $json = get_data('https://api.weather.gov/alerts/active/area/OR')['features'];
        //$json = get_data('https://api.weather.gov/alerts/active/area/WY')['features'];

        foreach ($json as $wwa) {
            $usersArea = [];
            $p = $wwa['properties'];
            $pri = priority($p['event']);
            $eff = strtotime($p['effective']);
            $exp = $p['ends'] == null ? strtotime($p['expires']) : strtotime($p['ends']);

            if ($uzones) {
                foreach ($wwa['properties']['geocode']['UGC'] as $iz) {
                    $usersArea[] = (in_array($iz, $uzones) ? true : false);
                }
            }

            if (!in_array($p['event'], $ignore)) {
                $wwas[] = array('id' => $p['id'], 'event' => $p['event'], 'priority' => $pri, 'zone' => str_replace('  ', ' ', $p['areaDesc']), 'zoneid' => $wwa['properties']['geocode']['UGC'], 'effective' => $eff, 'expires' => $exp, 'headline' => preg_replace('/([0-9]+:[0-9]+)([A-Z]{2})/', '$1 $2', $p['headline']), 'userArea' => (in_array(true, $usersArea) ? true : false), 'wfo' => $p['senderName']);
            }
        }

        if ($wwas) {
            usort($wwas, function($a, $b) {
                if ($a['priority'] == $b['priority']) {
                    return $a['expires'] <=> $b['expires'];
                } else {
                    return $a['priority'] <=> $b['priority'];
                }
            });
        }

        $returnJson = array('wwas' => $wwas);
    }
} else if ($method == 'severe') {
    $json = get_data('https://api.weather.gov/alerts?active=true&severity=Extreme');

    for ($i = 0; $i < count($json['features']); $i++) {
        $event = $json['features'][$i]['properties']['event'];

        if ($event == 'Severe Thunderstorm Watch' || $event == 'Tornado Watch') {
            $alerts[] = $json['features'][$i];
        }
    }

    $returnJson = ['severe' => $alerts];

} else {
    date_default_timezone_set('UTC');

    $features = get_data('https://www.weather.gov/source/crh/allhazard.geojson');

    if (isset($_GET['filter'])) {
        foreach ($features['features'] as $item) {
            if (substr($item['properties']['ugc'][0], 0, 2) == $_GET['filter']) {
                $feat[] = $item;
            }
        }

        $returnJson = array('type' => 'FeatureCollection', 'features' => $feat);
    } else {
        $returnJson = $features;
    }
}