<?
ini_set('session.cookie_domain', '.mapotrails.com');
////ini_set('display_errors', 1);
////error_reporting(E_ALL);
session_start();

$trail_id = $_GET['tid'];
$category = $_GET['category'];

function format($text) {
    $o = '';
    preg_match_all('/<ul>(.*?)<\/ul>/si', $text, $out1);

    for ($i = 0; $i < count($out1[0]); $i++) {
        $text = str_replace($out1[0][$i], '{list'.$i.'}', $text);
    }

    $h = ['<em>','</em>','<strong>','</strong>'];
    $re = ['<i>','</i>','<b>','</b>'];

    for ($i = 0; $i < count($h); $i++) {
        $text = str_replace($h[$i], $re[$i], $text);
    }

    preg_match_all('/(.*)\s+/', $text.'
', $para);
    foreach($para[1] as $p) {
        $o .= '<p>'.trim($p).'</p>';
    }

    for ($i = 0; $i < count($out1[0]); $i++) {
        $o = preg_replace('/<p>\{list'.$i.'\}<\/p>/', $out1[0][$i], $o);
    }

    return $o;

    /*$o = $q = '';
    $string = str_replace('<p><p ', '<p ', 
    preg_replace('/<em>(.*?)<\/em>/', '<i style="font-size:17px">$1</i>', 
    preg_replace('/<strong>(.*?)<\/strong><br>/', '<p style="font-weight:600">$1</p>',
    preg_replace('/(.*?)<br><br>/', '<p>$1</p>',
    str_replace(array('<br> <li>', '<br></ul>'), array('<li>', '</ul>'), str_replace('
', '<br>', $t))))));

    preg_match_all('/<ul>(.*?)<\/ul>/', $string, $m);

    foreach ($m[1] as $a) {
        $string = str_replace($a, str_replace('<br>', '', $a), $string);
    }

    /*preg_match_all('/(.*?)<br><br>/', $string, $lines);
    preg_match_all('/<ul>(.*?)<\/ul>/', $string, $lists);

    foreach ($lines[1] as $l) {
        $o .= '<p>'.$l.'</p>';
    }

    foreach ($lists[1] as $l) {
        $q .= $l;
    }

    return $o.($q ? '<ul>'.$q.'</ul>' : '');*/
    /*if($t != strip_tags($t)) {
        return preg_replace('/<p><\/p>/', '', $string);
    } else {
        return '<p>'.$t.'</p>';
    }*/
}

function truncate($text, $length) {
    $length = abs((int)$length);
    $text = strip_tags($text);

    if (strlen($text) > $length) {
        $text = preg_replace("/^(.{1,$length})(\s.*|$)/s", '\\1...', $text);
    }

    return str_replace('....', '...', $text);
}

function truncate2($text) {
    $o = '';
    $e = explode('.', strip_tags($text));
    foreach ($e as $s) {
        if (strlen($o) < 160) {
            $o .= $s.'.';
        }
    }

    return $o;
}

function icon($t, $w) {
    $domain = 'https://www.mapotrails.com/';
    $ic = '';
    if (in_array('Hike', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Hike" onclick="window.location.href=\''.$domain.'guides/trail/hike\'" >' : '') . '<i class="fa-solid fa-person-hiking"style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Mountain Bike', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Mountain Bike" onclick="window.location.href=\''.$domain.'guides/trail/mountain-bike\'">' : '') . '<i class="fa-solid fa-person-biking" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Dirtbike', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Dirtbike" onclick="window.location.href=\''.$domain.'guides/trail/dirtbike\'">' : '') . '<i class="fa-solid fa-motorcycle" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('ATV', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="ATV" onclick="window.location.href=\''.$domain.'guides/trail/atv\'">' : '') . '<i class="fa-solid fa-truck-monster" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Gravel Bike', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Gravel Bike" onclick="window.location.href=\''.$domain.'guides/trail/gravel-bike\'">' : '') . '<i class="fa-solid fa-bicycle" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Nordic Ski', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Nordic Ski" onclick="window.location.href=\''.$domain.'guides/snow/nordic-ski\'">' : '') . '<i class="fa-solid fa-person-skiing-nordic" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Alpine Ski', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Alpine Ski" onclick="window.location.href=\''.$domain.'guides/snow/alpine-ski\'">' : '') . '<i class="fa-solid fa-person-skiing" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Backcountry Ski', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Backcountry Ski" onclick="window.location.href=\''.$domain.'guides/snow/backcountry-ski\'">' : '') . '<i class="fa-solid fa-person-skiing" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }
    if (in_array('Snowmobile', $t)) {
        $ic .= ($w == 1 ? '<div class="tag" title="Snowmobile" onclick="window.location.href=\''.$domain.'guides/snow/snowmobile\'">' : '') . '<i class="fa-solid fa-sleigh" style="margin-right:5px"></i>' . ($w == 1 ? '</div>' : '');
    }

    return $ic;
}

function wpIcon($i) {
    $icon = '';
    $t = 1;
    $color = '';

    switch ($i) {
        case '4x4':
            $icon = 'far fa-steering-wheel';
            $color = '#8a6a18';
            $t = 1;
            break;
        case 'big_air':
            $icon = 'fad fa-cards-blank';
            $color = '#962d89';
            $t = 1;
            break;
        case 'bigfoot':
            $icon = 'far fa-shoe-prints';
            $color = '#e55188';
            $t = 1;
            break;
        case 'bridge':
            $icon = 'far fa-bridge';
            $color = '#8a6a18';
            $t = 1;
            break;
        case 'cabin':
            $icon = 'fal fa-cabin';
            $color = '#8a6a18';
            $t = 1;
            break;
        case 'camp':
            $icon = 'fas fa-campground';
            $color = '#3e9d1f';
            $t = 1;
            break;
        case 'camp2':
            $icon = 'fas fa-campground';
            $color = '#3e9d1f';
            $t = 1;
            break;
        case 'caution':
            $icon = 'fad fa-diamond-exclamation';
            $color = '#eeff00';
            $t = 0;
            break;
        case 'fishing':
            $icon = 'far fa-fishing-rod';
            $color = '#004741';
            $t = 1;
            break;
        case 'hike':
            $icon = 'far fa-person-hiking';
            $color = '#24a7ff';
            break;
        case 'fantasy':
            $icon = 'far fa-wand-sparkles';
            $color = '#f48fb1';
            $t = 1;
            break;
        case 'gravel':
            $icon = 'fas fa-xmarks-lines';
            $color = '#a3a3a3';
            $t = 1;
            break;
        case 'info':
            $icon = 'fal fa-circle-info';
            $color = '#3875d7';
            $t = 1;
            break;
        case 'lake':
            $icon = 'far fa-water';
            $color = '#0f5fff';
            $t = 1;
            break;
        case 'media':
            $icon = 'fas fa-video';
            $color = '#51c3b5';
            $t = 1;
            break;
        case 'mtn_bike':
            $icon = 'fa-solid fa-person-biking-mountain';
            $color = '#15cf05';
            $t = 0;
            break;
        case 'parking':
            $icon = 'far fa-circle-parking';
            $color = '#874f28';
            break;
        case 'road':
            $icon = 'fas fa-road';
            $color = '#3a3a3a';
            $t = 1;
            break;
        case 'restroom':
            $icon = 'fas fa-sharp fa-restroom';
            $color = '#104daf';
            $t = 1;
            break;
        case 'river':
            $icon = 'far fa-water';
            $color = '#0f5fff';
            $t = 1;
            break;
        case 'sledding':
            $icon = 'far fa-person-sledding';
            $color = '#24ffd0';
            $t = 0;
            break;
        case 'ski':
            $icon = 'far fa-person-skiing';
            $color = '#24ffd0';
            $t = 0;
            break;
        case 'snowmobile':
            $icon = 'fas fa-person-snowmobiling';
            $color = '#f99d3e';
            $t = 1;
            break;
        case 'summit':
            $icon = 'far fa-mountains';
            $color = '#006625';
            $t = 1;
            break;
        case 'swim':
            $icon = 'fas fa-person-swimming';
            $color = '#007BDD';
            $t = 1;
            break;
        default:
            $icon = 'fal fa-circle-info';
            $color = '#3875d7';
            $t = 1;
            break;
    }

    return [$icon, $color, $t];
}

function ing($t) {
    return (substr($t, -1) == 'e' ? substr($t, 0, -1).'ing' : (substr($t, -1) == 'i' || substr($t, -1) == 'b' ? $t.'ing' : $t));
}

function comb($a) {
    if (count($a) == 1) {
        return ing($a[0]);
    } else if (count($a) == 2) {
        return ing($a[0]).' & '.ing($a[1]);
    } else {
        $b = '';
        for ($i = 0; $i < count($a); $i++) {
            $b .= ing($a[$i]).($i < count($a) - 1 ? ', '.($i == count($a) - 2 ? '& ' : '') : '');
        }
        return $b;
    }
}

function getUserRole($r) {
    switch($r) {
        case 1: $p = 'GUEST'; break;
        case 2: $p = 'PREMIUM'; break;
        case 3: $p = 'ADMIN'; break;
        case 4: $p = 'TRAIL MODERATOR'; break;
    }

    return $p;
}

function hasPermissions() {
    global $planID;
    global $premium;
    global $settings;

    if ($premium && $settings['user'] != null && $settings['user']['role'] == 'ADMIN') {
        return true;
    } else {
        if (!$premium) {
            return true;
        } else {
            foreach ($settings['user']['subscribe'] as $sub) {
                if ($planID == $sub['plan'] && $sub['active'] && $sub['ends'] > time()) {
                    return true;
                }
            }
            return false;
        }
    }
}

$settings = array('center' => array(45.05606124274415, -117.75695800781251), 'zoom' => 7, 'tile' => 'outdoors', 'category' => null, 'tid' => null, 'user' => null);

if (isset($_COOKIE['token'])) {
    $con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
    $token = mysqli_real_escape_string($con, $_COOKIE['token']);
    $now = time();
    $i = 0;
    $subscribe = null;

    $sql = mysqli_query($con, "SELECT u.uid, first_name, last_name, role, token, expires, settings, cid, subscription AS sid, plan, b.created, start, end, active FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid LEFT JOIN trail_settings AS ts ON ts.uid = u.uid LEFT JOIN billing AS b ON b.email = u.email WHERE s.token = '$token' AND expires > $now AND active = 1");
    while ($row = mysqli_fetch_assoc($sql)) {
        $subscribe[] = array('cid' => $row['cid'], 'sid' => $row['sid'], 'plan' => $row['plan'], 'created' => $row['created'], 'starts' => $row['start'],
                            'ends' => $row['end'], 'active' => ($row['active'] == 1 ? true : false));

        if ($i == 0) {
            $settings = json_decode($row['settings'], true);
            $user = array('uid' => $row['uid'], 'first_name' => $row['first_name'], 'last_name' => $row['last_name'], 'role' => getUserRole($row['role']),
                        'token' => $row['token'], 'expires' => $row['expires']);
        }

        $i++;
    }
    $user['subscribe'] = $subscribe;
    $settings['user'] = $user;

    mysqli_close($con);
}

$settings['category'] = $category;
$settings['tid'] = intval($trail_id);

$trail = json_decode(file_get_contents('https://api.mapotechnology.com/v1/trails/guide?key=cf707f0516e5c1226835bbf0eece4a0c&id=' . $trail_id));
if ($trail->guide->metadata->public == 0 && $settings['user']['role'] != 'ADMIN') {
    http_response_code(404);
    include_once 'error.php';
    exit();
}

$guideTitle = $trail->guide->metadata->title;
$metaphoto = 'https://cdn.mapotrails.com/photos/large/'.$trail->guide->media[0]->file;
$metacaption = $trail->guide->media[0]->caption;
$author = $trail->guide->metadata->author;
$numWay = $trail->guide->waypoints ? count($trail->guide->waypoints) : 0;
$numMed = $trail->guide->media[0]->file != '' ? count($trail->guide->media) : 0;
$numKW = $trail->guide->metadata->keywords ? count($trail->guide->metadata->keywords) : 0;
$premium = $trail->guide->metadata->premium == 1 ? true : false;
$mapotrails = true;
$editLink = 'https://www.mapotechnology.com/account/admin/trails/edit?id='.$trail_id;
$loginLink = 'secure/login?src=mapotrails&next='.urlencode($_SERVER['REQUEST_URI']);

$title = $guideTitle.' '.comb($trail->guide->metadata->term).' Guide';
$metaDesc = truncate2($trail->guide->metadata->route);
$includeMapbox = true;
$css[] = 'https://www.mapotrails.com/src/css/guide.css';
#$css[] = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
#$js[] = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.min.js';
#$js[] = 'https://bbecquet.github.io/Leaflet.PolylineDecorator/dist/leaflet.polylineDecorator.js';
#$js[] = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js';
#$css[] = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css';
$js[] = 'https://www.mapotrails.com/guide.js?'.time();

if (count($trail->guide->media) != 0 && $android != 1) {
    $bannerImage = 'background-image:url(https://cdn.mapotrails.com/photos/'.$trail->guide->media[0]->file.')';
} else {
    $bannerImage = '';
}

$ogtype = 'place';
$article = array('created' => $trail->guide->metadata->created, 'updated' => $trail->guide->metadata->updated);
include_once 'header.inc.php';

// subscription ID
$planID = $mapoSubscriptions['mapotrails'][($stripeLive ? 'live' : 'test')];
$hasPermissions = hasPermissions();

if ($trail->guide->metadata->public == 0 && $settings['user']['role'] == 'ADMIN') {
    echo '<div class="watermark">not public</div>';
}
?>
    <section<?//=(count($trail->guide->media) == 0 ? ' style="margin-top:100px"' : '')?>>
        <div class="container">
            <div class="row">
                <div class="col">
                    <?if(!$bannerImage){
                        echo '<h1>'.$guideTitle.'</h1>';
                    }?>
                    
                    <div class="pagecrumbs">
                        <div class="crumb"><a href="https://www.mapotrails.com/guides">Trail Guides</a></div>
                        <div class="crumb"><a href="https://www.mapotrails.com/guides/<?=$trail->guide->metadata->type?>"><?=ucfirst($trail->guide->metadata->type)?></a></div>
                        <div class="crumb"><a href="https://www.mapotrails.com/guides/<?=$trail->guide->metadata->type?>/<?=str_replace(' ', '-', strtolower($trail->guide->metadata->term[0]))?>"><?=$trail->guide->metadata->term[0]?></a></div>
                        <?if($trail->guide->metadata->keywords && count($trail->guide->metadata->keywords) > 0 && $trail->guide->metadata->keywords !== false && $trail->guide->metadata->keywords[0] != ''){?>
                            <div class="crumb"><a href="https://www.mapotrails.com/guides/<?=$trail->guide->metadata->type?>/<?=str_replace(' ', '-', strtolower($trail->guide->metadata->term[0]))?>/<?=str_replace(' ', '-', strtolower($trail->guide->metadata->keywords[0]))?>"><?=$trail->guide->metadata->keywords[0]?></a></div>
                        <?}?>
                        <div class="crumb"><?=$trail->guide->metadata->title?></div>
                    </div>

                    <?/*<div id="map" class="guide" data-category="<?=$category?>" data-tid="<?=$trail_id?>" data-center='<?=json_encode($trail->guide->metadata->geo)?>'>*/?>
                    <div id="map" style="margin-bottom:2em"></div>

                    <?if($android != 1) {?>
                        <a href="https://www.mapotrails.com/trails/<?=$trail_id?>" class="btn btn-lg btn-yellow centered">Explore trail on map</a>
                    <?}?>

                    <div class="tags">
                    <?echo icon($trail->guide->metadata->term, 1);
                        if ($numKW > 1) {
                        for ($i = 0; $i < $numKW; $i++) {
                            //echo '<div class="tag" onclick="window.location.href=\'https://www.mapotrails.com/guides/'.$category.'/'.strtolower(str_replace(' ', '-', $trail->guide->metadata->term[0])).'/'.strtolower(str_replace(' ', '-', $trail->guide->metadata->keywords[$i])).'\'">#'.str_replace(' ', '', $trail->guide->metadata->keywords[$i]).'</div>';
                            echo '<div class="tag" onclick="window.location.href=\'https://www.mapotrails.com/guides/all/all-activities/'.strtolower(str_replace(' ', '-', $trail->guide->metadata->keywords[$i])).'\'">#'.str_replace(' ', '', $trail->guide->metadata->keywords[$i]).'</div>';
                        }
                    }?>
                    </div>

                    <?if (!$hasPermissions) {?>
                    <div style="margin:50px auto 0 auto;text-align:center;font-size:20px;font-weight:300;line-height:2">
                        <i class="far fa-lock" style="font-size:20px;color:gold;padding-right:5px"></i>
                        <?='This is a premium guide: <!--<a href="https://www.mapotechnology.com/checkout?price_id='.$planID.'&src=mapotrails'.($settings->user->uid ? '&host=mapotrails.com&force_login=1' : '').'&return='.urlencode(explode('?', $_SERVER['REQUEST_URI'])[0]).'">subscribe for access</a>'.
                        (!$settings->user->uid ? ', or--><a href="https://www.mapotechnology.com/secure/login?fail=1&service=mapotrails&next='.urlencode('https://www.mapotrails.com'.$_SERVER['REQUEST_URI']).'">login</a> if you\'re already subscribed' : '')?>
                    </div>
                    <?}else{?>
                    <div class="stats">
                        <div class="item">
                            <div class="title">Distance</div>
                            <div class="val" id="a">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Trailhead Altitude</div>
                            <div class="val" id="b">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Max. Altitude</div>
                            <div class="val" id="c">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Min. Altitude</div>
                            <div class="val" id="d">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Elev. Gain</div>
                            <div class="val" id="e">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Elev. Loss</div>
                            <div class="val" id="f">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Average Trail Slope</div>
                            <div class="val" id="g">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <div class="item">
                            <div class="title">Max. Trail Slope</div>
                            <div class="val" id="h">
                                <div class="placeholder" style="width:100px;height:20px"></div>
                            </div>
                        </div>
                        <? if ($trail->guide->metadata->season) { ?>
                            <div class="item">
                                <div class="title">Season</div>
                                <div class="val"><?= $trail->guide->metadata->season ?></div>
                            </div>
                        <? } ?>
                    </div>
                    <?}?>

                    <?if($hasPermissions){?>
                    <div class="chart" style="width:100%;height:400px"><canvas id="chart"></canvas></div>
                    <?}?>
                </div>
            </div>
        </div>
    </section>

    <?if($hasPermissions){?>
    <article>
        <div class="container" style="padding-top:0">
            <div class="row">
                <div style="font-family:'Noto Sans';font-weight:100;font-size:18px">
                    <h2>Trail Description</h2>
                    <?if($trail->guide->metadata->route){?>
                    <div class="article-content">
                    <?=format($trail->guide->metadata->route)?>
                    </div>
                    <?}?>

                    <p style="font-size:16px;color:var(--blue-gray)<?=$trail->guide->metadata->route == '' ? ';padding-top:0' : ''?>">
                        Trail data mapped by <span style="font-weight:400"><?= $author ?></span> on <span style="font-weight:400"><?=date('M j, Y', $trail->guide->metadata->created)?></span>
                        <?if($trail->guide->metadata->updated > $trail->guide->metadata->created + (24 * 60 * 60)){?> &middot; Last update: <span style="font-weight:400"><?=date('M j, Y', $trail->guide->metadata->updated)?></span><?}?>
                        <?=($trail->guide->metadata->contributors ? ' &middot; Contributors: <span style="font-weight:400">' . $trail->guide->metadata->contributors . '</span>' : '') ?>
                        <?if(count($trail->guide->media) != 0 && $settings['user']['role'] == 'ADMIN') {?><a href="<?=$editLink?>" style="font-size:14px;margin-left:5px"><i class="fas fa-pen"></i> edit guide</a><?}?>
                    </p>

                    <?/*<h2>Vegetation</h2>
                    <p id="veg" style="display:inline-flex;align-items:center;gap:1em"><i class="fas fa-trees" style="color:var(--green)"></i><span class="placeholder" style="display:inline-block;width:300px;height:24px"></span></p>*/?>

                    <?if($numWay > 0){
                    $decim = 3;
                    for ($i = 0; $i < $numWay; $i++) {
                        $way = $trail->guide->waypoints[$i];

                        if ($way->name || $way->note != 'N/A' && ($way->lat)) {
                            $icon = wpIcon($way->icon);
                            $coords = [$way->lat, $way->lon];

                            // if user isn't admin or subscribed, they only see partial coordinates
                            if (!$hasPermissions) {
                                $coords = [round($coords[0], $decim), round($coords[0], $decim)];
                            }
                            if ($i == 0) {?>
                            <h2>Waypoints</h2>
                            <div class="waypoints">
                            <?}?>
                                <div class="row">
                                    <div class="col wpi">
                                        <div class="waypoint-icon" data-icon="<?=$way->icon?>" data-id="<?=$way->id?>">
                                            <div style="background-color:<?=$icon[1]?>;color:#<?=($icon[2] == 0 ? '000' : 'fff')?>"><i class="<?=$icon[0]?>" aria-hidden="true"></i></div>
                                        </div>
                                        <!--<div class="waypoint-icon" data-icon="<?=$way->icon?>" data-id="<?=$way->id?>"><div class="placeholder" style="width:30px;height:30px"></div></div>-->
                                    </div>
                                    <div class="col" style="text-align:left">
                                        <p style="color:var(--green);padding:0 0 5px 0"><?=$way->name?></b><?= ($way->note && $way->note != 'N/A' ? ' &mdash; <i>' . $way->note . '</i>' : '') ?></p>
                                        <span class="wpc" style="font-size:16px;font-weight:400;letter-spacing:0.5px;cursor:pointer" data-id="<?=$way->id?>">
                                            <?=rtrim(round($coords[0], 6), 0).', '.rtrim(round($coords[1], 6), 0)?>
                                        </span>
                                    </div>
                                </div>
                            <?}}?>
                        </div>
                    <?}?>

                    <?if($numMed > 0){?>
                    <h2 style="margin-top:1em">Photos</h2>
                    <div class="photos">
                        <?
                        for ($i = 0; $i < $numMed; $i++) {
                            $media = $trail->guide->media[$i];

                            if (strpos($media->file, 'youtube://') !== false) {
                                preg_match('/youtube:\/\/v\/(.*)/', $media->file, $url);
                                $m = '<iframe src="https://www.youtube.com/embed/'.$url[1].'" style="width:100%;height:220px" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
                            } else {
                                $exists = file_exists('/home/mapo/public_html/mapotrails.com/data/photos/thumbnail/'.$media->file);

                                if ($exists) {
                                    $m = '<img loading="lazy" data-n="'.$i.'" src="https://cdn.mapotrails.com/photos/thumbnail/'.$media->file.'" alt="'.$media->caption.'" title="'.$media->caption.'">';
                                } else {
                                    $exists = file_exists('/home/mapo/public_html/mapotrails.com/data/photos/large/'.$media->file);

                                    if ($exists) {
                                        $m = '<img loading="lazy" data-n="'.$i.'" src="https://cdn.mapotrails.com/photos/large/'.$media->file.'" alt="'.$media->caption.'" title="'.$media->caption.'">';
                                    }
                                }
                            }
                            $ph[($i % 4)][] = array($m, $media->caption);
                        }
                        
                        foreach ($ph as $e) {
                            $photos = '';
                            foreach ($e as $k) {
                                $photos .= $k[0]/*.($k[1] ? '<p class="caption">'.$k[1].'</p>' : '')*/;
                            }
                            echo '<div class="item">'.$photos.'</div>';
                        }
                        ?>
                    </div>
                    <?}?>

                </div>
            </div>
        </div>
    </article>
    <?}?>

<div id="lightbox">
    <span id="close"><i class="fat fa-xmark"></i></span>
    <div class="wrapper">
        <div class="photo"></div>
        <div class="pitems"></div>
        <p class="caption"></p>
    </div>
</div>

<script>let settings=<?=json_encode($settings)?>,center=[<?=floatval($trail->guide->metadata->geo[1])?>,<?=floatval($trail->guide->metadata->geo[0])?>],stats=<?=json_encode($trail->guide->metadata->stats)?>;</script>
<?=generateFooter($js)?>

</body>
</html>