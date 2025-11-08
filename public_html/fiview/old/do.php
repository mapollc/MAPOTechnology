<?
ini_set('display_errors',0);
session_start();
include('config.inc.php');

if(isset($_POST[action]) && $_POST[action]=='login'){
 $user = mysqli_real_escape_string($con, $_POST[username]);
 $pass = $_POST[password];
 $time = time();

 if($_POST[agency]==''){
	header('Location: '.$baseurl.'?error=2');
 }else{	
  $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, first_name, last_name, password, permissions, agency FROM $db.users WHERE username = '$user'"));

	if($_POST[agency]!=strtolower($row[agency])){
	 header('Location: '.$baseurl.'?error=3&agency='.$_POST[agency]);
	}else{
   if(password_verify($pass, $row[password])){
    $_SESSION['expire'] = (time()+2592000);
    $_SESSION['update'] = time();
    $_SESSION['uid'] = $row[uid];
    $_SESSION['first_name'] = $row[first_name];
    $_SESSION['last_name'] = $row[last_name];
    $_SESSION['name'] = $row[last_name].', '.$row[first_name];
    $_SESSION['permissions'] = $row[permissions];
    $_SESSION['user_agency'] = $row[agency];
	  $_SESSION['agency'] = $_POST[agency];
	 
		logEvent($db, $con, 'Logged in', $row[uid], $con);
    header('Location: '.$baseurl.(isset($_REQUEST[r]) ? $_REQUEST[r] : '/agency/'.$_SESSION[agency].'/dispatch'));
	 }else{
	  header('Location: '.$baseurl.'?error=1');
	 }
	}
 }
}
?>