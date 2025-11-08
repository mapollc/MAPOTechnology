<?
session_start();
include_once('../config.inc.php');
date_default_timezone_set($_SESSION[timezone]);

$agency = strtoupper($_SESSION[agency]);

#if($_SERVER[HTTP_ORIGIN] == $baseurl){
 include($_GET[form].'.php');
#}
?>