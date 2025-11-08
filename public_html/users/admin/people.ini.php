<?
if ($function == 'create' && !$permission->user()->add() || $function == 'edit' && !$permission->user()->edit() || in_array($_GET['uid'], $doNotEdit) && $_SESSION['uid'] > 2) {
    echo invalidPermissions();
} else {
    // add user
    if ($function == 'create') {
        if (isset($_POST['action'])) {
            $time = time();
            $fname = $_POST['fname'];
            $lname = $_POST['lname'];
            $email = $_POST['email'];
            $role = $_POST['role'];
            $phone = preg_replace('/([^0-9])/', '', $_POST['phone']);
            $phone = substr($p, 0, 3) . '-' . substr($p, 3, 3) . '-' . substr($p, 6, 4);
            $l = $_POST['location'] != '' ? serialize(json_decode($_POST['location'])) : '';

            $perms = serialize($_POST['perms']);

            prepareQuery('sssisss', [$fname, $lname, $email, $time, $role, $phone, $l], "INSERT INTO users (first_name,last_name,email,password,last_active,created,role,phone,location,profilePic,provider) VALUES(?,?,?,'','',?,?,?,?,'','0')");
            $uid = mysqli_insert_id($con);

            if ($perms) {
                prepareQuery('isi', [$uid, $perms, $time], "INSERT INTO permissions (uid,permissions,time) VALUES(?,?,?)");
            }
            prepareQuery('ii', [$uid, $time], "INSERT INTO settings (uid,settings,method,time) VALUES(?,'','0',?)");
            prepareQuery('ii', [$uid, $time], "INSERT INTO trail_settings (uid,settings,method,time) VALUES(?,'','0',?)");
            prepareQuery('ii', [$uid, $time], "INSERT INTO oreroads_settings (uid,settings,app_token,time) VALUES(?,'','',?)");

            logEvent('Created a new user account (<a href="https://www.mapotechnology.com/account/admin/people/edit?uid=' . $uid . '">#' . $uid . '</a>)');
            header('Location: edit?created=1&uid=' . $uid);
        }
    }

    // edit user
    if ($function == 'edit') {
        include_once 'UserAgentParse.inc.php';

        /*$subs = mysqli_query($con, "SELECT b.* FROM billing AS b LEFT JOIN users AS u ON b.email = u.email WHERE u.uid = $_GET[uid] ORDER BY active DESC, start DESC");
        while ($row = mysqli_fetch_assoc($subs)) {
            if ($row['active'] == 1) {
                $bill[] = $row;
            } else {
                $bill2[] = $row;
            }
        }*/

        if (isset($_POST['action'])) {
            $fname = $_POST['fname'];
            $lname = $_POST['lname'];
            $email = $_POST['email'];
            $role = $_POST['role'];
            $phone = preg_replace('/([^0-9])/', '', $_POST['phone']);
            $phone = substr($p, 0, 3) . '-' . substr($p, 3, 3) . '-' . substr($p, 6, 4);

            if ($_POST['location'] != '') {
                $l = serialize(json_decode($_POST['location']));
                prepareQuery('si', [$l, $_POST['uid']], "UPDATE users SET location = ? WHERE uid = ?");
            }

            if (isset($_POST['confirmed']) && $_POST['confirmed'] == 1) {
                prepareQuery('s', [$email], "UPDATE confirmation SET confirmed = 1 WHERE email = ?");
            }

            $perms = serialize($_POST['perms']);

            prepareQuery('sssssi', [$fname, $lname, $email, $phone, $role, $_POST['uid']], "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ? WHERE uid = ?");
            
            if ($perms) {
                prepareQuery('isis', [$_POST['uid'], $perms, $time, $perms], "INSERT INTO permissions (uid,permissions,time) VALUES(?,?,?) ON DUPLICATE KEY UPDATE permissions = ?");
            }

            logEvent('Modified a user account (<a href="https://www.mapotechnology.com/account/admin/people/edit?uid=' . $_POST['uid'] . '">#' . $_POST['uid'] . '</a>)');
            echo message(true, '<b>' . $fname . ' ' . $lname . '</b>\'s account was successfully updated.');
        }
    }
?>
<div class="row">
    <div class="col w100">
        <div class="card">
        <?
        // remove a user
        if ($function == 'remove') {
            include_once $documentRoot . 'admin/incs/remove-user.ini.php';

            // add or edit a user
        } else if ($function == 'create' || $function == 'edit') {
            include_once $documentRoot . 'admin/incs/add_edit-user.ini.php';

            // table view of all users
        } else {
            // query for a specific user by name or email
            $where = '';
            if (isset($_GET['q'])) {
                $where = "WHERE first_name LIKE '%" . $_GET['q'] . "%' OR last_name LIKE '%" . $_GET['q'] . "%' OR email LIKE '%" . $_GET['q'] . "%' OR phone LIKE '%" . $_GET['q'] . "%'";
            }
            $order = ($_GET['sort'] != '' ? $_GET['sort'] : 'uid') . ' ' . ($_GET['order'] != '' ? $_GET['order'] : 'DESC');

            $rowsPerPage = 50;
            $totalRows = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS totalRows FROM users $where"))['totalRows'];
            $totalPages = ceil($totalRows / $rowsPerPage);

            $currentPage = isset($_GET['results']) ? $_GET['results'] : 1;
            $offset = ($currentPage - 1) * $rowsPerPage;
            $pagination = new Pagination($currentPage, $totalPages, 50);

            $sql = mysqli_query($con, "SELECT uid, first_name, last_name, email, role, created, last_active FROM users $where ORDER BY $order LIMIT $offset, $rowsPerPage");
            $totalUsers = mysqli_num_rows(mysqli_query($con, "SELECT uid FROM users")) - 2;
        ?>
            <h1>Manage Users</h1>

            <div class="controls">
                <form action="" method="get">
                    <input type="text" class="input" style="max-width:300px" name="q" placeholder="Search users..." value="<?= $_GET['q'] ? $_GET['q'] : '' ?>">
                    <div class="btn-group">
                        <input type="submit" class="btn btn-sm btn-blue" value="Search">
                        <? if ($permission->user()->add()) { ?><a class="btn btn-sm btn-green" href="./people/create">Create New User</a><? } ?>
                    </div>
                    <p style="padding:0"><b>Total MAPO Users:</b> <?=number_format($totalUsers)?></p>
                </form>
            </div>

            <?= $pagination->showing($totalRows) ?>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th onclick="window.location.href='?sort=first_name&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&'.$queryParams : '')?>'">First Name</th>
                            <th onclick="window.location.href='?sort=last_name&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&'.$queryParams : '')?>'">Last Name</th>
                            <th onclick="window.location.href='?sort=email&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&'.$queryParams : '')?>'">Email Address</th>
                            <th>Permissions</th>
                            <th onclick="window.location.href='?sort=last_active&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&'.$queryParams : '')?>'">Last Active</th>
                            <th onclick="window.location.href='?sort=created&order=<?=(!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&'.$queryParams : '')?>'">User Since</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        <? while ($row = mysqli_fetch_assoc($sql)) { ?>
                            <tr>
                                <td><?= $row['first_name'] ?></td>
                                <td><?= $row['last_name'] ?></td>
                                <td><?= $row['email'] ?></td>
                                <td><?= $row['role'] == 1 ? '<i class="fa-solid fa-user" title="General User"></i>' : '' ?>
                                    <?= $row['role'] == 2 ? '<i class="fa-solid fa-badge-check" title="Premium Access"></i>' : '' ?>
                                    <?= $row['role'] == 4 ? '<i class="fa-solid fa-person-hiking" title="Trail Moderator"></i>' : '' ?>
                                    <?= $row['role'] == 3 ? '<i class="fa-solid fa-lock" title="Administrative User"></i>' : '' ?></td>
                                <td><?= $row['last_active'] ? ago($row['last_active']) : '--' ?></td>
                                <td><?= ago($row['created']) ?></td>
                                <td><? if ($permission->user()->edit()) { ?><a href="people/edit?uid=<?= $row['uid'] ?>">edit</a><? } ?>
                                    <? if ($permission->user()->delete()) { ?> | <a href="people/remove?uid=<?= $row['uid'] ?>">remove</a><? } ?></td>
                            </tr>
                        <? } ?>
                    </tbody>
                </table>
            </div>

            <?=$pagination->links()?>
        <? } ?>
        </div>
    </div>
</div>
<?}?>