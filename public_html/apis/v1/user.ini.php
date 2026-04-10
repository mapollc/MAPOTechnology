<?
require '/home/mapo/public_html/vendor/autoload.php';
include_once '/home/mapo/public_html/subs.inc.php';

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;
use Firebase\JWT\Key;
use UAParser\Parser;

class SSO
{
    public $request;
    public $domain;
    public $issuer;
    public $fields;
    public $ip;
    public $con;
    private $secretKey;
    public $source = 'mapotechnology';
    public $prod = null;
    public $nextURL = null;
    public $token = null;
    public $guid;
    public $maxLoginWindow;
    public $maxEmailAttempts;
    public $maxIPAttempts;
    public $memcache;
    public $googleCerts;

    function __construct($con, $request)
    {
        global $_COOKIE;

        $this->request = $request;
        $this->domain = 'https://www.mapotechnology.com/';
        $this->issuer = 'https://api.mapotechnology.com/';
        $this->fields = $request;
        $this->ip = $_SERVER['REMOTE_ADDR'];
        $this->con = $con;
        $this->secretKey = getenv('JWT_SECRET');
        $this->guid = $_COOKIE['guid'] ?? $this->getGUID();
        $this->nextURL = null;
        $this->maxEmailAttempts = 5;
        $this->maxIPAttempts = 20;
        $this->maxLoginWindow = 15;

        if ($request['service']) {
            $this->source = $request['service'];
        }

        if ($request['prod']) {
            $this->prod = $request['prod'];
        }

        if ($request['next']) {
            $this->nextURL = $request['next'];
        }

        $this->memcache = new Memcached('auth_pool');

        if (!count($this->memcache->getServerList())) {
            $this->memcache->addServer('127.0.0.1', 11211);
        }

        $this->googleCerts = $this->memcache->get('google_certs');
    }

    function isJson($string)
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    private function getGUID()
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

            return str_replace(['{', '}'], ['', ''], $uuid);
        }
    }

    function createToken($payload, $expires = null)
    {
        $payload['iss'] = $this->domain;
        $payload['aud'] = $this->issuer;
        $payload['iat'] = time();
        $payload['nbf'] = time();
        $payload['exp'] = $expires != null ? $expires : time() + 60 * 60 * 24 * 7;


        return JWT::encode($payload, $this->secretKey, 'HS256');
    }

    function decodeToken($token)
    {
        JWT::$leeway = 60;
        return (array) JWT::decode($token, new Key($this->secretKey, 'HS256'));
    }

    function tokenStatus($token)
    {
        try {
            $decoded = $this->decodeToken($token);
            $iss = !isset($decoded['iss']) || $decoded['iss'] != $this->domain;
            $aud = !isset($decoded['aud']) || ($decoded['aud'] != $this->domain && $decoded['aud'] != $this->issuer);

            if ($iss || $aud) {
                return ['status' => 'issuer'];
            } else {
                return ['status' => 'valid', 'payload' => $decoded];
            }
        } catch (Firebase\JWT\ExpiredException) {
            return ['status' => 'expired'];
        } catch (Firebase\JWT\BeforeValidException) {
            return ['status' => 'invalid'];
        } catch (Firebase\JWT\SignatureInvalidException) {
            return ['status' => 'invalid'];
        } catch (Exception $e) {
            return ['status' => 'other'];
        }
    }

    function validateToken($token)
    {
        //$validToken['status'] = 'expired';
        $validToken = $this->tokenStatus($token);

        return match ($validToken['status']) {
            'expired' => ['response' => 'error', 'code' => 1, 'msg' => 'The token provided has expired.'],
            'invalid' => ['response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.'],
            'other' => ['response' => 'error', 'code' => 3, 'msg' => 'There was an error decoding your authentication token.'],
            'issuer' => ['response' => 'error', 'code' => 4, 'msg' => 'The token issuer cannot be validated.'],
            'valid' => ['response' => 'valid']
        };
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

    function productConfig()
    {
        global $function;

        return match ($function) {
            'mapofire' => [
                'extra' => ', settings, method, mf.time AS synced',
                'join' => ' LEFT JOIN settings AS mf ON mf.uid = u.uid'
            ],
            'mapotrails' => [
                'extra' => ', settings, ts.time AS updatedTime',
                'join' => ' LEFT JOIN trail_settings AS ts ON ts.uid = u.uid'
            ],
            'oreroads' => [
                'extra' => ', settings, rd.time AS updatedTime',
                'join' => ' LEFT JOIN oreroads_settings AS rd ON rd.uid = u.uid'
            ],
            default => [
                'extra' => '',
                'join' => ''
            ]
        };
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

    function sql($cols = '', $s)
    {
        $q = 'SELECT u.uid, first_name, last_name, u.email, u.phone, password, u.location, u.created, role, provider, last_active{cols} FROM users AS u';
        return str_replace('{cols}', $cols, $q) . ' ' . $s;
    }

    private function bruteForce($email, $record = false)
    {
        $emailKey = "login:email:" . strtolower($email);
        $ipKey = "login:ip:" . $this->ip;

        if ($record) {
            $emailAttempts = $this->memcache->increment($emailKey, 1);
            $ipAttempts = $this->memcache->increment($ipKey, 1);

            if ($emailAttempts === false) {
                $this->memcache->set($emailKey, 1, $this->maxLoginWindow * 60);
            }

            if ($ipAttempts === false) {
                $this->memcache->set($ipKey, 1, $this->maxLoginWindow * 60);
            }
        } else {
            $emailAttempts = $this->memcache->get($emailKey) ?: 0;
            $ipAttempts    = $this->memcache->get($ipKey) ?: 0;

            if ($emailAttempts >= 3) {
                sleep(min($emailAttempts - 2, 3));
            }

            if ($emailAttempts >= $this->maxEmailAttempts || $ipAttempts >= $this->maxIPAttempts) {
                return true;
            }

            return false;
        }
    }

    function authenticate()
    {
        global $_SESSION;

        $email = $this->fields['email'];
        $pass = $this->fields['pass'];
        $error = false;

        if (!$email || !$pass) {
            $code = 1;
            $error = true;
            $respMsg = 'You must provide an email address and password.';
        } else {
            // record how many attempts this user has made to login
            if ($this->bruteForce($email)) {
                $error = true;
                $code = 5;
                $respMsg = 'Your account has been locked due to multiple failed login attempts. Try again later.';
            } else {
                $config = $this->productConfig();

                $respMsg = '';
                $row = executeQuery('s', [$email], $this->sql(", confirmed{$config['extra']}", "{$config['join']} LEFT JOIN confirmation AS c ON c.email = u.email AND c.valid = 1 WHERE u.email = ? ORDER BY c.cid DESC LIMIT 1"));

                if (isset($row['error'])) {
                    $error = true;
                    $code = 2;
                    $respMsg = 'The email and/or password you entered is incorrect.';
                } else {
                    // if user account has not been confirmed yet
                    if ($row['confirmed'] == 0) {
                        $error = true;
                        $code = 3;
                        $respMsg = 'This account has not been confirmed yet. Please check your email.';
                    } else {
                        if (password_verify($pass, $row['password'])) {
                            unset($_SESSION['gtoken']);

                            $this->memcache->delete("login:email:" . strtolower($email));
                            $this->memcache->delete("login:ip:{$this->ip}");

                            // check if password needs re-hashing for security purposes
                            if (password_needs_rehash($row['password'], PASSWORD_DEFAULT)) {
                                $newHash = password_hash($pass, PASSWORD_DEFAULT);
                                executeQuery('si', [$newHash, $row['uid']], "UPDATE users SET password = ? WHERE uid = ?");
                            }

                            return $this->login($row);
                        } else {
                            $error = true;
                            $code = 4;
                            $respMsg = 'The email and/or password you entered is incorrect.';
                        }

                        if ($error) {
                            $this->bruteForce($email, true);
                        }
                    }
                }
            }
        }

        if ($error) {
            return ['response' => 'error', 'code' => $code, 'msg' => $respMsg];
        }
    }

    function loginWithGoogle()
    {
        $error = false;
        $code = null;
        $msg = '';
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

        if (!$gtoken) {
            $error = true;
            $code = 1;
            $msg = 'No Google oauth token was supplied.';
        } else {
            if (!$this->googleCerts) {
                $this->googleCerts = json_decode(file_get_contents(
                    'https://www.googleapis.com/oauth2/v3/certs',
                    false,
                    stream_context_create(['http' => ['timeout' => 3]])
                ), true);
                $this->memcache->set('google_certs', $this->googleCerts, 3600);
            }

            try {
                $jwkKeys = JWK::parseKeySet($this->googleCerts);
                $decoded = JWT::decode($gtoken, $jwkKeys);

                if (!in_array($decoded->aud, $origin)) {
                    $error = true;
                    $code = 2;
                    $msg = 'The token provided has an invalid origin.';
                }

                if (!in_array($decoded->iss, ['accounts.google.com', 'https://accounts.google.com'])) {
                    $error = true;
                    $code = 3;
                    $msg = 'The token provided can\'t be validated for CSFR.';
                }

                if ($decoded->exp < time()) {
                    $error = true;
                    $code = 4;
                    $msg = 'The Google token provided has expired. Try again.';
                }

                if (!$error) {
                    $email = $decoded->email;

                    // check to see if user account is already registered in the database
                    $num = executeQuery('s', [$email], "SELECT uid, provider FROM users WHERE email = ?");

                    // email isn't on file, so create an account for the user
                    if (empty($num)) {
                        $this->createAccount($decoded->given_name, $decoded->family_name, $email, '', '1', '', '', 1);
                    } else {
                        // link google account to existing account
                        if ($num['provider'] == 0) {
                            executeQuery('i', [$num['uid']], "UPDATE users SET provider = '1' WHERE uid = ?");
                        }
                    }

                    // log the user in with google (or after creating an account if they don't have one)
                    $config = $this->productConfig();
                    $row = executeQuery('s', [$email], $this->sql(", confirmed{$config['extra']}", "{$config['join']} LEFT JOIN confirmation AS c ON c.email = u.email WHERE u.email = ? AND c.valid = 1 ORDER BY c.cid DESC LIMIT 1"));

                    $_SESSION['gtoken'] = $gtoken;
                    return $this->login($row);
                }
            } catch (Exception $e) {
                $error = true;
                $code = 5;
                $msg = $e->getMessage();
            }
        }

        if ($error) return ['response' => 'error', 'isGoogle' => true, 'code' => $code, 'msg' => $msg];
    }

    function returnURL($next)
    {
        global $method;

        $validSources = ['mapofire', 'wildfiremap', 'fireweatheravalanche', 'mapotrails', 'apps'];
        $services = ['www.mapofire.com', 'www.wildfiremap.org', 'www.fireweatheravalanche.org', 'www.mapotrails.com', 'apps.mapotechnology.com'];

        if (isset($this->fields['price_id'])) {
            //return $this->domain . 'checkout?price_id=' . $this->fields['price_id'] . ($this->fields['trial'] ? '&trial=1' : '') . '&customer_email=' . $this->fields['email'] . ($method == 'register' ? '&first_name=' . $this->fields['first_name'] . '&last_name=' . $this->fields['last_name'] . '&next=' . urlencode('secure/login?subscribed=1&pid=' . $this->fields['price_id']) : '');
            return 'https://www.mapotechnology.com/purchase/' . $this->fields['product_key'] . '/complete?newUser=1&price=' . $this->fields['price_id'] . ($this->fields['trial'] ? '&trial=1' : '') . '&customer_email=' . $this->fields['email'];
        } else {
            if ($this->source != null && $this->source != 'mapotechnology') {
                $key = array_search($this->source, $validSources);
                /*$sso_code = md5($this->token);
                executeQuery('ss', [$sso_code, $this->token, (time() + 45)], "INSERT INTO sso_exchange (sso_code,token,expires) VALUES(?,?,?)");*/

                return 'https://' . $services[$key] . '/authenticate?token=' . $this->token .
                    ($this->source != null ? '&service=' . $this->source : '') .
                    ($this->prod != null ? '&prod=' . $this->prod : '') .
                    ($next ? '&next=' . urlencode($next) : '');
            } else {
                return str_replace('//', '/', $next ? $next : '../account/home');
            }
        }
    }

    function getSubscriptions($email)
    {
        global $plan;
        $sub = executeQuery('s', [$email], "SELECT cid, subscription, trial, plan, created, start, end AS ends, status, cancel_end_period FROM billing WHERE email = ? AND status != 'expired' ORDER BY created DESC");

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
            'guid' => $row['guid'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'name' => $row['first_name'] . ' ' . $row['last_name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'role' => getUserRole($row['role']),
            'last_active' => intval($row['last_active']),
            'created' => intval($row['created']),
            'location' => $row['location'] ? json_decode($row['location']) : null,
            'provider' => $row['provider'] == '1' ? 'google' : 'internal',
            'expires' => intval($expires),
            'token' => $token,
            'subscriptions' => $subscribe
        );

        if ($method == 'login') {
            $out['confirmed'] = ($row['confirmed'] == 1 ? true : false);
        }

        if ($function == 'mapofire') {
            $set = json_decode($row['settings'], true);

            if (empty($set['weather'])) {
                $set['weather'] = null;
            }

            $out['settings'] = ['allsettings' => $row['settings'] ? $set : null, 'method' => $row['method'], 'synced' => intval($row['synced'])];
        } else if ($function == 'mapotrails') {
            $out['settings'] = ['mapotrails' => json_decode($row['settings']), 'synced' => intval($row['updatedTime'])];
        } else if ($function == 'oreroads') {
            $out['settings'] = ['oreroads' => json_decode($row['settings']), 'synced' => intval($row['updatedTime'])];
        }

        return $out;
    }

    function devices()
    {
        if ($this->fields['mode'] == 'terminate') {
            executeQuery('is', [$this->fields['sid'], $this->fields['token']], "UPDATE sessions SET expires = 0 WHERE sid = ? AND token = ?");

            return ['success' => true];
        } else {
            $dev = [];
            $user_agent = Parser::create();
            $now = time();
            $devices = executeQuery('si', [$this->fields['token'], $now], "SELECT sid, token, ip, host, source, location, created, expires FROM sessions WHERE uid = (SELECT uid FROM sessions WHERE token = ? LIMIT 1) AND expires > 0 AND expires > ? ORDER BY created DESC");

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

                    /*if ($device['location'] == '') {
                        $json = json_decode(file_get_contents('https://ipwho.is/' . $device['ip']));
                        $devLoc = ['location' => $json->city . ', ' . $json->region_code . ', ' . $json->country, 'isp' => $json->connection->isp];
                        $location = mysqli_real_escape_string($this->con, json_encode($devLoc));

                        executeQuery('ss', [$location, $device['sid']], "UPDATE sessions SET location = ? WHERE sid = ?");
                    } else {
                        $devLoc = json_decode($device['location']);
                    }*/
                    $devLoc = $device['location'] != '' ? json_decode($device['location']) : [];

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
        $fields = 'u.uid, s.guid, first_name, last_name, u.email, u.phone, password, u.location, u.created, role, provider, last_active, token, expires';
        $extra = '';
        $extra2 = '';

        switch ($function) {
            case 'mapofire':
                $extra = ', settings, method, mf.time AS synced';
                $extra2 = ' LEFT JOIN settings AS mf ON mf.uid = u.uid';
                break;
            case 'mapotrails':
                $extra = ', settings, ts.time AS updatedTime';
                $extra2 = ' LEFT JOIN trail_settings AS ts ON ts.uid = u.uid';
                break;
            case 'oreroads':
                $extra = ', settings, rd.time AS updatedTime';
                $extra2 = ' LEFT JOIN oreroads_settings AS rd ON rd.uid = u.uid';
                break;
        }

        $token = $_COOKIE['token'] ?? $this->fields['token'];
        $row = executeQuery('s', [$token], "SELECT {$fields}{$extra} FROM users AS u LEFT JOIN sessions AS s ON s.uid = u.uid$extra2 WHERE s.token = ?");

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => 'Database error: ' . $row['message']];
        } else {
            if ($row) {
                if ($row['expires'] == 0 || $row['expires'] < time()) {
                    return ['response' => 'error', 'code' => 1, 'msg' => 'The token provided has expired.'];
                } else {
                    // get any user subscriptions
                    $subscribe = $this->getSubscriptions($row['email']);

                    return ['user' => $this->getUser($row, null, $subscribe)];
                }
            } else {
                return ['response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.'];
            }
        }
    }

    function login($row)
    {
        $time = time();
        $expires = $time + 60 * 60 * 24 * 7;
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
        $update = executeQuery('ii', [$time, $row['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");

        if (isset($update['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $update[message]"];
        }

        $sess = executeQuery('isssssssi', [
            $row['uid'],
            $this->token,
            $this->guid,
            $this->ip,
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

        setcookie('token', $this->token, [
            'expires' => $expires,
            'path' => '/',
            'domain' => '.mapotechnology.com',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'None'
        ]);

        if (!$_COOKIE['guid']) {
            setcookie('guid', $this->guid, [
                'expires' => time() + 31557600,  // 60 * 60 * 24 * 365.25
                'path' => '/',
                'domain' => '.mapotechnology.com',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'None'
            ]);
        }

        logEvent('Logged in', false, $row['uid']);

        return [
            'auth' => true,
            'service' => $this->source,
            'next' => $this->returnURL($this->nextURL),
            'user' => $this->getUser($row, $expires, $subscribe)
        ];
    }

    function logout()
    {
        global $_SESSION;
        $invalid = ['response' => 'error', 'code' => 1, 'msg' => 'An invalid token was provided.'];
        $this->token = $this->fields['token'];

        if (!$this->token) {
            return $invalid;
        } else {
            $row = executeQuery('s', [$this->token], "SELECT uid FROM sessions WHERE token = ?");

            if (isset($row['error'])) {
                return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
            }

            if ($row) {
                $time = time();
                $uid = $row['uid'];

                setcookie('token', '', [
                    'expires' => $time - 2592000, // 60 * 60 * 24 * 30
                    'path' => '/',
                    'domain' => '.mapotechnology.com',
                    'secure' => true,
                    'httponly' => true,
                    'samesite' => 'None'
                ]);

                $_SESSION = [];
                session_regenerate_id();

                executeQuery('ii', [$time, $uid], "UPDATE users SET last_active = ? WHERE uid = ?");
                executeQuery('is', [$uid, $this->token], "UPDATE sessions SET expires = '0' WHERE uid = ? AND token = ?");

                return ['response' => 'success'];
            } else {
                return $invalid;
            }
        }
    }

    function forgot()
    {
        $email = $this->fields['email'];

        if (!$email) {
            return ['response' => 'error', 'code' => 1, 'msg' => 'You must provide an email address.'];
        } else {
            $row = executeQuery('s', [$email], "SELECT uid, first_name, email FROM users WHERE email = ?");

            if (isset($row['error'])) {
                return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
            } else {
                if (!$row) {
                    return ['response' => 'error', 'code' => 2, 'msg' => 'You must provide an email address.'];
                } else {
                    $expires = time() + 600;
                    $token = $this->createToken(['uid' => $row['uid'], 'unique' => 'resetPassword-' . time()], $expires);

                    executeQuery('i', [$row['uid']], "UPDATE password_reset SET expires = 0 WHERE uid = ?");
                    executeQuery('isi', [$row['uid'], $token, $expires], "INSERT INTO password_reset (uid,token,expires) VALUES(?,?,?)");

                    logEvent('Request sent to reset password', false, $row['uid']);

                    sendEmail($row['email'], 'Your account password was reset', 'reset', ['{fname}' => $row['first_name'], '{token}' => $token, '{email}' => $row['email']]);

                    return ['response' => 'success'];
                }
            }
        }
    }

    function reset()
    {
        $pass = $this->fields['pass'];
        $oauth = $this->fields['oauth_token'];
        $validOauth = $this->validateToken($oauth);

        if ($validOauth['response'] != 'valid') {
            return $validOauth;
        }

        $row = executeQuery('s', [$oauth], "SELECT p.uid, email, expires FROM password_reset AS p LEFT JOIN users AS u ON u.uid = p.uid WHERE token = ?");

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
        } else {
            if (!$row) {
                return ['response' => 'error', 'code' => 403, 'msg' => 'The password reset token provided is invalid.'];
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
                    executeQuery('i', [$row['uid']], "UPDATE password_reset SET expires = '0' WHERE uid = ?");
                    executeQuery('si', [$pass, $row['uid']], "UPDATE users SET password = ? WHERE uid = ?");

                    return ['response' => 'success'];
                }

                if ($error) {
                    return ['response' => 'error', 'code' => $code, 'msg' => $msg];
                }
            }
        }
    }

    function invitation()
    {
        $error = false;
        $code = 0;
        $msg = '';

        $orgKey = $this->fields['org_key'];
        $invite_code = $this->fields['invite_code'];
        $email = $this->fields['email'];
        $existingUser = $this->fields['uid'] ? true : false;

        $org = executeQuery('s', [$orgKey], "SELECT group_id FROM groups WHERE org_key = ?");

        if (!$org) {
            $error = true;
            $code = 1;
            $msg = 'The organization specified is invalid.';
        } else {
            if (!$invite_code) {
                $error = true;
                $code = 2;
                $msg = 'No invitation code was provided.';
            } else {
                $match = executeQuery('iiss', [time(), $org['group_id'], $invite_code, $email], "SELECT guid FROM group_users WHERE expires > ? AND group_id = ? AND invite_code = ? AND email = ? LIMIT 1");
                $guid = $match['guid'] ?? null;

                if (!$match) {
                    $error = true;
                    $code = 3;
                    $msg = 'We are unable to process your invitation.';
                }

                if (!validToken($invite_code)) {
                    $error = true;
                    $code = 4;
                    $msg = 'Your invitation code is either invalid or expired.';
                }
            }
        }

        // return output to class
        if ($error) {
            return ['response' => 'error', 'code' => $code, 'msg' => $msg];
        } else {
            if (!$existingUser) {
                $amsg = [];
                $passVal = $this->validatePassword($this->fields['pass']);

                if (empty($this->fields['first_name'])) $amsg[] = 'You must provide your first name.';
                if (empty($this->fields['last_name'])) $amsg[] = 'You must provide your last name.';
                if (empty($this->fields['pass'])) $amsg[] = 'Please enter a password.';
                if ($this->fields['pass'] != $this->fields['confirm_pass']) $amsg[] = 'Your passwords do not match.';
                if ($passVal[0] == 1) $amsg = array_merge($amsg, $passVal[1]);

                if ($amsg && count($amsg) > 0) {
                    return ['response' => 'error', 'code' => 5, 'msg' => implode('<br>', $amsg)];
                } else {
                    try {
                        $create = $this->createAccount($this->fields['first_name'], $this->fields['last_name'], $email, $this->fields['pass'], 5, '', '', 0, false);
                    } catch (Exception $e) {
                        return ['response' => 'error', 'code' => 500, 'msg' => $e->getMessage()];
                    }

                    if ($create['response'] == 'error') {
                        return $create;
                    } else {
                        mysqli_query($this->con, "UPDATE group_users SET uid = $create[uid] WHERE guid = $guid");
                    }
                }
            }

            mysqli_query($this->con, "UPDATE group_users SET expires = 0, status = 1 WHERE guid = $guid");
            return ['response' => 'success', 'email' => $email, 'existingUser' => $existingUser];
        }
    }

    function confirmation()
    {
        $error = false;
        $msg = '';
        $oauth = $this->fields['oauth_token'];
        $email = $this->fields['email'];

        $row = executeQuery('s', [$oauth], "SELECT u.first_name, u.email, confirmed FROM confirmation AS c LEFT JOIN users AS u ON u.email = c.email WHERE token = ?");

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
        } else {
            // if the token doesn't exist
            if (!$row) {
                $error = true;
                $code = 1;
                $msg = 'The token that was provided is invalid.';
            } else {
                try {
                    $decoded = $this->decodeToken($oauth);
                } catch (Exception $e) {
                    $error = true;
                    $code = 1;
                    $msg = 'The token that was provided is invalid.';
                }

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
                            executeQuery('s', [$oauth], "UPDATE confirmation SET confirmed = 1 WHERE token = ?");

                            sendEmail($email, 'Thanks for confirming your email', 'confirmed', ['{fname}' => $row['first_name'], '{email}' => $email]);

                            return ['response' => 'success', 'subscribed' => $this->fields['subscriber'] == 1 ? true : false];
                        } else {
                            $error = true;
                            $code = 4;
                            $msg = 'The token that was provided is invalid.';
                        }
                    }
                }
            }

            if ($error) {
                return ['response' => 'error', 'code' => $code, 'msg' => $msg];
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

    private function normalizeName($name)
    {
        $parts = explode(' ', $name);

        foreach ($parts as &$part) {
            $subParts = explode('-', $part);

            foreach ($subParts as &$sub) {
                if (preg_match("/^Mc(.+)$/i", $sub, $matches)) {
                    $sub = 'Mc' . ucfirst(strtolower($matches[1]));
                } else if (preg_match("/^O'(.+)$/i", $sub, $matches)) {
                    $sub = "O'" . ucfirst(strtolower($matches[1]));
                } else if (strpos($sub, "'") !== false) {
                    $apostropheParts = explode("'", $sub);
                    foreach ($apostropheParts as &$aPart) {
                        $aPart = ucfirst(strtolower($aPart));
                    }
                    $sub = implode("'", $apostropheParts);
                } else {
                    $sub = ucfirst(strtolower($sub));
                }
            }
            $part = implode('-', $subParts);
        }

        return implode(' ', $parts);
    }

    function createAccount($fname, $lname, $email, $pass, $role, $phone, $location, $thirdParty = 0, $needToConfirm = true)
    {
        $out = [];
        $tok = $this->createToken(['email' => $email]);
        $fname = $this->normalizeName($fname);
        $lname = $this->normalizeName($lname);
        $phone = $phone ?? '';
        $time = time();
        $pass = $pass ? $pass : $this->generatePassword();
        $password = password_hash($pass, PASSWORD_DEFAULT);

        $insert = executeQuery('ssssssssss', [
            $fname,
            $lname,
            $email,
            $password,
            $this->ip,
            $time,
            $role,
            $phone,
            $location,
            $thirdParty
        ], "INSERT INTO users (first_name,last_name,email,password,ip_address,created,role,phone,location,profilePic,provider) VALUES(?,?,?,?,?,?,?,?,?,'',?)");

        if (isset($insert['error'])) {
            $isDuplicate = str_contains($insert['message'], 'Duplicate entry');
            $out = ['response' => 'error', 'code' => 1, 'msg' => ($isDuplicate ? 'An account with this email address or phone number already exists.' : 'There was an error creating your account')];
        } else {
            $uid = mysqli_insert_id($this->con);

            if (!$uid) {
                $out = ['response' => 'error', 'code' => 2, 'msg' => 'There was an error creating your account'];
            } else {
                $ins1 = executeQuery('is', [$uid, $time], "INSERT INTO settings (uid,settings,time) VALUES(?,'',?)");
                $ins2 = executeQuery('is', [$uid, $time], "INSERT INTO trail_settings (uid,settings,time) VALUES(?,'',?)");
                $ins3 = executeQuery('is', [$uid, $time], "INSERT INTO oreroads_settings (uid,settings,app_token,time) VALUES(?,'','',?)");

                if (isset($ins1['error']) || isset($ins2['error']) || isset($ins3['error'])) {
                    $out = ['response' => 'error', 'code' => 3, 'msg' => 'There was an error creating your account'];
                } else {
                    $out = ['response' => 'success', 'uid' => $uid, 'subscribe' => isset($this->fields['price_id']) ? true : false];

                    // if user is starting a subscription
                    if (isset($this->fields['price_id'])) {
                        $_SESSION['customer_email'] = $email;

                        $out['next'] = $this->returnURL(null);
                    }

                    if ($needToConfirm) {
                        executeQuery('s', [$email], "UPDATE confirmation SET valid = 0 WHERE email = ?");
                        executeQuery('ss', [$email, $tok], "INSERT INTO confirmation (email,token,confirmed) VALUES(?,?,'0')");

                        $fields = ['{fname}' => $fname, '{email}' => $email, '{token}' => $tok, '{subscribe}' => (isset($this->fields['price_id']) ? '&subscriber=1' : '')];
                        sendEmail($email, 'Confirm your new account', 'newaccount', $fields);
                    }
                }
            }
        }

        return $out;
    }

    function register($google = false)
    {
        $error = false;
        $msgs = [];

        $fname = ucfirst($this->fields['first_name']);
        $lname = ucfirst($this->fields['last_name']);
        $email = $this->fields['email'];
        $phone = $this->fields['phone'];
        $pass = $this->fields['pass'];
        $cpass = $this->fields['confirm_pass'];
        $location = json_encode(json_decode(urldecode($this->fields['location'])));
        $role = 1;
        $passVal = $this->validatePassword($this->fields['pass']);

        $num = executeQuery('ss', [$email, $phone], "SELECT uid FROM users WHERE email = ? OR (phone != '' AND phone = ?)");

        if (isset($num['error'])) {
            $error = true;
            $msgs[] = 'There was an error trying to create your account';
        } else {
            if (empty($num)) {
                $code = 2;

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

                if (!isset($this->fields['tos']) || $this->fields['tos'] != 1) {
                    $error = true;
                    $msgs[] = 'You must agree to our Terms and Privacy Policy to create an account.';
                }
            } else {
                $error = true;
                $code = 1;
                $msgs[] = 'An account with this email address or phone number already exists.';
            }
        }

        // no errors, create the user's account
        if (!$error) {
            return $this->createAccount($fname, $lname, $email, $pass, $role, $phone, $location);
        } else {
            return ['response' => 'error', 'code' => $code, 'msg' => implode('<br>', $msgs)];
        }
    }

    function update()
    {
        global $function;

        $token = $this->fields['token'];
        $row = executeQuery('s', [$token], $this->sql(', token, expires', "LEFT JOIN sessions AS s ON s.uid = u.uid WHERE s.token = ?"));

        if (isset($row['error'])) {
            return ['response' => 'error', 'code' => 500, 'msg' => "Database error: $row[message]"];
        } else {
            if ($row) {
                if ($row['expires'] == 0 || $row['expires'] < time()) {
                    return ['response' => 'error', 'code' => 1, 'msg' => 'The token provided has expired.'];
                } else {
                    // update the user's information in the database
                    if ($function == 'location') {
                        $newLoc = json_encode(json_decode($this->fields['location']));
                        $update = executeQuery('si', [$newLoc, $row['uid']], "UPDATE users SET location = ? WHERE uid = ?");

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
                            sendEmail($this->fields['email'], 'Your account email was changed', 'changedemail', ['{fname}' => $this->fields['firstName']]);
                            sendEmail($row['email'], 'Your account email was changed', 'changedemail', ['{fname}' => $this->fields['firstName']]);
                        }

                        $update = executeQuery('ssssi', [$fn, $ln, $em, $ph, $row['uid']], "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE uid = ?");

                        if (isset($update['error'])) {
                            return ['response' => 'error', 'code' => 3, 'msg' => 'There was an error updating your account'];
                        }
                    }

                    return ['success' => true, 'db' => $function];
                }
            } else {
                return ['response' => 'error', 'code' => 2, 'msg' => 'An invalid token was provided.'];
            }
        }
    }

    function globalRateCheck()
    {
        global $method;

        $key = "rate:$method:global";
        $current = $this->memcache->increment($key, 1);

        if ($current === false) {
            $this->memcache->set($key, 1, 60);
            return false;
        }

        if ($current > 300) {
            return true;
        }

        return false;
    }
}

# create the user auth class
$sso = new SSO($con, $_REQUEST);

# if no method was provided to the API
if (empty($method)) {
    $returnJson = ['response' => 'error', 'error' => 403, 'msg' => '403 (Method forbidden)'];
} else {
    if ($sso->globalRateCheck()) {
        http_response_code(429);
        $returnJson = ['response' => 'error', 'error' => 429, 'msg' => "Too many $method attempts. Please try again shortly."];
    } else {
        $packages = ['com.mapollc.oreroads', 'com.mapollc.mapofire'];

        # create a user account
        if ($method == 'register') {
            $returnJson = $sso->register();
        } # login with google, otherwise login with MAPO
        else if ($method == 'login') {
            $returnJson = isset($_REQUEST['google']) && $_REQUEST['google'] == 1 ? $sso->loginWithGoogle() : $sso->authenticate();
        } # get user account info
        else if ($method == 'get') {
            $token = $_COOKIE['token'] ?? $_REQUEST['token'];

            if (!$token) {
                $returnJson = ['response' => 'error', 'code' => 2, 'msg' => 'An authentication token was not provided.'];
            } else {
                $validToken = $sso->validateToken($token);

                if ($validToken['response'] == 'valid') {
                    $u = $function == 'devices' ? $sso->devices() : $sso->user();
                    $returnJson = is_array($u) ? $u : ['response' => 'error', 'code' => 4, 'msg' => 'There was an error getting user data.'];
                } else {
                    $returnJson = $validToken;
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
        } # confirm email address for a user that was invited as a part of an organization
        else if ($method == 'invitation') {
            $returnJson = $sso->invitation();
        } # logout the user
        else if ($method == 'logout') {
            $returnJson = $sso->logout();
        } # update user settings
        else if ($method == 'update') {
            $returnJson = $sso->update();
        }
    }
}
