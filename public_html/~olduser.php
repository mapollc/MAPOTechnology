<?
ini_set('session.cookie_domain', '.mapotechnology.com');
session_start();
include_once('db.ini.php');

$source = $_GET['src'] ? $_GET['src'] : ($_GET['service'] ? $_GET['service'] : null);
$nextURL = $_GET['next'];

if ($source == 'apps') {
    $sourceURL = 'https://apps.mapotechnology.com';
} else {
    $sourceURL = 'https://'.$source.'.com';
}

if ($source == 'oregonroads' || $_GET['prod'] == 'oregonroads') {
    $logo = 'oreroads/oreroads_square_logo.png';
} else {
    $logo = 'mapo'.($source && $source != 'apps' ? str_replace('mapo', '', $source) : '').'_logo.png';
}

if ($_COOKIE['token']) {
    if ($source) {
        $exp = mysqli_fetch_assoc(mysqli_query($con, "SELECT expires FROM sessions WHERE token = '$_COOKIE[token]'"))['expires'];
        if ($exp != 0 && $exp > time()) {
            header('Location: '.$sourceURL.'/authenticate?token='.$_COOKIE['token'].($_REQUEST['next'] ? '&next='.$_REQUEST['next'] : ''));
            exit();
        } else {
            $_SESSION = array();
            session_regenerate_id();
            setcookie('token', '', time() - (60 * 60 * 24 * 7), '/', '.mapotechnology.com');
        }    
    } else {
        if ($_SESSION['uid']) {
            header('Location: '.($nextURL ? $nextURL : '../account/home?existing=1'));
        } else {
            if ($_REQUEST['method'] == 'login' && isset($_REQUEST['token'])) {
                header('Location: ../authenticate/validate?token=' . $_REQUEST['token']);
            }
        }
        exit();
    }
} else {
    $_SESSION = array();
    session_regenerate_id();
    setcookie('token', '', time() - (60 * 60 * 24 * 7), '/', '.mapotechnology.com');
}

if ($_GET['method'] == 'login') {
    if (!isset($_SESSION['login_attempts'])) {
        $_SESSION['login_attempts'] = 0;
    }

    if ($_GET['confirm'] == 1) {
        switch ($_GET['error']) {
            case 1:
                $msg = 'The specified token does not exist';
                break;
            case 2:
                $msg = 'This email/account has already been verified';
                break;
            case 3:
                $msg = 'The email in the confirmation link doesn\'t match the email on file';
                break;
        }
    } else {
        switch ($_GET['error']) {
            case 1:
                $msg = 'You must enter an email and password to login';
                break;
            case 2:
                $msg = 'An account with that email does not exist';
                break;
            case 3:
                $msg = 'The email/password you entered is incorrect';
                break;
            case 4:
                $msg = 'This account has not been confirmed yet';
                break;
            case 5:
                $msg = 'Your login could not be authenticated';
                break;
            case 6:
                $msg = 'You had too many failed login attempts. Try again in '.($_GET['rety'] ? $_GET['rety'] : '15').' minutes';
                break;
        }

        switch ($_GET['fail']) {
            case 1:
                $msg = 'You must be logged in to view this content';
                break;
            case 2:
                $msg = 'Your session has timed out. Please login again';
                break;
            case 3:
                $msg = 'The email in the confirmation link doesn\'t match the email on file';
                break;
        }
    }
} else if ($_GET['method'] == 'register') {
    if (isset($_GET['session_id'])) {
        include_once('/home/mapo/stripe/init.php');
        \Stripe\Stripe::setApiKey($stripeSecretKey);

        try {
            $session = \Stripe\Checkout\Session::retrieve($_GET['session_id']);
            $id = $session->subscription;
            $fname = $session->custom_fields[0]->text->value;
            $lname = $session->custom_fields[1]->text->value;
            $email = $session->{'customer_details'}->email;

            $sub = \Stripe\Subscription::retrieve($id, []);
            $created = $sub->created;
            $start = $sub->current_period_start;
            $end = $sub->current_period_end;
            $plan = $sub->items->data[0]->plan->id;

            mysqli_query($con, "INSERT IGNORE INTO billing (email,subscription,plan,created,start,end,active) VALUES('$email','$id','$plan','$created','$start','$end','1')");
        } catch (Error $e) {
            echo $e;
        }
    }
}

$title = ($_GET['method'] == 'login' ? 'Account Login' : ($_GET['method'] == 'forgot' ? ($_GET['verify'] == 1 ? 'Reset your Password' : 'Forgot Password') : 'Create an Account'));
?>

<!DOCTYPE html>
<html>

<head>
    <title><?= $title ?></title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
    <link rel="shortcut icon" href="../assets/images/favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400;800&display=swap">
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link href="https://www.mapotechnology.com/assets/css/global.css" rel="stylesheet">
    <link href="https://www.mapotechnology.com/assets/css/user.css" rel="stylesheet">
</head>
<body>
    <main>
        <div class="promo"></div>
        <div class="wrapper">
            <a href="https://www.mapotechnology.com" class="logo"><img src="../../assets/images/<?=$logo?>"></a>
            <h1><?=$title?></h1>

            <?if (isset($_GET['session_id'])) {
                echo '<p id="crfas" style="color:#666;text-align:center;margin-top:0.75em">Finish creating an account to activate your subscription.</p>';
            }
            if (isset($_GET['error']) || isset($_GET['fail'])) {
                echo '<div class="message error">' . $msg . '.</div>';
            }
            if ($_GET['valid'] == 1 && $_GET['confirm'] == 1) {
                echo '<div class="message success">Your account has successfully been verified'.($_GET['subscribed'] == 1 ? ' and your subscription is now active' : '').'.</div>';
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
            if ($_GET['new_sub'] == 1) {
                echo '<div class="message success">Your account was successfully created. Please check your email for a confirmation link to verify your account.</div>';
            }?>

            <form action="../authenticate/<?= $_GET['method'] ?>" <?= ($_GET['method'] == 'register' ? ' id="secure"' : ($_GET['method'] == 'forgot' ? ' id="reset"' :  ($_GET['method'] == 'login' ? ' id="login"' : ''))) ?> method="post">
                <input type="hidden" name="ip" value="<?=$_SERVER['REMOTE_ADDR']?>">
                <?if ($_GET['subscribe'] == 1) {?>
                    <input type="hidden" name="subscribe" value="1">
                    <input type="hidden" name="price_id" value="<?=$_GET['price_id']?>">
                <?}
                if (isset($_GET['session_id'])) {?>
                    <input type="hidden" name="subscribed" value="1">
                    <input type="hidden" name="sid" value="<?=$id?>">
                <?}if ($_GET['method'] == 'login') { ?>
                    <?if($source){?>
                    <input type="hidden" name="source" value="<?=$source?>">
                    <?}if ($_GET['prod']){?>
                    <input type="hidden" name="prod" value="<?=$_GET['prod']?>">
                    <?}?>
                    <input type="hidden" name="next" value="<?= $nextURL ?>">
                    <input type="email" name="email" value="" placeholder="Email Address">
                    <div class="password">
                        <input type="password" name="pass" value="" placeholder="Password">
                        <a href="#" data-d="true">show</a>
                    </div>
                    <input type="submit" class="btn btn-lg btn-blue" value="Login">
                    <?if($source){?>
                    <input type="button" class="btn btn-lg btn-gray" style="width:100%" onclick="window.location.href='<?=$nextURL?>'" value="Go Back">
                    <?}?>

                    <p class="or">or</p>
                    <div class="g_id_signin" data-type="standard" data-size="large" data-theme="filled_blue" data-text="signin_with" data-shape="rectangular" data-logo_alignment="left" style="display:block;margin:0 auto;max-width:202px"></div>
                    <p style="margin:25px 0 5px 0;text-align:center">Need an account? <a class="fl" href="register<?=($_GET['subscribe'] == 1 ? '?subscribe=1&price_id='.$_GET['price_id'] : ($source ? '?src='.$source : ''))?>">Sign Up</a></p>
                    <p style="text-align:center"><a class="fl" href="forgot">Forgot Password?</a></p>
                    
                <? } else if ($_GET['method'] == 'forgot') { ?>
                    <? if ($_GET['verify'] == 1) { ?>
                        <input type="hidden" name="verify" value="1">
                        <input type="hidden" name="email" value="<?=$_GET['email']?>">
                        <input type="hidden" name="token" value="<?=$_GET['oauth_token']?>">
                        <div class="password">
                            <input type="password" name="pass" value="" placeholder="New Password">
                            <a href="#" data-d="true">show</a>
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

                        <input type="submit" class="btn btn-lg btn-blue" value="Reset Password">

                    <? } else { ?>
                        <p style="margin:15px 0;font-size:15px;text-align:center;line-height:1.3">Forgot your password? Enter your email address. We'll send you a link to reset your password.</p>

                        <input type="email" name="email" value="" placeholder="Email Address">
                        <input type="submit" class="btn btn-lg btn-blue" value="Reset Password">

                        <p style="margin:30px 0 5px 0;text-align:center"><a class="fl" href="login">Login Instead</a></p>
                    <? } ?>

                <? } else if ($_GET['method'] == 'register') {?>
                    <input type="hidden" name="location" value="">
                    <input type="text" name="first_name" value="<?=$fname?>" placeholder="First Name">
                    <input type="text" name="last_name" value="<?=$lname?>" placeholder="Last Name">
                    <input type="email" name="email" value="<?=$email?>" placeholder="Email Address">
                    <input type="tel" name="phone" value="" placeholder="Phone Number" maxlength="12" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
                    <div class="password">
                        <input type="password" name="pass" value="" placeholder="Password">
                        <a href="#" data-d="true">show</a>
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

                    <div style="position:relative">
                        <input type="text" id="city" value="Getting location..." disabled>
                        <div id="cityResults" class="results"></div>
                        <a href="#" id="wrong" style="display:block;width:100%;margin:0 0 20px 0" onclick="return false">Wrong location?</a>
                    </div>

                    <div class="checkbox" style="display:block;margin:0">
                        <input type="checkbox" id="tos" name="tos" value="1">
                        <label for="tos" style="display:inline;font-size:13px;line-height:1.5">By creating an account, you're indicating you have read and agree to our <a href="../about/legal/terms">Terms</a> and <a href="../about/legal/privacy">Privacy Policy</a>.</label>
                    </div>

                    <input type="submit" class="btn btn-lg btn-blue" disabled id="create" value="<?=(isset($_GET['session_id']) ? 'Finalize Subscription' : 'Create Account')?>">

                    <p style="margin:30px 0 5px 0;text-align:center">Already have an account? <a class="fl" href="login<?=($_GET['subscribe'] == 1 ? '?subscribe=1&price_id='.$_GET['price_id'] : ($source ? '?service='.$source.($nextURL ? '&next='.urlencode($nextURL) : '') : ''))?>">Login</a></p>
                <?}?>
            </form>
            
            <div class="info">
                <p>&copy; <?=date('Y')?> MAPO LLC</p>
                <p><a href="../about/legal/terms">Terms</a></p>
                <p><a href="../about/legal/privacy">Privacy Policy</a></p>
            </div>
        </div>
    </main>

    <div id="g_id_onload" data-client_id="27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com" data-context="signin" data-ux_mode="popup" data-callback="loginWithGoogle" data-auto_prompt="false"></div>

    <script src="https://www.mapotechnology.com/src/js/user.js"></script>
    <script defer async src="https://accounts.google.com/gsi/client"></script>
    <?if($_GET['method'] == 'register') {?>
    <script defer async src="https://www.google.com/recaptcha/api.js?render=6Ld5X1AkAAAAAF7AVZbd60fGTNqx-bYJ6s9wnlrC"></script>
    <?}?>
</body>
</html>