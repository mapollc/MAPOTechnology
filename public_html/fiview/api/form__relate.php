<?
include_once('../includes.inc.php');

$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT CONCAT(juris, '-', num) AS num, name FROM $db.incidents WHERE aid LIKE '$_COOKIE[agency]' AND id = '$_GET[id]'"));

$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);
?>
<!DOCTYPE html>
<html>

<head>
    <title>Relate Incident: <?=$row['num']?> (<?=$row['name']?>)</title>
    <?= css($cssArray) ?>
</head>

<body style="padding:10px;background-color:var(--dark);color:#fff">

<h2>Relate this incident to:</h2>

<form id="relateIncident">
    <input type="hidden" name="inc1" value="<?=$_GET['id']?>">

    <div class="row form-title">
        <div class="col w-6">Relate Incident</div>
        <div class="col w-3">Close Incident</div>
        <div class="col w-3">Reassign Resources</div>
    </div>

    <div class="row align-items-center" style="margin-bottom:25px">
        <div class="col w-6">
            <select id="incs" name="inc2" style="width:250px"><option>- Choose Incident -</option></select>
        </div>
        <div class="col w-3">
            <input type="radio" name="close" value="1" checked> Yes
            <input type="radio" name="close" value="0"> No
        </div>
        <div class="col w-3">
            <input type="radio" name="reassign" value="1" checked> Yes
            <input type="radio" name="reassign" value="0"> No
        </div>
    </div>

    <input type="submit" class="btn green" value="Relate Incident">
</form>

<script>
        var num = '<?= $row['num'] ?>',
            config = <?= json_encode($CADconfig) ?>,
            userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
        Object.freeze(userPerms);
    </script>
    <?= js(array('jquery', 'variables', 'main', 'relate')) ?>
</body>
</html>