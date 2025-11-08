<?
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-type: text/xml');
header('Cache-Control: must-revalidate, public, max-age=2628000');
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 2628000));
header('Pragma: cache');

$urls = '';
$json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/roads/rwis?key=cf707f0516e5c1226835bbf0eece4a0c'));
$json2 = json_decode(file_get_contents('https://api.mapotechnology.com/v1/webcams?key=cf707f0516e5c1226835bbf0eece4a0c&network=ODOT'));
$json3 = json_decode(file_get_contents('https://api.mapotechnology.com/v1/roads?key=cf707f0516e5c1226835bbf0eece4a0c'));
$areas = ['portland',
'salem',
'eugene',
'medford-ashland',
'bend',
'santiam-redmond',
'columbia-gorge',
'pendleton-to-la-grande',
'cabbage-hill',
'ladd-canyon'];

for ($i = 0; $i < count($areas); $i++) {
    $urls .= '<url>
    <loc>https://apps.mapotechnology.com/oregonroads/area/'.$areas[$i].'</loc>
</url>
';
}

for ($i = 0; $i < count($json3->rw); $i++) {
    $urls .= '<url>
    <loc>https://apps.mapotechnology.com/oregonroads/road-report/'.$json3->rw[$i]->id.'</loc>
</url>
';
}

for ($i = 0; $i < count($json->features); $i++) {
    $urls .= '<url>
    <loc>https://apps.mapotechnology.com/oregonroads/rwis/'.$json->features[$i]->properties->station->id.'</loc>
</url>
';
}

for ($i = 0; $i < count($json2->features); $i++) {
    $urls .= '<url>
    <loc>https://apps.mapotechnology.com/oregonroads/camera/'.$json2->features[$i]->properties->id.'</loc>
</url>
';
}

echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
        <loc>https://www.mapotechnology.com</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/about</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/about/contact</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/about/legal/terms</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/about/legal/privacy</loc>
    </url>
    <url>
        <loc>https://apps.mapotechnology.com/oregonroads</loc>
    </url>
    <?=$urls?>
    <url>
        <loc>https://www.mapotechnology.com/oregonroads</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/mapofire</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/secure/login</loc>
    </url>
    <url>
        <loc>https://www.mapotechnology.com/secure/register</loc>
    </url>
    
</urlset>