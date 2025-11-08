<?
# FWAC DISPATCH SYSTEM CONFIGURATION SETTINGS

ini_set('display_errors',1);
error_reporting(E_ERROR);

$software_build = '1.0';
$software_name = 'WildUSA CAD';
$software_suite = 'WildUSA';
$software_company = 'Fire, Weather & Avalanche Center';
$company_logo = 'https://www.fireweatheravalanche.org/assets/images/fwac_side_logo_transparent.png';
$software_logo = 'https://www.fireweatheravalanche.org/assets/images/fwac_side_logo_transparent.png';
$versions = array('leaflet' => '1.7.1', 'jquery' => '3.6.0', 'bootstrap' => '5.0.2');

# FWAC DISPATCH SYSTEM CONFIGURATION SETTINGS

$db = 'fwavyc5_wildusa';
$baseurl = 'https://wildusa.wildfiremap.org';

function logEvent($db, $con, $which, $action){
 $time = time();
 $action = (is_array($action)===true ? serialize($action) : $action);
 $details = mysqli_real_escape_string($con, $action);
 mysqli_query($con, "INSERT INTO $db.log (agency,which,details,time,uid) VALUES('$_SESSION[user_agency]',$which,'$details','$time',$_SESSION[uid])");
 return true;
}

$host = 'localhost';
$user = 'fwavyc5_wildusa';
$pass = 'wildusa2020';

$con = mysqli_connect($host, $user, $pass);
if(!$con){ die('Could not connect: ' . mysqli_connect_error()); }
mysqli_select_db($con, "wildusa");

$agency = strtoupper($_SESSION[agency]);
$ag = mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'settings'"));
$settings = unserialize($ag[value]);
$dispatcher_initials = substr($_SESSION[first_name], 0, 1).substr($_SESSION[last_name], 0, 1);

date_default_timezone_set($settings[timezone]);

$states_array = array(
    'AL'=>'Alabama',
    'AK'=>'Alaska',
    'AZ'=>'Arizona',
    'AR'=>'Arkansas',
    'CA'=>'California',
    'CO'=>'Colorado',
    'CT'=>'Connecticut',
    'DE'=>'Delaware',
    'DC'=>'District of Columbia',
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

$fuel_types = array('Timber','Grass','Slash','Reprod','Logs','Duff','Snags');
$dir = array('N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW');
foreach($dir as $b){
 $directional .= '<option value="'.$b.'">'.$b.'</option>';
}

$resource_types = array('AA' => 'Air Attack', 'AT' => 'Air Tanker', 'C' => 'Hand Crew',
												'D' => 'Dozer', 'E' => 'Engine', 'H' => 'Helicopter', 'IHC' => 'Hotshot Crew',
												'LE' => 'Law Enforcement', 'LP' => 'Lead Plan', 'LK' => 'Lookout', 'OTHR' => 'Other', 'OVR' => 'Overhead', 
												'WT' => 'Water Tender');

$resourceStatus = array('ins' => 'In Service', 'ava' => 'Available', 'enr' => 'Enroute', 'ons' => 'On-Scene', 'lea' => 'Leaving Scene',
    										'com' => 'Committed', 'not' => 'Notified', 'avos' => 'Available On-Scene', 'ous' => 'Out of Service');

$resourceGrammar = array('ins' => '', 'ava' => 'Available', 'enr' => 'to', 'ons' => 'at', 'lea' => 'of',
    										'com' => 'to', 'not' => 'of', 'avos' => 'at', 'ous' => '');
?>