<?
include('../config.inc.php');

ini_set('session.cookie_lifetime', $cookieLength);
ini_set('session.gc_maxlifetime', $cookieLength);
ini_set('session.cookie_domain', $cookieURL);
session_set_cookie_params(0, '/', $cookieURL);
session_start();

$agency = strtoupper($_SESSION['agency']);
date_default_timezone_set($_SESSION['timezone']);

include('../secure.inc.php');

$us = mysqli_fetch_assoc(mysqli_query($con, "SELECT permissions, settings FROM $db.users WHERE uid = '$_SESSION[uid]'"));
$prefs = unserialize($us['settings']);
$userPermissions = unserialize($us['permissions']);
$CADconfig = array('agency' => $agency, 'baseURL' => $_SERVER['HTTP_HOST'], 'build' => $software_build, 'app' => 'CAD', 'settings' => $settings);
#$userPermissions = unserialize($user['permissions']);
?>