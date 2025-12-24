<?
if ($function == 'create' || $function == 'edit') {
    include_once $documentRoot . 'admin/incs/add_edit-org.ini.php';
} else if ($function == 'people') {
    include_once $documentRoot . 'admin/incs/modify_org-users.ini.php';
} else {
    if (!$permission->manage()->org()) {
        echo invalidPermissions();
    } else {
        $result = mysqli_query($con, "SELECT * FROM groups ORDER BY start_period DESC");
?>
        <div class="row">
            <div class="col w100">
                <div class="card">
                    <h1 class="category">Manage Licensed Organizations</h1>

                    <div class="controls">
                        <div class="btn-group">
                            <input type="button" class="btn btn-green" onclick="window.location.href='./organizations/create'" value="Create Licensee">
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <th>Org. Key</th>
                                <th>Name</th>
                                <th>Cur/Max Users</th>
                                <th>Created</th>
                                <th>Start Period</th>
                                <th>Days Remaining</th>
                                <th>Active</th>
                                <th>Suspended</th>
                                <th></th>
                            </thead>
                            <tbody>
                                <? while ($row = mysqli_fetch_assoc($result)) {
                                    $cur = mysqli_num_rows(mysqli_query($con, "SELECT guid FROM group_users WHERE group_id = '$row[group_id]'"));
                                    ?>
                                    <tr>
                                        <td><?= $row['org_key'] ?></td>
                                        <td><?= $row['name'] ?></td>
                                        <td><?= $cur .'/'. $row['max_users'] ?></td>
                                        <td><?= date('n/j/Y', $row['created']) ?></td>
                                        <td><?= date('n/j/Y H:i', $row['start_period']) ?></td>
                                        <td><?= round(($row['end_period'] - time()) / 86400, 1) ?></td>
                                        <td><?= $row['active'] == 1 ? 'Yes' : 'No' ?></td>
                                        <td><?= $row['suspended'] == 1 ? 'Yes' : 'No' ?></td>
                                        <td><a href="organizations/edit?group_id=<?= $row['group_id'] ?>">edit</a> | <a href="organizations/suspend?group_id=<?= $row['group_id'] ?>">suspend</a></td>
                                    </tr>
                                <? } ?>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    <? }
} ?>