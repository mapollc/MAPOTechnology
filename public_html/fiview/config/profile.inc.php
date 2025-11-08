<?
if(isset($_POST[action])&&$_POST[action]=='Save Settings'){
 foreach($_POST as $a => $b){
  if($a!='action'){
	 $new[$a] = $b;
	}
 }
 
 $s = serialize($new);
 mysqli_query($con, "UPDATE $db.users SET settings = '$s' WHERE uid = '$_SESSION[uid]'");
}

$user = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM $db.users WHERE uid = '$_SESSION[uid]'"));
$sql = mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'zone' ORDER BY value ASC");
$myset = unserialize($user['settings']);
while($row = mysqli_fetch_assoc($sql)){
    $zones[] = $row['value'];
}
?>
<h1>Dispatcher Settings: <?=$_SESSION['name']?></h1>

<form action="" method="post">
<b>Default Dispatch Zone (Resources):</b>

<select name="default_dispatch_units"><option value="all">All Zones</option>
<?foreach($zones as $z) {
    echo '<option '.($myset['default_dispatch_units'] == $z ? 'selected ' : '').'value="'.$z.'">'.$z.'</option>';
}?>
</select>

<b>Default Dispatch Zone (Incidents):</b>

<select name="default_dispatch_incs"><option value="all">All Zones</option>
<?foreach($zones as $z) {
    echo '<option '.($myset['default_dispatch_units'] == $z ? 'selected ' : '').'value="'.$z.'">'.$z.'</option>';
}?>
</select>

<input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="Save Settings">
<input type="button" class="btn" onclick="window.location.href='../../'" value="Go Back">
</form>