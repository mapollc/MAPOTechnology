<?
include('config.inc.php');

ini_set('session.cookie_lifetime', $cookieLength);
ini_set('session.gc_maxlifetime', $cookieLength);
ini_set('session.cookie_domain', $cookieURL);
session_set_cookie_params(0, '/', $cookieURL);

session_start();

$_SESSION = array();
session_unset();
session_regenerate_id();
  
setcookie('agency', $row[agency], ['expires' => time() - $cookieLength, 'path' => '/', 'domain' => $cookieURL, 'samesite' => 'Strict']);

header('Location: '.$domain.'?logout=1');
?>