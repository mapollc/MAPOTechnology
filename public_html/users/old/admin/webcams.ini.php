<?
if (isset($_POST['action'])) {
    if ($_POST['name'] == '' || $_POST['url'][0] == '' || $_POST['lat'] == '' || $_POST['lon'] == '') {
        echo message(false, 'You must complete all the fields to add a new webcam.');
    } else {
        $added = time();
        $name = mysqli_real_escape_string($con, $_POST['name']);
        $src = mysqli_real_escape_string($con, $_POST['network']);
        $urls = $_POST['url'];

        $json = json_decode(file_get_contents('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=%7B%22x%22%3A'.$_POST['lon'].'%2C%22y%22%3A'.$_POST['lat'].'%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelWithin&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=NAME&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=6&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson&token='));
        $county = mysqli_real_escape_string($con, str_replace(' County', '', $json->features[0]->properties->NAME));

        if ($function == 'add') {
            for ($i = 0; $i < count($urls); $i++) {
                $url = mysqli_real_escape_string($con, $_POST['url'][$i]);
                if ($url != '') {
                    mysqli_query($con, "INSERT INTO webcams (state,county,name,lat,lon,url,network,source,added) VALUES('$_POST[state]','$county','$name','$_POST[lat]','$_POST[lon]','$url','$src','2','$added')");
                }
            }

            header('Location: ../webcams?added=1');
        } else {
            $url = mysqli_real_escape_string($con, $_POST['url']);
            mysqli_query($con, "UPDATE webcams SET state = '$_POST[state]', county = '$county', name = '$name', lat = '$_POST[lat]', lon = '$_POST[lon]', url = '$url', network = '$src' WHERE id = '$_POST[id]'");

            echo message(true, 'You have successfully edited this webcam.');
        }
    }
}

if ($_GET['added'] == 1) {
    echo message(true, 'You successfully added a new webcam to the database.');
}

if ($user['permissions']['manage']['webcams'] != 1) {
    echo invalidPermissions();
} else {
?>
<div class="row">
    <div class="col">
        <div class="card">
            <?if(!$function){
                $sql = mysqli_query($con, "SELECT * FROM webcams WHERE source = 2 ORDER BY added DESC");
            ?>
            <a href="webcams/add" class="btn btn-green">Add New Webcam</a>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Name</th>
                            <th>Network</th>
                            <th>Added</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?while ($row = mysqli_fetch_assoc($sql)) {?>
                        <tr>
                            <td><?=$row['state']?></td>
                            <td><?=$row['name']?></td>
                            <td><?=$row['network']?></td>
                            <td><?=date('n/j/Y g:i A', $row['added'])?></td>
                            <td><a href="webcams/edit?id=<?=$row['id']?>">edit</a></td>
                        </tr>    
                    <?}?>
                    </tbody>
                </table>
            </div>

            <?}else{
                if ($function == 'edit') {
                    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM webcams WHERE id = '$_GET[id]'"));        
                }
            ?>
            <h2><?=ucfirst($function).' Webcam'.($function == 'edit' ? ' #'.$row['id'] : '')?></h2>

            <form action="" method="post">
                <?=($function == 'edit' ? '<input type="hidden" name="id" value="'.$row['id'].'">' : '')?>
                <input type="hidden" name="state" value="<?=$row['state']?>">

                <label>Camera Name</label>
                <input type="text" name="name" class="input" value="<?=$row['name']?>" placeholder="Name of webcam">

                <label>Image URL(s)</label>
                <?for ($i = 0; $i < ($function == 'edit' ? 1 : 4); $i++) {?>
                <input type="text" name="url<?=($function == 'edit' ? '' : '[]')?>" class="input" value="<?=$row['url']?>" placeholder="https://tripcheck.com/RoadCams/cams/Detroit1_pid622.jpg">
                <?}?>

                <label>Location</label>
                <input type="text" name="lat" class="input" style="display:inline-block;max-width:150px" maxlength="11" placeholder="45.32" value="<?=$row['lat']?>">,&nbsp;
                <input type="text" name="lon" class="input" style="display:inline-block;max-width:150px" maxlength="13" placeholder="-118.1" value="<?=$row['lon']?>">

                <label>State</label>
                <input type="text" id="state" class="input" style="width:75px" value="<?=$row['state']?>" placeholder="--" disabled>

                <label>Source</label>
                <input type="text" name="network" class="input" style="width:250px" value="<?=$row['network']?>" placeholder="ODOT">

                <div style="clear:both"></div>

                <div class="btn-group" style="margin-top:10px">
                    <input type="submit" name="action" class="btn btn-green" value="<?=ucfirst($function)?> Webcam">
                    <input type="button" class="btn btn-gray" onclick="window.location.href='../webcams'" value="Go Back">
                </div>
            </form>
            <?}?>
        </div>
    </div>
</div>
<?}?>