<?
$now = time();

function errorCodes($code, $msg)
{
    return ['response' => 'error', 'code' => $code, 'msg' => $msg];
}

if (!$method) {
    $returnJson = errorCodes(1, 'An incorrect method was sent.');
}

if (isset($_SESSION['uid'])) {
    $uid = $_SESSION['uid'];
} else {
    $user = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid WHERE token = '$_REQUEST[token]' AND expires > $now LIMIT 1"));
    $uid = $user['uid'];
}

// list user GIS content
if ($method == 'list') {
    $ints = ['objectID', 'localID', 'uid', 'created', 'modified'];
    $where = "uid = $uid";

    if ($function) {
        $where .= " AND type = '$function'";
    }

    $result = mysqli_query($con, "SELECT objectID, localID, type, geojson, created, modified FROM user_content WHERE $where ORDER BY modified DESC, created DESC");

    while ($row = mysqli_fetch_assoc($result)) {
        foreach ($row as $k => $v) {
            if ($k == 'geojson') {
                $value = json_decode($v);
            } else if (in_array($k, $ints)) {
                $value = intval($v);
            } else {
                $value = $v;
            }

            $data[$k] = $value;
        }
        $feat[] = $data;
    }

    $returnJson = ['features' => $feat];
}

// create or edit a GIS object
if ($method == 'create' || $method == 'update') {
    if (!isset($_REQUEST['data']) || empty($_REQUEST['data'])) {
        $returnJson = errorCodes(2, 'No GIS data was sent');
    }

    $data = json_decode(urldecode($_REQUEST['data']), true);
    $id = $data['id'];
    $name = $data['name'];
    $notes = $data['notes'];
    $created = $data['created'] ?: null;
    $type = $data['type'];
    $color = $data['color'];

    if ($method == 'update') {
        $objectID = intval($data['objectID']);
        $existing = mysqli_fetch_assoc(mysqli_query($con, "SELECT created FROM user_content WHERE objectID = $objectID AND uid = $uid"));

        if (!$existing) {
            $returnJson = errorCodes(6, 'The feature being updated does not exist');
        }

        $created = $existing['created'];
    }

    if ($type == 'marker') {
        $lat = floatval($data['lat']);
        $lon = floatval($data['lon']);

        if (!isset($data['lat'], $data['lon']) || !is_numeric($data['lat']) || !is_numeric($data['lon'])) {
            $returnJson = errorCodes(3, 'An invalid latitude and/or longitude was provided');
        }

        $feature = [
            'id' => intval($id),
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [
                    $lon,
                    $lat
                ]
            ],
            'properties' => [
                'id' => intval($id),
                'name' => $name,
                'notes' => $notes,
                'color' => $color,
                'created' => intval($created)
            ]
        ];
    }

    if ($method == 'update') {
        $feature['properties']['modified'] = $now;
    }

    $geojson = mysqli_real_escape_string($con, json_encode($feature, JSON_THROW_ON_ERROR));

    if ($method == 'update') {
        mysqli_query($con, "UPDATE user_content SET geojson = '$geojson', modified = $now WHERE objectID = $objectID AND uid = $uid");
    
        $returnJson = ['response' => 'success', 'type' => $type, 'objectID' => $objectID];
    } else {
        mysqli_query($con, "INSERT INTO user_content (localID, uid, `type`, geojson, created, modified) VALUES($id, $uid, '$type', '$geojson', $created, $created)") or die(mysqli_error($con));
        $objectID = mysqli_insert_id($con);

        if ($objectID) {
            $returnJson = ['response' => 'success', 'type' => $type, 'objectID' => $objectID];
        } else {
            $returnJson = errorCodes(4, 'Unable to save user object to database');
        }
    }
}

// delete a GIS object
if ($method == 'delete') {
    $query = prepareQuery('ii', [$uid, $_REQUEST['id']], "DELETE FROM user_content WHERE uid = ? AND objectID = ?");

    if ($query && $query['success']) {
        $returnJson = ['response' => 'success'];
    } else {
        $returnJson = errorCodes(5, 'Unable to delete user feature');
    }
}
