<?
session_start();
header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');
include('../config.inc.php');

$agency = ($_REQUEST[agency] ? $_REQUEST[agency] : $_SESSION[agency]);
$function = $_REQUEST['function'];
$mode = $_REQUEST['mode'];

/*if($_SERVER[HTTP_ORIGIN] != $baseurl){
 include_once('../auth_error.inc.php');
}else{*/
 //If functions are for the CAD
 if($function=='cad'){
  //Get configuration for dispatch center's CAD
  if($mode=='config'){
   $sql = mysqli_query($con, "SELECT * FROM $db.config WHERE aid = 'all' OR aid = '$agency' ORDER BY type ASC, id ASC, value ASC");
	 while($row = mysqli_fetch_assoc($sql)){
	  $return[$row[type]][] = ($row[type]=='settings'||$row[type]=='jurisdiction' ? unserialize($row[value]) : $row[value]);
	 }

	 $sql2 = mysqli_query($con, "SELECT uid, first_name, last_name FROM $db.users WHERE agency LIKE '$agency'");
	 while($row = mysqli_fetch_assoc($sql2)){
	  $return['dispatchers'][] = array('uid' => $row[uid], 'name' => array('first' => $row[first_name], 'last' => $row[last_name]));
	 }
	 
	//Get next incident number
  }else if($mode=='numbering'){
	 $resettime = strtotime($settings[reset_time].'/'.date('Y').' 00:00:00');
	 $num = mysqli_num_rows(mysqli_query($con, "SELECT * FROM $db.incidents WHERE aid LIKE '$agency' AND reported >= '$resettime'"));
	 $return[nextIncidentNum] = ($num + 1);

	//Get active/pending incidents for CAD
	}else if($mode=='incidents'){
	 $fields = 'id, reported, zone, num, name, '.($_REQUEST[map]==1 ? 'lat, lon, ' : '').'type, details, notified';
	 $sql = mysqli_query($con, "SELECT $fields FROM $db.incidents WHERE aid = '$agency' ORDER BY reported DESC");
	 while($row = mysqli_fetch_assoc($sql)){
	  $w = unserialize($row[details])[zone];
	  
		if(!$row[notified]){
		 $return['pending'][] = array('id' => $row[id], 'reported' => $row[reported], 'jurisdiction' => $row[zone], 'zone' => $w, 'num' => $row[num], 'name' => $row[name], 'type' => $row[type], 'geo' => array('lat' => $row[lat], 'lon' => $row[lon]), 'notified' => $row[notified]);
		}else{
		 $return['active'][] = array('id' => $row[id], 'reported' => $row[reported], 'jurisdiction' => $row[zone], 'zone' => $w, 'num' => $row[num], 'name' => $row[name], 'type' => $row[type], 'geo' => array('lat' => $row[lat], 'lon' => $row[lon]), 'notified' => $row[notified]);
		}
	 }
	
	// Get dispatch log
	}else if($mode=='log'){
	 $agency = strtoupper($agency);
	 $s = strtotime(date('n/j/Y').' 00:00:00'); $e = strtotime(date('n/j/Y').' 23:59:59');
	 $where = ($_REQUEST[today] == 1 ? ' AND time >= '.$s.' AND time <= '.$e : '');
	 $sql = mysqli_query($con, "SELECT * FROM $db.log WHERE agency = '$agency' AND which = 2 $where ORDER BY time DESC");
	 while($row = mysqli_fetch_assoc($sql)){
	  $d = (unserialize($row[details]) === false ? $row[details] : unserialize($row[details]));
	  $return['log'][] = array('lid' => $row[lid], 'action' => $d, 'time' => $row[time]);
	 }
	
	// Get resources/units for CAD
	}else if($mode=='resources'){
	 $agency = strtoupper($agency);
	 $sql = mysqli_query($con, "SELECT jurisdiction AS juris, zone, unit, type, name, inc, status, location, last_comm FROM $db.resources WHERE agency = '$agency' ORDER BY unit ASC");
	 while($row = mysqli_fetch_assoc($sql)){
	  $units[] = array('jurisdiction' => $row[juris],
						 	 				'zone' => $row[zone],
                      'unit' => $row[unit],
                      'type' => $resource_types[$row[type]],
                      'name' => $row[name],
                      'inc' => $row[inc],
                      'status' => $row[status],
                      'location' => $row[location],
                      'last_comm' => $row[last_comm]);
	 }
	 
	 $return = array('units' => $units);
	}
 //Get areas for this dispatch	
 }else if($function=='areas'){
  if($mode=='agency'){
   $sql = mysqli_query($con, "SELECT * FROM $db.dispatch_zones WHERE state = '$_REQUEST[state]' GROUP BY agency ORDER BY agency ASC");
	 while($row = mysqli_fetch_assoc($sql)){
	  $return[] = $row[agency];
	 }
  }else if($mode=='unit'){
   $sql = mysqli_query($con, "SELECT * FROM $db.dispatch_zones WHERE state = '$_REQUEST[state]' AND agency = '$_REQUEST[agency]' ORDER BY unit ASC");
	 while($row = mysqli_fetch_assoc($sql)){
	  $return[] = array($row[unit], $row[area]);
	 }
  }
 }

 echo json_encode(array('response' => $return), JSON_PRETTY_PRINT);
 mysqli_close($con);
#}
?>