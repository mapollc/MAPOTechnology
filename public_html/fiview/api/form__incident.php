<?
include_once('../includes.inc.php');

$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);
$id = $_GET['nid'];

if ($_GET['mode'] == 'new') {
    $title = 'Add New Incident';
} else {
    $title = 'Edit Incident';
}

$ctype = $CADconfig['settings']['coord_type'];
if (!$ctype || $ctype == 'dec') {
    $coordinates = '<input type="text" name="lat" style="width:45%" placeholder="45.32" value="'.$_GET['lat'].'"> , &nbsp; <input type="text" name="lon" style="width:45%" placeholder="-118.1" value="'.$_GET['lon'].'">';
} else if (!$ctype || $ctype == 'dms') {
    $coordinates = 'N <input type="text" name="latdeg" style="width:40px;margin-bottom:3px" placeholder="45" value=""> &deg; <input type="text" name="latmin" style="width:40px" placeholder="32" value=""> \' ' .
    '<input type="text" name="latsec" style="width:60px" placeholder="16.32" value="">"<br>W <input type="text" name="londeg" style="width:40px" placeholder="118" value=""> &deg; '.
    '<input type="text" name="lonmin" style="width:40px" placeholder="11" value=""> \' <input type="text" name="lonsec" style="width:60px" placeholder="1.1" value="">"';
}
?>
<!DOCTYPE html>
<html>

<head>
    <title><?= $title ?></title>
    <?= css($cssArray) ?>
</head>

<body style="padding:10px;background-color:var(--dark);color:#fff">

    <form id="addNewIncident" autocomplete="off">
        <input type="hidden" name="coord_type" value="<?=$ctype?>">
        <?if($ctype != 'dec'){?>
        <input type="hidden" name="lat" value="">    
        <input type="hidden" name="lon" value="">    
        <?}?>

        <div class="row form-title">
            <div class="col w-3">Incident #</div>
            <div class="col w-3">Incident Name</div>
            <div class="col w-3">Incident Type</div>
            <div class="col w-3">Start Date/Time</div>
        </div>

        <div class="row align-items-center">
            <div class="col w-3"><input type="text" name="year" style="width:55px" value="<?= date('Y') ?>" disabled> - <select name="juris" style="width:100px"></select> - <input type="number" name="num" style="width:55px" placeholder="000" step="1" min="0" value=""></div>
            <div class="col w-3"><input type="text" name="name" value=""></div>
            <div class="col w-3"><select name="type" style="width:225px"></select></div>
            <div class="col w-3"><input type="text" name="datetime" style="width:200px" placeholder="<?= date('n/j/Y H:i') ?>" value=""></div>
        </div>

        <div class="row form-title">
            <div class="col w-3">Intital Lat/Lon</div>
            <div class="col w-3">
                <div class="row">
                    <div class="col w-3">Township</div>
                    <div class="col w-3">Range</div>
                    <div class="col w-3">Section</div>
                    <div class="col w-3">SubSec</div>
                </div>
            </div>
            <div class="col w-3">Zone</div>
            <div class="col w-3">
                <div class="row">
                    <div class="col w-4">State</div>
                    <div class="col w-8">County</div>
                </div>
            </div>
        </div>

        <div class="row align-items-center">
            <div class="col w-3">
                <?=$coordinates?>
            </div>
            <div class="col w-3">
                <div class="row">
                    <div class="col w-3"><input type="text" name="t" style="width:80%" placeholder="0N" value=""></div>
                    <div class="col w-3"><input type="text" name="r" style="width:80%" placeholder="0E" value=""></div>
                    <div class="col w-3"><input type="text" name="s" style="width:80%" placeholder="0" value=""></div>
                    <div class="col w-3"><input type="text" name="ss" style="width:68px" placeholder="NWNW" value=""></div>
                </div>
            </div>
            <div class="col w-3"><select name="zone" style="width:225px">
                    <option></option>
                </select></div>
            <div class="col w-3">
                <div class="row">
                    <div class="col w-4"><select name="state"></select></div>
                    <div class="col w-8"><select name="county"></select></div>
                </div>
            </div>
        </div>

        <div class="row form-title">
            <div class="col w-3">Location</div>
            <div class="col w-3">
                <div class="row">
                    <div class="col w-6">Reported Size</div>
                    <div class="col w-6">Current Size</div>
                </div>
            </div>
            <div class="col w-6" id="fueltitle">Fuels</div>
        </div>

        <div class="row align-items-center">
            <div class="col w-3"><input type="text" name="location" style="width:100%" placeholder="Description..." value=""></div>
            <div class="col w-3">
                <div class="row">
                    <div class="col w-6"><input type="text" name="initial_acres" data-format="number" style="width:100px" placeholder="0" value=""></div>
                    <div class="col w-6"><input type="text" name="current_acres" data-format="number" style="width:100px" placeholder="0" value=""></div>
                </div>
            </div>
            <div class="col w-6" id="fuels"></div>
        </div>

        <div class="row form-title">
            <div class="col w-4">Reporting Party</div>
            <div class="col w-2">Call Taker</div>
            <div class="col w-2">Dispatcher</div>
            <div class="col w-2">Primary Unit</div>
            <div class="col w-2">Incident Status</div>
        </div>
        <div class="row">
            <div class="col w-4">
                <input type="text" name="rp" style="width:300px" placeholder="Reporting Party Name" value=""><br><input type="text" name="rp_phone[]" data-format="phone" style="margin-top:0.5em;width:130px" placeholder="(000) 000-0000" value=""> &nbsp;ext. <input type="text" name="rp_phone[]" style="margin-top:0.5em;width:50px" placeholder="0000" value="">
            </div>
            <div class="col w-2"><select name="calltaker" style="width:100%"></select></div>
            <div class="col w-2"><select name="dispatcher" style="width:100%"></select></div>
            <div class="col w-2"><select name="priUnit" style="width:100%">
                    <option></option>
                </select></div>
            <div class="col w-2"><select name="status" style="width:100%">
                    <option value="1">Open</option>
                    <option selected value="2">Pending</option>
                    <option value="3">Closed</option>
                    <option value="4">Voided</option>
                </select></div>
        </div>

        <div class="row" style="margin-top:1em">
            <div class="col w-12">
                <div class="tabs">
                    <div class="tab-nav">
                        <ul>
                            <li class="active" data-tab="tab1"><a href="#">Incident</a></li>
                            <li data-tab="tab2"><a href="#">IC</a></li>
                            <li data-tab="tab3"><a href="#">Fuels/Behavior</a></li>
                            <li data-tab="tab4"><a href="#">Incident Log</a></li>
                            <li data-tab="tab5"><a href="#">Resources</a></li>
                        </ul>
                    </div>
                    <div class="tab-content">
                        <div class="tc active" id="tab1">
                            <div class="row form-title">
                                <div class="col w-12">Description</div>
                            </div>
                                <div class="row align-items-center">
                                    <div class="col w-12"><textarea name="notes" placeholder="Initial report notes..."></textarea></div>
                                </div>
                            <div id="fiinc">
                                <div class="row form-title">
                                    <div class="col w-6">Wind Direction & Speed</div>
                                    <div class="col w-6">Aspect/Slope</div>
                                </div>
                                <div class="row align-items-center">
                                    <div class="col w-6"><select name="wind_dir" style="width:75px">
                                            <option></option>
                                        </select> &nbsp; <select name="wind_spd" style="width:60%">
                                            <option></option>
                                            <option value="<10">Light (<10 mph)</option>
                                            <option value="10-20">Moderate (10-20 mph)</option>
                                            <option value="20-30">High (20-30 mph)</option>
                                            <option value="30+">Extreme (30+ mph)</option>
                                        </select></div>
                                    <div class="col w-6"><select name="aspect" style="width:75px">
                                            <option></option>
                                        </select> &nbsp; <select name="slope" style="width:85px">
                                            <option></option>
                                            <option value="0-3">0-3 &deg;</option>
                                            <option value="3-7">3-7 &deg;</option>
                                            <option value="7-10">7-10 &deg;</option>
                                            <option value="10+">10+ &deg;</option>
                                        </select></div>
                                </div>
                                <div class="row form-title">
                                    <div class="col w-4">Fire Cause</div>
                                    <div class="col w-4">Cause (General)</div>
                                    <div class="col w-4">Cause (Specific)</div>
                                </div>
                                <div class="row align-items-center">
                                    <div class="col w-4"><select name="cause" style="width:90%">
                                            <option value="Unknown">Unknown</option>
                                            <option value="Human">Human</option>
                                            <option value="Natural">Natural</option>
                                        </select></div>
                                    <div class="col w-4"><select name="gen_cause" style="width:90%" disabled>
                                            <option>- General -</option>
                                        </select></div>
                                    <div class="col w-4"><select name="spec_cause" style="width:90%" disabled>
                                            <option>- Specific -</option>
                                        </select></div>
                                </div>
                                <div class="row form-title">
                                    <div class="col w-4">Control Date/Time</div>
                                    <div class="col w-4">Contain Date/Time</div>
                                    <div class="col w-4">Out Date/Time</div>
                                </div>
                                <div class="row align-items-center">
                                    <div class="col w-4"><input type="text" name="control_date" style="width:100px" placeholder="<?= date('m/d/Y') ?>" value=""> <input type="text" name="control_time" style="width:56px" placeholder="<?= date('H:i') ?>" value=""><br><a class="dtlk" href="#" onclick="setNow('control');return false">now</a></div>
                                    <div class="col w-4"><input type="text" name="contain_date" style="width:100px" placeholder="<?= date('m/d/Y') ?>" value=""> <input type="text" name="contain_time" style="width:56px" placeholder="<?= date('H:i') ?>" value=""><br><a class="dtlk" href="#" onclick="setNow('contain');return false">now</a></div>
                                    <div class="col w-4"><input type="text" name="out_date" style="width:100px" placeholder="<?= date('m/d/Y') ?>" value=""> <input type="text" name="out_time" style="width:56px" placeholder="<?= date('H:i') ?>" value=""><br><a class="dtlk" href="#" onclick="setNow('out');return false">now</a></div>
                                </div>
                            </div>
                        </div>
                        <div class="tc" id="tab2">
                            <div class="row form-title">
                                <div class="col w-4">Incident Commander</div>
                                <div class="col w-2">Trainee</div>
                                <div class="col w-6">Comments</div>
                            </div>
                            <div class="row align-items-center">
                                <div class="col w-4"><input type="text" name="ic" value="" style="width:100%"></div>
                                <div class="col w-2"><input type="radio" name="ict" value="1"> Yes <input type="radio" name="ict" value="0" checked> No</div>
                                <div class="col w-6"><input type="text" name="ic_notes" placeholder="Comments about IC" value="" style="width:100%"></div>
                            </div>
                        </div>
                        <div class="tc" id="tab3">
                            <div class="row form-title">
                                <div class="col w-2">Primary Fuel Model</div>
                                <div class="col w-2">Secondary Fuel Model</div>
                            </div>
                            <div class="row align-items-center">
                                <div class="col w-2"><select name="behavior1">
                                        <option></option>
                                    </select></div>
                                <div class="col w-2"><select name="behavior2">
                                        <option></option>
                                    </select></div>
                            </div>
                        </div>
                        <div class="tc" id="tab4">
                            <div id="incidentNotes"></div>
                        </div>
                        <div class="tc" id="tab5">
                            <div id="incidentResponse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row align-items-center" style="margin-top:2.5em">
            <div class="col w-12 text-center">
                <input type="submit" class="btn" value="Save Incident">
                <input type="button" id="cancelIncident" class="btn" value="Void Incident" style="max-width:122px;margin-left:1em">
            </div>
        </div>
    </form>

    <script>
        var mode = '<?= $_GET['mode'] ?>',
            nid = <?= $_GET['nid'] ?>,
            nin = '<?=$_GET['nin']?>',
            config = <?= json_encode($CADconfig) ?>,
            userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
        Object.freeze(userPerms);
    </script>
    <?= js(array('jquery', 'variables', 'main', 'incident')) ?>
</body>

</html>