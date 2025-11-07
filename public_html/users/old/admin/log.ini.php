<?
if ($user['permissions']['view']['log'] != 1) {
    echo invalidPermissions();
} else {
    #logEvent('Viewed activity log');

    $result = mysqli_query($con, "SELECT u.uid, CONCAT(first_name, ' ', last_name) AS name, action, l.ip, l.time FROM log AS l LEFT JOIN users AS u on u.uid = l.uid ORDER BY l.time DESC LIMIT 200");
    while ($row = mysqli_fetch_assoc($result)) {
        $rows .= '<tr><td>'.($row['uid'] == 0 ? '0' : $row['uid']).'</td><td>'.($row['uid'] == 0 ? 'server.mapotechnology.com' : $row['name']).'</td><td>'.$row['action'].'</td><td>'.$row['ip'].'</td><td>'.ago($row['time']).'</td></tr>';
    }    
    ?>
    <div class="row">
        <div class="col">
            <div class="card">
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
                            <?=$rows?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
<?}?>