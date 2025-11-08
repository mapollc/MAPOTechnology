<?
if (!$permission->user()->delete()) {
    echo invalidPermissions();
} else {
    if (isset($_POST['confirm'])) {
        mysqli_query($con, "DELETE FROM users WHERE uid = $_POST[uid]");
        mysqli_query($con, "DELETE FROM trail_settings WHERE uid = $_POST[uid]");
        mysqli_query($con, "DELETE FROM settings WHERE uid = $_POST[uid]");
        mysqli_query($con, "DELETE FROM oreroads_settings WHERE uid = $_POST[uid]");

        logEvent('Removed the account of user #'.$_POST['uid']);
    }
    
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, first_name, last_name FROM users WHERE uid = '$_GET[uid]'"));

    if (!$row && !isset($_POST['confirm'])) {
        echo errorCode('User account not found', 'The user account you\'re looking for does not exist.');
    } else {
?>
        <h1>Remove User</h1>

        <? if (isset($_POST['confirm'])) { ?>
            <p><?=$_POST['name']?>'s account has been successfully removed.</p>

            <a href="../people" class="btn btn-gray">Go back</a>
        <? } else { ?>
            <p>Are you sure you want to delete <?= $row['first_name'] . ' ' . $row['last_name'] ?>'s MAPO account? You will not be able to recover their information.</p>

            <form action="" method="post">
                <input type="hidden" name="name" value="<?= $row['first_name'] . ' ' . $row['last_name'] ?>">
                <input type="hidden" name="uid" value="<?= $row['uid'] ?>">

                <div class="btn-group">
                    <input type="submit" name="confirm" class="btn btn-red" value="Yes, Delete">
                    <input type="button" onclick="history.go(-1)" class="btn btn-gray" value="Cancel">
                </div>
            </form>
        <? } ?>
<? }
} ?>