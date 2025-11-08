<?
if (isset($_POST['action']) && $_POST['action'] == 'Save Response Areas') {
    $s = serialize($_POST['level']);

    $num = mysqli_num_rows(mysqli_query($con, "SELECT id FROM $db.config WHERE aid = '$agency' AND `type` = 'responseAreas'"));
    if ($num == 0) {
        $sql = "INSERT INTO $db.config (aid,type,value) VALUES('$agency','responseAreas','$s')";
    } else {
        $sql = "UPDATE $db.config SET value = '$s' WHERE aid = '$agency' AND type = 'responseAreas'";
    }

    mysqli_query($con, $sql);
    $success = 'Response level areas were successfully updated.';
}

$result = mysqli_query($con, "SELECT value AS name FROM $db.config WHERE aid = '$agency' AND `type` = 'zone' ORDER BY value ASC");
$result2 = mysqli_query($con, "SELECT level, settings FROM $db.responseLevels WHERE agency = '$agency' AND active = 1 ORDER BY priority ASC");
$value = unserialize(mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'responseAreas'"))['value']);
while ($row = mysqli_fetch_assoc($result2)) {
    $ops[] = $row['level'];
}
?>
<h1>Response Level Areas</h1>

<? if ($success) { ?>
    <div id="message" class="success inline">
        <div class="text"><?= $success ?></div>
    </div>
<?}?>

<form action="" method="post">

<?while($data = mysqli_fetch_assoc($result)) {?>
<fieldset><legend><?=$data['name']?></legend>
    <?foreach($ops as $v) {
        echo '<div class="checkbox inline"><input type="checkbox" id="'.$data['name'].$v.'" name="level['.$data['name'].'][]" value="'.$v.'"'.(in_array($v, $value[$data['name']]) ? ' checked' : '').'><label for="'.$data['name'].$v.'">'.$v.'</label></div>';
    }?>
</fieldset>
<?}?>

<input type="submit" name="action" class="btn green" style="margin-right:0.5em" value="Save Response Areas">
<input type="button" class="btn" onclick="window.location.href='../responseLevels'" value="Go Back">

</form>