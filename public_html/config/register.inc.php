<?
include_once('../subs.inc.php');
foreach ($mapoSubscriptions as $s) {
    $subs[] = $s[($stripeLive ? 'live' : 'test')];
}

$error = false;
$ip = $_SERVER['REMOTE_ADDR'];
$fname = mysqli_real_escape_string($con, $_REQUEST['first_name']);
$lname = mysqli_real_escape_string($con, $_REQUEST['last_name']);
$email = mysqli_real_escape_string($con, $_REQUEST['email']);
$phone = mysqli_real_escape_string($con, $_REQUEST['phone']);
$pass = mysqli_real_escape_string($con, $_REQUEST['pass']);
$cpass = mysqli_real_escape_string($con, $_REQUEST['confirm_pass']);
$location = mysqli_real_escape_string($con, serialize(json_decode($_REQUEST['location'])));
$role = ($_REQUEST['subscribed'] == 1 && in_array($_REQUEST['sid'], $subs) ? 2 : 1);
$time = time();

$num = mysqli_num_rows(mysqli_query($con, "SELECT uid FROM users WHERE email = '$email' OR (phone != '' AND phone = '$phone')"));

if ($num == 0) {
    $exist = false;

    if (!$fname) {
        $error = true;
    }

    if (!$lname) {
        $error = true;
    }

    if (!$email) {
        $error = true;
    }

    if (!$pass) {
        $error = true;
    } else {
        if (strlen($pass) < 8) {
            $error = true;
        }

        if (preg_match('/[A-Z]{1,}/', $pass) == 0) {
            $error = true;
        }

        if (preg_match('/[a-z]{1,}/', $pass) == 0) {
            $error = true;
        }

        if (preg_match('/[0-9]{1,}/', $pass) == 0) {
            $error = true;
        }

        if (preg_match('/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/', $pass) == 0) {
            $error = true;
        }

        if ($pass != $cpass) {
            $error = true;
        }
    }

    if ($pass && !$cpass) {
        $error = true;
    }
} else {
    $exist = true;
}

if (!$exist && !$error) {
    createAccount($con, $fname, $lname, $email, $phone, password_hash($pass, PASSWORD_DEFAULT), $time, $location, $role, $thirdParty = 0);
}

echo json_encode(array('response' => ($exist ? '2' : ($error ? '1' : ($_REQUEST['subscribed'] == 1 ? array('subscribe' => $_REQUEST['sid']) : '3')))));
