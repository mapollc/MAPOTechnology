<?
ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);

$cacheKey = "shortURL-$_GET[type]_$_GET[wfid]";
$memcache = new Memcached();
if (!count($memcache->getServerList())) $memcache->addServer('127.0.0.1', 11211);
$cache = $memcache->get($cacheKey);

if ($cache) {
    $url = $cache;
} else {
    include_once '/home/mapo/public_html/config.inc.php';
    include_once '/home/mapo/public_html/apis/functions.inc.php';

    $fire = executeQuery(
        'i',
        [$_GET['wfid']],
        "SELECT name, state FROM wildfires WHERE wfid = ? LIMIT 1"
    );
    mysqli_close($con);

    $url = wildfireURL($_GET['wfid'], $fire['name'], $fire['state']);

    if ($_GET['type'] == 'f') {
        $url = str_replace('wildfire/', 'fires/', $url);
    }

    $memcache->set($cacheKey, $url, strtotime('+10 days'));
}

header("Location: https://$_SERVER[HTTP_HOST]/$url");
exit();