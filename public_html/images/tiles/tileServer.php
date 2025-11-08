<?
#ini_set('display_errors', 1);
#error_reporting(E_ALL);
#header('Access-Control-Allow-Origin: *');
header('Content-type: image/png');
header('Cache-Control: must-revalidate, public, max-age=604800');
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));
header('Pragma: cache');
require '../../s3.ini.php';

$t = $_GET['t'];
$zoom = $_GET['z'];
$x = $_GET['x'];
$y = $_GET['y'];

// set the path to get the tiles from
if ($t == 1) {
    # hill shading
    $path = 'https://caltopo.com/tile/hs_m315z45s3/{z}/{x}/{y}.png';
} else if ($t == 2) {
    # caltopo
    $path = 'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png';
} else if ($t == 3) {
    # usfs 2016
    //$path = 'https://ctusfs.s3.amazonaws.com/2016a/{z}/{x}/{y}.png';
    $path = 'https://caltopo.com/tile/f16a/{z}/{x}/{y}.png';
} else if ($t == 4) {
    # avy shading
    $path = 'https://caltopo.com/tile/sc_fixed/{z}/{x}/{y}.png';
} else if ($t == 5) {
    $path = 'https://api.mapbox.com/styles/v1/mapollc/cloq1q2jo005101r6crxw3z0v/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ';
} else if ($t == 6) {
    $path = 'https://topofire.dbs.umt.edu/topofire_v2/data/osmUShydro/{z}/{x}/{y}.png';
}

// check if y coordinate image exists, if it does send it to user from our server, otherwise get it from caltopo then give it to the user
/*if (awsExists('tiles/'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png')) {
    $url = 'https://d3kcsn1y1fg3m9.cloudfront.net/';
    #$url = 'https://fwac.s3.us-west-2.amazonaws.com/';

    if ($_GET['force'] == 1) {
        $img = imagecreatefrompng($url."tiles/".$t."/".$zoom."/".$x."/".$y.".png");

        imagepng($img);
        imagedestroy($img);
    } else {
        header("HTTP/1.1 301 Moved Permanently");
        header("Location: ".$url."tiles/".$t."/".$zoom."/".$x."/".$y.".png");
        header("Connection: close");
    }
} else {
    // check if zoom folder exists
    if (!awsExists('tiles/'.$t.'/'.$zoom.'/')) {
        createAWSFolder('tiles/'.$t.'/'.$zoom.'/');
    }

    // check if x coordinate folder exists
    if (!awsExists('tiles/'.$t.'/'.$zoom.'/'.$x.'/')) {
        createAWSFolder('tiles/'.$t.'/'.$zoom.'/'.$x.'/');
    }*/

    // replace template variables in path
    $path = str_replace(['{x}', '{y}', '{z}'], [$x, $y, $zoom], $path);
    //ob_start();
    $image = imagecreatefrompng($path);

    if ($image) {
        //saveToAWS('tiles/'.$t.'/'.$zoom.'/'.$x, $y.'.png', 'image/png', ob_get_clean());
        /*$save = fopen('./'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png', 'w');
        fwrite($save, $image);
        fclose($save);*/
    }

    #header('Access-Control-Allow-Origin: *');
    #header('Content-type: image/png');
    #header('Expires: '.date('D, d M Y H:i:s \G\M\T', strtotime('+30 days')))
    #header('Cache-Control: max-age=2592000');
    ImagePNG($image);
//}

/*// check if zoom folder exists
if (!file_exists('./'.$t.'/'.$zoom)) {
    mkdir('./'.$t.'/'.$zoom, 0755);
}

// check if x coordinate folder exists
if (!file_exists('./'.$t.'/'.$zoom.'/'.$x)) {
    mkdir('./'.$t.'/'.$zoom.'/'.$x, 0755);
}

// replace template variables in path
$path = str_replace(['{x}', '{y}', '{z}'], [$x, $y, $zoom], $path);

// check if y coordinate image exists, if it does send it to user from our server, otherwise get it from caltopo then give it to the user
if (file_exists('./'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png')) {
    $image = file_get_contents('./'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png');
} else {
    $image = file_get_contents($path);

    if ($image) {
        $save = fopen('./'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png', 'w');
        fwrite($save, $image);
        fclose($save);
    }
}*/