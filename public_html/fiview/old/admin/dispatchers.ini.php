<?
if($mode=='add'||$mode=='edit'){
?>
<h2><?=ucfirst($mode)?> Dispatcher</h2>

<?
}else{
$dsql = mysql_query("SELECT * FROM $db.users ORDER BY last_name ASC, first_name ASC");
?>
<h2>Manage Dispatchers</h2>

<input type="button" class="btn btn-success" onclick="window.location.href='dispatchers/add'" value="Add New Dispatcher">

<div class="table_header">
 <div class="col w10">UID</div>
 <div class="col w20">Last Name</div>
 <div class="col w20">First Name</div>
 <div class="col w20">Username</div>
 <div class="col w25"></div>
</div>
<div class="table_container">
<?while($dis = mysql_fetch_assoc($dsql)){?>
 <div class="row">
  <div class="col w10"><?=$dis[uid]?></div>
  <div class="col w20"><?=$dis[last_name]?></div>
  <div class="col w20"><?=$dis[first_name]?></div>
  <div class="col w20"><?=$dis[username]?></div>
  <div class="col w25"></div>
 </div>
<?}?>
</div>
<?}?>