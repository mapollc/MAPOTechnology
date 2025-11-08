<?
include_once('../includes.inc.php');

$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);
$unit = $_GET['u'];
?>
<!DOCTYPE html>
<html>

<head>
    <title>Change Resource Status: <?= $unit ?></title>
    <?= css($cssArray) ?>
</head>

<body style="padding:10px;background-color:var(--dark);color:#fff">

    <form id="resourceStatus" autocomplete="off">
        <div class="row form-title align-items-center">
            <div class="col w-4">Resource</div>
            <div class="col w-8"><input type="text" name="unit" id="searchUnit" placeholder="Unit" value=""><!--<select name="unit"><option></option></select>--></div>
        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Incident Assignment</div>
            <div class="col w-8"><label class="checkbox" for="ia1"><input type="radio" id="ia1" name="ia" value="1"> Yes</label>
                <label class="checkbox" for="ia2"><input type="radio" id="ia2" name="ia" value="0"> No</label>
            </div>
        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Status</div>
            <div class="col w-8"><select name="status">
                    <option></option>
                    <option value="ava">Available</option>
                    <option value="asgn">Assigned</option>
                    <option value="com">Committed</option>
                    <option value="enr">Enroute</option>
                    <option value="ins">In-Service</option>
                    <option value="lea">Leaving Scene</option>
                    <option value="not">Notified</option>
                    <option value="ons">On Scene</option>
                    <option value="ous">Out-of-Service</option>
                </select>
            </div>
        </div>
        <div id="asgntoinc" class="row form-title align-items-center" style="display:none">
            <div class="col w-4">Assign to Incident</div>
            <div class="col w-8"><select name="inc">
                    <option></option>
                </select></div>
        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Timer</div>
            <div class="col w-8"><select name="timer">
                    <option value="0">None</option>
                    <option value="600">10 minutes</option>
                    <option value="900">15 minutes</option>
                    <option value="1800">30 minutes</option>
                    <option value="3600">1 hour</option>
                    <option value="7200">2 hours</option>
                    <option value="14400">4 hours</option>
                </select>
            </div>
        </div>
        <div class="row form-title align-items-center">
            <div class="col w-4">Location</div>
            <div class="col w-8"><textarea name="location" style="height:60px;resize:none"></textarea></div>
        </div>
        <div class="row form-title align-items-center" style="margin-top:4em">
            <div class="col w-4">Last Comm</div>
            <div class="col w-8" style="padding-left:0.8em"><span id="lastcomm" style="font-size:1.3em;color:#fff;font-weight:400">N/A</span></div>
        </div>
        <div class="text-center" style="margin-top:3em"><input type="submit" class="btn" value="Save Status"></div>
    </form>

    <script>
        var unit = '<?= $_GET['u'] ?>',
            config = <?= json_encode($CADconfig) ?>,
            userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
        Object.freeze(userPerms);
    </script>
    <?= js(array('jquery', 'variables', 'main', 'resstatus')) ?>
</body>

</html>