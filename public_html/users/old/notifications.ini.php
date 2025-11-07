<?
$pageTitle = 'Notifications';
$dow = ['Every day','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

if (isset($_POST['action']) && $_POST['action'] == 'Save Preferences') {
    $time = time();
    $active = ($_POST['activated'] == 1 ? 1 : 0);

    $pref = mysqli_real_escape_string($con, serialize(array('dow' => $_POST['dow'], 'start' => $_POST['start'], 'end' => $_POST['end'])));
    mysqli_query($con, "INSERT INTO notifications (uid,settings,active,time) VALUES('$_SESSION[uid]','$pref','$active','$time')
    ON DUPLICATE KEY UPDATE uid = VALUES(uid), settings = '$pref', active = '$active', time = '$time'");
}

$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings, active, time FROM notifications WHERE uid = '$_SESSION[uid]'"));
$pref = unserialize($row['settings']);

function times($v = null) {
    $times = '';
    for ($i = 0; $i < 24; $i++) {
        $times .= '<option '.($v != null ? ($v == $i && $v != 'null' ? 'selected ' : ''): '').'value="'.$i.'">'.($i == 0 ? '12' : ($i > 12 ? $i - 12 : $i)).($i >= 12 ? ' P' : ' A').'M</option>';
    }
    return $times;
}
?>
<div class="row">
    <div class="col w-12">
        <div class="card">
            <span class="help">Get notifications about new wildland fire incidents that start near you.</span>

            <form action="" method="post">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" name="activated" id="turnOnNot" value="1"<?=($row['active'] == 1 ? ' checked' : '')?>>
                    <label class="form-check-label" for="turnOnNot">Receive notifications</label>
                </div>

                <div id="notificationSettings" style="<?=($row['active'] == 0 ? 'display:none;' : '')?>margin-top:25px">
                    <h3 class="category">Schedule</h3>

                    <?for($i = 0; $i < 8; $i++) {?>
                    <div style="display:flex;flex-direction:row;align-items:center;gap:0 15px;margin:10px 0">
                        <div class="checkbox" style="display:block;flex:0 0 250px">
                            <input type="checkbox" name="dow[]" id="dow<?=$i?>" data-id="sc<?=$i?>"value="<?=$i?>"<?=(in_array($i, $pref['dow']) ? ' checked' : '')?>>
                            <label for="dow<?=$i?>"><?=$dow[$i]?></label>
                        </div>
                        <div id="sc<?=$i?>" style="visibility:<?=(in_array($i, $pref['dow']) && $pref['start'][$i] != 'null' ? 'visible' : 'hidden')?>;flex:1 1 auto">
                            <select class="input" style="display:inline-block;max-width:150px;margin:0" name="start[]"><option value="null">-- Start --</option><?=times($pref['start'][$i])?></select>
                            <select class="input" style="display:inline-block;max-width:150px;margin:0" name="end[]"><option value="null">-- End --</option><?=times($pref['end'][$i])?></select>
                        </div>
                    </div>
                    <?}?>

                </div>
                
                <div style="clear:both;margin-top:10px"></div>
                <span class="help" style="font-style:italic;color:#aaa">Your notifications settings were last updated <?=ago($row['time'])?>.</span>
                <input type="submit" class="btn btn-green" name="action" value="Save Preferences">
                <input type="reset" class="btn" value="Reset">
            </form>
        </div>
    </div>
</div>