<?
$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT group_id, org_key, name, admin_email, max_users FROM groups WHERE admin_email = '$_SESSION[email]'"));
$orgName = $row['name'];

if ($row && !$method) {
    $gusers = mysqli_query($con, "SELECT guid, u.uid, first_name, last_name, gu.email, last_active, status FROM group_users AS gu LEFT JOIN users AS u ON u.email = gu.email WHERE group_id = $row[group_id]");
    $gusersNum = mysqli_num_rows($gusers);
}

if (!$row) {
    echo invalidPermissions();
} else {
    if (isset($_POST['action']) && $_POST['action'] == 'Invite User') {
        echo inviteUser($_POST['org_key'], $_POST['group_id'], $orgName, $_POST['invite_email']);
    }

    if ($method == 'invite') {
        $gusersNum = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS total FROM group_users WHERE group_id = $row[group_id]"))['total'];
    }
?>
    <div class="row">
        <div class="col w100">
            <div class="card">
                <? if ($method == 'invite') { ?>
                    <h1 class="category">Invite User</h1>

                    <? if ($gusersNum >= $row['max_users']) {
                        echo message(false, 'You currently have the maximum number of users allowed for your organization. Please contact us to increase your number of users.');
                    } else { ?>
                        <form action="../my-organization" method="post">
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
                    <? }
                } else { ?>
                    <h1 class="category">My Organization</h1>

                    <?= message(null, "You currently have $gusersNum of $row[max_users] maximum users for this organization.", true) ?>

                    <div class="btn-group" style="margin:0">
                        <input type="button" class="btn btn-green" onclick="window.location.href='./my-organization/invite'" value="Invite User"<?= $gusersNum == $row['max_users'] ? ' disabled' : '' ?>>
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
                                <?
                                if ($gusersNum == 0) {
                                    echo '<tr><td colspan="9" style="text-align:center">There are currently no users in this organizations.</td></tr>';
                                } else {
                                    $curUser = 1;
                                    while ($user = mysqli_fetch_assoc($gusers)) { ?>
                                        <tr>
                                            <td><?= $curUser ?> of <?= $row['max_users'] ?></td>
                                            <td><?= $user['first_name'] ?></td>
                                            <td><?= $user['last_name'] ?></td>
                                            <td><?= $user['email'] . ($user['email'] == $row['admin_email'] ? ' (Default)' : '') ?></td>
                                            <td><?= ago($user['last_active']) ?></td>
                                            <td><?= $user['status'] == 1 ? 'Active' : ($user['status'] == 0 ? 'Inactive' : 'Suspended') ?></td>
                                            <td><? if ($row['admin_email'] != $user['email']) {
                                                    echo "<a href=\"./my-organization/revoke?uid=$user[guid]\">remove</a>";
                                                } ?></td>
                                        </tr>
                                <?
                                        $curUser += $user['status'] == 1 ? 1 : 0;
                                    }
                                } ?>
                            </tbody>
                        </table>
                    </div>
                <? } ?>
            </div>
        </div>
    </div>
<? } ?>