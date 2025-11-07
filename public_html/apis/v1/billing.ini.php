<?
$resp = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid method was provided');

if ($method == 'verify') {
    include_once '/home/mapo/public_html/subs.inc.php';
    include_once '/home/mapo/stripe/init.php';

    \Stripe\Stripe::setApiKey($stripeSecretKey);

    try {
        $session = \Stripe\Checkout\Session::retrieve($_REQUEST['checkout_id']);

        if ($session->status == 'complete') {
            $resp = array('verified' => true, 'cid' => $session->customer, 'expires' => $session->expires_at);
        } else {
            $resp = array('verified' => false);
        }
    } catch (\Stripe\Exception\CardException $e) {
        $resp = array('response' => 'error', 'code' => 2, 'msg' => $e->getError()->message);
    } catch (\Stripe\Exception\InvalidRequestException $e) {
        $resp = array('response' => 'error', 'code' => 3, 'msg' => $e->getError()->message);
    } catch (Exception $e) {
        $resp = array('response' => 'error', 'code' => 4, 'msg' => $e->getError()->message);
    }
}

$returnJson = $resp;
