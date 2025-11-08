<?
ini_set('display_errors', 1);
ini_set('session.cookie_domain', '.mapotechnology.com');
error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();

if ($_REQUEST['price_id'] == 'price_1PgsdhIpCdpJm6cTHdP3veWh' || $_REQUEST['price_id'] == 'price_1MgyLjIpCdpJm6cT9D5pnE9C') {
    $stripeLive = true;
}

include_once './subs.inc.php';
require_once '/home/mapo/stripe/init.php';

\Stripe\Stripe::setApiKey($stripeSecretKey);

$domain = 'https://www.mapotechnology.com';
$priceID = $_REQUEST['price_id'];
$donate = false;

// get a list of all subscriptions currently offered
foreach ($mapoSubscriptions as $e) {
    $allsubs[] = $e[($stripeLive ? 'live' : 'test')];
}

// determine if a donation or subscription product
if ($mapoSubscriptions['donate'][($stripeLive ? 'live' : 'test')] == $priceID || $mapoSubscriptions['mfdonate'][($stripeLive ? 'live' : 'test')] == $priceID) {
    $donate = true;
    $returnUrl = 'donate/success?' . ($_REQUEST['ref'] ? 'ref=' . $_REQUEST['ref'] . '&' : '') . 'checkout_id={CHECKOUT_SESSION_ID}';
} else {
    // determine where to send user after billing
    if (in_array($priceID, $allsubs)) {
        if ($_SESSION['uid'] && $_SESSION['expires'] > time() && !isset($_GET['next'])) {
            $returnUrl = 'account/billing?subscribe={CHECKOUT_SESSION_ID}';
        } else {
            if (isset($_GET['next'])) {
                $nextURL = $_GET['next'];
            } else {
                $nextURL = 'secure/register';
            }
            $nextURL .= str_contains($nextURL, '?') ? '&' : '?';
            
            $returnUrl = $nextURL.'checkout_id={CHECKOUT_SESSION_ID}';
        }
        /*if ($_SESSION['uid'] && $_SESSION['expires'] > time()) {
            if ($_REQUEST['force_login'] == 1) {
                $returnUrl = $_GET['return'].'?subscribed=1&plan='.$priceID;
            } else {
                $returnUrl = 'account/billing?subscribe={CHECKOUT_SESSION_ID}';
            }
        } else {
            if ($_GET['new_user'] == 1) {
                $returnUrl = 'secure/login?new_sub=1';
            } else {
                $returnUrl = 'secure/register?'.($_GET['src'] ? 'src='.$_GET['src'].'&' : '').($_GET['return'] ? 'next='.urlencode($_GET['return']).'&' : '').'session_id={CHECKOUT_SESSION_ID}';
            }
        }*/
    }
}

if ($_GET['return']) {
    $cancelUrl = $_GET['return'];
} else {
    if ($donate) {
        $cancelUrl = 'donate/cancel?' . ($_REQUEST['ref'] ? 'ref=' . $_REQUEST['ref'] . '&' : '') . 'checkout_id={CHECKOUT_SESSION_ID}';
    } else {
        preg_match('/https:\/\/[a-z]+\.(.*?)\.[a-z]{3}(.*)/', $_SERVER['HTTP_REFERER'], $m);
        $cancelUrl = $m[2];
    }
}


if ($priceID) {        
    $fields = array(
        'billing_address_collection' => 'auto',
        'allow_promotion_codes' => (!$donate ? true : false),
        'line_items' => array(
            [
                'price' => $priceID,
                'quantity' => 1,
            ]
        ),
        'mode' => (!$donate ? 'subscription' : 'payment'),
        'success_url' => ($_GET['host'] ? (strpos($_GET['host'], 'http') !== false ? '' : 'https://') . $_GET['host'] : "$domain") . "/$returnUrl",
        'cancel_url' => ($_GET['host'] ? (strpos($_GET['host'], 'http') !== false ? '' : 'https://') . $_GET['host'] : $domain) . ($cancelUrl ? "$cancelUrl" : ''),
    );

    if ($_REQUEST['trial']) {
        $fields['subscription_data'] = array(
            'trial_period_days' => $trialPeriod,
            'trial_settings' => [
                'end_behavior' => [
                    'missing_payment_method' => 'cancel'
                ]
            ]
        );
    }

    if (!$_SESSION['uid']) {
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

        if ($_REQUEST['first_name']) {
            $fields['custom_fields'][0]['text'] = ['default_value' => $_REQUEST['first_name']];
        }

        if ($_REQUEST['last_name']) {
            $fields['custom_fields'][1]['text'] = ['default_value' => $_REQUEST['last_name']];
        }
    } else {
        if (!$_REQUEST['customer_email']) {
            include_once 'db.ini.php';
            
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT cid FROM billing AS b LEFT JOIN users AS u ON b.email = u.email WHERE u.uid = $_SESSION[uid] LIMIT 1"));

            if ($row) {
                //$fields['customer'] = $row['cid'];
            }
        }
    }

    if (isset($_REQUEST['cid'])) {
        $fields['customer'] = $_REQUEST['cid'];
    } else {
        if ($_REQUEST['customer_email']) {
            $fields['customer_email'] = $_REQUEST['customer_email'];
        }
    }

    #print_r($fields);
    #exit();
    try {
        $checkout_session = \Stripe\Checkout\Session::create($fields);

        #print_r($checkout_session);
        header("HTTP/1.1 303 See Other");
        header("Location: " . $checkout_session->url);
    } catch (Error $e) {
        print_r($e);
    }
} else {
    echo 'No product/item was selected for checkout';
    #$priceID = ($stripeLive ? 'price_1MgyLjIpCdpJm6cT9D5pnE9C' : 'price_1MgbasIpCdpJm6cTIvyPmz5C');
}
