<?
$noMysql = true;
header('Content-type: text/xml');
header('Expires: ' . gmdate('D, d M Y H:i:s T', strtotime('+1 hour')));
header('Cache-Control: max-age=3600');
include_once '../db.ini.php';

$host = 'www.' . str_replace('www.', '', $_SERVER['HTTP_HOST']);
$json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/wildfires/all,new,smk,rx?format=1&key=50e2c43f8f63ff0ed20127ee2487f15e'));

$sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">
<url><loc>https://$host</loc></url>
<url><loc>https://$host/blazeboard</loc></url>
<url><loc>https://$host/about</loc></url>
<url><loc>https://$host/release-notes</loc></url>
<url><loc>https://$host/country/australia</loc></url>
<url><loc>https://$host/country/canada</loc></url>";

$states = array_merge($provincesArray, $statesArray);
asort($states);
$urls = [];

foreach ($states as $v) {
    $url = $host . '/state/' . strtolower(str_replace(' ', '-', $v));
    $sitemap .= "<url><loc>https://$url</loc></url>";
}

foreach ($json->features as $f) {
    $part = explode('/', $f->properties->url);

    if ($part[2] != '') {
        if (floatval($f->properties->acres) > 100) {
            $sitemap .= "<url><loc>https://$host/" . $f->properties->url . "</loc></url>";
        }
    }
}

echo $sitemap . '</urlset>';