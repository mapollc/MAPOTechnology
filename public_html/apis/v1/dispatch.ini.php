<?
$where = (isset($method) && $method != 'all' ? " AND agency = '$method'" : "");
$sql = mysqli_query($con, "SELECT agency, state, name, location, website, phone, cad_update FROM dispatch_centers WHERE active = 1$where ORDER BY name ASC");
while ($row = mysqli_fetch_assoc($sql)) {
    $centers[] = $row;
}

$returnJson = array('dispatch' => $centers);
?>