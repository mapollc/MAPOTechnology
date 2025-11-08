<?
$query = $_REQUEST['q'];
$burl = str_replace('{agency}', strtolower($agency), $agencyDomain).'/ajax/api/';

function call($url, $data) {
    $data['session'] = $_SESSION;
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    #curl_setopt($curl, CURLOPT_COOKIE, session_name() . '=' . session_id());
    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));

    $result = curl_exec($curl);
    curl_close($curl);

    return json_decode($result);
}

function addNewIncident($unit, $arr) {
    global $agency;
    global $con;
    global $db;
    global $burl;
    global $settings;
    global $dispatcher_initials;
    global $resource_status;
    $time = time();

    $unit = mysqli_fetch_assoc(mysqli_query($con, "SELECT unit FROM $db.resources WHERE agency = '$agency' AND unit LIKE '$unit'"))['unit'];

    foreach ($arr as $part) {
        if ($part[0] == 'ai') {
            preg_match('/([0-9\.]+),\s?([0-9.-]+)/', $part[1], $loc);
            // location is a lat/lon
            if ($loc) {
                $lat = $loc[1];
                $lon = $loc[2];

                $geo = call($burl.'cad/geo', array('lat' => $lat, 'lon' => $lon));
                $location = $geo->response->geolocation;
                $trs = $geo->response->trs;
                $county = $geo->response->county;
                $state = $geo->response->state;
                $zone = $geo->response->zone;
            } else {
                $lat = '';
                $lon = '';
                $location = rtrim($part[1], ' ');
            }
        }

        if ($part[0] == 't') {
            $type = mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE (aid = 'all' OR aid = '$agency') AND type = 'incident' AND value LIKE '%$part[1]%'"))['value'];
        }

        if ($part[0] == 'n') {
            $notes = $part[1];
        }
    }

    $num = call($burl.'cad/numbering', array('agency' => $agency));
    $id = $num->response->id;
    $incnum = $settings['default_jurisdiction'].'-'.$num->response->nextIncidentName;
    $name = 'Law Enf '.$num->response->nextIncidentName;
    #$id = 52;
    #$incnum = 'ORFWC-012';
    #$name = 'Law Enf 012';
    $sarr = array('primaryUnit' => $unit, 'location' => $location, 'notes' => $notes);

    if ($geo) {
        $sarr['t'] = $trs->t;
        $sarr['r'] = $trs->r;
        $sarr['s'] = $trs->s;
        $sarr['ss'] = $trs->ss;
        $sarr['county'] = $county;
        $sarr['state'] = $state;
        $sarr['zone'] = $zone;
    }

    $details = serialize($sarr);

    mysqli_query($con, "UPDATE $db.incidents SET name = '$name', reported = '$time', notified = '$time', status = 1, zone = '$zone', type = '$type', lat = '$lat', lon = '$lon', details = '$details' WHERE id = '$id'");
    mysqli_query($con, "UPDATE $db.resources SET inc = '$incnum', status = 'ons', last_comm = '$time' WHERE agency = '$agency' AND unit = '$unit'");
    mysqli_query($con, "INSERT INTO $db.incidentResponse (agency,uqid,inc,unit,status,time) VALUES('$agency','$id','$incnum','$unit','ons','$time')");
    logEvent(2, $unit, $dispatcher_initials, $resource_status['ons'].' / Incident '.$incnum, $id);
    
    return 'success';
}

$agency = $_COOKIE['agency'];
$dispatcher_initials = substr($_SESSION['first_name'], 0, 1).substr($_SESSION['last_name'], 0, 1);

// separate unit from commands entered
$cmds = preg_split('/;/', $query);
foreach ($cmds as $q) {
    $call = array();
    preg_match_all('/([A-Za-z0-9]+)\s(.*)/', $q, $match);
    preg_match_all('/([A-Za-z]{1,2}\/)/', $match[2][0], $par);
    $unit = $match[1][0];

    if (count($par[0]) > 1) {
        $rest = preg_split('/([A-Za-z]{1,2})\//', $match[2][0]);

        for ($i = 0; $i < count($par[0]); $i++) {
            $command = str_replace('/', '', $par[0][$i]);
            $text = $rest[$i + 1];
            
            $call[] = array($command, $text);
        }

        # ADD NEW CALL
        if ($call[0][0] == 'ai') {
            $return = addNewIncident($unit, $call);
        }
    } else {
        preg_match('/([A-Za-z]{1,2})\/(.+)/', $match[2][0], $out);
        $command = $out[1];

        # WRITE A NOTE IN THE LOG
        if ($command == 'n') {
            #$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT i.id, juris, num, unit FROM $db.resources AS r LEFT JOIN $db.incidents AS i ON i.juris = SUBSTRING_INDEX(inc, '-', 1) AND i.num = SUBSTRING_INDEX(inc, '-', -1) AND i.aid = r.agency WHERE r.agency = '$agency' AND r.unit LIKE '$unit'"));
            #logEvent(2, $row['unit'], $dispatcher_initials, $c[1], ($row['id'] ? $row['id'] : ''));
            $return = "SELECT i.id, juris, num, unit FROM $db.resources AS r LEFT JOIN $db.incidents AS i ON i.juris = SUBSTRING_INDEX(inc, '-', 1) AND i.num = SUBSTRING_INDEX(inc, '-', -1) AND i.aid = r.agency WHERE r.agency = '$agency' AND r.unit LIKE '$unit'";
        }
    }
}



/*// split multiple queries into an array
foreach (preg_split('/;/', $query) as $q) {
    preg_match_all('/(\s[a-z]+|[a-z]+)\//', $q, $p);
    
    // determine where to split the command
    for ($i = 1; $i < count($p[0]); $i++) {
        $q = str_replace($p[0][$i], '|'.$p[0][$i], $q);
    }

    $h = explode('|', $q);

    // command to deal with resources' status'
    if (explode('/', $h[0])[0] == 'u') {
        foreach ($h as $g) {
            $k = explode('/', $g);
            $key = str_replace(' ', '', $k[0]);

            if ($key == 'u') {
                $e = explode(' ', $k[1]);
                $unit = $e[0];
                $status = $e[1];
            } else if ($key == 'l') {
                $location = $k[1];
            } else if ($key == 'ia') {
                $ia = $k[1];
            }
        }

        $return[] = call($burl.'forms/unit', array('agency' => $agency, 'unit' => $unit, 'status' => $status, 'location' => $location, 'ia' => $ia));
    
    // command to deal with logging a note
    } else if (explode('/', $h[0])[0] == 'n') {
        foreach ($h as $g) {
            $k = explode('/', $g);
            $key = str_replace(' ', '', $k[0]);
        
            if ($key == 'n') {
                $e = explode(' ', $k[1]);
                $unit = $e[0];
            } else if ($key == 't') {
                $note = $k[1];
            }
        }

        $arr = array('agency' => $agency, 'unit' => $unit, 'notes' => $note);
        $inc = mysqli_fetch_assoc(mysqli_query($con, "SELECT inc FROM $db.resources WHERE agency = '$agency' AND unit LIKE '$unit'"))['inc'];
        if ($inc) {
            $arr['inc'] = $inc;
        }

        $return[] = call($burl.'forms/log', $arr);

    // command to deal with adding a new call
    } else if (explode('/', $h[0])[0] == 'ac') {
        foreach ($h as $g) {
            $k = explode('/', $g);
            $key = str_replace(' ', '', $k[0]);

            if ($key == 'ac') {
                $e = explode(' ', $k[1]);
                $unit = $e[0];
                $status = $e[1];
            } else if ($key == 't') {
                $type = $k[1];
            } else if ($key == 'l') {
                $location = $k[1];
            } else if ($key == 'n') {
                $notes = $k[1];
            }
        }

        /*id=37&juris=ORFWC&num=004&name=Incident+004&type=Wildfire&datetime=2023-04-16T10%3A35&lat=45.4422&lon=-117.3580&t=1S&r=44E&s=30&ss=SESE&zone=La+Grande&state=OR&
        county=Wallowa&location=4.6+miles+WNW+of+Enterprise%2C+OR&initial_acres=5&current_acres=&rp=&rp_phone%5B%5D=&rp_phone%5B%5D=&calltaker=1&dispatcher=1&priUnit=&status=1&
        notes=&wind_dir=&wind_spd=&aspect=&slope=&cause=Unknown&control_date=&control_time=&contain_date=&contain_time=&out_date=&out_time=&ic=&ict=0&ic_notes=&behavior1=&behavior2=*/

        //$num = json_decode(call($burl.'cad/numbering', array('agency' => $agency)));
        /*print_r($num);
        $id = $num->response->id;
        $number = $num->response->nextIncidentName;
        $unit = mysqli_fetch_assoc(mysqli_query($con, "SELECT unit FROM $db.resources WHERE agency = '$agency' AND unit LIKE '%$unit%' LIMIT 1"))['unit'];
        $inctype = mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE (aid = 'all' OR aid = '$agency') AND type = 'incident' AND value LIKE '%$type%' LIMIT 1"))['value'];
        $name = ($inctype == 'Law Enforcement' ? 'Law Enf' : 'Incident').' '.$number;
        $arr = array('agency' => $agency, 'juris' => $settings['default_jurisdiction'], 'zone' => $settings['default_zone'], 'name' => $name, 'priUnit' => $unit,
                    'unitstatus' => $status, 'id' => $id, 'num' => $number,
                    'datetime' => date('n/j/Y H:i'), 'status' => 1, 'type' => $inctype, 'location' => $location, 'notes' => $notes,
                    'calltaker' => $_SESSION['uid'], 'dispatcher' => $_SESSION['uid']);

        print_r($arr);
        $return[] = call($burl.'forms/incident', $arr);*/
    /*} else {
        $return[] = array('error' => 'Invalid command type');
    }
}*/
?>