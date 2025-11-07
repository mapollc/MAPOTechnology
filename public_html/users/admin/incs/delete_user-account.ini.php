<?
$anySubs = 0;
$anySubs = mysqli_num_rows(mysqli_query($con, "SELECT id FROM billing WHERE email = '$user[email]' AND status != 'expired'"));

if (isset($_POST['verify_delete']) && $_POST['verify_delete'] == 1) {
    require_once '/home/mapo/stripe/init.php';

    // if user has any subscriptions, cancel them
    if ($anySubs > 0) {
        $stripe = new \Stripe\StripeClient($stripeSecretKey);

        $sql = mysqli_query($con, "SELECT subscription AS sid FROM billing WHERE email = '$user[email]' AND status != 'expired'");
        while ($bill = mysqli_fetch_assoc($sql)) {
            try {
                $cancel = $stripe->subscriptions->cancel($bill['sid'], [
                    'cancellation_details' => [
                        'comment' => 'User deleted their own account'
                    ]
                ]);
            } catch (Exception $e) {}
        }
    }

    $get = mysqli_fetch_assoc(mysqli_query($con, "SELECT first_name, email, created FROM users WHERE uid = '$_SESSION[uid]'"));
    $since = date('l, F j, Y', $get['created']);

    mysqli_query($con, "DELETE FROM users WHERE uid = '$_SESSION[uid]'");
    mysqli_query($con, "DELETE FROM settings WHERE uid = '$_SESSION[uid]'");
    mysqli_query($con, "DELETE FROM trail_settings WHERE uid = '$_SESSION[uid]'");
    mysqli_query($con, "DELETE FROM oreroads_settings WHERE uid = '$_SESSION[uid]'");

    logEvent('User #' . $_SESSION['uid'] . ' successfully deleted their own account');

    sendEmail($get['email'], 'You MAPO account was deleted', 'deleted', array('{fname}' => $get['first_name'], '{since}' => $since));
    header('Location: https://www.mapotechnology.com/logout?delete_account=1');
}
?>
<div class="row justify-center">
    <div class="col w50">
        <div class="card">
            <h1>Delete Account</h1>

            <? if ($_POST['confirm_delete'] == 1) { ?>
                <p style="padding-top:0">Are you <b>absolutely</b> sure you want to delete your account<?=$anySubs > 0 ? ' and cancel your current subscription' : ''?>?</p>

                <form action="" method="post">
                    <input type="hidden" name="verify_delete" value="1">
                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="confirm" value="I'm absolutely sure">
                        <input type="button" class="btn btn-red" onclick="history.go(-2)" value="No, go back">
                    </div>
                </form>
            <? } else { 
                if ($anySubs > 0) {
                    echo '<p class="message error" style="font-weight:bold;margin-bottom:1em">You currently have a subscription with this account. Are you sure you want to cancel these?</p>';
                }    
            ?>
                <p style="padding-top:0">Are you sure you want to delete your account? Once deleted, all your settings, data, and information will not be recoverable.
                    If you used Google to sign-in with us, we'll no longer be able to access your Google account.</p>

                <p>MAPO still retains information pertaining to your usage of our services, but it does not contain any data identifying you, your name,
                    email address, or other personal identifying information (PII).</p>

                <form action="" method="post">
                    <input type="hidden" name="confirm_delete" value="1">
                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="confirm" value="Yes, I'm sure">
                        <input type="button" class="btn btn-red" onclick="history.go(-1)" value="No, go back">
                    </div>
                </form>
            <? } ?>
        </div>
    </div>
</div>