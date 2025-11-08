<?
if (!isset($_GET['method'])) {
    $links = array('people','dispatch','wildfires','reports','trails','log','avalanches');
    $title = array('Manage Users','Manage Dispatch Centers','Manage Wildfires','View Crowdsource Reports','Manage Trails','View Activity Logs','Avalanche Accidents');
    $desc = array('Add or remove users and manage users\' settings and permissions',
            'Add, edit, and manage dispatch centers that pull data into Map of Fire',
            'Add, edit, view, hide, and manage duplicate wildfires for Map of Fire',
            'View user-submitted wildfire reports from Map of Fire',
            'Add, edit, and manage trail guides for Map of Trails',
            'View system and user activity logs for MAPO',
            'View avalanche incidents/accidents reported from the NAC'
        );
    ?>
    <div class="row">
        <div class="col">
            <div class="card">
                <h1>Administrative Actions</h1>

                <ul>
                    <?for ($i = 0; $i < count($links); $i++) {
                        echo '<li><a href="./admin/'.$links[$i].'">'.$title[$i].'</a> &mdash; '.$desc[$i].'</li>';
                    }?>
                </ul>
            </div>
        </div>
    </div>
<?} else {
    $adminFile = $documentRoot.'admin/'.$_GET['method'].'.ini.php';

    if (file_exists($adminFile)) {
        include_once $adminFile;
    } else {
        echo pageNotFound();
    }
}?>