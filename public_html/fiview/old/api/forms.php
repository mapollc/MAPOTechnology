<?
session_start();
header('Content-type: application/json');
include('../config.inc.php');
date_default_timezone_set($_SESSION[timezone]);

$agency = strtoupper($_SESSION[agency]);
$function = $_REQUEST['function'];
$mode = $_REQUEST[mode];
$start = strtotime('1/1/'.date('Y').' 00:00:00');
$end = strtotime('12/31/'.date('Y').' 23:59:59');
$time = time();

if(!isset($_REQUEST)){

}else{
 if($function=='incident'){
  $name = mysqli_real_escape_string($con, ($_REQUEST[name] ? $_REQUEST[name] : 'Inc '.$_REQUEST[inc]));
  $reported = strtotime($_REQUEST[date].' '.$_REQUEST[time]);
	
  $start = 0;
  foreach($_REQUEST as $k => $d) {
	 if($k=='t'){$start=1;}else if($k=='contain_date'){$start=0;}else if($k=='fire_cause'){$start=1;}	 
	 if($start==1&&$k!='dispatcher'){
	  $detarr[$k] = $d;
	 }
  }
  $details = mysqli_real_escape_string($con, serialize($detarr));
  $status = mysqli_real_escape_string($con, serialize(array('contain' => strtotime($_REQUEST[contain_date].' '.$_REQUEST[contain_time]),
 																														'control' => strtotime($_REQUEST[control_date].' '.$_REQUEST[control_time]),
																														'out' => strtotime($_REQUEST[out_date].' '.$_REQUEST[out_time]))));
	
  $exist = mysqli_num_rows(mysqli_query($con, "SELECT * FROM $db.incidents WHERE aid = '$agency' AND num = '$_REQUEST[inc]' AND (reported >= $start AND reported <= $end)"));

  if($exist > 0 && $_REQUEST[form_mode]!='edit'){
   //Incident number already exists, change incident number before submission
	 $r = 1;
  }else{
	 if($mode=='add'){
	  logEvent($db, $con, 2, 'Created Incident #'.$_REQUEST[juris].'-'.$_REQUEST[inc]);
	  mysqli_query($con, "INSERT INTO $db.incidents (aid,reported,zone,num,name,type,lat,lon,details,status,notified,time,dispatcher) VALUES('$agency','$reported','$_REQUEST[juris]','$_REQUEST[inc]','$name','$_REQUEST[type]','$_REQUEST[lat]','$_REQUEST[lon]','$details','$status','','$time','$_REQUEST[dispatcher]')");
	  $r = 2;
   }else if($mode=='edit'){
    mysqli_query($con, "UPDATE $db.incidents SET reported = '$reported', zone = '$_REQUEST[juris]', num = '$_REQUEST[inc]', name = '$name', type = '$_REQUEST[type]', lat = '$_REQUEST[lat]', lon = '$_REQUEST[lon]', details = '$details', status = '$status', dispatcher = '$_REQUEST[dispatcher]' WHERE aid = '$agency' AND id = '$_REQUEST[id]'") or die(mysqli_error($con));
	  $r = 3;	
   }
  }
 }else if($function=='resource'){
  $e = explode('|', ($_REQUEST[active_incidents]=='- Choose -' ? $_REQUEST[pending_incidents] : $_REQUEST[active_incidents]));
	$id = $e[0];
	$inc = $e[1];
	$inc2 = substr($inc, 2, strlen($inc));
	
	if($_REQUEST[no_inc]==1){
	 logEvent($db, $con, 2, array('f' => $_REQUEST[unit], 't' => $dispatcher_initials, 'd' => $resourceStatus[$_REQUEST[status]]));
	 mysqli_query($con, "UPDATE $db.resources SET status = '$_REQUEST[status]', last_comm = '$time' WHERE unit = '$_REQUEST[unit]'");
	}else{
	 $z = explode('-', $inc);
	 if($_REQUEST[status]=='ava'||$_REQUEST[status]=='ins'||$_REQUEST[status]=='ous'){
	  $msg = $resourceStatus[$_REQUEST[status]];
	 }else{
	  $msg = $resourceStatus[$_REQUEST[status]].' '.$resourceGrammar[$_REQUEST[status]].' Incident #'.$inc2;
	 }
	 
	 logEvent($db, $con, 2, array('f' => $_REQUEST[unit], 't' => $dispatcher_initials, 'd' => $msg));
	 mysqli_query($con, "UPDATE $db.resources SET inc = '$inc2', status = '$_REQUEST[status]', last_comm = '$time' WHERE unit = '$_REQUEST[unit]' AND agency = '$agency'");
	 mysqli_query($con, "UPDATE $db.incidents SET notified = IF(notified = '', '$time', notified) WHERE zone = '$z[0]' AND num = '$z[1]' AND aid = '$agency' AND (reported >= '$start' AND reported <= '$end')");
	}
	
	$r = 'success';
 }else if($function=='command'){
  //Command line functions 
	$a = preg_split('/\s/', $_REQUEST[command]);
	
	//Commands to add notes to the log
	if($a[0]=='nt'||$a[0]=='nf'){
	 $msg = implode(' ', array_slice($a, 2));
	 logEvent($db, $con, 2, array('f' => ($a[0]=='nf' ? $a[1] : $dispatcher_initials), 't' => ($a[0]=='nf' ? $dispatcher_initials : $a[1]), 'd' => $msg));
	 	 
	//Commands to change unit status
	}else if($a[0]=='s'){
	 if(count($a)==3){
	  logEvent($db, $con, 2, array('f' => $a[1], 't' => $dispatcher_initials, 'd' => $resourceStatus[$a[2]]));
	  mysqli_query($con, "UPDATE $db.resources SET status = '$a[2]', last_comm = '$time' WHERE unit LIKE '$a[1]'");
	 }else if(count($a)==4){
	  $z = explode('-', $a[3]);
		$inc = strtoupper($a[3]);
		
	  if($a[2]=='ava'||$a[2]=='ins'||$a[2]=='ous'){
	   $msg = $resourceStatus[$a[2]];
	  }else{
	   $msg = $resourceStatus[$a[2]].' '.$resourceGrammar[$a[2]].' Incident #'.$inc;
	  }

	  logEvent($db, $con, 2, array('f' => $_REQUEST[unit], 't' => $dispatcher_initials, 'd' => $msg));
	  mysqli_query($con, "UPDATE $db.resources SET inc = '$inc', status = '$a[2]', last_comm = '$time' WHERE unit LIKE '$a[1]' AND agency = '$agency'");
	  mysqli_query($con, "UPDATE $db.incidents SET notified = IF(notified = '', '$time', notified) WHERE zone LIKE '$z[0]' AND num = '$z[1]' AND aid = '$agency' AND (reported >= '$start' AND reported <= '$end')");
	 }
	}
	
  $r = 'success';
 }
}

echo json_encode(array('return' => array('function' => $function, 'response' => $r)));
?>