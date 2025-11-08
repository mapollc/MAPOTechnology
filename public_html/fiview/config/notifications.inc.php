<?
// Check if user has permissions to add or edit
if(!in_array('editUsers', $userPermissions)&&!in_array('addUsers', $userPermissions)){
 require_once('noauth.ini.php');
 exit();
}

if($_GET[mode]){
 if($_POST[delete]=='Remove Profile'){
  mysqli_query($con, "DELETE FROM $db.notifications WHERE pid = '$_GET[pid]'");
	$success = 'You have successfully deleted the notification profile for <b>'.$_POST[first_name].' '.$_POST[last_name].'.</b>';
 }else{
  if(isset($_POST[action])){
   $fname = mysqli_real_escape_string($con, $_POST[first_name]);
   $lname = mysqli_real_escape_string($con, $_POST[last_name]);
   $email = mysqli_real_escape_string($con, $_POST[email]);
	 $p = mysqli_real_escape_string($con, preg_replace('/\D/', '', $_POST[phone]));
 
   if($_GET[mode]=='add'){
	  $run = "INSERT INTO $db.notifications (agency,first_name,last_name,email,phone,carrier,method,jurisdiction) VALUES('$agency','$fname','$lname','$email','$p','$_POST[carrier]','$_POST[method]','')";
    $success = 'You successfully added a notification profile for <b>'.$_POST[first_name].' '.$_POST[last_name].'.</b>';
	 }else if($_GET[mode]=='edit'){
	  $run = "UPDATE $db.notifications SET first_name = '$fname', last_name = '$lname', email = '$email', phone = '$p', carrier = '$_POST[carrier]', method = '$_POST[method]' WHERE pid = '$_GET[pid]'";
    $success = 'You successfully updated the notification profile for <b>'.$_POST[first_name].' '.$_POST[last_name].'.</b>';
	 }
	 
	 mysqli_query($con, $run);	
  }
 }
 
 if($_GET[mode]=='edit'){
  $n = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.notifications WHERE pid = '$_GET[pid]'"));
  $phone = '('.substr($n[phone], 0, 3).') '.substr($n[phone], 3, 3).'-'.substr($n[phone], 6, 4);
 }
?>
<h1><?=($_GET[mode]=='add' ? 'Add Notification Profile' : 'Edit Notification Profile: '.$n[first_name].' '.$n[last_name])?></h1>

<?if($success){?>
<div id="message" class="success inline"><div class="text"><?=$success?></div></div>
<?}?>

<form action="" method="post">
<div class="row">
<div class="col w-4">
<b>First Name</b>
<input type="text" name="first_name" placeholder="First Name" value="<?=$n[first_name]?>">

<b>Last Name</b>
<input type="text" name="last_name" placeholder="Last Name" value="<?=$n[last_name]?>">

<b>Email</b>
<input type="email" name="email" placeholder="email@example.com" value="<?=$n[email]?>">

<b>Phone Number</b>
<input type="tel" name="phone" data-format="phone" placeholder="(123) 456-7890" value="<?=$phone?>">

<b>Carrier</b>
<select name="carrier"><option></option>
<?foreach($phoneCarriers as $k => $v){
 echo '<option '.($k==$n[carrier] ? 'selected ' : '').'value="'.$k.'">'.$v.'</option>';
}?>
</select>
</div>
<div class="col w-4">
<b>Delivery Method</b>
<div class="checkbox"><input type="radio" name="method" id="m1" value="1"<?=($n[method]==1 ? ' checked' : '')?>><label for="m1">Email</label></div>
<div class="checkbox"><input type="radio" name="method" id="m2" value="2"<?=($n[method]==2 ? ' checked' : '')?>><label for="m2">Text</label></div>
<div class="checkbox"><input type="radio" name="method" id="m3" value="3"<?=($n[method]==3 ? ' checked' : '')?>><label for="m3">Email & Text</label></div><br>

<b>Notifications for</b>


</div>
</div>

<input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="<?=($_GET[mode]=='edit' ? 'Save Changes' : 'Add Profile')?>">
<?if($_GET[mode]=='edit'){?><input type="submit" class="btn red" style="margin-right:0.5em" name="delete" value="Remove Profile"><?}?>
<input type="button" class="btn" onclick="window.location.href='../notifications'" value="Go Back">
</form>

<?}else{
$sql = mysqli_query($con, "SELECT * FROM $db.notifications WHERE agency = '$agency' ORDER BY last_name ASC, first_name ASC");
?>
<h1><?=$adminTitle?></h1>

<p class="help">When new incidents are created in <?=$software_name?>, people on this list will receive an email and/or text message notification.</p>

<input type="button" class="btn blue" onclick="window.location.href='notifications/add'" value="Add Individual">

<div class="table-responsive">
<table class="table table-striped">
<thead>
<tr><th>First Name</th><th>Last Name</th><th>Phone Number</th><th>Email</th><th></th></tr>
</thead>
<tbody>
<?while($row = mysqli_fetch_assoc($sql)){
$phone = '('.substr($row[phone], 0, 3).') '.substr($row[phone], 3, 3).'-'.substr($row[phone], 6, 4);
?>
<tr>
<td><?=$row[first_name]?></td>
<td><?=$row[last_name]?></td>
<td><?=$phone?></td>
<td><?=$row[email]?></td>
<td><a href="notifications/edit?pid=<?=$row[pid]?>">edit</a></td>
</tr>
<?}?>
</tbody>
</table>
</div>

<?}?>