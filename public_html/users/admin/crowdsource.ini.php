<?
function verify($v) {
    return [
        'text' => $v == 0 ? '<i class="fa-solid fa-square-question"></i> Unverified' : ($v == 1 ? '<i class="fas fa-badge-check"></i> Verified' : '<i class="fa-solid fa-shield-xmark"></i> Rejected'),
        'color' => $v == 0 ? 'red' : ($v == 1 ? 'green' : 'orange')
    ];
}

function getDispatch($lat, $lon) {
    $json = json_decode(file_get_contents('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/DMP_National_Dispatch_Boundaries_Public/FeatureServer/0/query?where=1%3D1&geometry='.$lon.','.$lat.'&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&outFields=DispUnitID%2CDispName&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&outSR=4326&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&f=json'));
    $id = str_replace('US', '', $json->features[0]->attributes->DispUnitID);

    return '<a href="../dispatch/edit?agency='.$id.'">'.$id.'</a> / '.$json->features[0]->attributes->DispName;
}

if (!$permission->view()->reports() && !$permission->manage()->reports()) {
    echo invalidPermissions();
} else {
    if ($function == 'view') {
        if (isset($_POST['verify']) || isset($_POST['reject'])) {
            $v = isset($_POST['verify']) ? 1 : 2;
            $det = json_encode(['user' => $_SESSION['uid'], 'userName' => $_SESSION['name'], 'reason' => $_POST['reason'], 'time' => time()]);
            prepareQuery('isi', [$v, $det, $_POST['rid']], "UPDATE user_reports SET verified = ?, verification = ? WHERE id = ?");

            logEvent((isset($_POST['verify']) ? 'Verified' : 'Rejected').' a crowdsourced report: <a href="../crowdsource/view?id='.$_POST['rid'].'">#'.$_POST['fancyID'].'</a>');
            echo message(true, 'This report was successfully marked as '.(isset($_POST['verify']) ? 'verified' : 'rejected').'.');
        }

        $row = prepareQuery('i', [$_GET['id']], "SELECT * FROM user_reports WHERE id = ?");
        $year = date('Y', $row['time']);
        $ex = json_decode($row['verification']);
        $geo = json_decode($row['geo']);
        $details = json_decode($row['user']);
        $ver = verify($row['verified']);
        $verify = $ver['text'];
        $verifyColor = $ver['color'];
        $dispatch = getDispatch($geo->lat, $geo->lon);

        if ($row['verified'] != 0) {
            $verify .= ' &mdash; by '.$ex->userName.' on '.date('D, n/j/Y \a\t g:i A', $ex->time);
        }
    } else {
        $rowsPerPage = 50;
        $where = '';
        $params = str_replace('page=admin&method=reports', '', $_SERVER['QUERY_STRING']);

        if ($params) {
            $where .= isset($_GET['type']) && $_GET['type'] != '' ? "type = '$_GET[type]' AND " : '';
            $where .= isset($_GET['state']) && $_GET['state'] != '' ? "state = '$_GET[state]' AND " : '';
            $where .= isset($_GET['verify']) && $_GET['verify'] != '' ? "verified = $_GET[verify] AND " : '';
            $where .= isset($_GET['start']) && $_GET['start'] != '' ? " time >= " . strtotime($_GET['start'] . ' 00:00:00') . " AND " : '';
            $where .= isset($_GET['end']) && $_GET['end'] != '' ? " time <= " . strtotime($_GET['end'] . ' 23:59:59') . " AND " : '';
            $where = $where != '' ? 'WHERE '.substr($where, 0, -5) : '';
        }

        $sort = isset($_GET['sort']) && isset($_GET['order']) ? "$_GET[sort] $_GET[order]" : 'verified ASC, time DESC';
        $result = mysqli_query($con, "SELECT * FROM user_reports $where ORDER BY $sort");
        $totalRows = mysqli_num_rows($result);

        $totalPages = ceil($totalRows / $rowsPerPage);
        
        $currentPage = isset($_GET['results']) ? $_GET['results'] : 1;
        $offset = ($currentPage - 1) * $rowsPerPage;
        $query .= " LIMIT $offset, $rowsPerPage";
        $pagination = new Pagination($currentPage, $totalPages);
    }

    $title = $function == 'view' ? 'Crowdsource Report #'.$year.'-'.str_pad($row['id'], 3, '0', STR_PAD_LEFT) : 'Crowdsourced Wildfire Reports';
?>
<div class="row">
    <div class="col">
        <div class="card">
            <h1><?=$title?></h1>

            <?if ($function != 'view') {?>
                <div class="controls">
                    <form action="" method="get" style="align-items:flex-end">
                        <div>
                            <label>Start Date</label>
                            <input type="date" style="max-width:130px" class="input" name="start" min="2025-03-17" value="<?= isset($_GET['start']) ? $_GET['start'] : '2025-03-17' ?>" max="<?= date('Y-m-d', strtotime('-1 day')) ?>">
                        </div>

                        <div>
                            <label>End Date</label>
                            <input type="date" style="max-width:130px" class="input" name="end" min="2025-03-17" value="<?= isset($_GET['end']) ? $_GET['end'] : date('Y-m-d') ?>" max="<?= date('Y-m-d') ?>">
                        </div>

                        <select name="type" class="input" style="max-width:175px">
                            <option value="">- Type -</option>
                            <option <?= $_GET['type'] != '' ? 'selected ' : '' ?>value="Wildfire">Wildfire</option>
                            <option <?= $_GET['type'] == 'Smoke Check' ? 'selected ' : '' ?>value="Smoke Check">Smoke Check</option>
                            <option <?= $_GET['type'] == 'Complex' ? 'selected ' : '' ?>value="Complex">Complex</option>
                        </select>

                        <select name="state" class="input" style="max-width:190px">
                            <option value="">- All States -</option>
                            <? foreach ($statesArray as $k => $v) {
                                echo '<option ' . ($_GET['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
                            } ?>
                        </select>

                        <select name="verify" class="input" style="max-width:175px">
                            <option <?= !isset($_GET['verify']) ? 'selected ' : '' ?>value="">All Reports</option>
                            <option <?= $_GET['verify'] == '0' ? 'selected ' : '' ?>value="0">Unverified</option>
                            <option <?= $_GET['verify'] == '1' ? 'selected ' : '' ?>value="1">Verified</option>
                            <option <?= $_GET['verify'] == '2' ? 'selected ' : '' ?>value="2">Rejected</option>
                        </select>

                        <input type="submit" class="btn btn-blue" value="Search">
                    </form>
                </div>

                <?=$pagination->showing($totalRows)?>

                <div class="table-responsive">
                    <table class="table">
                        <thead class="sortable">
                            <tr>
                                <th onclick="window.location.href='?sort=id&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? $queryParams : '') ?>'">Report ID</th>
                                <th onclick="window.location.href='?sort=verified&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? $queryParams : '') ?>'">Verified</th>
                                <th onclick="window.location.href='?sort=type&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? $queryParams : '') ?>'">Type</th>
                                <th onclick="window.location.href='?sort=state&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? $queryParams : '') ?>'">State</th>
                                <th>Geolocation</th>
                                <th onclick="window.location.href='?sort=time&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? $queryParams : '') ?>'">Submitted</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        <?while ($row = mysqli_fetch_assoc($result)) {
                            $geo = json_decode($row['geo']);
                            $verify = verify($row['verified']);
                        ?>
                            <tr>
                                <td><?=date('Y', $row['time']).'-'.str_pad($row['id'], 3, '0', STR_PAD_LEFT)?></td>
                                <td style="color:var(--<?=$verify['color']?>)"><?=$verify['text']?></td>
                                <td><?=$row['type']?></td>
                                <td><?=convertState($row['state'], 1)?></td>
                                <td><?=$geo->near?></td>
                                <td><?=ago($row['time'])?></td>
                                <td><a href="crowdsource/view?id=<?=$row['id']?>">view</a></td>
                            </tr>
                        <?}?>
                        </tbody>
                    </table>

                    <?=$pagination->links()?>
                </div>
            <?} else {
                $ua = agent($user_agent->parse($details->user_agent));
                ?>
                <div class="rows">
                    <div class="row align-center">
                        <div class="col w17 label">Status</div>
                        <div class="col w83" style="color:var(--<?=$verifyColor?>)"><?=$verify?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Reported</div>
                        <div class="col w83"><?=date('l, F j, Y g:i A T', $row['time'])?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Incident Type</div>
                        <div class="col w83"><?=$row['type']?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">State</div>
                        <div class="col w83"><?=convertState($row['state'])?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Coordinates</div>
                        <div class="col w83"><a target="blank" href="https://mapofire.com/#8.5/<?=$geo->lat.'/'.$geo->lon?>"><?=round($geo->lat, 6).', '.round($geo->lon, 6)?></a></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Geolocation</div>
                        <div class="col w83"><?=$geo->near?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Dispatch Jurisdiction</div>
                        <div class="col w83"><?=$dispatch?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Estimated Size</div>
                        <div class="col w83"><?=number_format($row['acres'])?> acres</div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Further Details</div>
                        <div class="col w83"><?=$row['details']?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">Web/App Submission</div>
                        <div class="col w83"><?=$details->platform.($details->version ? ' (version '.$details->version.')' : '')?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">MAPO User</div>
                        <div class="col w83"><?=$details->authUser == 1 ? 'Yes &middot; <a href="../people/edit?uid='.$details->uid.'">view user</a>' : 'No'?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">IP Address</div>
                        <div class="col w83"><?=$details->ip?></div>
                    </div>
                    <div class="row align-center">
                        <div class="col w17 label">User Agent</div>
                        <div class="col w83"><?=$ua?></div>
                    </div>
                </div>

                <?if ($permission->manage()->reports()) {?>
                    <form action="" method="post">
                    <input type="hidden" name="rid" value="<?=$row['id']?>">
                    <input type="hidden" name="fancyID" value="<?=$year.'-'.str_pad($row['id'], 3, '0', STR_PAD_LEFT)?>">

                        <textarea name="reason" class="field" placeholder="Notes for verifying or reason for rejecting..."><?=$ex->reason?></textarea>

                        <div class="btn-group">
                            <input type="submit" name="verify" class="btn btn-green" value="Verify"<?=$row['verified'] == 1 ? ' disabled' : ''?>>
                            <input type="submit" name="reject" class="btn btn-red" value="Reject"<?=$row['verified'] == 2 ? ' disabled' : ''?>>
                            <input type="button" class="btn btn-gray" value="Go back" onclick="window.location.href='../crowdsource'">
                        </div>
                    </form>
                <?}
            }?>
        </div>
    </div>
</div>
<?}?>