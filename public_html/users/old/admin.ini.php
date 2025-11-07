<?
if(!isset($_GET['method'])) {
    $links = array('people','dispatch','wildfires','trails','log');
    $title = array('Manage Users','Manage Dispatch Centers','Manage Wildfires','Manage Trails','View Activity Logs');
    $desc = array('Add or remove users and manage users\' settings and permissions');
    ?>
    <div class="row">
        <div class="col">
            <div class="card">
                <ul style="margin-left:20px">
                    <?for ($i = 0; $i < count($links); $i++) {
                        echo '<li><a href="./admin/'.$links[$i].'">'.$title[$i].'</a> &mdash; '.$desc[$i].'</li>';
                    }?>
                </ul>
            </div>
        </div>
    </div>
<?}else{
    $adminFile = './admin/'.$_GET['method'].'.ini.php';
    
    if (file_exists($adminFile)) {
        include_once($adminFile);
    } else {
        echo '<div style="padding:200px 0;text-align:center"><h1 style="font-size:50px">Page Not Found</h1><h3 style="padding:50px 0;font-weight:400">The link your clicked or URL you entered was not found. Try a different page.</h3>'.
            '<a class="btn btn-lg" href="#" onclick="history.go(-1);return false">Go Back</a></div>';
    }
}?>