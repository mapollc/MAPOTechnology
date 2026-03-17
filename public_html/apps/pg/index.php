<?
require_once 'config.ini.php';
$page = null;
$title = '';

switch ($pgen->page()) {
    case '':
        $page = 'home';
        $title = $page;
        break;
    case 'settings':
        $page = 'settings';
        $title = 'Configure Organization';
        break;
    case 'manage':
        $page = 'manage';
        $title = 'Manage Products';
        break;
    case 'products':
        $page = 'products';
        $title = 'View Issued Products';
        break;
    case 'issue':
        $page = 'issue';
        $title = ($pgen->id() == 'update' ? 'Update' : 'Issue') . ' Product';
        break;
    default:
        $title = 'Page Not Found';
}

echo '<!--org: ' . $pgen->org() . ' / page: ' . $pgen->page() . ' / method: ' . $pgen->method() . ' / id: ' . $pgen->id() . '-->';
?>
<!DOCTYPE html>
<html>

<head>
    <title><?= ucwords($title) . " - {$thisApp->name()} ({$pgen->getOrg()->name()})" ?></title>
    <!--<link rel="stylesheet" href="<?= "$domain/src/pg/css/main.css" ?>">-->
    <link rel="stylesheet" href="<?= "$domain/pg/main.css" ?>">
    <? if ($page == 'issue') {
        echo "<link rel=\"stylesheet\" href=\"//unpkg.com/maplibre-gl@$maplibreVersion/dist/maplibre-gl.css\"></script>";
        echo "<link rel=\"stylesheet\" href=\"//unpkg.com/@mapbox/mapbox-gl-draw@1.5.1/dist/mapbox-gl-draw.css\">";
    } ?>
</head>

<body>
    <nav class="sidebar">
        <img class="logo" title="logo" src="<?= str_replace('apps.', '', $domain) ?>/assets/images/polygen_logo_transparent.png">

        <ul>
            <li><a href="<?= $baseURL ?>issue">Issue Product</a></li>
            <li><a href="<?= $baseURL ?>products/active">Active Products</a></li>
            <li><a href="<?= $baseURL ?>manage/products">Manage Product Types</a></li>
            <li><a href="<?= $baseURL ?>settings">Configuration</a></li>
        </ul>
    </nav>

    <main>
        <div class="topbar">
            <span style="font-weight:bold"><?= $pgen->getOrg()->name() ?></span>
            <span id="curtime" style="margin-right:1rem"><?= date('H:i:s T') ?></span>
            <span style="color:#545454">Hello, <?= $_SESSION['first_name'] ?></span>
        </div>

        <? include_once "$page.inc.php" ?>
    </main>

    <script>
        window.timezone = '<?= $pgen->getOrg()->timezone() ?>';
    </script>
    <? if ($page == 'issue') {
        echo "<script src=\"//unpkg.com/maplibre-gl@$maplibreVersion/dist/maplibre-gl.js\"></script>";
        echo "<script src=\"//mapofire.com/v2.6.1/arcgis.js\"></script>";
        echo "<script src=\"//unpkg.com/@mapbox/mapbox-gl-draw@1.5.1/dist/mapbox-gl-draw.js\"></script>";
    } ?>
    <!--<script src="<?= "$domain/pg/main.js" ?>"></script>-->
    <script src="<?= "$domain/pg/main.js" ?>"></script>
</body>

</html>
<? if ($pgen->con2) mysqli_close($pgen->con2); if ($con) mysqli_close($con); ?>