<?
include_once('../includes.inc.php');

$pageTitle = $software_name . ' - Admin Settings';
$cssArray = array('fonts', 'fa', 'main', 'admin');

include_once('../header.inc.php');
?>

<main class="page">
    <div class="container">
        <div class="row">
            <div class="col w-12">
                <div class="card">
                    <h1>Admin Settings</h1>

                    <div class="row admin-options">
                        <? if (in_array('editUsers', $userPermissions) || in_array('addUsers', $userPermissions)) { ?><div class="col w-3"><a class="box-link" href="admin/settings/dispatchers">Manage Dispatchers</a></div><? } ?>
                        <? if (in_array('editResources', $userPermissions) || in_array('addResources', $userPermissions)) { ?><div class="col w-3"><a class="box-link" href="admin/settings/resources">Manage Resources</a></div><? } ?>
                        <? if (in_array('cad', $userPermissions)) { ?><div class="col w-3"><a class="box-link" href="admin/settings/cad">CAD Settings</a></div><? } ?>
                        <div class="col w-3"><a class="box-link" href="admin/settings/notifications">Text/Email Notifications</a></div>
                        <div class="col w-3"><a class="box-link" href="admin/settings/resourceTypes">Edit Resource Types</a></div>
                        <div class="col w-3"><a class="box-link" href="admin/settings/defaults/incidents">Edit Incident Types</a></div>
                        <div class="col w-3"><a class="box-link" href="admin/settings/defaults/zones">Edit Agency Zones</a></div>
                        <div class="col w-3"><a class="box-link" href="admin/settings/defaults/units">Edit Agency Units</a></div>
                        <div class="col w-3"><a class="box-link" href="admin/settings/defaults/jurisdictions">Edit Agency Jurisdictions</a></div>
                        <div class="col w-3"><a class="box-link" href="admin/settings/responseLevels">Edit Response Levels</a></div>
                    </div>


                </div>
            </div>
        </div>
    </div>
</main>

<?=javascriptConfig()?>
<?=js(array('jquery','variables','main'))?>
</body>
</html>