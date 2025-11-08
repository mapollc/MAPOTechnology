<?
header('Content-type: application/json');
include('../config.inc.php');

if ($_REQUEST['m'] == 1) {
    $sql = mysqli_query($con, "SELECT DISTINCT(agency) FROM $db.dispatch_zones WHERE state = '$_REQUEST[state]' ORDER BY agency ASC");
    while($row = mysqli_fetch_assoc($sql)) {
        $return[] = $row['agency'];
    }
} else if ($_REQUEST['m'] == 2) {
    $sql = mysqli_query($con, "SELECT unit, area FROM $db.dispatch_zones WHERE state = '$_REQUEST[state]' AND agency = '$_REQUEST[agency]' ORDER BY area ASC");
    while($row = mysqli_fetch_assoc($sql)) {
        $return[] = array($row['unit'] => $row['area']);
    }
}

echo json_encode(array('response' => $return), JSON_PRETTY_PRINT);
?>