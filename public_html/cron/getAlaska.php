<?
////ini_set('display_errors', 1);
/////error_reporting(E_ALL);

$timezone = 'America/Anchorage';
$theAgency = 'AICC';
$theState = 'AK';
$runQuery = true;

require_once 'getState.inc.php';

mysqli_close($con);