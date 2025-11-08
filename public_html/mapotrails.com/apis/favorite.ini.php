<?
$time = time();

if ($method == 'list') {
    $result = mysqli_query($con2, "SELECT tid, time FROM track_trails WHERE uid = '$_SESSION[uid]'") or die(mysqli_error($con));
    while ($row = mysqli_fetch_assoc($result)) {
        $f[] = array('tid' => $row['tid'], 'time' => $row['time']);
    }
    $out = array('trails' => $f);

} else if ($method == 'add') {
    mysqli_query($con2, "INSERT INTO track_trails (uid,tid,time) VALUES('$_SESSION[uid]','$_REQUEST[tid]','$time')") or die(mysqli_error($con));
    $out = array('success' => 'added');

} else if ($method == 'remove') {
    mysqli_query($con2, "DELETE FROM track_trails WHERE uid = '$_SESSION[uid]' AND tid = '$_REQUEST[tid]'") or die(mysqli_error($con));
    $out = array('success' => 'removed');
}

$returnJson = $out;
?>