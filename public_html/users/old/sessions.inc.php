<?
if (isset($_POST['confirm']) && $_POST['confirm'] == 'Yes, I\'m sure') {
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid, expires FROM sessions WHERE sid = '$_POST[sid]'"));

    if ($row['uid'] != $_SESSION['uid']) {
        echo message(false, 'You have insufficient permissions to terminate that session. <a href="../../settings">Go back</a>.');
    } else if ($row['expires'] == 0) {
        echo message(false, 'This session has already expired or been manually terminated. <a href="../../settings">Go back</a>.');
    } else {
        mysqli_query($con, "UPDATE sessions SET expires = 0 WHERE sid = '$_POST[sid]'");
        header('Location: '.$baseURL.'account/settings?sess_del=1');
    }
}
?>
<div class="row" style="display:flex;justify-content:center">
    <div class="col w-6">
        <div class="card">
            <h1 style="margin-bottom:25px">Terminate Session</h1>
            
            <p style="font-size:20px;margin-bottom:15px">By terminating this session, you will have to re-login on whatever device you used. Are you sure you want to end this session?</p>

            <form action="" method="post">
                <input type="hidden" name="sid" value="<?=$_GET['sid']?>">
                <div class="btn-group">
                    <input type="submit" class="btn btn-green" name="confirm" value="Yes, I'm sure">
                    <input type="button" class="btn btn-red" onclick="history.go(-1)" value="No">
                </div>
            </form>
        </div>
    </div>
</div>