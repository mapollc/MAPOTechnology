<?
include_once('../includes.inc.php');

$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);
$json = json_decode($_GET['d']);

$timers = array(0 => "None", 600 => "10 minutes", 900 => "15 minutes", 1800 => "30 minutes", 3600 => "1 hour", 7200 => "2 hours", 14400 => "4 hours");
?>
<!DOCTYPE html>
<html>

<head>
    <title><?=($_GET['p'] == 2 ? 'All Timers' : 'Timer: '.$json->unit)?></title>
    <?= css($cssArray) ?>
</head>

<body style="background-color:var(--dark);color:#fff">

    <?if ($_GET['p'] == 2) {?>
        <div class="allTimers">
            <div class="row" style="text-decoration:underline;font-weight:bold;font-size:0.85em;margin-bottom:0.25em"><div class="col w-3">Unit</div><div class="col w-4">Last Comm</div><div class="col">Timer Duration</div></div>
            <div id="timerWrapper"></div>
        </div>
    <?}else{?>
    <div style="width:100%;padding:5px 10px;font-family:poppins" class="flash">Check Status: <?=strtoupper($json->unit)?></div>
    <form id="statusCheck" style="padding:10px"><input type="hidden" name="unit" value="<?=$json->unit?>">
        <div class="row form-title align-items-center">
            <div class="col w-4">Status</div>
            <div class="col w-8"><span class="status <?= $json->status ?>" style="display:inline-block;font-size:1.3em;color:#fff;font-weight:400;padding: 1px 8px"><?= $resource_status[$json->status] ?></span></div>

        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Resource</div>
            <div class="col w-8"><input type="text" value="<?= $json->unit ?>" disabled></div>

        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Location</div>
            <div class="col w-8"><input type="text" value="<?= $json->location ?>" disabled></div>

        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Timer</div>
            <div class="col w-8" style="font-size:1.3em;color:#fff;font-weight:400"><select name="timer">
            <?foreach($timers as $k => $v) {
                echo '<option '.($k == $json->timer ? 'selected ': '').'value="'.$k.'">'.$v.'</option>';
            }?>
            </select></div>

        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Last Comm</div>
            <div class="col w-8" id="timerLastComm" style="font-size:1.3em;color:#fff;font-weight:400" data-time="<?= $json->started ?>">--</div>

        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Overdue</div>
            <div class="col w-8" id="timerOverdue" style="font-size:1.3em;color:#fff;font-weight:400" data-time="<?= $json->started ?>">--</div>

        </div>
        <div class="text-center" style="margin-top:3em"><input type="button" id="timerReset" class="green" style="margin-right:1em" value="Reset Timer">
        <input type="button" id="timerClear" value="Clear Timer">
    </form>
    </div>
    <?}?>

    <script>
        var p = <?= $_GET['p'] ?>,
            <?if($_GET['p'] != 2){?>
            due = <?=$json->due?>,
            timer = <?=$json->timer?>,
            <?}?>
            config = <?= json_encode($CADconfig) ?>,
            userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
        Object.freeze(userPerms);
    </script>
    <?= js(array('jquery', 'variables', 'main', 'timer')) ?>

</body>
</html>