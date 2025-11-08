<?
////ini_set('display_errors',1);
////error_reporting(E_ALL);
include('config.inc.php');

ini_set('session.cookie_lifetime', $cookieLength);
ini_set('session.gc_maxlifetime', $cookieLength);
ini_set('session.cookie_domain', $cookieURL);
session_set_cookie_params(0, '/', $cookieURL);

session_start();
$host = explode('.', $_SERVER['HTTP_HOST']);

if ($_GET['logout'] == 1) {
    session_unset();
    session_regenerate_id();
}

if ($_SESSION['uid'] && $_SESSION['agency']) {
    header('Location: ' . str_replace('https://', 'https://' . $_SESSION['agency'] . '.', $domain) . '/cad/');
    exit();
}

if (count($host) == 4 && $host[1] == 'fiview') {
    $a = strtoupper($host[0]);
    $theag = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$a'"));
} else {
    $a = mysqli_query($con, "SELECT * FROM $db.agencies ORDER BY agency_id ASC");
    while ($ag = mysqli_fetch_assoc($a)) {
        $agencies .= '<option value="' . strtolower($ag['agency_id']) . '">(' . $ag['agency_id'] . ') ' . $ag['shortname'] . '</option>';
    }
}

switch ($_GET['error']) {
    case 1:
        $errorMsg = 'You must be logged in to access CAD.';
        break;
    case 2:
        $errorMsg = 'Your URL settings for this agency\'s CAD are incorrect.';
        break;
    case 3:
        $errorMsg = 'You cannot access this agency\'s CAD.';
        break;
    case 4:
        $errorMsg = 'Your device is not allowed to access ' . $software_name . ' due to your IP address.';
        break;
    case 5:
        $errorMsg = 'Your login session has expired. Please re-login.';
        break;
}
?>
<!DOCTYPE html>
<html>

<head>
    <title><?= $software_name ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <?=css(array('fonts', 'fa', 'login'))?>
</head>

<body>

    <div class="wrapper">
        <div class="logo">
            <div class="content">
                <img src="<?= $company_logo ?>" style="width:100%;max-width:180px">
                <h1><?= $software_suite ?> <span style="letter-spacing:-0.01em">CAD</span>
                </h1>
                <h2>Dispatcher Login</h2>
            </div>
        </div>

        <div class="login-wrapper">
            <form id="login" action="" method="post">
                <input type="hidden" name="action" value="login">
                <div class="error" <?= ($_GET['error'] ? ' style="display:block"' : '') ?>><?= $errorMsg ?></div>

                <select name="agency">
                <?if($theag){
                    echo '<option value="'.strtolower($theag['agency_id']).'">('.$theag['agency_id'].') '.$theag['shortname'].'</option>';
                } else {
                    echo '<option>- Choose Agency -</option>'.$agencies;
                }?>
                </select>
                <input type="text" name="user" placeholder="Username" value="">
                <input type="password" name="pass" placeholder="Password" value="">
                <button type="submit" id="submit-btn"><i class="fal fa-arrow-right-to-bracket"></i> Login</button>
                <!--<a href="#" id="submit-btn" onclick="return false"><i class="fa-light fa-arrow-right-to-bracket"></i> Login</a>-->
            </form>

            <div class="copyright"><b>&copy; <?= date('Y') . ' ' . $software_company ?></b><br><br>
                <span style="font-size:0.8em">Use of this system by unauthorized parties is strictly prohibited. Only
                    authorized users of this system may access <?=$software_name?>.</span>
            </div>
        </div>
    </div>

    <?=js(array('jquery')) ?>
    <script>
        $('form#login').on('submit', function(e) {
            e.preventDefault();
            var a = $('#login select[name=agency]').val(),
                u = $('#login input[name=user]').val(),
                p = $('#login input[name=pass]').val();

            if (a == '' || a == '- Choose Agency -') {
                $('.error').html('You must choose the agency you work for').fadeIn();
            } else if (u == '' && p == '') {
                $('.error').html('You must enter your username & password').fadeIn();
            } else if (u != '' && p == '') {
                $('.error').html('You must enter your password').fadeIn();
            } else if (u == '' && p != '') {
                $('.error').html('You must enter your username').fadeIn();
            } else {
                $('.error').fadeOut().html('');

                $.ajax({
                    url: 'do',
                    method: 'POST',
                    data: $('#login').serialize(),
                    dataType: 'json',
                    success: function(r) {
                        if (r.error) {
                            if (r.error == 1) {
                                var m = 'The password you entered is incorrect. Try again.';
                            } else if (r.error == 2) {
                                var m = 'You must select the agency you work for.';
                            } else if (r.error == 3) {
                                var m =
                                    'You are not employed by this agency. Please login to you correct agency.';
                            } else if (r.error == 4) {
                                var m =
                                    'You are not allowed to access CAD with the device you\'re using.';
                            }

                            $('.error').html(m).fadeIn();
                        } else if (r.success == 1) {
                            window.location.href = r.next;
                        }
                    }
                });
            }
        });
    </script>

</body>

</html>