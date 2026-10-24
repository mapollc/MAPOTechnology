<?
if ($method == 'verify') {
    require_once '/home/mapo/stripe/init.php';
    require_once '/home/mapo/vendor/autoload.php';
    include_once '/home/mapo/public_html/subs.inc.php';

    $stripe = new \Stripe\StripeClient($stripeSecretKey);

    try {
        $session = $stripe->checkout->sessions->retrieve($_REQUEST['checkout_id']);

        if ($session->status == 'complete') {
            $resp = array('verified' => true, 'cid' => $session->customer, 'expires' => $session->expires_at);
        } else {
            $resp = array('verified' => false);
        }
    } catch (\Stripe\Exception\CardException $e) {
        $resp = ['response' => 'error', 'code' => 2, 'msg' => $e->getMessage()];
    } catch (\Stripe\Exception\InvalidRequestException $e) {
        $resp = ['response' => 'error', 'code' => 3, 'msg' => $e->getMessage()];
    } catch (Exception $e) {
        $resp = ['response' => 'error', 'code' => 4, 'msg' => $e->getMessage()];
    }

    $returnJson = $resp;
    return;
}

$returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'An invalid method was provided'];