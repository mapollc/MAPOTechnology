<?
function rep($t) {
    return str_replace(['.js', '.css'], ['', ''], $t);
}

function ctype() {
    global $_GET;

    switch ($_GET['type']) {
        case 'geojson':
            return 'application/geo+json';
        case 'js':
            return 'text/javascript';
        case 'css':
            return 'text/css';
    }
}

$contentType = ctype();
$expiry = 604800;
$version = $_GET['version'] ?? '';
$type = $_GET['type'] ?? '';
$file = $_GET['file'] ?? '';
$folder = $_GET['folder'] ?? '';

$root = "/home/mapo/public_html/" . ($folder ? "$folder/$file" : "$type/$file");
$filemod = filemtime($root);

header("Content-type: $contentType");
header("Cache-Control: must-revalidate, public, max-age=$expiry");
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + $expiry));
header('Pragma: cache');
header("Etag: \"$filemod." . filemtime('./asset.php')."\"");
header('Last-Modified: '.gmdate('D, d M Y H:i:s \G\M\T', $filemod));

$minify = true;
require_once './config/minifier.inc.php';