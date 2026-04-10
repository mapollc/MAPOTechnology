<?
if (isset($_POST['confirm'])) {
    $sus = $function == 'suspend' ? 1 : 0;
    mysqli_query($con, "UPDATE groups SET suspended = $sus WHERE group_id = $_POST[group_id]");

    logEvent(ucfirst($function) . 'ed organization ' . $_POST['name']);
}

$row = executeQuery('i', [$_GET['group_id']], "SELECT group_id, name FROM groups WHERE group_id = ?");

if (!$row && !isset($_POST['confirm'])) {
    echo errorCode('Organization not found', 'The organization you\'re looking for does not exist.');
} else {
?>
    <h1><?= ucfirst($function) ?> Organization</h1>

    <? if (isset($_POST['confirm'])) { ?>
        <p><?= $_POST['name'] ?>'s account has been successfully <?= $function ?>ed.</p>

        <a href="../organizations" class="btn btn-gray">Go back</a>
        <? } else {
        if ($function == 'suspend') { ?>
            <p>Are you sure you want to suspend <b><?= $row['name'] ?>'s</b> licensed account? All users associated with the organization will retain their accounts but loose access
                to premium features.</p>
        <? } else { ?>
            <p>Are you sure you want to unsuspend <b><?= $row['name'] ?>'s</b> licensed account?</p>
        <? } ?>
        <form action="" method="post">
            <input type="hidden" name="name" value="<?= $row['name'] ?>">
            <input type="hidden" name="group_id" value="<?= $row['group_id'] ?>">

            <div class="btn-group">
                <input type="submit" name="confirm" class="btn btn-red" value="Yes, <?= ucfirst($function) ?>">
                <input type="button" onclick="history.go(-1)" class="btn btn-gray" value="Cancel">
            </div>
        </form>
<? }
} ?>