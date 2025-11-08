<?
ini_set('display_errors', 0);
header('Content-type: text/xml');
header('Cache-Control: must-revalidate, public, max-age=2628000');
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 2628000));
header('Pragma: cache');

include_once('../apis/functions.inc.php');

$trail_activities = array('All Activities','ATV','Beginner','Big Ride','Climb','Dirtbike','Fantasy','Gravel Bike','Hike','Mountain Bike','Race','Road Bike');
$snow_activities = array('Alpine Ski','Backcountry Ski','Nordic Ski','Private','Snowmobile','Summit');

$con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
$sql = mysqli_query($con, "SELECT id, type, title, keywords, updated FROM trails ORDER BY id DESC") or die(mysqli_error($con));
mysqli_close($con);

while ($row = mysqli_fetch_assoc($sql)) {
    foreach (unserialize($row['keywords']) as $b) {
        if ($row['type'] == 'trail') {
            $it[] = strtolower(str_replace(['.',' '], ['','-'], $b));
        } else {
            $it2[] = strtolower(str_replace(['.',' '], ['','-'], $b));
        }
    }

    $list .= '<url><loc>https://www.mapotrails.com/'.guideUrl($row['title'], $row['type'], $row['id']).'</loc><lastmod>'.date('Y-m-d\TH:i:sO', $row['updated']).'</lastmod></url>
<url><loc>https://www.mapotrails.com/trails/'.$row['id'].'</loc></url>
';        
}

asort($it);
asort($it2);
$it = array_values(array_unique($it));
$it2 = array_values(array_unique($it2));

echo '<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://www.mapotrails.com</loc></url>
<url><loc>https://www.mapotrails.com/guides/trail</loc></url>
<url><loc>https://www.mapotrails.com/guides/snow</loc></url>
<url><loc>https://www.mapotrails.com/blue-mountains-forest-plan-revision</loc></url>
<url><loc>https://www.mapotrails.com/blue-mountains-forest-plan-revision/about</loc></url>';

foreach ($trail_activities as $a) {
    echo '<url><loc>https://www.mapotrails.com/guides/trail/'.strtolower(str_replace(' ', '-', $a)).'</loc></url>';
    
    foreach ($it as $b) {
        echo '<url><loc>https://www.mapotrails.com/guides/trail/'.strtolower(str_replace(' ', '-', $a)).'/'.$b.'</loc></url>';
    }
}

foreach ($snow_activities as $a) {
    echo '<url><loc>https://www.mapotrails.com/guides/snow/'.strtolower(str_replace(' ', '-', $a)).'</loc></url>';
    
    foreach ($it2 as $b) {
        echo '<url><loc>https://www.mapotrails.com/guides/snow/'.strtolower(str_replace(' ', '-', $a)).'/'.$b.'</loc></url>';
    }
}

echo $list.'</urlset>';
?>