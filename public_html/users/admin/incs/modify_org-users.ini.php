<?
if ($function == 'people' && !$permission->orgs()->people()) {
    echo invalidPermissions();
} else {
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT org_key, name FROM groups WHERE group_id = '$_GET[group_id]'"));
    $user = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, CONCAT(first_name, ' ', last_name) AS name FROM users WHERE uid = '$_GET[uid]'"));
?>

<h1>Revoke User Access</h1>

<p>Are you sure you want to revoke access from <b><?= $user['name'] ?></b> to the organization <b><?= $row['name'] ?> (<?= $row['org_key'] ?>)</b>?</p>

<form action="" method="post">
    <input type="hidden" name="group_id" value="<?= $_GET['group_id'] ?>">    
    <input type="hidden" name="org_key" value="<?= $_GET['org_key'] ?>">
    <input type="hidden" name="uid" value="<?= $user['uid'] ?>">
</form>

<?}?>