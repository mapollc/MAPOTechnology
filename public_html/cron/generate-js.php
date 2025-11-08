<?
$version = file_get_contents('version.txt');
$domains = ['wildfiremap.org', 'fireweatheravalanche.org'];
$files = ['incident', 'wwas', 'service-worker'];

foreach ($files as $theFile) {
    $baseFile = "/home/mapo/public_html/mapofire.com/v$version/$theFile.js";

    foreach ($domains as $domain) {
        $name = "$domain/v$version/$theFile.js";
        $file = "/home/mapo/public_html/$name";

        if (filemtime($baseFile) > filemtime($file)) {
            file_put_contents($file, file_get_contents($baseFile));
            echo "Updated $name...
";
        }
    }
}