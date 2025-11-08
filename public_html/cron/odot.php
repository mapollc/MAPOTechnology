<?
ini_set('display_errors', 1);
date_default_timezone_set('America/Los_Angeles');
include('../db.ini.php');

function r($t){
    if (substr($t, 0, 1)=='I') {
        return str_replace('I', 'I-', $t);
    } else {
        return str_replace('US', 'US-', str_replace('OR', 'ORE', $t));
    }
}

function lanes($t){
    return implode(', ', array_unique(explode(', ', str_replace('M', 'Median', str_replace('S', 'Shldr', substr($t, 0, -2))))));
}

function send($id, $t, $type){
    global $con;

    $r = '';
    $headers = 'From: odot-notifications@mapotechnology.com';
    
    $e = explode('|', wordwrap($t, 130, '|'));
    for ($i=0;$i<count($e);$i++) {
        $r .= $e[$i].'
';
        mail('5412409140@vtext.com', '', $e[$i], $headers);
    }
    
    mysqli_query($con, "INSERT INTO road_inc_sent (incident_id) VALUES('$id')");
    return $r;
}

function type($c, $s){
    if($s=='120'){$r='Wildfire';}
    else if($s=='465'){$r='Closure';}
    else if($s=='254'){$r='Road Obstruction';}
    else if($s=='275'){$r='Animal on Road';}
    else if($s=='280'){$r='Struck Animal';}
    else if($s=='290'){$r='Tree Down';}
    else if($s=='305'){$r='High Water';}
    else if($s=='370'){$r='Crash';}
    else if($s=='390'){$r='Vehicle Fire';}
    else if($s=='405'){$r='Disabled Vehicle';}
    else if($s=='192'){$r='Ramp Gate Down';}
    else{
        if($c=='VH'){$r='Vehicle Incident';}
        else if($c=='WT'){$r='Weather Event';}
        else if($c=='OB'){$r='Obstruction';}
        else if($c=='LE'){$r='Agency Assist';}
    }
    return $r;
}

function ODOT($u) {
    $url = "https://api.odot.state.or.us/tripcheck/Incidents?IsActive=true";
    $curl = curl_init($url);

    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

    # Request headers
    $headers = array(
        'Cache-Control: no-cache',
        'Ocp-Apim-Subscription-Key: '.$u,);
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

    $resp = curl_exec($curl);
    curl_close($curl);

    return json_decode($resp);
}

$sql = mysqli_query($con, "SELECT * FROM road_inc_sent");
while ($row = mysqli_fetch_assoc($sql)) {
    $incs[] = $row['incident_id'];
}

$t = time() - 604800;
$mps = array(array('248','287'), array('0','2.41'), array('21','47'), array('0','5'), array('5','16.5'), array('16.51','32.35'), array('0','22.07'), array('0','22.9'));
$routes = array('I-84','ORE82','ORE244','US-30','ORE203','ORE237','ORE237','ORE203');
$hwyid = array('006','010','341','066','066','066','342','340');
$locations = array('OLD OREGON TRAIL','WALLOWA LAKE','UKIAH-HILGARD','LA GRANDE-BAKER','LA GRANDE-BAKER','LA GRANDE-BAKER','COVE','MEDICAL SPRINGS');

$json = ODOT('3bd2f1c1c6bd40b5b9c00c44a6241209')->incidents;
#$json = json_decode(file_get_contents('https://api.odot.state.or.us/tripcheck/Incidents?IsActive=true&key=3bd2f1c1c6bd40b5b9c00c44a6241209&format=json'))->incidents;

for ($i = 0; $i < count($json); $i++) {
    $id = $json[$i]->{'event-id'};
    $r = r($json[$i]->location->{'route-id'});
    $loc = $json[$i]->location->{'location-name'};
    $smp = $json[$i]->location->{'start-location'}->{'start-milepost'};
    $type = type($json[$i]->{'event-type-id'}, $json[$i]->{'event-subtype-id'});
    $lanes = '';
    
    if ($json[$i]->{'event-type-id'} == 'VH' || $json[$i]->{'event-type-id'} == 'WT' || $json[$i]->{'event-type-id'} == 'OB' || $json[$i]->{'event-type-id'} == 'LE' || $json[$i]->{'event-type-id'} == 'MS'){
        if (in_array($r, $routes) && in_array($loc, $locations)){
            if ($r == 'I-84' && ($smp >= $mps[0][0] && $smp <= $mps[0][1]) ||
                $r == 'ORE82' && ($smp >= $mps[1][0] && $smp <= $mps[1][1]) ||
                $r == 'ORE244' && ($smp >= $mps[2][0] && $smp <= $mps[2][1]) ||
                $r == 'US-30' && ($smp >= $mps[3][0] && $smp <= $mps[3][1]) ||
                $r == 'ORE203' && ($smp >= $mps[4][0] && $smp <= $mps[4][1]) ||
                $r == 'ORE237' && ($smp >= $mps[5][0] && $smp <= $mps[5][1]) ||
                $r == 'ORE237' && ($smp >= $mps[6][0] && $smp <= $mps[6][1]) ||
                $r == 'ORE203' && ($smp >= $mps[7][0] && $smp <= $mps[7][1])) {
            
                $mp = $smp.($json[$i]->location->{'end-location'}->{'end-milepost'} ? '-'.$json[$i]->location->{'end-location'}->{'end-milepost'} : '');
                $dir = ($json[$i]->location->direction ? ' '.$json[$i]->location->direction : '');
                $ln = $json[$i]->{'travel-lanes'}->{'affected-lanes'};
                $when = date('m/j/y H:i', strtotime($json[$i]->{'create-time'}));
                
                foreach($ln as $l){
                    $lanes .= $l->{'lane-id'}.', ';
                    $old = $l->direction;
                }
                $lanes = lanes($lanes);;
                
                if(!in_array($id, $incs)){	
                    $msg = send($id, '['.$loc.'] ('.$type.') '.$mp.' '.$r.$dir.': '.$json[$i]->headline.($lanes ? ' [Lanes Affected: '.$lanes.']' : '').' ('.$when.') / Event #'.$id, $type);
                    echo $msg.'
';
                }
            }
        }
    }
}
?>