<?
function verify($v) {
    return $v == 0 ? 'unverified' : ($v == 1 ? 'verified' : 'rejected');
}

$where = "verified != 2";

if ($method == 'active' && !isset($_REQUEST['start']) && !isset($_REQUEST['end'])) {
    $time = strtotime('-6 hours');
    $where .= " AND time >= $time";
}

if (!$method && isset($_REQUEST['start']) && isset($_REQUEST['end'])) {
    $start = $_REQUEST['start'];
    $end = $_REQUEST['end'];
    $where .= " AND (time >= $start AND time <= $end)";
}

if (isset($_REQUEST['state'])) {
    $where .= " AND state = '$_REQUEST[state]'";
}

$result = mysqli_query($con, "SELECT id, state, type, acres, details, geo, user, time, verified FROM user_reports WHERE $where ORDER BY time DESC");

while ($row = mysqli_fetch_assoc($result)) {
    $geo = json_decode($row['geo']);
    $user = json_decode($row['user']);

    $reports[] = [
        'id' => intval($row['id']),
        'type' => 'Feature',
        'geometry' => [
            'type' => 'Point',
            'coordinates' => [
                floatval($geo->lon),
                floatval($geo->lat)
            ]
        ],
        'properties' => [
            'reportId' => date('Y', $row['time']).'-'.str_pad($row['id'], 3, '0', STR_PAD_LEFT),
            'state' => $row['state'],
            'type' => $row['type'],
            'near' => $geo->near,
            'acres' => floatval(number_format($row['acres'])),
            'details' => $row['details'],
            'reported' => intval($row['time']),
            'verified' => $row['verified'] == 1 ? true : false,
            'status' => verify($row['verified']),
            'source' => $user->platform
        ]
    ];
}

$returnJson = ['type' => 'FeatureCollection', 'features' => $reports];