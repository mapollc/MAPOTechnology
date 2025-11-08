<?
if ($method == 'delete') {
    include_once $documentRoot . 'admin/incs/delete_user-account.ini.php';
} else if ($method == 'devices') {
    include_once $documentRoot . 'devices.ini.php';
} else {
    if (isset($_POST['action'])) {
        if ($_POST['action'] == 'settings') {
            $fname = $_POST['first_name'];
            $lname = $_POST['last_name'];
            $email = $_POST['email'];

            if ($_POST['old_phone'] != $_POST['phone']) {
                $p = preg_replace('/([^0-9])/', '', $_POST['phone']);
                $p = substr($p, 0, 3) . '-' . substr($p, 3, 3) . '-' . substr($p, 6, 4);
                $phone = mysqli_real_escape_string($con, $p);

                prepareQuery('si', [$phone, $_SESSION['uid']], "UPDATE users SET phone = ? WHERE uid = ?");
            }

            prepareQuery('sssi', [$fname, $lname, $email, $_SESSION['uid']], "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE uid = ?");

            echo message(true, 'Your profile settings were successfully updated.');
        } else if ($_POST['action'] == 'location') {
            if ($_POST['location'] != '') {
                $l = serialize(json_decode($_POST['location']));
                prepareQuery('si', [$l, $_SESSION['uid']], "UPDATE users SET location = ? WHERE uid = ?");

                echo message(true, 'Your location settings were successfully updated.');
            }
        } else {
            $p = prepareQuery('i', [$_SESSION['uid']], "SELECT password FROM users WHERE uid = ?");

            if (isset($p['error'])) {
                echo message(false, 'There was an error updating your password.');
            } else {
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
                            $update = prepareQuery('si', [$pass, $_SESSION['uid']], "UPDATE users SET password = ? WHERE uid = ?");

                            if (isset($update['error'])) {
                                echo message(false, 'There was an error updating your password.');
                            } else {
                                echo message(true, 'Your password was successfully changed.');
                            }
                        }
                    }
                }
            }
        }
    }

    $profile = prepareQuery('i', [$_SESSION['uid']], "SELECT first_name, last_name, email, password, phone, location, provider, created FROM users WHERE uid = ?");

    if ($profile['password']) {
        $passwordOn = true;
        unset($user['password']);
    } else {
        $passwordOn = false;
    }

    // show individual account settings cards depending on the $method param
    if (isset($_GET['method'])) {
        $btnText = 'Save Changes';

        if ($method == 'profile') {
            $cardTitle = 'Your Profile';
        } else if ($method == 'password') {
            $cardTitle = 'Change Your Password';
            $btnText = 'Change Password';
        } else if ($method == 'location') {
            $cardTitle = 'Your Home Location';
        }

        echo '<div class="row justify-center" id="account-settings"><div class="col w50"><div class="card"><form action="" method="post">';
        echo '<h1>' . $cardTitle . '</h1>';

        if ($method == 'profile') { ?>
            <input type="hidden" name="action" value="settings">
            <input type="hidden" name="old_phone" value="<?= $user['phone'] ?>">

            <label>First Name</label>
            <input type="text" name="first_name" class="input" placeholder="First Name" value="<?= $profile['first_name'] ?>">

            <label>Last Name</label>
            <input type="text" name="last_name" class="input" placeholder="Last Name" value="<?= $profile['last_name'] ?>">

            <label>Email Address</label>
            <input type="text" name="email" class="input" placeholder="name@example.com" value="<?= $profile['email'] ?>">

            <label>Phone Number</label>
            <input type="tel" name="phone" class="input" placeholder="012-345-6879" maxlength="12" value="<?= $profile['phone'] ?>">

            <label>Member Since</label>
            <input type="text" class="input" disabled value="<?= date('l, F j, Y', $profile['created']) ?>">

            <? if ($profile['provider'] == 1) { ?>
                <div onclick="window.open('https://myaccount.google.com/connections?continue=https%3A%2F%2Fmyaccount.google.com%2Fdata-and-privacy')" style="display:inline-flex;align-items:center;gap:.5em;margin:1em 0 0 0;padding:0.75em;background-color:#f0f4f8;border:1px solid #dae1ea;border-radius:5px;cursor:pointer">
                    <img src="../../assets/images/google.svg">
                    <span>Account connected to Google</span>
                </div>
            <? } ?>
        <? } else if ($method == 'password') { ?>
            <p class="help">Your password must be at least 8 characters long and contain at least 1 upper and lowercase letter, 1 number, and 1 symbol.</p>

            <input type="hidden" name="action" value="password">
            <label>Old Password</label>
            <input type="password" name="old_pass" class="input" placeholder="Old Password" <?= (!$passwordOn ? ' disabled' : '') ?>>
            <label>New Password</label>
            <input type="password" name="pass" class="input" placeholder="New Password" <?= (!$passwordOn ? ' disabled' : '') ?>>

            <div class="req" style="display:none">
                <span id="p1">Your password must be at least 8 characters</span>
                <span id="p2">Your password must have at least 1 number</span>
                <span id="p3">Your password must have at least 1 lowercase letter</span>
                <span id="p4">Your password must have at least 1 uppercase letter</span>
                <span id="p5">Your password must be at least 1 symbol</span>
            </div>

            <label>Confirm Password</label>
            <input type="password" name="confirm_pass" class="input" placeholder="Confirm Password" <?= (!$passwordOn ? ' disabled' : '') ?>>

            <div id="meets" style="display:none;font-size:14px;color:var(--red)">Your passwords don't match</div>
        <? } else if ($method == 'location') { ?>
            <input type="hidden" name="action" value="location">
            <input type="hidden" name="location" value=''>

            <label>City</label>
            <input type="text" name="city" disabled class="input" value="<?= $user['location']->city ?>">

            <label>State</label>
            <input type="text" name="state" disabled class="input" value="<?= $user['location']->state ?>">

            <label>Zip Code</label>
            <input type="text" name="zip" disabled class="input" value="<?= $user['location']->zip ?>">

            <label>Latitude</label>
            <input type="text" name="lat" class="input" disabled value="<?= $user['location']->lat ?>">

            <label>Longitude</label>
            <input type="text" name="lon" class="input" disabled value="<?= $user['location']->lon ?>">

            <label>Search Locations</label>
            <input type="text" class="input" id="q" autocomplete="off" placeholder="Change your city...">
            <div class="search-results"></div>
        <? }

        if (isset($method)) {
            echo '<div style="clear:both;margin:1em 0"></div><div class="btn-group centered"><input type="submit" class="btn btn-green" value="' . $btnText . '">' .
                ($method == 'location' ? '<input type="button" class="btn btn-light-blue" id="getMyLoc" value="Get current location">' : '') .
                '<input type="button" class="btn btn-gray" onclick="window.location.href=\'../settings\'" value="Go back">' .
                '</div></form></div></div></div>';
        }
    } else { ?>
        <div class="row" style="justify-content: center;">
            <div class="col w50">
                <h1>Your MAPO Account</h1>

                <ul class="settings">
                    <li onclick="window.location.href='../account/settings/profile'">
                        <h2>Your Profile</h2>
                        <p class="help">Make changes to your first and last name, email address, or phone number.</p>
                    </li>
                    <li onclick="window.location.href='../account/settings/password'">
                        <h2>Change Your Password</h2>
                        <p class="help">Change your login password across all devices you use this account on.</p>
                    </li>
                    <li onclick="window.location.href='../account/settings/location'">
                        <h2>Your Home Location</h2>
                        <p class="help">Setting your home location helps us provide information specific to your area.</p>
                    </li>
                    <li onclick="downloadUserData()">
                        <h2>Download Data</h2>
                        <p class="help">Download all your MAPO user data in a JSON file.</p>
                    </li>
                    <li onclick="window.location.href='../account/settings/delete'">
                        <h2>Delete Account</h2>
                        <p class="help">If you no longer want an account with us, you can delete it permenantly.</p>
                    </li>
                </ul>
            </div>
        </div>
<? }
} ?>