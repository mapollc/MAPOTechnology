<?
if($_GET[mode]=='remove'){
 if(isset($_POST[action])&&$_POST[action]=='Yes, remove this resource'){
  mysqli_query($con, "DELETE FROM $db.config WHERE id = '$_POST[id]'");
	$success = 1;
 }
?>
<h1>Remove Resource Type</h1>

<?if($success){?>
<div id="message" class="success inline"><div class="text">This resource was successfully removed from <?=$software_name?></div></div>

<input type="button" class="btn" onclick="window.location.href='../resourceTypes'" value="Go back to resource types list">
<?}else{?>

<form action="" method="post">
<input type="hidden" name="id" value="<?=$_GET[id]?>">

<p>Are you sure you want to remove this resource from <?=$software_name?>?</p>

<input type="submit" class="btn red" style="margin-right:0.5em" name="action" value="Yes, remove this resource">
<input type="button" class="btn green" onclick="window.location.href='../resourceTypes'" value="No, go back">
</form>
<?}
}else if($_GET[mode]=='add'){
 if(isset($_POST[action])&&$_POST[action]=='Add Resource'){
  $ser = serialize(array($_POST[code], $_POST[type]));
  $arr = mysqli_real_escape_string($con, $ser);
	
	$bool = mysqli_num_rows(mysqli_query($con, "SELECT id FROM $db.config WHERE aid = '$agency' AND type = 'resourceType' AND value = '$ser'"));
	if($bool>0){
	 $error = 'This resource type already exists.';
	}else{
	 mysqli_query($con, "INSERT INTO $db.config (aid,type,value) VALUES('$agency','resourceType','$arr')");
	 $success = 'You successfully added <b>'.$_POST[type].'</b> as a resource type.';
	}
 }
?>
<h1>Add Resource Type</h1>

<?if($success||$error){?>
<div id="message" class="<?=($success ? 'success' : 'error')?> inline"><div class="text"><?=($success ? $success : $error)?></div></div>
<?}?>

<form action="" method="post">

<b class="req">Code</b>
<input type="text" name="code" style="width:110px" placeholder="AA" value="">

<b class="req">Resource Type</b>
<input type="text" name="type" placeholder="Air Attack" value="">

<input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="Add Resource">
<input type="button" class="btn" onclick="window.location.href='../resourceTypes'" value="Go Back">
</form>

<?}else{
$rt = mysqli_query($con, "SELECT id, aid, value FROM $db.config WHERE type = 'resourceType' AND (aid = 'all' OR aid = '$agency') ORDER BY aid ASC");
?>
<h1>Manage Resource Types</h1>

<p class="help">Manage resource types for your agency's jurisdiction</p>

<input type="button" class="btn blue" onclick="window.location.href='resourceTypes/add'" value="Add Resource Type">

<div class="table-responsive">
<table class="table table-striped">
<thead>
<tr><th>Code</th><th>Resource Type</th><th>Owner</th><th></th></tr>
</thead>
<tbody>
<?while($row = mysqli_fetch_assoc($rt)){
 $rv = unserialize($row[value]);
 echo '<tr><td>'.$rv[0].'</td><td>'.$rv[1].'</td><td>'.($row[aid]=='all' ? 'System' : $agency).'</td><td>'.($row[aid]!='all' ? '<a href="resourceTypes/remove?id='.$row[id].'">remove</a>' : '').'</td></tr>';
}?>
</tbody>
</table>
</div>
<?}?>