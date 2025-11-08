<?
if ($_REQUEST['fips']) {
    $where = 'fips = '.$_REQUEST['fips'];
} else {
    $a = ucwords(str_replace('-', ' ', $_REQUEST['state']));
    $b = ucwords(str_replace('-', ' ', $_REQUEST['county']));
    $where = 'state = \''.$a.'\' AND county = \''.$b.'\'';
}

$result = mysqli_fetch_assoc(mysqli_query($con, "SELECT fips, state, county, data FROM risk WHERE $where"));
foreach($result as $k => $v) {
    $out[$k] = ($k == 'data' ? unserialize($v) : $v);
} 

$returnJson = array('risk' => $out);
?>