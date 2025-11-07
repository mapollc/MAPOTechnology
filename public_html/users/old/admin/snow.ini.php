<?
if ($user['permissions']['manage']['snow_dashboards'] != 1) {
    echo invalidPermissions();
} else {
$includeLeaflet = true;
$includeLeafletPM = true;

if (!$function) {
    $result = mysqli_query($con, "SELECT id, state, name, dashboard FROM snow_dashboards ORDER BY state ASC, name ASC");
} else {
    if (isset($_POST['action']) && $_POST['action'] == 'Save Settings') {
        $state = $_POST['state'];
        $longstate = ucwords(str_replace('-', ' ', $state));
        $name = mysqli_real_escape_string($con, $_POST['name']);
        $dashboard = mysqli_real_escape_string($con, $_POST['dashboard']);
        $set = serialize(array('lat' => $_POST['lat'], 'lng' => $_POST['lon'], 'z' => $_POST['z'], 'long_state' => $longstate, 'wfo' => $_POST['wfo'], 'geo' => json_decode($_POST['geo'])));

        if ($function == 'add') {
            mysqli_query($con, "INSERT INTO snow_dashboards (state,name,dashboard,settings,active) VALUES('$state','$name','$dashboard','$set','$_POST[active]')");
            $id = mysqli_insert_id($con);

            header('Location: ../snow/edit?id='.$id.'&added=1');
        } else if ($function == 'edit') {
            mysqli_query($con, "UPDATE snow_dashboards SET state = '$state', name = '$name', dashboard = '$dashboard', settings = '$set', active = '$_POST[active]' WHERE id = $_POST[id]");

            echo message(true, 'You successfully modified this dashboard.');
        }

        /*$file = fopen('./admin/storage/'.$state.'_'.$dashboard.'.json', 'w');
        fwrite($file, $_POST['geo']);
        fclose($file);*/
    }
}

if ($_GET['added'] == 1) {
    echo message(true, 'You have successfully created a new snow dashboard.');
}

$arr = array("lat" => 45.520179, "lng" => -118.422458, "z" => 7.6);
//echo serialize($arr);
?>
<link href="https://unpkg.com/leaflet.pm@2.2.0/dist/leaflet.pm.css" rel="stylesheet">

<div class="row">
    <div class="col">
        <div class="card">
            <?if ($function == 'edit' || $function == 'add') {
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM snow_dashboards WHERE id = '$_GET[id]'")); 
            $settings = unserialize($row['settings']);  
            ?>
            <h2><?=($function == 'add' ? 'Add New Dashboard' : 'Edit Dashboard: '.$row['name'])?></h2>

            <form action="" method="post">
                <?if($function == 'edit') {?>
                <input type="hidden" name="id" value="<?=$_GET['id']?>">
                <?}?>
                <input type="hidden" name="lat" value="<?=$settings['lat']?>">
                <input type="hidden" name="lon" value="<?=$settings['lng']?>">
                <input type="hidden" name="z" value="<?=$settings['z']?>">
                <input type="hidden" name="dashboard" value="<?=$row['dashboard']?>">

                <?if($function == 'edit'){?>
                <a target="blank" href="../../../maposnow/dashboard/<?=$row['state'].'/'.$row['dashboard']?>">View Dashboard</a>    
                <?}?>

                <div class="row" style="margin-top:10px">
                    <div class="col w-6">
                        <label>State</label>
                        <select name="state" class="input">
                        <option></option>
                        <?foreach($statesArray as $v) {
                            echo '<option '.($row['state'] == str_replace(' ', '-', strtolower($v)) ? 'selected ' : '').'value="'.str_replace(' ', '-', strtolower($v)).'">'.ucwords(strtolower($v)).'</option>';
                        }?>
                        </select>

                        <label>Name</label>
                        <input type="text" class="input" name="name" value="<?=$row['name']?>">

                        <label>Dashboard URL</label>
                        <input type="text" class="input" name="url" disabled value="<?=$row['dashboard']?>">

                        <label>NWS WFO</label>
                        <input type="text" class="input" name="wfo" maxlength="3" value="<?=$settings['wfo']?>">

                        <label>Active</label>
                        <div class="radio">
                            <input type="radio" id="a1" name="active" value="1"<?=($row['active'] == 1 ? ' checked' : '')?>><label for="a1">Yes</label>
                        </div>
                        <div class="radio">
                            <input type="radio" id="a2" name="active" value="0"<?=($row['active'] != 1 ? ' checked' : '')?>><label for="a2">No</label>
                        </div>
                    </div>
                    <div class="col w-6">
                        <label>GIS</label>
                        <span class="help">Use the marker to set the general area of the dashboard, then draw/edit a polygon of the area included</span>
                        <div id="cmap" data-center="45.32,-118.1" data-zoom="7" style="width:100%;height:475px"></div>
                        <input type="hidden" name="geo" value="">
                    </div>
                </div>

                <div class="btn-group">
                    <input type="submit" class="btn btn-green" name="action" value="Save Settings">
                    <input type="button" class="btn btn-gray" onclick="window.location.href='../snow'" value="Go Back">
                </div>
            </form>

            <?}else{?>
            <a href="snow/add" class="btn btn-green">Add New Dashboard</a>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Name</th>
                            <th>Dashboard</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                    <?while($row = mysqli_fetch_assoc($result)){?>
                        <tr>
                            <td><?=ucwords(str_replace('-', ' ', $row['state']))?></td>
                            <td><?=$row['name']?></td>
                            <td><?=$row['dashboard']?></td>
                            <td><a href="snow/edit?id=<?=$row['id']?>">edit</a></td>
                        </tr>
                    <?}?>
                    </tbody>
                </table>
            </div>
            <?}?>
        </div>
    </div>
</div>

<script>const shape = <?=json_encode($settings['geo'])?>;</script>
<?}?>