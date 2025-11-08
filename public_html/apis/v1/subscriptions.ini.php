<?
$token = $_REQUEST['token'];
$now = time();
$fields = "id AS bid, subscription AS sid, plan, trial AS is_trial, b.created AS purchased, start AS period_start, end AS period_end, active AS active_subscription";
$sql = "SELECT $fields FROM sessions AS s LEFT JOIN users AS u ON s.uid = u.uid LEFT JOIN billing AS b ON b.email = u.email WHERE s.expires > ? AND active = 1 AND token = ? ORDER BY end DESC";
$validToken = validToken($token);

if ($validToken) {
    $result = prepareQuery('is', [$now, $token], $sql);

    if (!isset($result['error'])) {
        //while ($row = mysqli_fetch_assoc($result)) {
            foreach ($result as $k => $v) {
                if ($k == 'bid' || $k == 'purchased' || $k == 'period_start' || $k == 'period_end') {
                    $value = floatval($v);
                } else if ($k == 'active_subscription' || $k == 'is_trial') {
                    $value = $v == 1 ? true : false;
                } else {
                    $value = $v;
                }

                $subs[$k] = $value;
            }
            //$subs = $ea;
        //}

        $returnJson = array('subscriptions' => $subs);
    }
} else {
    $returnJson = array('error' => true, 'message' => 'An invalid token was provided');
}