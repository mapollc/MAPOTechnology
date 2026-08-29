<?
if (!isset($noMysql) || $noMysql) {
    try {
        $con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
    } catch (mysqli_sql_exception $e) {
        echo '<p style="padding:1em;text-align:center">There is an error connecting to our databases. Some features/services may not work.</p>';
    }
}

function mapoTrailsDB() {
    return mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
}

// sql query with sql injection prevention for all APIs
function executeQuery($types = '', $params = [], $sql, $useCon2 = false)
{
    global $con;
    global $con2;

    if ($useCon2) {
        $stmt = $con2->prepare($sql);
    } else {
        $stmt = $con->prepare($sql);
    }
    
    if ($stmt === false) {
        return false;
    }

    if ($types != '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result === false) {
        if ($con->errno) {
            $stmt->close();
            return ['error' => true, 'message' => 'Execute failed: ' . $con->error];
        } else {
            $stmt->close();
            return ['success' => true];
        }
    } else {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        $stmt->close();

        if (count($rows) === 1) {
            return $rows[0];
        } else {
            return $rows;
        }
    }
}