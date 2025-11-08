<?
#ini_set('display_errors',1);
/*header('Content-type: application/json');*/

exit();

include('/home/mapo/public_html/db.ini.php');
include('/home/mapo/public_html/apis/functions.inc.php');
$category = $_GET['method'];
$year = date('Y');

function dispatchZones($id) {
    global $dzones;
    $r = [null, null, null];

    for ($i = 0; $i < count($dzones); $i++) {
        $unit = $dzones[$i]->unit;
        if ($unit == explode('-', $id)[1]) {
            $r = $dzones[$i];
            break;
        }
    }

    return $r;
}

$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211); 
$categories = ['all', 'new', 'smk', 'rx', 'all,new', 'all,new,smk'];
$dzones = json_decode(file_get_contents('./dispatch_zones.json'));

foreach ($categories as $category) {
    $features = array();
    $inciweb = array();
    #$cachefilename = '/home/mapo/public_html/apis/cache/api-fires_'.$category.'.json';
    $cachefilename = 'api-fires_'.$category;

    //if ((time() - filemtime($cachefilename) > 600 || !file_exists($cachefilename) || filemtime('wildfires.ini.php') > filemtime($cachefilename) || isset($_REQUEST['bbox']))) {
        #$sql = "SELECT w.*, d.agency AS org, d.area, d.logo FROM wildfires AS w LEFT JOIN dispatch_zones AS d ON (d.unit = CONCAT(w.state, SUBSTRING(incidentID, 8, 3)) OR d.unit = CONCAT(w.state, SUBSTRING(incidentID, 8, 4))) WHERE ";
        $sql = "SELECT w.*, i.data FROM wildfires AS w LEFT JOIN inciweb AS i ON i.state = w.state AND i.name = w.name AND i.year = w.year WHERE w.agency ".($category == 'canada' ? "= 'CIFFC'" : "!= 'CIFFC'")." AND ";

        // if retrieving archived fires
        /*if ($_REQUEST['archive']) {
            $sql .= "date >= ".strtotime('1/1/'.$_REQUEST['archive'].' 00:00:00')." AND date <= ".strtotime('12/31/'.$_REQUEST['archive'].' 23:59:59');
        } else {*/
            $sql .= "w.year = '$year' AND ";

            // new fires, within the last 12 hours
            if ($category == 'new') {
                $sql .= "date >= ".strtotime('-12 hours')." AND ";
            // all, new, rx or smoke checks
            } else if ($category == 'smk' || $category == 'rx' || $category == 'all,new' || $category == 'all,new,smk' || $category == 'all,new,rx' || $category == 'all,new,smk,rx' || $category == 'canada') {
                $sql .= "";
            // all fires, older than 12 hours ago
            } else {
                $sql .= "date < ".strtotime('-12 hours')." AND ";
            }

            if ($category == 'all' || $category == 'new' || $category == 'all,new' || $category == 'canada') {
                $sql .= "(type = 'Wildfire' OR type = 'Complex')";
            } else if ($category == 'smk') {
                $sql .= "type = 'Smoke Check'";
            } else if ($category == 'rx') {
                $sql .= "type = 'Prescribed Fire'";
            } else if ($category == 'all,new,smk') {
                $sql .= "(type = 'Wildfire' OR type = 'Complex' OR type = 'Smoke Check')";
            } else if ($category == 'all,new,rx') {
                $sql .= "(type = 'Wildfire' OR type = 'Complex' OR type = 'Prescribed Fire')";
            } else if ($category == 'all,new,smk,rx') {
                $sql .= "(type = 'Wildfire' OR type = 'Complex' OR type = 'Smoke Check' OR type = 'Prescribed Fire')";
            }
        /*}

        // filter by agency
        if ($_REQUEST['agency']) {
            $sql .= " AND agency = '".$_REQUEST['agency']."'";
        }

        // filter by state
        if ($_REQUEST['state']) {
            $sql .= " AND w.state = '".$_REQUEST['state']."'";
        }*/

        $outAgo = strtotime('-3 days');
        // looks to exclude any fires that have already been out for 3 days or more (to help speed up queries)
        $sql .= " AND (status NOT LIKE '%s:3:\"Out\";%' OR (status LIKE '%s:3:\"Out\";%' AND REPLACE(SUBSTRING_INDEX(status, '\"Out\";i:', -1), \";}\", \"\") > ".$outAgo."))";

        /*if (isset($_REQUEST['bbox'])) {
            $js = json_decode($_REQUEST['bbox']);
            $ymin = $js->ymin;
            $ymax = $js->ymax;
            $xmin = $js->xmin;
            $xmax = $js->xmax;

            $sql .= " AND (lat >= ".$ymin." AND lat <= ".$ymax.") AND (lon >= ".$xmax." AND lon <= ".$xmin.")";
        }*/

        // finish sql statement
        $sql .= " AND display = 1 ORDER BY CAST(date AS float) DESC";
        $sql = str_replace(' AND  AND ', ' AND ', $sql);

        $result = mysqli_query($con, $sql);
        $total = 0;

        while ($row = mysqli_fetch_assoc($result)) {
            $status = unserialize($row['status']);
            $show_fire = wildfireAlgorithm($category, $row['type'], $status, $row, null);

            if ($show_fire && $row['state'] != '') {
                if (!isset($_REQUEST['bbox']) || ($_REQUEST['bbox'] && bbox($_REQUEST['bbox'], $row['lat'], $row['lon']))) {
                    $name = incidentName($row['name'], $row['incidentID']);
                    $url = url($row['wfid'], $name, $row['state']);

                    if (strpos($row['incidentID'], '-NWCG-') !== false) {
                        $inciweb[] = $row['state'].$name;
                    }

                    $zone = dispatchZones($row['incidentID']);
                    $fire = array('wfid' => $row['wfid'],
                                    'incidentId' => $row['incidentID'],
                                    'state' => $row['state'],
                                    'dispatch' => ($row['agency'] ? $row['agency'] : 'NWCG'),
                                    'name' => $name,
                                    'type' => $row['type'],
                                    'acres' => floatval($row['acres']),
                                    'status' => ($status ? $status : ''),
                                    'notes' => $row['notes'],
                                    'resources' => $row['resources'],
                                    'fuels' => $row['fuels'],
                                    'near' => $row['geo'],
                                    'url' => $url,
                                    'protection' => array('agency' => $zone->agency,
                                                          'area' => $zone->area,
                                                          'logo' => $zone->logo),
                                    'time' => array('year' => intval($row['year']),
                                                    'discovered' => floatval($row['date']),
                                                    'captured' => floatval($row['captured']),
                                                    'updated' => floatval($row['updated']),
                                                    'timezone' => $row['timezone']));

                    if ($row['data']) {
                        $aa = unserialize($row['data']);
                        foreach ($aa['data']['Current Situation'] as $o) {
                            if ($o['desc'] == 'Size (Acres)') {
                                $bkacres = str_replace([' Acres',','], ['',''], $o['info']);
                                break;
                            }
                        }

                        if ($bkacres > $row['acres']) {
                            $fire['acres'] = $bkacres;
                        }
                    }

                    $features[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => array(floatval($row['lon']), floatval($row['lat']))), 'properties' => $fire);
                    $total++;
                }
            }
        }

        // remove duplicate inciweb fires from features array
        $n = 0;
        foreach ($features as $a) {
            if (in_array($a['properties']['state'].$a['properties']['name'], $inciweb) && $a['properties']['type'] != 'Complex' && $a['properties']['dispatch'] == 'NWCG') {
                unset($features[$n]);
                $total -= 1;
            }
            $n++;
        } 
        $features = array_values($features);

        $returnJson = array('type' => 'FeatureCollection', 'features' => $features, 'totalFires' => $total);
        $memcache->set($cachefilename, json_encode($returnJson), 900);

        /*if ($features != null && !isset($_REQUEST['bbox'])) {
            $save = fopen($cachefilename, 'w');
            fwrite($save, json_encode($returnJson));
            fclose($save);
        }
    } else {
        $isCached = true;
        
        if (isset($_REQUEST['bbox'])) {
            $total = 0;
            $get = json_decode(file_get_contents($cachefilename))->features;

            foreach ($get as $i) {
                if (bbox($_REQUEST['bbox'], $i->geometry->coordinates[1], $i->geometry->coordinates[0])) {
                    $newdata[] = $i;
                    $total++;
                }
            }

            $cache = array('type' => 'FeatureCollection', 'features' => $newdata, 'totalFires' => $total);
        } else {
            $cache = json_decode(file_get_contents($cachefilename));
        }
        
        $cache->cached = 1;
        $returnJson = $cache;
    }*/

    $save = fopen($cachefilename, 'w');
    fwrite($save, json_encode($returnJson));
    fclose($save);

    logEvent('Generated wildfire API cache data', true);
    echo 'Cached API for '.$category.'...
';
}
?>