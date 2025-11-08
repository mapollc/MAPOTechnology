<?
if(!isset($_SESSION[uid])){
 header('Location: '.$baseurl.'?error=3&r='.urlencode($_SERVER[REQUEST_URI]));
 exit();
}else{
 $aid = strtoupper($_SESSION[agency]);
 if($_SESSION[user_agency] != $aid){
  header('Location: '.$baseurl.'?error=3');
  exit();  
 }
 
 $asql = mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$aid'");
 $ae = mysqli_num_rows($asql);
 if($ae==1){
  $agency = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$aid'"));
	if($_GET[agency]!=$_SESSION[agency]){
	 header('Location: '.$baseurl.str_replace($_GET[agency], $_SESSION[agency], $_SERVER[REQUEST_URI]));
	}
 }else{
  header('Location: '.$baseurl.'?error=3');
  exit();  
 }
}
?>