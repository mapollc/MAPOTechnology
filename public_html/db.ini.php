<?
require_once '/home/mapo/apiKey.ini.php';
require '/home/mapo/public_html/vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

# load mysqli connection & tools
require_once '/home/mapo/database.inc.php';

$tokenDomain = 'https://www.mapotechnology.com';
$secretKey = 'MapoLLC.Q1.w.2.e.34';
$jqueryVersion = '3.6.4';

/*function memcached($key, $data = '', $expires = 0) {
    $memcached = new Memcached();
    $memcached->addServer('127.0.0.1', 11211); 
    $response = $memcached->get($key);

    if ($response) {
        return $response;
    } else {
        $memcached->set($key, $data, $expires);
        return null;
    }
}*/

function plural($v)
{
    return $v > 1 ? 's' : '';
}

function ago($timestamp) {
    if ($timestamp == 0) {
        return 'Never';
    }

    $diff = time() - (int) $timestamp;

    if ($diff < 10) {
        return 'Just now';
    }

    $units = [
        31536000 => 'year',
        2628000 => 'month',
        604800 => 'week',
        86400 => 'day',
        3600 => 'hour',
        60 => 'min',
        1 => 'sec',
    ];

    foreach ($units as $seconds => $unit) {
        if ($diff >= $seconds) {
            $value = floor($diff / $seconds);
            $remainder = $diff % $seconds;

            $result = $value . ' ' . $unit . plural($value);

            if ($remainder > 0) {
                $foundNext = false;
                foreach($units as $nextSeconds => $nextUnit){
                    if($foundNext){
                        $remainderValue = floor($remainder / $nextSeconds);
                        if($remainderValue > 0){
                            $result .= ', ' . $remainderValue . ' ' . $nextUnit . plural($remainderValue);
                            break;
                        }
                    }
                    if($seconds === $nextSeconds){
                        $foundNext = true;
                    }
                }

            }

            return $result . ' ago';
        }
    }

    return 'Unknown';
}

function until($timestamp) {
    $diff = (int) $timestamp - time();

    if ($diff < 10) {
        return 'Just now';
    }

    $units = [
        31536000 => 'year',
        2419200 => 'month',
        604800 => 'week',
        86400 => 'day',
        3600 => 'hour',
        60 => 'min',
        1 => 'sec',
    ];

    foreach ($units as $seconds => $unit) {
        if ($diff >= $seconds) {
            $value = floor($diff / $seconds);
            $remainder = $diff % $seconds;

            $result = $value . ' ' . $unit . plural($value);

            if ($remainder > 0 && isset($units[array_search($unit, array_values($units)) +1])) {
                $remainderUnit = array_values($units)[array_search($unit, array_values($units)) +1];
                $remainderSeconds = array_search($remainderUnit, $units);
                $remainderValue = floor($remainder / $remainderSeconds);
                if($remainderValue > 0){
                    $result .= ', ' . $remainderValue . ' ' . $remainderUnit . plural($remainderValue);
                }

            }

            return $result;
        }
    }

    return 'Unknown';
}

function getUserRole($r)
{
    switch ($r) {
        case 1:
            $p = 'GUEST';
            break;
        case 2:
            $p = 'PREMIUM';
            break;
        case 3:
            $p = 'ADMIN';
            break;
        case 4:
            $p = 'TRAIL MODERATOR';
            break;
    }

    return $p;
}

function agent($ua) {
    $version = $ua->ua->major.($ua->ua->minor != 0 ? '.'.$ua->ua->minor : '').($ua->ua->patch != 0 ? '.'.$ua->ua->patch : '');
    $osVersion = $ua->os->major.($ua->os->minor != 0 ? '.'.$ua->os->minor : '').($ua->os->patch != 0 ? '.'.$ua->os->patch : '');

    return ($ua->device->family != 'Other' ? str_replace('Generic_', '', $ua->device->brand).' '.$ua->device->model.' using ' : '').$ua->ua->family.($version ? " ($version)" : '')." on ".$ua->os->family." $osVersion";
}

function createToken($payload, $expires = null)
{
    global $tokenDomain;
    global $secretKey;
    
    $payload['iss'] = $tokenDomain;
    $payload['aud'] = $tokenDomain;
    $payload['iat'] = time();
    $payload['nbf'] = time();
    $payload['exp'] = $expires != null ? $expires : time() + 60 * 60 * 24 * 7;
    $payload['host'] = $_SERVER['HTTP_USER_AGENT'];
    $payload['ip'] = $_SERVER['REMOTE_ADDR'];

    return JWT::encode($payload, $secretKey, 'HS256');
}

function decodeToken($token)
{
    global $secretKey;

    JWT::$leeway = 60;
    return (array) JWT::decode($token, new Key($secretKey, 'HS256'));
}

function validToken($token)
{
    global $tokenDomain;

    try {
        $decoded = decodeToken($token);

        if (!isset($decoded['iss']) || (isset($decoded['iss']) && rtrim($decoded['iss'], '/') == $tokenDomain)) {
            return true;
        } else {
            return false;
        }
    } catch (Firebase\JWT\ExpiredException) {
        return false;
    } catch (Firebase\JWT\BeforeValidException) {
        return false;
    } catch (Firebase\JWT\SignatureInvalidException) {
        return false;
    } catch (Exception $e) {
        return false;
    }
}

function logEvent($action, $system = false, $uid = null)
{
    global $con;
    global $_SESSION;
    $ip = $_SERVER['REMOTE_ADDR'];
    $time = time();
    $action = mysqli_real_escape_string($con, $action);
    $uid = $system ? 0 : ($uid != null ? $uid : $_SESSION['uid']);

    mysqli_query($con, "INSERT INTO log (uid,action,ip,time) VALUES('$uid','$action','$ip','$time')");
}

function sendEmail($to, $subject, $template, $fields, $customSignature = false)
{
    $headers = 'From: MAPO LLC <' . ($template == 'newfires' ? 'notifications' : 'no-reply') . '@mapotechnology.com>' . "\r\n" .
        'Reply-To: ' . ($fields['contact'] == 1 ? $fields['{email}'] : 'info@mapotechnology.com') . "\r\n" .
        'MIME-Version: 1.0' . "\r\n" .
        'Content-type: text/html; charset=iso-8859-1' . "\r\n" .
        'X-Mailer: PHP/' . phpversion();

    $file = file_get_contents('/home/mapo/public_html/config/mail/template.php');
    $template = file_get_contents('/home/mapo/public_html/config/mail/' . $template . '.txt');

    $msg = str_replace('{emailTitle}', $template, $file);
    $msg = str_replace('{message}', $template, $file);
    $msg = str_replace('{date}', date('F j, Y - g:i A'), $msg);
    $msg = str_replace('{year}', date('Y'), $msg);

    if (!$customSignature) {
        $msg = str_replace('{signature}', 'Sincerely,<br><br>MAPO LLC<br><a href="mailto:info@mapotechnology.com">info@mapotechnology.com</a>', $msg);
    } else {
        $msg = str_replace('{signature}', 'Stay safe!<br><br>The Map of Fire Team<br><a href="mailto:payments@mapotechnology.com">payments@mapotechnology.com</a>', $msg);
    }

    foreach ($fields as $s => $r) {
        if ($s == '{otp}') {
            $r = '<h3>' . $r . '</h3>';
        }
        $msg = str_replace($s, $r, $msg);
    }

    #return $msg;
    return mail($to, $subject, $msg, $headers) ? true : false;
}

function returnURL($token, $vars)
{
    $source = $vars['source'];
    $validSources = ['mapofire', 'mapotrails', 'apps'];
    $services = ['www.mapofire.com', 'www.mapotrails.com', 'apps.mapotechnology.com'];

    if (in_array($source, $validSources)) {
        $i = array_search($source, $validSources);
        $url = 'https://' . $services[$i] . '/authenticate?token=' . $token . ($vars['next'] ? '&next=' . urlencode($vars['next']) : '');
    } else {
        if ($vars['subscribe'] == 1) {
            $url = '../checkout?price_id=' . $vars['price_id'];
        } else {
            if ($vars['next']) {
                $url = 'https://www.mapotechnology.com' . $vars['next'];
            } else {
                $url = '../account/home';
            }
        }
    }

    // if logging into mapofire
    /*if ($source == 'mapofire') {
        $url = 'https://www.mapofire.com/authenticate?token='.$token.($vars['next'] ? '&next='.urlencode($vars['next']) : '');

    //if user is logging into mapotrails
    } else if ($source == 'mapotrails') {
        $url = 'https://www.mapotrails.com/authenticate?token='.$token.($vars['next'] ? '&next='.urlencode($vars['next']) : '');
    
    //if user is logging into MAPO's Apps platform
    } else if ($source == 'apps') {
        $url = 'https://apps.mapotechnology.com/authenticate?token='.$token.($vars['next'] ? '&next='.urlencode($vars['next']) : '');

    //if user is logging in elsewhere, or default (their account)
    } else {
        $url = ($vars['subscribe'] == 1 ? '../checkout?price_id='.$vars['price_id'] : ($vars['next'] ? 'https://www.mapotechnology.com'.$vars['next'] : '../account/home'));
    }*/

    return $url;
}

function convertState($t, $w = null)
{
    $states = array(
        'AB' => 'ALBERTA',
        'AL' => 'ALABAMA',
        'AK' => 'ALASKA',
        'AZ' => 'ARIZONA',
        'AR' => 'ARKANSAS',
        'BC' => 'BRITISH COLUMBIA',
        'CA' => 'CALIFORNIA',
        'CO' => 'COLORADO',
        'CT' => 'CONNECTICUT',
        'DE' => 'DELAWARE',
        'DC' => 'DISTRICT OF COLUMBIA',
        'FL' => 'FLORIDA',
        'GA' => 'GEORGIA',
        'HI' => 'HAWAII',
        'ID' => 'IDAHO',
        'IL' => 'ILLINOIS',
        'IN' => 'INDIANA',
        'IA' => 'IOWA',
        'KS' => 'KANSAS',
        'KY' => 'KENTUCKY',
        'LA' => 'LOUISIANA',
        'ME' => 'MAINE',
        'MD' => 'MARYLAND',
        'MA' => 'MASSACHUSETTS',
        'MB' => 'MANITOBA',
        'MI' => 'MICHIGAN',
        'MN' => 'MINNESOTA',
        'MS' => 'MISSISSIPPI',
        'MO' => 'MISSOURI',
        'MT' => 'MONTANA',
        'NB' => 'NEW BRUNSWICK',
        'NE' => 'NEBRASKA',
        'NV' => 'NEVADA',
        'NH' => 'NEW HAMPSHIRE',
        'NJ' => 'NEW JERSEY',
        'NM' => 'NEW MEXICO',
        'NS' => 'NOVA SCOTIA',
        'NY' => 'NEW YORK',
        'NC' => 'NORTH CAROLINA',
        'ND' => 'NORTH DAKOTA',
        'NL' => 'NEWFOUNDLAND',
        'OH' => 'OHIO',
        'OK' => 'OKLAHOMA',
        'ON' => 'ONTARIO',
        'OR' => 'OREGON',
        'PA' => 'PENNSYLVANIA',
        'PE' => 'PRINCE EDWARD ISLAND',
        'QC' => 'QUEBEC',
        'RI' => 'RHODE ISLAND',
        'SC' => 'SOUTH CAROLINA',
        'SD' => 'SOUTH DAKOTA',
        'SK' => 'SASKATCHEWAN',
        'TN' => 'TENNESSEE',
        'TX' => 'TEXAS',
        'UT' => 'UTAH',
        'VT' => 'VERMONT',
        'VA' => 'VIRGINIA',
        'WA' => 'WASHINGTON',
        'WV' => 'WEST VIRGINIA',
        'WI' => 'WISCONSIN',
        'WY' => 'WYOMING'
    );

    if ($w == 1 || $w == null) {
        return ucwords(strtolower($states[$t]));
    } else {
        return array_search(strtoupper($t), $states);
    }
}

$statesArray = array(
    'AL' => 'ALABAMA',
    'AK' => 'ALASKA',
    'AZ' => 'ARIZONA',
    'AR' => 'ARKANSAS',
    'CA' => 'CALIFORNIA',
    'CO' => 'COLORADO',
    'CT' => 'CONNECTICUT',
    'DE' => 'DELAWARE',
    'DC' => 'DISTRICT OF COLUMBIA',
    'FL' => 'FLORIDA',
    'GA' => 'GEORGIA',
    'HI' => 'HAWAII',
    'ID' => 'IDAHO',
    'IL' => 'ILLINOIS',
    'IN' => 'INDIANA',
    'IA' => 'IOWA',
    'KS' => 'KANSAS',
    'KY' => 'KENTUCKY',
    'LA' => 'LOUISIANA',
    'ME' => 'MAINE',
    'MD' => 'MARYLAND',
    'MA' => 'MASSACHUSETTS',
    'MI' => 'MICHIGAN',
    'MN' => 'MINNESOTA',
    'MS' => 'MISSISSIPPI',
    'MO' => 'MISSOURI',
    'MT' => 'MONTANA',
    'NE' => 'NEBRASKA',
    'NV' => 'NEVADA',
    'NH' => 'NEW HAMPSHIRE',
    'NJ' => 'NEW JERSEY',
    'NM' => 'NEW MEXICO',
    'NY' => 'NEW YORK',
    'NC' => 'NORTH CAROLINA',
    'ND' => 'NORTH DAKOTA',
    'OH' => 'OHIO',
    'OK' => 'OKLAHOMA',
    'OR' => 'OREGON',
    'PA' => 'PENNSYLVANIA',
    'RI' => 'RHODE ISLAND',
    'SC' => 'SOUTH CAROLINA',
    'SD' => 'SOUTH DAKOTA',
    'TN' => 'TENNESSEE',
    'TX' => 'TEXAS',
    'UT' => 'UTAH',
    'VT' => 'VERMONT',
    'VA' => 'VIRGINIA',
    'WA' => 'WASHINGTON',
    'WV' => 'WEST VIRGINIA',
    'WI' => 'WISCONSIN',
    'WY' => 'WYOMING'
);

$provincesArray = [
    'AB' => 'ALBERTA',
    'BC' => 'BRITISH COLUMBIA',
    'MB' => 'MANITOBA',
    'NB' => 'NEW BRUNSWICK',
    'NL' => 'NEWFOUNDLAND',
    'NS' => 'NOVA SCOTIA',
    'ON' => 'ONTARIO',
    'PE' => 'PRINCE EDWARD ISLAND',
    'QC' => 'QUEBEC',
    'SK' => 'SASKATCHEWAN',
    'NT' => 'NORTHWEST TERRITORIES',
    'NU' => 'NUNAVUT',
    'YT' => 'YUKON',
];