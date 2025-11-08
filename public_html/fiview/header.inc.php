<!DOCTYPE html>
<html>

<head>
    <title><?= $pageTitle ?></title>
    <?= css($cssArray) ?>
</head>
<body class="<?= explode('/', $_SERVER['REQUEST_URI'])[1] ?>">
    <header>
        <div class="container" style="height:100%">
            <div class="row align-items-center" style="height:100%">
                <div class="col w-4" style="flex-direction:row">
                    <i id="menu-icon" data-pos="0" class="fat fa-bars"></i>
                    <span id="now"><?=date('H:i:s')?></span>
                </div>
                <div class="col w-4 justify-content-right text-center">
                    <h1 class="suite-title"><?= $software_suite ?> <span style="font-weight:300">CAD (v<?=$software_build?>) &mdash; <?=$_COOKIE['shortname']?></span></h1>
                </div>
                <div class="col w-4 justify-content-right text-right">

                    <div class="row justify-content-right align-items-center">
                        <? if ($_SERVER['SCRIPT_NAME'] == '/cad/index.php') { ?>
                            <div class="menuItem"><i id="newIncident" class="fa-solid fa-plus" title="Add new incident"></i></div>
                            <div class="menuItem"><i id="changeUnitStatus" class="fa-regular fa-car" title="Change unit statuses"></i></div>
                            <div class="menuItem"><i id="logNote" class="fa-regular fa-notes" title="Log notes in the activity log"></i></div>
                            <div class="menuItem"><i id="mapping" class="fa-solid fa-map-marker-alt" title="Open mapping" onclick="window.open('<?=$baseurl?>/mapping')"></i></div>
                            <div class="menuItem"><i id="allTimers" class="fa-regular fa-alarm-clock" title="View current resource timers"></i></div>
                            <!--<div class="menuItem"><i id="notify" class="fa-regular fa-bell" title="View notifications"></i></div>-->
                        <? } ?>
                        <div style="display:flex;flex:0 1 auto;font-family:poppins;font-size:0.9em;padding-left:25px;line-height:0"><?=$_SESSION['first_name'].' '.substr($_SESSION['last_name'], 0, 1)?></div>
                        <div class="dropdown-menu">
                            <h6>Notifications</h6>
                            <div id="notifications">No notifications</div>
                        </div>
                        <div class="arrow-up"></div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <nav>
        <ul>
            <li><a target="blank" href="<?= $baseurl ?>/admin">Admin Settings</a></li>
            <li><a target="blank" href="incidents">Incidents</a></li>
            <li><a target="blank" href="resources">Resources</a></li>
            <li><a target="blank" href="response">Response Levels</a></li>
            <li><a target="blank" href="raws">RAWS Weather</a></li>
            <li><a target="blank" href="<?= $baseurl ?>/reports">Reports</a></li>
            <li><a target="blank" href="<?= $baseurl ?>/admin/settings/profile">My Settings</a></li>
            <li><a target="blank" href="<?= $baseurl ?>/logout">Logout</a></li>
        </ul>
    </nav>