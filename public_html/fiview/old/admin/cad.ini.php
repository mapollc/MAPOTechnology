<?
if(isset($_REQUEST[action])){
 foreach($_REQUEST as $k => $v){
  if($k!='agency'&&$k!='page'&&$k!='action'){
	 $arr[$k] = $v;
	}
 }
 $v = mysqli_real_escape_string($con, serialize($arr));
 mysqli_query($con, "UPDATE $db.config SET value = '$v' WHERE aid = '$_SESSION[user_agency]' AND type = 'settings'");
 $done = 1;
}

$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$_SESSION[user_agency]'"));
$settings = unserialize($row[value]);
?>
<h2>Manage CAD Settings</h2>

<?if($done==1){
 echo '<div class="alert alert-success my-3">Your dispatch settings were successfully saved.</div>';
}?>

<form action="" method="post">

<fieldset><legend>Incidents</legend>
<div class="row">
 <div class="col-md-4">
  <b>Default Incident Type:</b><br>
  <select name="default_incident" data-selected="<?=$settings[default_incident]?>" class="form-select"><option>- Choose -</option></select>
 </div>
 <div class="col-md-4">
  <b>Default Jurisdiction:</b><br>
  <select name="default_jurisdiction" data-selected="<?=$settings[default_jurisdiction]?>" class="form-select"><option>- Choose -</option></select>
 </div>
 <div class="col-md-4">
  <b>Default Zone:</b><br>
  <select name="default_zone" data-selected="<?=$settings[default_zone]?>" class="form-select"><option>- Choose -</option></select>
 </div>
</div>
</fieldset>

<fieldset><legend>Resources</legend>
<div class="row">
 <div class="col-md-4">
  <b>Status Check Timer</b><br>
	<input type="text" name="status_timer" class="form-control" style="display:inline-block;max-width:50px" placeholder="15" value="<?=$settings[status_timer]?>"> minutes
 </div>
</div>
</fieldset>

<br><br>
<input type="submit" name="action" class="btn btn-success" value="Save Changes">
<input type="button" class="btn btn-secondary" onclick="window.location.href='../../admin'" value="Go Back">
</form>