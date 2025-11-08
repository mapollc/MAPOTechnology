<?
////ini_set('display_errors',1);
////error_reporting(E_ALL);
ini_set('session.cookie_domain', '.mapotechnology.com');
session_start();
$validPages = ['login', 'register', 'forgot', 'confirmation'];
$gtoken = isset($_GET['gtoken']) ? $_GET['gtoken'] : null;

// receive login data from google
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['credential'])) {
    header('Location: ' . $_SERVER['SCRIPT_URI'] . "?gtoken=$_POST[credential]" . (isset($_POST['state']) ? '&' . $_POST['state'] : ''));
    exit();
}

if (!in_array($_GET['method'], $validPages)) {
    header("Location: ../secure/login");
    exit();
}

require_once 'db.ini.php';
require_once 'subs.inc.php';

if ($_GET['fail'] == 3) {
    $_SESSION = array();
    session_destroy();
    session_regenerate_id(true);
    setcookie('token', $_REQUEST['token'], time() - 60 * 60 * 24 * 7, '/', '.mapotechnology.com', true);
}

// brute force protection
if ($_SESSION['login_attempts'] >= 3 && $_SESSION['last_login_attempt'] + 900 > time()) {
    $locked = true;
}

$service = $_GET['src'] ? $_GET['src'] : ($_GET['service'] ? $_GET['service'] : null);
$fireMaps = ['mapofire', 'wildfiremap', 'fireweatheravalanche'];
$sourceURL = 'https://';
$serviceName = '';
$nextURL = preg_replace('/(\?|&)loggedOut=1/m', '', $_GET['next']);
$prod = $_GET['prod'];
$logo = 'mapo_logo.png';

// get the default service URL
if ($service == 'apps') {
    $sourceURL .= 'apps.mapotechnology.com';
} else {
    $sourceURL .= 'www.' . $service . '.' . (str_contains($service, 'mapo') ? 'com' : 'org');
}

// define the service name and logo for the referring service (if available)
if ($service == 'mapotrails') {
    $serviceName = 'Map of Trails';
    $logo = 'mapotrails_logo.png';
} else if (in_array($service, $fireMaps)) {
    $serviceName = 'Map of Fire';
    $logo = 'mapofire_logo.png';
} else {
    if ($prod) {
        if ($prod == 'oregonroads') {
            $serviceName = 'Oregon Roads';
            $logo = 'oreroads/oreroads_square_logo.png';
        }
    }
}

// verify if the user is already logged in
////if ($_GET['method'] == 'login') {
    if (isset($_SESSION) && $_SESSION['uid']/* && !isset($_GET['price_id'])*/) {
        $exp = prepareQuery('s', [$_SESSION['token']], "SELECT expires FROM sessions WHERE token = ?")['expires'];

        if ($_SESSION['expires'] < time() || ($exp == 0 || $exp <= time())) {
            $goto = '../logout?expired=1'.($_SERVER['QUERY_STRING'] ? '&'.preg_replace('/(%26|%3F)loggedOut%3D1/m', '', $_SERVER['QUERY_STRING']) : '');
        } else {
            if (isset($service)) {
                $goto = $sourceURL.'/authenticate?'.($service ? 'service='.$service.'&' : '').'token='.$_SESSION['token'].($nextURL ? '&next='.urlencode($nextURL) : '');
            } else {
                if ($nextURL) {
                    $goto = $nextURL;
                } else {
                    $goto = '../account/home?existing=1';
                }
            }
        }

        #echo $goto;
        header("Location: $goto");
        exit();
    }

    /*if (isset($_SESSION) && $_SESSION['uid'] && !isset($_GET['price_id'])) {
        # if session and cookie token values are the same
        //if ($_SESSION['token'] == $_COOKIE['token']) {
        $exp = mysqli_fetch_assoc(mysqli_query($con, "SELECT expires FROM sessions WHERE token = '$_SESSION[token]'"))['expires'];

        // token is expired
        if ($_SESSION['expires'] <= time() || ($exp == 0 || $exp <= time())) {
            header('Location: ../logout?expired=1'.($_SERVER['QUERY_STRING'] ? '&'.$_SERVER['QUERY_STRING'] : ''));
        } else {
            $goto = $sourceURL.'/authenticate?token='.$_SESSION['token'].($_REQUEST['next'] ? '&next='.urlencode($_REQUEST['next']) : '');

            if (!$service) {
                $goto = '../account/home?existing=1';
            }

            header('Location: '.$goto);
            exit();
        }
    }*/
////}

if ($_GET['fail']) {
    switch ($_GET['fail']) {
        case 1:
            $msg = 'You must be logged in to view this content';
            break;
        case 2:
            $msg = 'Your session has timed out. Please login again';
            break;
        case 3:
            $msg = 'Single sign-on authentication failed. Please login again';
            break;
    }
}

$title = $_GET['method'] == 'login' ? 'Account Login' : ($_GET['method'] == 'forgot' ? ($_GET['verify'] == 1 ? 'Reset your Password' : 'Forgot Password') : ($_GET['method'] == 'confirmation' ? 'Confirm Your Account' : 'Create an Account'));
?>
<!DOCTYPE html>
<html>

<head>
    <title><?=($service ? "$serviceName - " : '').$title?> | MAPO LLC</title>
    <meta charset="utf-8">
    <meta name="description" content="" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
    <link rel="shortcut icon" href="../assets/images/favicon.ico" type="image/x-icon" />
    <link rel="apple-touch-icon" sizes="120x120" href="../assets/images/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="../assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../assets/images/favicon-16x16.png">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;600&display=swap">
    <meta name="robots" content="index,follow">
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link href="https://www.mapotechnology.com/assets/css/global.css" rel="stylesheet">
    <link href="https://www.mapotechnology.com/assets/css/user.css" rel="stylesheet">
</head>

<body>
    <main>
        <div class="wrapper">
            <a href="https://www.mapotechnology.com" class="logo"><img src="../../assets/images/<?= $logo ?>" alt="<?=$serviceName ? $serviceName : 'MAPO'?> logo" title="<?=$serviceName ? $serviceName : 'MAPO'?> logo"></a>
            <h1><?= $title ?></h1>

            <?if (isset($_GET['price_id'])) {
                $plan->setPlan(null, $_GET['price_id']);
                echo '<div class="message subscribe">Start your <b>' . $plan->getName() . '</b> subscription by creating a new account, or logging into your existing account.</div>';
            }
            if (isset($_GET['session_id'])) {
                echo '<p id="crfas" style="color:#666;text-align:center;margin-top:0.75em">Finish creating an account to activate your subscription.</p>';
            }
            if (isset($_GET['error']) || isset($_GET['fail'])) {
                echo '<div class="message error">' . $msg . '.</div>';
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
                echo '<div class="message subscribe">You have subscribed to <b>'.$productName.'</b>'.($customer ? ', '.$customer : '').'.</div>';
                
                if (!isset($_GET['checkout_id'])) {
                    echo '<div class="message success">Your account was successfully created. Please check your email for a confirmation link to verify your account.</div>';
                }
            }
            if ($locked) {
                $total = $_SESSION['last_login_attempt'] + 900 - time();
                $when = $total < 60 ? $total.' seconds.' : round($total / 60, 0).' minutes';
                echo '<div class="message error" id="loginerrors">Your account has been locked due to multiple failed login attempts. Try again in '.$when.'.</div>';   
            }?>

            <form action="" id="<?= $_GET['method'] ?>" method="post">
                <input type="hidden" name="ip" value="<?=$_SERVER['REMOTE_ADDR']?>">
                <? if (isset($_GET['price_id'])) { ?>
                    <input type="hidden" name="subscribe" value="1">
                    <input type="hidden" name="price_id" value="<?= $_GET['price_id'] ?>">
                    <input type="hidden" name="product_key" value="<?= $_GET['product_key'] ?>">
                    <?if ($_REQUEST['trial']) {
                    echo '<input type="hidden" name="trial" value="1">';
                    } 
                }
                if (isset($_GET['session_id'])) { ?>
                    <input type="hidden" name="subscribed" value="1">
                    <input type="hidden" name="sid" value="<?= $id ?>">
                <? }
                if ($_GET['method'] == 'confirmation') {?>
                    <input type="hidden" name="email" value="<?=$_GET['email']?>">
                    <input type="hidden" name="oauth_token" value="<?=$_GET['oauth_token']?>">
                    <?if($_GET['subscriber'] == 1){?>
                    <input type="hidden" name="subscriber" value="1">
                    <?}?>
                    <p style="text-align:center">Confirm your email address, <b><?=$_GET['email']?></b>?</p>
                    <input type="submit" class="btn btn-lg btn-blue" data-o="Verify Email" value="Verify Email">
                <?}
                if ($_GET['method'] == 'login') { ?>
                    <? if ($service) { ?>
                        <input type="hidden" name="service" value="<?= $service ?>">
                    <? }
                    if ($prod) { ?>
                        <input type="hidden" name="prod" value="<?= $prod ?>">
                    <? } ?>
                    <input type="hidden" name="next" value="<?= $nextURL ?>">

                    <p style="margin-bottom:30px;text-align:center">Need an account? <a class="fl" href="register<?=isset($_GET['price_id']) ? '?service='.$service.'&next='.$nextURL.'&price_id=' . $_GET['price_id'] : ($service ? '?service=' . $service . ($prod ? '&prod='.$prod : '') : '')?>">Sign Up</a></p>
                    
                    <div class="field"><label>Email</label>
                        <input type="email" autocomplete="email" required name="email" value="" placeholder="Email Address">
                    </div>

                    <div class="password field"><label>Password</label>
                        <input type="password" name="pass" autocomplete="password" required value="" placeholder="Password">
                        <a href="#" id="showpwd" onclick="return false" data-d="true">show</a>
                    </div>

                    <input type="submit" class="btn btn-lg btn-blue" <?=$locked ? 'disabled ' : ''?>data-o="Login" value="Login">
                    <? if ($source) { ?>
                        <input type="button" class="btn btn-lg btn-gray" style="width:100%" onclick="window.location.href='<?= $nextURL ?>'" value="Go Back">
                    <? } ?>

                    <p class="or">or</p>

                    <div class="g_id_signin" data-type="standard" data-size="large" data-theme="outline" data-text="signin_with" data-shape="pill" data-logo_alignment="left" style="display:block;margin:0 auto;max-width:183px"></div>
                    <p style="margin-top:15px;text-align:center"><a class="fl" href="forgot">Forgot Password?</a></p>
                <? } else if ($_GET['method'] == 'forgot') { ?>
                    <? if ($_GET['verify'] == 1) { ?>
                        <input type="hidden" name="verify" value="1">
                        <input type="hidden" name="email" value="<?= $_GET['email'] ?>">
                        <input type="hidden" name="oauth_token" value="<?= $_GET['oauth_token'] ?>">
                        <div class="password">
                            <input type="password" name="pass" value="" placeholder="New Password">
                            <a href="#" onclick="return false" data-d="true">show</a>
                        </div>

                        <div class="req container" style="display:none">
                            <span id="p1">Your password must be at least 8 characters</span>
                            <span id="p2">Your password must have at least 1 number</span>
                            <span id="p3">Your password must have at least 1 lowercase letter</span>
                            <span id="p4">Your password must have at least 1 uppercase letter</span>
                            <span id="p5">Your password must be at least 1 symbol</span>
                        </div>

                        <input type="password" name="confirm_pass" value="" placeholder="Confirm Password">

                        <div id="meets" class="container" style="display:none;font-size:14px;color:var(--red)">Your passwords don't match</div>

                        <input type="submit" class="btn btn-lg btn-blue" data-o="Reset Password" value="Reset Password">
                    <? } else { ?>
                        <p style="margin:15px 0 30px 0;font-size:15px;text-align:center;line-height:1.3">Forgot your password? Enter your email address. We'll send you a link to reset your password.</p>

                        <div class="field"><label>Email</label>
                            <input type="email" name="email" value="" placeholder="Email Address">
                        </div>
                        <input type="submit" class="btn btn-lg btn-blue" data-o="Reset Password" value="Reset Password">

                        <p style="margin:30px 0 5px 0;text-align:center"><a class="fl" href="login">Login Instead</a></p>
                    <? } ?>
                <? } else if ($_GET['method'] == 'register') { ?>
                    <p style="margin-bottom:30px;text-align:center">Already have an account? <a class="fl" href="login?<?=explode('?', $_SERVER['REQUEST_URI'])[1]?>">Login</a></p>

                    <input type="hidden" name="location" value="">
                    
                    <input type="text" name="first_name" value="<?= $fname ?>" required placeholder="First Name">
                    <input type="text" name="last_name" value="<?= $lname ?>" required placeholder="Last Name">
                    <input type="email" name="email" value="<?= $email ?>" required placeholder="Email Address">
                    <input type="tel" name="phone" value="" placeholder="Phone Number" maxlength="12" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
                    <div class="password">
                        <input type="password" name="pass" value="" required placeholder="Password">
                        <a href="#" onclick="return false"data-d="true">show</a>
                    </div>

                    <div class="req container" style="display:none">
                        <span id="p1">Your password must be at least 8 characters</span>
                        <span id="p2">Your password must have at least 1 number</span>
                        <span id="p3">Your password must have at least 1 lowercase letter</span>
                        <span id="p4">Your password must have at least 1 uppercase letter</span>
                        <span id="p5">Your password must be at least 1 symbol</span>
                    </div>

                    <input type="password" name="confirm_pass" value="" required placeholder="Confirm Password">

                    <div id="meets" class="container" style="display:none;font-size:14px;color:var(--red)">Your passwords don't match</div>

                    <div style="position:relative">
                        <input type="text" id="city" autocomplete="off" value="Getting location..." disabled>
                        <div id="cityResults" class="results"></div>
                        <a href="#" id="wrong" style="display:block;width:100%;margin:0 0 20px 0" onclick="return false">Wrong location?</a>
                    </div>

                    <div class="checkbox" style="display:block;margin:0">
                        <input type="checkbox" id="tos" name="tos" value="1">
                        <label for="tos" style="display:inline;font-size:13px;line-height:1.5">By creating an account, you're indicating you have read and agree to our <a href="../about/legal/terms">Terms</a> and <a href="../about/legal/privacy">Privacy Policy</a>.</label>
                    </div>

                    <input type="submit" class="btn btn-lg btn-blue dis" disabled id="create" data-o="<?= isset($_GET['session_id']) ? 'Finalize Subscription' : 'Create Account' ?>" value="<?= isset($_GET['session_id']) ? 'Finalize Subscription' : 'Create Account' ?>">
                <? } ?>
            </form>

            <div class="info">
                <p>&copy; <?= date('Y') ?> MAPO LLC</p>
                <p><a href="../about/legal/terms">Terms</a></p>
                <p><a href="../about/legal/privacy">Privacy Policy</a></p>
            </div>
        </div>
    </main>

    <?if($_GET['method'] == 'login') {
        $redirectURI = preg_replace('/method=([A-Za-z0-9]+)&?/', '', $_SERVER['REDIRECT_QUERY_STRING']);
    ?>
    <div id="g_id_onload"
        data-client_id="27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com"
        data-login_uri="https://www.mapotechnology.com/secure/login"
        data-context="signin"
        data-ux_mode="redirect"
        <?=$redirectURI ? 'data-state="' . $redirectURI . '"' : ''?>
        data-callback="loginWithGoogle"
        data-auto_prompt="false">
    </div>

    <script defer async src="https://accounts.google.com/gsi/client"></script>
    <?}?>
    <script>const ipaddr = '<?=$_SERVER['REMOTE_ADDR']?>'<?=$gtoken != null ? ", gtoken = '$gtoken'" : ''?>;</script>
    <script src="https://www.mapotechnology.com/src/js/auth.js"></script>
</body>

</html>