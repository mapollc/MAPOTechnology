<?
# DISPATCH SYSTEM CONFIGURATION SETTINGS

ini_set('display_errors',1);
error_reporting(E_PARSE);

$software_name = 'fiView CAD';
$software_suite = 'fiView';
$software_company = 'MAPO LLC';
$default_version = '1.0';
$company_logo = 'https://www.mapotechnology.com/assets/images/mapo_logo_square_transparent.png';
$software_logo = 'https://www.mapotechnology.com/assets/images/mapo_logo_square_transparent.png';
$versions = array('leaflet' => '1.9.4', 'jquery' => '3.7.0');
$software_versions = array('1.0', '1.0.1');

$domain = 'https://fiview.mapotechnology.com';
$agencyDomain = 'https://{agency}.fiview.mapotechnology.com';
$cookieURL = '.fiview.mapotechnology.com';
$cookieLength = (60 * 60 * 10);
$baseurl = 'https://'.$_SERVER['HTTP_HOST'];
$db = 'mapo_fiview';
$dbHost = 'localhost';
$dbUser = 'mapo_main';
$dbPass = 'smQeP]-xjj+Uw$s_';

# DATABSE CONNECTION
$con = mysqli_connect($dbHost, $dbUser, $dbPass);
if (!$con) {
    die('Could not connect: ' . mysqli_connect_error());
}
mysqli_select_db($con, 'fiview');

# GLOBAL FUNCTIONS
function validateIP($ip){
 /*$iprule = 1;
 preg_match('/107.190.[0-9]+.[0-9]+/', $ip, $output_array);
 return ($ip == $_SERVER['REMOTE_ADDR'] ? true : false);*/
 return true;
}

function getCookieAgency() {
    return explode('.', $_SERVER['HTTP_HOST'])[0];
}

function css($f){
    global $domain;
    global $software_build;
    global $versions;
    $r = '';

    foreach($f as $n){
        if($n=='fonts') { 
            $r .= '<link href="https://fonts.googleapis.com/css2?family=Montserrat&amp;family=Poppins:wght@300;400;500;600&amp;family=Source+Sans+Pro:wght@300;400;600&amp;display=swap" rel="stylesheet">\n';
        } else if($n=='jquery') {
            $r .= '<link href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css" rel="stylesheet">\n';
        } else if($n=='leaflet') {
            $r .= '<link href="https://unpkg.com/leaflet@'.$versions['leaflet'].'/dist/leaflet.css" rel="stylesheet">\n'; 
        } else if($n=='fa') {
            $r .= '<script async defer src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>\n';
        } else {
            $r .= '<link href="'.$domain.'/assets/src/css/'.$software_build.'/'.$n.'.css" rel="stylesheet">\n';
        }
    }
    return str_replace('\n', '
', $r);
}

function js($f){
    global $domain;
    global $software_build;
    global $versions;
    $r = '';

    foreach($f as $n){
        if($n=='jqui') {
            $r .= '<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>\n'; 
        } else if($n=='jquery'){
            $r .= '<script src="https://code.jquery.com/jquery-'.$versions['jquery'].'.min.js"></script>\n';
        } else if($n=='leaflet'){
            $r .= '<script src="https://unpkg.com/leaflet@'.$versions['leaflet'].'/dist/leaflet.js"></script>\n';
        } else{
            $r .= '<script src="'.$domain.'/assets/cad/js/'.$software_build.'/'.$n.'.js"></script>\n';
        }
    }
    
    return str_replace('\n', '
', $r);
}

function javascriptConfig() {
    global $_SESSION;
    global $CADconfig;
    return '<script>var config = '.json_encode($CADconfig).', userPerms = '.json_encode(unserialize($_SESSION['permissions'])).'; Object.freeze(userPerms);</script>';
}

function logEvent(/*$db, $con, */$which, $f, $t, $details, $inc){
    global $db;
    global $con;

    $time = time();
    $action = (is_array($details)===true ? serialize($details) : $details);
    $details = mysqli_real_escape_string($con, $action);
    $uid = ($_SESSION['uid'] ? $_SESSION['uid'] : 0);
    return mysqli_query($con, "INSERT INTO $db.log (agency,which,f,t,details,inc,time,uid) VALUES('$_SESSION[user_agency]','$which','$f','$t','$details','$inc','$time','$uid')") or die(mysqli_error($con));
    #return true;
}

function plural($v){
    return ($v > 1 ? 's' : '');
}

function matheq($diff,$s,$r){
    return floor((($diff/$s)-floor($diff/$s))*$r);
}

function timeAgo($timestamp){
    $diff = time() - (int)$timestamp;
        
    if($diff < 10){ $val = 'Just now'; }
    else if($diff >= 10 && $diff < 60){ $val = $diff.' sec'.plural($diff); }
    else if($diff >= 60 && $diff < 3600){ $val = floor($diff/60).' min'.plural(floor($diff/60)).(matheq($diff,60,60)!=0 ? ', '.matheq($diff,60,60).' sec'.plural(matheq($diff,60,60)) : ''); }
    else if($diff >= 3600 && $diff < 86400){ $val = floor($diff/3600).' hour'.plural(floor($diff/3600)).(matheq($diff,3600,60)!=0 ? ', '.matheq($diff,3600,60).' min'.plural(matheq($diff,3600,60)) : ''); }
    else if($diff >= 86400 && $diff < 172800){ $val = floor($diff/86400).' day'.plural(floor($diff/86400)).(matheq($diff,86400,24)!=0 ? ', '.matheq($diff,86400,24).' hour'.plural(matheq($diff,86400,24)) : ''); }
    else if($diff >= 172800 && $diff < 604800){ $val = floor($diff/86400).' day'.plural(floor($diff/86400)); }
    else if($diff >= 604800 & $diff < 2419200){ $val = floor($diff/604800).' week'.plural(floor($diff/604800)); }
    else if($diff >= 2419200 && $diff < 31536000){ $val = floor($diff/2419200).' month'.plural(floor($diff/2419200)); }
    else if($diff >= 31536000){ $val = floor($diff/31536000).' year'.plural(floor($diff/31536000)); }
        
    return $val.($val!='Just now' ? ' ago' : '');
}

$states_array = array(
    'AL'=>'Alabama',
    'AK'=>'Alaska',
    'AZ'=>'Arizona',
    'AR'=>'Arkansas',
    'CA'=>'California',
    'CO'=>'Colorado',
    'CT'=>'Connecticut',
    'DE'=>'Delaware',
    'DC'=>'D.C.',
    'FL'=>'Florida',
    'GA'=>'Georgia',
    'HI'=>'Hawaii',
    'ID'=>'Idaho',
    'IL'=>'Illinois',
    'IN'=>'Indiana',
    'IA'=>'Iowa',
    'KS'=>'Kansas',
    'KY'=>'Kentucky',
    'LA'=>'Louisiana',
    'ME'=>'Maine',
    'MD'=>'Maryland',
    'MA'=>'Massachusetts',
    'MI'=>'Michigan',
    'MN'=>'Minnesota',
    'MS'=>'Mississippi',
    'MO'=>'Missouri',
    'MT'=>'Montana',
    'NE'=>'Nebraska',
    'NV'=>'Nevada',
    'NH'=>'New Hampshire',
    'NJ'=>'New Jersey',
    'NM'=>'New Mexico',
    'NY'=>'New York',
    'NC'=>'North Carolina',
    'ND'=>'North Dakota',
    'OH'=>'Ohio',
    'OK'=>'Oklahoma',
    'OR'=>'Oregon',
    'PA'=>'Pennsylvania',
    'RI'=>'Rhode Island',
    'SC'=>'South Carolina',
    'SD'=>'South Dakota',
    'TN'=>'Tennessee',
    'TX'=>'Texas',
    'UT'=>'Utah',
    'VT'=>'Vermont',
    'VA'=>'Virginia',
    'WA'=>'Washington',
    'WV'=>'West Virginia',
    'WI'=>'Wisconsin',
    'WY'=>'Wyoming',
);

$agency = strtoupper($_SESSION['agency']);
$rtsql = mysqli_query($con, "SELECT value FROM $db.config WHERE (aid = 'all' OR aid = '$_COOKIE[agency]') AND type = 'resourceType'");
$software_build = mysqli_fetch_assoc(mysqli_query($con, "SELECT version FROM $db.software_version WHERE aid = '$_COOKIE[agency]'"))['version'];
$software_build = ($software_build ? $software_build : $default_version);
$ag = mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$_COOKIE[agency]' AND type = 'settings'"));
$settings = unserialize($ag['value']);
$dispatcher_initials = substr($_SESSION['first_name'], 0, 1).substr($_SESSION['last_name'], 0, 1);

date_default_timezone_set($settings['timezone']);

$fuel_types = array('Timber','Grass','Slash','Reprod','Logs','Duff','Snags');
$dir = array('N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW');
/*foreach($dir as $b){
    $directional .= '<option value="'.$b.'">'.$b.'</option>';
}*/

while($rts = mysqli_fetch_assoc($rtsql)){
    $v = unserialize($rts['value']);
    $resource_types[$v[0]] = $v[1];
}

/*$resource_types = array('AA' => 'Air Attack', 'AT' => 'Air Tanker', 'C' => 'Hand Crew',
																						'D' => 'Dozer', 'E' => 'Engine', 'H' => 'Helicopter', 'IHC' => 'Hotshot Crew',
																						'LE' => 'Law Enforcement', 'LP' => 'Lead Plan', 'LK' => 'Lookout', 'OTHR' => 'Other', 'OVR' => 'Overhead', 
																						'WT' => 'Water Tender');*/

$resource_status = array('asgn' => 'Assigned', 'ava' => 'Available', 'com' => 'Committed', 'enr' => 'Enroute', 'ins' => 'In-Service', 'lea' => 'Leaving Scene',
						'not' => 'Notified', 'ons' => 'On-Scene', 'ous' => 'Out-of-Service');

$resource_lang = array('', 'to', 'to', '', 'of', 'of', 'at', '');

$phoneCarriers = array('txt.att.net' => 'AT&T',
															      'messaging.sprintpcs.com' => 'Sprint',
															      'tmomail.net' => 'T-Mobile',
																					'email.uscc.net' => 'US Cellular',
															      'vtext.com' => 'Verizon');