<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

function rep($t)
{
    return str_replace(['.js', '.css', 'v'], ['', '', ''], $t);
}

$headers = apache_request_headers();
preg_match('/(www\.)?(.*)\.(.*)/', $_SERVER['HTTP_HOST'], $output_array);

// define variables
$path = "$output_array[2].$output_array[3]";
$version = $_GET['version'];
$app = $_GET['app'];
$folder = $_GET['folder'];
$file = $_GET['file'];
$type = $_GET['type'];
$contentType = $type == 'geojson' ? 'application/geo+json' : 'text/' . ($type == 'js' ? 'javascript' : 'css');

$base = '/home/mapo/public_html';
$v = isset($version) ? rep($version) : null;
$isApp = isset($app);

if ($isApp && $v) {
    $root = "$base/apps/$app/v$v/$file";
} else if ($isApp) {
    $root = "$base/apps/$app/$file";
} else if ($v) {
    $root = "$base/$path/v$v/$file.$type";
} else {
    $root = "$base/$path/" . ($folder ? "$folder/" : '') . $file;
}

if (file_exists($root)) {
    $filemod = filemtime($root);

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Origin: *');
    header('Cache-Control: must-revalidate, public, max-age=604800');
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));
    header('Pragma: cache');
    header("Etag: \"$filemod." . filemtime('/home/mapo/public_html/asset.php') . "\"");
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', $filemod));
    header("Content-type: $contentType");

    $minify = $file == 'turf' ? false : true;
    include_once '/home/mapo/public_html/config/minifier.inc.php';
} else {
    http_response_code(404);
}