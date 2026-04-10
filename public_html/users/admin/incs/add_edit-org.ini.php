<?
if ($function == 'create' && !$permission->orgs()->add() || $function == 'edit' && !$permission->orgs()->edit()) {
    echo invalidPermissions();
} else {
    $now = time();
    $errors = false;

    if (isset($_POST['action'])) {
        $fields = ['org_key', 'name', 'max_users', 'admin_email', 'active'];

        foreach ($fields as $ea) {
            if ($_POST[$ea] == '') $errors = true;
        }
    }

    if (!$errors) {
        if ($function == 'create') {
            if (isset($_POST['action'])) {
                $start = strtotime($_POST['start_period']);
                $end = strtotime($_POST['end_period']);

                try {
                    $query = executeQuery(
                        'ssisiiii',
                        [$_POST['org_key'], $_POST['name'], $_POST['max_users'], $_POST['admin_email'], $now, $start, $end, $_POST['active']],
                        "INSERT INTO groups (org_key,name,max_users,admin_email,created,start_period,end_period,active,suspended) VALUES(?,?,?,?,?,?,?,?,0)"
                    );

                    if ($query['success']) {
                        $gid = mysqli_insert_id($con);

                        if ($_POST['admin_email'] != $_POST['old_admin_email']) {
                            mysqli_query($con, "UPDATE users SET role = 1 WHERE email = '$_POST[old_admin_email]'");
                            mysqli_query($con, "UPDATE users SET role = 5 WHERE email = '$_POST[admin_email]'");
                        }
                        inviteUser($_POST['org_key'], $gid, $orgName, $_POST['admin_email']);

                        echo message(true, 'Organization <b>' . $_POST['org_key'] . '</b> created successfully.');
                    }
                } catch (mysqli_sql_exception $e) {
                    $repopulate = true;

                    if ($e->getCode() == 1062) {
                        echo message(false, 'The short name <b>' . $_POST['org_key'] . '</b> is already in use. Please choose another.');
                    } else {
                        echo message(false, 'A database error occurred: ' . $e->getMessage());
                    }
                }
            }
        }

        if ($function == 'edit') {
            if (isset($_POST['action'])) {
                $end = strtotime($_POST['end_period']);

                $query = executeQuery(
                    'ssiiii',
                    [$_POST['name'], $_POST['admin_email'], $_POST['max_users'], $end, $_POST['active'], $_POST['group_id']],
                    "UPDATE groups SET name = ?, admin_email = ?, max_users = ?, end_period = ?, active = ? WHERE group_id = ?"
                );

                if ($query['success']) {
                    echo message(true, 'Your changes to <b>' . $_POST['org_key'] . '</b> were successful.');
                }
            }
        }
    }

    if ($function == 'edit') {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM groups WHERE group_id = '$_GET[group_id]'"));
        $gusers = mysqli_query($con, "SELECT u.uid, first_name, last_name, gu.email, last_active, status FROM group_users AS gu INNER JOIN users AS u ON u.email = gu.email WHERE group_id = $row[group_id]");
    }

    if ($errors) {
        echo message(false, 'All required fields must have information in them.');
    }
?>
    <h1><?= $function == 'create' ? 'Create New ' : 'Edit' ?> Organization<?= $function == 'edit' ? ': ' . $row['name'] . ' (' . $row['org_key'] . ')' : '' ?></h1>

    <h2 class="underline">Organization Details</h2>
    <form action="" method="post">
        <input type="hidden" name="mode" value="<?= $function ?>">
        <input type="hidden" name="old_admin_email" value="<?= $row['admin_email'] ?>">
        <? if ($function == 'edit') { ?>
            <input type="hidden" name="org_key" value="<?= $row['org_key'] ?>">
            <input type="hidden" name="group_id" value="<?= $_GET['group_id'] ?>">
        <? } ?>

        <label>Organization Short Name</label>
        <input type="text" class="input" required style="max-width:200px" name="org_key" value="<?= $repopulate ? $_POST['org_key'] : $row['org_key'] ?>" <?= $function == 'edit' ? ' disabled' : '' ?>>

        <label>Organization Full Name</label>
        <input type="text" class="input" required name="name" value="<?= $repopulate ? $_POST['name'] : $row['name'] ?>">

        <label>Administrator Email</label>
        <input type="email" class="input" required name="admin_email" value="<?= $repopulate ? $_POST['admin_email'] : $row['admin_email'] ?>">

        <label>Max Users</label>
        <input type="number" class="input" required style="width:70px" name="max_users" value="<?= $repopulate ? $_POST['max_users'] : 5 ?>" placeholder="5" min="5" max="100">

        <label>Start Period</label>
        <input type="datetime-local" class="input" name="start_period" style="max-width:195px" step="3600"
            min="<?= date('Y-m-d\TH:00') ?>"
            max="<?= date('Y-m-d\TH:00', strtotime('+1 month')) ?>"
            value="<?= $repopulate ? $_POST['start_period'] : date('Y-m-d\TH:00', $function == 'edit' ? $row['start_period'] : time()) ?>"
            <?= $row['active'] && $function == 'edit' ? ' readonly' : '' ?>>

        <label>End Period</label>
        <input type="datetime-local" class="input" name="end_period" style="max-width:195px"
            value="<?= $repopulate ? $_POST['end_period'] : date('Y-m-d\TH:00', $function == 'edit' ? $row['end_period'] : strtotime('+1 month')) ?>"
            <?= $function == 'create' ? ' readonly' : '' ?>>

        <label>Active</label>
        <div class="radio-group">
            <div class="radio" style="margin:0">
                <input type="radio" id="yes" name="active" value="1" checked>
                <label for="yes">Yes</label>
            </div>
            <div class="radio" style="margin:0">
                <input type="radio" id="no" name="active" value="0">
                <label for="no">No</label>
            </div>
        </div>
        <div class="btn-group">
            <input type="submit" name="action" class="btn btn-green" value="<?= ucfirst($function) ?> Organization">
            <input type="button" class="btn btn-gray" onclick="window.location.href='../organizations'" value="Go Back">
        </div>
    </form>

    <? if ($function != 'create') { ?>
        <h2 class="underline" style="margin-top:1em">Group Users</h2>

        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Current User</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Last Active</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <?
                    $curUser = 1;
                    while ($user = mysqli_fetch_assoc($gusers)) { ?>
                        <tr>
                            <td><?= $curUser ?> of <?= $row['max_users'] ?></td>
                            <td><?= $user['first_name'] ?></td>
                            <td><?= $user['last_name'] ?></td>
                            <td><?= $user['email'] . ($user['email'] == $row['admin_email'] ? ' (Admin)' : '') ?></td>
                            <td><?= ago($user['last_active']) ?></td>
                            <td><?= $user['status'] == 1 ? 'Active' : ($user['status'] == 0 ? 'Inactive' : 'Suspended') ?></td>
                            <td><a href="../people/edit?uid=<?= $user['uid'] ?>">edit</a> | <a href="../organizations/people/revoke?group_id=<?= $row['group_id'] ?>&uid=<?= $user['uid'] ?>">revoke</a></td>
                        </tr>
                    <?
                        $curUser += $user['status'] == 1 ? 1 : 0;
                    } ?>
                </tbody>
            </table>
        </div>
<? }
} ?>