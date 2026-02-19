<?
function setupGUID($domain = 'mapotechnology.com') {
    global $_COOKIE;
    
    if (!$_COOKIE['guid']) {
        if (function_exists('com_create_guid')) {
            return com_create_guid();
        } else {
            mt_srand((float)microtime() * 10000);
            $charid = strtoupper(md5(uniqid(rand(), true)));
            $hyphen = chr(45);
            $uuid = chr(123)
                . substr($charid, 0, 8) . $hyphen
                . substr($charid, 8, 4) . $hyphen
                . substr($charid, 12, 4) . $hyphen
                . substr($charid, 16, 4) . $hyphen
                . substr($charid, 20, 12)
                . chr(125);
            $guid = str_replace(['{', '}'], ['', ''], $uuid);
            
            setcookie('guid', $guid, time() + (60 * 60 * 24 * 365.25), '/', ".$domain", true);
        }
    }
}