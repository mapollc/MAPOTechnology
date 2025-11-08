<?
include_once('../includes.inc.php');

$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);
?>
<!DOCTYPE html>
<html>

<head>
    <title>Log New Note</title>
    <?= css($cssArray) ?>
</head>
<body style="padding:10px;background-color:var(--dark);color:#fff">

<form id="activityLog" autocomplete="off">
    <div class="row form-title align-items-center">
        <div class="col w-4">Resource</div>
        <div class="col w-8">
            <input type="text" name="unit" id="searchUnit" data-log="1" placeholder="Unit" value="">
        </div>
    </div>
    <div class="row form-title align-items-center">
        <div class="col w-4">Note</div>
        <div class="col w-8">
            <textarea name="notes" style="min-height:150px" placeholder="Log a note..."></textarea>
        </div>
    </div>

    <div class="text-center" style="margin-top:3em">
        <input type="submit" class="btn" value="Save Note">
    </div>
</form>

<script>
    var unit = '<?= $_GET['u'] ?>',
        config = <?= json_encode($CADconfig) ?>,
        userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
    Object.freeze(userPerms);
</script>
<?= js(array('jquery', 'variables', 'main'))?>

</body>
</html>