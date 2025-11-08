<?
#ini_set('display_errors',1);
#error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');

session_start();

if ($_REQUEST['session']) {
    $_SESSION = $_REQUEST['session'];
}

include('../config.inc.php');
date_default_timezone_set($_SESSION['timezone']);

$agency = strtoupper(($_REQUEST['agency'] ? $_REQUEST['agency'] : $_SESSION['agency']));
$function = $_REQUEST['function'];
$mode = $_REQUEST['mode'];
$start = strtotime('1/1/'.date('Y').' 00:00:00');
$end = strtotime('12/31/'.date('Y').' 23:59:59');
$time = time();

$reported = strtotime(str_replace('T', ' ', $_REQUEST['datetime']));

if (isset($function)) {
    if ($function == 'incident') {
        $name = mysqli_real_escape_string($con, $_REQUEST['name']);
        $reported = strtotime(str_replace('T', ' ', $_REQUEST['datetime']));
        $lat = ($_REQUEST['lat'] ? $_REQUEST['lat'] : 0);
        $lon = ($_REQUEST['lon'] ? $_REQUEST['lon'] : 0);
        $curIncNum = $_REQUEST['juris'].'-'.$_REQUEST['num'];
        $details = serialize(array('t' => $_REQUEST['t'],
                        'r' => $_REQUEST['r'],
                        's' => $_REQUEST['s'],
                        'ss' => $_REQUEST['ss'],
                        'primaryUnit' => $_REQUEST['priUnit'],
                        'state' => $_REQUEST['state'],
                        'county' => $_REQUEST['county'],
                        'location' => $_REQUEST['location'],
                        'initial_acres' => $_REQUEST['initial_acres'],
                        'current_acres' => $_REQUEST['current_acres'],
                        'fuels' => $_REQUEST['fuels'],
                        'notes' => mysqli_real_escape_string($con, $_REQUEST['notes']),
                        'wind_dir' => $_REQUEST['wind_dir'],
                        'wind_spd' => $_REQUEST['wind_spd'],
                        'aspect' => $_REQUEST['aspect'],
                        'slope' => $_REQUEST['slope'],
                        'cause' => $_REQUEST['cause'],
                        'gen_cause' => $_REQUEST['gen_cause'],
                        'spec_cause' => $_REQUEST['spec_cause'],
                        'control_date' => $_REQUEST['control_date'],
                        'control_time' => $_REQUEST['control_time'],
                        'contain_date' => $_REQUEST['contain_date'],
                        'contain_time' => $_REQUEST['contain_time'],
                        'out_date' => $_REQUEST['out_date'],
                        'out_time' => $_REQUEST['out_time'],
                        'rp' => $_REQUEST['rp'],
                        'rp_phone' => $_REQUEST['rp_phone'],
                                                                            'ic' => $_REQUEST['ic'],
                                                                            'ict' => $_REQUEST['ict'],
                                                                            'ic_notes' => $_REQUEST['ic_notes']));
 
        // Double check to make sure there is not another incident with the same name
        $nameTest = mysqli_num_rows(mysqli_query($con, "SELECT name FROM $db.incidents WHERE aid LIKE '$agency' AND name = '$name' AND time >= '$start'"));

	    if ($nameTest <= 1) {																		
	        ## Update the incident in the database
            $sqlQueries .= "UPDATE $db.incidents SET reported = '$reported', juris = '$_REQUEST[juris]', zone = '$_REQUEST[zone]', name = '$name', type = '$_REQUEST[type]', lat = '$lat', lon = '$lon', details = '$details', status = '$_REQUEST[status]', time = '$time', calltaker = '$_REQUEST[calltaker]', dispatcher = '$_REQUEST[dispatcher]' WHERE id = '$_REQUEST[id]';";

	        // if dispatcher adds a new call and assigns a primary unit that hasn't already been added to the call, automatically do it for them
	        $p = mysqli_fetch_assoc(mysqli_query($con, "SELECT reported FROM $db.incidents WHERE id = '$_REQUEST[id]'"));

	        if ($p['reported'] == 0 && $_REQUEST['priUnit']) {
                $status = ($_REQUEST['unitstatus'] ? $_REQUEST['unitstatus'] : 'asgn');
	            $sqlQueries .= "UPDATE $db.resources SET status = '$status', inc = '$curIncNum', last_comm = '$time' WHERE agency = '$agency' AND unit = '$_REQUEST[priUnit]';";
		        $sqlQueries .= "INSERT INTO $db.incidentResponse (agency,uqid,inc,unit,status,time) VALUES('$agency','$_REQUEST[id]','$curIncNum','$_REQUEST[priUnit]','asgn','$time');";
	        }
	 
            // Make specific log entries for specific changes
            if ($_REQUEST['status'] != 3 && $_REQUEST['oldjuris'] && $_REQUEST['oldjuris'] != $_REQUEST['juris']) {
                $oldid = $_REQUEST['oldjuris'].'-'.$_REQUEST['num'];
            
                logEvent(2, '', $dispatcher_initials, 'Incident '.$oldid.' was changed to '.$curIncNum, $_REQUEST['id']);
                $sqlQueries .= "UPDATE $db.resources SET inc = '$curIncNum' WHERE inc = '$oldid';";
            }

            // log event for name change
            if ($_REQUEST['oldname'] && $_REQUEST['oldname'] != $_REQUEST['name']) {  
                logEvent(2, '', $dispatcher_initials, 'Incident '.$curIncNum.' renamed from '.$_REQUEST['oldname'].' to '.$_REQUEST['name'], $_REQUEST['id']);            
            }

            // log event for acreage change
            if ($_REQUEST['oldacres'] != $_REQUEST['current_acres']) {
                logEvent(2, '', $dispatcher_initials, 'Fire size for '.$curIncNum.' was '.($_REQUEST['current_acres'] > $_REQUEST['oldacres'] ? 'in' : 'de').'creased from '.$_REQUEST['oldacres'].' acres to '.$_REQUEST['current_acres'].' acres', $_REQUEST['id']);
            }

            // add notes for primary unit on non fire related incidents
            if ($_REQUEST['priUnit'] != '') {
                if ($_REQUEST['priUnit'] != '' && $_REQUEST['oldprimunit'] == '') {
                    logEvent(2, '', $dispatcher_initials, 'Primary unit for Incident '.$curIncNum.' was assigned to '.$_REQUEST['priUnit'], $_REQUEST['id']);
                } else if ($_REQUEST['priUnit'] != $_REQUEST['oldprimunit']) {
                    logEvent(2, '', $dispatcher_initials, 'Primary unit for Incident '.$curIncNum.' was changed to '.$_REQUEST['priUnit'], $_REQUEST['id']);
                }
            }
                
            // add notes if IC is changed
            if ($_REQUEST['ic'] != $_REQUEST['old_ic'] || $_REQUEST['ict'] != $_REQUEST['old_ict'] && $_REQUEST['ic'] != ''){
                logEvent(2, '', $dispatcher_initials, 'IC for Incident '.$curIncNum.' was changed to '.$_REQUEST['ic'].($_REQUEST['ict']==1 ? ' [trainee]' : '').($_REQUEST['ic_notes'] ? ' ('.$_REQUEST['ic_notes'].')' : ''), $_REQUEST[id]);
            }	
		
            /*if ($_REQUEST['lat'] != '' && $_REQUEST['lon'] != '' && $_REQUEST['oldlat'].$_REQUEST['oldlon'] != $_REQUEST['lat'].$_REQUEST['lon'] && ($_REQUEST['oldlat'] != '' && $_REQUEST['oldlon']!='')) {
                #logEvent(2, '', $dispatcher_initials, 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') location changed from '.$_REQUEST['oldlat'].', '.$_REQUEST['oldlon'].' to '.$_REQUEST['lat'].', '.$_REQUEST['lon'], '');
                echo 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') location changed from '.$_REQUEST['oldlat'].', '.$_REQUEST['oldlon'].' to '.$_REQUEST['lat'].', '.$_REQUEST['lon'];
            
            }
            
            if($_REQUEST['oldtrs'] != $_REQUEST['t'].$_REQUEST['r'].$_REQUEST['s'].$_REQUEST['ss']){
                #logEvent(2, '', $dispatcher_initials, 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') TRS updated to T'.$_REQUEST['t'].' R'.$_REQUEST['r'].' S'.$_REQUEST['s'].($_REQUEST['ss'] ? ', '.$_REQUEST['ss'] : ''), '');
                echo 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') TRS updated to T'.$_REQUEST['t'].' R'.$_REQUEST['r'].' S'.$_REQUEST['s'].($_REQUEST['ss'] ? ', '.$_REQUEST['ss'] : '');

            }*/

            // add notes to log for specific changes made to incident
            if ($_REQUEST['lat'] != '' && $_REQUEST['lon'] != '' && $_REQUEST['oldlat'].$_REQUEST['oldlon'] != $_REQUEST['lat'].$_REQUEST['lon'] && 
                ($_REQUEST['oldlat'] != '' && $_REQUEST['oldlon']!='') ||
                $_REQUEST['oldtrs'] != $_REQUEST['t'].$_REQUEST['r'].$_REQUEST['s'].$_REQUEST['ss'] ||
                $_REQUEST['oldzone'] != $_REQUEST['zone']) {
                $action = 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') geolocation updated ('.($_REQUEST['lat'] && $_REQUEST['lon'] ? 'Coords: '.$_REQUEST['lat'].', '.$_REQUEST['lon'].'; TRS: '.$_REQUEST['t'].' '.$_REQUEST['r'].' S'.$_REQUEST['s'].($_REQUEST['ss'] ? '/'.$_REQUEST['ss'] : '') .
                    '; State: '.$_REQUEST['state'].'; County: '.$_REQUEST['county'].'; ' : '').'Zone: '.$_REQUEST['zone'].'; Location: '.$_REQUEST['location'].')';

                logEvent(2, '', $dispatcher_initials, $action, $_REQUEST['id']);
            }
            
            if($_REQUEST['oldstatus'] && $_REQUEST['oldstatus'] != $_REQUEST['status']){  
                $oldstatus = ($_REQUEST['oldstatus']==1 ? 'open' : ($_REQUEST['oldstatus']==2 ? 'pending' : 'closed'));
                $status = ($_REQUEST['status']==1 ? 'open' : ($_REQUEST['status']==2 ? 'pending' : 'closed'));
                logEvent(2, '', $dispatcher_initials, 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') incident status changed from '.strtoupper($oldstatus).' to '.strtoupper($status), $_REQUEST[id]);

                $statusChanged = 1;
            
            }

            // make a note that the incident was updated
            logEvent(2, '', $dispatcher_initials, 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') was updated', $_REQUEST['id']);
            
            // clear resources from incident when CLOSED, otherwise change incident # if necessary
            if ($_REQUEST['status'] == 3) {
                logEvent(2, '', $dispatcher_initials, 'Incident '.$curIncNum.' ('.$_REQUEST['name'].') was closed', $_REQUEST['id']);
                $getres = mysqli_query($con, "SELECT unit FROM $db.resources WHERE inc = '$curIncNum'");
                while($l = mysqli_fetch_assoc($getres)){
                    logEvent(1, $l['unit'], $dispatcher_initials, 'ava', '');
                    $sqlQueries .= "INSERT INTO $db.incidentResponse (agency,uqid,inc,unit,status,time) VALUES('$agency','$_REQUEST[id]','$curIncNum','$l[unit]','clr','$time');";
                }
                $sqlQueries .= "UPDATE $db.resources SET inc = '', status = 'ava', last_comm = '$time' WHERE inc = '$curIncNum';";
            }
                        
            $r = array('success' => 1, 'statusChanged' => $statusChanged);
        } else {
	        $r = array('error' => 'name');
	    }	
    } else if ($function == 'unit') {
        $clear = array('ava', 'ins', 'ous');
        $e = explode('|', $_REQUEST['inc']);
        $id = $e[0];
        $inc = $e[1];
        $unit = $_REQUEST['unit'];
        $status = $_REQUEST['status'];
        $ia = $_REQUEST['ia'];
        $location = $_REQUEST['location'];
        $timer = $_REQUEST['timer'];
        $inc2 = (in_array($status, $clear) ? '' : $inc);

        // if no incident number is sent with it
        if (!$_REQUEST['inc']) {
            $chc = mysqli_fetch_assoc(mysqli_query($con, "SELECT i.id, unit, r.inc FROM $db.resources AS r LEFT JOIN $db.incidents AS i ON aid = agency AND juris = SUBSTRING_INDEX(inc, '-', 1) AND num = SUBSTRING_INDEX(inc, '-', -1) WHERE agency = '$agency' AND i.time >= '$start' AND unit LIKE '$unit'"));
            if ($chc) {
                $unit = $chc['unit'];
                $id = $chc['id'];
                $inc2 = $chc['inc'];
            }
        }
	
        # Set the unit on a timer if that data is sent in the request
        if ($timer) {
            $sqlQueries .= "UPDATE $db.timers SET cleared = 1 WHERE agency = '$agency' AND unit = '$unit';";
            $sqlQueries .= "INSERT INTO $db.timers (agency,unit,started,timer) VALUES('$agency','$unit','$time','$timer');";
            logEvent(2, '', $dispatcher_initials, 'Timer set for '.$unit.' ('.($timer / 60).' mins)', '');
        }
	
        ## Record the time someone was notified about this incident if this is the first resource assigned to it
        if ($id) {
            $bool = mysqli_fetch_assoc(mysqli_query($con, "SELECT details, notified FROM $db.incidents WHERE notified = 0 AND id = '$id'"));
            $updateFields = "status = 1, notified = '$time'";
            if ($bool['notified'] == 0) {
                $det = unserialize($bool['details']);

                if ($det['primaryUnit'] == '') {
                    $det['primaryUnit'] = $unit;
                    $newdet = serialize($det); 
                    $updateFields .= ", details = '$newdet'";
                    logEvent(2, '', $dispatcher_initials, 'Primary unit for Incident '.$inc2.' was assigned to '.$unit, $id);
                }

                $sqlQueries .= "UPDATE $db.incidents SET $updateFields WHERE id = '$id';";
            }
        }

        $fields = "status = '$status', last_comm = '$time'";
        
        if ($inc2) {
            $fields .= ", inc = '$inc2'";
        }

        if (isset($ia)) {
            $fields .= ", ia = '$ia'";
        }

        if (isset($location)) {
            $fields .= ", location = '$location'";
        }
 
        ## Record the status of the unit in the resources table
        $sqlQueries .= "UPDATE $db.resources SET $fields WHERE agency = '$agency' AND unit LIKE '$unit';";

	    ## Record resources' movement to and from/on or off of incidents
	    if (!in_array($status, $clear)) {
            /*$g = mysqli_fetch_assoc(mysqli_query($con, "SELECT details FROM $db.incidents WHERE id = '$id'"));
            $ispriu = unserialize($g['details']);

            if ($ispriu['primaryUnit'] == '') {
                $ispriu['primaryUnit'] = $unit;
                $rese = serialize($ispriu);
                $sqlQueries .= "UPDATE $db.incidents SET details = '$rese' WHERE id = '$id';";
            }*/

	        $sqlQueries .= "INSERT INTO $db.incidentResponse (agency,uqid,inc,unit,status,time) VALUES('$agency','$id','$inc2','$unit','$status','$time');";
            logEvent(2, $unit, $dispatcher_initials, $resource_status[$status].' / Incident '.$inc2, $id);
	    } else {
            $sqlQueries .= "UPDATE $db.resources SET inc = '' WHERE agency = '$agency' AND unit = '$unit'";
            logEvent(2, $unit, $dispatcher_initials, $unit.' status changed to '.$resource_status[$status], '');
        }
	
	    ## Record the status change in the log
	    if($_REQUEST['location'] != '' && $_REQUEST['location'] != $_REQUEST['oldlocation']){
            logEvent(2, $unit, $dispatcher_initials, 'Location changed: '.$location, '');	
	    }
  
	    $r = array('success' => 1);
    } else if ($function == 'log') {
        $t = strtotime('1/1/'.date('Y').' 00:00:00');
        $e = explode('-', $_REQUEST['inc']);
        $j = $e[0];
        $n = $e[1];
        $notes = mysqli_real_escape_string($con, $_REQUEST['notes']);

        $id = mysqli_fetch_assoc(mysqli_query($con, "SELECT id FROM $db.incidents WHERE aid = '$agency' AND juris = '$j' AND num = '$n' AND time >= '$t'"))['id'];
        logEvent(2, $_REQUEST['unit'], $dispatcher_initials, $notes, ($id ? $id : ''));

	    $r = array('success' => 1);
    } else if ($function == 'relate') {
        $time = time();
        $ct = mysqli_num_rows(mysqli_query($con, "SELECT num1 FROM $db.related WHERE agency = '$agency' AND inc1 = '$_REQUEST[inc1]'"));

        if ($ct == 0) {
            $num1 = mysqli_fetch_assoc(mysqli_query($con, "SELECT CONCAT(juris, '-', num) AS num FROM $db.incidents WHERE aid = '$agency' AND id = $_REQUEST[inc1]"));
            $num2 = mysqli_fetch_assoc(mysqli_query($con, "SELECT CONCAT(juris, '-', num) AS num FROM $db.incidents WHERE aid = '$agency' AND id = $_REQUEST[inc2]"));
            
            $sqlQueries .= "INSERT INTO $db.related (agency,inc1,inc2,dispatcher,time) VALUES('$agency','$_REQUEST[inc1]','$_REQUEST[inc2]','$_SESSION[uid]','$time');";
            $sqlQueries .= "INSERT INTO $db.related (agency,inc1,inc2,dispatcher,time) VALUES('$agency','$_REQUEST[inc2]','$_REQUEST[inc1]','$_SESSION[uid]','$time');";
            logEvent(2, '', $dispatcher_initials, 'Incident '.$num1['num'].' was related to Incident '.$num2['num'], $_REQUEST['inc1']);

            // if they want to close the call after relating it
            if ($_REQUEST['close'] == 1) {
                $sqlQueries .= "UPDATE $db.incidents SET status = 3 WHERE id = '$_REQUEST[inc1]';";
                logEvent(2, '', $dispatcher_initials, 'Incident '.$num1['num'].' status was changed to closed.', $_REQUEST['inc1']);
            }

            if ($_REQUEST['reassign'] == 1) {
                $sql = mysqli_query($con, "SELECT agency, unit FROM $db.resources WHERE agency LIKE '$agency' AND inc = '$num1[num]'");
                while ($row = mysqli_fetch_assoc($sql)) {
                    $sqlQueries .= "UPDATE $db.resources SET inc = '$num2[num]' WHERE agency = '$row[agency]' AND unit = '$row[unit]'";
                }
                logEvent(2, '', $dispatcher_initials, 'Resources assigned to '.$num1['num'].' were reassigned to '.$num2['num'], $_REQUEST['inc1']);
                logEvent(2, '', $dispatcher_initials, 'Resources reassigned to '.$num2['num'].' from '.$num1['num'], $_REQUEST['inc2']);
            }

            $r = array('success' => 1);
        } else {
            $r = array('error' => 1);
        }
    } else if ($function == 'timer') {
        $unit = $_REQUEST['unit'];
        $type = $_REQUEST['type'];
        $timer = $_REQUEST['timer'];
            
        $sqlQueries .= "UPDATE $db.timers SET cleared = 1 WHERE agency = '$agency' AND unit = '$unit';";
        logEvent(2, $unit, $dispatcher_initials, 'Status check for '.$unit.': OK', '');

        if ($type == 'reset') {
            $sqlQueries .= "INSERT INTO $db.timers (agency,unit,started,timer) VALUES('$agency','$unit','$time','$timer');";
            logEvent(2, '', $dispatcher_initials, 'Timer was reset for '.$unit.' (Overdue by: '.str_replace('-', '', $_REQUEST['overdue']).')', '');
        }
        
        $r = array('success' => 1, 'unit' => $unit);	
    }
} else {
    $r = array('error' => 1, 'errorType' => 'An invalid request type was sent');
}

#echo $sqlQueries;
if ($sqlQueries) {
    if (mysqli_multi_query($con, $sqlQueries)) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) { }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) { }
        } while (mysqli_next_result($con));
    }
}

echo json_encode(array('return' => array('function' => $function, 'response' => $r)));
?>