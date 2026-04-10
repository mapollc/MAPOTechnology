<?
ini_set('display_errors', 0);
error_reporting(E_PARSE | E_ERROR);

require_once 'config.inc.php';

// verify if the user is already logged in and then redirect them
if (isset($_SESSION['uid']) && $method != 'invitation') {
    $exp = executeQuery('s', [$_SESSION['token']], "SELECT expires FROM sessions WHERE token = ?")['expires'];

    if ($_SESSION['expires'] < time() || $exp <= time()) {
        $goto = '//mapotechnology.com/logout?expired=1' . ($_SERVER['QUERY_STRING'] ? '&' . preg_replace('/(%26|%3F)loggedOut%3D1/m', '', $_SERVER['QUERY_STRING']) : '');
    } else {
        if ($service) {
            $goto = "$sourceURL/authenticate?" . ($service ? "service=$service&" : '') . "token=$_SESSION[token]" . ($nextURL ? '&next=' . urlencode($nextURL) : '');
        } else {
            $goto = $nextURL ?: '//mapotechnology.com/account/home?existing=1';
        }
    }

    ////echo $goto;
    header("Location: $goto");
    exit();
}

if ($method == 'invitation') {
    $org = executeQuery('s', [$_GET['org_key']], "SELECT name AS orgName FROM groups WHERE org_key = ?");
    $orgUser = executeQuery('s', [$_GET['invite_code']], "SELECT uid, email FROM group_users WHERE invite_code = ?");
    $orgName = $org['orgName'] ?? '';
    $existingUser = !empty($orgUser['uid']);
    $validInviteCode = validToken($_GET['invite_code']) == 1 ? true : false;
}

$failMessages = [
    1 => 'You must be logged in to view this content',
    2 => 'Your session expired. Please sign in again to continue',
    3 => 'Single sign-on authentication failed. Please sign in again',
    4 => $_GET['err']
];
$msg = $_GET['fail'] ?? 0 ? $failMessages[$_GET['fail']] : '';

$pageTitles = [
    'login' => 'Account Login',
    'reset' => 'Reset your Password',
    'forgot' => 'Forgot Password',
    'confirmation' => 'Confirm Your Account',
    'invitation' => 'Accept Invitation',
    'register' => 'Create an Account'
];
$title = $pageTitles[$method] ?? 'Account Login';
$desc = "Access your " . ($serviceName ?: "MAPO LLC") . " account. Sign in or create an account to manage subscriptions, profile settings, and more.";
?>
<!DOCTYPE html>
<html>

<head lang="en-US">
    <meta charset="utf-8">
    <title><?= ($service && $serviceName ? "$serviceName - " : '') . $title ?> | MAPO LLC</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=1">
    <meta name="description" content="<?= $desc ?>" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#333" />
    <meta name="og:title" content="<?= ($service ? "$serviceName - " : '') . $title ?> | MAPO LLC" />
    <meta name="og:type" content="website" />
    <meta name="og:description" content="<?= $desc ?>" />
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
    <link rel="apple-touch-icon" sizes="120x120" href="//mapotechnology.com/assets/images/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="//mapotechnology.com/assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="//mapotechnology.com/assets/images/favicon-16x16.png">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;600&display=swap">
    <meta name="robots" content="index,follow">
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link href="//mapotechnology.com/src/css/global.css" rel="stylesheet">
    <link href="//mapotechnology.com/src/css/auth.css" rel="stylesheet">
</head>

<body>
    <main>
        <div class="wrapper">
            <a href="//mapotechnology.com" class="logo">
                <img src="//mapotechnology.com/assets/images/<?= $logo ?>" alt="<?= $serviceName ?: 'MAPO' ?> logo" title="<?= $serviceName ?: 'MAPO' ?> logo">
            </a>
            <h1><?= $title ?></h1>

            <?
            if ($method == 'invitation' && !$validInviteCode) {
                echo '<div class="message error">The invitation code is invalid or expired.</div>';
            }
            if (isset($_GET['group_account'])) {
                echo '<div class="message subscribe">Thanks for accepting the invitation. You can now login.</div>';
            }
            if (isset($_GET['price_id'])) {
                $plan->setPlan(null, $_GET['price_id']);
                echo '<div class="message subscribe">Start your <b>' . $plan->getName() . '</b> subscription by creating a new account, or logging into your existing account.</div>';
            }
            if (isset($_GET['session_id'])) {
                echo '<p id="crfas" style="color:#666;text-align:center;margin-top:0.75em">Finish creating an account to activate your subscription.</p>';
            }
            if (isset($_GET['error']) || isset($_GET['fail'])) {
                echo "<div class=\"message error\">$msg.</div>";
            }
            if ($_GET['valid'] == 1 && $_GET['confirm'] == 1) {
                echo '<div class="message success">Your account has been successfully verified' . ($_GET['subscriber'] == 1 ? ' and your subscription is now active' : '') . '.</div>';
            }
            if ($_GET['delete_acct'] == 1) {
                echo '<div class="message success">You account was successfully deleted. We\'re sorry to see you go.</div>';
            }
            if ($_GET['loggedOut'] == 1) {
                echo '<div class="message success">You have successfully been logged out.</div>';
            }
            if ($_GET['reset'] == 1) {
                echo '<div class="message success">Your password was reset. You can login again.</div>';
            }
            if ($_GET['subscribed'] == 1 || isset($_GET['checkout_id'])) {
                echo "<div class=\"message subscribe\">You have subscribed to <b>$productName</b>" . ($customer ? ", $customer" : '') . ".</div>";

                if (!isset($_GET['checkout_id'])) {
                    echo '<div class="message success">Your account was successfully created. Please check your email for a confirmation link to verify your account.</div>';
                }
            }

            // show a message if the user has tried to login too many times and has been locked out for several minutes
            if ($locked) {
                echo "<div class=\"message error\" id=\"loginerrors\">Your account has been locked due to multiple failed login attempts. Try again in $when.</div>";
            } ?>

            <form action="" id="<?= $method ?>" method="post">
                <input type="hidden" name="ip" value="<?= $_SERVER['REMOTE_ADDR'] ?>">
                <? if (isset($_GET['price_id'])) { ?>
                    <input type="hidden" name="subscribe" value="1">
                    <input type="hidden" name="price_id" value="<?= $_GET['price_id'] ?>">
                    <input type="hidden" name="product_key" value="<?= $_GET['product_key'] ?>">
                <? if ($_REQUEST['trial']) echo '<input type="hidden" name="trial" value="1">';
                }

                if (isset($_GET['session_id'])) { ?>
                    <input type="hidden" name="subscribed" value="1">
                    <input type="hidden" name="sid" value="<?= $id ?>">
                <? } ?>

                <? if ($method == 'login' && isset($_GET['gtoken']) && !empty($_GET['gtoken'])) {
                    if ($service) echo "<input type=\"hidden\" name=\"service\" value=\"$service\">";
                    if ($prod) echo "<input type=\"hidden\" name=\"prod\" value=\"$prod\">";

                    //echo '<input type="hidden" name="next" value="' . $nextURL . '">';
                    echo "<div id=\"loading_login\"><div class=\"loading\" style=\"margin:3em auto 2em auto\"></div>
                    <p style=\"margin-bottom:175px;text-align:center\">We're signing you in...</p></div>";
                } else {
                    if (in_array($method, $allowedMethods)) require_once "$method.inc.php";
                } ?>

            </form>

            <div class="info">
                <p>&copy; <?= date('Y') ?> MAPO LLC</p>
                <p><a href="//mapotechnology.com/about/legal/terms">Terms</a></p>
                <p><a href="//mapotechnology.com/about/legal/privacy">Privacy Policy</a></p>
            </div>
        </div>
    </main>

    <script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
    <? if ($method == 'login') echo '<script defer async src="https://accounts.google.com/gsi/client"></script>'; ?>
    <script>
        <?= isset($_REQUEST['state']) ? 'const auth_state="' . str_replace('loggedOut=1', '', base64_decode($_REQUEST['state'])) . '";' : '' ?>window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'G-J2PB456CE6'
            <?= isset($_COOKIE['guid']) ? ",{'user_id':'$_COOKIE[guid]'}" : '' ?>);
        const ipaddr = '<?= $_SERVER['REMOTE_ADDR'] ?>'
        <?= $gtoken != null ? ",gtoken='$gtoken'" : '' ?>;
    </script>
    <script src="//mapotechnology.com/js/auth.js"></script>

</body>

</html>