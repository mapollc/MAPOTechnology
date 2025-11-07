<?
require '../vendor/autoload.php';
include_once '/home/mapo/public_html/subs.inc.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use UAParser\Parser;

class SSO
{
    public $request;
    public $domain;
    public $fields;
    public $con;
    private $secretKey;
    public $source = 'mapotechnology';
    public $prod = null;
    public $nextURL = null;
    public $token = null;
    public $guid;

    function __construct($con, $request)
    {
        global $_COOKIE;

        $this->request = $request;
        $this->domain = 'https://www.mapotechnology.com/';
        $this->fields = $request;
        $this->con = $con;
        $this->secretKey = 'MapoLLC.Q1.w.2.e.34';
        $this->guid = $_COOKIE['guid'] ? $_COOKIE['guid'] : $this->getGUID();
        $this->nextURL = null;

        if ($request['service']) {
            $this->source = $request['service'];
        }

        if ($request['prod']) {
            $this->prod = $request['prod'];
        }

        if ($request['next']) {
            $this->nextURL = $request['next'];
        }
    }

    function isJson($string) {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
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

    function createToken($payload, $expires = null)
    {
        /*$array['iat'] = time();
        $array['exp'] = $expires != null ? $expires : time() + 60 * 60 * 24 * 7;
        $array['host'] = $_SERVER['HTTP_USER_AGENT'];
        $array['ip'] = $_SERVER['REMOTE_ADDR'];

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($array);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secretKey, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

        return $jwt;*/
        $payload['iss'] = $this->domain;
        $payload['aud'] = $this->domain;
        $payload['iat'] = time();
        $payload['nbf'] = time();
        $payload['exp'] = $expires != null ? $expires : time() + 60 * 60 * 24 * 7;
        $payload['host'] = $_SERVER['HTTP_USER_AGENT'];
        $payload['ip'] = $_SERVER['REMOTE_ADDR'];

        return JWT::encode($payload, $this->secretKey, 'HS256');
    }

    function decodeToken($token)
    {
        /*$e = explode('.', $token);

        return json_decode(base64_decode($e[1]));
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        $payload = json_decode(base64_decode(str_replace(['-', '_', ''], ['+', '/', '='], $parts[1])), true);

        if (!$payload) {
            return null;
        }

        return $payload;*/
        JWT::$leeway = 60;
        return (array) JWT::decode($token, new Key($this->secretKey, 'HS256'));
    }

    function validToken($token)
    {
        /*$e = explode('.', $token);

        return $this->getSecretKey($e) == $e[2] ? true : false;
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return false; // Invalid token format
        }

        $header = $parts[0];
        $payload = $parts[1];
        $signature = $parts[2];

        $calculatedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', $header . "." . $payload, $this->secretKey, true)));

        return $calculatedSignature === $signature;*/

        try {
            $decoded = $this->decodeToken($token);

            if (!isset($decoded['iss']) || (isset($decoded['iss']) && $decoded['iss'] == $this->domain)) {
                return $decoded;
            } else {
                return ['other'];
            }
        } catch (Firebase\JWT\ExpiredException) {
            return ['expired'];
        } catch (Firebase\JWT\BeforeValidException) {
            return ['invalid'];
        } catch (Firebase\JWT\SignatureInvalidException) {
            return ['invalid'];
        } catch (Exception $e) {
            return ['other'];
        }
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

    /*function getSecretKey($e)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', $e[0] . '.' . $e[1], 'MapoLLC.Q1.w.2.e.34', true)));
    }*/

    function in($e)
    {
        $total = $e + 900 - time();

        if ($total < 60) {
            return $total . ' seconds.';
        } else {
            return round($total / 60, 0) . ' minutes';
        }
    }

    function sql($cols = '', $s)
    {
        $q = 'SELECT u.uid, first_name, last_name, u.email, u.phone, password, u.location, u.created, role, provider, last_active{cols} FROM users AS u';
        return str_replace('{cols}', $cols, $q) . ' ' . $s;
    }

    /*function prepareQuery($types = '', $params = [], $sql)
    {
        $stmt = $this->con->prepare($sql);
        if ($stmt === false) {
            return false;
        }

        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result === false) {
            if ($this->con->errno) {
                $stmt->close();
                return ['error' => true, 'message' => 'Execute failed: ' . $this->con->error];
            } else {
                $stmt->close();
                return ['success' => true];
            }
        } else {
            $rows = [];
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
            $stmt->close();

            if (count($rows) === 1) {
                return $rows[0];
            } else {
                return $rows;
            }
        }
    }*/

    function authenticate()
    {
        global $_SESSION;
        global $function;

        // record how many attempts this user has made to login
        if ($_SESSION['login_attempts'] >= 3 && $_SESSION['last_login_attempt'] + 900 < time()) {
            $_SESSION['login_attempts'] = 1;
        } else if ($_SESSION['login_attempts'] < 3 && $_SESSION['last_login_attempt'] + 900 > time()) {
            $_SESSION['login_attempts'] = $_SESSION['login_attempts'] + 1;
        }

        if ($_SESSION['login_attempts'] < 3) {
            $_SESSION['last_login_attempt'] = time();
        }

        $email = $this->fields['email'];
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
                if ($function == 'mapofire') {
                    $extra = ', settings, method, mf.time AS synced';
                    $extra2 = ' LEFT JOIN settings AS mf ON mf.uid = u.uid';
                } else if ($function == 'mapotrails') {
                    $extra = ', settings, ts.time AS updatedTime';
                    $extra2 = ' LEFT JOIN trail_settings AS ts ON ts.uid = u.uid';
                } else if ($function == 'oreroads') {
                    $extra = ', settings, rd.time AS updatedTime';
                    $extra2 = ' LEFT JOIN oreroads_settings AS rd ON rd.uid = u.uid';
                }

                $respMsg = '';
                //$row = mysqli_fetch_assoc(mysqli_query($this->con, $this->sql(', confirmed, settings, method, mf.time AS synced', "LEFT JOIN settings AS mf ON mf.uid = u.uid LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = '$email' AND c.valid = 1 ORDER BY c.cid DESC LIMIT 1")));
                $row = prepareQuery('s', [$email], $this->sql(', confirmed'.$extra, "$extra2 LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = ? AND c.valid = 1 ORDER BY c.cid DESC LIMIT 1"));

                if (isset($row['error'])) {
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
                        if ($row['password'] == 'PASSWORD_RESET_REQUIRED') {
                            $error = true;
                            $code = 5;
                            $respMsg = 'You must reset your password before you can login.';
                        } else {
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
        }

        if ($error) {
            return array('response' => 'error', 'code' => $code, 'msg' => $respMsg);
        }
    }

    function loginWithGoogle()
    {
        global $_SESSION;
        global $function;
        $error = false;
        $msg = '';
        $time = time();
        $gtoken = $this->fields['token'];

        if (isset($this->fields['android'])) {
            $origin = [
                '5657812526-7d5kbopva8tfu1uh4btb9niva0utbtmn.apps.googleusercontent.com',
                '5657812526-ihtvr12u0nnoav43h06spn9b6vf3j0n8.apps.googleusercontent.com',
                '149507018302-b4dlhj0mgopdup0sg98rabp4k29efmd1.apps.googleusercontent.com',
                '149507018302-urdh88fhv4gpnh4imt7egcsqnj40n3kd.apps.googleusercontent.com'
            ];
        } else {
            $origin = ['27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com'];
        }

        if ($gtoken) {
            $json = json_decode(file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . $gtoken));

            // check to make sure the token originated from us and not somebody else's site
            if (in_array($json->aud, $origin)) {
                // check to make sure token hasn't expired
                if ($time > $json->exp) {
                    $error = true;
                    $code = 3;
                    $msg = 'The token provided has expired. Try again.';
                } else {
                    $email = $json->email;

                    // check to see if user account is already registered in the database
                    $num = prepareQuery('s', [$email], "SELECT uid, provider FROM users WHERE email = ?");

                    if (empty($num)) {
                        $this->createAccount($json->given_name, $json->family_name, $email, '', $_SERVER['REMOTE_ADDR'], '1', '', '', 1);
                    } else {
                        // link google account to existing account
                        if ($num['provider'] == 0) {
                            prepareQuery('i', [$num['uid']], "UPDATE users SET provider = '1' WHERE uid = ?");
                        }
                    }

                    // log the user in with google (or after creating an account if they don't have one)
                    if ($function == 'mapofire') {
                        $extra = ', settings, method, mf.time AS synced';
                        $extra2 = ' LEFT JOIN settings AS mf ON mf.uid = u.uid';
                    } else if ($function == 'mapotrails') {
                        $extra = ', settings, ts.time AS updatedTime';
                        $extra2 = ' LEFT JOIN trail_settings AS ts ON ts.uid = u.uid';
                    } else if ($function == 'oreroads') {
                        $extra = ', settings, rd.time AS updatedTime';
                        $extra2 = ' LEFT JOIN oreroads_settings AS rd ON rd.uid = u.uid';
                    }
    
                    $row = prepareQuery('s', [$email], $this->sql(', confirmed'.$extra, "$extra2 LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = ? AND c.valid = 1 ORDER BY c.cid DESC LIMIT 1"));
                    //$row = prepareQuery('s', [$email], $this->sql(', confirmed', "LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = ?").' ORDER BY cid DESC LIMIT 1');

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

        $validSources = ['mapofire', 'wildfiremap', 'fireweatheravalanche', 'mapotrails', 'apps'];
        $services = ['www.mapofire.com', 'www.wildfiremap.org', 'www.fireweatheravalanche.org', 'www.mapotrails.com', 'apps.mapotechnology.com'];

        if (isset($this->fields['price_id'])) {
            //return $this->domain . 'checkout?price_id=' . $this->fields['price_id'] . ($this->fields['trial'] ? '&trial=1' : '') . '&customer_email=' . $this->fields['email'] . ($method == 'register' ? '&first_name=' . $this->fields['first_name'] . '&last_name=' . $this->fields['last_name'] . '&next=' . urlencode('secure/login?subscribed=1&pid=' . $this->fields['price_id']) : '');
            return 'https://www.mapotechnology.com/purchase/'.$this->fields['product_key'].'/complete?newUser=1&price=' . $this->fields['price_id'] . ($this->fields['trial'] ? '&trial=1' : '') . '&customer_email=' . $this->fields['email'];
        } else {
            if ($this->source != null && $this->source != 'mapotechnology') {
                $key = array_search($this->source, $validSources);
                return 'https://' . $services[$key] . '/authenticate?token=' . $this->token . ($this->source != null ? '&service=' . $this->source : '') . ($this->prod != null ? '&prod=' . $this->prod : '') . ($next ? '&next=' . urlencode($next) : '');
            } else {
                return str_replace('//', '/', $next ? $next : '../account/home');
            }
        }
    }

    function getSubscriptions($email)
    {
        global $plan;
        $sub = prepareQuery('s', [$email], "SELECT cid, subscription, trial, plan, created, start, end AS ends, status, cancel_end_period FROM billing WHERE email = ? AND status != 'expired' ORDER BY created DESC");

        if (isset($sub['error'])) {
            return ['error' => true, 'message' => $sub['message']];
        } else {
            if (empty($sub)) {
                return [];
            } else {
                if (isset($sub['cid'])) {
                    $plan->setPlan(null, $sub['plan']);
                    $sub['name'] = $plan->getName();
                    $sub['id'] = $plan->getPriceName() ? $plan->getPriceName() : null;

                    $sub['start'] = intval($sub['start']);
                    $sub['ends'] = intval($sub['ends']);
                    $sub['created'] = intval($sub['created']);
                    $sub['cancel_end_period'] = $sub['cancel_end_period'] == 1 ? true : false;

                    return [$sub];
                } else {
                    foreach ($sub as $s) {
                        $plan->setPlan(null, $s['plan']);
                        $s['name'] = $plan->getName();
                        $s['id'] = $plan->getPriceName() ? $plan->getPriceName() : null;

                        $s['start'] = intval($s['start']);
                        $s['ends'] = intval($s['ends']);
                        $s['created'] = intval($s['created']);
                        $s['cancel_end_period'] = $s['cancel_end_period'] == 1 ? true : false;

                        $allSubs[] = $s;
                    }

                    return $allSubs;
                }
            }
        }
    }

    function getUser($row, $expires, $subscribe)
    {
        global $method;
        global $function;

        if ($expires == null) {
            $expires = $row['expires'];
        }

        $token = $method == 'get' ? $row['token'] : $this->token;

        $out = array(
            'uid' => intval($row['uid']),
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'name' => $row['first_name'] . ' ' . $row['last_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'role' => getUserRole($row['role']),
            'last_active' => intval($row['last_active']),
            'created' => intval($row['created']),
            'location' => $row['location'] ? unserialize($row['location']) : null,
            'provider' => $row['provider'] == '1' ? 'google' : 'internal',
            'expires' => intval($expires),
            'token' => $token,
            'subscriptions' => $subscribe
        );

        if ($method == 'login') {
            $out['confirmed'] = ($row['confirmed'] == 1 ? true : false);
        }

        if ($function == 'mapofire') {
            $set = unserialize($row['settings']);
            
            if (empty($set['weather'])) {
                $set['weather'] = null;
            }

            $out['settings'] = array('allsettings' => $row['settings'] ? $set : null, 'method' => $row['method'], 'synced' => intval($row['synced']));
        } else if ($function == 'mapotrails') {
            $out['settings'] = array('mapotrails' => json_decode($row['settings']), 'synced' => intval($row['updatedTime']));
        } else if ($function == 'oreroads') {
            $out['settings'] = array('oreroads' => json_decode($row['settings']), 'synced' => intval($row['updatedTime']));
        }

        return $out;
    }

    function devices() {
        if ($this->fields['mode'] == 'terminate') {
            prepareQuery('is', [$this->fields['sid'], $this->fields['token']], "UPDATE sessions SET expires = 0 WHERE sid = ? AND token = ?");

            return ['success' => true];
        } else {
            $user_agent = Parser::create();
            $now = time();
            $devices = prepareQuery('si', [$this->fields['token'], $now], "SELECT sid, token, ip, host, source, location, created, expires FROM sessions WHERE uid = (SELECT uid FROM sessions WHERE token = ? LIMIT 1) AND expires > 0 AND expires > ? ORDER BY created DESC");

            if ($devices && !isset($devices[0])) {
                $devices = [$devices];
            }

            foreach ($devices as $device) {
                if (is_array($device)) {
                    $agent = $user_agent->parse($device['host'] ? $device['host'] : '');
                    $ua = agent($agent);

                    if ($this->isJson($device['host'])) {
                        $js = json_decode($device['host']);
                        $ua = "$js->make $js->model";
                    } else {
                        if (str_contains($device['host'], 'okhttp')) {
                            $ua = 'Android App';
                        }
                    }

                    if ($device['location'] == '') {
                        $json = json_decode(file_get_contents('https://ipwho.is/'.$device['ip']));
                        $devLoc = ['location' => $json->city.', '.$json->region_code.', '.$json->country, 'isp' => $json->connection->isp];
                        $location = serialize($devLoc);
                        
                        mysqli_query($this->con, "UPDATE sessions SET location = '$location' WHERE sid = '$device[sid]'");
                    } else {
                        $devLoc = unserialize($device['location']);
                    }

                    $device['created'] = intval($device['created']);
                    $device['expires'] = intval($device['expires']);
                    $device['location'] = $devLoc;
                    $device['device'] = $ua;
                    $dev[] = $device;
                }
            }

            return ['devices' => is_array($devices) && count($devices) > 0 ? $dev : null];
        }
    }

    function user()
    {
        global $function;
        $extra = '';
        $extra2 = '';

        if ($function == 'mapofire') {
            $extra = ', settings, method, mf.time AS synced';
            $extra2 = ' LEFT JOIN settings AS mf ON mf.uid = u.uid';
        } else if ($function == 'mapotrails') {
            $extra = ', settings, ts.time AS updatedTime';
            $extra2 = ' LEFT JOIN trail_settings AS ts ON ts.uid = u.uid';
        } else if ($function == 'oreroads') {
            $extra = ', settings, rd.time AS updatedTime';
            $extra2 = ' LEFT JOIN oreroads_settings AS rd ON rd.uid = u.uid';
        }

        $token = $this->fields['token'];
        //$row = prepareQuery('s', [$token], $this->sql(', token, expires' . $extra, "LEFT JOIN sessions AS s ON s.uid = u.uid$extra2 WHERE s.token = ?"));
        $row = prepareQuery('s', [$token], "SELECT u.uid, first_name, last_name, u.email, u.phone, password, u.location, u.created, role, provider, last_active, token, expires$extra FROM users AS u LEFT JOIN sessions AS s ON s.uid = u.uid$extra2 WHERE s.token = ?");

        if (isset($row['error'])) {
            return array('response' => 'error', 'code' => 500, 'msg' => 'Database error: ' . $row['message']);
        } else {
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
    }

    function login($row)
    {
        global $_SESSION;
        unset($_SESSION['login_attempts']);
        unset($_SESSION['last_login_attempt']);

        $time = time();
        $expires = $time + 60 * 60 * 24 * 7;
        $ip = $this->fields['ip'] ? $this->fields['ip'] : $_SERVER['REMOTE_ADDR'];
        $host = $_SERVER['HTTP_USER_AGENT'];

        // if login is coming from an app, change source to package name of app and extend expiration time
        if (isset($this->request['android']) && $this->request['android'] != '') {
            $this->source = $this->request['android'];
            $expires = $time + 60 * 60 * 24 * 45;
        }

        $this->token = $this->createToken(['user_id' => $row['uid']], $expires);

        if ($this->fields['device']) {
            $host = $this->fields['device'];
        }

        // get any user subscriptions
        $subscribe = $this->getSubscriptions($row['email']);

        // update user activity in database
        $update = prepareQuery('i', [$row['uid']], "UPDATE users SET last_active = '$time' WHERE uid = ?");

        if (isset($update['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $update[message]"];
        }

        $sess = prepareQuery('isssssssi', [
            $row['uid'],
            $this->token,
            $this->guid,
            $ip,
            $host,
            $this->source,
            '',
            $time,
            $expires
        ], "INSERT INTO sessions (uid, token, guid, ip, host, source, location, created, expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (isset($sess['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $sess[message]"];
        }

        $_SESSION['uid'] = $row['uid'];
        $_SESSION['first_name'] = $row['first_name'];
        $_SESSION['last_name'] = $row['last_name'];
        $_SESSION['name'] = $row['first_name'] . ' ' . $row['last_name'];
        $_SESSION['email'] = $row['email'];
        $_SESSION['role'] = $row['role'];
        $_SESSION['token'] = $this->token;
        $_SESSION['expires'] = $expires;
        $_SESSION['subscriptions'] = json_encode($subscribe);

        setcookie('token', $this->token, $expires, '/', '.mapotechnology.com', true);
        setcookie('guid', $this->guid, time() + (60 * 60 * 24 * 365.25), '/', '.mapotechnology.com', true);

        logEvent('Logged in', false, $row['uid']);

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
            $row = prepareQuery('s', [$this->token], "SELECT uid FROM sessions WHERE token = ?");

            if (isset($row['error'])) {
                return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
            }

            if ($row) {
                $time = time();
                $uid = $row['uid'];

                setcookie('token', '', $time - 60 * 60 * 24 * 7, '/', '.mapotechnology.com', true);
                $_SESSION = array();
                session_regenerate_id();

                prepareQuery('si', [$time, $uid], "UPDATE users SET last_active = ? WHERE uid = ?");
                prepareQuery('is', [$uid, $this->token], "UPDATE sessions SET expires = '0' WHERE uid = ? AND token = ?");

                return array('response' => 'success');
            } else {
                return $invalid;
            }
        }
    }

    function forgot()
    {
        $email = $this->fields['email'];

        if (!$email) {
            return array('response' => 'error', 'code' => 1, 'msg' => 'You must provide an email address.');
        } else {
            $row = prepareQuery('s', [$email], "SELECT uid, first_name, email FROM users WHERE email = ?");

            if (isset($row['error'])) {
                return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
            } else {
                if (!$row) {
                    return array('response' => 'error', 'code' => 2, 'msg' => 'You must provide an email address.');
                } else {
                    $expires = time() + 600;
                    $token = $this->createToken(['uid' => $row['uid'], 'unqiue' => 'resetPassword-' . time()]);

                    mysqli_query($this->con, "UPDATE password_reset SET expires = '0' WHERE uid = $row[uid]");
                    mysqli_query($this->con, "UPDATE users SET password = 'PASSWORD_RESET_REQUIRED' WHERE uid = $row[uid]");
                    mysqli_query($this->con, "INSERT INTO password_reset (uid,token,expires) VALUES($row[uid],'$token','$expires')");
                    /*prepareQuery('i', [$row['uid']], "UPDATE password_reset SET expires = '0' WHERE uid = ?");
                    prepareQuery('i', [$row['uid']], "UPDATE users SET password = 'PASSWORD_RESET_REQUIRED' WHERE uid = ?");
                    prepareQuery('iis', [$row['uid'], $token, $expires], "INSERT INTO password_reset (uid,token,expires) VALUES(?,?,?)");*/

                    logEvent('Request sent to reset password', false, $row['uid']);

                    sendEmail($row['email'], 'Your account password was reset', 'reset', array('{fname}' => $row['first_name'], '{token}' => $token, '{email}' => $row['email']));

                    return array('response' => 'success');
                }
            }
        }
    }

    function reset()
    {
        $pass = $this->fields['pass'];
        $oauth = $this->fields['oauth_token'];
        $row = prepareQuery('s', [$oauth], "SELECT p.uid, email, expires FROM password_reset AS p LEFT JOIN users AS u ON u.uid = p.uid WHERE token = ?");

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
        } else {
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
                    $pass = password_hash($this->fields['pass'], PASSWORD_DEFAULT);
                    prepareQuery('i', [$row['uid']], "UPDATE password_reset SET expires = '0' WHERE uid = ?");
                    prepareQuery('si', [$pass, $row['uid']], "UPDATE users SET password = ? WHERE uid = ?");

                    return array('response' => 'success');
                }

                if ($error) {
                    return array('response' => 'error', 'code' => $code, 'msg' => $msg);
                }
            }
        }
    }

    function confirmation()
    {
        $error = false;
        $msg = '';
        $oauth = $this->fields['oauth_token'];
        $decoded = $this->decodeToken($oauth);
        $email = $this->fields['email'];

        $row = prepareQuery('s', [$oauth], "SELECT u.first_name, u.email, confirmed FROM confirmation AS c LEFT JOIN users AS u ON u.email = c.email WHERE token = ?");

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
        } else {
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
                        if ($row['email'] == $decoded['email']) {
                            prepareQuery('s', [$oauth], "UPDATE confirmation SET confirmed = 1 WHERE token = ?");

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
    }

    function generatePassword($length = 22)
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+<>?';
        $password = '';
        $maxIndex = strlen($characters) - 1;

        for ($i = 0; $i < $length; $i++) {
            $password .= $characters[random_int(0, $maxIndex)];
        }

        return $password;
    }

    function createAccount($fname, $lname, $email, $pass, $ip, $role, $phone, $location, $thirdParty = 0)
    {
        $out = [];
        $tok = $this->createToken(['email' => $email]);
        $time = time();
        $pass = $pass ? $pass : $this->generatePassword();
        $password = password_hash($pass, PASSWORD_DEFAULT);

        $insert = prepareQuery('ssssssssss', [
            $fname,
            $lname,
            $email,
            $password,
            $ip,
            $time,
            $role,
            $phone,
            $location,
            $thirdParty
        ], "INSERT INTO users (first_name,last_name,email,password,ip_address,created,role,phone,location,profilePic,provider) VALUES(?,?,?,?,?,?,?,?,?,'',?)");

        if (isset($insert['error'])) {
            $out = ['response' => 'error', 'code' => 1, 'msg' => 'There was an error creating your account'];
        } else {
            $uid = mysqli_insert_id($this->con);

            if (!$uid) {
                $out = ['response' => 'error', 'code' => 2, 'msg' => 'There was an error creating your account'];
            } else {
                $ins1 = prepareQuery('is', [$uid, $time], "INSERT INTO settings (uid,settings,time) VALUES(?,'',?)");
                $ins2 = prepareQuery('is', [$uid, $time], "INSERT INTO trail_settings (uid,settings,time) VALUES(?,'',?)");
                $ins3 = prepareQuery('is', [$uid, $time], "INSERT INTO oreroads_settings (uid,settings,app_token,time) VALUES(?,'','',?)");

                if (isset($ins1['error']) || isset($ins2['error']) || isset($ins3['error'])) {
                    $out = ['response' => 'error', 'code' => 3, 'msg' => 'There was an error creating your account'];
                } else {
                    $out = array('response' => 'success', 'subscribe' => isset($this->fields['price_id']) ? true : false);

                    // if user is starting a subscription
                    if (isset($this->fields['price_id'])) {
                        $_SESSION['customer_email'] = $email;

                        $out['next'] = $this->returnURL(null);
                    }

                    prepareQuery('s', [$email], "UPDATE confirmation SET valid = 0 WHERE email = ?");
                    prepareQuery('ss', [$email, $tok], "INSERT INTO confirmation (email,token,confirmed) VALUES(?,?,'0')");

                    $fields = array('{fname}' => $fname, '{email}' => $email, '{token}' => $tok, '{subscribe}' => (isset($this->fields['price_id']) ? '&subscriber=1' : ''));
                    sendEmail($email, 'Confirm your new account', 'newaccount', $fields);
                }
            }
        }

        return $out;
    }

    function register($google = false)
    {
        $error = false;
        $msgs = [];

        $ip = $this->fields['ip'];
        $fname = ucfirst($this->fields['first_name']);
        $lname = ucfirst($this->fields['last_name']);
        $email = $this->fields['email'];
        $phone = $this->fields['phone'];
        $pass = $this->fields['pass'];
        $cpass = $this->fields['confirm_pass'];
        $location = serialize(json_decode(urldecode($this->fields['location'])));
        $role = 1;
        $passVal = $this->validatePassword($this->fields['pass']);

        $num = prepareQuery('ss', [$email, $phone], "SELECT uid FROM users WHERE email = ? OR (phone != '' AND phone = ?)");

        if (isset($num['error'])) {
            $error = true;
            $msgs[] = 'There was an error trying to create your account';
        } else {
            if (count($num) == 0) {
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

                if (!$google) {
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
                }
            } else {
                $error = true;
                $code = 1;
                $msgs[] = 'An account with this email address or phone number already exists.';
            }
        }

        // no errors, create the user's account
        if (!$error) {
            return $this->createAccount($fname, $lname, $email, $pass, $ip, $role, $phone, $location);
        } else {
            return array('response' => 'error', 'code' => $code, 'msg' => implode('<br>', $msgs));
        }
    }

    function update()
    {
        global $function;

        $token = $this->fields['token'];
        $row = prepareQuery('s', [$token], $this->sql(', token, expires', "LEFT JOIN sessions AS s ON s.uid = u.uid WHERE s.token = ?"));

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
        } else {
            if ($row) {
                if ($row['expires'] == 0 || $row['expires'] < time()) {
                    return array('response' => 'error', 'code' => 1, 'msg' => 'The token provided has expired.');
                } else {
                    // update the user's information in the database
                    if ($function == 'location') {
                        $newLoc = serialize(json_decode($this->fields['location']));
                        $update = prepareQuery('si', [$newLoc, $row['uid']], "UPDATE users SET location = ? WHERE uid = ?");

                        if (isset($update['error'])) {
                            return ['response' => 'error', 'code' => 3, 'msg' => 'There was an error updating your account'];
                        }
                    } else {
                        $fn = $this->fields['firstName'];
                        $ln = $this->fields['lastName'];
                        $em = $this->fields['email'];
                        $ph = $this->fields['phone'];

                        // the user's email address has been changed
                        if ($this->fields['email'] != $row['email']) {
                            sendEmail($this->fields['email'], 'Your account email was changed', 'changedemail', array('{fname}' => $this->fields['firstName']));
                            sendEmail($row['email'], 'Your account email was changed', 'changedemail', array('{fname}' => $this->fields['firstName']));
                        }

                        $update = prepareQuery('ssssi', [$fn, $ln, $em, $ph, $row['uid']], "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE uid = ?");

                        if (isset($update['error'])) {
                            return ['response' => 'error', 'code' => 3, 'msg' => 'There was an error updating your account'];
                        }
                    }

                    return array('success' => true, 'db' => $function);
                }
            } else {
                return array('response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.');
            }
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
    $packages = array('com.mapollc.oreroads', 'com.mapollc.mapofire');

    if (isset($sso->fields['ip']) && $sso->fields['ip'] != $_SERVER['REMOTE_ADDR'] && (isset($_REQUEST['android']) && !in_array($_REQUEST['android'], $packages))) {
        $returnJson = array('response' => 'error', 'code' => 100, 'msg' => 'Your IP address has changed. Please try again.');
    } else {
        # create a user account
        if ($method == 'register') {
            $returnJson = $sso->register();
        } # login
        else if ($method == 'login') {
            # login with google, otherwise login with MAPO
            if (isset($_REQUEST['google']) && $_REQUEST['google'] == 1) {
                $returnJson = $sso->loginWithGoogle();
            } else {
                $returnJson = $sso->authenticate();
            }
        } # get user account info
        else if ($method == 'get') {
            $token = $_REQUEST['token'];

            if (!$token) {
                $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An authentication token was not provided.');
            } else {
                $validToken = $sso->validToken($token);
                //print_r($validToken);

                if (isset($validToken['exp']) && $validToken['exp'] < time()) {
                    //prepareQuery('s', [$token], "UPDATE sessions SET expired = CASE WHEN expired != '0' THEN '0' ELSE expired END WHERE token = ?");

                    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'The token provided has expired.');
                } else if (isset($validToken['invalid'])) {
                    $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.');
                } else if (isset($validToken['other'])) {
                    $returnJson = array('response' => 'error', 'code' => 3, 'msg' => 'There was an error decoding your authentication token.');
                } else {
                    $u = $function == 'devices' ? $sso->devices() : $sso->user();
                    //$returnJson = [$u];
                    $returnJson = is_array($u) ? $u : array('response' => 'error', 'code' => 4, 'msg' => 'There was an error getting user data.');
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
        } # update user settings
        else if ($method == 'update') {
            $returnJson = $sso->update();
        }
    }
}
