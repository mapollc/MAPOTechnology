<?
ini_set('display_errors', 0);
error_reporting(E_PARSE && E_ERROR);
ini_set('session.cookie_domain', '.mapotechnology.com');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
session_start();

$product = 'mapofire';
$trialExhausted = false;
$error = false;

if ($_GET['devel'] == 1) {
    $stripeLive = false;
}

require_once '/home/mapo/stripe/init.php';
require_once '/home/mapo/public_html/subs.inc.php';
require_once '/home/mapo/public_html/db.ini.php';

function checkPreviousTrials()
{
    global $con;
    global $_REQUEST;

    $num = mysqli_num_rows(mysqli_query($con, "SELECT id FROM billing WHERE email = '$_REQUEST[customer_email]' AND usedTrial = 1"));

    return $num;
}

// have the user login or create an account before they continue with subscriptions
if (isset($_POST) && isset($_POST['price'])) {
    if ($_REQUEST['ref'] == 'com.mapollc.mapofire' && !isset($_REQUEST['authenticated'])) {
        $goto = 'https://www.mapotechnology.com/purchase/' . $product . '/complete?price=' . $_POST['price'] . ($_POST['trial'] ? '&trial=1' : '') .
            (isset($_REQUEST['customer_email']) ? '&customer_email=' . $_REQUEST['customer_email'] : '') .
            ($_REQUEST['ref'] ? '&ref=' . $_REQUEST['ref'] : '') . ($_REQUEST['devel'] ? '&devel=' . $_REQUEST['devel'] : '');
    } else {
        if ($_SESSION && $_SESSION['uid'] || $_SESSION['customer_email'] || $_REQUEST['customer_email']) {
            $email = $_SESSION['customer_email'] ? $_SESSION['customer_email'] : ($_REQUEST['customer_email'] ? $_REQUEST['customer_email'] : null);
            $custID = null;

            if (isset($_POST['cid'])) {
                $custID = $_POST['cid'];
            }

            $user = prepareQuery('i', [$_SESSION['uid']], "SELECT email FROM users WHERE uid = ?");

            if (!empty($user)) {
                $email = $user['email'];
            }

            if ($custID == null) {
                $getCust = prepareQuery('s', [$email], "SELECT cid FROM billing WHERE email = ? ORDER BY status ASC, created DESC LIMIT 1");

                $custID = $getCust['cid'];
            }

            $goto = 'https://www.mapotechnology.com/purchase/' . $product . '/complete?price=' . $_POST['price'] . ($_POST['trial'] ? '&trial=1' : '') .
                ($email != null ? '&customer_email=' . $email : '') .
                ($custID != null ? '&customer_id=' . $custID : '') .
                ($_REQUEST['ref'] ? '&ref=' . $_REQUEST['ref'] : '') .
                ($_REQUEST['devel'] ? '&devel=' . $_REQUEST['devel'] : '');
        } else {
            $goto = 'https://www.mapotechnology.com/secure/register?service=mapofire&subscribe=1&product_key=' . $product . '&price_id=' . $_POST['price'] . ($_POST['trial'] ? '&trial=1' : '');
        }
    }

    ////echo $goto;
    header("Location: $goto");
    exit();
}

// if status query parameter is complete, we're ready to start charging for the subscription
if ($_GET['status'] == 'complete') { 
    $priceId = preg_match('/^price_[a-zA-Z0-9]+$/', $_GET['price']) ? $_GET['price'] : null;
    $trialRequested = isset($_REQUEST['trial']) && $_REQUEST['trial'] == 1;

    if ($priceId != null) {
        if ($_GET['trial'] == 1 && checkPreviousTrials() > 0) {
            $trialExhausted = true;
        } else {
            \Stripe\Stripe::setApiKey($stripeSecretKey);

            if (isset($_GET['ref']) && $_GET['ref'] == 'com.mapollc.mapofire') {
                $returnURL = 'https://www.mapofire.com/confirmation?checkout_id={CHECKOUT_SESSION_ID}' . (isset($_SESSION['customer_email']) ? '&newUser=1' : '');
                $cancelURL = 'https://www.mapofire.com/confirmation?failed=1';
            } else {
                $cancelURL = 'https://www.mapotechnology.com/purchase/' . $product . '/failed?reason=cancel' . (isset($_REQUEST['customer_id']) ? '&cid=' . $_REQUEST['customer_id'] : '') . (isset($_REQUEST['newUser']) ? '&newUser=1' : '') . (isset($_REQUEST['ref']) ? '&ref=' . $_REQUEST['ref'] : '');

                if ($_SESSION['uid']) {
                    $returnURL = 'https://www.mapotechnology.com/account/billing?checkout_id={CHECKOUT_SESSION_ID}' . ($trialRequested ? '&isTrial=1' : '') . (isset($_REQUEST['ref']) ? '&ref=' . $_REQUEST['ref'] : '');
                } else {
                    $returnURL = 'https://www.mapotechnology.com/purchase/' . $product . '/success?checkout_id={CHECKOUT_SESSION_ID}' . ($trialRequested ? '&isTrial=1' : '') . (isset($_SESSION['customer_email']) ? '&newUser=1' : '') . (isset($_REQUEST['ref']) ? '&ref=' . $_REQUEST['ref'] : '');
                }
            }

            $fields = [
                'billing_address_collection' => 'auto',
                'line_items' => array(
                    [
                        'price' => $priceId,
                        'quantity' => 1
                    ]
                ),
                'mode' => 'subscription',
                'success_url' => $returnURL,
                'cancel_url' => $cancelURL,
            ];

            if ($priceId == $plan->setPlan('hotshot_annual')->getPriceID()) {
                $coupon = \Stripe\Coupon::create([
                    'percent_off' => 10,
                    'duration' => 'once'
                ]);

                $promo = \Stripe\PromotionCode::create([
                    'coupon' => $coupon->id
                ]);

                $fields['discounts'] = [
                    ['promotion_code' => $promo->id]
                ];
            } else {
                $fields['allow_promotion_codes'] = true;
            }

            // if a trial is being requested, set those params here
            if ($trialRequested) {
                $fields['subscription_data'] = array(
                    'trial_period_days' => 7,
                    'trial_settings' => [
                        'end_behavior' => [
                            'missing_payment_method' => 'cancel'
                        ]
                    ]
                );
            }

            // if the user is logged in, add their MAPO user ID
            if ($_SESSION['uid']) {
                $fields['metadata'] = ['user_id' => $_SESSION['uid']];
            }

            // add the customer's ID or email to the session if available
            if (isset($_REQUEST['customer_id'])) {
                $fields['customer'] = $_REQUEST['customer_id'];
            } else if (isset($_REQUEST['customer_email'])) {
                $fields['customer_email'] = $_REQUEST['customer_email'];
            } else {
                $fields['custom_fields'] = [
                    [
                        'key' => 'fname',
                        'label' => ['type' => 'custom', 'custom' => 'First Name'],
                        'type' => 'text'
                    ],
                    [
                        'key' => 'lname',
                        'label' => ['type' => 'custom', 'custom' => 'Last Name'],
                        'type' => 'text',
                    ],
                ];

                if ($_SESSION['first_name']) {
                    $fields['custom_fields'][0]['text'] = ['default_value' => $_SESSION['first_name']];
                }

                if ($_SESSION['last_name']) {
                    $fields['custom_fields'][1]['text'] = ['default_value' => $_SESSION['last_name']];
                }
            }
            ////print_r($fields);
            ////exit();

            try {
                $checkout_session = \Stripe\Checkout\Session::create($fields);

                header("HTTP/1.1 303 See Other");
                header("Location: " . $checkout_session->url);
            } catch (Exception $e) {
                if (str_contains($e->getMessage(), 'No such customer')) {
                    try {
                        unset($fields['customer']);
                        $fields['customer_email'] = $_REQUEST['customer_email'];
                        $checkout_session = \Stripe\Checkout\Session::create($fields);

                        header("HTTP/1.1 303 See Other");
                        header("Location: " . $checkout_session->url);
                    } catch (Exception $e) {
                    }
                }
            }
        }
    }
}

mysqli_close($con);

if ($_GET['status'] == 'failed') {
    $error = true;

    if ($_GET['reason'] == 'cancel') {
        $messages = 'You exited the checkout before subscribing. Your account has not been charged.';
    } else {
        $messages = 'There was an error starting your subscription. Please try again.';
    }
}

if ($trialExhausted) {
    $error = true;

    $messages = 'You have already used your free trial of this product. Subscribe to IGNITE or upgrade to HOTSHOT.';
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Map of Fire - Subscription Plans</title>
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="https://www.mapotechnology.com/assets/images/mf-site.webmanifest">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/subs.css">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap">
    </noscript>
</head>

<body>
    <? if (!isset($_GET['ref']) && $_GET['ref'] != 'com.mapollc.mapofire') { ?>
        <header>
            <a href="https://mapofire.com"><img src="https://www.mapotechnology.com/assets/images/mapofire_logo.png" title="Map of Fire logo" title="Map of Fire alt"></a>
        </header>
    <? } ?>

    <?
    if ($messages) {
        echo "<div class=\"message error\">$messages</div>";
    }

    if ($trialExhausted || !isset($_GET['status']) || $_GET['status'] == 'failed') {
        include_once 'premium.php';
    } else if ($_GET['status'] == 'success') {
        $isTrial = false;
        $trialEnd = null;
        $stripe = new \Stripe\StripeClient($stripeSecretKey);
    ?>
        <div style="display:flex;justify-content:center;margin:5em 1em">
            <div style="max-width:600px;text-align:center;background-color:#fff;padding:4em 2em;border-radius:12px;box-shadow:0 0 25px rgb(10 10 10 / 10%)">

                <? try {
                    $session = $stripe->checkout->sessions->retrieve($_GET['checkout_id']);

                    try {
                        $sub = $stripe->subscriptions->retrieve($session->subscription, []);

                        if ($sub->status == 'trialing') {
                            $isTrial = true;
                            $trialEnd = $sub->trial_end;
                        }
                    } catch (Exception $e) {
                        // TODO
                    }
                } catch (Exception $e) {
                    // TODO
                }

                // if the user just created an account, remind them to check their email to verify their email address
                if ($_GET['newUser'] == 1) {
                    echo '<span class="message success" style="margin:0 0 2em 0">Please check your email for a confirmation link to verify your account.</span>';
                }
                ?>
                <h2 style="margin-bottom:1em">Your subscription is now active</h2>

                <? if ($isTrial) { ?>
                    <p style="line-height:1.3">Your free 7-day trial will end on <?= date('F j, Y', $trialEnd) ?>. Your payment method will be charged unless you cancel prior to the trial ending.</p>
                <? } else { ?>
                    <p style="line-height:1.3">You will be automatically billed every month until you cancel.</p>
                <? } ?>
                <a class="btn btn-orange" style="margin:2em 0 0 0" href="https://www.mapotechnology.com/secure/login?service=mapofire&next=<?= urlencode('https://mapofire.com?ref=new_subscriber') ?>">Login & Start Tracking Wildfires</a>
                <? } else if ($_GET['status'] == 'complete') {
                if ($trialExhausted) {
                    echo 'You have already used your free 7-day trial for this product.';
                }
            } else if ($_GET['status'] == 'failed') {
                if ($_GET['reason'] == 'cancel') { ?>
                    <h2 style="margin-bottom:1em">You canceled before starting your subscription.</h2>
                <? } else { ?>
                    <h2 style="margin-bottom:1em">There was an error.</h2>
                <? } ?>
            <? } ?>
            </div>
        </div>

        <? if (!isset($_GET['ref']) && $_GET['ref'] != 'com.mapollc.mapofire') { ?>
            <footer>
                &copy; <?= date('Y') ?> MAPO LLC &nbsp; &middot; &nbsp;
                <a href="https://www.mapotechnology.com/about/legal/terms">Terms</a> &nbsp; &middot; &nbsp;
                <a href="https://www.mapotechnology.com/about/legal/privacy">Privacy</a>
            </footer>
        <? } ?>

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
        <script>
            window.dataLayer = window.dataLayer || [];

            function gtag() {
                dataLayer.push(arguments);
            }
            gtag('js', new Date());
            gtag('config', 'G-J2PB456CE6');
            (function(w, d, s, l, i) {
                w[l] = w[l] || [];
                w[l].push({
                    'gtm.start': new Date().getTime(),
                    event: 'gtm.js'
                });
                var f = d.getElementsByTagName(s)[0],
                    j = d.createElement(s),
                    dl = l != 'dataLayer' ? '&l=' + l : '';
                j.async = true;
                j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
                f.parentNode.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', 'GTM-NZXGFH6');

            function tag(p, d) {
                gtag('event', 'begin_checkout', {
                    currency: 'USD',
                    value: p,
                    items: d
                });
            }

            document.querySelectorAll('input[type=submit]').forEach((t) => {
                t.addEventListener('click', (e) => {
                    let pts = [];
                    e.target.closest('form').querySelectorAll('input').forEach((v) => {
                        pts[v.name] = v.value;
                    });

                    tag(pts['cost'], [{
                        item_id: pts['pid'],
                        item_name: pts['name'],
                        price: pts['cost'],
                        quantity: 1
                    }]);
                });
            });

            document.querySelector('#pro-yearly').addEventListener('click', (e) => {
                e.preventDefault();
                let pts = [];
                const form = document.querySelector('form#pro-yearly-form');

                form.querySelectorAll('input').forEach((v) => {
                    pts[v.name] = v.value;
                });

                tag(pts['cost'], [{
                    item_id: pts['pid'],
                    item_name: pts['name'],
                    price: pts['cost'],
                    quantity: 1
                }]);

                form.submit();
            });
        </script>
</body>

</html>