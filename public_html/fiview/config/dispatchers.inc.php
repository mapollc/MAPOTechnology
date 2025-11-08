<?
// Check if user has permissions to add or edit
if(!in_array('editUsers', $userPermissions)&&!in_array('addUsers', $userPermissions)){
 require_once('noauth.ini.php');
 exit();
}

$perms[] = array('name' => 'cad', 'desc' => 'Allow this user to change configuration settings for CAD');
$perms[] = array('name' => 'defaults', 'desc' => 'Allow this user to change dispatch zone names, incident types, jurisdiction names, and agency units');
$perms[] = array('name' => 'addUsers', 'desc' => 'Allow this user to add new dispatchers');
$perms[] = array('name' => 'editUsers', 'desc' => 'Allow this user to edit existing dispatchers');
$perms[] = array('name' => 'editPerms', 'desc' => 'Allow this user to edit permissions for dispatchers');
$perms[] = array('name' => 'addResources', 'desc' => 'Allow this user to add new resources in CAD');
$perms[] = array('name' => 'editResources', 'desc' => 'Allow this user to edit existing resources in CAD');
$perms[] = array('name' => 'responseLevels', 'desc' => 'Allow this user to add/edit response levels in CAD');
$perms[] = array('name' => 'setResponse', 'desc' => 'Allow this user to set response levels for zones in CAD');
$cadperms[] = array('name' => 'changeIA', 'desc' => 'Allow dispatcher to change whether a resource is available for incident assignment');

if ($_GET['mode']) {
    // Check if user has permissions to add or edit
    if (($_GET['mode'] == 'add' && !in_array('addUsers', $userPermissions)) || ($_GET['mode'] == 'edit' && !in_array('editUsers', $userPermissions))) {
        require_once('noauth.ini.php');
        exit();
    }

    // On form submit, update or insert data into mysql
    if(isset($_POST['action'])){
        $permissions = serialize($_POST['perms']);
        $fname = mysqli_real_escape_string($con, $_POST['first_name']);
        $lname = mysqli_real_escape_string($con, $_POST['last_name']);
        $uname = mysqli_real_escape_string($con, $_POST['username']);
        $bool = mysqli_num_rows(mysqli_query($con, "SELECT uid FROM $db.users WHERE agency = '$agency' AND (first_name = '$_POST[first_name]' AND last_name = '$_POST[last_name]')"));
        
        if(!$fname){ $errors += 1; $errorMsg .= 'You must enter a first name.<br>'; }
        if(!$lname){ $errors += 1; $errorMsg .= 'You must enter a last name.<br>'; }
        if($bool>0&&$_POST['action']=='Add Dispatcher'){ $errors += 1; $errorMsg .= 'This dispatcher already exists.</b><br>'; }
        if(!$uname){ $errors += 1; $errorMsg .= 'You must enter a username.<br>'; }
        if(!$_POST['role']){ $errors += 1; $errorMsg .= 'This dispatcher must be assigned a role.<br>'; }

        if($errors == 0) {
            if ($_POST['action']=='Save Changes') {
                $actionSQL = "UPDATE $db.users SET first_name = '$fname', last_name = '$lname', username = '$uname', role = '$_POST[role]', permissions = '$permissions', active = '$_POST[active]' $resetpass WHERE uid = '$_POST[uid]'";
                $success = 'You successfully made changes to <b>'.$fname.' '.$lname.'.</b>';
            } else if ($_POST['action']=='Add Dispatcher') {
                $actionSQL = "INSERT INTO $db.users (first_name,last_name,username,role,permissions,settings,agency,resetPass,active) VALUES('$fname','$lname','$uname','$_POST[role]','$permissions','','$agency','1','$_POST[active]')";
                $success = 'You successfully added <b>'.$fname.' '.$lname.'</b> ('.$_POST['role'].') to '.$software_name.'.';
            }
        
            mysqli_query($con, $actionSQL) or die(mysqli_error($con));
        }
    }
 
    if (isset($_POST['resetPass'])) {
        mysqli_query($con, "UPDATE $db.users SET resetPass = 1 WHERE uid = '$_POST[uid]'");
        $success = 'You reset '.$_POST['first_name'].' '.$_POST['last_name'].'\'s password. They will change their password the next time they login.';
    }
    
    $roles = unserialize(mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'roles'"))[value]);
    
    if ($_GET[mode] == 'edit'){
        $u = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.users WHERE uid = '$_GET[uid]'"));
        $curPerms = unserialize($u['permissions']);
    }
    ?>
    <h1><?=($_GET[mode]=='add' ? 'Add New Dispatcher' : 'Edit Dispatcher: '.$u['last_name'].', '.$u['first_name'])?></h1>

    <?if($success){?>
    <div id="message" class="success inline"><div class="text"><?=$success?></div></div>
    <?}?>

    <?if($errors > 0){?>
    <div id="message" class="error inline"><div class="text"><?=$errorMsg?></div></div>
    <?}?>

    <form action="" method="post">
    <?if($u){?><input type="hidden" name="uid" value="<?=$u['uid']?>"><?}?>

    <div class="row">
    <div class="col w-6">

    <b class="req">First Name</b>
    <input type="text" name="first_name" placeholder="First Name" value="<?=($u['first_name'] ? $u['first_name'] : $_POST['first_name'])?>">

    <b class="req">Last Name</b>
    <input type="text" name="last_name" placeholder="Last Name" value="<?=($u['last_name'] ? $u['last_name'] : $_POST['last_name'])?>">

    <b class="req">Username</b>
    <input type="text" name="username" placeholder="Username" value="<?=($u['username'] ? $u['username'] : $_POST['username'])?>">

    <b class="req">Role</b>
    <select name="role"><option value="">- Choose Role -</option>
    <?foreach ($roles as $role) {
        echo '<option '.($u['role']==$role||$_POST['role']==$role ? 'selected ' : '').'value="'.$role.'">'.$role.'</option>';
    }?>
    </select>

    <b class="req">Active User</b>
    <select name="active" style="max-width:100px">
    <option <?=($u['active']==1 ? 'selected ' : '')?>value="1">Yes</option><option <?=($u['active']==0 ? 'selected ' : '')?>value="0">No</option>
    </select>

    </div>
    <div class="col w-6">
    <b>Admin Permissions</b>
    <?if (in_array('editPerms', $userPermissions)) {
        for($i=0;$i<count($perms);$i++){
            echo '<div class="checkbox"><input type="checkbox" name="perms[]" id="'.$perms[$i][name].'" value="'.$perms[$i][name].'"'.(in_array($perms[$i][name], $curPerms)||in_array($perms[$i][name], $_POST['perms']) ? ' checked' : '').'><label for="'.$perms[$i][name].'">'.$perms[$i][desc].'</label></div>';
        }
    }else{
        echo '<p style="color:var(--red)">You are not allowed to edit user admin permissions.</p>';
    }?>

    <br><b>CAD Permissions</b>
    <?if (in_array('editPerms', $userPermissions)) {
        for($i=0;$i<count($cadperms);$i++){
            echo '<div class="checkbox"><input type="checkbox" name="perms[]" id="'.$cadperms[$i][name].'" value="'.$cadperms[$i][name].'"'.(in_array($cadperms[$i][name], $curPerms)||in_array($cadperms[$i][name], $_POST['perms']) ? ' checked' : '').'><label for="'.$cadperms[$i][name].'">'.$cadperms[$i][desc].'</label></div>';
        }
    } else {
        echo '<p style="color:var(--red)">You are not allowed to edit dispatcher CAD permissions.</p>';
    }?>
    </div>
    </div>

    <input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="<?=($_GET[mode]=='edit' ? 'Save Changes' : 'Add Dispatcher')?>">
    <?if($_GET[mode]=='edit'){?><input type="submit" class="btn dark" style="margin-right:0.5em" name="resetPass" value="Reset Password"><?}?>
    <input type="button" class="btn" onclick="window.location.href='../dispatchers'" value="Go Back">
    </form>

<?} else {
    $au = mysqli_query($con, "SELECT * FROM $db.users WHERE agency = '$agency' ORDER BY last_name ASC");
    ?>
    <h1><?=$adminTitle?></h1>

    <p class="help">Manage all dispatchers/users within <?=$software_name?> for your dispatch center</p>

    <?if(in_array('addUsers', $userPermissions)){?>
    <input type="button" class="btn blue" onclick="window.location.href='dispatchers/add'" value="Add Dispatcher">
    <?}?>

    <div class="table-responsive">
        <table class="table table-striped">
            <thead>
                <tr><th>UID</th><th>First Name</th><th>Last Name</th><th>Role</th><th>Last Login</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
            <?while($u = mysqli_fetch_assoc($au)){?>
                <tr>
                    <td><?=$u['uid']?></td>
                    <td><?=$u['first_name']?></td>
                    <td><?=$u['last_name']?></td>
                    <td><?=$u['role']?></td>
                    <td><?=($u['time'] ? timeAgo($u['time']) : '')?></td>
                    <td><?=($u['active']==1 ? 'Yes' : 'No')?></td>
                    <td><?if(in_array('editUsers', $userPermissions)){?><a href="dispatchers/edit?uid=<?=$u['uid']?>">edit</a><?}?></td>
                </tr>
            <?}?>
            </tbody>
        </table>
    </div>
<?}?>