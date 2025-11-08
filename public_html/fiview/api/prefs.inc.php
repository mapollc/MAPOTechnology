<?
$settings = serialize(array('default_dispatch_units' => $_REQUEST['default_dispatch_units'],
                            'default_dispatch_incs' => $_REQUEST['default_dispatch_incs'],
                            'filter-log' => $_REQUEST['filter_log']));

mysqli_query($con, "UPDATE $db.users SET settings = '$settings' WHERE uid = '$_SESSION[uid]'") or die(mysqli_error($con));

$return = array('success' => 1);
?>