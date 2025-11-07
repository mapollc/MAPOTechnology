<?

/*$t = $_GET['t'];
$x = $_GET['x'];
$y = $_GET['y'];
$z = $_GET['z'];

$url = "https://tiles.lightningmaps.org/?x=$x&y=$y&z=$z&s=256&t=$t";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
curl_setopt($ch, CURLOPT_REFERER, 'https://mapotechnology.com');
curl_setopt($ch, CURLOPT_TIMEOUT, 5); // 5 seconds timeout
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: image/png');

if ($httpCode === 200 && $response !== false) {
    $img = @imagecreatefromstring($response);

    if ($img !== false) {
        imagepng($img);
        imagedestroy($img);
    } else {
        http_response_code(500);
        echo file_get_contents('/home/mapo/public_html/images/icons/fire/lightning.png');
    }
} else {
    http_response_code(504); // Gateway Timeout or similar
    echo file_get_contents('/home/mapo/public_html/images/icons/fire/lightning.png');
}

date_default_timezone_set('UTC');
#ini_set('display_errors', 1);
#error_reporting(E_ALL);

function get($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($httpCode == 200) {
        return $response;
    } else {
        return file_get_contents('/home/mapo/public_html/images/icons/fire/lightning.png');
    }
}

$t = $_REQUEST['t'];
$x = $_REQUEST['x'];
$y = $_REQUEST['y'];
$z = $_REQUEST['z'];

$timeLimit = 60 * ($t == 5 ? 30 : 120);
$cachefile = 'lightning-'.$t.'-'.$x.'-'.$y.'-'. $z;
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211); 
////$memcache->delete($cachefile);
////$memcache->delete($cachefile.'-time');
$cache = $memcache->get($cachefile);
$expires = $cache ? $memcache->get($cachefile.'-time') + $timeLimit : strtotime('+'.$timeLimit.' seconds');
$url = 'https://tiles.lightningmaps.org/?x=' . $x . '&y=' . $y . '&z=' . $z . '&s=256&t=' . $t;

if ($_GET['geturl'] == 1) {
    $returnJson = ['url' => $url];
} else {
    // if there is no cached version of the lightning data, request it and then cache it
    if (!$cache || filemtime('/home/mapo/public_html/mapofire.com/apis/lightning.ini.php') > $memcache->get($cachefile.'-time')) {
        $contents = $_SESSION['uid'] < 3 ? get($url) : file_get_contents('/home/mapo/public_html/images/icons/fire/lightning.png');

        $memcache->set($cachefile, $contents, $timeLimit);
        $memcache->set($cachefile.'-time', time(), $timeLimit);
    }

    // set default headers
    header('Content-type: image/png');
    header('Pragma: cache');
    header('Expires: '.date('D, d M Y H:i:s \G\M\T', $expires));
    header('Cache-Control: max-age='.$timeLimit);

    if ($cache) {
        header('Last-Modified: '.date('D, d M Y H:i:s \G\M\T', $memcache->get($cachefile.'-time')));
    }

    // output the image to the browser
    ImagePNG(imagecreatefromstring($cache ? $cache : $contents));
}*/