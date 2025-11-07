<?
$pageTitle = 'Account Settings';

include_once('UserAgentParse.inc.php');

if ($_GET['method'] == 'sessions') {
    include_once('sessions.inc.php');
} else if ($_GET['method'] == 'delete') {
    include_once('admin/incs/delete_user_acct.ini.php');
} else {
if (isset($_POST['action'])) {
    if ($_POST['action'] == 'settings') {
        $fname = mysqli_real_escape_string($con, $_POST['first_name']);
        $lname = mysqli_real_escape_string($con, $_POST['last_name']);
        $email = mysqli_real_escape_string($con, $_POST['email']);

        if ($_POST['old_phone'] != $_POST['phone']) {
            $p = preg_replace('/([^0-9])/', '', $_POST['phone']);
            $p = substr($p, 0, 3).'-'.substr($p, 3, 3).'-'.substr($p, 6, 4);
            $phone = mysqli_real_escape_string($con, $p);
            mysqli_query($con, "UPDATE users SET phone = '$phone' WHERE uid = '$_SESSION[uid]'");
        }

        mysqli_query($con, "UPDATE users SET first_name = '$fname', last_name = '$lname', email = '$email' WHERE uid = '$_SESSION[uid]'");

        echo message(true, 'Your settings were successfully updated.');
    } else if ($_POST['action'] == 'location') {
        if ($_POST['location'] != '') {
            echo $_POST['location'];
            $l = mysqli_real_escape_string($con, serialize(json_decode($_POST['location'])));
            mysqli_query($con, "UPDATE users SET location = '$l' WHERE uid = '$_SESSION[uid]'");

            echo message(true, 'Your location settings were successfully updated.');
        }
    } else {
        $p = mysqli_fetch_assoc(mysqli_query($con, "SELECT password FROM users WHERE uid = '$_SESSION[uid]'"));
        $old = $_POST['old_pass'];
        $new = $_POST['pass'];
        $cpass = $_POST['confirm_pass'];

        if (!password_verify($old, $p['password'])) {
            echo message(false, 'The old password you entered is not your current password.');
        } else {
            if (!$new) {
                echo message(false, 'Your must enter a new password.');
            } else if ($new && !$cpass) {
                echo message(false, 'Your must confirm your new password.');
            } else {
                $error = false;

                if (strlen($new) < 8) {
                    $error = true;
                    $msg .= 'Your password must be at least 8 characters.<br>';
                }

                if (preg_match('/[A-Z]{1,}/', $new) == 0) {
                    $error = true;
                    $msg .= 'Your password must contain at least 1 uppercase letter.<br>';
                }
    
                if (preg_match('/[a-z]{1,}/', $new) == 0) {
                    $error = true;
                    $msg .= 'Your password must contain at least 1 lowercase letter.<br>';
                }
    
                if (preg_match('/[0-9]{1,}/', $new) == 0) {
                    $error = true;
                    $msg .= 'Your password must contain at least 1 number.<br>';
                }
    
                if (preg_match('/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/', $new) == 0) {
                    $error = true;
                    $msg .= 'Your password must contain at least 1 symbol.';
                }

                if ($error) {
                    echo message(false, $msg);
                } else {
                    $pass = password_hash($new, PASSWORD_DEFAULT);
                    mysqli_query($con, "UPDATE users SET password = '$pass' WHERE uid = '$_SESSION[uid]'");
                    echo message(true, 'Your password was successfully changed.');
                }
            }
        }
    }
}

if ($_GET['sess_del'] == 1) {
    echo message(true, 'That session was successfully terminated. You\'ll have to re-login on that device next time.');
}

$now = time();
$user = mysqli_fetch_assoc(mysqli_query($con, "SELECT first_name, last_name, email, password, phone, location, provider, created FROM users WHERE uid = '$_SESSION[uid]'"));
if ($user['password']) {
    $passwordOn = true;
    unset($user['password']);
} else {
    $passwordOn = false;
}
$sql = mysqli_query($con, "SELECT sid, token, ip, host, source, location, created, expires FROM sessions WHERE uid = '$_SESSION[uid]' AND expires > 0 AND expires > '$now' ORDER BY created DESC");
$location = unserialize($user['location']);
?>
<div class="row">
    <div class="col w-4">
        <div class="card">
            <ul class="inapp-menu">
                <li><a class="active" href="#account">Account Settings</a></li>
                <li><a href="#password">Change Password</a></li>
                <li><a href="#location">Location Settings</a></li>
                <li><a href="#devices">Devices & Logins</a></li>
            </ul>
        </div>
    </div>
    <div class="col w-8">
        <div class="card">
            <h2 id="account">Account Settings</h2>
            <form action="" method="post" style="margin-bottom:0px">
                <input type="hidden" name="action" value="settings">
                <input type="hidden" name="old_phone" value="<?=$user['phone']?>">

                <?if($user['provider'] == 1){?>
                <div onclick="window.open('https://myaccount.google.com/connections?continue=https%3A%2F%2Fmyaccount.google.com%2Fdata-and-privacy')" style="display:inline-flex;align-items:center;gap:.5em;margin-bottom:0.5em;padding:0.75em;background-color:#f0f4f8;border:1px solid #dae1ea;border-radius:5px;cursor:pointer">
                    <img src="../../assets/images/google.svg">
                    <span>Account connected to Google</span>
                </div><br>
                <?}?>

                <label>First Name</label>
                <input type="text" name="first_name" class="input" placeholder="First Name"
                    value="<?=$user['first_name']?>">
                <label>Last Name</label>
                <input type="text" name="last_name" class="input" placeholder="Last Name"
                    value="<?=$user['last_name']?>">
                <label>Email Address</label>
                <input type="email" name="email" class="input" placeholder="Email Address" value="<?=$user['email']?>">
                <label>Phone Number</label>
                <input type="tel" name="phone" class="input" placeholder="Phone Number" maxlength="12"
                    value="<?=$user['phone']?>">

                <label>Member Since</label>
                <p><?=date('l, F j, Y', $user['created'])?></p>

                <div style="clear:both"></div>
                <input type="submit" class="btn btn-green" value="Save Settings">
            </form>

            <hr>

            <h2 id="password">Change Password</h2>
            <form action="" method="post">
                <input type="hidden" name="action" value="password">
                <label>Old Password</label>
                <input type="password" name="old_pass" class="input" placeholder="Old Password"<?=(!$passwordOn ? ' disabled' : '')?>>
                <label>New Password</label>
                <input type="password" name="pass" class="input" placeholder="New Password"<?=(!$passwordOn ? ' disabled' : '')?>>

                <div class="req" style="display:none">
                    <span id="p1">Your password must be at least 8 characters</span>
                    <span id="p2">Your password must have at least 1 number</span>
                    <span id="p3">Your password must have at least 1 lowercase letter</span>
                    <span id="p4">Your password must have at least 1 uppercase letter</span>
                    <span id="p5">Your password must be at least 1 symbol</span>
                </div>

                <label>Confirm Password</label>
                <input type="password" name="confirm_pass" class="input" placeholder="Confirm Password"<?=(!$passwordOn ? ' disabled' : '')?>>

                <div id="meets" style="display:none;font-size:14px;color:var(--red)">Your passwords don't match</div>

                <input type="submit" class="btn btn-green" value="Change Password">
            </form>

            <hr>

            <h2 id="location">Location Settings</h2>
            <form action="" method="post">
                <input type="hidden" name="action" value="location">
                <input type="hidden" name="location" value=''>
                <label>City</label>
                <input type="text" id="city" class="input" placeholder="City" value="<?=$location->city?>" disabled>
                <label>State</label>
                <input type="text" id="state" class="input" placeholder="State" value="<?=$location->state?>" disabled>
                <label>Zip Code</label>
                <input type="text" id="zip" class="input" placeholder="Zip Code" value="<?=$location->zip?>" disabled>
                <label>Latitude</label>
                <input type="text" id="lat" class="input" placeholder="Latitude" value="<?=$location->lat?>" disabled>
                <label>Longitude</label>
                <input type="text" id="lon" class="input" placeholder="Longitude" value="<?=$location->lon?>" disabled>
                <label>Search</label>
                <input type="text" class="input" id="q" autocomplete="off" placeholder="Change your city..."><br>
                <div id="cityResults" class="results" style="margin-top:-10px"></div>

                <input type="submit" class="btn btn-green" value="Save Location">
            </form>

            <hr>

            <h2 id="devices">Devices & Logins</h2>
            <div style="max-height:400px;overflow-y:auto">
                <?while($row = mysqli_fetch_assoc($sql)) {
                $ua = parseUserAgent($row['host']);
                if ($row['location'] == '') {
                    $json = json_decode(file_get_contents('https://ipwho.is/'.$row['ip']));
                    $location = serialize(array('location' => $json->city.', '.$json->region_code.', '.$json->country, 'isp' => $json->connection->isp));
                    mysqli_query($con, "UPDATE sessions SET location = '$location' WHERE sid = '$row[sid]'");
                } else {
                    $location = $row['location'];
                }
                $l = unserialize($location);
                $location = $l['location'].($l['isp'] ? '<span style="color:#939393;font-size:15px"> via '.$l['isp'].'</span>' : '');

                if ($ua['browser'] == 'okhttp') {
                    $browser = 'Android App';
                } else {
                    $browser = ($ua['platform'] ? $ua['platform'] : 'Unknown');
                }
                ?>
                <div class="device">
                    <h6>
                        <i class="fa-brands fa-<?=(strpos($ua['platform'], 'Android')!==false || strpos($ua['browser'], 'okhttp')!==false ? 'android' : (strpos($ua['platform'], 'Windows')!==false ? 'windows' : (strpos($ua['platform'], 'iOS')!==false ? 'apple' : '')))?>"></i>
                        <?=$browser?>
                        <?=($row['token']==$_COOKIE['token'] ? '<span>Current Session</span>' : '')?>
                    </h6>
                    <p style="color:#777"><?=($ua['browser'] == 'okhttp' ? 'OregonRoads (okhttp)' : $ua['browser']).($ua['version'] ? ' ('.$ua['version'].')' : '')?></p>
                    <p><?=$row['ip']?> &nbsp;&middot;&nbsp; <?=$location?></p>
                    <p style="color:#555;font-size:14px">Login at <?=date('D, M j, Y g:i:s A', $row['created'])?>
                        &middot;
                        Session<?=(time() > $row['expires'] ? ' expired' : ' expires in '.until($row['expires']))?>
                        &middot; <a href="settings/sessions/remove?sid=<?=$row['sid']?>">Remove Session</a></p>
                </div>
                <?}?>
            </div>

            <hr>

            <h2>Delete Account</h2>
            <p>If you wish to delete your account, click the button below to start the process.</p>
            <a href="settings/delete" class="btn btn-red">Delete Account</a>
        </div>
    </div>
</div>
<?}?>