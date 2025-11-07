<?
$cacheName = "shortURL-$_GET[type]_$_GET[wfid]";
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211); 

if ($cache) {
    $url = $cache;
} else {
    include_once '/home/mapo/public_html/db.ini.php';
    include_once '/home/mapo/public_html/apis/functions.inc.php';

    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT name, state FROM wildfires WHERE wfid = '$_GET[wfid]' LIMIT 1"));
    mysqli_close($con);

    $url = wildfireURL($_GET['wfid'], $row['name'], $row['state']);

    if ($_GET['type'] == 'f') {
        $url = str_replace('wildfire/', 'fires/', $url);
    }

    $memcache->set($cacheName, $url, strtotime('+90 days'));
}

header("Location: https://$_SERVER[HTTP_HOST]/$url");
exit();