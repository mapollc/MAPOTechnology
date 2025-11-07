<?
if (isset($_GET['wfid']) && !isset($_GET['firestate']) && isset($_GET['name'])) {
    header('Location: '.$baseURL);
    exit();
}

if (unserialize($_SESSION['settings'])['center'] != null) {
    $settings = unserialize($_SESSION['settings']);
} else {
    $settings = array('center' => array(45.05606124274415, -117.75695800781251),
                    'zoom' => 7,
                    'tile' => 'terrain',
                    'perimeters' => array('minSize' => 500, 'color' => 'default', 'zoom' => 1),
                    'saveFreq' => 30000);
}

if (!isset($_SESSION['uid'])) {
    $userText = 'Login';
    $userLink = 'secure/login?src=mapofire&next='.urlencode('https://www.mapofire.com'.$_SERVER['REQUEST_URI']);
} else {
    $userText = 'Account';
    $userLink = 'account/home?ref=incident';
}

$agencies = [
    'US Forest Service' => 'USFS',
    'Bureau of Land Management' => 'BLM',
    'Bureau of Indian Affairs' => 'BIA',
    'National Park Service' => 'NPS',
    'Bureau of Reclamation' => 'BOR',
    'US Fish & Wildlife Service' => 'USFWS',
    'Oregon Department of Forestry' => 'ODF',
    'Department of Natural Resources' => 'DNR',
    'Idaho Department of Lands' => 'IDL',
    'California Department of Forestry & Fire Protection' => 'CAL FIRE',
    'California Department of Forestry and Fire Protection' => 'CAL FIRE',
    'Arizona Department of Forestry and Fire Management' => 'Arizona DFFM'
];

function sizing($a, $w = null) {
    global $settings;

    if (!$settings['acres'] || $settings['acres'] == 'acres') {
        $d = 'Acres';
    } else if ($settings['acres'] == 'hectacres') {
        $a /= 2.471;
        $d = 'Hectacres';
    } else if ($settings['acres'] == 'sqmi') {
        $a /= 640;
        $d = 'Square Miles';
    } else if ($settings['acres'] == 'sqkm') {
        $a /= 247.1;
        $d = 'Square Km.';
    }

    return ($w == 1 ? $d : (!$settings['acres'] || $settings['acres'] == 'acres' ? numberFormat($a) : number_format($a, 2)));
}

function numberFormat($n) {
    $e = explode('.', $n);
    $n = number_format($e[0], 0, '.', ',');
    return $n.(count($e) > 1 ? '.'.$e[1] : '');
}

function stringCase($string) {
    return preg_replace_callback('/(\-|\/)([a-z])/', function($m) { return strtoupper($m[0]); }, ucwords(strtolower($string)));
}

function fireName($n, $t, $i) {
    $s = explode('-', $i);
    
    if ($t == 'Prescribed Fire') {
        $o = (strpos($n, 'RX') === true ? $n : $n.' RX');
    } else if ($t == 'Smoke Check') {
        $o = 'Smoke Check #'.ltrim(strval($s[2]), '0');
    } else {
        $o = (!$n ? '' : rtrim(($n == '' ? 'Incident #' + intval($s[2]) :stringCase($n)), ' ').' Fire');
    }
    return $o;
}

function getStatus($s, $n) {
    return ($s == null ? (strpos($n, 'contain') === true ? 'contained' : (strpos($n, 'control') === true ? 'controlled' : 'active')) : ($s->Out ? 'out' : ($s->Control ? 'controlled' : ($s->Contain ? 'contained' : ''))));
}

function incidentDetails($arr) {
    $o = '';
    for ($i = 0; $i < count($arr); $i++) {
        $o .= ($i % 2 == 0 ? '<div class="row">' : '').'<div class="col w-'.($i % 2 == 0 && $i == count($arr) - 1 ? '12' :'6').'"><div class="title">'.$arr[$i]->desc.'</div><div class="desc">'.$arr[$i]->info.'</div></div>'.($i % 2 != 0 || $i == count($arr) - 1 ? '</div>' : '');
    }
    return $o;
}

$term[] = 'The status of a wildfire suppression action signifying that a control line has been completed around the fire, and any associated spot fires, which can reasonably be expected to stop the fire’s spread.';
$term[] = 'The completion of control line around a fire, any spot fires therefrom, and any interior islands to be saved; burned out any unburned area adjacent to the fire side of the control lines; and cool down all hot spots that are immediate threats to the control line, until the lines can reasonably be expected to hold under the foreseeable conditions.';
$term[] = 'The wildfire is fully supressed, out, and no further heat and smoke is detected.';

$fire = json_decode(file_get_contents('https://api.mapotechnology.com/v1/wildfires/incident?key=50e2c43f8f63ff0ed20127ee2487f15e&wfid='.$_GET['wfid']))->fire;
#$fire = json_decode(file_get_contents('./data.json'))->fire;
date_default_timezone_set($fire->time->timezone);
$fireName = fireName($fire->properties->fireName, $fire->properties->type, $fire->properties->incidentId);
$dispatch = $fire->protection->dispatch;
$agency = $fire->protection;
$acres = ($fire->properties->acres == 'Unknown' || $fire->properties->acres == '' ? 'Unknown' : sizing($fire->properties->acres));
$status = ($fire->time->year < date('Y') ? 'out' : getStatus($fire->properties->status, $fire->properties->notes));
$status = ($status ? $status : 'active');
$gloss = $term[($status == 'contained' ? 0 : ($status == 'controlled' ? 1 : 2))];
$abbr = $agency->agency;
$near = $fire->geometry->near;
$en = explode(', ', $near);
$geolocation = $en[0].', '.convertState($en[1], 1);

if ($agency->agency != 'US Forest Service') {
    $abbr = $agencies[$agency->agency];
}

if ($fire->inciweb->photo->url) {
    $photo = 'https://www.mapofire.com/src/images/incident?path='.$fire->inciweb->photo->url;
}

$bkdispatch = substr($agency->dispatch, 0, 2).'-'.substr($agency->dispatch, 2, strlen($agency->dispatch));
$center = mysqli_fetch_assoc(mysqli_query($con, "SELECT agency, name, cad_update, location, website, phone FROM dispatch_centers WHERE agency = '$agency->dispatch' OR agency = '$bkdispatch'"));
mysqli_close($con);

$juris = '<b>'.strtoupper($fire->properties->type).'</b> reported in '.convertState($fire->properties->fireState, 1) . ($dispatch == '' || ($dispatch == 'MAPO' && $agency->agency == '') ? ', by National Interagency Fire Center' : ($agency->area ? ', <span style="line-height:1.5;border-bottom:1px dotted #333;cursor:help" title="'.$agency->agency.' - '.$agency->area.' ('.$agency->unit.')'.'">'.
        ($abbr ? $abbr.' ' : '').$agency->area.'</span>' : ($agency->unit == 'NWCG' ? ', by NWCG/Inciweb' : '')));
$agLogo = ($agency->logo || $dispatch == 'CAL FIRE' ? '<img style="width:50px" src="https://d3kcsn1y1fg3m9.cloudfront.net/fire/images/agency_'.($agency->logo ? $agency->logo : ($dispatch == 'CAL FIRE' ? 'calfire' : '')).'_logo.png" alt="'.$agency->agency.' - '.$agency->area.' ('.$agency->unit.')'.'" title="'.$agency->agency.' - '.$agency->area.' ('.$agency->unit.')'.'">' : '');

$title = $fireName.' near '.explode(' of ', $near)[1].' - Current Incident Information and Wildfire Map - MAP-o-Fire';
$desc = 'The '.$fireName.' is located '.$geolocation.' and is currently considered '.$status.' after starting '.ago($fire->time->discovered).'. The '.strtolower($fire->properties->type).' is reported to be '.$acres.' acres at '.date('g:i A T \o\n D, M j, Y', ($fire->time->updated ? $fire->time->updated : $fire->time->captured)).'.';
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$title?></title>
    <link rel="preconnect" href="//server.arcgisonline.com">
    <link rel="preconnect" href="//unpkg.com">
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//arcgis.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <link rel="preconnect" href="//googletagmanager.com">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?>">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Map-o-Fire">
    <meta property="og:url" content="https://www.mapofire.com<?=$_SERVER['REQUEST_URI']?>">
    <meta property="og:image" content="<?=($photo ? $photo : 'https://www.mapotechnology.com/assets/images/mapofire_logo_square.png')?>">
    <meta property="og:image:alt" content="<?=($fire->inciweb->photo->caption ? $fire->inciweb->photo->caption : 'MAPO LLC')?>">
    <meta property="article:published_time" content="<?=date('c', $fire->time->captured)?>">
    <meta property="article:modified_time" content="<?=date('c', $fire->time->updated)?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://www.mapofire.com<?=$_SERVER['REQUEST_URI']?>">
    <meta property="twitter:title" content="<?=$title?>">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="<?=($photo ? $photo : 'https://www.mapotechnology.com/assets/images/mapofire_logo_square.png')?>">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <meta name="robots" content="index,follow">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <script async defer src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" media="print" onload="this.onload=null;this.removeAttribute('media');">
    <link rel="stylesheet" href="<?=$baseUrl?>src/css/incident-<?=$version?>.css?<?=time()?>">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
    <link rel="canonical" href="https://www.mapofire.com<?=$_SERVER['REQUEST_URI']?>" />
    <link rel="shortlink" href="<?=$baseUrl?>incident.php?<?=$_SERVER['QUERY_STRING']?>" />
</head>
<body>

<header>
    <div class="container">
        <div class="options">
            <div style="display:flex;align-items:center;gap:15px">
                <i class="fat fa-arrow-left" id="rtm" style="color:#fff;font-size:22px;cursor:pointer"></i>
                <a href="https://www.mapofire.com"><img src="https://www.mapotechnology.com/assets/images/mapofire_logo_transparent.png" alt="Map-o-Fire logo" title="Map-o-Fire logo" style="outline:none;width:143.94px;height:38px"></a>
            </div>
            <ul class="menu">
                <!--<li><a href="#" id="rtm" onclick="return false">< Map</a></li>-->
                <li><a href="https://www.mapotechnology.com/<?=$userLink?>"><?=$userText?></a></li>
            </ul>
        </div>
    </div>
</header>

<?if($fire->time->year < date('Y')){?>
<div class="alert">
    <div class="container">
        This <?=strtolower($fire->properties->type)?> is no longer active and has been archived.
    </div>
</div>
<?}?>

<article class="top">
    <div class="container">
        <div id="notifications" class="col w-12 wwa" style="display:none"></div>
        <!-- title & heading -->
        <div class="row align-items-center heading">
            <div class="col w-6">
                <div class="row align-items-center">
                    <?if(isset($_SESSION['uid'])) {?>
                    <div class="col">
                        <a target="blank" href="https://www.mapotechnology.com/account/admin/wildfires/edit?wfid=<?=$_GET['wfid']?>"><i class="far fa-pen-to-square" aria-hidden="true"></i></a>
                    </div>
                    <?}?>
                    <div class="col">
                        <h1><?=$fireName?></h1>
                        <span id="coords"><?=round($fire->geometry->lat, 4).', '.round($fire->geometry->lon, 4)?></span>
                    </div>
                </div>
            </div>
            <div class="col w-6">
                <div id="juris" class="row align-items-center justify-content-right">
                    <div class="col">
                        <?=$juris?>
                    </div>
                    <?if($agLogo){?>
                    <div class="col">
                        <?=$agLogo?>
                    </div>
                    <?}?>
                </div>
            </div>
        </div>

        <!-- quick facts and basics -->
        <div id="quick" class="row justify-content-center align-items-center" style="margin:30px 0">
            <div class="col w-3">
                <span>STATUS</span><div class="val" style="font-size:unset"><span class="status <?=strtolower($status)?>" title="<?=$gloss?>"><?=$status?></span></div>
            </div>
            <div class="col w-3">
                <span>SIZE</span><div class="val" style="color:var(--red)"><?=$acres?><span style="color:rgb(237 37 78 / 80%);font-weight:300;font-size:16px;padding-left:5px"><?=($acres != 'Unknown' ? sizing(null, 1) : '')?></span></div>
            </div>
            <div class="col w-3">
                <span>CONTAINMENT</span><div id="cntmt" class="val" style="font-weight:600<?=($fire->properties->containment == '100%' ? ';color:var(--green)' : '')?>"><?=$fire->properties->containment?></div>              
            </div>
            <div class="col w-3">
                <span>AIR QUALITY</span><div id="airq" class="val">--</div>              
            </div>
            <?/*<div class="col w-3">
                <span>DROUGHT</span><div id="drought" class="val">--</div>              
            </div>*/?>
        </div>

        <div class="row align-items-center meta">
            <div class="col w-4" style="text-align:center">
                <b>Last updated:</b> <?=ago($fire->time->updated)?>
            </div>
            <div class="col w-4" style="text-align:center">
                <b>Reported:</b> <?=(time() - $fire->time->discovered > 15768000 ? date('D, M j, Y \a\t g:i A', $fire->time->discovered) : ago($fire->time->discovered))?>
            </div>
            <div class="col w-4" style="text-align:center">
                <b>Incident #:</b> <?=$fire->properties->incidentId?>
            </div>
        </div>
    </div>
</article>

<div id="map" data-lat="<?=$fire->geometry->lat?>" data-lon="<?=$fire->geometry->lon?>"></div>

<article>
    <div class="container">
        <?if($photo){
            echo '<div class="photo" title="'.($fire->inciweb->photo->caption ? $fire->inciweb->photo->caption : 'Incident image').'" onclick="window.open(\''.$photo.'\')" style="background-image:url('.$photo.'&small=1)"></div>';
        }?>
        <!-- fire details -->
        <div class="fire-details">
            <div class="wrapper">
                <div class="row">
                    <div class="col w-6">
                        <div class="ic"><i class="fas fa-location-dot"></i></div>
                        <div class="title">Initial Location</div>
                        <div class="desc"><?=$near?></div>
                    </div>
                    <div class="col w-6">
                        <div class="ic"><i class="fas fa-tower-observation"></i></div>
                        <div class="title">Jurisdiction</div>
                        <div class="desc"><?=(!$agency->agency && !$agency->unit ? 'Unknown' : ($agency->agency ? $agency->agency : '').($agency->area ? ($agency->agency ? ' &mdash; ' : '').$agency->area : ''))?></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col w-6">
                        <div class="ic"><i class="fal fa-notes"></i></div>
                        <div class="title">Dispatch Notes</div>
                        <div class="desc"><?=($fire->properties->notes ? $fire->properties->notes : 'N/A')?></div>
                    </div>
                    <div class="col w-6">
                        <div class="ic"><i class="fad fa-trees"></i></div>
                        <div class="title">Fuels</div>
                        <div class="desc"><?=($fire->properties->fuels ? $fire->properties->fuels : 'None specified')?></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col w-6">
                        <div class="ic"><i class="fal fa-sensor-triangle-exclamation"></i></div>
                        <div class="title">Assigned Resources</div>
                        <div class="desc"><?=($fire->properties->resources ? $fire->properties->resources : 'N/A')?></div>
                    </div>
                    <?
                    if ($status != null && ($fire->properties->status->Contain || $fire->properties->status->Control || $fire->properties->status->Out)/* && hasPermission(user, actions.PREMIUM_DATA)*/) {?>
                    <div class="col w-6">
                        <div class="ic"><i class="fad fa-chart-line"></i></div>
                        <div class="title">Fire Status</div>
                        <div class="desc">
                            <div class="fs">
                            <?if($fire->properties->status->Contain) {
                                echo '<p><span style="color:var(--blue);font-weight:400">Contained:</span> '.date('M j, Y \a\t g:i A T', $fire->properties->status->Contain).'</p>';
                            }
                            if($fire->properties->status->Control) {
                                echo '<p><span style="color:var(--blue);font-weight:400">Controlled:</span> '.date('M j, Y \a\t g:i A T', $fire->properties->status->Control).'</p>';
                            }
                            if($fire->properties->status->Out) {
                                echo '<p><span style="color:var(--blue);font-weight:400">Out:</span> '.date('M j, Y \a\t g:i A T', $fire->properties->status->Out).'</p>';
                            }?>
                            </div>
                        </div>
                    </div>
                    <?}?>
                </div>
            </div>
        </div>

        <!-- wx -->
        <div class="row no-wrap">
            <div class="col w-6">
                <div class="fire-details m-0">
                    <h2 class="title">Nearby Weather Conditions</h2>
                    <div id="curwx" class="wrapper">
                        <div class="row align-items-center">
                            <div class="col w-4">
                                <i class="fal fa-temperature-high"></i>
                                <span class="var">Temperature</span>
                                <div id="a" class="placeholder" style="width:43px;height:27px"></div>
                            </div>
                            <div class="col w-4">
                                <i class="fal fa-droplet-percent"></i>
                                <span class="var">Humidity</span>
                                <div id="b" class="placeholder" style="width:43px;height:27px"></div>
                            </div>
                            <div class="col w-4">
                                <i class="fal fa-wind"></i>
                                <span class="var">Wind</span>
                                <div id="c" class="placeholder" style="width:86px;height:27px"></div>
                            </div>
                        </div>

                        <p id="d" class="placeholder updated" style="width:180px;height:17px"></p>
                    </div>
                </div>
            </div>
            <div class="col w-6">
                <div class="fire-details m-0">
                    <h2 class="title">24-hr Forecast Concerns</h2>
                    <div id="wxcon" class="wrapper">
                        <div class="row align-items-center">
                            <div class="col w-3">
                                <i class="fal fa-temperature-high"></i>
                                <span class="var">Max Temp</span>
                                <div id="e" class="placeholder" style="width:43px;height:27px"></div>
                            </div>
                            <div class="col w-3">
                                <i class="fal fa-droplet-percent"></i>
                                <span class="var">Min Humidity</span>
                                <div id="f" class="placeholder" style="width:43px;height:27px"></div>
                            </div>
                            <div class="col w-3">
                                <i class="fal fa-wind"></i>
                                <span class="var">Avg Wind Speed</span>
                                <div id="g" class="placeholder" style="width:86px;height:27px"></div>
                            </div>
                            <div class="col w-3">
                                <i class="fal fa-windsock"></i>
                                <span class="var">Max Wind Speed</span>
                                <div id="h" class="placeholder" style="width:86px;height:27px"></div>
                            </div>
                        </div>

                        <p id="i" class="placeholder updated" style="width:180px;height:17px"></p>
                    </div>
                </div>
            </div>
        </div>

        <? // inciweb
        if($fire->inciweb){
            if ($fire->inciweb->incident_info) {?>
                <div class="fire-details">
                    <h2 class="title">Incident Overview</h2>
                    <div class="wrapper">
                        <?=$fire->inciweb->incident_info?>
                    </div>
                </div>
            <?}?>

            <div class="inciweb">
            <?foreach ($fire->inciweb->current->data as $t => $v) {?>
                <div class="fire-details">
                    <h2 class="title"><?=$t?></h2>
                    <div class="wrapper">
                        <?=incidentDetails($v)?>
                    </div>
                </div>
            <?}
            /*if ($fire->inciweb->contacts->contact || $fire->inciweb->contacts->pio) {?>
                <div class="fire-details">
                    <h2 class="title">Incident Contact</h2>
                    <div class="wrapper">
                        <div class="row">
                        <div class="col w-6">
                                <?=$fire->inciweb->contacts->contact?>
                            </div>
                            <div class="col w-6">
                                <?=$fire->inciweb->contacts->pio?>
                            </div>
                        </div>
                    </div>
                </div>
            <?}*/?>
            </div>
        <?}?>

        <? //dispatch
        if ($center) {?>
        <div class="fire-details">
            <h2 class="title">Dispatch Center</h2>
            <div class="wrapper">
                <p><b><?=$center['name'].' ('.$center['agency'].')</b><br>'.$center['location'].($center['phone'] && $center['phone'] != '0' ? '<br>'.$center['phone'] : '').
                ($center['website'] ? '<br><a class="responsive" target="blank" href="'.$center['website'].'">'.$center['website'].'</a>' : '').'</p>'.
                '<p class="updated" style="text-align:left">'.$center['agency'].' data last sent '.ago($center['cad_update'])?></p>
            </div>
        </div>
        <?}?>

        <p style="font-size:12px;color:#999;text-align:center;line-height:1.3">This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.</p>

    <!-- end container -->
    </div>
</article>

<footer>
    <div class="container">
        <div class="row">
            <div class="col w-6">&copy; <?=date('Y')?> MAPO LLC</div>
            <div class="col w-6">
                <ul class="footer-menu">
                    <li><a href="https://www.facebook.com/mapotechnology"><i class="fab fa-facebook-f"></i></a></li>
                    <li><a href="https://www.mapotechnology.com/about">About</a></li>
                    <li><a href="https://www.mapotechnology.com/about/contact">Contact</a></li>
                    <li><a href="https://www.mapotechnology.com/checkout">Donate</a></li>
                    <li><a href="https://www.mapotechnology.com/about/legal/terms">Terms</a></li>
                    <li><a href="https://www.mapotechnology.com/about/legal/privacy">Privacy</a></li>
                </ul>
            </div>
        </div>
    </div>
</footer>

<script>var settings = <?=json_encode($settings)?>, y = <?=$fire->time->year?>, fn = "<?=$fire->properties->fireName?>", uqid = '<?=$fire->properties->incidentId?>', t = '<?=$fire->properties->type?>', d = <?=$fire->time->discovered?>, u = <?=$fire->time->updated?>, ac = '<?=$fire->properties->acres?>', status = <?=($fire->properties->status->Contain||$fire->properties->status->Control||$fire->properties->status->Out ? json_encode($fire->properties->status) : "'".$fire->properties->status."'")?>, notes = '<?=$fire->properties->notes?>';window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X03WWLX3BJ');</script>
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="<?=$baseUrl?>src/js/utilities-1.0.js"></script>
<script async src="<?=$baseUrl?>src/js/incident-<?=$version?>.js?<?=time()?>"></script>
<script defer src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>

</body>
</html>