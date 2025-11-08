<?
class SSO
{
    public $domain;
    public $fields;
    public $con;
    public $source = 'mapotechnology';
    public $nextURL = null;
    public $token = null;
    public $guid;

    function __construct($con, $request)
    {
        global $_COOKIE;

        $this->domain = 'https://www.mapotechnology.com/';
        $this->fields = $request;
        $this->con = $con;
        $this->guid = $_COOKIE['guid'] ? $_COOKIE['guid'] : $this->getGUID();

        if ($request['service']) {
            $this->source = $request['service'];
        }

        if ($request['next']) {
            $this->nextURL = $request['next'];
        }
    }

    function createToken($array, $expires = null)
    {
        $array['iat'] = time();
        $array['exp'] = ($expires != null ? $expires : time() + (60 * 60 * 24 * 7));
        $array['host'] = $_SERVER['HTTP_USER_AGENT'];
        $array['ip'] = $_SERVER['REMOTE_ADDR'];

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($array);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'MapoLLC.Q1.w.2.e.34', true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

        return $jwt;
    }

    function getGUID()
    {
        if (function_exists('com_create_guid')) {
            return com_create_guid();
        } else {
            mt_srand((float)microtime() * 10000);
            $charid = strtoupper(md5(uniqid(rand(), true)));
            $hyphen = chr(45);
            $uuid = chr(123)
                . substr($charid, 0, 8) . $hyphen
                . substr($charid, 8, 4) . $hyphen
                . substr($charid, 12, 4) . $hyphen
                . substr($charid, 16, 4) . $hyphen
                . substr($charid, 20, 12)
                . chr(125);
            return $uuid;
        }
    }

    function decodeToken($token)
    {
        $e = explode('.', $token);

        return json_decode(base64_decode($e[1]));
    }

    function validToken($token)
    {
        $e = explode('.', $token);

        return ($this->getSecretKey($e) == $e[2] ? true : false);
    }

    function validatePassword($pass)
    {
        $error = false;
        $msgs = [];

        if (strlen($pass) < 8) {
            $error = true;
            $msgs[] = 'Your password must be at least 8 characters long.';
        }

        if (preg_match('/[0-9]{1,}/', $pass) == 0) {
            $error = true;
            $msgs[] = 'You password must contain at least 1 number.';
        }

        if (preg_match('/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/', $pass) == 0) {
            $error = true;
            $msgs[] = 'Your password must contain at least 1 symbol.';
        }

        if (preg_match('/[A-Z]{1,}/', $pass) == 0 || preg_match('/[a-z]{1,}/', $pass) == 0) {
            $error = true;
            $msgs[] = 'Your password must at least 1 uppercase and 1 lowercase letter.';
        }

        return [$error, $msgs];
    }

    function getSecretKey($e)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', $e[0] . '.' . $e[1], 'MapoLLC.Q1.w.2.e.34', true)));
    }

    function query($cols = '', $s)
    {
        $q = 'SELECT u.uid, first_name, last_name, u.email, password, u.location, u.created, role, last_active{cols} FROM users AS u';
        return str_replace('{cols}', $cols, $q) . ' ' . $s;
    }

    function in($e)
    {
        $total = $e + 900 - time();

        if ($total < 60) {
            return $total . ' seconds.';
        } else {
            return round($total / 60, 0) . ' minutes';
        }
    }

    function authenticate()
    {
        global $_SESSION;

        // record how many attempts this user has made to login
        if ($_SESSION['login_attempts'] >= 3 && $_SESSION['last_login_attempt'] + 900 < time()) {
            $_SESSION['login_attempts'] = 1;
        } else if ($_SESSION['login_attempts'] < 3 && $_SESSION['last_login_attempt'] + 900 > time()) {
            $_SESSION['login_attempts'] = $_SESSION['login_attempts'] + 1;
        }

        if ($_SESSION['login_attempts'] < 3) {
            $_SESSION['last_login_attempt'] = time();
        }

        $email = mysqli_real_escape_string($this->con, $this->fields['email']);
        $pass = $this->fields['pass'];
        $error = false;

        // brute force protection: if user has tried to login 3 times unsuccessfully, lock their account
        if ($_SESSION['login_attempts'] >= 3 && $_SESSION['last_login_attempt'] + 900 > time()) {
            $error = true;
            $code = 5;
            $when = $this->in($_SESSION['last_login_attempt']);
            $respMsg = 'Your account has been locked due to multiple failed login attempts. Try again in ' . $when . '.';
        } else {
            if (!$email || !$pass) {
                $code = 1;
                $error = true;
                $respMsg = 'You must provide an email address and password.';
            } else {
                $respMsg = '';
                $row = mysqli_fetch_assoc(mysqli_query($this->con, $this->query(', confirmed', "LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = '$email'")));

                if (!$row) {
                    $error = true;
                    $code = 2;
                    $respMsg = 'An account with that email address does not exist.';
                } else {
                    // if user account has not been confirmed yet
                    if ($row['confirmed'] == 0) {
                        $error = true;
                        $code = 3;
                        $respMsg = 'This account has not been confirmed yet. Please check your email.';
                    } else {
                        // if password is correct, do login, otherwise password was incorrect
                        if (password_verify($pass, $row['password'])) {
                            unset($_SESSION['gtoken']);
                            return $this->login($row);
                        } else {
                            $error = true;
                            $code = 4;
                            $respMsg = 'The email and/or password you entered is incorrect.';
                        }
                    }
                }
            }
        }

        if ($error) {
            return array('response' => 'error', 'code' => $code, 'msg' => $respMsg);
        }
    }

    function loginWithGoogle()
    {
        global $_SESSION;
        $error = false;
        $msg = '';
        $time = time();
        $gtoken = $this->fields['token'];

        if ($gtoken) {
            $json = json_decode(file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . $gtoken));

            // check to make sure the token originated from us and not somebody else's site
            if ($json->aud == '27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com') {
                // check to make sure token hasn't expired
                if ($time > $json->exp) {
                    $error = true;
                    $code = 3;
                    $msg = 'The token provided has expired. Try again.';
                } else {
                    $email = mysqli_real_escape_string($this->con, $json->email);

                    // check to see if user account is already registered in the database
                    $num = mysqli_fetch_assoc(mysqli_query($this->con, "SELECT uid, provider FROM users WHERE email = '$email'"));

                    if (!$num) {
                        // TODO: create the account
                    } else {
                        // link google account to existing account
                        if ($num['provider'] == 0) {
                            mysqli_query($this->con, "UPDATE users SET provider = '1' WHERE uid = '$num[uid]'");
                        }
                    }

                    // log the user in with google (or after creating an account if they don't have one)
                    $row = mysqli_fetch_assoc(mysqli_query($this->con, $this->query(', confirmed', "LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = '$email'")));

                    $_SESSION['gtoken'] = $gtoken;
                    return $this->login($row);
                }
            } else {
                $error = true;
                $code = 2;
                $msg = 'The token provided can\'t be validated for CSFR.';
            }
        } else {
            $error = true;
            $code = 1;
            $msg = 'No Google oauth token was supplied.';
        }

        if ($error) {
            return array('response' => 'error', 'code' => $code, 'msg' => $msg);
        }
    }

    function returnURL($next)
    {
        global $method;

        $validSources = ['mapofire', 'mapotrails', 'apps'];
        $services = ['www.mapofire.com', 'www.mapotrails.com', 'apps.mapotechnology.com'];

        if (isset($this->fields['price_id'])) {
            return $this->domain.'checkout?price_id='.$this->fields['price_id'].'&customer_email='.$this->fields['email'].($method == 'register' ? '&first_name='.$this->fields['first_name'].'&last_name='.$this->fields['last_name'].'&next='.urlencode('secure/login?subscribed=1&pid='.$this->fields['price_id']) : '');
        } else {
            if ($this->source != null && $this->source != 'mapotechnology') {
                $key = array_search($this->source, $validSources);
                return 'https://' . $services[$key] . '/authenticate?token=' . $this->token . ($this->source != null ? '&service=' . $this->source : '') . ($next ? '&next=' . $next : '');
            } else {
                return $this->domain.'account/home';
            }
        }
    }

    function getSubscriptions($email)
    {
        $email = mysqli_real_escape_string($this->con, $email);
        $sub = mysqli_query($this->con, "SELECT subscription, plan, created, start, end AS ends, active FROM billing WHERE email = '$email' AND active = 1");
        while ($data = mysqli_fetch_assoc($sub)) {
            $subscribe[] = $data;
        }

        return $subscribe;
    }

    function getUser($row, $expires, $subscribe)
    {
        global $method;

        if ($expires == null) {
            $expires = $row['expires'];
        }

        $token = ($method == 'get' ? $row['token'] : $this->token);

        $out = array(
            'uid' => intval($row['uid']),
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'name' => $row['first_name'] . ' ' . $row['last_name'],
            'email' => $row['email'],
            'role' => getUserRole($row['role']),
            'last_active' => intval($row['last_active']),
            'location' => unserialize($row['location']),
            'expires' => intval($expires),
            'token' => $token,
            'subscriptions' => $subscribe
        );

        if ($method == 'login') {
            $out['confirmed'] = ($row['confirmed'] == 1 ? true : false);
        }

        if (isset($_GET['function'])) {
            $out['settings'] = array('allsettings' => unserialize($row['settings']), 'method' => $row['method'], 'synced' => intval($row['synced']));
        }

        return $out;
    }

    function user()
    {
        if ($_GET['function'] == 'mapofire') {
            $extra = ', settings, method, mf.time AS synced';
            $extra2 = ' LEFT JOIN settings AS mf ON mf.uid = u.uid';
        }

        $token = $this->fields['token'];
        $row = mysqli_fetch_assoc(mysqli_query($this->con, $this->query(', token, expires' . $extra, "LEFT JOIN sessions AS s ON s.uid = u.uid$extra2 WHERE s.token = '$token'")));

        if ($row) {
            if ($row['expires'] == 0 || $row['expires'] < time()) {
                return array('response' => 'error', 'code' => 1, 'msg' => 'The token provided has expired.');
            } else {
                // get any user subscriptions
                $subscribe = $this->getSubscriptions($row['email']);

                return array('user' => $this->getUser($row, null, $subscribe));
            }
        } else {
            return array('response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.');
        }
    }

    function login($row)
    {
        global $_SESSION;
        unset($_SESSION['login_attempts']);
        unset($_SESSION['last_login_attempt']);

        $time = time();
        $expires = $time + (60 * 60 * 24 * 7);
        $ip = $this->fields['ip'];
        $host = $_SERVER['HTTP_USER_AGENT'];
        $this->token = $this->createToken(['user_id' => $row['uid']], $expires);

        // update user activity in database
        mysqli_query($this->con, "UPDATE users SET last_active = '$time' WHERE uid = '$row[uid]'");
        mysqli_query($this->con, "INSERT INTO sessions (uid,token,guid,ip,host,source,location,created,expires) VALUES('$row[uid]', '$this->token', '$this->guid', '$ip', '$host', '$this->source', '', '$time' ,'$expires')");

        // get any user subscriptions
        $subscribe = $this->getSubscriptions($row['email']);

        $_SESSION['uid'] = $row['uid'];
        $_SESSION['first_name'] = $row['first_name'];
        $_SESSION['last_name'] = $row['last_name'];
        $_SESSION['name'] = $row['first_name'] . ' ' . $row['last_name'];
        $_SESSION['role'] = $row['role'];
        $_SESSION['token'] = $this->token;
        $_SESSION['expires'] = $expires;
        $_SESSION['subscriptions'] = json_encode($subscribe);

        setcookie('token', $this->token, $expires, '/', '.mapotechnology.com', true);
        setcookie('guid', $this->guid, time() + (60 * 60 * 24 * 365.25), '/', '.mapotechnology.com', true);

        return array('auth' => true, 'service' => $this->source, 'next' => $this->returnURL($this->nextURL), 'user' => $this->getUser($row, $expires, $subscribe));
    }

    function logout()
    {
        global $_SESSION;
        $invalid = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid token was provided.');
        $this->token = $this->fields['token'];

        if (!$this->token) {
            return $invalid;
        } else {
            $row = mysqli_fetch_assoc(mysqli_query($this->con, "SELECT uid FROM sessions WHERE token = '$this->token'"));

            if ($row) {
                $time = time();
                $uid = $row['uid'];

                setcookie('token', '', $time - (60 * 60 * 24 * 7), '/', '.mapotechnology.com', true);
                $_SESSION = array();
                session_regenerate_id();

                mysqli_query($this->con, "UPDATE users SET last_active = '$time' WHERE uid = '$uid'");
                mysqli_query($this->con, "UPDATE sessions SET expires = '0' WHERE uid = '$uid' AND token = '$this->token'");
            } else {
                return $invalid;
            }
        }
    }

    function forgot()
    {
        $email = mysqli_real_escape_string($this->con, $this->fields['email']);

        if (!$email) {
            return array('response' => 'error', 'code' => 1, 'msg' => 'You must provide an email address.');
        } else {
            $row = mysqli_fetch_assoc(mysqli_query($this->con, "SELECT uid, first_name, email FROM users WHERE email = '$email'"));

            if (!$row) {
                return array('response' => 'error', 'code' => 2, 'msg' => 'You must provide an email address.');
            } else {
                $expires = time() + 600;
                $token = $this->createToken(['uid' => $row['uid'], 'unqiue' => 'resetPassword-' . time()]);

                mysqli_query($this->con, "UPDATE password_reset SET expires = '0' WHERE uid = '$row[uid]'");
                mysqli_query($this->con, "UPDATE users SET password = 'PASSWORD_RESET' WHERE uid = '$row[uid]'");
                mysqli_query($this->con, "INSERT INTO password_reset (uid,token,expires) VALUES('$row[uid]','$token','$expires')");

                sendEmail($row['email'], 'Your account password was reset', 'reset', array('{fname}' => $row['first_name'], '{token}' => $token, '{email}' => $row['email']));

                return array('response' => 'success');
            }
        }
    }

    function reset()
    {
        $pass = $this->fields['pass'];
        $oauth = mysqli_real_escape_string($this->con, $this->fields['oauth_token']);
        $row = mysqli_fetch_assoc(mysqli_query($this->con, "SELECT p.uid, email, expires FROM password_reset AS p LEFT JOIN users AS u ON u.uid = p.uid WHERE token = '$oauth'"));

        if (!$row) {
            return array('response' => 'error', 'code' => 403, 'msg' => 'The password reset token provided is incorrect.');
        } else {
            $error = false;
            $msg = '';
            $passVal = $this->validatePassword($this->fields['pass']);

            // emails don't match
            if ($this->fields['email'] != $row['email']) {
                $error = true;
                $code = 1;
                $msg = 'The email in the confirmation link doesn\'t match the email on file.';
            } // password reset token expired
            else if ($row['expires'] < time()) {
                $error = true;
                $code = 2;
                $msg = 'Your password reset link has expired. Please reset your password again.';
            } //  new password is not provided
            else if ($this->fields['pass'] == '') {
                $error = true;
                $code = 3;
                $msg = 'You must provide a new password.';
            } // password isn't confirmed
            else if ($this->fields['confirm_pass'] == '') {
                $error = true;
                $code = 4;
                $msg = 'You must confirm your new password.';
            } // passwords don't match
            else if ($this->fields['pass'] != $this->fields['confirm_pass']) {
                $error = true;
                $code = 5;
                $msg = 'Your passwords don\'t match.';
            } // password failed verification
            else if ($passVal[0]) {
                $error = true;
                $code = 6;
                $msg = implode('<br>', $passVal[1]);
            } // successfully able to reset the user's password
            else {
                $pass = password_hash($_REQUEST['pass'], PASSWORD_DEFAULT);
                mysqli_query($this->con, "UPDATE password_reset SET expires = '0' WHERE uid = '$row[uid]'");
                mysqli_query($this->con, "UPDATE users SET password = '$pass' WHERE uid = '$row[uid]'");

                return array('response' => 'success');
            }

            if ($error) {
                return array('response' => 'error', 'code' => $code, 'msg' => $msg);
            }
        }
    }

    function confirmation()
    {
        $error = false;
        $msg = '';
        $decoded = $this->decodeToken($this->fields['oauth_token']);
        $email = $this->fields['email'];
        $oauth = mysqli_real_escape_string($this->con, $this->fields['oauth_token']);

        $row = mysqli_fetch_assoc(mysqli_query($this->con, "SELECT u.first_name, u.email, confirmed FROM confirmation AS c LEFT JOIN users AS u ON u.email = c.email WHERE token = '$oauth'"));

        // if the token doesn't exist
        if (!$row) {
            $error = true;
            $code = 1;
            $msg = 'The token that was provided is invalid.';
        } else {
            // if the email has already been confirmed
            if ($row['confirmed'] == 1) {
                $error = true;
                $code = 2;
                $msg = 'This account has already been confirmed.';
                // if the email on file matches the email in the link
            } else {
                if ($row['email'] != $email) {
                    $error = true;
                    $code = 3;
                    $msg = 'The email address provided doesn\'t match our records.';
                } else {
                    if ($row['email'] == $decoded->email) {
                        mysqli_query($this->con, "UPDATE confirmation SET confirmed = 1 WHERE token = '$oauth'");

                        sendEmail($email, 'Thanks for confirming your email', 'confirmed', array('{fname}' => $row['first_name'], '{email}' => $email));

                        return array('response' => 'success', 'subscribed' => $this->fields['subscriber'] == 1 ? true : false);
                    } else {
                        $error = true;
                        $code = 4;
                        $msg = 'The token that was provided is invalid.';
                    }
                }
            }
        }

        if ($error) {
            return array('response' => 'error', 'code' => $code, 'msg' => $msg);
        }
    }

    function createAccount($fname, $lname, $email, $pass, $ip, $role, $phone, $location, $thirdParty = 0)
    {
        $tok = $this->createToken(['email' => $email]);
        $time = time();
        $password = password_hash($pass, PASSWORD_DEFAULT);

        mysqli_query($this->con, "INSERT INTO users (first_name,last_name,email,password,ip_address,created,role,phone,location,profilePic,provider)
        VALUES('$fname','$lname','$email','$password','$ip','$time','$role','$phone','$location','','$thirdParty')");
        $uid = mysqli_insert_id($this->con);
        mysqli_query($this->con, "INSERT INTO settings (uid,settings,time) VALUES('$uid','','$time')");
        mysqli_query($this->con, "INSERT INTO trail_settings (uid,settings,time) VALUES('$uid','','$time')");
        mysqli_query($this->con, "INSERT INTO oreroads_settings (uid,settings,app_token,time) VALUES('$uid','','','$time')");

        $out = array('response' => 'success', 'subscribe' => isset($this->fields['price_id']) ? true : false);
        
        if (isset($this->fields['price_id'])) {
            $out['next'] = $this->returnURL(null);
        }
        
        mysqli_query($this->con, "INSERT INTO confirmation (email,token,confirmed) VALUES('$email','$tok','0')");
        $fields = array('{fname}' => $fname, '{email}' => $email, '{token}' => $tok, '{subscribe}' => (isset($this->fields['price_id']) ? '&subscriber=1' : ''));
        sendEmail($email, 'Confirm your new account', 'newaccount', $fields);

        return $out;
        //return array('response' => 'success', 'subscribe' => ($this->fields['subscribed'] == 1 ? array('active' => true, 'sid' => $this->fields['sid']) : false));
    }

    function register()
    {
        /*include_once('../subs.inc.php');
        foreach ($mapoSubscriptions as $s) {
            $subs[] = $s[($stripeLive ? 'live' : 'test')];
        }*/
        $error = false;
        $msgs = [];

        $ip = mysqli_real_escape_string($this->con, $this->fields['ip']);
        $fname = mysqli_real_escape_string($this->con, $this->fields['first_name']);
        $lname = mysqli_real_escape_string($this->con, $this->fields['last_name']);
        $email = mysqli_real_escape_string($this->con, $this->fields['email']);
        $phone = mysqli_real_escape_string($this->con, $this->fields['phone']);
        $pass = mysqli_real_escape_string($this->con, $this->fields['pass']);
        $cpass = mysqli_real_escape_string($this->con, $this->fields['confirm_pass']);
        $location = mysqli_real_escape_string($this->con, serialize(json_decode($this->fields['location'])));
        $role = 1;
        $passVal = $this->validatePassword($this->fields['pass']);

        $num = mysqli_num_rows(mysqli_query($this->con, "SELECT uid FROM users WHERE email = '$email' OR (phone != '' AND phone = '$phone')"));

        if ($num == 0) {
            $code = 2;

            if (!$this->fields['tos'] == 1) {
                $error = true;
                $msgs[] = 'You must agree to our Terms and Privacy Policy to create an account.';
            }

            if (!$fname) {
                $error = true;
                $msgs[] = 'You must enter your first name.';
            }

            if (!$lname) {
                $error = true;
                $msgs[] = 'You must enter your last name.';
            }

            if (!$email) {
                $error = true;
                $msgs[] = 'You must provide your email address.';
            }

            if (!$pass) {
                $error = true;
                $msgs[] = 'You must enter a password.';
            } else {
                if ($passVal[0]) {
                    $error = true;
                    foreach ($passVal[1] as $p) {
                        $msgs[] = $p;
                    }
                }

                if (!$cpass) {
                    $error = true;
                    $msgs[] = 'You must confirm your password.';
                } else if ($pass != $cpass) {
                    $error = true;
                    $msgs[] = 'Your passwords don\'t match.';
                }
            }
        } else {
            $error = true;
            $code = 1;
            $msgs[] = 'An account with this email address or phone number already exists.';
        }

        // no errors, create the user's account
        if (!$error) {
            return $this->createAccount($fname, $lname, $email, $pass, $ip, $role, $phone, $location);
        } else {
            return array('response' => 'error', 'code' => $code, 'msg' => implode('<br>', $msgs));
        }
    }
}

# create the user auth class
$sso = new SSO($con, $_REQUEST);

# if no method was provided to the API
if (empty($method)) {
    $returnJson = array('error' => 403, 'msg' => 'Method forbidden');
} else {
    # check to make sure the ip address from the UI matches the IP from the server
    if (isset($sso->fields['ip']) && $sso->fields['ip'] != $_SERVER['REMOTE_ADDR']) {
        $returnJson = array('response' => 'error', 'code' => 100, 'msg' => 'Your IP address has changed. Please try again.');
    } else {
        # create a user account
        if ($method == 'register') {
            $returnJson = $sso->register();
        } # login
        else if ($method == 'login') {
            # login with google, otherwise login with MAPO
            if ($_REQUEST['google'] == 1) {
                $returnJson = $sso->loginWithGoogle();
            } else {
                $returnJson = $sso->authenticate();
            }
        } # get user account info
        else if ($method == 'get') {
            if ($sso->decodeToken($_REQUEST['token'])->exp < time()) {
                $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'A token provided has expired.');
            } else {
                if (empty($_REQUEST['token']) || !$sso->validToken($_REQUEST['token'])) {
                    $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.');
                } else {
                    $u = $sso->user();
                    $returnJson = is_array($u) ? $u : array('response' => 'error', 'code' => 3, 'msg' => 'There was an error getting user data.');
                }
            }
        } # send user a reset password link
        else if ($method == 'forgot') {
            $returnJson = $sso->forgot();
        } # reset the user's password with credentials they set
        else if ($method == 'reset') {
            $returnJson = $sso->reset();
        } # confirm email address after account creation
        else if ($method == 'confirmation') {
            $returnJson = $sso->confirmation();
        } # logout the user
        else if ($method == 'logout') {
            $returnJson = $sso->logout();
        }
    }
}
