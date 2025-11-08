<?
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Content-type: application/json');

include('../config.inc.php');

ini_set('session.cookie_lifetime', $cookieLength);
ini_set('session.gc_maxlifetime', $cookieLength);
ini_set('session.cookie_domain', $cookieURL);
session_set_cookie_params(0, '/', $cookieURL);
session_start();

if ($_REQUEST['session']) {
    $_SESSION = $_REQUEST['session'];
}

function get_data($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json','version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch); 
   
    return json_decode($output, TRUE);
}
   
function distance($lat1, $lon1, $lat2, $lon2) {
    $theta = floatval($lon1) - floatval($lon2);
    $dist  = sin(deg2rad(floatval($lat1))) * sin(deg2rad(floatval($lat2))) + cos(deg2rad(floatval($lat1))) * cos(deg2rad(floatval($lat2))) * cos(deg2rad($theta));
    $dist  = acos($dist);
    $dist  = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return round($miles, 2);
}
   
/*function polygon($points_polygon, $vertices_x, $vertices_y, $longitude_x, $latitude_y) {
    $i = $j = $c = 0;
    for($i = 0, $j = $points_polygon - 1; $i < $points_polygon; $j = $i++) {
     if((($vertices_y[$i] > $latitude_y != ($vertices_y[$j] > $latitude_y)) && ($longitude_x < ($vertices_x[$j] - $vertices_x[$i]) * ($latitude_y - $vertices_y[$i]) / ($vertices_y[$j] - $vertices_y[$i]) + $vertices_x[$i])))
      $c = !$c;
    }
    return $c;
}*/

function polygon($points_polygon, $vertices_x, $vertices_y, $longitude_x, $latitude_y) {
    $i = $j = $c = $point = 0;
    for ($i = 0, $j = $points_polygon ; $i < $points_polygon; $j = $i++) {
      $point = $i;
      if( $point == $points_polygon )
        $point = 0;
      if ( (($vertices_y[$point]  >  $latitude_y != ($vertices_y[$j] > $latitude_y)) &&
       ($longitude_x < ($vertices_x[$j] - $vertices_x[$point]) * ($latitude_y - $vertices_y[$point]) / ($vertices_y[$j] - $vertices_y[$point]) + $vertices_x[$point]) ) )
         $c = !$c;
    }
    return $c;
}
   
function getBearing($lat1, $lon1, $lat2, $lon2) {
    $dLon = deg2rad($lon2) - deg2rad($lon1);
    $dPhi = log(tan(deg2rad($lat2) / 2 + pi() / 4) / tan(deg2rad($lat1) / 2 + pi() / 4));
    if(abs($dLon) > pi()) {
     if($dLon > 0) {
      $dLon = (2 * pi() - $dLon) * -1;
     } else {
      $dLon = 2 * pi() + $dLon;
     }
    }
    return (rad2deg(atan2($dLon, $dPhi)) + 360) % 360;
}
   
function getCompassDirection($bearing){
    $tmp = round($bearing / 22.5);
    switch($tmp) {
     case 1:
      $direction = "NNE";
      break;
     case 2:
      $direction = "NE";
      break;
     case 3:
      $direction = "ENE";
      break;
     case 4:
      $direction = "E";
      break;
     case 5:
      $direction = "ESE";
      break;
     case 6:
      $direction = "SE";
      break;
     case 7:
      $direction = "SSE";
      break;
     case 8:
      $direction = "S";
      break;
     case 9:
      $direction = "SSW";
      break;
     case 10:
      $direction = "SW";
      break;
     case 11:
      $direction = "WSW";
      break;
     case 12:
      $direction = "W";
      break;
     case 13:
      $direction = "WNW";
      break;
     case 14:
      $direction = "NW";
      break;
     case 15:
      $direction = "NNW";
      break;
     default:
      $direction = "N";
    }
    return $direction;
}

date_default_timezone_set($_SESSION['timezone']);
$agency = ($_REQUEST['agency'] ? $_REQUEST['agency'] : ($_SESSION['agency'] ? $_SESSION['agency'] : $agency));
$function = $_REQUEST['function'];
$mode = $_REQUEST['mode'];
$time = time();

if(!$_SESSION['uid']/*$_SERVER[HTTP_ORIGIN] != $baseurl*/){
    $return = array('error' => '403', 'message' => 'The user session doesn\'t exist or has expired');
}else{

 //If functions are for the CAD
if ($function == 'cad') {
    // get geo location details for a lat/long
    if ($mode == 'geo') {
        include_once('geo.inc.php');

    // process command line functions
    } else if ($mode == 'command') {
        include_once('cmdline.inc.php');

    } else if ($mode == 'preferences') {
        include_once('prefs.inc.php');

    //Get configuration for dispatch center's CAD
    } else if ($mode=='config') {
        $sql = mysqli_query($con, "SELECT * FROM $db.config WHERE aid = 'all' OR aid LIKE '$agency' ORDER BY type ASC, id ASC, value ASC");
        $sql2 = mysqli_query($con, "SELECT uid, first_name, last_name FROM $db.users WHERE agency LIKE '$agency'");
        $sql3 = mysqli_query($con, "SELECT level, zones FROM $db.responseLevels WHERE agency LIKE '$agency' ORDER BY priority ASC");

        while ($row = mysqli_fetch_assoc($sql)) {
            if ($row['type'] != 'responseAreas') {
                if ($row['type'] == 'zone') {
                    $val = array('id' => $row['id'], 'name' => $row['value']);
                } else {
                    $val = ($row['type']=='settings'||$row['type']=='jurisdiction'||$row['type']=='resourceType'||$row['type']=='roles' ? unserialize($row['value']) : $row['value']);
                }

                usort($myArray, function($a, $b) {
                    return $a['value'] <=> $b['order'];
                });
                
                $return[$row['type']][] = $val;
            }
	    }
	    
        while ($row = mysqli_fetch_assoc($sql2)) {
	        $return['dispatchers'][] = array('uid' => $row['uid'], 'name' => array('first' => $row['first_name'], 'last' => $row['last_name']));
	    }

        while ($row = mysqli_fetch_assoc($sql3)) {
            $z = unserialize($row['zones']);
            $return['responseLevels'][] = array('level' => $row['level'], 'zones' => (is_array($z) ? $z : null));
        }
	 
	// Delete an incident number
    } else if ($mode=='cancel') {
        mysqli_query($con, "UPDATE $db.incidents SET status = 4 WHERE id = '$_REQUEST[id]'");
	    logEvent(2, '', $dispatcher_initials, 'Incident '.$_REQUEST['num'].' was voided', '');
	 
	    $return = array('success' => 1);
	 
	// Get next incident number
    }else if ($mode=='numbering') {
        $settings['reset_time'] = '1/1';
        $resettime = strtotime($settings['reset_time'].'/'.date('Y').' 00:00:00');
        $num = mysqli_num_rows(mysqli_query($con, "SELECT * FROM $db.incidents WHERE aid LIKE '$agency' AND time >= '$resettime'"));
        $ag = strtoupper($agency);
        $next = ($num + 1);
        $next2 = str_pad($next, 3, '0', STR_PAD_LEFT);

        mysqli_query($con, "INSERT INTO $db.incidents (aid,juris,zone,num,time,calltaker,dispatcher) VALUES('$ag','$ag','','$next2','$time','$_SESSION[uid]','$_SESSION[uid]')");
        $lastInsert = mysqli_insert_id($con);
        logEvent(2, '', $dispatcher_initials, 'Created incident '.$ag.'-'.$next2, '');
        $return = array('id' => $lastInsert, 'nextIncidentNum' => $next, 'nextIncidentName' => $next2);

	//Get incident details for CAD
	} else if ($mode == 'incident') {
        if ($_REQUEST['id']) {
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.incidents WHERE id = '$_REQUEST[id]'"));
            $sql1 = mysqli_query($con, "SELECT unit, status, time FROM $db.incidentResponse WHERE uqid = '$row[id]' ORDER BY unit ASC, status DESC");
            $sql2 = mysqli_query($con, "SELECT f, t, details, time FROM $db.log WHERE inc = '$row[id]' ORDER BY time DESC");
            $sql3 = mysqli_query($con, "SELECT i.id, juris, num, i.time, r.time AS rtime, CONCAT(last_name, ', ', first_name) AS name FROM $db.related AS r LEFT JOIN $db.incidents AS i ON i.id = inc1 LEFT JOIN $db.users ON uid = r.dispatcher WHERE r.agency LIKE '$agency' AND inc2 = '$_REQUEST[id]'");

            foreach($row as $a => $b){
                $d[$a] = ($a=='details' ? unserialize($b) : $b);
            }

            while ($rel = mysqli_fetch_assoc($sql3)) {
                $d['related'][] = array('id' => $rel['id'],
                                        'num' => date('Y', $rel['time']).'-'.$rel['juris'].'-'.str_pad($rel['num'], 6, '0', STR_PAD_LEFT),
                                        'time' => $rel['rtime'],
                                        'dispatcher' => $rel['name']);
            }

            while ($row = mysqli_fetch_assoc($sql1)) {
                $d['unitLog'][$row['unit']][] = array('status' => $row['status'],
                                                        'time' => $row['time']);
            }

            while ($row = mysqli_fetch_assoc($sql2)) {
                $d['activityLog'][] = $row;
            }
    
            $return = $d;
        } else {
            $return = array('error' => 'No incident ID specified');
        }
	
	//Get active/pending incidents for CAD
	} else if ($mode == 'incidents') {
        $fields = 'id, reported, zone, juris, num, name, lat, lon, type, status, details, notified';
        $sql = mysqli_query($con, "SELECT $fields FROM $db.incidents WHERE aid = '$agency' AND reported != 0 AND status < 3 ORDER BY status ASC, reported DESC");

        while($row = mysqli_fetch_assoc($sql)){
            //$w = unserialize($row['details'])['juris'];
            $return[] = array('id' => $row['id'], 'reported' => $row['reported'], 'zone' => $row['zone'], 'juris' => $row['juris'], 'num' => $row['num'], 'name' => $row['name'], 'type' => $row['type'], 'geo' => array('lat' => $row['lat'], 'lon' => $row['lon']), 'status' => $row['status'], 'notified' => $row['notified']);
        }
	
	// Get dispatch log
	} else if ($mode == 'log') {        
        if($_REQUEST['today'] == 1) {
            $s = strtotime(date('n/j/Y').' 00:00:00');
            $e = strtotime(date('n/j/Y').' 23:59:59');
        } else if($_REQUEST['yesterday'] == 1) {
            $s = strtotime(date('n/j/Y', strtotime('-1 day')).' 00:00:00');
            $e = strtotime(date('n/j/Y', strtotime('-1 day')).' 23:59:59');
        } else if($_REQUEST['week'] == 1) {
            $s = strtotime(date('n/j/Y', strtotime('-1 week')).' 00:00:00');
            $e = strtotime(date('n/j/Y').' 23:59:59');
        } else {
            $s = strtotime('-14 days');
            $e = time();
        }

        $where = ($_REQUEST['today'] == 1||$_REQUEST['yesterday'] == 1||$_REQUEST['week'] == 1 ? 'AND log.time >= '.$s.' AND log.time <= '.$e : '');
        $sql = mysqli_query($con, "SELECT lid, which, f, t, details, inc, log.time, first_name, last_name FROM $db.log LEFT JOIN $db.users ON users.uid = log.uid WHERE log.agency = '$agency' AND users.agency = '$agency' $where ORDER BY log.time ASC");
        
        while($row = mysqli_fetch_assoc($sql)){
            $return['log'][] = array('lid' => $row['lid'], 'which' => $row['which'], 'f' => $row['f'], 't' => $row['t'], 'details' => $row['details'], 'inc' => $row['inc'], 'time' => $row['time'], 'dispatcher' => $row['first_name'].' '.substr($row['last_name'], 0, 1));
        }
        
        $return['entries'] = count($return['log']);
	
	// Get resources/units for CAD
	} else if($mode == 'resources') {
        $agency = strtoupper($agency);
        $sql = mysqli_query($con, "SELECT jurisdiction AS juris, zone AS defaultZone, zone2 AS zone, r.unit, type, name, inc, status, ia, location, last_comm, t.timer FROM $db.resources AS r LEFT JOIN $db.timers AS t ON t.unit = r.unit AND t.agency = r.agency AND cleared = 0 WHERE r.agency = '$agency' AND active = 1".($_REQUEST['assigned'] == 1 ? ' AND inc != \'\'' : '')." ORDER BY unit ASC");

        while($row = mysqli_fetch_assoc($sql)){
            $units[] = array('jurisdiction' => $row['juris'],
                            'zone' => $row['zone'],
                            'unit' => $row['unit'],
                            'type' => $resource_types[$row['type']],
                            'name' => $row['name'],
                            'inc' => $row['inc'],
                            'status' => $row['status'],
                            'ia' => $row['ia'],
                            'location' => $row['location'],
                            'last_comm' => $row['last_comm'],
                            'timer' => $row['timer']);
        }
        
        $return = array('units' => $units);

	// Get timers for any units currently requesting to be on a status timer	
    } else if($mode=='timers') {
        $time = time();
        $and = ($_REQUEST['all'] ? '' : "AND (started + timer) < '$time'");
        $sql = mysqli_query($con, "SELECT t.unit, started, timer, (started + timer) AS due, location, inc, status FROM $db.timers AS t LEFT JOIN $db.resources AS r ON r.agency = t.agency AND r.unit = t.unit WHERE t.agency = '$agency' AND cleared = 0 $and ORDER BY started DESC");
        
        while($row = mysqli_fetch_assoc($sql)){
            $return[] = $row;
        }
    }
    
//Get areas for this dispatch	
} else if ($function == 'areas') {
    if ($mode=='agency') {
        $sql = mysqli_query($con, "SELECT * FROM $db.dispatch_zones WHERE state = '$_REQUEST[state]' GROUP BY agency ORDER BY agency ASC");
        
        while($row = mysqli_fetch_assoc($sql)){
            $return[] = $row['agency'];
        }
    } else if($mode=='unit') {
        $sql = mysqli_query($con, "SELECT * FROM $db.dispatch_zones WHERE state = '$_REQUEST[state]' AND agency = '$_REQUEST[agency]' ORDER BY unit ASC");
        
        while($row = mysqli_fetch_assoc($sql)){
            $return[] = array($row['unit'], $row['area']);
        }
    }
}

mysqli_close($con);
}

echo json_encode(array('response' => $return), JSON_PRETTY_PRINT);
?>