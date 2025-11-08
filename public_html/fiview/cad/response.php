<?
include_once('../includes.inc.php');

/*$us = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM $db.users WHERE uid = '$_SESSION[uid]'"));
$pref = unserialize($us[settings]);*/
$pageTitle = $software_name . ' - Response Levels';
$cssArray = array('fonts', 'fa', 'main', 'admin'/*,'dispatch'/*,'jquery'*/);

if (isset($_POST['action']) && $_POST['action'] == 'Set Response Settings') {
    for ($i = 0; $i < count($_POST['level']); $i++) {
        $z[$_POST['level'][$i]][] = $_POST['zone'][$i];
    }
    
    foreach ($z as $a => $b) {
        $z = serialize($b);
        mysqli_query($con, "UPDATE $db.responseLevels SET zones = '$z' WHERE agency = '$agency' AND level = '$a'");
    }

    $success = 'Your response levels have been assigned to your zones.';
}

include_once('../header.inc.php');
?>

<main class="page">
    <div class="container">
        <div class="row">
            <div class="col w-12">
                <div class="card">
                <?// Check if user has permissions to add or edit
                if (!in_array('setResponse', $userPermissions)){
                    require_once('../config/noauth.ini.php');
                    exit();
                } else{
                    $result = mysqli_query($con, "SELECT id, value AS name FROM $db.config WHERE aid = '$agency' AND `type` = 'zone' ORDER BY value ASC");
                    $result2 = mysqli_query($con, "SELECT level, priority, settings, zones FROM $db.responseLevels WHERE agency = '$agency' AND active = 1 ORDER BY priority ASC");
                    while ($row = mysqli_fetch_assoc($result2)) {
                        $level[] = $row['level'];
                        $pri[] = $row['priority'];
                        $zone[] = unserialize($row['zones']);
                    }
                    ?>
                    <h1>Response Levels</h1>

                    <? if ($success) { ?>
                        <div id="message" class="success inline">
                            <div class="text"><?= $success ?></div>
                        </div>
                    <?}?>

                    <form action="" method="post">

                    <?while($data = mysqli_fetch_assoc($result)) {?>
                    <div class="row">
                        <div class="col w-2">
                            <input type="hidden" name="zone[]" value="<?=$data['id']?>">
                            <?=$data['name']?>
                        </div>
                        <div class="col">
                            <select name="level[]"><option>- Set Response Level -</option>
                            <?for ($i = 0; $i < count($level); $i++) {
                                echo '<option '.(in_array($data['id'], $zone[$i]) ? 'selected ' : '').'value="'.$level[$i].'">'.$pri[$i].' - '.$level[$i].'</option>';
                            }?> 
                            </select>
                        </div>
                    </div>
                    <?}?>

                    <input type="submit" name="action" class="btn green" style="margin-right:0.5em" value="Set Response Settings">
                    <input type="button" class="btn" onclick="window.location.href='../responseLevels'" value="Go Back">

                    </form>
                <?}?>
                </div>
            </div>
        </div>
    </div>
</main>

<?=javascriptConfig()?>
<?= js(array('jquery', 'main')) ?>

</body>
</html>