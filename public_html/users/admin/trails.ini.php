<?
$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
$activities = array('ATV', 'Alpine Ski', 'Backcountry Ski', 'Beginner', 'Big Ride', 'Big Ski', 'Climb', 'Dirtbike', 'Fantasy', 'Gravel Bike', 'Hike', 'Mountain Bike', 'Nordic Ski', 'Private', 'Race', 'Road Bike', 'Snowmobile', 'Summit');
$icons = array('4x4' => '4x4', 'big_air' => 'Big Air', 'bigfoot' => 'Bigfoot', 'bridge' => 'Bridge', 'cabin' => 'Cabin', 'camp' => 'Campground', 'caution' => 'Caution', 'fishing' => 'Fishing', 'hike' => 'Hike', 'info' => 'Info', 'lake' => 'Lake', 'media' => 'Media', 'mtn_bike' => 'Mountain Bike', 'parking' => 'Parking', 'redneck' => 'Redneck', 'restroom' => 'Restroom', 'river' => 'River', 'sledding' => 'Sledding', 'summit' => 'Summit', 'swim' => 'Swimming');
$gpxOptions = ['ATV Track', 'Gravel', 'Road', 'Single Track', 'Ski Line', 'Snowmobile', 'Tour'];
$token = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';

function updateTileset() {
    global $token;
    $ch = curl_init();

    $params = array(
        'tileset' => 'mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs',
        'url' => 'mapbox://datasets/mapollc/clnnlg3w728a02nmv0ffz57jf',
        'name' => 'mapotrails'
    );

    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/uploads/v1/mapollc?access_token='.$token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));

    $headers[] = 'Content-Type: application/json';
    $headers[] = 'Cache-Control: no-cache';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $output = curl_error($ch);
    } else {
        $output = $result;
    }
    curl_close($ch);

    return json_decode($output);
}

function guideUrl($s, $ty, $id) {
    $words = array('and', 'at');
    $s = str_replace(' ', '-', str_replace('  ', ' ', preg_replace('/([^A-Za-z0-9\s]+)/', '', strtolower($s))));

    foreach ($words as $r) {
        $s = str_replace($r.'-', '', $s); 
    }

    return rtrim(rtrim('guide/' . ($ty ? $ty . '/' : '') . $id . '/' . $s, '-'), ' ');
}

if ($function == 'create' || $function == 'edit') {
    include_once $documentRoot . 'admin/incs/add_edit-trail.ini.php';
} else {
    // update mapbox vector tiles on user request
    if ($function == 'mapbox') {
        $update = updateTileset();
        ////$uploadID = $update->id;
    
        if ($update->error == null) {
            echo message(true, 'A request for Mapbox to update trail data was submitted successfully.');
        } else {
            echo message(false, 'There was an error publishing trail data to Mapbox. Try again later.');
        }
    }

    $where = isset($_GET['q']) && $_GET['q'] != '' ? 'WHERE title LIKE \'%'.$_GET['q'].'%\' OR caption LIKE \'%'.$_GET['q'].'%\'' : '';
    $order = isset($_GET['sort']) ? $_GET['sort'].' '.$_GET['order'] : 'updated DESC';

    $sql = mysqli_query($con2, "SELECT t.id, type, caption, title, author, premium, public, created, updated FROM trails AS t LEFT JOIN gpx AS g ON g.trail_id = t.id $where ORDER BY $order");   

    if ($_GET['deleted'] == 1) {
        echo message(true, 'You have successfully deleted that trail/snow guide.');
    }
    ?>
    <div class="row">
        <div class="col">
            <div class="card">
                <h1>Trails Management</h1>

                <div class="controls">
                    <form action="" method="get">
                        <input type="text" class="input" style="display:inline-block;max-width:300px" name="q" placeholder="Search trails..." value="<?= ($_GET['q'] ? $_GET['q'] : '') ?>">
                        <input type="submit" class="btn btn-blue" value="Search">
                        <a href="trails/create" class="btn btn-green">Create New Trail</a>
                        <!--<a href="trails/systems" class="btn btn-yellow">Manage Trail Systems</a>-->
                        <a href="trails/mapbox" class="btn btn-light-blue">Publish to Mapbox</a>
                    </form>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead class="sortable">
                            <tr>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=id&order=<?=$_GET['order'] == 'ASC' ? 'DESC' : 'ASC'?>'"h>ID</th>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=type&order=<?=$_GET['order'] == 'ASC' ? 'DESC' : 'ASC'?>'">Type</th>
                                <th style="width:200px" onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=title&order=<?=$_GET['order'] == 'ASC' ? 'DESC' : 'ASC'?>'">Title</th>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=public&order=<?=$_GET['order'] == 'ASC' ? 'DESC' : 'ASC'?>'">Public</th>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=premium&order=<?=$_GET['order'] == 'ASC' ? 'DESC' : 'ASC'?>'">Premium</th>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=author&order=<?=$_GET['order'] == 'ASC' ? 'DESC' : 'ASC'?>'">Author</th>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=updated&order=<?=$_GET['order'] == 'DESC' ? 'ASC' : 'DESC'?>'">Last Update</th>
                                <th onclick="window.location.href='?<?=isset($_GET['q']) ? 'q='.$_GET['q'].'&' : ''?>sort=created&order=<?=$_GET['order'] == 'DESC' ? 'ASC' : 'DESC'?>'">Created</th>
                                <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?
                        $ids = array();
                        while($row = mysqli_fetch_assoc($sql)) {
                            if (!in_array($row['id'], $ids)) {
                                $ids[] = $row['id'];
                            ?>
                            <tr>
                                <td><?=$row['id']?></td>
                                <td><?=ucfirst($row['type'])?></td>
                                <td style="min-width:300px"><?=$row['title']?></td>
                                <td><?=$row['public'] ? 'Yes' : 'No'?></td>
                                <td><?=$row['premium'] ? 'Yes' : 'No'?></td>
                                <td><?=$row['author']?></td>
                                <td><?=ago($row['updated'])?></td>
                                <td><?=date('M j, Y', $row['created'])?></td>
                                <td><a target="blank" href="//mapotrails.com/<?=guideUrl($row['title'], $row['type'], $row['id'])?>">view</a> &middot; <a href="trails/edit?id=<?=$row['id']?>">edit</a></td>
                            </tr>
                        <?}}?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
<?}?>