<?
$road = $_REQUEST['road'];
$mp = $_REQUEST['mp'];
$extra = ($_REQUEST['dir'] ? " AND dir = '".$_REQUEST['dir']."'" : '');

$result = mysqli_query($con, "SELECT * FROM oregon_mileposts WHERE road = '$road' AND mp = CAST($mp as FLOAT)$extra");

while($row = mysqli_fetch_assoc($result)) {
    $roads[] = $row;
}

$returnJson = $roads;
?>