<?
$sql1 = mysqli_query($con, "SELECT * FROM $db.resources WHERE agency = '$_SESSION[agency]'");

if(isset($_GET[mode])){
 $sql2 = mysqli_query($con, "SELECT * FROM $db.config WHERE aid = '$_SESSION[user_agency]' AND (type = 'jurisdiction' OR type = 'zone') ORDER BY type ASC, value ASC");

 if(isset($_POST[action])){
  $name = mysqli_real_escape_string($con, $_POST[name]);
	
  if($_POST[mode]=='add'){
	 mysqli_query($con, "INSERT INTO $db.resources (agency,jurisdiction,zone,unit,type,name,inc,status,location,last_comm) VALUES('$_SESSION[user_agency]','$_POST[jurisdiction]','$_POST[zone]','$_POST[unit]','$_POST[type]','$name','','','','')");
	}else{
	 mysqli_query($con, "UPDATE $db.resources SET jurisdiction = '$_POST[jurisdiction]', zone = '$_POST[zone]', unit = '$_POST[unit]', type = '$_POST[type]', name = '$name' WHERE id = '$_POST[uqid]'");
  }
	$success = 1;
 }
 
 if($_GET[mode]=='edit'){
  $res = mysqli_fetch_assoc(mysqli_query($con, "SELECT id, unit, jurisdiction, zone, type, name FROM $db.resources WHERE agency = '$_SESSION[user_agency]' AND unit = '$_GET[unit]'"));
 }

while($j = mysqli_fetch_assoc($sql2)){
 $d = unserialize($j[value]);
 if($j[type]=='jurisdiction'){
  $juris .= '<option '.($res[jurisdiction]==$d[value] ? 'selected ' : '').'value="'.$d[value].'">'.$d[value].' - '.$d[name].' ('.$d[agency].')</option>';
 }else{
  $zone .= '<option '.($res[zone]==$j[value] ? 'selected ' : '').'value="'.$j[value].'">'.$j[value].'</option>';
 }
}

foreach($resource_types as $k => $t){
 $types .= '<option '.($k==$res[type] ? 'selected ' : '').'value="'.$k.'">'.$t.'</option>';
}
?>
<h2><?=($_GET[mode]=='add' ? 'Add New' : 'Edit').' Resource'.($_GET[mode]=='edit' ? ': '.$res[unit] : '')?></h2>

<?if($success==1){ echo '<div class="alert alert-success">Resource <b>'.$_POST[unit].'</b> was successfully '.($_GET[mode]=='edit' ? 'updat' : 'add').'ed. <a href="../resources">Go Back</a></div>'; }?>

<form action="" method="post">
<input type="hidden" name="mode" value="<?=$_GET[mode]?>">
<?if($_GET[mode]=='edit'){?>
<input type="hidden" name="unit" value="<?=$res[unit]?>">
<input type="hidden" name="uqid" value="<?=$res[id]?>">
<?}?>

<div class="row">
 <div class="col">
  <b>Resource Type:</b><br>
  <select class="form-select" style="max-width:200px" name="type"><option>- Select -</option><?=$types?></select><br>

  <b>Resource ID:</b><br>
  <input type="text" name="unit" class="form-control" style="max-width:400px" placeholder="7100" value="<?=$res[unit]?>"><br>
  
  <b>Name:</b><br>
  <input type="text" name="name" class="form-control"  style="max-width:400px" value="<?=$res[name]?>">
 </div>
 <div class="col">
  <b>Jurisdiction:</b><br>
	<select class="form-select" name="jurisdiction"><option>- Select -</option><?=$juris?></select><br>

  <b>Default Zone:</b><br>
	<select class="form-select" name="zone"><option>- Select -</option><?=$zone?></select>
 </div>
</div>

<br><br>
<input type="submit" class="btn btn-success" name="action" value="<?=ucfirst($_GET[mode])?> Resource">
<input type="reset" class="btn btn-secondary" value="Reset">
</form>

<?}else{?>
<h2><?=$_SESSION[user_agency]?> Resources</h2>

<div class="btn-panel"><a href="resources/add" class="btn btn-info"><i class="fal fa-plus"></i> Add New Resource</a></div>
<a class="btn btn-secondary" href="../admin">Admin Home</a>
<div class="table-responsive">
 <table class="table table-striped">
  <thead class="thead-dark">
	 <tr>
	  <th scope="col">Unit</th><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Jurisdiction</th><th scope="col">Zone</th>
	 </tr>
	</thead>
	<tbody>
	<?while($res = mysqli_fetch_assoc($sql1)){?>
	 <tr data-url="edit?unit=<?=$res[unit]?>">
	  <td scope="col"><?=$res[unit]?></td><td scope="col"><?=$res[name]?></td><td scope="col"><?=$resource_types[$res[type]]?></td>
		<td scope="col"><?=$res[jurisdiction]?></td><td scope="col"><?=$res[zone]?></td>
	 </tr>
  <?}?>
	</tbody>
 </table>
</div>
<?}?>