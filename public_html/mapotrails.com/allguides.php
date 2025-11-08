<?
#ini_set('display_errors',0);
#error_reporting(E_ALL);
ini_set('session.cookie_domain', '.mapotrails.com');
session_start();

if (strpos($_GET['area'], '.') !== false) {
    header('Location: https://'.$_SERVER['HTTP_HOST'].str_replace('.', '', $_SERVER['REQUEST_URI']));
    exit();
}

include_once('helper.inc.php');
mysqli_close($con2);
$config = json_decode($trails_config)->config;
$areas = $config->areas;
$activities = $config->activities;

#$type = array('trail','trail','snow','snow','trail','trail','snow','trail','trail','trail','trail','trail','trail','ski','trail','trail','trail','snow','trail');
#$activities = array('All Activities','ATV','Alpine Ski','Backcountry Ski','Beginner','Big Ride','Big Ski','Climb','Dirtbike','Fantasy','Gravel Bike','Hike','Mountain Bike','Nordic Ski','Private','Race','Road Bike','Snowmobile','Summit');
#$areas = array('All Areas','ATV','All Singletrack','Andies Prairie','Aneroid','Angell','Angell Basin','Anthony','Anthony Lakes','Arizona','Baker','Baker City','Bear Creek','Bear Lake','Bear Springs Trap','Bearwallow','Ben Point','Bend','Bennet Peak','Big Canyon','Big Sheep','Birdtrack Springs','Black Lake','Black Mt.','Blues','Boise','Bone Springs','Bonny Lakes','Boulder Park','Boulders','Boundary','Boundary Campground','Bourne','Bowman','Brand Trails','Breshears','Brownlee','Buck Creek','Buck Creek Campground','Bulger Flat','Burger','Burger Meadow','Burger Pass','California','Camp Carson','Carson','Cascades','Catherine','Catherine Creek','Catherine Creek State Park','Catherine Meadow','Central Oregon','Chicken Hill','Chico','Chief Joseph Peak','Chimney Lake','China Cap','Clear Creek','Clear Creek Snopark','Clear Creek Warming Shelter','Climb','Copper Creek','Cornucopia','Cornucopia Peak Avalanche','Cougar Ridge','Cove','Cove Wash','Cracker Saddle','Crib Point','Cuddy','Culver Lake','Davis Creek','Deadman Trail','Death Valley','Diamond Lake','Dirt Climb','Dobbin','Dug Bar','Dutch Flat','ECT','Eagle Cap','Eagle Cap Wilderness','Eagle Caps','Eagle Creek','Eagle Forks','Eagle Lake','East Eagle','East Fork Pine Creek','Echo','Echo Lake','Eklhorns','Elgin','Elk Creek','Elkhorn Crest Trail','Elkhorn Peak','Elkhorns','Enterprise','Fake Creek','Family','Fergi','Fergie','Fish Lake','Five Points','Flagstaff','Flagstaff Butte','Flora','Florence','Foothill','Fox Hill','Frances Lake','Freezeout Saddle','Galena','Glass Hill','Goat Creek','Goat Mountain','Goodrich Lake','Grande Ronde Valley','Granite','Granite Gulch','Greenhorns','Greer','Greer Ranch','Haines','Hale Spring','Halfway','Harris Park','Hat Point','Hells Canyon','Hideaway Spring','High Hat','Hood River','Huckleberry Mountain','Huntington','Hurricane Creek','Ice Lake','Idaho','Imbler','Imnaha','Imnaha River','Indian Creek','Indian Crossing','Indian Rock','John Henry','John Henry Lake','Joseph','Joseph Canyon','Joseph Creek','Jospeph','Jubilee Lake','Jumpoff Joe Lake','Ketchum','Killamacue','La Grande','Lackeys Hole','Ladd Canyon','Ladd Marsh','Lake Creek','Lakes Basin','Lakeys Hole','Lapover','Lehman Hot Spring','Lick Creek','Lime Quarry','Little Bear','Little Bear Creek','Little Eagle','Little Minam','Lodgepole','Long Ridge','Looking Glass Lake','Lookingglass','Lookout Mountain','Lord Flat','Lostine','Lowry Gulch','Luger Springs','MERA','Main Eagle','Marble Pass','Matterhorn','Maxwell Lake','McBride','McBride CG','McCully','Meacham Divide','Meadow Mountain','Meads Flat','Medical Springs','Mill Creek','Minam','Minam Lake','Minam River','Miner Lake','Mingletrack','Mirror Lake','Moab','Morgan Lake','Moss Springs','Mt. Emily','Mt. Fanny','Mt. Harris','Mt. Howard','Mt. Moriah','Mule Peak','Murphy Creek','Murrieta','Nevada','New Bridge','New Meadows','Nez Perce','Ninemile Trailhead','North Fork John Day','North Minam','North Powder','North Powder River','Norton Lakes','Norway Basin','Ochocos','Olive Lake','Ollokut','Ollokut Campground','Oregon Coast','Owsley','Oxbow','PJ','Pacific Crest','Palmer Junction','Park Saddle','Pendleton','Phillips Lake','Phoenix','Pine Creek','Point Prominence','Pondosa','Pop Creek','Powder River','Prairie Creek','Prairie Lake','Price','Prineville','Pt. Prominence','Race Course','Red Mountain','Reds Horse Ranch','Richland','Riverside Park','Rock Creek','Rock Creek Butte','Rock Springs','Roundabout Spout','Ruby Peak','Ruckel','Sacajawea Peak','Saddle Creek','Salt Creek Summit','Salt Trail','Sand Pass','Santa Clara','Schneider Cabin','Sedona','Shady','Sinks','Sled Springs','Smokeys','Snake River','SoCal','Sparta','Spout Springs','SpoutMTB','Spring Creek','Spring Mountain','Squaw Butte','Squaw Creek','St. George','Standley Guard Station','Standley Ridge','Stanley','Starkey','Steamboat Lake','Sugarloaf','Summerville','Summit','Summit Lake','Summit Point','Sumpter','Sumpter Phillips Lake','Sun Valley','Swamp Creek','Swamp Lake','Syncline','Table Rock','Taylor Green','Telocaset','Temecula','Tenderfoot','The Dalles','The Lakes Lookout','The Watershed','Thief Valley Reservoir','Tollgate','Tombstone Lake','Trail Creek','Trailwork','Trailwork Needed','Traverse Lake','Trout Creek','Troy','Twin Lakes','Two Color','Two Color Lake','Two Pan','Ukiah','Umapine','Umatilla','Umatilla Forks','Umatilla Rim','Umatilla River','Union','Unrideable','Utah','VPL','Van Patten','Wahsboard','Walla Walla','Wallowa','Wallowa Lake','Wallowa River','Wallowas','Walton Lake','Washington','Wenaha','West Eagle','Wilderness','Williams Creek','Wing Ridge','Wolf Creek','Young Ridge','Zumwalt','downhill','road run');

function premiumTrails($p) {
    global $_SESSION;
    $u = $_SESSION;

    if ($p == 0 || !$u) {
        return true;
    } else {
        if ($u['subscribe'] && $u['subscribe']['active'] == 1 || $u['role'] == 'ADMIN') {
            return true;
        } else {
            return false;
        }
    }
}

$category = $_GET['category'];
$activity = $_GET['activity'];
$area = $_GET['area'];
$mapotrails = true;

foreach($areas as $a) {
    $v = strtolower(str_replace([' ', '.', '\''], ['-', '', '-'], $a));
    $areaOptions[$v] = $a;
    //echo '<option '.($area == $v ? 'selected ' : '').'value="'.str_replace('.', '', $v).'">'.$a.'</option>';
}

$url = 'https://api.mapotechnology.com/v1/trails/list?key=cf707f0516e5c1226835bbf0eece4a0c&desc=1&seo=1&public=1&filter='.
        ($category == 'all' ? '' : $category).
        ($activity != 'all-activities' ? '&category='.str_replace('-', '%20', $activity) : '').
        ($area && $area != 'all areas' ? '&area='.str_replace('-', '%20', $area) : '');
$trails = json_decode(file_get_contents($url))->trails;
$totalTrails = count($trails);

/*if ($activity && !in_array(ucwords(str_replace('-', ' ', $activity)), $activities)) {
    header('Location: https://www.mapotrails.com/guides/'.$category);
    exit();
}*/

function tf($t) {
    $t = ucwords(str_replace('-', ' ', $t));
    return (substr($t, -1) == 'e' ? substr($t, 0, -1) : $t).'ing';
}

$title = 'All '.($category != 'all' ? ucfirst($category).' ' : '').'Guides'.($activity ? ' for '.($activity == 'all-activities' ? 'All Activities' : tf($activity)).' ' : '').(!$area ? ' in All Areas' : 'near '.$areaOptions[$_GET['area']]);
$metaDesc = 'Explore the most accurate '.($category == 'all' ? 'trail and snow' : $category).' recreation guides'.($activity ? ' for '.($activity == 'all-activities' ? 'hiking, mountain biking, skiing, and more ' : strtolower(tf($activity))).' ' : '').($area ? 'near '.ucwords(str_replace('-', ' ', $area)) : '').' in Northeast Oregon, California, and more.';
#$loginLink = 'secure/login?src=mapotrails&next='.urlencode('https://www.mapotrails.com'.$_SERVER['REQUEST_URI']);

$js[] = 'https://www.mapotrails.com/src/js/main.js';
include_once('./header.inc.php');
?>

<section class="page">
    <div class="container">
        <div class="pagecrumbs">
            <div class="crumb"><a href="https://www.mapotrails.com/guides">Trail Guides</a></div>
            <?if($_GET['category'] != 'all'){?>
                <div class="crumb"><a href="https://www.mapotrails.com/guides/<?=$_GET['category']?>"><?=ucfirst($_GET['category'])?></a></div>
            <?}
            if($_GET['activity']){?>
                <div class="crumb"><a href="https://www.mapotrails.com/guides/<?=$_GET['category']?>/<?=$_GET['activity']?>"><?=ucwords(str_replace('-', ' ', $_GET['activity']))?></a></div>
                <div class="crumb"><?=$_GET['area'] ? ucwords(str_replace('-', ' ', $_GET['area'])) : 'All Areas'?></div>
            <?}else{
                echo '<div class="crumb">All Activities</div>';   
            }?>
        </div>

        <div class="controls">
            <div class="col" style="max-width:125px">
                <select id="type">
                    <option <?=(!isset($_GET['category']) || $_GET['category'] == 'all' ? 'selected ' : '')?>value="">All</option>
                    <option <?=($_GET['category'] == 'trail' ? 'selected ' : '')?>value="trail">Summer</option>
                    <option <?=($_GET['category'] == 'snow' ? 'selected ' : '')?>value="snow">Winter</option>
                </select>
            </div>
            <div class="col">
                <select id="category" name="category" style="margin:0;max-width:100%">
                    <option value="<?=($_GET['category'] ? $_GET['category'] : 'all')?>/all-activities">All Activities</option>
                    <?foreach($activities as $a) {
                    foreach($a as $key => $val) {
                        $v = strtolower(str_replace(' ', '-', $val));
                        if ($key == 'trail' && $_GET['category'] == 'trail' || $key == 'snow' && $_GET['category'] == 'snow' || (!isset($_GET['category']) || $_GET['category'] == 'all' && $key)) {
                            echo '<option '.($activity == $v ? 'selected ' : '').'value="'.$key.'/'.$v.'">'.$val.'</option>';
                        }
                    }
                }?>
                </select>
            </div>
            <div class="col">
                <select id="areas" name="areas" style="margin:0;max-width:100%">
                    <?foreach($areaOptions as $a => $b) {
                        echo '<option '.($area == $a ? 'selected ' : '').'value="'.$a.'">'.$b.'</option>';
                    }?>
                </select>
            </div>
            <div class="col">
                <form id="query">
                    <input type="text" id="q" name="q" style="margin:0;max-width:100%" placeholder="Filter this list..."<?=(isset($_GET['q']) ? ' value="'.$_GET['q'].'"' : '')?>>
                </form>
            </div>
            <div class="col">
                <span style="color:var(--blue-gray);font-size:14px;letter-spacing:1px;font-weight:200">MAX. DISTANCE: <span id="distval">Any</span></span>
                <input type="range" name="dist" id="dist" style="padding:0;margin:7px 0 0 0" value="0" step="1" min="0" max="50">
            </div>
        </div>

        <p id="results" data-start="0" data-v="<?=$totalTrails?>" style="display:block;width:fit-content;margin:0 0 2em 0"><b><?=$totalTrails?></b> trails matches your filters</p>

        <div id="guides" <?=($category ? 'data-category="'.$category.'"' : '').($activity ? 'data-activity="'.$activity.'"' : '').($area ? 'data-area="'.$area.'"' : '')?>class="mt-3">
            <?
            if ($totalTrails == 0) {
                echo '<h2 style="font-size:30px;color:var(--red)">No '.($activity != 'all-activities' ? str_replace('-', ' ', $activity).' ' : '').'trails found'.($area ? ' near '.ucwords(str_replace('-', ' ', $area)) : '').'</h2>';
            } else {
                for ($i = 0; $i < $totalTrails; $i++) {
                    $trail = $trails[$i];
                    $premium = premiumTrails($trail->premium);
                    $dist = $trail->stats->distance;
                    $icons = '';

                    if ($trail->category != null) {
                        foreach ($trail->category as $tc) {
                            $icons .= '<div class="tag">'.$tc.'</div>';
                        }
                    }
                ?>
                <div class="guide" data-prem="<?=$trail->premium?>" data-dist="<?=$dist?>" title="<?=$trail->title?>">
                    <div class="guide-media">
                        <a href="<?=($premium ? 'https://www.mapotrails.com/'.$trail->url : '#" onclick="return false')?>" aria-label="Read more on <?=$trail->title?>">
                            <img onerror="replaceImg(this)" loading="lazy" src="https://cdn.mapotrails.com/photos/large/<?=$trail->photo->url?>" alt="<?=($trail->photo->caption ? $trail->photo->caption : $trail->title)?>" title="<?=($trail->photo->caption ? $trail->photo->caption : $trail->title)?>">
                        </a>
                    </div>
                    <div class="guide-desc">
                        <h2><a href="https://www.mapotrails.com/<?=$trail->url?>"><?=($trail->premium == 1 ? '<i class="fas fa-lock prem" title="Premium guide"></i>' : '').$trail->title?></a></h2>
                        <div class="tags">
                            <div class="tag"><?=(is_nan($dist) ? $dist : round($dist, 1))?> mi</div>
                            <?=($icons ? $icons : '')?>
                        </div>
                        <p><?=$trail->route?></p>
                        <a class="btn btn-lg btn-blue<?=(!$premium ? ' disabled' : '')?>" style="margin-top:1.25em"<?=($premium ? ' href="https://www.mapotrails.com/'.$trail->url.'"' : '')?> aria-label="Read more on <?=$trail->title?>">Explore full guide</a>
                    </div>
                </div>
                <?}
            }?>
        </div>

    </div>
</section>

<?
echo '<script>var user = '.json_encode($_SESSION).';</script>';
echo generateFooter($js);
?>