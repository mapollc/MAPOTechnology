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
$version = $_GET['version'] ?? null;
$app = $_GET['app'] ?? null;
$folder = $_GET['folder'] ?? null;
$file = $_GET['file'] ?? null;
$type = $_GET['type'] ?? null;

$contentType = $type == 'geojson' ? 'application/geo+json' : 'text/' . ($type == 'js' ? 'javascript' : 'css');
$base = '/home/mapo/public_html';

$v = $version ? rep($version) : null;
$isApp = !empty($app);

if ($isApp && $v) {
    $root = "$base/apps/$app/v$v/$file";
} elseif ($isApp) {
    $root = "$base/apps/$app/$file";
} elseif ($v) {
    $root = "$base/$path/v$v/$file.$type";
} else {
    $root = "$base/$path/" . ($folder ? "$folder/" : '') . $file;
}

if (file_exists($root)) {
    $filemod = filemtime($root);
    $assetMod = filemtime(__FILE__);

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Origin: *');
    header('Cache-Control: public, max-age=604800');
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));
    header("Etag: \"$filemod.$assetMod\"");
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', $filemod));
    header("Content-type: $contentType");

    // Added: cached minified asset handling
    $minify = $file != 'turf';

    if ($minify) {
        $cacheDir = "$base/src";

        if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);

        // Added: unique cache name based on source path
        $cacheFile = "$cacheDir/" . md5($root) . ".$type";

        // Added: rebuild cache when original file changes
        if (!file_exists($cacheFile) || filemtime($cacheFile) < $filemod) {
            ob_start();
            include_once '/home/mapo/public_html/config/minifier.inc.php';

            $contents = ob_get_clean();
            file_put_contents($cacheFile, $contents);
        } else {
            $contents = file_get_contents($cacheFile);
        }

        echo $contents;
    } else {
        // Added: bypass minifier for large/non-minified files
        readfile($root);
    }
} else {
    http_response_code(404);
}