<?
function priority($e)
{
    return match ($e) {
        "Tsunami Warning" => 1,
        "Tornado Warning" => 2,
        "Extreme Wind Warning" => 3,
        "Severe Thunderstorm Warning" => 4,
        "Flash Flood Warning" => 5,
        "Flash Flood Statement" => 6,
        "Severe Weather Statement" => 7,
        "Shelter In Place Warning" => 8,
        "Evacuation Immediate" => 9,
        "Civil Danger Warning" => 10,
        "Nuclear Power Plant Warning" => 11,
        "Radiological Hazard Warning" => 12,
        "Hazardous Materials Warning" => 13,
        "Fire Warning" => 14,
        "Civil Emergency Message" => 15,
        "Law Enforcement Warning" => 16,
        "Storm Surge Warning" => 17,
        "Hurricane Force Wind Warning" => 18,
        "Hurricane Warning" => 19,
        "Typhoon Warning" => 20,
        "Special Marine Warning" => 21,
        "Blizzard Warning" => 22,
        "Snow Squall Warning" => 23,
        "Ice Storm Warning" => 24,
        "Winter Storm Warning" => 25,
        "High Wind Warning" => 26,
        "Tropical Storm Warning" => 27,
        "Storm Warning" => 28,
        "Tsunami Advisory" => 29,
        "Tsunami Watch" => 30,
        "Avalanche Warning" => 31,
        "Earthquake Warning" => 32,
        "Volcano Warning" => 33,
        "Ashfall Warning" => 34,
        "Coastal Flood Warning" => 35,
        "Lakeshore Flood Warning" => 36,
        "Flood Warning" => 37,
        "High Surf Warning" => 38,
        "Dust Storm Warning" => 39,
        "Blowing Dust Warning" => 40,
        "Lake Effect Snow Warning" => 41,
        "Excessive Heat Warning" => 42,
        "Tornado Watch" => 43,
        "Severe Thunderstorm Watch" => 44,
        "Flash Flood Watch" => 45,
        "Gale Warning" => 46,
        "Flood Statement" => 47,
        "Wind Chill Warning" => 48,
        "Extreme Cold Warning" => 49,
        "Hard Freeze Warning" => 50,
        "Freeze Warning" => 51,
        "Red Flag Warning" => 52,
        "Storm Surge Watch" => 53,
        "Hurricane Watch" => 54,
        "Hurricane Force Wind Watch" => 55,
        "Typhoon Watch" => 56,
        "Tropical Storm Watch" => 57,
        "Storm Watch" => 58,
        "Hurricane Local Statement" => 59,
        "Typhoon Local Statement" => 60,
        "Tropical Storm Local Statement" => 61,
        "Tropical Depression Local Statement" => 62,
        "Avalanche Advisory" => 63,
        "Winter Weather Advisory" => 64,
        "Wind Chill Advisory" => 65,
        "Heat Advisory" => 66,
        "Urban and Small Stream Flood Advisory" => 67,
        "Small Stream Flood Advisory" => 68,
        "Arroyo and Small Stream Flood Advisory" => 69,
        "Flood Advisory" => 70,
        "Hydrologic Advisory" => 71,
        "Lakeshore Flood Advisory" => 72,
        "Coastal Flood Advisory" => 73,
        "High Surf Advisory" => 74,
        "Heavy Freezing Spray Warning" => 75,
        "Dense Fog Advisory" => 76,
        "Dense Smoke Advisory" => 77,
        "Small Craft Advisory" => 78,
        "Brisk Wind Advisory" => 79,
        "Hazardous Seas Warning" => 80,
        "Dust Advisory" => 81,
        "Blowing Dust Advisory" => 82,
        "Lake Wind Advisory" => 83,
        "Wind Advisory" => 84,
        "Frost Advisory" => 85,
        "Ashfall Advisory" => 86,
        "Freezing Fog Advisory" => 87,
        "Freezing Spray Advisory" => 88,
        "Low Water Advisory" => 89,
        "Local Area Emergency" => 90,
        "Avalanche Watch" => 91,
        "Blizzard Watch" => 92,
        "Rip Current Statement" => 93,
        "Beach Hazards Statement" => 94,
        "Gale Watch" => 95,
        "Winter Storm Watch" => 96,
        "Hazardous Seas Watch" => 97,
        "Heavy Freezing Spray Watch" => 98,
        "Coastal Flood Watch" => 99,
        "Lakeshore Flood Watch" => 100,
        "Flood Watch" => 101,
        "High Wind Watch" => 102,
        "Excessive Heat Watch" => 103,
        "Extreme Cold Watch" => 104,
        "Wind Chill Watch" => 105,
        "Lake Effect Snow Watch" => 106,
        "Hard Freeze Watch" => 107,
        "Freeze Watch" => 108,
        "Fire Weather Watch" => 109,
        "Extreme Fire Danger" => 110,
        "911 Telephone Outage" => 111,
        "Coastal Flood Statement" => 112,
        "Lakeshore Flood Statement" => 113,
        "Special Weather Statement" => 114,
        "Marine Weather Statement" => 115,
        "Air Quality Alert" => 116,
        "Air Stagnation Advisory" => 117,
        "Hazardous Weather Outlook" => 118,
        "Hydrologic Outlook" => 119,
        "Short Term Forecast" => 120,
        "Administrative Message" => 121,
        "Test" => 122,
        "Child Abduction Emergency" => 123,
        "Blue Alert" => 124
    };
}

$uzones = null;
$wwas = [];

if ($method == 'oreroads') {
    if (isset($_REQUEST['lat']) && isset($_REQUEST['lon'])) {
        $a = get_data('https://api.weather.gov/points/' . round($_REQUEST['lat'], 4) . ',' . round($_REQUEST['lon'], 4));
        preg_match('/(OR[A-Z][0-9]{3})/', $a['properties']['forecastZone'], $z1);
        preg_match('/(OR[A-Z][0-9]{3})/', $a['properties']['county'], $z2);
        preg_match('/(OR[A-Z][0-9]{3})/', $a['properties']['fireWeatherZone'], $z3);

        $uzones = [$z1[1], $z2[1], $z3[1]];
    }

    if ($function == 'zone') {
        return $returnJson = ['zone' => $z1[1]];
    }

    $ignore = ['Beach Hazards Statement', 'High Surf Advisory', 'High Surf Warning'];
    $zones = ['ORZ001', 'ORZ002', 'ORZ003', 'ORZ004', 'ORZ005', 'ORZ006', 'ORZ007', 'ORZ008', 'ORZ010', 'ORZ011', 'ORZ012', 'ORZ013', 'ORZ014', 'ORZ015', 'ORZ016', 'ORZ021', 'ORZ022', 'ORZ023', 'ORZ024', 'ORZ025', 'ORZ026', 'ORZ027', 'ORZ028', 'ORZ029', 'ORZ030', 'ORZ031', 'ORZ041', 'ORZ044', 'ORZ049', 'ORZ050', 'ORZ061', 'ORZ062', 'ORZ063', 'ORZ064', 'ORZ502', 'ORZ503', 'ORZ505', 'ORZ506', 'ORZ507', 'ORZ508', 'ORZ509', 'ORZ510', 'ORZ511'];
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
            $wwas[] = [
                'id' => $p['id'],
                'event' => $p['event'],
                'priority' => $pri,
                'zone' => str_replace('  ', ' ', $p['areaDesc']),
                'zoneid' => $wwa['properties']['geocode']['UGC'],
                'effective' => $eff,
                'expires' => $exp,
                'headline' => preg_replace('/([0-9]+:[0-9]+)([A-Z]{2})/', '$1 $2', $p['headline']),
                'userArea' => (in_array(true, $usersArea) ? true : false),
                'wfo' => $p['senderName']
            ];
        }
    }

    if ($wwas) {
        usort($wwas, function ($a, $b) {
            if ($a['priority'] == $b['priority']) {
                return $a['expires'] <=> $b['expires'];
            } else {
                return $a['priority'] <=> $b['priority'];
            }
        });
    }

    return $returnJson = ['wwas' => $wwas];
}

if ($method == 'severe') {
    $alerts = [];
    $json = get_data('https://api.weather.gov/alerts?active=true&severity=Extreme');

    for ($i = 0; $i < count($json['features']); $i++) {
        $event = $json['features'][$i]['properties']['event'];

        if ($event == 'Severe Thunderstorm Watch' || $event == 'Tornado Watch') {
            $alerts[] = $json['features'][$i];
        }
    }

    return $returnJson = ['severe' => $alerts];
}

date_default_timezone_set('UTC');

$features = get_data('https://www.weather.gov/source/crh/allhazard.geojson');

if (isset($_GET['filter'])) {
    $feat = [];

    foreach ($features['features'] as $item) {
        if (substr($item['properties']['ugc'][0], 0, 2) == $_GET['filter']) {
            $feat[] = $item;
        }
    }

    return $returnJson = ['type' => 'FeatureCollection', 'features' => $feat];
}

return $returnJson = $features;