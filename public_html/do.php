<?
#ini_set('display_errors',1);
#error_reporting(E_ALL);
ini_set('session.cookie_domain', '.mapotechnology.com');
#session_set_cookie_params(0, '/', '.mapotechnology.com');
session_start();
include('db.ini.php');

function login($con, $row, $token, $e = 0, $src = null) {
    $time = time();
    $ip = $_SERVER['REMOTE_ADDR'];
    $host = $_SERVER['HTTP_USER_AGENT'];
    $expires = ($e == 1 ? time() + (60 * 60 * 24 * 7) : $row['expires']);

    // get any user subscriptions
    $sub = mysqli_query($con, "SELECT subscription, plan, created, start, end AS ends, active FROM billing WHERE email = '$row[email]' AND active = 1");
    while ($data = mysqli_fetch_assoc($sub)) {
        $subscribe[] = $data;
    }

    unset($_SESSION['login_attempts']);
    $_SESSION['uid'] = $row['uid'];
    $_SESSION['first_name'] = $row['first_name'];
    $_SESSION['last_name'] = $row['last_name'];
    $_SESSION['name'] = $row['first_name'] . ' ' . $row['last_name'];
    $_SESSION['role'] = getUserRole($row['role']);
    $_SESSION['expires'] = $expires;
    $_SESSION['subscriptions'] = json_encode($subscribe);

    setcookie('token', $token, $expires, '/', '.mapotechnology.com', true);

    mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$row[uid]'");
    if ($e == 1) {
        $source = ($src != null ? $src : 'mapotechnology');
        #mysqli_query($con, "UPDATE sessions SET expires = 0 WHERE uid = '$row[uid]' AND ip = '$ip' AND host = '$host' AND source = '$source' AND expires != 0");
        mysqli_query($con, "INSERT INTO sessions (uid,token,ip,host,source,location,created,expires) VALUES('$row[uid]', '$token', '$ip', '$host', '$source', '', '$time' ,'$expires')");
    }

    return true;
}

function createAccount($con, $fname, $lname, $email, $phone, $password, $time, $location, $role, $thirdParty = 0) {
    global $_REQUEST;

    $ip = $_SERVER['REMOTE_ADDR'];
    $tok = createToken(['email' => $email]);

    mysqli_query($con, "INSERT INTO users (first_name,last_name,email,password,ip_address,created,role,phone,location,profilePic,provider) VALUES('$fname','$lname','$email','$password','$ip','$time','$role','$phone','$location','','$thirdParty')");
    $uid = mysqli_insert_id($con);
    mysqli_query($con, "INSERT INTO settings (uid,settings,time) VALUES('$uid','','$time')");
    mysqli_query($con, "INSERT INTO trail_settings (uid,settings,time) VALUES('$uid','','$time')");
    mysqli_query($con, "INSERT INTO oreroads_settings (uid,settings,app_token,time) VALUES('$uid','','','$time')");

    if ($thirdParty == 0) {
        mysqli_query($con, "INSERT INTO confirmation (email,token,confirmed) VALUES('$email','$tok','0')");
        $fields = array('{fname}' => $fname, '{email}' => $email, '{token}' => $tok, '{subscribe}' => ($_REQUEST['subscribed'] == 1 ? '&subscribed=1' : ''));

        sendEmail($email, 'Confirm your new account', 'newaccount', $fields);
    } else {
        sendEmail($email, 'Thanks for confirming your email', 'confirmed', array('{fname}' => $row['first_name'], '{email}' => $email));
    }
    
    return true;
}

if ($_GET['method'] == 'login') {
    require_once('config/login.inc.php');

} else if ($_GET['method'] == 'forgot') {
    require_once('config/forgot.inc.php');

} else if ($_GET['method'] == 'register') {
    require_once('config/register.inc.php');

} else if ($_GET['method'] == 'validate') {
    if ($_REQUEST['token']) {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, u.email, password, u.location, u.created, role, expires FROM users AS u LEFT JOIN sessions AS s ON u.uid = s.uid WHERE s.token = '$_REQUEST[token]'"));
        if (!$row) {
            header('Location: ../secure/login?error=5&next='.urlencode('account/home'));
        } else {
            if (login($con, $row, $_REQUEST['token'], 2)) {
                setcookie('token', $_REQUEST['token'], $row['expires'], '/', '.mapotechnology.com', true);
                header('Location: ../account/home');
            }
        }
    }
} else if ($_GET['method'] == 'confirmation') {
    $token = mysqli_real_escape_string($con, $_REQUEST['oauth_token']);
    $email = $_REQUEST['email'];

    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.first_name, u.email, confirmed FROM confirmation AS c LEFT JOIN users AS u ON u.email = c.email WHERE token = '$token'"));

    // if the token doesn't exist
    if (!$row) {
        $error = true;
        $code = 1;
    } else {
        // if the email has already been confirmed
        if ($row['confirmed'] == 1) {
            $error = true;
            $code = 2;
        // if the email on file matches the email in the link
        } else if ($row['email'] == $email) {
            $error = false;
            mysqli_query($con, "UPDATE confirmation SET confirmed = 1 WHERE token = '$token'");

            sendEmail($email, 'Thanks for confirming your email', 'confirmed', array('{fname}' => $row['first_name'], '{email}' => $email));
        } else {
            $error = true;
            $code = 3;
        }
    }

    // redirect user to mapo tech login with success message
    header('Location: https://www.mapotechnology.com/secure/login?confirm=1&'.($error ? 'error='.$code : 'valid=1'.($_REQUEST['subscribed'] == 1 ? '&subscribed=1' : '')));
}

mysqli_close($con);