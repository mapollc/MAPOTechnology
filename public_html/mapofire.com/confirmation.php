<?
header('Content-type: application/json');
session_start();

if (isset($_GET['checkout_id'])) {
    $resp = array('response' => isset($_GET['failed']) ? 'failed' : 'success', 'id' => $_GET['checkout_id']);
} else if ($_GET['resume'] == 1) {
    $resp = array('response' => 'success', 'resume' => true, 'modify' => false, 'cancel' => false, 'method' => null);
} else if ($_GET['modify'] == 1) {
    $resp = array('response' => 'success', 'resume' => false, 'modify' => true, 'cancel' => false, 'method' => $_GET['method']);
} else if ($_GET['cancel'] == 1) {
    $resp = array('response' => 'success', 'resume' => false, 'modify' => false, 'cancel' => true, 'method' => $_GET['when']);
} else {
    $resp = array('response' => 'error');
}

echo json_encode($resp);
/*include('./db.ini.php');

$email = mysqli_real_escape_string($con, $_GET['email']);
$token = $_GET['token'];

if ($email && $token) {
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT token, confirmed FROM confirmation WHERE email = '$email'"));

    if (!$row) {
        $msg = 'email doesnt exist';
    } else {
        if ($token == $row['token']) {
            if ($row['confirmed'] == 0) {
                $msg = 'success';
                mysqli_query($con, "UPDATE confirmation SET confirmed = 1 WHERE email = '$email' AND token = '$token'");
            } else {
                $msg = 'this token has already been used';
            }
        } else {
            $msg = 'tokens dont match';
        }
    }
} else {
    $msg = 'invalid email or token';
}

echo $msg;*/