<?
/*function createToken($uid, $host, $ip) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['user_id' => $uid, 'time' => time(), 'host' => $host, 'ip' => $ip]);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'MapoLLC.Q.1.w.2.e34', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    return $jwt;
}

function createAccount($con, $fname, $lname, $email, $phone, $password, $time, $location, $thirdParty = 0) {
    $tok = createToken($email, '', $_SERVER['REMOTE_ADDR']);

    mysqli_query($con, "INSERT INTO users (first_name,last_name,email,password,created,phone,location,profilePic,provider) VALUES('$fname','$lname','$email','$password','$time','$phone','$location','','$thirdParty')");
    $uid = mysqli_insert_id($con);
    mysqli_query($con, "INSERT INTO settings (uid,settings,time) VALUES('$uid','','$time')");
    mysqli_query($con, "INSERT INTO trail_settings (uid,settings,time) VALUES('$uid','','$time')");

    if ($thirdParty == 0) {
        mysqli_query($con, "INSERT INTO confirmation (email,token,confirmed) VALUES('$email','$tok','0')");
        sendEmail($email, 'Confirm your new account', 'newaccount', array('{fname}' => $fname, '{email}' => $email, '{token}' => $tok));
    } else {
        sendEmail($email, 'Thanks for confirming your email', 'confirmed', array('{fname}' => $fname, '{email}' => $email));
    }
    
    return true;
}

function login ($con, $row, $time, $host, $ip, $token = null, $thirdParty = 0) {
    $expires = $time + (60 * 60 * 24 * 7);
    $token = ($token ? $token : createToken($row['uid'], $_SERVER['HTTP_HOST'], $_SERVER['REMOTE_ADDR']));

    $_SESSION['uid'] = $row['uid'];
    $_SESSION['first_name'] = $row['first_name'];
    $_SESSION['last_name'] = $row['last_name'];
    $_SESSION['role'] = ($row['role'] == 3 ? 'ADMIN' : ($row['role'] == 2 ? 'PREMIUM' : 'GUEST'));
    $_SESSION['name'] = $row['first_name'] . ' ' . $row['last_name'];
    $_SESSION['expires'] = $expires;
    $_SESSION['settings'] = $row['settings'];

    if ($row['profilePic']) {
        $_SESSION['profilePic'] = $row['profilePic'];
    }

    setcookie('token', $token, time() + (60 * 60 * 24 *7), '/', '.mapofire.com');                

    mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$row[uid]'");
    if ($thirdParty != 2) {
        mysqli_query($con, "INSERT INTO sessions (uid,token,ip,host,source,location,created,expires) VALUES('$row[uid]', '$token', '$ip', '$host', 'mapofire', '','' '$time' ,'$expires')");
    }

    $return = array(
        'uid' => $row['uid'],
        'first_name' => $row['first_name'],
        'last_name' => $row['last_name'],
        'created' => $row['created'],
        'role' => ($row['role'] == 3 ? 'ADMIN' : ($row['role'] == 2 ? 'PREMIUM' : 'GUEST')),
        'token' => $token,
        'location' => unserialize($row['location']),
        'settings' => unserialize($row['settings']),
        'synced' => $row['time']
    );

    if ($thirdParty == 2) {
        $return['redirect'] = 1;
    } else if ($thirdParty != 0 || $row['thirdParty'] != 0) {
        $return['thirdParty'] = 1;
    }

    return $return;
}

$time = time();
$ip = $_SERVER['REMOTE_ADDR'];
$host = $_SERVER['HTTP_USER_AGENT'];

// If user is logging in or creating an account with Google
if ($_REQUEST['google'] == 1) {
    $gtoken = $_REQUEST['token'];

    if ($gtoken) {
        $json = json_decode(file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token='.$gtoken));

        // check to make sure the token originated from us and not somebody else's site
        if ($json->aud == '27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com') {
            // check to make sure token hasn't expired
            if (time() > $json->exp) {
                $out = array('error' => 'The token provided has expired. Try again.');
            } else {
                $email = mysqli_real_escape_string($con, $json->email);

                // check to see if user account is already registered in the database
                $num = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid FROM users WHERE email = '$email'"));
                
                if (isset($_SESSION['uid']) && $num['uid'] == $_SESSION['uid']) {
                    $out = array('error' => 'You are already logged in.');
                } else {
                    // create a new user account with Google
                    if (!$num) {
                        createAccount($con, $json->given_name, $json->family_name, $email, '', '', $time, '', 1);
                    }
                
                    // log the user in with google (or after creating an account if they don't have one)
                    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, u.email, password, u.location, settings, created, role, s.time, confirmed FROM users AS u LEFT JOIN confirmation AS c ON c.email = u.email LEFT JOIN settings AS s ON s.uid = u.uid WHERE u.email = '$email'"));
                    $out = login($con, $row, $time, $host, $ip, $token, 1);
                    $_SESSION['gtoken'] = $gtoken;
                }
            }
        } else {
            $out = array('error' => 'The token provided can\'t be validated for CSFR.');
        }
    } else {
        $out = array('error' => 'No Google oauth token was supplied.');
    }
} else {*/
    // Get user data if already logged in
    if ($_REQUEST['active'] == 1) {
        // default json return
        $out = array('noauth' => 1, 'role' => 'GUEST');
        
        if (($_REQUEST['token'] == $_COOKIE['token'] || $_REQUEST['android'] == 1) && $_SESSION['uid']) {
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT se.expires, settings, u.location, u.created, s.method, s.time FROM users AS u LEFT JOIN sessions AS se ON se.token = '$_REQUEST[token]' LEFT JOIN settings AS s ON s.uid = u.uid WHERE u.uid = '$_SESSION[uid]'"));

            if (time() > $row['expires']) {
                $time = time();
                $expires = $time - (60 * 60 * 24 * 7);
                $token = $_COOKIE['token'];
                
                setcookie('token', '', $expires, '/', '.mapofire.com');
                
                mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$_SESSION[uid]'");
                mysqli_query($con, "UPDATE sessions SET expires = '0' WHERE uid = '$_SESSION[uid]' AND token = '$token'");
                
                $_SESSION = array();
                session_regenerate_id();
            } else {
                $out = array(
                    'uid' => $_SESSION['uid'],
                    'first_name' => $_SESSION['first_name'],
                    'last_name' => $_SESSION['last_name'],
                    'created' => $row['created'],
                    'role' => $_SESSION['role'],
                    'token' => $_COOKIE['token'],
                    'location' => unserialize($row['location']),
                    'settings' => unserialize($row['settings']),
                    'synced' => array('method' => $row['method'], 'time' => $row['time'])
                );
            }
        }
        
    // login protocol
    /*} else if ($_REQUEST['mode'] == 'login') {
        $email = mysqli_real_escape_string($con, $_REQUEST['email']);
        $pass = $_REQUEST['pass'];

        // If redirected from mapotechnology.com domain to add login credentials here too
        if ($_REQUEST['source'] == 'mapotechnology.com' && isset($_REQUEST['token'])) {

            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, u.email, password, u.location, settings, u.created, role, se.time FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid LEFT JOIN settings AS se ON se.uid = s.uid WHERE token = '$_REQUEST[token]'")) or die(mysqli_error($con));
            $out = login($con, $row, $time, $host, $ip, $_REQUEST['token'], 2);

            if ($out['redirect'] == 1) {
                //header('Location: https://www.mapotechnology.com'.($_REQUEST['next'] ? $_REQUEST['next'] : '/account/home'));
                header('Location: https://www.mapotrails.com/api/v1/user?key=c196d0958608ad2b7d4af2be078ecc54&mode=login&source=mapofire.com&token='.$_REQUEST['token'].($_REQUEST['next'] ? '&next='.$_REQUEST['next'] : ''));
            }
        } else {
            // If email and password were entered
            if ($email && $pass) {
                $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, u.email, password, u.location, settings, created, role, s.time, confirmed FROM users AS u LEFT JOIN confirmation AS c ON c.email = u.email LEFT JOIN settings AS s ON s.uid = u.uid WHERE u.email = '$email'"));

                // if the account email doesn't exist
                if (!$row) {
                    $out = array('error' => 2);
                } else {
                    // if the account isn't activated
                    if ($row['confirmed'] == 0) {
                        $out = array('error' => 4);
                    } else {
                        // if the password entered matches the password on file
                        if (password_verify($pass, $row['password'])) {
                            $out = login($con, $row, $time, $host, $ip, $token);
                        } else {
                            $out = array('error' => 3);
                        }
                    }
                }
            } else {
                $out = array('error' => 1);
            }
        }

    // forgot password protocol
    } else if ($_REQUEST['mode'] == 'forgot') {
        $error = false;
        $email = mysqli_real_escape_string($con, $_REQUEST['email']);

        if (!$email) {
            $error = true;
            $msg .= 'You must enter your email address.';
        } else {
            $user = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, first_name, email FROM users WHERE email = '$email'"));

            if (!$user) {
                $error = true;
                $msg .= 'That email address does not exist. Try again.';
            } else {
                $expires = time() + (60 * 60 * 6);
                $token = createToken($user['uid'], 'resetPassword-'.time(), 'mapotechnology.com');
                mysqli_query($con, "UPDATE password_reset SET expires = '0' WHERE uid = '$user[uid]'");
                mysqli_query($con, "UPDATE users SET password = 'PASSWORD_RESET' WHERE uid = '$user[uid]'");
                mysqli_query($con, "INSERT INTO password_reset (uid,token,expires) VALUES('$user[uid]','$token','$expires')");

                sendEmail($email, 'Your account password was reset', 'reset', array('{fname}' => $fname, '{token}' => $token, '{email}' => $email));
                $out = array('success', 1);
            }
        }

        if ($error) {
            $out = array('error' => $msg);
        }
    
    // create account protocol
    } else if ($_REQUEST['mode'] == 'register') {
        $error = false;
        $fname = mysqli_real_escape_string($con, $_REQUEST['first_name']);
        $lname = mysqli_real_escape_string($con, $_REQUEST['last_name']);
        $email = mysqli_real_escape_string($con, $_REQUEST['email']);
        $phone = mysqli_real_escape_string($con, $_REQUEST['phone']);
        $pass = mysqli_real_escape_string($con, $_REQUEST['pass']);
        $cpass = mysqli_real_escape_string($con, $_REQUEST['confirm_pass']);
        $location = mysqli_real_escape_string($con, serialize(json_decode($_REQUEST['location'])));
        $time = time();

        $num = mysqli_num_rows(mysqli_query($con, "SELECT uid FROM users WHERE email = '$email'"));

        if ($num == 0) {
            if (!$fname) {
                $error = true;
                $msg .= 'Please enter your first name.<br>';
            }

            if (!$lname) {
                $error = true;
                $msg .= 'Please enter your last name.<br>';
            }

            if (!$email) {
                $error = true;
                $msg .= 'Please enter your email address.<br>';
            }

            if (!$pass) {
                $error = true;
                $msg .= 'Please enter a secure password.<br>';
            } else {
                if (strlen($pass) < 8) {
                    $error = true;
                    $msg .= 'Your password must be at least 8 characters.<br>';
                }

                if (preg_match('/[0-9]{1,}/', $pass) == 0) {
                    $error = true;
                    $msg .= 'Your password must contain at least 1 number.<br>';
                }

                if (preg_match('/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/', $pass) == 0) {
                    $error = true;
                    $msg .= 'Your password must contain at least 1 symbol.<br>';
                }

                if (preg_match('/[A-Z]{1,}/', $pass) == 0 || preg_match('/[a-z]{1,}/', $pass) == 0) {
                    $error = true;
                    $msg .= 'Your password must have 1 uppercase and 1 lowercase letter.<br>';
                }

                if ($pass != $cpass) {
                    $error = true;
                    $msg .= 'Your passwords don\'t match.<br>';
                }
            }

            if ($pass && !$cpass) {
                $error = true;
                $msg .= 'Please confirm your password.<br>';
            }
        } else {
            $error = true;
            $msg .= 'An account with that email or phone number already exists.';
        }

        if ($error === false) {
            #mysqli_query($con, "INSERT INTO users (first_name,last_name,email,password,created,phone,location,profilePic) VALUES('$fname','$lname','$email','$password','$time','','$location','')");
            #$uid = mysqli_insert_id($con);
            #mysqli_query($con, "INSERT INTO settings (uid,settings,time) VALUES('$uid','','$time')");
            #mysqli_query($con, "INSERT INTO confirmation (email,token) VALUES('$email','$tok')");
            createAccount($con, $fname, $lname, $email, $phone, password_hash($pass, PASSWORD_DEFAULT), $time, $location);

            $out = array('success' => 1);
        } else {
            $out = array('error' => $msg);
        }
    } else {
        $out = array('error' => '403', 'message' => 'No user authentication data supplied');
    }*/
}

$returnJson = $out;
?>