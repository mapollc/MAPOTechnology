<?
if($_GET[mode]=='jurisdictions'||$_GET[type]=='jurisdictions'){
 $m = 1;
 $sql = mysqli_query($con, "SELECT type, value FROM $db.config WHERE aid = '$_SESSION[user_agency]' AND type = 'jurisdiction'");
}else if($_GET[mode]=='zones'||$_GET[type]=='zones'){
 $m = 2;
 $sql = mysqli_query($con, "SELECT id, type, value FROM $db.config WHERE aid = '$_SESSION[user_agency]' AND type = 'zone'");
}

if(isset($_POST[action])){
 if($_POST[mode]=='remove'){
	mysqli_query($con, "DELETE FROM $db.config WHERE aid = '$_SESSION[user_agency]' AND `value` LIKE '%$_REQUEST[v]%' AND `value` LIKE '%$_REQUEST[n]%'");
	$success = 2;
 }else{
  $name = mysqli_real_escape_string($con, $_POST[name]);
 
  if($_POST[type]=='zones'){
   mysqli_query($con, "INSERT INTO $db.config (aid,type,value) VALUES('$_SESSION[user_agency]','zones','$name')");
  }else{
   $e = explode('|', $_REQUEST[unit]);
   $d = serialize(array('value' => $e[0], 'agency' => $_REQUEST[agency], 'name' => $e[1]));
	 mysqli_query($con, "INSERT INTO $db.config (aid,type,value) VALUES('$_SESSION[user_agency]','jurisdiction','$d')");
  }
 
  $success = 1;
 }
}
$type = substr($_GET[type], 0, -1);

if($_GET[mode]=='remove'){?>
<h2>Remove <?=ucfirst($type)?></h2>

<?if($success==2){?>
<div class="alert alert-success">You have successfully removed jurisdiction <b><?=$_REQUEST[v]?></b>. <a href="../../admin/areas/jurisdictions">Go back</a>.</div>
<?}else{?>

<form action="" method="post">
<input type="hidden" name="mode" value="remove">
<input type="hidden" name="v" value="<?=$_GET[v]?>">

<p class="mt-3 mb-4 fs-6">Are you sure you want to remove the <?=$type?> <b><?=$_GET[v].': '.$_GET[n]?></b>?</p>

<input type="submit" name="action" class="btn btn-danger" value="Yes, remove <?=$type?>"> &nbsp; 
<input type="button" class="btn btn-success" onclick="history.go(-1)" value="No, go back">
</form>

<?}
}else if($_GET[mode]=='add'){?>
<h2>Add <?=ucfirst($type)?></h2>

<?if($success==1){?><div class="alert alert-success">You successfully added a <?=$_REQUEST[type]?> to the CAD configuration. <a href="../../admin/areas/jurisdictions">Go back</a>.</div><?}?>
<form action="" id="areas" method="post">
<input type="hidden" name="mode" value="<?=$_GET[mode]?>">
<input type="hidden" name="type" value="<?=$type?>">

<?if($m==1){?>
<div class="row">
<div class="col-md-6">

<b>State</b><br>
<select id="state" name="state" class="form-select"><option></option>
<?foreach($states_array as $k => $v){
 echo '<option value="'.$k.'">'.$v.'</option>';
}?>
</select>

<b>Agency</b><br>
<select id="agency" name="agency" class="form-select" disabled><option>- Select -</option></select>

<b>Unit</b><br>
<select id="unit" name="unit" class="form-select" disabled><option>- Select -</option></select>

</div>
</div>
<?}else{?>
<input type="text" name="name" class="form-control" placeholder="Zone Name" value="">
<?}?>

<br>
<input type="submit" name="action" class="btn btn-success" value="Add <?=ucfirst($type)?>">
</form>

<?}else{
?>
<h2><?=$_SESSION[user_agency].' '.ucfirst($_GET[mode])?></h2>

<div class="btn-panel"><a href="./add?type=<?=$_GET[mode]?>" class="btn btn-info"><i class="fal fa-plus"></i> Add New <?=ucfirst($_GET[mode])?></a></div>

<?if($m==2){?>
<br><br>
<b class="mt-4">Current Zones</b>
<ul>
<?while($row = mysqli_fetch_assoc($sql)){
 echo '<li>'.$row[value].' (<a href="zones/edit?id='.$row[id].'">edit</a> | <a href="zones/remove?id='.$row[id].'">remove</a>)</li>';
}?>
</ul>
<?}else{?>
<a class="btn btn-secondary" href="../../admin">Admin Home</a>
<div class="table-responsive">
 <table class="table table-striped">
  <thead class="thead-dark">
	 <tr>
	  <th scope="col">Identifier</th>
		<th scope="col">Name</th>
		<th scope="col">Agency</th>
		<th scope="col">&nbsp;</th>
	 </tr>
	</thead>
	<tbody>
	 <?while($row = mysqli_fetch_assoc($sql)){
	 $data = unserialize($row[value]);
	 ?>
	 <tr>
		<td scope="col"><?=$data[value]?></td>
		<td scope="col"><?=$data[name]?></td>
		<td scope="col"><?=$data[agency]?></td>
		<td scope="col"><a href="./remove?type=jurisdictions&v=<?=$data[value]?>&n=<?=$data[name]?>">remove</a></td>
	 </tr>
	 <?}?>
	</tbody>
 </table>
</div>
<?}}?>