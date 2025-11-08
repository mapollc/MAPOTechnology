<?
//$stripeLive = false;

ini_set('display_errors', 1);
error_reporting(E_PARSE && E_ERROR);
require_once '/home/mapo/stripe/init.php';
require_once '/home/mapo/public_html/db.ini.php';

/*function getPlan($theID)
{
    global $plan;

    foreach ($plan as $a) {
        foreach ($a['price_id'] as $price) {
            if ($price['id'] == $theID) {
                $prod = $a;
                unset($prod['price_id']);
                return ['details' => $prod, 'pricing' => $price];
            }
        }
    }

    return null;
}*/

\Stripe\Stripe::setApiKey($stripeSecretKey);

$payload = @file_get_contents('php://input');
$event = null;

try {
    $event = \Stripe\Event::constructFrom(
        json_decode($payload, true)
    );
} catch (\UnexpectedValueException $e) {
    // Invalid payload
    echo 'Webhook error while parsing basic request.';
    http_response_code(400);
    exit();
}

$time = time();
$type = $event->type;
$json = $event->data->object;
$trial = ($json['status'] === 'trialing' && !empty($json['trial_start']) && !empty($json['trial_end'])) ? 1 : 0;

$start = $json['current_period_start'];
$end = $json['current_period_end'];
$id = $json['id'];

switch ($type) {
    case 'customer.subscription.created':
        $created = $json['created'];
        $plan = $json['items']['data'][0]['plan']['id'];
        $customerID = $json['customer'];

        $bill = \Stripe\Subscription::retrieve($id, []);
        $customer = \Stripe\Customer::retrieve($bill->customer);

        mysqli_query($con, "INSERT IGNORE INTO billing (email,cid,subscription,plan,trial,created,start,end,status,usedTrial,cancel_end_period)
        VALUES('$customer->email','$customerID','$id','$plan',$trial,'$created','$start','$end','active',$trial,NULL)");

        break;

    case 'customer.subscription.deleted':
        mysqli_query($con, "UPDATE billing SET end = '$time', status = 'expired' WHERE subscription = '$id'");

        break;

    case 'customer.subscription.paused':
        break;
    case 'customer.subscription.resumed':
        break;

    case 'customer.subscription.trial_will_end':
        require_once '/home/mapo/public_html/subs.inc.php';

        // need to send the user an email that their trial is almost over
        $bill = \Stripe\Subscription::retrieve($id, []);
        $customer = \Stripe\Customer::retrieve($bill->customer);
        $name = $customer->name;
        $email = $customer->email;
        $plan->setPlan($json['items']['data'][0]['plan']['id']);

        sendEmail($email, 'Your free trial is ending soon - stay protected with Map of Fire', 'freetrial', array('{name' => $name, '{plan}' => $plan->getName(), '{ends}' => date('F j, Y', $end)), true);

        break;

    case 'customer.subscription.updated':
        $start = $json['current_period_start'];
        $end = $json['current_period_end'];
        $planID = $json['plan']['id'];
        $newStatus = $json['status'];
        $prev = $event->data->previous_attributes;

        if ($json['cancel_at'] != null) {
            $boo = $json['cancel_at_period_end'];

            mysqli_query($con, "UPDATE billing SET plan = '$planID', end = '$end', status = 'cancel', cancel_end_period = $boo WHERE subscription = '$id'");
        } else {
            mysqli_query($con, "UPDATE billing SET plan = '$planID', end = '$end', status = 'active', cancel_end_period = NULL WHERE subscription = '$id'");
        }

        // Trial just ended
        if ($newStatus === 'active' && isset($prev['status']) && $prev['status'] === 'trialing') {
            mysqli_query($con, "UPDATE billing SET trial = 0, plan = '$planID', start = '$start', end = '$end' WHERE subscription = '$id'");
        }

        break;
}

mysqli_close($con);

/*include_once('/home/mapo/public_html/db.ini.php');

\Stripe\Stripe::setApiKey($stripeSecretKey);

// Replace this endpoint secret with your endpoint's unique secret
// If you are testing with the CLI, find the secret by running 'stripe listen'
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
$payload = @file_get_contents('php://input');
$event = null;

try {
    $event = \Stripe\Event::constructFrom(
        json_decode($payload, true)
    );
} catch (\UnexpectedValueException $e) {
    // Invalid payload
    echo 'Webhook error while parsing basic request.';
    http_response_code(400);
    exit();
}

// Handle the event
$type = $event->type;
$json = $event->data->object;
$trial = ($json['status'] == 'trialing' ? 1 : 0);

$start = $json['current_period_start'];
$end = $json['current_period_end'];
$id = $json['id'];

$bill = mysqli_fetch_assoc(mysqli_query($con, "SELECT email, active FROM billing WHERE subscription = '$id'"));

// subscription created
if ($type == 'customer.subscription.created') {
    $created = $json['created'];
    $plan = $json['items']['data'][0]['plan']['id'];
    $customerID = $json['customer'];

    $bill = \Stripe\Subscription::retrieve($id, []);
    $customer = \Stripe\Customer::retrieve($bill->customer);

    mysqli_query($con, "INSERT IGNORE INTO billing (email,cid,subscription,plan,trial,created,start,end,active) VALUES('$customer->email','$customerID','$id','$plan','$trial','$created','$start','$end','1')");
    mysqli_query($con, "UPDATE users SET role = 2 WHERE email = '$customer->email' AND role != 3");
} else if ($type == 'customer.subscription.updated') {
    // subscription updated
    $fields = "start = '$start', end = '$end', trial = '$trial'" . ($json['canceled_at'] ? ", active = 2" : ($bill['active'] != 1 ? ", active = 1" : ""));

    mysqli_query($con, "UPDATE billing SET $fields WHERE subscription = '$id'");

    if ($bill['active'] != 1) {
        mysqli_query($con, "UPDATE users SET role = 2 WHERE email = '$bill[email]' AND role != 3");
    }
} else if ($type == 'customer.subscription.deleted') {
    mysqli_query($con, "UPDATE billing SET active = 0 WHERE subscription = '$id'");
    mysqli_query($con, "UPDATE users SET role = 1 WHERE email = '$bill[email]' AND role != 3");
}*/
    
    /*switch ($event->type) {
        /*case 'customer.subscription.trial_will_end':
            $subscription = $event->data->object; // contains a \Stripe\Subscription
            // Then define and call a method to handle the trial ending.
            // handleTrialWillEnd($subscription);
            break;
        case 'customer.subscription.created':
            $subscription = $event->data->object; // contains a \Stripe\Subscription
            // Then define and call a method to handle the subscription being created.
            process('created', $subscription, $con);
            break;
        case 'customer.subscription.deleted':
            $subscription = $event->data->object; // contains a \Stripe\Subscription
            // Then define and call a method to handle the subscription being deleted.
            process('deleted', $subscription, $con);
            break;
        case 'customer.subscription.updated':
            $subscription = $event->data->object; // contains a \Stripe\Subscription
            // Then define and call a method to handle the subscription being updated.
            process('updated', $subscription, $con);
            break;
        default:
            // Unexpected event type
            echo 'Received unknown event type';
    }*/
