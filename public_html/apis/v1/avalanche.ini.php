<?
function isJson($string) {
    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
}

function format($k, $v) {
    $ints = ['id','avalanches','occurred','involved','caught','killed','report_created','report_updated'];

    if (in_array($k, $ints)) {
        return intval($v);
    } else if ($k == 'lat' || $k == 'lon') {
        return floatval($v);
    } else {
        return $v;
    }
}

if ($method == 'incident') {
    if (!isset($_GET['id']) || $_GET['id'] == '') {
        $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An avalanche report ID was not provided');
    } else {
        $id = mysqli_real_escape_string($con, $_GET['id']);
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM avalanche WHERE id = '$id' OR avy_id = '$id'"));

        if (!$row) {
            $returnJson = array('response' => 'error', 'code' => 3, 'msg' => "Avalanche report #$_GET[id] does not exist");
        } else {
            $fields = [];

            foreach ($row as $k => $v) {
                $fields[$k] = isJson($v) ? json_decode($v) : format($k, $v);
            }

            if ($row['assets'] != '[]') {
                $get = json_decode($row['assets'])[0];
                $fields['asset'] = array('type' => str_replace('_asset', '', $get->type), 'url' => $get->full_url, 'caption' => $get->caption);
            } else {
                $fields['asset'] = null;
            }

            $returnJson = array('report' => $fields);
        }
    }
} else {
    if (!isset($_REQUEST['start']) || !isset($_REQUEST['end'])) {
        $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'A start and end date/time must be specified');
    } else {
        $where = $method ? "AND type = '$method' " : '';
        $where .= $_REQUEST['killed'] == 1 ? "AND killed > 0 " : "";
        $where .= isset($_REQUEST['state']) ? "AND state = '$_REQUEST[state]' " : "";
        $where = rtrim($where, ' ');

        $order = (isset($_REQUEST['order']) ? $_REQUEST['order'] : "occurred").' '.(isset($_REQUEST['sort']) ? $_REQUEST['sort'] : "DESC");
        $sql = "SELECT * FROM avalanche WHERE occurred >= $_REQUEST[start] AND occurred <= $_REQUEST[end] $where ORDER BY $order";

        $accs = $avys = $incs = $in = $caught = $killed = 0;
        $result = mysqli_query($con, $sql);
        while ($row = mysqli_fetch_assoc($result)) {
            $fields = [];

            foreach ($row as $k => $v) {
                if ($_REQUEST['fullDetails'] != 1) {
                    if ($k != 'details' && $k != 'avalanche_details' && $k != 'assets') {
                        $fields[$k] = format($k, $v);
                    }
                } else {
                    $fields[$k] = isJson($v) ? json_decode($v) : format($k, $v);
                }
            }

            if ($_REQUEST['fullDetails'] == 1) {
                if ($row['assets'] != '[]') {
                    $get = json_decode($row['assets'])[0];
                    $fields['asset'] = array('type' => str_replace('_asset', '', $get->type), 'url' => $get->full_url, 'caption' => $get->caption);
                } else {
                    $fields['asset'] = null;
                }
            }

            $data[] = $fields;

            if ($row['type'] == 'incident') {
                $incs++;
            } else if ($row['type'] == 'accident') {
                $accs++;
            }

            $states[] = $row['state'];
            $in += $row['involved'];
            $caught += $row['caught'];
            $killed += $row['killed'];
            $avys += $row['avalanches'];
        }

        if ($states) {
            $states = array_count_values($states);
            ksort($states);
        }

        $stats = array('total' => $data ? count($data) : null, 'accidents' => $accs, 'incidents' => $incs, 'number_of_avys' => $avys, 'involved' => $in, 'caught' => $caught, 'killed' => $killed);

        if (!isset($_REQUEST['state'])) {
            $stats['states'] = $states;
        }

        $returnJson = array('avalanches' => array('stats' => $stats, 'data' => $data));
    }
}