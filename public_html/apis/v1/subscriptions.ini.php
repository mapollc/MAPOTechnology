<?
include_once '/home/mapo/public_html/subs.inc.php';

$token = $_REQUEST['token'];
$email = $_REQUEST['email'];

return $returnJson =[];

if (!$email) {
    return $returnJson = ['error' => true, 'code' => 1, 'message' => 'An invalid email was provided.'];
}

$sub = executeQuery('si', [$email, time()], "SELECT cid, subscription, trial, plan, created, start, end AS ends, status, cancel_end_period FROM billing WHERE email = ? AND (status != 'expired' OR status = 'expired' AND cancel_end_period = 1 AND end > ?) ORDER BY created DESC");

if (isset($sub['error'])) {
    return $returnJson = ['error' => true, 'code' => 2, 'message' => $sub['message']];
} else {
    if (empty($sub)) {
        return $returnJson = [];
    } else {
        if (isset($sub['cid'])) {
            $plan->setPlan(null, $sub['plan']);
            $sub['name'] = $plan->getName();
            $sub['id'] = $plan->getPriceName() ? $plan->getPriceName() : null;

            $sub['start'] = intval($sub['start']);
            $sub['ends'] = intval($sub['ends']);
            $sub['created'] = intval($sub['created']);
            $sub['cancel_end_period'] = $sub['cancel_end_period'] == 1 ? true : false;

            return $returnJson = [$sub];
        } else {
            $allSubs = [];

            foreach ($sub as $s) {
                $plan->setPlan(null, $s['plan']);
                $s['name'] = $plan->getName();
                $s['id'] = $plan->getPriceName() ? $plan->getPriceName() : null;

                $s['start'] = intval($s['start']);
                $s['ends'] = intval($s['ends']);
                $s['created'] = intval($s['created']);
                $s['cancel_end_period'] = $s['cancel_end_period'] == 1 ? true : false;

                $allSubs[] = $s;
            }

            return $returnJson = $allSubs;
        }
    }
}