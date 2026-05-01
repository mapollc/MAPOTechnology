<?
$cachefile = '/home/mapo/public_html/cron/cache/tfrs.json';
$file = json_decode(file_get_contents($cachefile));

if (isset($_REQUEST['id'])) {
    foreach ($file as $ea) {
        if ($ea->properties->id == $_REQUEST['id']) $features[] = $ea;
    }
} else {
    $features = $file;
}

$returnJson = ['type' => 'FeatureCollection', 'updated' => filemtime($cachefile), 'features' => $features];