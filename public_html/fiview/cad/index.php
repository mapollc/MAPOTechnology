<?
include_once('../includes.inc.php');

$pageTitle = $software_name . ' - Dispatcher: ' . $_SESSION['last_name'] . ', ' . $_SESSION['first_name'];
$cssArray = array('fonts', 'fa', 'main', 'dispatch'/*,'jquery'*/);

include_once('../header.inc.php');
?>

<main>
    <div class="container" id="cad-container" style="height:100%">
        <div class="row justify-space-between" style="height:100%">
            <div class="col w-8">

                <!-- Incidents -->
                <div class="header-title">
                    <span><i class="fa-regular fa-fire"></i> Incidents</span>
                    <div class="filter">
                        <i class="fa-regular fa-filter"></i>
                        <input type="text" id="searchIncidents" style="max-width:130px" placeholder="Search...">
                        <select id="filter-incidents" data-default="<?=($prefs['default_dispatch_incs'] ? $prefs['default_dispatch_incs'] : 'all')?>">
                            <option value="all">All Zones</option>
                        </select>
                    </div>
                </div>
                <div class="incidents"></div>

                <!-- Activity Log -->
                <div class="header-title" style="margin-top:1em">
                    <span><i class="fa-solid fa-note-sticky"></i> Activity Log</span>
                    <div class="filter">
                        <i id="viewLog" class="fa-regular fa-folder-arrow-up" title="View detailed log" onclick="window.open('log')"></i>
                        <i class="fa-regular fa-filter"></i>
                        <select id="filter-log" data-default="<?=($prefs['filter-log'] ? $prefs['filter-log'] : '1')?>">
                            <option value="all">All</option>
                            <option value="1">Today</option>
                            <option value="2">Yesterday</option>
                            <option value="3">This Week</option>
                        </select>
                    </div>
                </div>
                <div class="log"></div>

            </div>
            <div class="col w-4">

                <!-- Resources -->
                <div class="header-title">
                    <span><i class="fa-regular fa-truck-medical"></i> Resources</span>
                    <div class="filter"><i class="fa-regular fa-filter"></i>
                        <input type="text" id="searchResources" placeholder="Search...">
                        <select id="filter-resources" data-default="<?=($prefs['default_dispatch_units'] ? $prefs['default_dispatch_units'] : 'all')?>">
                            <option value="all">All Zones</option>
                        </select> <select id="filter-status">
                            <option value="all">All Statuses</option>
                            <option value="ava">Available</option>
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
                <div class="resources"></div>

            </div>
        </div>
    </div>
</main>

<div class="loading">Loading...</div>
<div id="message">
    <div class="text"></div>
    <div id="closeMessage"><i class="fa-solid fa-times"></i></div>
</div>
<div class="select-list"></div>
<ul class="incContext"></div>

<div class="shadow"></div>
<div id="modal">
    <div class="modal-header">
        <span>{header}</span>
        <div class="controls"><i id="closeModal" class="fa-solid fa-times"></i></div>
    </div>
    <div class="content"></div>
</div>
<div id="modal2">
    <div class="modal-header">
        <span>{header}</span>
        <div class="controls"><i id="closeModal" data-m="2" class="fa-solid fa-times"></i></div>
    </div>
    <div class="content"></div>
</div>

<audio id="notificationSound" style="visibility:hidden">
    <source src="<?= $baseurl ?>/assets/timer-notification.mp3" type="audio/mpeg">
</audio>

<form id="activityLog" autocomplete="off" style="display:none">
    <div class="row form-title align-items-center">
        <div class="col w-4">Resource</div>
        <div class="col w-8"><input type="text" name="unit" id="searchUnit" data-log="1" placeholder="Unit" value=""><!--<select name="unit"><option></option></select>--></div>
    </div>
    <div class="row form-title align-items-center">
        <div class="col w-4">Note</div>
        <div class="col w-8"><textarea name="notes" style="min-height:150px" placeholder="Log a note..."></textarea></div>
    </div>
    <div class="text-center" style="margin-top:3em"><input type="submit" class="btn" value="Save Note"></div>
</form>

<script>
    var config = <?= json_encode($CADconfig) ?>,
        userPerms = <?= json_encode(unserialize($_SESSION['permissions'])) ?>;
    Object.freeze(userPerms);
</script>
<?= js(array('jquery',/*'jqui',*/ 'variables', 'main', 'dispatch')) ?>

</body>

</html>