<?
#use function PHPSTORM_META\map;
$time = time();

if ($function == 'add') {
    if (isset($_POST['action'])) {
        $time = time();
        $fname = mysqli_real_escape_string($con, $_POST['fname']);
        $lname = mysqli_real_escape_string($con, $_POST['lname']);
        $email = mysqli_real_escape_string($con, $_POST['email']);
        $role = mysqli_real_escape_string($con, $_POST['role']);
        $p = preg_replace('/([^0-9])/', '', $_POST['phone']);
        $p = substr($p, 0, 3).'-'.substr($p, 3, 3).'-'.substr($p, 6, 4);
        $phone = mysqli_real_escape_string($con, $p);
        $l = ($_POST['location'] != '' ? mysqli_real_escape_string($con, serialize(json_decode($_POST['location']))) : '');

        $perms = serialize($_POST['perms']);

        mysqli_query($con, "INSERT INTO users (first_name,last_name,email,password,last_active,created,role,phone,location,profilePic,provider) VALUES('$fname','$lname','$email','','','$time','$role','$phone','$l','','0')");
        $uid = mysqli_insert_id($con);
        mysqli_query($con, "INSERT INTO permissions (uid,permissions,time) VALUES('$uid','$perms','$time')");
        mysqli_query($con, "INSERT INTO settings (uid,settings,method,time) VALUES('$uid','','0','$time')");
        mysqli_query($con, "INSERT INTO trail_settings (uid,settings,method,time) VALUES('$uid','','0','$time')");
        mysqli_query($con, "INSERT INTO oreroads_settings (uid,settings,app_token,time) VALUES('$uid','','','$time')");

        logEvent('Created a new user account (<a href="https://www.mapotechnology.com/account/admin/people/edit?uid='.$uid.'">#'.$uid.'</a>)');
        header('Location: edit?created=1&uid='.$uid);
    }
} else if ($function == 'edit') {
    include_once 'UserAgentParse.inc.php';
    include_once '/home/mapo/public_html/subs.inc.php';

    $subs = mysqli_query($con, "SELECT b.* FROM billing AS b LEFT JOIN users AS u ON b.email = u.email WHERE u.uid = $_GET[uid] ORDER BY active DESC, start DESC");
    while ($row = mysqli_fetch_assoc($subs)) {
        if ($row['active'] == 1) {
            $bill[] = $row;
        } else {
            $bill2[] = $row;
        }
    }

    if (isset($_POST['action'])) {
        $fname = mysqli_real_escape_string($con, $_POST['fname']);
        $lname = mysqli_real_escape_string($con, $_POST['lname']);
        $email = mysqli_real_escape_string($con, $_POST['email']);
        $role = mysqli_real_escape_string($con, $_POST['role']);
        $p = preg_replace('/([^0-9])/', '', $_POST['phone']);
        $p = substr($p, 0, 3).'-'.substr($p, 3, 3).'-'.substr($p, 6, 4);
        $phone = mysqli_real_escape_string($con, $p);

        if ($_POST['location'] != '') {
            $l = mysqli_real_escape_string($con, serialize(json_decode($_POST['location'])));
            mysqli_query($con, "UPDATE users SET location = '$l' WHERE uid = '$_POST[uid]'");
        }

        $perms = serialize($_POST['perms']);

        mysqli_query($con, "UPDATE users SET first_name = '$fname', last_name = '$lname', email = '$email', phone = '$phone', role = '$role' WHERE uid = '$_POST[uid]'");
        mysqli_query($con, "INSERT INTO permissions (uid,permissions,time) VALUES('$_POST[uid]','$perms','$time') ON DUPLICATE KEY UPDATE permissions = '$perms'") or die(mysqli_error($con));

        logEvent('Modified a user account (<a href="https://www.mapotechnology.com/account/admin/people/edit?uid='.$_POST['uid'].'">#'.$_POST['uid'].'</a>)');
        echo message(true, '<b>'.$fname.' '.$lname.'</b>\'s account was successfully updated.');
    }   
}

if ($function == 'edit' ||$function == 'remove') {
    // get users details
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM users AS u LEFT JOIN permissions AS p ON p.uid = u.uid WHERE u.uid = '$_GET[uid]'"));
    $location = unserialize($row['location']);
    $perms = unserialize($row['permissions']);
    $sql = mysqli_query($con, "SELECT sid, token, ip, host, source, location, created, expires FROM sessions WHERE uid = '$_GET[uid]' AND expires > $time ORDER BY created DESC");

    if ($_GET['created'] == 1) {
        echo message(true, 'An account for <b>'.$row['first_name'].' '.$row['last_name'].'</b> was successfully created.');
    }
}
?>
<div class="row">
    <div class="col">
        <?
        // remove a user
        if ($function == 'remove') {
            include($_SERVER['DOCUMENT_ROOT'].'/users/admin/incs/remove-user.ini.php');            
        
        // add or edit a user
        } else if ($function == 'add' || $function == 'edit') {
            include($_SERVER['DOCUMENT_ROOT'].'/users/admin/incs/add_edit-user.ini.php');            

        // table view of all users
        } else {
            if (isset($_GET['q'])) {
                $where = "WHERE first_name LIKE '%".$_GET['q']."%' OR last_name LIKE '%".$_GET['q']."%' OR email LIKE '%".$_GET['q']."%'";
            }
            $sql = mysqli_query($con, "SELECT uid, first_name, last_name, email, role, created, last_active FROM users $where ORDER BY uid ASC LIMIT 50");
            ?>
        <div class="card">
            <form action="" method="get">
                <input type="text" class="input" style="display:inline-block;max-width:300px" name="q" placeholder="Search users..." value="<?=($_GET['q'] ? $_GET['q'] : '')?>">
                <div class="btn-group">
                    <input type="submit" class="btn btn-blue" value="Search">
                    <?if($user['permissions']['user']['add']){?><a class="btn btn-green" href="./people/add">Add New User</a><?}?>
                </div>
            </form>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email Address</th>
                            <th>Permissions</th>
                            <th>Last Active</th>
                            <th>User Since</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?while($row = mysqli_fetch_assoc($sql)) {?>
                        <tr>
                            <td><?=$row['first_name']?></td>
                            <td><?=$row['last_name']?></td>
                            <td><?=$row['email']?></td>
                            <td><?=($row['role']==1 ? '<i class="fa-solid fa-user" title="General User"></i>' : '')?>
                                <?=($row['role']==2 ? '<i class="fa-solid fa-badge-check" title="Premium Access"></i>' : '')?>
                                <?=($row['role']==4 ? '<i class="fa-solid fa-person-hiking" title="Trail Moderator"></i>' : '')?>
                                <?=($row['role']==3 ? '<i class="fa-solid fa-lock" title="Administrative User"></i>' : '')?></td>
                            <td><?=($row['last_active'] ? ago($row['last_active']) : '--')?></td>
                            <td><?=ago($row['created'])?></td>
                            <td><?if($user['permissions']['user']['edit']){?><a href="people/edit?uid=<?=$row['uid']?>">edit</a><?}
                            if($user['permissions']['user']['delete']){?> | <a href="people/remove?uid=<?=$row['uid']?>">remove</a><?}?></td>
                        </tr>
                        <?}?>
                    </tbody>
                </table>
            </div>
        </div>
        <?}?>
    </div>
</div>