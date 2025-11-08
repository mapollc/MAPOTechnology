<?
include_once('../includes.inc.php');

$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT id, zone, CONCAT(juris, '-', num) AS num, name FROM $db.incidents WHERE aid LIKE '$_COOKIE[agency]' AND id = '$_GET[id]'"));

$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);
?>
<!DOCTYPE html>
<html>

<head>
    <title>Assign Resources: <?=$row['num']?> (<?=$row['name']?>)</title>
    <?= css($cssArray) ?>
</head>

<body style="padding:10px;background-color:var(--dark);color:#fff">

    <form id="assignMultiple">
        <input type="hidden" name="id" value="<?= $_GET['id'] ?>">

        <div class="row" style="font-size:0.9em;color:#ccc;font-weight:bold;margin-bottom:0.5em">
            <div class="col w-3">Unit</div>
            <div class="col w-2">Type</div>
            <div class="col w-3">Zone</div>
            <div class="col w-3">Status</div>
            <div class="col w-1">Assign</div>
        </div>

    </form>

    <script>
        var i = <?= $_GET['id'] ?>,
            z = '<?= $row['zone'] ?>',
            num = '<?= $row['num'] ?>',
            name = '<?= $row['name'] ?>',
            config = <?= json_encode($CADconfig) ?>,
            userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
        Object.freeze(userPerms);
    </script>
    <?= js(array('jquery', 'variables', 'main', 'assign')) ?>

</body>
</html>