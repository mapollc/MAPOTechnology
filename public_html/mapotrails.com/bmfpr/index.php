<?
session_start();

$key = array(
    /*array('title' => 'Potential Wilderness', 'color' => '#f7b90c', 'layer' => ''),
    array('title' => 'Existing Wilderness', 'color' => '#64bb38', 'layer' => 'wild'),
    array('title' => 'Preliminary Administratively Recommended Wilderness Area', 'color' => '#efc941', 'layer' => 'parwa'),
    array('title' => 'Wilderness Study Area', 'color' => '#267300', 'layer' => 'wsa'),
    array('title' => 'Geologic Area', 'color' => '#ffbfe8', 'layer' => 'geo'),
    array('title' => 'Historic Area', 'color' => '#00ffff', 'layer' => 'hist'),
    array('title' => 'Scenic Area', 'color' => '#bfe8ff', 'layer' => 'scenic'),
    array('title' => 'Starkey Experimental Forest/Range', 'color' => '#91a8ff', 'layer' => 'stark'),
    array('title' => 'Backcountry (Non-Motorized Use)', 'color' => '#c0d935', 'layer' => 'bcnm'),
    array('title' => 'Backcountry (Motorized Use)', 'color' => '#ffff00', 'layer' => 'bcm'),
    array('title' => 'General Forest', 'color' => '#b0946b', 'layer' => 'gf'),*/
    array('title' => 'Existing Wilderness', 'color' => '#77b46e', 'layer' => ''),
    array('title' => 'Wild & Scenic River', 'color' => '#004da8', 'layer' => 'sr'),
    array('title' => 'Proposed Wild & Scenic River', 'color' => '#97dcf2', 'border' => '#004da8', 'layer' => 'sr'),
    array('title' => 'Research & Natural Area', 'color' => '#aa66cd', 'layer' => ''),
    array('title' => 'Watershed', 'color' => '#00cccc', 'layer' => '')
);

if ($_GET['type'] == 'snow') {
    $winter = true;
}
?>
<!DOCTYPE html>
<html>

<head>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//kit.fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//api.mapbox.com">
    <link rel="preconnect" href="//mapbox.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <title><?=$winter ? 'Winter ' : ''?>Blue Mountains Forest Plan Revision Map - Wallowa-Whitman, Umatilla, & Malheur National Forests | Map of Trails</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="description" content="An interactive map displaying revision alternatives for the Blue Mountain forests of northeast Oregon, which includes the Malheur, Umatilla and Wallowa-Whitman National Forests.">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#00385c">
    <meta name="robots" content="index,follow">
    <meta property="og:title" content="<?=$winter ? 'Winter ' : ''?>Blue Mountains Forest Plan Revision Map - Wallowa-Whitman, Umatilla, & Malheur National Forests | Map of Trails">
    <meta property="og:description" content="An interactive <?=$winter ? 'winter ' : ''?>trail map displaying revision alternatives for the Blue Mountain forests of northeast Oregon, which includes the Malheur, Umatilla and Wallowa-Whitman National Forests.">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="<?=$winter ? 'Winter ' : ''?>Blue Mountains Forest Plan Revision Map">
    <meta property="og:url" content="https://www.mapotrails.com/<?=substr($_SERVER['REQUEST_URI'], 1)?>">
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/bmfpr_display.png">
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mt-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mt-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mt-favicon-16x16.png">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Roboto:wght@200;400;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mt-favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="//mapotechnology.com/assets/css/global.css">
    <link rel="stylesheet" href="//mapotrails.com/src/css/bmfpr/app.css">
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;600&family=Noto+Sans:wght@200;400&display=swap">
    </noscript>
    <link rel="canonical" href="<?='https://'.$_SERVER['HTTP_HOST'].'/'.substr($_SERVER['REQUEST_URI'], 1)?>" />
    <link rel="shortlink" href="<?echo 'https://'.$_SERVER['HTTP_HOST'].'/'.substr($_SERVER['SCRIPT_NAME'], 1); if ($_GET){ echo '?'; foreach($_GET as $a => $b) { $cccc .= $a.'='.$b.'&'; } echo substr($cccc, 0, -1); }?>" />
</head>

<body>

    <div id="map"></div>
    <div class="logo"><a href="./about"><img title="Map of Trails" title="Map of Trails logo" src="https://www.mapotechnology.com/assets/images/mapotrails_logo.png">
    <img title="Map of Trails" title="Map of Trails logo" src="https://www.mapotechnology.com/assets/images/mapotrails_icon_transparent.png"></a></div>
    <select id="basemap"><option value="mapo">MAPO Outdoors</option><option value="fs16">USFS 2016</option></select>
    <div id="legend" title="Legend">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="20" height="20">
            <path d="M288 0c-8.5 0-17 1.7-24.8 5.1L53.9 94.8C40.6 100.5 32 113.5 32 128s8.6 27.5 21.9 33.2l209.3 89.7c7.8 3.4 16.3 5.1 24.8 5.1s17-1.7 24.8-5.1l209.3-89.7c13.3-5.7 21.9-18.8 21.9-33.2s-8.6-27.5-21.9-33.2L312.8 5.1C305 1.7 296.5 0 288 0zm-5.9 49.2C284 48.4 286 48 288 48s4 .4 5.9 1.2L477.7 128 293.9 206.8c-1.9 .8-3.9 1.2-5.9 1.2s-4-.4-5.9-1.2L98.3 128 282.1 49.2zM53.9 222.8C40.6 228.5 32 241.5 32 256s8.6 27.5 21.9 33.2l209.3 89.7c7.8 3.4 16.3 5.1 24.8 5.1s17-1.7 24.8-5.1l209.3-89.7c13.3-5.7 21.9-18.8 21.9-33.2s-8.6-27.5-21.9-33.2l-31.2-13.4L430 235.5 477.7 256 293.9 334.8c-1.9 .8-3.9 1.2-5.9 1.2s-4-.4-5.9-1.2L98.3 256 146 235.5 85.1 209.4 53.9 222.8zm0 128C40.6 356.5 32 369.5 32 384s8.6 27.5 21.9 33.2l209.3 89.7c7.8 3.4 16.3 5.1 24.8 5.1s17-1.7 24.8-5.1l209.3-89.7c13.3-5.7 21.9-18.8 21.9-33.2s-8.6-27.5-21.9-33.2l-31.2-13.4L430 363.5 477.7 384 293.9 462.8c-1.9 .8-3.9 1.2-5.9 1.2s-4-.4-5.9-1.2L98.3 384 146 363.5 85.1 337.4 53.9 350.8z" />
        </svg>
    </div>

    <div class="panel">
        <span id="panelClose">&times;</span>
        <h1><?=$winter ? 'Winter ' : ''?>Blue Mountains Forest Plan Revision&mdash;Hypothetical Draft</h1>
        <? for ($i = 0; $i < count($key); $i++) { ?>
            <div class="i">
                <div class="k" title="<?= $key[$i]['title'] ?>" style="min-width:26px;height:18px;border-radius:2px;background-color:<?=$key[$i]['color'].($key[$i]['border'] ? ';border:1px solid '.$key[$i]['border'] : '')?>"></div>
                <span style="line-height:1.2;font-size:14px"><?= $key[$i]['title'] ?></span>
            </div>
        <? } if ($winter) {?>

        <?}else{?>
        <div class="i">
            <div class="k" style="min-width:26px;height:4px;border-top:4px solid #cb2626"></div>
            <span style="line-height:1.2;font-size:14px">Single Track</span>
        </div>
        <div class="i">
            <div class="k" style="min-width:26px;height:4px;border-top:4px solid #7c0c7c"></div>
            <span style="line-height:1.2;font-size:14px">ATV</span>
        </div>
        <div class="i">
            <div class="k" style="min-width:26px;height:4px;border-top:4px solid #777"></div>
            <span style="line-height:1.2;font-size:14px">Gravel</span>
        </div>
        <?}?>
        <div class="i">
            <div class="k" style="min-width:26px;height:4px;border-top:4px solid black"></div>
            <span style="line-height:1.2;font-size:14px">USFS Road (Motorized)</span>
        </div>
        <div class="i">
            <div class="k" style="min-width:26px;height:4px;border-top:4px dashed red"></div>
            <span style="line-height:1.2;font-size:14px">USFS Road (Non-Motorized)</span>
        </div>
        <?/*<div class="i">
            <div class="k" style="min-width:26px;height:18px;background:url(//cdn.mapotrails.com/bmfpr/stripes.png)"></div>
            <span style="line-height:1.2;font-size:14px">Inventoried Roadless Area</span>
        </div>*/?>

        <p style="line-height:1.2;margin-top:.5em;font-size:12px"><b>DISCLAIMER:</b> This map is only a draft utilizing current GIS data for the U.S. Forest Service regarding the Blue Mountains Forest Plan Revision. <a href="https://www.fs.usda.gov/detail/umatilla/home/?cid=fseprd1066821" target="blank">More details</a>.</p>

        <a class="btn btn-yellow centered" style="font-family:roboto" href="blue-mountains-forest-plan-revision/about">About this project</a>
    </div>

    <script async src="//mapotrails.com/src/js/bmfpr/app.js"></script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-4KN1GPWFWM"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4KN1GPWFWM');</script>
</body>

</html>