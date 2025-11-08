<?
function get_data($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json','version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch); 
   
    return $output;
}

if ($_GET['state'] == 'oregon'){
    $l = 0; $t = 225; $tz = 'P'.$tz.'T';
} else if($_GET['state'] == 'washington'){
    $l = 0; $t = 50; $tz = 'P'.$tz.'T';
} else if($_GET['state'] == 'idaho'){
    $l = 250; $t = 100; $tz = 'M'.$tz.'T'; $minus-=1;
} else if($_GET['state'] == 'california'){
    $region = 'sw'; $l = 0; $t = 80; $tz = 'P'.$tz.'T';
} else if($_GET['state'] == 'utah'){
    $region = 'sw'; $l = 450; $t = 50; $tz = 'M'.$tz.'T'; $minus-=1;
} else if($_GET['state'] == 'colorado'){
    $region = 'c'; $l = 0; $t = 150; $tz = 'M'.$tz.'T'; $minus-=1;
} else if($_GET['state'] == 'montana'){
    $l = 500; $t = 45; $tz = 'M'.$tz.'T';
} else if($_GET['state'] == 'wyoming'){
    $l = 500; $t = 240; $tz = 'M'.$tz.'T';
}

$json = json_decode(get_data('https://www.pivotalweather.com/latest_runs.php'));

$init = $json->nam4km->rh;
$time = ($_REQUEST['day'] == 1 ? '012' : ($_REQUEST['day'] == 2 ? '024' : '036'));

$data = get_data('https://m1o.pivotalweather.com/maps/models/nam4km/'.$init.'/'.$time.'/snku_012h-imp.us_nw.png');

$model = ImageCreateTrueColor(600, 453);
$image = ImageCreateFromString($data);

imagecopyresampled($model, $image, 0, 0, $l, $t, 1100, 850, 1100, 850);

header('Content-type: image/png');
imagepng($model);
?>