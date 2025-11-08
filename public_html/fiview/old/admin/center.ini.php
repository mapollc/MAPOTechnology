<?
if(isset($_POST[mode])&&$_POST[mode]=='edit'){
 $loc = serialize(array('address' => $_POST[address], 'city' => $_POST[city], 'state' => $_POST[state], 'zip' => $_POST[zip]));
 mysql_query("UPDATE $db.agencies SET agency_id = '$_POST[agency_id]', name = '$_POST[name]', shortname = '$_POST[shortname]', location = '$loc', default_unit = '$_POST[default_unit]' WHERE agency_id = '$_SESSION[agency]'");
 if($_POST[agency_id] != $_SESSION[agency]){
  $_SESSION[agency] == $_POST[agency_id];
 }
 
 echo '<div class="message success">Your settings were successfully updated.</div>';
}
$agc = mysqli_fetch_assoc(mysqli_query("SELECT * FROM $db.agencies WHERE agency_id = '$_SESSION[user_agency]'"));
$loc = unserialize($agc[location]);
?>

<form action="" method="post">
<input type="hidden" name="mode" value="<?=$_GET[mode]?>">

<input type="text" class="form-control" name="agency_id" value="<?=$agc[agency_id]?>"><br>
<input type="text" class="form-control" name="name" value="<?=$agc[fullname]?>"><br>
<input type="text" class="form-control" name="shortname" value="<?=$agc[shortname]?>"><br>
<input type="text" class="form-control" name="address" value="<?=$loc[address]?>"><br>
<input type="text" class="form-control" name="city" value="<?=$loc[city]?>"><br>
<select name="state" class="form-select">
<option value="">- Choose -</option>
<?foreach($states_array as $k => $v){
 echo '<option '.($loc[state]==$k ? 'selected ' : '').'value="'.$k.'">'.$v.'</option>';
}?>
</select>
<input type="text" name="zip" maxlength="5" value="<?=$loc[zip]?>"><br>

<input type="text" name="default_unit" value="<?=$agc[default_unit]?>"><br><br>

<input type="submit" class="button save" value="Save Changes">

</form>