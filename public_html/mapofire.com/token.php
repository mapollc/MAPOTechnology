<?
header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');

setcookie('token', $_REQUEST['token'], time() + (60 * 60 * 7 * 24), '/', 'mapofire.com');
?>