<?
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/x-protobuf');

function get_data($url)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch);

    return $output;
}

$x = $_GET['x'];
$y = $_GET['y'];
$z = $_GET['z'];

if (file_exists("./vector/$z/$x/$y.pbf")) {
    echo 'cache';
    $file = file_get_contents("./vector/$z/$x/$y.pbf");
} else {
    if (!file_exists("./vector/$z")) {
        mkdir("./vector/$z");
    }
    
    if (!file_exists("./vector/$z/$x")) {
        mkdir("./vector/$z/$x");
    }

    echo 'fresh';
    $file = get_data("https://tiles.openfreemap.org/planet/20250910_001001_pt/$z/$x/$y.pbf");
    file_put_contents("./vector/$z/$x/$y.pbf", $file);
}

echo $file;