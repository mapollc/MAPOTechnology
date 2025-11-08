<?
$noMysql = true;
header('Content-type: text/xml');
header('Expires: '.gmdate('D, d M Y H:i:s T', strtotime('+1 hour')));
header('Cache-Control: max-age=3600');
include_once '/home/mapo/public_html/db.ini.php';

$host = 'www.'.str_replace('www.', '', $_SERVER['HTTP_HOST']);
$json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/wildfires/all,new,smk?format=1&key=50e2c43f8f63ff0ed20127ee2487f15e'));

echo '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://'.$host.'</loc></url>
<url><loc>https://'.$host.'/list-of-wildfires</loc></url>
<url><loc>https://'.$host.'/release-notes</loc></url>
';

$states = array_merge($provincesArray, $statesArray);
asort($states);

foreach($states as $v) {
    echo '<url><loc>https://'.$host.'/state/'.strtolower(str_replace(' ', '-', $v)).'</loc></url>
';
}

foreach($json->features as $f) {
    if (explode('/', $f->properties->url)[2] != '') {
        if (floatval($f->properties->acres) > 1000) {
           /*echo '<url><loc>https://'.$host.'/'.str_replace(['&', 'wildfire/'], ['', 'fires/'], $f->properties->url).'</loc></url>
';*/
        }
        echo '<url><loc>https://'.$host.'/'.str_replace('wildfire/', 'fires/', $f->properties->url).'</loc></url>';
        echo '<url><loc>https://'.$host.'/'.$f->properties->url.'</loc></url>';
    }
}

echo '</urlset>';