<?
include('config.inc.php');

header('Content-type: application/json');
ini_set('display_errors', 0);
ini_set('session.cookie_lifetime', $cookieLength);
ini_set('session.gc_maxlifetime', $cookieLength);
ini_set('session.cookie_domain', $cookieURL);
session_set_cookie_params(0, '/', $cookieURL);

session_start();

if (isset($_POST['action']) && $_POST['action'] == 'login') {
    $user = mysqli_real_escape_string($con, $_POST['user']);
    $pass = $_POST['pass'];
    $time = time();

    if ($_POST['agency'] == '') {
        $error = 2;
    } else {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, first_name, last_name, password, permissions, resetPass, users.agency, timezone, value, agencies.shortname FROM $db.users LEFT JOIN $db.agencies ON agency_id = agency LEFT JOIN $db.config ON aid = agency AND type = 'settings' WHERE username = '$user'"));

        if ($_POST['agency'] != strtolower($row['agency'])) {
            /*header('Location: '.$baseurl.'?error=3&agency='.$_POST['agency']);*/
            $error = 3;
        } else {
            $ipcheck = unserialize($row['value'])['default_ip'];

            if (!validateIP($ipcheck)) {
                $error = 4;
            } else {
                /*if($row['resetPass']==1){
                    $_SESSION['uid'] = $row['uid'];
			        $next = $domain.'/reset-password';			
		        }else{*/
                if (password_verify($pass, $row['password'])) {
                    $_SESSION['expire'] = (time() + 86400);
                    $_SESSION['update'] = time();
                    $_SESSION['uid'] = $row['uid'];
                    $_SESSION['first_name'] = $row['first_name'];
                    $_SESSION['last_name'] = $row['last_name'];
                    $_SESSION['name'] = $row['last_name'] . ', ' . $row['first_name'];
                    $_SESSION['permissions'] = $row['permissions'];
                    $_SESSION['user_agency'] = $row['agency'];
                    $_SESSION['agency'] = $_POST['agency'];
                    $_SESSION['timezone'] = $row['timezone'];

                    setcookie('agency', $row['agency'], ['expires' => $time + $cookieLength, 'path' => '/', 'domain' => $cookieURL, 'samesite' => 'Strict']);
                    setcookie('shortname', $row['shortname'], ['expires' => $time + $cookieLength, 'path' => '/', 'domain' => $cookieURL, 'samesite' => 'Strict']);

                    mysqli_query($con, "UPDATE $db.users SET time = '$time' WHERE uid = '$row[uid]'");
                    //logEvent($db, $con, 'Logged in', $row['uid'], $con);
                    /*header('Location: '.$baseurl.(isset($_REQUEST['r']) ? $_REQUEST['r'] : '/agency/'.$_SESSION['agency'].'/dispatch'));*/
                    #$next = 'https://'.strtolower($_POST['agency']).'.wildusa.wildfiremap.org/cad/';
                    $next = 'https://' . strtolower($_POST['agency']) . '.' . explode('://', $domain)[1] . '/cad';
                } else {
                    $error = 1;
                }
            }
        }
        /*}*/
    }

    if ($error) {
        $return = array('error' => $error);
    } else {
        $return = array('success' => 1, 'next' => $next);
    }

    echo json_encode($return);
}
