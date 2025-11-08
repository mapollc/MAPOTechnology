<?
if (!$permission->manage()->dispatch()) {
    echo invalidPermissions();
} else {
    $gaccs = ['AICC' => 'Alaska Interagency Coordination Center',
        'EACC' => 'Eastern Area Coordination Center',
        'GBCC' => 'Great Basin Coordination Center',
        'NRCC' => 'Northern Rockies Coordination Center',
        'NWCC' => 'Northwest Coordination Center',
        'ONCC' => 'Northern California Geographic Coordination Center',
        'OSCC' => 'Southern California Geographic Coordination Center',
        'RMCC' => 'Rocky Mountain Area Coordinaton Center',
        'SACC' => 'Southern Area Coordination Center',
        'SWCC' => 'Southwest Coordination Center'
    ];

    if (isset($_POST['action'])) {
        if ($_POST['mode'] == 'add') {
            $num = mysqli_num_rows(mysqli_query($con, "SELECT dcid FROM dispatch_centers WHERE agency = '$_POST[agency]"));

            if ($num == 0) {
                prepareQuery('ssssissssi', [$_POST['agency'], $_POST['gacc'], $_POST['state'], $_POST['name'], 0, $_POST['timezone'], $_POST['location'], $_POST['website'], $_POST['phone'], $_POST['active']],
                "INSERT INTO dispatch_centers (agency,gacc,state,name,cad_update,timezone,location,website,phone,active) VALUES(?,?,?,?,?,?,?,?,?,?)");
        
                logEvent('Created a new dispatch center: ' . $_POST['name'] . ' (' . $_POST['agency'] . ')');
            } else {
                echo message(false, "The dispatch center $_POST[agency] already exists. Try again.");
            }
        } else {
            prepareQuery('ssssssssii', [$_POST['agency'], $_POST['gacc'], $_POST['state'], $_POST['name'], $_POST['timezone'], $_POST['location'], $_POST['website'], $_POST['phone'], $_POST['active'], $_POST['id']],
            "UPDATE dispatch_centers SET agency = ?, gacc = ?, state = ?, name = ?, timezone = ?, location = ?, website = ?, phone = ?, active = ? WHERE dcid = ?");
            
            logEvent('Modified dispatch center: ' . $_POST['name'] . ' (' . $_POST['agency'] . ')');
        }
    
        echo message(true, 'You have successfully ' . $_POST['mode'] . 'ed dispatch center <b>' . $_POST['agency'] . '</b>.');
    }

    // add or edit an incident
    if ($function == 'add' || $function == 'edit') {
        if ($function == 'edit') {
            $year = date('Y');
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM dispatch_centers WHERE (dcid = '$_GET[id]' OR agency = '$_GET[agency]')"));
        }
    ?>
    <div class="row">
        <div class="col w100">
            <div class="card">
                <h1 class="category"><?= ucfirst($function) ?> Dispatch Center<?= $function == 'edit' ? ': ' . $row['agency'] : '' ?></h1>

                <form action="" method="post">
                    <div class="row">
                        <div class="col w50">
                            <input type="hidden" name="mode" value="<?= $function ?>">
                            <? if ($function == 'edit') { ?><input type="hidden" name="id" value="<?= $_GET['id'] ?>"><? } ?>

                            <label style="margin:0">Agency ID</label>
                            <input type="text" class="input" name="agency" placeholder="Agency ID" value="<?= $row['agency'] ? $row['agency'] : $_GET['agency'] ?>">

                            <label>Center Name</label>
                            <input type="text" class="input" name="name" placeholder="Dispatch Center Name" value="<?= $row['name'] ?>">

                            <label>State</label>
                            <select name="state" class="input">
                                <option value="">- Choose State -</option>
                                <? foreach ($statesArray as $k => $v) {
                                    echo '<option ' . ($row['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
                                } ?>
                            </select>

                            <label>GACC</label>
                            <select name="gacc" class="input">
                                <option value="">- Choose GACC -</option>
                                <? foreach ($gaccs as $k => $v) {
                                    echo '<option ' . ($row['gacc'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . $k .' - '. $v . '</option>';
                                } ?>
                            </select>

                            <label>Timezone</label>
                            <select name="timezone" class="input">
                                <option <?= $row['timezone'] == 'America/Los_Angeles' ? 'selected ' : '' ?>value="America/Los_Angeles">Pacific</option>
                                <option <?= $row['timezone'] == 'America/Denver' ? 'selected ' : '' ?>value="America/Mountain">Mountain</option>
                                <option <?= $row['timezone'] == 'America/Chicago' ? 'selected ' : '' ?>value="America/Central">Central</option>
                                <option <?= $row['timezone'] == 'America/New_York' ? 'selected ' : '' ?>value="America/New_York">Eastern</option>
                                <option <?= $row['timezone'] == 'America/Anchorage' ? 'selected ' : '' ?>value="America/Anchorage">Alaska</option>
                            </select>
                        </div>
                        <div class="col w50">
                            <label>Location</label>
                            <input type="text" name="location" class="input" placeholder="City, State" value="<?= $row['location'] ?>">

                            <label>Website</label>
                            <input type="text" name="website" class="input" placeholder="www.example.com" value="<?= $row['website'] ?>">

                            <label>Phone</label>
                            <input type="tel" name="phone" class="input" placeholder="Phone Number" value="<?= $row['phone'] ?>">

                            <label>Active</label>
                            <select name="active" class="input">
                                <option <?= $row['active'] == 1 ? 'selected ' : '' ?>value="1">Yes</option>
                                <option <?= $row['active'] == 0 ? 'selected ' : '' ?>value="0">No</option>
                            </select>

                            <label>CAD Last Updated</label>
                            <input type="text" class="input" value="<?= $row['cad_update'] ? date('n/j/Y H:i:s T', $row['cad_update']) : 'Never' ?>" disabled>

                            <?if ($function == 'edit') {?>
                            <p>
                                <a target="blank" href="../wildfires?start=<?=date('Y')?>-01-01&end=<?=date('Y-m-d')?>&dispatch=<?=$row['agency']?>">See incidents</a>
                            </p>
                            <? } ?>
                        </div>
                    </div>

                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="action" value="<?= ucfirst($function) ?> Center">
                        <input type="button" class="btn" value="Go Back" onclick="window.location.href='../dispatch'">
                    </div>
                </form>
            </div>
        </div>
    </div>
    <?
        // table view of all dispatch centers
    } else {
        include_once '/home/mapo/public_html/cron/dispatch.inc.php';

        $where = isset($_GET['q']) && $_GET['q'] != '' ? ' AND name LIKE \'%' . $_GET['q'] . '%\' OR agency LIKE \'%' . str_replace('-', '', $_GET['q']) . '%\'' : '';
        $where .= isset($_GET['gacc']) && $_GET['gacc'] != '' ? " AND gacc = '$_GET[gacc]'" : '';
        $where .= isset($_GET['state']) && $_GET['state'] != '' ? " AND state = '$_GET[state]'" : '';
        $where .= isset($_GET['active']) && $_GET['active'] != '' ? " AND active = '$_GET[active]'" : '';
        $sort = isset($_GET['sort']) ? $_GET['sort'] . ' ' . $_GET['order'] : 'cad_update DESC';

        $sql = mysqli_query($con, "SELECT dcid, agency, gacc, state, name, cad_update, active FROM dispatch_centers WHERE 1=1 $where ORDER BY $sort");
    ?>
    <div class="row">
        <div class="col w100">
            <div class="card">
                <h1>Dispatch Center Management</h1>

                    <?if ($function == 'verify') {
                    while ($row = mysqli_fetch_assoc($sql)) {
                        $dbCenters[] = $row['agency'];
                    }    
                    ?>

                    <div class="controls">
                        <div class="btn-group">
                            <input type="button" class="btn btn-gray" onclick="history.go(-1)" value="Go Back">
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>WildCAD Center</th>
                                    <th>Exists in our Database</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                            <?foreach($newDispatchCenters as $ctr) {
                                echo "<tr><td>$ctr</td><td>".(in_array($ctr, $dbCenters) ? 'Yes' : 'No')."</td><td>".(!in_array($ctr, $dbCenters) ? "<a target=\"blank\" href=\"../dispatch/add?agency=$ctr\">Add</a>" : '') . "</td></tr>";
                            }?>
                            </tbody>
                        </table>
                    </div>
                    <? } else {?>
                    <div class="controls">
                        <form action="" method="get">
                            <?if($_GET['sort']) {
                                echo '<input type="hidden" name="sort" value="'.$_GET['sort'].'">';
                            }if($_GET['order']) {
                                echo '<input type="hidden" name="order" value="'.$_GET['order'].'">';
                            }?>
                            <input type="text" class="input" style="display:inline-block;max-width:300px" name="q" placeholder="Search dispatch centers..." value="<?= $_GET['q'] ? $_GET['q'] : '' ?>">

                            <select name="gacc" class="input" style="max-width:190px">
                                <option value="">- All GACCs -</option>
                                <? foreach ($gaccs as $k => $v) {
                                    echo '<option ' . ($_GET['gacc'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . $k . '</option>';
                                } ?>
                            </select>

                            <select name="state" class="input" style="max-width:190px">
                                <option value="">- All States -</option>
                                <? foreach ($statesArray as $k => $v) {
                                    echo '<option ' . ($_GET['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
                                } ?>
                            </select>

                            <select name="active" class="input" style="max-width:128px">
                                <option value="">- All Statuses -</option>
                                <option <?=$_GET['active'] == '1' ? 'selected ' : ''?>value="1">Active</option>
                                <option <?=$_GET['active'] == '0' ? 'selected ' : ''?>value="0">Inactive</option>
                            </select>

                            <input type="submit" class="btn btn-blue" value="Search">
                            <div class="btn-group">
                                <a class="btn btn-green" href="dispatch/add">Add Dispatch Center</a>
                                <a class="btn btn-gray" href="dispatch/verify">Verify Dispatch Centers</a>
                            </div>
                        </form>
                    </div>

                    <div class="table-responsive">
                        <table class="table">
                            <thead class="sortable">
                                <tr>
                                    <th onclick="window.location.href='?sort=agency&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC').($queryParams ? '&'.$queryParams : '')?>'">Agency ID</th>
                                    <th onclick="window.location.href='?sort=state&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC').($queryParams ? '&'.$queryParams : '')?>'">State</th>
                                    <th onclick="window.location.href='?sort=name&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC').($queryParams ? '&'.$queryParams : '')?>'">Center Name</th>
                                    <th>Active</th>
                                    <th onclick="window.location.href='?sort=gacc&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC').($queryParams ? '&'.$queryParams : '')?>'">GACC</th>
                                    <th onclick="window.location.href='?sort=cad_update&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'ASC' : 'DESC').($queryParams ? '&'.$queryParams : '')?>'">CAD Last Updated</th>
                                    <th>&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                <? while ($row = mysqli_fetch_assoc($sql)) { ?>
                                    <tr>
                                        <td><?= $row['agency'] ?></td>
                                        <td><?= $row['state'] ?></td>
                                        <td><?= $row['name'] ?></td>
                                        <td><?= $row['active'] == 1 ? 'Yes' : 'No' ?></td>
                                        <td><?= $row['gacc'] ?></td>
                                        <td><?= ago($row['cad_update']) ?></td>
                                        <td><a href="dispatch/edit?id=<?= $row['dcid'] ?>">edit</a></td>
                                    </tr>
                                <? } ?>
                            </tbody>
                        </table>
                    </div>
                    <? }
                } ?>
                </div>
            <? } ?>
        </div>
    </div>
</div>