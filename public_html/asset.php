<?
if ($_GET['folder']) {
    $root = '/home/mapo/public_html/'.$_GET['folder'].'/'.$_GET['file'];
} else {
    $root = '/home/mapo/public_html/'.$_GET['type'].'/'.$_GET['file'];
}
$filemod = filemtime($root);

function rep($t) {
    return str_replace(['.js', '.css'], ['', ''], $t);
}

#ini_set('display_errors', 1);
#error_reporting(E_ALL);
header('Cache-Control: must-revalidate, public, max-age=604800');
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));
header('Pragma: cache');
header('Etag: "'.$filemod.'.'.filemtime('./asset.php').'"');
header('Last-Modified: '.gmdate('D, d M Y H:i:s \G\M\T', $filemod));
header('Content-type: '.($_GET['type'] == 'geojson' ? 'application/geo+json' : 'text/'.($_GET['type'] == 'js' ? 'javascript' : 'css')));

$minify = true;
require_once './config/minifier.ini.php';