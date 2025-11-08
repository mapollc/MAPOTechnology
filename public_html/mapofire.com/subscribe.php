<?
ini_set('display_errors', 1);
error_reporting(E_ERROR & E_PARSE);
session_start();
$stripeLive = false;

require_once '/home/mapo/stripe/init.php';

$plan = [
    [
        'id' => 1,
        'product' => 'prod_SeguW9sYTc3MZ1',
        'name' => 'Map of Fire: IGNITE',
        'price' => 9.99,
        'price_id' => [
            [
                'id' => 'price_1RjNWnIqEsGXsIu3qZOIBePm',
                'term' => 1,
                'discount' => 0
            ]
        ]
    ],
    [
        'id' => 2,
        'product' => 'prod_SegwXXyeCediJy',
        'name' => 'Map of Fire: HOTSHOT',
        'price' => 19.99,
        'price_id' => [
            [
                'id' => 'price_1RjNYYIqEsGXsIu3krvH7APQ',
                'term' => 1,
                'discount' => 0
            ],
            [
                'id' => 'price_1RjNc8IqEsGXsIu35YMp577R',
                'term' => 12,
                'discount' => 0.1
            ]
        ]
    ]
];

// have the user login or create an account before they continue with subscriptions
if (isset($_POST) && isset($_POST['price'])) {
    if ($_SESSION && $_SESSION['uid']) {
        $email = null;
        require_once '/home/mapo/public_html/db.ini.php';
        $user = prepareQuery('i', [$_SESSION['uid']], "SELECT email FROM users WHERE uid = ?");
        mysqli_close($con);

        if (!empty($user)) {
            $email = $user['email'];
        }

        header('Location: https://www.mapofire.com/purchase/complete?price=' . $_POST['price'] . ($_POST['trial'] ? '&trial=1' : '') . ($email != null ? '&customer_email=' . $email : ''));
    } else {
        $url = 'https://www.mapotechnology.com/secure/register?service=mapofire&subscribe=1&price_id=' . $_POST['price'] . ($_POST['trial'] ? '&trial=1' : '');
        #echo $url;
        header("Location: $url");
    }
}

// if status query parameter is complete, we're ready to start charging for the subscription
if ($_GET['status'] == 'complete') {
    $priceId = preg_match('/^price_[a-zA-Z0-9]+$/', $_GET['price']) ? $_GET['price'] : null;
    $trialRequested = isset($_REQUEST['trial']) && $_REQUEST['trial'] == 1;

    \Stripe\Stripe::setApiKey($stripeSecretKey);

    $fields = [
        'billing_address_collection' => 'auto',
        'line_items' => array(
            [
                'price' => $priceId,
                'quantity' => 1
            ]
        ),
        'mode' => 'subscription',
        'success_url' => 'https://www.mapofire.com/purchase/success' . ($trialRequested ? '?trial=1' : ''),
        'cancel_url' => 'https://www.mapofire.com/purchase?failed=cancel' . (isset($_REQUEST['customer_email']) ? '&isUser=true' : ''),
    ];

    if ($priceId == $plan[1]['price_id'][1]['id']) {
        $fields['discounts'] = [
            ['promotion_code' => 'promo_1RjPYJIqEsGXsIu3AdnqDt2U']
        ];
    } else {
        $fields['allow_promotion_codes'] = true;
    }

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

    if (isset($_REQUEST['customer_email'])) {
        $fields['subscription_data']['metadata'] = ['user_id' => $_SESSION['uid']];
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

    try {
        $checkout_session = \Stripe\Checkout\Session::create($fields);

        header("HTTP/1.1 303 See Other");
        header("Location: " . $checkout_session->url);
    } catch (Exception $e) {
        print_r($e);
    }
}
?>

<? if (!isset($_GET['status'])) { ?>
    <h2>IGNITE</h2>
    <form action="https://mapofire.com/purchase" method="post">
        <input type="hidden" name="trial" value="1">
        <input type="hidden" name="price" value="<?=$plan[0]['price_id'][0]['id']?>">
        <input type="submit" value="Free Trial">
    </form>
    <form action="https://mapofire.com/purchase" method="post">
        <input type="hidden" name="price" value="<?=$plan[0]['price_id'][0]['id']?>">
        <input type="submit" value="Subscribe (Monthly)">
    </form>
    <h2>HOTSHOT</h2>
    <form action="https://mapofire.com/purchase" method="post">
        <input type="hidden" name="trial" value="1">
        <input type="hidden" name="price" value="<?=$plan[1]['price_id'][0]['id']?>">
        <input type="submit" value="Free Trial">
    </form>
    <form action="https://mapofire.com/purchase" method="post">
        <input type="hidden" name="price" value="<?=$plan[1]['price_id'][0]['id']?>">
        <input type="submit" value="Subscribe (Monthly)">
    </form>
    <form action="https://mapofire.com/purchase" method="post">
        <input type="hidden" name="price" value="<?=$plan[1]['price_id'][1]['id']?>">
        <input type="submit" value="Subscribe (Annual)">
    </form>
<? } ?>

<? if ($_GET['status'] == 'success') {?>
<h2>Your subscription is now active</h2>
    <?}?>