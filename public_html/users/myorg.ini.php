<?
$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT group_id, org_key, name, max_users FROM groups WHERE admin_email = '$_SESSION[email]'"));
$orgName = $row['name'];

if (isset($_POST['action']) && $_POST['action'] == 'Invite User') {
    $expires = time() + 3600 * 24;
    $token = createToken(['org_key' => $_POST['org_key'], 'group_id' => $_POST['group_id']], $expires);

    try {
        $query = executeQuery(
            'issi',
            [$_POST['group_id'], $_POST['invite_email'], $token, $expires],
            "INSERT INTO group_users (group_id, uid, email, invite_code, expires, status) VALUES(?, NULL, ?, ?, ?, 0)"
        );

        if ($query['success']) {
            $fields = array('{company}' => $orgName, '{org_key}' => $_POST['org_key'], '{email}' => $_POST['invite_email'], '{token}' => $token);
            sendEmail($_POST['invite_email'], 'You\'ve been invited to ' . $orgName . '\'s MAPO account', 'inviteuser', $fields);

            echo message(true, 'Invitation sent to ' . htmlspecialchars($_POST['invite_email']));
        }
    } catch (mysqli_sql_exception $e) {
        $repopulate = true;
        if ($e->getCode() === 1062) {
            echo message(false, 'The email <b>' . htmlspecialchars($_POST['invite_email']) . '</b> has already been invited or is a current member.');
        } else {
            echo message(false, 'Error: ' . $e->getMessage());
        }
    }
}

if (!$method) {
    $gusers = mysqli_query($con, "SELECT u.uid, first_name, last_name, email, last_active, status FROM group_users AS gu LEFT JOIN users AS u ON u.uid = gu.uid WHERE group_id = $row[group_id]");
}
?>
<div class="row">
    <div class="col w100">
        <div class="card">
            <? if ($method == 'invite') { ?>
                <h1 class="category">Invite User</h1>

                <form action="" method="post">
                    <input type="hidden" name="group_id" value="<?= $row['group_id'] ?>">
                    <input type="hidden" name="org_key" value="<?= $row['org_key'] ?>">

                    <p class="help">
                        The user will have 24 hours to accept the invitation otherwise you will have to remove them and re-add them.
                    </p>

                    <label>User Email</label>
                    <input type="email" class="input" name="invite_email" placeholder="user@example.com" value="<?= $repopulate ? $_POST['invite_email'] : '' ?>">

                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="action" value="Invite User">
                        <input type="reset" class="btn btn-red" value="Reset">
                        <input type="button" class="btn btn-gray" onclick="window.location.href='./myorg'" value="Go Back">
                    </div>
                </form>
            <? } else { ?>
                <h1 class="category">My Organization</h1>

                <?= message(null, 'You currently have 0 of ' . $row['max_users'] . ' maximum users for this organization.', true) ?>

                <div class="controls">
                    <div class="btn-group">
                        <input type="button" class="btn btn-green" onclick="window.location.href='./myorg/invite'" value="Invite User">
                    </div>
                </div>

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
                            <? $curUser = 1;
                            while ($user = mysqli_fetch_assoc($gusers)) { ?>
                                <tr>
                                    <td><?= $curUser ?> of <?= $row['max_users'] ?></td>
                                    <td><?= $user['first_name'] ?></td>
                                    <td><?= $user['last_name'] ?></td>
                                    <td><?= $user['email'] . ($user['email'] == $row['admin_email'] ? ' (Default)' : '') ?></td>
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
            <? } ?>
        </div>
    </div>
</div>