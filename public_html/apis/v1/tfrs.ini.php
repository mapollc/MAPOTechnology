<?
$memcache = new Memcached();
if (!count($memcache->getServerList())) $memcache->addServer('127.0.0.1', 11211);

$cacheFile = '/home/mapo/public_html/cron/cache/tfrs.json';
$fileMTime = filemtime($cacheFile);

$cacheKey = "tfrs_$fileMTime" . (isset($_REQUEST['id']) ? "_{$_REQUEST['id']}" : '');

$json = $memcache->get($cacheKey);

if ($json !== false) {
    $isCached = true;
    $returnJson = json_decode($json);
} else {
    $file = json_decode(file_get_contents($cacheFile));

    if (isset($_REQUEST['id'])) {
        $features = [];

        foreach ($file as $ea) {
            if ($ea->properties->id == $_REQUEST['id']) {
                $features[] = $ea;
            }
        }
    } else {
        $features = $file;
    }

    $returnJson = ['type' => 'FeatureCollection', 'features' => $features, 'updated' => $fileMTime];

    $ttl = max(60, ($fileMTime + 7200) - time());
    $memcache->set($cacheKey, json_encode($returnJson), $ttl);
}