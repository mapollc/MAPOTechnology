<?
function sig($e) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', $e[0].'.'.$e[1], 'MapoLLC.Q1.w.2.e.34', true)));
}

    if ($_REQUEST['verify'] == 1) {
        $pass = $_REQUEST['pass'];
        $e = explode('.', $_REQUEST['token']);
        $num = mysqli_fetch_assoc(mysqli_query($con, "SELECT p.uid, email, expires FROM password_reset AS p LEFT JOIN users AS u ON u.uid = p.uid WHERE token = '$_REQUEST[token]'"));

        // if token doesn't exist
        if ($e[2] != sig($e)) {
            $out = array('v' => 1, 'error' => 6);
        } else if (!$num) {
            $out = array('v' => 1, 'error' => 1);
        } else {
            // emails don't match
            if ($_REQUEST['email'] != $num['email']) {
                $out = array('v' => 1, 'error' => 2);
            // expired
            } else if (time() > $num['expires']) {
                $out = array('v' => 1, 'error' => 3);
            // passwords don't match
            } else if ($pass != $_REQUEST['confirm_pass']) {
                $out = array('v' => 1, 'error' => 4);
            // password failed
            } else if ($pass == '' || strlen($pass) < 8 || preg_match('/[0-9]{1,}/', $pass) == 0 || preg_match('/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/', $pass) == 0 || preg_match('/[A-Z]{1,}/', $pass) == 0 || preg_match('/[a-z]{1,}/', $pass) == 0) {
                $out = array('v' => 1, 'error' => 5);
            // success
            } else {
                $pass = password_hash($_REQUEST['pass'], PASSWORD_DEFAULT);
                mysqli_query($con, "UPDATE password_reset SET expires = '0' WHERE uid = '$num[uid]'");
                mysqli_query($con, "UPDATE users SET password = '$pass' WHERE uid = '$num[uid]'");

                $out = array('v' => 1, 'success' => 1);
            }
        }
    } else {
        $error = 0;
        $email = mysqli_real_escape_string($con, $_REQUEST['email']);

        if (!$email) {
            $out = array('error' => 1);
        } else {
            $user = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, first_name, email FROM users WHERE email = '$email'"));

            if (!$user) {
                $out = array('error' => 2);
            } else {
                $expires = time() + 600;
                $token = createToken($user['uid'], 'resetPassword-'.time(), 'mapotechnology.com');
                /*mysqli_query($con, "UPDATE password_reset SET expires = '0' WHERE uid = '$user[uid]'");
                mysqli_query($con, "UPDATE users SET password = 'PASSWORD_RESET' WHERE uid = '$user[uid]'");
                mysqli_query($con, "INSERT INTO password_reset (uid,token,expires) VALUES('$user[uid]','$token','$expires')");*/

                sendEmail($email, 'Your account password was reset', 'reset', array('{fname}' => $user['first_name'], '{token}' => $token, '{email}' => $user['email']));
                $out = array('success' => 1);
            }
        }
    }

    echo json_encode($out);
?>