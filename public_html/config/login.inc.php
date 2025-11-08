<?
function loginAttempt() {
    $ip = $_SERVER['REMOTE_ADDR'];

    $_SESSION['sameIP'] = ($ip == $_SESSION['loginIP'] ? true : false);
    $_SESSION['loginIP'] = $ip;
    $_SESSION['login_attempts'] += 1;

    if ($_SESSION['login_attempts'] > 4 || ($_SESSION['login_attempts'] > 3 && $_SESSION['sameIP'] == 0) || isset($_SESSION['new_login_time'])) {
        unset($_SESSION['login_attempts']);
        $_SESSION['new_login_time'] = time() + 900;

        if ($_SESSION['sameIP'] == 0) {
            echo 'Too many failed login attempts. Please try again in 15 minutes.';
        } else {
            header('Location: ../secure/login?error=6');
        }
        
        exit();
    }
}

function googleLogin($gtoken) {
    global $con;
    global $time;

    if ($gtoken) {
        $json = json_decode(file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . $gtoken));

        // check to make sure the token originated from us and not somebody else's site
        if ($json->aud == '27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com') {
            // check to make sure token hasn't expired
            if ($time > $json->exp) {
                $out = array('error' => 'The token provided has expired. Try again.');
            } else {
                $email = mysqli_real_escape_string($con, $json->email);

                // check to see if user account is already registered in the database
                $num = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, provider FROM users WHERE email = '$email'"));

                if (isset($_SESSION['uid']) && $num['uid'] == $_SESSION['uid']) {
                    $out = array('error' => 'You are already logged in.');
                } else {
                    // create a new user account with Google
                    if (!$num) {
                        createAccount($con, $json->given_name, $json->family_name, $email, '', $time, '', 1);
                    } else {
                        // link google account to existing account
                        if ($num['provider'] == 0) {
                            mysqli_query($con, "UPDATE users SET provider = '1' WHERE uid = '$num[uid]'");
                        }
                    }

                    // log the user in with google (or after creating an account if they don't have one)
                    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, u.email, password, location, settings, created, role, s.time, confirmed FROM users AS u LEFT JOIN confirmation AS c ON c.email = u.email LEFT JOIN settings AS s ON s.uid = u.uid WHERE u.email = '$email'"));
                    $token = createToken(['user_id' => $row['uid']]);

                    login($con, $row, $token, 1);
                    $_SESSION['gtoken'] = $gtoken;

                    if ($_REQUEST['android'] == 1) {
                        $out = array('token' => $token);
                    } else {                        
                        $out = array('success' => returnURL($token, $_REQUEST));
                    }
                }
            }
        } else {
            $out = array('error' => 'The token provided can\'t be validated for CSFR.');
        }
    } else {
        $out = array('error' => 'No Google oauth token was supplied.');
    }

    return $out;
}

$time = time();

// If user is logging in or creating an account with Google
if ($_REQUEST['google'] == 1) {
    echo json_encode(googleLogin($_REQUEST['token']));
} else {
    $error = 0;
    $email = mysqli_real_escape_string($con, $_REQUEST['email']);
    $pass = $_REQUEST['pass'];

    // If email and password were entered
    if ($email && $pass) {
        // if there were too many failed login attempts
        if (isset($_SESSION['new_login_time']) && $time <= $_SESSION['new_login_time']) {
            $retry = round(($_SESSION['new_login_time'] - $time) / 60);

            if ($_SESSION['sameIP'] == 0) {
                echo 'Too many failed login attempts. Please try again in '.$retry.' minutes.';
            } else {
                header('Location: ../secure/login?error=6&retry='.$retry);
            }
            exit();
        } else {
            unset($_SESSION['new_login_time']);
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, u.email, password, location, created, role, confirmed FROM users AS u LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = '$email'"));
            $token = createToken(['user_id' => $row['uid']]);

            // if the account email doesn't exist
            if (!$row) {
                $error = 2; 
                loginAttempt();
            } else {
                // if the account isn't activated
                if ($row['confirmed'] == 0) {
                    $error = 4;
                } else {
                    // if the password entered matches the password on file
                    if (password_verify($pass, $row['password'])) {
                        echo login($con, $row, $token, 1, $_REQUEST['source']);
                    } else {
                        $error = 3;
                        loginAttempt(); 
                    }
                }
            }
        }
    } else {
        $error = 1;
    }

    if ($error == 0) {
        // url to return the user to
        header('Location: '.returnURL($token, $_REQUEST));
    } else {
        // if there is any login errors
        header('Location: ../secure/login?error=' . $error.($_REQUEST['source'] ? '&src='.$_REQUEST['source'] : '').($_REQUEST['next'] ? '&next='.$_REQUEST['next'] : ''));
    }
}