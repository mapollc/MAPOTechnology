<?
if (!$permission->view()->log()) {
    echo invalidPermissions();
} else {
    ////logEvent('Viewed activity log');
    $where = '';

    if (isset($_GET['start']) || isset($_GET['end']) || isset($_GET['system'])) {
        $where = 'WHERE '.(isset($_GET['system']) && $_GET['system'] == 0 ? 'l.uid != 0 AND ' : '');
    }

    if (isset($_GET['start'])) {
        $st = strtotime("$_GET[start] 00:00:00");
        $where .= "time >= $st";
    }

    if (isset($_GET['end'])) {
        $et = strtotime("$_GET[end] 23:59:59");
        $where .= (isset($_GET['end']) ? ' AND ' : '')."time <= $et";
    }

    $rowsPerPage = 100;
    $totalRows = mysqli_num_rows(mysqli_query($con, "SELECT uid FROM log AS l $where"));
    $totalPages = ceil($totalRows / $rowsPerPage);

    $currentPage = isset($_GET['results']) ? $_GET['results'] : 1;
    $offset = ($currentPage - 1) * $rowsPerPage;
    $pagination = new Pagination($currentPage, $totalPages);

    $result = mysqli_query($con, "SELECT u.uid, CONCAT(first_name, ' ', last_name) AS name, action, l.ip, l.time FROM log AS l LEFT JOIN users AS u on u.uid = l.uid $where ORDER BY l.time DESC LIMIT $offset, $rowsPerPage");
    while ($row = mysqli_fetch_assoc($result)) {
        $rows .= '<tr><td>' . ($row['uid'] == 0 ? '0' : $row['uid']) . '</td><td>' . ($row['uid'] == 0 ? 'server.mapotechnology.com' : $row['name']) . '</td><td>' . $row['action'] . '</td><td>' . $row['ip'] . '</td><td>' . ago($row['time']) . '</td></tr>';
    }
?>
    <div class="row">
        <div class="col">
            <div class="card">
                <h1>MAPO User Activity Log</h1>

                <div class="controls">
                    <form action="" style="align-items:flex-end" method="get">
                        <div>
                            <label>Start Date</label>
                            <input type="date" style="max-width:130px" class="input" name="start" min="2024-03-21" value="<?=isset($_GET['start']) ? $_GET['start'] : '2024-03-21'?>" max="<?=date('Y-m-d', strtotime('-1 day'))?>">
                        </div>
                        <div>
                            <label>End Date</label>
                            <input type="date" style="max-width:130px" class="input" name="end" min="2024-03-22" value="<?=isset($_GET['end']) ? $_GET['end'] : date('Y-m-d')?>" max="<?=date('Y-m-d')?>">
                        </div>
                        <div><span style="display:inline-block;font-size:14px;padding-right:5px;font-weight:bold">Show system entries</span>
                            <div class="radio" style="margin:0">
                                <input type="radio" id="r1" name="system" value="1"<?=!isset($_GET['system']) || $_GET['system'] == 1 ? ' checked' : ''?>><label for="r1" style="padding-right:15px">Yes</label>
                            </div>
                            <div class="radio">
                                <input type="radio" id="r2" name="system" value="0"<?=$_GET['system'] == 0 ? ' checked' : ''?>><label for="r2">No</label>
                            </div>
                        </div>
                        <input type="submit" value="Search" class="btn btn-green">
                    </form>
                </div>

                <?=$pagination->showing($totalRows)?>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>UID</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>IP Address</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?= $rows ?>
                        </tbody>
                    </table>
                </div>

                <?=$pagination->links()?>

            </div>
        </div>
    </div>
<? } ?>