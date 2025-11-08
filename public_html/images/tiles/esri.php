<?
ini_set('display_errors',1);
require('../../s3.ini.php');

$zoom = $_GET['z'];
$x = $_GET['x'];
$y = $_GET['y'];

// set the path to get the tiles from
$path = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';

// check if y coordinate image exists, if it does send it to user from our server, otherwise get it from caltopo then give it to the user
if (awsExists('tiles/terrain/'.$zoom.'/'.$x.'/'.$y.'.png')) {
    //$image = file_get_contents('https://d3kcsn1y1fg3m9.cloudfront.net/tiles/'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png');
    header("HTTP/1.1 301 Moved Permanently");
    header("Location: https://fwac.s3.us-west-2.amazonaws.com/tiles/terrain/".$zoom."/".$x."/".$y.".png");
    header("Connection: close");
} else {
    // check if zoom folder exists
    if (!awsExists('tiles/terrain/'.$zoom.'/')) {
        createAWSFolder('tiles/'.$t.'/'.$zoom.'/');
    }

    // check if x coordinate folder exists
    if (!awsExists('tiles/terrain/'.$zoom.'/'.$x.'/')) {
        createAWSFolder('tiles/'.$t.'/'.$zoom.'/'.$x.'/');
    }

    // replace template variables in path
    $path = str_replace(['{x}', '{y}', '{z}'], [$x, $y, $zoom], $path);

    $image = file_get_contents($path);

    if ($image) {
        saveToAWS('tiles/terrain/'.$zoom.'/'.$x, $y.'.png', 'image/png', $image);
        /*$save = fopen('./'.$t.'/'.$zoom.'/'.$x.'/'.$y.'.png', 'w');
        fwrite($save, $image);
        fclose($save);*/
    }

    header('Access-Control-Allow-Origin: *');
    header('Content-type: image/png');
    #header('Expires: '.date('D, d M Y H:i:s \G\M\T', strtotime('+30 days')))
    #header('Cache-Control: max-age=2592000');
    echo $image;
}

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
?>