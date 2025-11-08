<?
$counties = array('01' => 'Baker',
'02' => 'Benton',
'03' => 'Clackamas',
'04' => 'Clatsop',
'05' => 'Columbia',
'06' => 'Coos',
'07' => 'Crook',
'08' => 'Curry',
'09' => 'Deschutes',
'10' => 'Douglas',
'11' => 'Gilliam',
'12' => 'Grant',
'13' => 'Harney',
'14' => 'Hood River',
'15' => 'Jackson',
'16' => 'Jefferson',
'17' => 'Josephine',
'18' => 'Klamath',
'19' => 'Lake',
'20' => 'Lane',
'21' => 'Lincoln',
'22' => 'Linn',
'23' => 'Malheur',
'24' => 'Marion',
'25' => 'Morrow',
'26' => 'Multnomah',
'27' => 'Polk',
'28' => 'Sherman',
'29' => 'Tillamook',
'30' => 'Umatilla',
'31' => 'Union',
'32' => 'Wallowa',
'33' => 'Wasco',
'34' => 'Washington',
'35' => 'Wheeler',
'36' => 'Yamhill');

$con3 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_odot');

if (mysqli_connect_errno()) {
    echo 'Failed to connect to MySQL: '.mysqli_connect_error();
}

if ($method == 'meta') {
    if ($function == 'crew') {
        $sql = "SELECT DISTINCT rn.* FROM sections AS s LEFT JOIN road_network AS rn ON rn.hwy = s.hwy AND rn.name = s.name WHERE unit = $_REQUEST[id] AND sfx = '00' ORDER BY road ASC";
    } else {
        $hn = $_REQUEST['hwynum'];
        if ($_REQUEST['road']) {
            if (str_contains($_REQUEST['road'], '-')) {
                $road = $_REQUEST['road'];
            } else {
                preg_match('/^([A-Za-z]+)([0-9]+)$/', $_REQUEST['road'], $matches);
                $road = "$matches[1]-$matches[2]";
            }
        }
        if ($hn && !$road) {
            $where = "hwy = '$hn'";
        } else if (!$hn && $road) {
            $where = "road = '$road'";
        } else {
            $where = "hwy = '$hn' AND road = '$road'";
        }

        $sql = "SELECT * FROM road_network WHERE $where";
    }

    $result = mysqli_query($con3, $sql);

    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = [
            'id' => intval($row['id']),
            'hwy_num' => $row['hwy'],
            'route' => $row['road'],
            'name' => $row['name'],
            'mileposts' => [
                'start' => floatval($row['start_mp']),
                'end' => floatval($row['end_mp'])
            ]
        ];
    }

} else if ($method == 'incident') {
    $mp = $_REQUEST['mp'];
    $hn = $_REQUEST['hwynum'];
    if ($_REQUEST['road']) {
        if (str_contains($_REQUEST['road'], '-')) {
            $road = $_REQUEST['road'];
        } else {
            preg_match('/^([A-Za-z]+)([0-9]+)$/', $_REQUEST['road'], $matches);
            $road = "$matches[1]-$matches[2]";
        }
    }
    if ($hn && !$road) {
        $where = "rn.hwy = '$hn'";
    } else if (!$hn && $road) {
        $where = "rn.road = '$road'";
    } else {
        $where = "rn.hwy = '$hn' AND rn.road = '$road'";
    }
    $where .= " AND $mp BETWEEN rn.start_mp AND rn.end_mp";

    $sql = "SELECT rn.id, rn.hwy, rn.road, rn.name, county, c.region, c.district, c.id AS unit, c.name AS crewName FROM road_network AS rn LEFT JOIN sections AS s ON s.hwy = rn.hwy AND s.name = rn.name AND $mp BETWEEN s.start_mp AND s.end_mp LEFT JOIN crews AS c ON c.id = s.unit WHERE $where ORDER BY name ASC";
    $result = mysqli_query($con3, $sql);
    $ids = [];

    while ($row = mysqli_fetch_assoc($result)) {
        if (!in_array($row['id'], $ids)) {
            $cnty = str_pad($row['county'], 2, '0', STR_PAD_LEFT);

            $data[] = [
                'id' => intval($row['id']),
                'road' => [
                    'hwy_num' => $row['hwy'],
                    'route' => $row['road'],
                    'name' => $row['name'],
                    'directions' => intval(substr($row['road'], -1)) % 2 !== 0 ? ['NB', 'SB'] : ['WB', 'EB']
                ],
                'county' => [
                    'id' => $cnty,
                    'name' => $counties[$cnty]
                ],
                'unit' => [
                    'id' => intval($row['unit']),
                    'name' => $row['crewName'],
                    'region' => intval($row['region']),
                    'district' => intval($row['district'])
                ]
            ];

            $ids[] = $row['id'];
        }
    }
}

$returnJson = array('data' => $data);

mysqli_close($con3);