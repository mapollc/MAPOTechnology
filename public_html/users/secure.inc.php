<?
session_start();

/*function decodeToken($token) {
    $a = explode('.', $token);

    return json_decode(base64_decode($a[1]));
}*/
$redirect = false;
$time = time();
$baseURL = 'https://www.mapotechnology.com/';
$token = $_COOKIE['token'];

// no session or proper cookie exists
if (!isset($_SESSION['uid']) || !$token) {
    $redirect = true;
    $error = 1;
    // the session has expired
} else if ($_SESSION['expires'] < $time || !$_COOKIE['token']) {
    $redirect = true;
    $error = 2;
    // the logged in IP doesn't match the current IP
} /*else if ($token->ip != $_SERVER['REMOTE_ADDR']) {
    $redirect = true;
    $error = 3; echo 'yes';
}*/

// If security measures fail, take them to re-login
if ($redirect === true) {
    setcookie('token', $_COOKIE['token'], $time - 60 * 60 * 24 * 7, '/', '.mapotechnology.com');
    $_SESSION = array();
    session_regenerate_id();
    header('Location: ' . $baseURL . 'secure/login?fail=' . $error . '&next=' . urlencode(str_replace('?existing=1', '', $_SERVER['REQUEST_URI'])));
} else {
    $u = prepareQuery('is', [$_SESSION['uid'], $_COOKIE['token']], "SELECT u.location, method, s.time, se.expires, email, permissions, u.role FROM users AS u LEFT JOIN permissions AS p ON p.uid = u.uid LEFT JOIN settings AS s ON s.uid = u.uid LEFT JOIN sessions AS se ON se.uid = u.uid WHERE u.uid = ? AND se.token = ?");

    if (!isset($u['error'])) {
        if (time() > $u['expires']) {
            setcookie('token', $_COOKIE['token'], $time - (60 * 60 * 24 * 7), '/', '.mapotechnology.com', true);
            $_SESSION = array();
            session_regenerate_id();
            header('Location: ' . $baseURL . 'secure/login?fail=2&next=' . urlencode(str_replace('?existing=1', '', $_SERVER['REQUEST_URI'])));
        } else {
            $subs = prepareQuery('s', [$u['email']], "SELECT * FROM billing WHERE email = ? AND status = 'active'");

            if (isset($subs['cid'])) {
                $sub = [$subs];
            } else {
                $sub = $subs;
            }

            // Set global user variables
            $user = array(
                'uid' => $_SESSION['uid'],
                'fullName' => $_SESSION['name'],
                'firstInitial' => substr($_SESSION['first_name'], 0, 1),
                'lastInitial' => substr($_SESSION['last_name'], 0, 1),
                'firstName' => $_SESSION['first_name'],
                'lastName' => $_SESSION['last_name'],
                'email' => $u['email'],
                'role' => getUserRole($u['role']),
                'subscriptions' => $sub,
                'permissions' => ($u['permissions'] ? unserialize($u['permissions']) : []),
                'sync' => array('m' => $u['method'], 't' => $u['time']),
                'location' => unserialize($u['location'])
            );

            // use the script to update user's last active time
            if (isset($_SESSION['visited']) && time() - $_SESSION['visited'] > 600) {
                prepareQuery('ii', [time(), $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
            }
            $_SESSION['visited'] = time();
        }
    }
}