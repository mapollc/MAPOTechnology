<?
$cityFields = 'fips, city, county, state_prefix AS state, zip_code AS zip, population, lat, lon';
$countyFields = 'fips, name, state, population, xmin, xmax, ymin, ymax';
$gisFields = 'class, type, county, state, name, lat, lon, elevation';
$excludeGISTypes = ['Post Office', 'Place', 'Census', 'Building', 'Locale', 'Populated Place'];

function formatQuery($s)
{
    return strtolower(trim(preg_replace('/(mt\.?)\s(.*)/', 'mount $2', str_replace('-', ' ', $s))));
}

function sortResults($results)
{
    $grouped = [
        'city' => [],
        'county' => [],
        'state' => [],
        'gis' => []
    ];

    foreach ($results as $r) {
        $grouped[$r['type']][] = $r;
    }

    foreach ($grouped as &$list) {
        usort($list, fn($a, $b) => $b['score'] <=> $a['score']);
    }
    unset($list);

    return [
        ...$grouped['state'],
        ...$grouped['county'],
        ...$grouped['city'],
        ...$grouped['gis']
    ];
}

$q = $_REQUEST['q'];
$results = [];

if ($method == 'oreroads') {
    $names = [];
    $cities = [];

    $result = mysqli_query($con, "SELECT city, lat, lon FROM cities WHERE state_prefix = 'OR' ORDER BY city ASC");

    while ($row = mysqli_fetch_assoc($result)) {
        if (!in_array($row['city'], $names)) {
            $row['lat'] = floatval($row['lat']);
            $row['lon'] = floatval($row['lon']);
            $cities[] = $row;
            $names[] = $row['city'];
        }
    }

    return $returnJson = ['cities' => $cities];
}

// if no query was provided
if (!$q) {
    return $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'No query was provided'];
}

$q = formatQuery($q);
$query = mysqli_real_escape_string($con, $q);
$isZipCode = preg_match('/^\d{2,}$/', $q) === 1;
$city = null;
$state = null;

// if user is searching for a state
foreach ($statesArray as $k => $v) {
    $st = strtolower($v);

    if ($st == $q) {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT name, xmin, xmax, ymin, ymax FROM states WHERE LOWER(name) = '$st' LIMIT 1"));
        $results[] = [
            'type' => 'state',
            'data' => [
                'name' => $row['name'],
                'xmin' => floatval($row['xmin']),
                'xmax' => floatval($row['xmax']),
                'ymin' => floatval($row['ymin']),
                'ymax' => floatval($row['ymax'])
            ]
        ];

        break;
    }
}

// parse "city, state" minimally
if (str_contains($q, ',')) {
    [$city, $state] = array_map('trim', explode(',', $q, 2));
    $city = mysqli_real_escape_string($con, $city);
    $state = mysqli_real_escape_string($con, $state);
}

// search based on zip code only
if ($isZipCode) {
    $sql = mysqli_query($con, "SELECT $cityFields FROM cities WHERE zip_code LIKE '%$query%' LIMIT 40");
    while ($row = mysqli_fetch_assoc($sql)) {
        $results[] = [
            'type' => 'city',
            'isZip' => true,
            'data' => $row
        ];
    }
} else {
    // search "city, state" results
    if ($city && $state) {
        $sql = mysqli_query($con, "SELECT $cityFields FROM cities WHERE REPLACE(LOWER(city), '-', ' ') LIKE '%$city%' AND (LOWER(state_prefix) = '$state' OR LOWER(state_name) = '$state') LIMIT 40");

        while ($row = mysqli_fetch_assoc($sql)) {
            $results[] = [
                'type' => 'city',
                'data' => $row
            ];
        }
    } else {
        $sql = mysqli_query($con, "SELECT $cityFields FROM cities WHERE REPLACE(LOWER(city), '-', ' ') LIKE '%$query%' LIMIT 40");

        while ($row = mysqli_fetch_assoc($sql)) {
            $results[] = [
                'type' => 'city',
                'data' => $row
            ];
        }
    }

    // if user is possibly searching for a county
    if (preg_match('/\s(co[a-z]+)\,?/', $q) === 1) {
        [$county, $cstate] = array_map('trim', explode(',', $q, 2));
        $county = preg_replace('/\s+c(o|ou|oun|ount|ounty)?$/', '', preg_replace('/,.*/', '', $county));
        $andState = $cstate ? " AND LOWER(state) = '$cstate'" : '';

        $sql = mysqli_query($con, "SELECT $countyFields FROM counties WHERE LOWER(name) LIKE '%$county%'$andState LIMIT 25");

        while ($row = mysqli_fetch_assoc($sql)) {
            $row['xmin'] = floatval($row['xmin']);
            $row['xmax'] = floatval($row['xmax']);
            $row['ymin'] = floatval($row['ymin']);
            $row['ymax'] = floatval($row['ymax']);

            $results[] = [
                'type' => 'county',
                'data' => $row
            ];
        }
    }
}

// search for GIS results
if (!isset($_REQUEST['citiesonly'])) {
    $isState = $state ? " AND LOWER(state) = '$state'" : '';
    $place = $city ? $city : $query;
    $excludeSQL = "'" . implode("','", $excludeGISTypes) . "'";
    $gisSQL = mysqli_query($con, "SELECT $gisFields FROM gis WHERE type NOT IN ($excludeSQL) AND LOWER(name) LIKE '%$place%'$isState LIMIT 40");

    while ($row = mysqli_fetch_assoc($gisSQL)) {
        $results[] = [
            'type' => 'gis',
            'data' => $row
        ];
    }
}

$normalizedQuery = str_replace(' ', '', $query);

foreach ($results as $i => $entry) {
    $score = 0;

    if ($isZipCode && $entry['type'] === 'city') {
        $zip = (string)$entry['data']['zip'];

        // exact match
        if ($zip === $query) {
            $score = 200; // highest priority
        }
        // starts with (prefix)
        else if (strpos($zip, $query) === 0) {
            $score = 150 - (strlen($zip) - strlen($query)); // closer zip wins
        }
        // contains elsewhere (weaker)
        else if (str_contains($zip, $query)) {
            $score = 100;
        }
        // fallback to similarity for odd cases
        else {
            similar_text($query, $zip, $percent);
            $score = $percent;
        }
    } else {
        // original similarity for name searches
        $val = $entry['type'] === 'city'
            ? "{$entry['data']['city']}, {$entry['data']['state']} {$entry['data']['zip']}"
            : $entry['data']['name'];

        $normalizedVal = str_replace(['-', ' '], '', strtolower($val));

        similar_text($normalizedQuery, $normalizedVal, $percent);
        $score = $percent;
    }

    $results[$i]['score'] = $score;
}

$output = [];
$ordered = sortResults($results);

foreach ($ordered as $entry) {
    $data = $entry['data'];

    if (isset($data['elevation'])) {
        $data['elevation'] = intval($data['elevation']);
    }

    unset($data['lat']);
    unset($data['lon']);

    $arr = [
        'type' => $entry['type'],
        'lat' => floatval($entry['data']['lat']),
        'lon' => floatval($entry['data']['lon']),
        'data' => $data
    ];

    if ($_GET['test'] == 1) $arr['score'] = $entry['score'];
    if (!empty($entry['isZip'])) $arr['isZip'] = true;

    $output[] = $arr;
}

return $returnJson = ['results' => $output];
