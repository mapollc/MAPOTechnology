<?
if($_REQUEST[mode]=='types'){
 if(isset($_POST[action])){
	$in = array_intersect($_REQUEST[old_type], $_REQUEST[type]);
	for($i=0;$i<count($_REQUEST[type]);$i++){
	 if(!in_array($_REQUEST[type][$i], $in)){
	  $t = mysqli_real_escape_string($con, $_REQUEST[type][$i]);
	  mysqli_query($con, "INSERT INTO $db.config (aid,type,value) VALUES('$_SESSION[user_agency]', 'incident', '$t')");
	 }
	}
	for($i=0;$i<count($_REQUEST[old_type]);$i++){
	 if(!in_array($_REQUEST[old_type][$i], $in)){
	  $t = mysqli_real_escape_string($con, $_REQUEST[old_type][$i]);
	  mysqli_query($con, "DELETE FROM $db.config WHERE aid = '$_SESSION[user_agency]' AND type = 'incident' AND value = '$t'");
	 }
	}
	$done = 1;
 }

$sql = mysqli_query($con, "SELECT * FROM $db.config WHERE (aid = '$_SESSION[user_agency]' OR aid = 'all') AND type = 'incident'");
?>
<h2>Edit <?=$_SESSION[user_agency]?> Incident Types</h2>

<?if($done==1){
 echo '<div class="alert alert-success my-3">Your changes were successfully saved.</div>';
}?>

<form action="" method="post">
<a class="btn btn-sm btn-primary" id="add-itype"><i class="fas fa-plus"></i> Add New Type</a>
<div id="incident_types" class="mt-2">
<?
$x=1;
while($row = mysqli_fetch_assoc($sql)){?>
 <input type="hidden" name="old_type[]" value="<?=$row[value]?>">
 <div class="row incident_type" data-id="w<?=$x?>"><div class="col-md-4"><input type="text" name="type[]" class="form-control" style="max-width:400px" placeholder="Incident Type" value="<?=$row[value]?>"></div>
 <div class="col-md-8"><a class="btn btn-sm btn-danger<?=($row[value]=='Wildfire'||$row[value]=='Smoke Check' ? ' disabled' : '')?>" id="remove-itype" data-id="<?=$x?>"><i class="fas fa-trash-alt"></i> Remove</a></div></div>
<?
$x++;
}?>
</div>

<br><br>
<input type="submit" name="action" class="btn btn-success" value="Save Changes">
<input type="button" class="btn btn-secondary" onclick="window.location.href='../../admin'" value="Go Back">
</form>

<?}?>