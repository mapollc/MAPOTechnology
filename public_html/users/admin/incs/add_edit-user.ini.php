<?
#$stripeLive = true;
require_once 'user-permissions.inc.php';
include_once '/home/mapo/stripe/init.php';
include_once '/home/mapo/public_html/subs.inc.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);

// get users details
$row = prepareQuery('i', [$_GET['uid']], "SELECT u.uid AS userID, first_name, last_name, u.email, phone, location, u.created, last_active, ip_address, role, permissions FROM users AS u LEFT JOIN permissions AS p ON p.uid = u.uid WHERE u.uid = ? LIMIT 1");
$conf = mysqli_fetch_assoc(mysqli_query($con, "SELECT confirmed FROM confirmation WHERE email = '$row[email]' ORDER BY cid DESC LIMIT 1"));
$location = unserialize($row['location']);
$loc = $location ? $location->city . ', ' . convertState($location->state, 2) . ' ' . $location->zip : '';
$perms = unserialize($row['permissions']);

$customerID = mysqli_fetch_assoc(mysqli_query($con, "SELECT cid FROM billing WHERE email = '$row[email]' ORDER BY status ASC, created DESC LIMIT 1"))['cid'];

/*$sql2 = mysqli_query($con, "SELECT cid FROM billing WHERE email = '$row[email]' ORDER BY status ASC");
while ($billing = mysqli_fetch_assoc($sql2)) {
    if ($customerID == null) {
        $customerID = $billing['cid'];
    }
}*/
#$sql = mysqli_query($con, "SELECT sid, token, ip, host, source, location, created, expires FROM sessions WHERE uid = '$_GET[uid]' AND expires > $time ORDER BY created DESC");

/*$subs = [];
$sql9 = mysqli_query($con, "SELECT cid, subscription, plan, b.created, start, end, active FROM billing AS b LEFT JOIN users AS u ON u.email = b.email WHERE u.uid = $_GET[uid] ORDER BY b.created DESC, active DESC");

while ($data = mysqli_fetch_assoc($sql9)) {
    if ($data) {
        $sub = $data;
        $sub['details'] = getSub($data['plan']);

        $subs[] = $sub;
    }
}*/

if ($function == 'edit' && !$row) {
    echo errorCode('User account not found', 'The user account you\'re looking for does not exist.');
} else {
    for ($i = 0; $i < count($userPermissions); $i++) {
        $ex = isset($userPermissions[$i]['extra']) ? '[' . $userPermissions[$i]['extra'] . ']' : '';
        $thePerm = isset($userPermissions[$i]['extra']) ? $perms[$userPermissions[$i]['category']][$userPermissions[$i]['perm']][$userPermissions[$i]['extra']] : $perms[$userPermissions[$i]['category']][$userPermissions[$i]['perm']];
        $permCols .= '<div class="checkbox" style="display:block;margin-bottom:3px">' .
            '<input type="checkbox" id="p' . $i . '" name="perms[' . $userPermissions[$i]['category'] . '][' . $userPermissions[$i]['perm'] . ']' . $ex . '" value="1"' .
            ($thePerm == 1 ? ' checked' : '') . '>' .
            '<label for="p' . $i . '">' . $userPermissions[$i]['name'] . '</label></div>';

        /*if ($i % 2 == 0) {
            $col1 .= $permCols;
        } else {
            $col2 .= $permCols;
        }*/
    }
?>
    <h1><?= $function == 'create' ? 'Create New ' : 'Edit' ?> User Account<?= $function == 'edit' ? ': ' . $row['first_name'] . ' ' . $row['last_name'] : '' ?></h1>

    <h2 class="underline">User Details</h2>
    <form action="" method="post">
        <input type="hidden" name="mode" value="<?= $function ?>">
        <input type="hidden" name="location" value=''>
        <?= $function == 'edit' ? '<input type="hidden" name="uid" value="' . $_GET['uid'] . '">' : '' ?>

        <div class="row">
            <div class="col w50">
                <? if ($function == 'edit') { ?>
                    <div class="row">
                        <div class="col w50">
                            <label>User ID</label>
                            <input type="text" class="input" style="max-width:100px" <?= $customerID ? ' data-cid="' . $customerID . '"' : '' ?> value="<?= $row['userID'] ?>" disabled>
                        </div>
                        <div class="col w50">
                            <label>Customer ID</label>
                            <? if ($customerID) {
                                echo '<a target="blank" href="https://dashboard.stripe.com/customers/'.$customerID.'">'.$customerID.'</a>';
                            } else {
                                echo 'None';
                            } ?>
                        </div>
                    </div>
                <? } ?>

                <label>First Name</label>
                <input type="text" name="fname" class="input" placeholder="First Name" value="<?= $row['first_name'] ?>" required>

                <label>Last Name</label>
                <input type="text" name="lname" class="input" placeholder="Last Name" value="<?= $row['last_name'] ?>" required>

                <label>Email Address</label>
                <input type="email" name="email" class="input" placeholder="email@example.com" value="<?= $row['email'] ?>" required>

                <label>Phone Number</label>
                <input type="tel" name="phone" class="input" placeholder="555-555-5555" maxlength="12" value="<?= $row['phone'] ?>">

                <label>Location</label>
                <input type="text" class="input" disabled value="<?= $loc ?>">

                <label>Account Confirmed</label>
                <div class="radio" style="margin:0">
                    <input type="radio" id="cy" name="confirmed" value="1"<?=$conf['confirmed'] == 1 ? ' disabled checked' : ''?>>
                    <label for="cy">Yes</label>
                </div>
                <div class="radio" style="margin:0">
                    <input type="radio" id="cn" name="confirmed" value="0"<?=($conf['confirmed'] == 1 ? ' disabled' : '').($conf['confirmed'] == 0 ? ' checked' : '')?>>
                    <label for="cn">No</label>
                </div>

                <label>Role</label>
                <select name="role" class="input">
                    <option <?= $row['role'] == 1 ? 'selected ' : '' ?>value="1">Guest</option>
                    <option <?= $row['role'] == 2 ? 'selected ' : '' ?>value="2">Premium</option>
                    <option <?= $row['role'] == 4 ? 'selected ' : '' ?>value="4">Trail Moderator</option>
                    <option <?= $row['role'] == 3 ? 'selected ' : '' ?>value="3">Admin</option>
                </select>

                <? if ($function == 'edit') { ?>
                    <label>Account Created</label>
                    <p style="padding:0"><?= date('l, F j, Y g:i:s A', $row['created']) . ' (' . ago($row['created']) . ')' ?></p>

                    <label>Last Active</label>
                    <p style="padding:0"><?= $row['last_active'] ? date('l, F j, Y g:i:s A', $row['last_active']) . ' (' . ago($row['last_active']) . ')' : 'Never' ?></p>
                <? } ?>
            </div>
            <div class="col w50">
                <label>User Permissions</label>

                <? if (!$permission->user()->perms()) {
                    echo "<p>You don't have authorization to modify this user's permissions</p>";
                } else {
                    echo $permCols;
                } ?>
            </div>
        </div>

        <div class="btn-group">
            <input type="submit" name="action" class="btn btn-green" value="<?= ucfirst($function) ?> User">
            <input type="button" class="btn" onclick="window.location.href='../people'" value="Go Back">
            <input type="button" class="btn btn-red" onclick="window.location.href='../people/remove?uid=<?=$_GET['uid']?>'" value="Remove User">
        </div>
    </form>

    <?
    if ($function != 'create') {
        echo '<h2 class="underline" style="margin-top:1em">Subscriptions</h2>';

        if ($customerID) {
            try {
                $subs = $stripe->subscriptions->all(['customer' => $customerID, 'limit' => 10]);

                if (!$subs || count($subs->data) == 0) {
                    echo '<p>This user does not have any subscriptions.</p>';
                } else { ?>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Plan</th>
                                    <th>Status</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Recurring</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <? for ($i = 0; $i < count($subs->data); $i++) {
                                    $plan->setPlan(null, $subs->data[$i]->plan->id);
                                    //$billInt = 60 * 60 * 24 * (30 * $plan->getTerm());
                                ?>
                                    <tr>
                                        <td><?= $plan->getName() ?></td>
                                        <td><?= ($subs->data[$i]->cancel_at_period_end ? 'Canceled' : ucfirst($subs->data[$i]->status)) ?></td>
                                        <td><?= date('n/j/Y', $subs->data[$i]->current_period_start) ?></td>
                                        <td><?= date('n/j/Y', $subs->data[$i]->current_period_end) ?></td>
                                        <td><?= ucfirst($subs->data[$i]->plan->interval)?>ly</td>
                                        <td><a target="blank" href="https://dashboard.stripe.com/subscriptions/<?= $subs->data[$i]->id ?>">Manage</a></td>
                                    </tr>
                                <? } ?>

                            </tbody>
                        </table>
                    </div>
                <? }
            } catch (Exception $e) {
                print_r($e->getMessage());
            }
        } else {
            echo '<p>This user does not have any subscriptions.</p>';
        }
    }
} ?>