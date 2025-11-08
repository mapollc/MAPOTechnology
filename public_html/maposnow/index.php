<?
/*$json = '{"features":[{"geometry":{"coordinates":[[[-118.22456359863283,45.71001523943372],[-118.1957244873047,45.689393890931],[-118.14285278320314,45.679799974696635],[-118.06251525878906,45.691792112909965],[-117.98492431640626,45.73014967964109],[-117.9265594482422,45.784763729573555],[-117.90939331054689,45.845542755655856],[-117.91351318359376,45.8981323978714],[-117.93617248535156,45.931095049650004],[-117.98767089843751,45.9349155397806],[-118.05908203125001,45.91437731081978],[-118.15589904785158,45.87471224890479],[-118.20808410644533,45.823535967372486],[-118.23280334472656,45.76800194433285],[-118.2341766357422,45.73014967964109],[-118.22387695312501,45.70905627558719],[-118.22456359863283,45.71001523943372]]],"type":"Polygon"},"id":"07b48108-bb8d-49cc-8fcd-3339f17f501a","type":"Feature","properties":{"stroke-opacity":1,"description":"","stroke-width":2,"title":"","fill":"#FF0000","stroke":"#FF0000","fill-opacity":0.1,"class":"Shape","folderId":null}}],"type":"FeatureCollection"}';

$json = json_decode($json)->features[0]->geometry->coordinates[0];

foreach ($json as $a) {
    $c[] = array('lat' => $a[1], 'lng' => $a[0]);
}

echo serialize($c);

exit();*/
ini_set('display_errors', 0);
session_start();
date_default_timezone_set('UTC');

if (date('H') > 20 || date('H') <= 2) {
    $fmt = date('Ymd', strtotime('-1 day')).'18';
} else if (date('H') > 2 && date('H') <= 8) {
    $fmt = date('Ymd', strtotime('-1 day')).'00';
} else if (date('H') > 8 && date('H') <= 14) {
    $fmt = date('Ymd', strtotime('-1 day')).'06';
} else {
    $fmt = date('Ymd', strtotime('-1 day')).'12';
}

date_default_timezone_set('America/Los_Angeles');

$settings = array('state' => $_GET['state'], 'dashboard' => $_GET['dashboard']);

include_once('../db.ini.php');
$sql = mysqli_query($con, "SELECT * FROM snow_dashboards WHERE active = 1 ORDER BY state ASC, dashboard ASC");
mysqli_close($con);

while ($row = mysqli_fetch_assoc($sql)) {
    $set = unserialize($row['settings']);
    $geo = array('lat' => $set['lat'], 'lng' => $set['lng'], 'z' => $set['z']);
    $dashboards[] = array('id' => $row['id'], 'state' => $row['state'], 'long_state' => $set['long_state'], 'dashboard' => $row['dashboard'], 'name' => $row['name'], 'wfo' => $set['wfo'], 'geo' => $geo, 'shape' => $set['geo']);
}

if (date('H') < 11) {
    $days = array('Today', 'Tonight', date('l', strtotime('+1 day')));
} else if (date('H') < 16) {
    $days = array('This Evening', 'Tomorrow', date('l', strtotime('+1 day')));
} else {
    $days = array('Tonight', date('l', strtotime('+1 day')), date('l', strtotime('+1 day')).' Night');
}

if (!isset($_SESSION['uid'])) {
    $acctLink = 'https://www.mapotechnology.com/secure/login?next='.urlencode($_SERVER['REQUEST_URI']);
} else {
    $acctLink = 'https://www.mapotechnology.com/account/home';
}

foreach($dashboards as $d) {
    if ($d['state'] == $_GET['state'] && $d['dashboard'] == $_GET['dashboard']) {
        $dashboard = $d;
    }
}

// if dashboard doesn't exist, redirect to the main listing of all dashboards
if (!$dashboard) {
    header('Location: ../../map');
}
?>
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//api.mapbox.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title><?=$dashboard['name']?> in <?=$dashboard['long_state']?> - Winter Recreation & Snow Dashboard - Map-o-Snow</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="description" content="">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#3b5b72" />
    <meta name="robots" content="noindex,nofollow">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css' rel='stylesheet' />
    <script src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link href="../../style.css" rel="stylesheet">
    <link rel="canonical" href="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'].'?'.$_SERVER['QUERY_STRING']?>" />
    <link rel="shortlink" href="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>" />
</head>
<body>

<header>
    <div class="container">
        <div class="head">
            <a href="https://www.mapotechnology.com"><img class="logo" src="https://www.mapotechnology.com/assets/images/mapo_logo_transparent.png"></a>
            <div>
                <a href="<?=$acctLink?>"><i class="fa<?=($_SESSION['uid'] ? 's' : 't')?> fa-circle-user" style="margin-right:5px"></i> <?=($_SESSION['uid'] ? 'Hello, '.$_SESSION['first_name'] : 'Login')?></a>
                <?if($_SESSION['role'] == 'ADMIN'){?>
                &nbsp;&middot;&nbsp;<a href="https://www.mapotechnology.com/account/admin/snow/edit?id=<?=$dashboard['id']?>">edit</a>    
                <?}?>
            </div>
        </div>
    </div>
</header>

<main>
    <div class="container">
        <h1>Map-o-Snow Dashboard: <?=$dashboard['name'].' / '.$dashboard['long_state']?></h1>
        <div id="snotels" class="row c4"></div>

        <div class="row ls">
            <div class="col">
                <section class="card" style="margin-bottom:var(--spacing)">
                    <div class="body" style="margin-top:0;text-align:center" id="acc6">
                        <div class="placeholder" style="margin:0 auto;width:100%;max-width:620px;height:22px"></div>
                    </div>
                </section>

                <section class="card">
                    <h5>Freezing Level</h5>
                    <div class="body">
                        <canvas id="frzgchart" class="placeholder" style="width:100%;min-height:350px;height:375px"></canvas>
                    </div>
                </section>
            </div>
            <div class="col">
                <section class="card">
                    <h5>Nearby Webcams</h5>
                    <div class="body" id="webcams">
                        <div class="placeholder" style="width:200px;height:112px"></div>
                        <div class="placeholder" style="width:200px;height:112px"></div>
                        <div class="placeholder" style="width:200px;height:112px"></div>
                        <div class="placeholder" style="width:200px;height:112px"></div>
                    </div>
                </section>
            </div>
        </div>
        
        <h2>Snow Forecasting</h2>
        <div class="row c2">
            <div class="col">
                <section class="card">
                    <h5>24-hr Snow Probability</h5>
                    <div class="body">
                        <div class="table">
                            <div class="placeholder" style="width:100%;height:28px"></div>
                            <div class="placeholder" style="width:100%;height:28px"></div>
                            <div class="placeholder" style="width:100%;height:28px"></div>
                            <div class="placeholder" style="width:100%;height:28px"></div>
                            <div class="placeholder" style="width:100%;height:28px"></div>

                            <table id="sntable"></table>
                        </div>
                    </div>
                </section>
            </div>
            <div class="col">
                <div id="map" class="placeholder" style="width:100%;height:450px;border-radius:10px"></div>
            </div>
        </div>

        <h2>12-hr Snow Forecast Models</h2>
        <div class="row c3">
            <?for($i = 1; $i < 4; $i++) {?>
            <div class="col">
                <section class="card">
                    <h5><?=$days[$i - 1]?></h5>
                    <div class="body">
                        <a target="blank" href="https://www.pivotalweather.com/model.php?m=nam4km&p=snku_012h-imp&fh=<?=12*$i?>&r=us_nw">
                            <img style="width:100%" src="https://www.mapotechnology.com/maposnow/model.php?state=<?=$dashboard['state']?>&day=<?=$i?>">
                        </a>
                    </div>
                </section>
            </div>
            <?}?>
        </div>

        <div id="supp" class="row c2">
            <div class="col">
                <section class="card">
                    <h5>3-day Winter Impacts</h5>
                    <div class="body"></div>
                </section>
            </div>
            <div class="col">
                <section class="card">
                    <h5>Weather Alerts</h5>
                    <div class="body" data-alerts="0" id="wxalerts">There are no weather alerts in effect at this time.</div>
                </section>

                <section class="card">
                    <h5>Helpful Links</h5>
                    <div class="body">
                        <ul class="links">
                            <li><a href="http://www.pivotalweather.com/model.php?m=nam4km&p=snku_012h-imp&rh=<?=$fmt?>&fh=12&r=us_nw&dpdt=" target="blank">NAM4KM Snowfall</a></li>
                            <li><a href="https://a.atmos.washington.edu/~ovens/wxloop.cgi?wrfd1_ti_fzlc+///3" target="blank">WRF-GFS Snow Levels</a></li>
                            <li><a href="http://www.spc.noaa.gov/exper/href/index.php?model=href&product=snowfall_024h_mean&sector=nw&rd=<?=date('Ymd')?>" target="blank">HREFv2 Snowfall</a></li>
                            <li><a href="http://www.atmos.washington.edu/~ovens/wxloop.cgi?wrfd3_ti_or_snow3+///3" target="blank">WRF-GFS 3-hr Snowfall</a></li>
                            <li><a href="https://www.nohrsc.noaa.gov/interactive/html/map.html?var=ssm_depth&o11=1&extents=us&bgvar=dem" target="blank">Current US Snow Depth</a></li>
                            <li><a href="https://www.pivotalweather.com/maps.php?ds=nohrsc&p=nohrsc_seasnow&r=us_nw" target="blank">Year-to-date Snowfall</a></li>
                            <li><a href="https://www.nrcs.usda.gov/wps/portal/wcc/home/quicklinks/imap#version=125.1&elements=&networks=!&states=!&counties=!&hucs=&minElevation=&maxElevation=&elementSelectType=all&activeOnly=true&activeForecastPointsOnly=false&hucLabels=false&hucIdLabels=false&hucParameterLabels=true&stationLabels=&overlays=&hucOverlays=state&basinOpacity=75&basinNoDataOpacity=25&basemapOpacity=100&maskOpacity=0&mode=data&openSections=dataElement,parameter,date,basin,options,elements,location,networks,overlays&controlsOpen=false&popup=&popupMulti=&base=esriNgwm&displayType=station&basinType=6&dataElement=SNWD&depth=-8&parameter=OBS&frequency=DAILY&duration=I&customDuration=&dayPart=E&monthPart=E&forecastPubDay=1&forecastExceedance=50&seqColor=1&divColor=7&scaleType=D&scaleMin=&scaleMax=&referencePeriodType=POR&referenceBegin=1981&referenceEnd=2010&minimumYears=20&hucAssociations=true&relativeDate=-1&lat=43.651&lon=-113.207&zoom=5.3" target="blank">SNOTEL Data</a></li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    </div>
</main>

<footer>
    <div class="container">
        &copy; <?=date('Y')?> MAPO LLC
    </div>
</footer>

<script>let dashboards = <?=json_encode($dashboards)?>, settings = <?=json_encode($settings)?>;</script>
<script src='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js'></script>
<script async defer src="https://cdn.jsdelivr.net/npm/frappe-charts@1.2.4/dist/frappe-charts.min.iife.js"></script>
<script async defer src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="../../main.js"></script>

</body>
</html>