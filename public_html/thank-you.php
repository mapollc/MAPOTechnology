<?
$domain = 'https://www.mapotechnology.com/';
$host = str_replace('www.', '', $_SERVER['HTTP_HOST']);
ini_set('session.cookie_domain', ".$host");
include_once 'db.ini.php';

session_start();

if (!$ga_id) {
    $ga_id = 'G-J2PB456CE6';
}

$paypalEndpoint = 'https://api-m.paypal.com/';
$paypalClientID = 'AQJL7RE2fjaGhIo9hMnc0oxHblIvIOnUTDjvSVrTkZXIv5zNCZBYEAx99EO-46b-_Da8xharKvPa15BG';
$paypalSecret = 'EEA83QEDoowAE-2QYNqz8libowCZqtFecIQoNUj0bY0CLDM2cIDE7W2WpgHwnCcmR4_nRM5tWIeXJBdA';
////$paypalEndpoint = 'https://api-m.sandbox.paypal.com/';
////$paypalClientID = 'Ab5Q0vPF1zYCH44h-akUGY6z760tVy2UlEk1vLANzNpXHL4gEI6Oii-BbTrREQKMGqcxSGTAON5YKGKX';
////$paypalSecret = 'ENtnuWe2LFBHd5NTOihUnCZd_UhhmmVusB2ANWJG9pXmrRsOU70dgxCiwGTcyEWTbuMshEt_r2UhbB6S';

function getToken() {
    global $paypalEndpoint;
    global $paypalClientID;
    global $paypalSecret;
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $paypalEndpoint . 'v1/oauth2/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
    curl_setopt($ch, CURLOPT_USERPWD, "$paypalClientID:$paypalSecret");

    $headers = array();
    $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Error:' . curl_error($ch);
    }
    curl_close($ch);

    return json_decode($result)->access_token;
}

function getName($fields)
{
    $first = null;
    $last = null;

    foreach ($fields as $ea) {
        if ($ea->key == 'firstname') {
            $first = $ea->text->value;
        } else if ($ea->key == 'lastname') {
            $last = $ea->text->value;
        }
    }

    if ($first != null && $last != null) {
        return [$first, $last];
    } else if ($first != null) {
        return [$first];
    } else {
        return null;
    }
}

if (isset($_GET['checkout_id'])) {
    require_once '/home/mapo/stripe/init.php';
    $stripe = new \Stripe\StripeClient($stripeSecretKey);

    try {
        $session = $stripe->checkout->sessions->retrieve($_GET['checkout_id']);
        ////print_r($session);

        $customer = getName($session->custom_fields);
        $pid = $session->payment_intent;
        $name = $customer != null && count($customer) > 0 ? $customer[0] : '';
        $email = $session->customer_details->email;
        $type = $session->submit_type == 'donate' ? 'donation' : 'payment';
        $amount = number_format($session->amount_total / 100, 2);

        if (!isset($_SESSION['donate_email_sent']) && $session->submit_type == 'donate' && sendEmail($email, 'Thanks for supporting MAPO!', 'donated', array('{fname}' => $name, '{amt}' => $amount))) {
            $_SESSION['donate_email_sent'] = 1;
        }
    } catch (Error $e) {
        echo $e->getMessage();
    }
} else if (isset($_GET['orderID']) && $_GET['src'] == 'venmo') {
    $token = getToken();
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $paypalEndpoint . "v2/checkout/orders/$_GET[orderID]");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    $headers = array();
    $headers[] = 'Authorization: Bearer '.$token;
    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Error:' . curl_error($ch);
    }
    curl_close($ch);

    $customer = json_decode($result);
    $pid = $customer->purchase_units[0]->payments->captures[0]->id;
    $name = $customer->payment_source->venmo->name->given_name;
    $email = $customer->payment_source->venmo->email_address;
    $amount = number_format($customer->purchase_units[0]->amount->value, 2);
    $type = 'donation';

    if (!isset($_SESSION['donate_email_sent']) && sendEmail($email, 'Thanks for supporting MAPO!', 'donated', array('{fname}' => $name, '{amt}' => $amount))) {
        $_SESSION['donate_email_sent'] = 1;
    }
} else {
    $type = 'payment';
}
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">

<head>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=2, minimum-scale=1, user-scalable=1">
    <title>Thank you for your <?= $type ?></title>
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#ffc65c">
    <meta name="robots" content="noindex,nofollow">
    <link rel="shortcut icon" href="<?= $domain ?>assets/images/favicon.ico" type="image/x-icon" />
    <link rel="apple-touch-icon" sizes="120x120" href="<?= $domain ?>assets/images/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= $domain ?>assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="<?= $domain ?>assets/images/favicon-16x16.png">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/donate.css">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;800&family=Dosis:wght@400;500;600&display=swap">
</head>

<body>

    <main>
        <div class="wrapper">
            <a href="https://mapotechnology.com"><img src="https://www.mapotechnology.com/assets/images/mapo_logo.png" style="margin:0 auto"></a>

            <img src="https://www.mapotechnology.com/assets/images/thank_you_donate.jpeg" style="margin:3em auto 0 auto">

            <div class="content">
                <h1>Thanks for your <?= $type . ($name != '' ? ', ' . $name : '') ?></h1>
                <p><?= $type != 'payment' ? 'We appreciate your financial support to ensure our services remain operating uninterrupted. ' : '' ?>A payment to MAPO LLC will appear on your statement.</p>

                <? if ($amount) { ?>
                    <div class="receipt">
                        <svg class="InlineSVG" focusable="false" width="100%" height="68" viewBox="0 0 384 68" fill="none">
                            <path d="M0 3.923C0 1.756 2.686 0 6 0h372c3.314 0 6 1.756 6 3.923V68l-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23-8 5.23-8-5.23L96 68l-8-5.23L80 68l-8-5.23L64 68l-8-5.23L48 68l-8-5.23L32 68l-8-5.23L16 68l-8-5.23L0 68V3.923z" id="Path" fill-opacity=".03" fill="#000" fill-rule="nonzero"></path>
                            <path d="M375.646 62.538l-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5-.354-.231-.354.231-7.646 5-7.646-5L8 62.307l-.354.231L.5 67.211V3.923C.5 1.937 2.962.327 6 .327h372c3.038 0 5.5 1.61 5.5 3.596v63.288l-7.146-4.673-.354-.231-.354.231z" id="Path" stroke-opacity=".08" stroke="#000" stroke-width=".5"></path>
                        </svg>

                        <div class="stmt">
                            <span class="text">MAPO LLC</span>
                            <div class="divider"></div>
                            <span class="text">$<?= $amount ?></span>
                        </div>
                    </div>
                <? }
                if ($_GET['src'] == 'venmo') {?>
                <div style="margin-top:1em" title="Thanks for your payment using Venmo">
                    <!--<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><g transform="matrix(.124031 0 0 .124031 -.000001 56.062016)"><rect y="-452" rx="61" height="516" width="516" fill="#3396cd"/><path d="M385.16-347c11.1 18.3 16.08 37.17 16.08 61 0 76-64.87 174.7-117.52 244H163.5l-48.2-288.35 105.3-10 25.6 205.17C270-174 299.43-235 299.43-276.56c0-22.77-3.9-38.25-10-51z" fill="#fff"/></g></svg>-->
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" fill="#3d95ce"><path d="M29.793 21.444c.608 1.004.882 2.037.882 3.343 0 4.165-3.555 9.575-6.44 13.374h-6.6L15 22.356l5.77-.548 1.398 11.247c1.306-2.127 2.917-5.47 2.917-7.75 0-1.248-.214-2.097-.548-2.797zm7.48 6.96c1.062 0 3.735-.486 3.735-2.005 0-.73-.516-1.094-1.124-1.094-1.064 0-2.46 1.276-2.612 3.1zm-.122 3c0 1.855 1.032 2.583 2.4 2.583 1.5 0 2.915-.364 4.77-1.306l-.698 4.74c-1.306.638-3.34 1.064-5.317 1.064-5 0-6.805-3.04-6.805-6.838 0-4.924 2.917-10.153 8.932-10.153 3.3 0 5.163 1.855 5.163 4.44 0 4.165-5.345 5.44-8.444 5.47zm25.1-6.25c0 .608-.092 1.5-.184 2.066l-1.733 10.94h-5.62l1.58-10.03.122-1.124c0-.73-.456-.912-1.004-.912-.728 0-1.458.334-1.944.578l-1.792 11.5h-5.65l2.582-16.383h4.9l.062 1.308c1.154-.76 2.673-1.58 4.83-1.58 2.856 0 3.86 1.46 3.86 3.65zm16.68-1.856c1.6-1.154 3.13-1.793 5.224-1.793 2.885 0 3.9 1.46 3.9 3.65 0 .608-.092 1.5-.184 2.066l-1.73 10.94H80.5l1.6-10.243.092-.82c0-.822-.456-1.004-1.004-1.004-.698 0-1.396.304-1.914.578l-1.8 11.5h-5.62l1.6-10.243.1-.82c0-.822-.456-1.004-1.002-1.004-.73 0-1.458.334-1.944.578l-1.793 11.5h-5.65l2.58-16.383h4.83l.152 1.368c1.124-.82 2.642-1.64 4.677-1.64 1.762-.001 2.916.76 3.494 1.793zm20.296 4.772c0-1.337-.334-2.25-1.336-2.25-2.218 0-2.673 3.92-2.673 5.926 0 1.522.426 2.463 1.427 2.463 2.096 0 2.582-4.135 2.582-6.14zm-9.72 3.435c0-5.167 2.733-10 9.022-10 4.74 0 6.47 2.797 6.47 6.658 0 5.107-2.704 10.395-9.144 10.395-4.77 0-6.35-3.13-6.35-7.052z"/></svg>                </div>
                <? } ?>
            </div>

            <footer>
                <span>&copy; <?=date('Y')?> MAPO LLC</span>
                <a href="https://mapotechnology.com/about/legal/terms">Terms of Service</a>
                <a href="https://mapotechnology.com/about/legal/privacy">Privacy Policy</a>
            </footer>

        </div>
    </main>

    <?if ($_SESSION['role'] != 'ADMIN') {?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?=$ga_id?>"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','<?=$ga_id?>');(function(w, d, s, l, i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j, f);})(window,document,'script','dataLayer','GTM-NZXGFH6');<?if($amount){?>gtag('event','purchase',{'transaction_id':'<?=$pid?>','value':<?=$amount?>,'currency':'USD','items':[{item_name:'Donation',price:<?=$amount?>,quantity:1}]});<?}?></script>
    <? } ?>
</body>

</html>