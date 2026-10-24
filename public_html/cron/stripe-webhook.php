<?
if (isset($_REQUEST['devel'])) $stripeLive = false;

ini_set('display_errors', 1);
error_reporting(E_PARSE | E_ERROR);

require_once '/home/mapo/stripe/init.php';
require_once '/home/mapo/vendor/autoload.php';
require_once '/home/mapo/public_html/config.inc.php';

class StripeWebhookHandler
{
    private $con;
    private $endpointSecret;
    private $stripe;

    public function __construct($con, $stripeSecretKey, $endpointSecret)
    {
        $this->con = $con;
        $this->endpointSecret = $endpointSecret;

        $this->stripe = new \Stripe\StripeClient($stripeSecretKey);
    }

    public function handle(): void
    {
        $payload = @file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $this->endpointSecret);
        } catch (\UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $e) {
            http_response_code(400);
            exit('Webhook error.');
        }

        $json = $event->data->object;

        switch ($event->type) {
            case 'customer.subscription.created':
                $this->handleCreated($json);
                break;
            case 'customer.subscription.deleted':
                $this->handleDeleted($json);
                break;
            case 'customer.subscription.trial_will_end':
                $this->handleTrialWillEnd($json);
                break;
            case 'customer.subscription.updated':
                $this->handleUpdated($json, $event);
                break;
        }
    }

    private function handleCreated($json)
    {
        $id = $json['id'];
        $created = $json['created'];
        $plan = $json['items']['data'][0]['plan']['id'] ?? '';
        $customerID = $json['customer'];
        $start = $json['current_period_start'];
        $end = $json['current_period_end'];

        $trial = (!empty($json['trial_start']) && !empty($json['trial_end'])) ? 1 : 0;

        $bill = $this->stripe->subscriptions->retrieve($id, []);
        $customer = $this->stripe->customers->retrieve($bill->customer);

        mysqli_query(
            $this->con,
            "INSERT IGNORE INTO billing (email, cid, subscription, plan, trial, created, start, end, status, usedTrial, cancel_end_period)
            VALUES('$customer->email', '$customerID', '$id', '$plan', $trial, '$created', $start, $end, 'active', $trial, NULL)"
        );
    }

    private function handleDeleted($json)
    {
        $id = $json['id'];
        $time = time();

        mysqli_query($this->con, "UPDATE billing SET end = '$time', status = 'expired' WHERE subscription = '$id'");
    }

    private function handleTrialWillEnd(array|object $json): void
    {
        require_once '/home/mapo/public_html/subs.inc.php';

        $id = $json['id'];
        $bill = $this->stripe->subscriptions->retrieve($id, []);
        $customer = $this->stripe->customers->retrieve($bill->customer);
        $planID = $json['items']['data'][0]['plan']['id'] ?? '';

        if (isset($plan) && is_object($plan)) {
            $plan->setPlan($planID);
            $planName = $plan->getName();
        } else {
            $planName = $planID;
        }

        sendEmail(
            $customer->email,
            'Your free trial is ending soon - stay protected with Map of Fire',
            'freetrial',
            ['{name}' => $customer->name, '{plan}' => $planName, '{ends}' => date('F j, Y', $json['current_period_end'])],
            true
        );
    }

    private function handleUpdated(array|object $json, object $event): void
    {
        $id = $json['id'];
        $start = $json['current_period_start'];
        $end = $json['current_period_end'];
        $planID = $json['plan']['id'] ?? $json['items']['data'][0]['plan']['id'] ?? '';
        $newStatus = $json['status'];
        $prev = $event->data->previous_attributes ?? [];

        $isTrialConversion = ($newStatus === 'active' && isset($prev['status']) && $prev['status'] === 'trialing');
        $cancelEndPeriod = !empty($json['cancel_at_period_end']) ? 1 : 0;
        $trial = ($newStatus === 'trialing') ? 1 : 0;
        $trialVal = $isTrialConversion ? 0 : $trial;

        mysqli_query(
            $this->con,
            "UPDATE billing SET trial = $trialVal, plan = '$planID', start = $start, end = $end, status = 'active', cancel_end_period = $cancelEndPeriod
            WHERE subscription = '$id'"
        );
    }
}

$endpointSecret = getenv($stripeLive ? 'STRIPE_WEBHOOK_SECRET_PROD' : 'STRIPE_WEBHOOK_SECRET_DEV');
$webhookHandler = new StripeWebhookHandler($con, $stripeSecretKey, $endpointSecret);
$webhookHandler->handle();

mysqli_close($con);
