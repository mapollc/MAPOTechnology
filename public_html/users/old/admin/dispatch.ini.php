<?
if (isset($_POST['action'])) {
    $agency = mysqli_real_escape_string($con, $_POST['agency']);
    $name = mysqli_real_escape_string($con, $_POST['name']);
    $loc = mysqli_real_escape_string($con, $_POST['location']);

    if ($_POST['mode'] == 'add') {
        $sql = "INSERT INTO dispatch_centers (agency,state,name,cad_update,timezone,location,website,phone,active)
        VALUES('$agency','$_POST[state]','$name','0','$_POST[timezone]','$loc','$_POST[website]','$_POST[phone]','$_POST[active]')";
        
        logEvent('Created a new dispatch center: '.$name.' ('.$agency.')');
    } else {
        $sql = "UPDATE dispatch_centers SET agency = '$agency', state = '$_POST[state]', name = '$name', timezone = '$_POST[timezone]', location = '$_POST[location]', website = '$_POST[website]', phone = '$_POST[phone]', active = '$_POST[active]' WHERE dcid = '$_POST[id]'";
        logEvent('Modified dispatch center: '.$name.' ('.$agency.')');
    }

    mysqli_query($con, $sql);
    echo message(true, 'You have successfully '.$_POST['mode'].'ed dispatch center <b>'.$_POST['agency'].'</b>.');
}
?>

<div class="row">
    <div class="col">
        <?
        if ($user['permissions']['manage']['dispatch'] != 1) {
            echo invalidPermissions();
        } else {?>
        <div class="card">
            <?// add or edit an incident
            if ($function == 'add' || $function == 'edit') {
                if ($function == 'edit') {
                    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM dispatch_centers WHERE dcid = '$_GET[id]' OR agency = '$_GET[agency]'"));
                }    
            ?>
            <h1 class="category"><?=ucfirst($function)?> Dispatch Center<?=($function == 'edit' ? ': '.$row['agency'] : '')?></h1>

            <form action="" method="post">
            <div class="row">
                <div class="col w-6">
                    <input type="hidden" name="mode" value="<?=$function?>">
                    <?if($function=='edit'){?><input type="hidden" name="id" value="<?=$_GET['id']?>"><?}?>

                    <label>Agency ID</label>
                    <input type="text" class="input" name="agency" placeholder="Agency ID" value="<?=$row['agency']?>">

                    <label>State</label>
                    <select name="state" class="input">
                        <?foreach($statesArray as $k => $v) {
                            echo '<option '.($row['state'] == $k ? 'selected ' : '').'value="'.$k.'">'.ucwords(strtolower($v)).'</option>';
                        }?>
                    </select>

                    <label>Center Name</label>
                    <input type="text" class="input" name="name" placeholder="Dispatch Center Name" value="<?=$row['name']?>">

                    <label>Timezone</label>
                    <select name="timezone" class="input">
                        <option <?=($row['timezone'] == 'America/Los_Angeles' ? 'selected ' : '')?>value="America/Los_Angeles">Pacific</option>
                        <option <?=($row['timezone'] == 'America/Denver' ? 'selected ' : '')?>value="America/Mountain">Mountain</option>
                        <option <?=($row['timezone'] == 'America/Chicago' ? 'selected ' : '')?>value="America/Central">Central</option>
                        <option <?=($row['timezone'] == 'America/New_York' ? 'selected ' : '')?>value="America/New_York">Eastern</option>
                        <option <?=($row['timezone'] == 'America/Anchorage' ? 'selected ' : '')?>value="America/Anchorage">Alaska</option>
                    </select>

                    <label>Location</label>
                    <input type="text" name="location" class="input" placeholder="City, State" value="<?=$row['location']?>">
                </div>
                <div class="col w-6">
                    <label>Website</label>
                    <input type="text" name="website" class="input" placeholder="www.example.com" value="<?=$row['website']?>">

                    <label>Phone</label>
                    <input type="tel" name="phone" class="input" placeholder="Phone Number" value="<?=$row['phone']?>">

                    <label>CAD Last Updated</label>
                    <input type="text" class="input" value="<?=date('n/j/Y H:i:s T', $row['cad_update'])?>" disabled>

                    <label>Active</label>
                    <select name="active" class="input">
                        <option <?=($row['active'] == 1 ? 'selected ' : '')?>value="1">Yes</option>
                        <option <?=($row['active'] == 0 ? 'selected ' : '')?>value="0">No</option>
                    </select>
                </div>
            </div>

                <div class="btn-group">
                    <input type="submit" class="btn btn-green" name="action" value="<?=ucfirst($function)?> Center">
                    <input type="button" class="btn" value="Go Back" onclick="window.location.href='../dispatch'">
                </div>
            </form>

            <?
            // table view of all dispatch centers
            } else {
            include_once('/home/mapo/public_html/cron/dispatch.inc.php');

            $where = (isset($_GET['q']) ? 'WHERE name LIKE \'%'.$_GET['q'].'%\' OR agency LIKE \'%'.$_GET['q'].'%\'' : '');
            $sort = (isset($_GET['sort']) ? $_GET['sort'].' '.$_GET['order'] : 'cad_update DESC');
            $sql = mysqli_query($con, "SELECT dcid, agency, state, name, cad_update, active FROM dispatch_centers $where ORDER BY $sort");    
            ?>
            <form action="" method="get">
                <input type="text" class="input" style="display:inline-block;max-width:300px" name="q" placeholder="Search dispatch centers..." value="<?=($_GET['q'] ? $_GET['q'] : '')?>">
                <div class="btn-group">
                    <input type="submit" class="btn btn-blue" value="Search">
                    <a class="btn btn-green" href="dispatch/add">Add Dispatch Center</a>
                </div>
            </form>

            <div class="table-responsive">
                <table class="table">
                    <thead class="sortable">
                        <tr>
                            <th onclick="window.location.href='?sort=agency&order=<?=($_GET['order'] == 'ASC' ? 'DESC' : 'ASC')?>'">Agency ID</th>
                            <th onclick="window.location.href='?sort=state&order=<?=($_GET['order'] == 'ASC' ? 'DESC' : 'ASC')?>'">State</th>
                            <th onclick="window.location.href='?sort=name&order=<?=($_GET['order'] == 'ASC' ? 'DESC' : 'ASC')?>'">Center Name</th>
                            <th>Active</th>
                            <th onclick="window.location.href='?sort=cad_update&order=<?=($_GET['order'] == 'DESC' ? 'ASC' : 'DESC')?>'">CAD Last Updated</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?while($row = mysqli_fetch_assoc($sql)){?>
                        <tr>
                            <td><?=$row['agency']?></td>
                            <td><?=$row['state']?></td>
                            <td><?=$row['name']?></td>
                            <td><?=($row['active'] == 1 ? 'Yes' : 'No')?></td> 
                            <td><?=ago($row['cad_update'])?></td>
                            <td><a href="dispatch/edit?id=<?=$row['dcid']?>">edit</a></td>
                        </tr>
                    <?}?>
                    </tbody>
                </table>
            </div>
            <?}?>
        </div>
        <?}?>
    </div>
</div>