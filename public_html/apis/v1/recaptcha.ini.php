<?
$secret = '6Ld5X1AkAAAAALCldapOHlENJUngsD2TPjYSCmsa';
$response = $_REQUEST['token'];
$ip = $_REQUEST['ip'];
$data = array('secret' => $secret, 'response' => $response/*, 'remoteip' => $ip*/);

$rec = post_data('https://www.google.com/recaptcha/api/siteverify', $data);

$returnJson = $rec;