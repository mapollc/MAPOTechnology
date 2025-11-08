<?
$returnJson = array('elevation' => json_decode(file_get_contents('https://epqs.nationalmap.gov/v1/json?x='.$_REQUEST['lon'].'&y='.$_REQUEST['lat'])));
?>