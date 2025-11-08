<?
$token = $_REQUEST['token'];

if (!$token) {
    $returnJson = array('error' => true, 'msg' => 'No authentication token was provided');
} else {
    $data = prepareQuery('s', [$token], "SELECT uid, expires FROM sessions WHERE token = ? ORDER BY created DESC LIMIT 1");

    if (!$data || isset($data['error'])) {
        $returnJson = array('error' => true, 'msg' => 'An invalid token was provided');
    } else {
        if (time() > $data['expires']) {
            $returnJson = array('error' => true, 'msg' => 'The token provided has expired');
        } else {
            $uid = $data['uid'];

            if ($method == 'sync') {
                $row = prepareQuery('i', [$uid], "SELECT settings, time FROM oreroads_settings WHERE uid = ? LIMIT 1");

                if (!isset($row['error'])) {
                    $returnJson = array('settings' => json_decode($row['settings']), 'synced' => $row['time']);
                } else {
                    $returnJson = array('error' => true, 'msg' => 'There was an error syncing your settings');
                }
            } else {
                if ($_REQUEST['settings']) {
                    $time = time();
                    $settings = json_encode(json_decode($_REQUEST['settings'], true));

                    if ($settings && $token) {
                        $firebase = $_REQUEST['firebase_token'];
                        prepareQuery('ssi', [$settings, $time, $uid], "UPDATE oreroads_settings SET settings = ?, time = ? WHERE uid = ?");

                        if ($firebase) {
                            prepareQuery('si', [$firebase, $uid], "UPDATE oreroads_settings SET app_token = ? WHERE uid = ?");
                        }

                        $returnJson = array('success' => true);
                    } else {
                        $returnJson = array('error' => true, 'msg' => 'No settings were supplied to the API request');
                    }
                } else {
                    $returnJson = array('error' => true, 'msg' => 'There was an error syncing your favorites.');
                }
            }
        }
    }
}
