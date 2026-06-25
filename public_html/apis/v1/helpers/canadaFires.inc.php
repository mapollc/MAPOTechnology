<?
$weeks1 = strtotime('-7 days');
$weeks3 = strtotime('-3 weeks');
$months6 = strtotime('-6 months');
$sql = "SELECT * FROM ca_wildfires
    WHERE year = $year
    AND display = 1
    AND (
        (date >= $weeks3 AND acres < 1000 AND status != 'Under control') OR
        (date >= $weeks1 AND acres < 1000 AND status = 'Under control') OR
        (date >= $months6 AND acres >= 1000)
    )
    ORDER BY " . ($_REQUEST['order'] ? $_REQUEST['order'] : 'date') . " DESC";

$result = mysqli_query($con, $sql);

$total = 0;
while ($row = mysqli_fetch_assoc($result)) {
    $url = 'wildfire/' . $row['wfid'] . '/canada/' . strtolower(str_replace('--', '-', str_replace('_', '-', str_replace(' ', '-', $row['name'])))) . '-fire';

    $features[] = [
        'type' => 'Feature',
        'geometry' => [
            'type' => 'Point',
            'coordinates' => [
                floatval($row['lon']),
                floatval($row['lat'])
            ]
        ],
        'properties' => [
            'wfid' => intval($row['wfid']),
            'province' => $row['province'],
            'name' => str_replace('_', ' ', $row['name']),
            'type' => 'Wildfire',
            'acres' => floatval($row['acres']),
            'status' => ($row['status'] ? $row['status'] : null),
            'near' => null,
            'url' => $url,
            'time' => [
                'year' => intval($row['year']),
                'discovered' => floatval($row['date']),
                'captured' => floatval($row['captured']),
                'updated' => floatval($row['updated']),
                'timezone' => $row['timezone']
            ]
        ]
    ];

    $total++;
}

$returnJson = ['type' => 'FeatureCollection', 'features' => $features, 'totalFires' => $total];