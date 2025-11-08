<?
include_once('../includes.inc.php');

/*$us = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM $db.users WHERE uid = '$_SESSION[uid]'"));
$pref = unserialize($us[settings]);*/
$pageTitle = $software_name.' - Activity Log';
$cssArray = array('fonts','fa','main','admin'/*,'dispatch'/*,'jquery'*/);

include_once('../header.inc.php');

$start = strtotime(($_POST['start'] ? $_POST['start'].' '.date('T') : date('n/j/Y').' 00:00'));
$end = strtotime(($_POST['end'] ? $_POST['end'].' '.date('T') : date('n/j/Y').' 23:59'));
$sql = mysqli_query($con, "SELECT which, f, t, details, inc, log.time, CONCAT(first_name, ' ', last_name) AS dispatcher FROM $db.log LEFT JOIN $db.users ON users.uid = log.uid WHERE log.agency = '$agency' AND log.time >= '$start' AND log.time <= '$end' ORDER BY time DESC");
?>

<main class="page">
    <div class="container">
        <div class="row">
            <div class="col w-12">
                <div class="card">
                    <h1><?=strtoupper($agency)?> Activity Log</h1>

                    <form action="" method="post">
                        <b>Start:</b> <input type="datetime-local" name="start" style="display:inline-block;max-width:185px;font-size:15px" value="<?=($_POST['start'] ? $_POST['start'] : date('Y-m-d').' 00:00')?>">
                        <b>End:</b> <input type="datetime-local" name="end" style="display:inline-block;max-width:185px;font-size:15px" value="<?=($_POST['end'] ? $_POST['end'] : date('Y-m-d').' 23:59')?>">
                        <input type="submit" class="btn blue" style="margin:0 10px" value="Search">
                        <a href="#" class="btn dark" onclick="window.location.href = 'reports/log/print?start=<?=($_POST['start'] ? $_POST['start'] : date('Y-m-d').' 00:00')?>&end=<?=($_POST['end'] ? $_POST['end'] : date('Y-m-d').' 23:59')?>';return false"><i class="far fa-print"></i> Print</a>
                    </form>

                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr><th style="width:100px">Date</th><th style="width:100px">Time</th><th style="width:150px">From</th><th style="width:175px">To</th><th>Details</th></tr>
                            </thead>
                            <tbody>
                            <?while($row = mysqli_fetch_assoc($sql)){
                            if ($row['which'] == 1) {
                            #$msg = 'Status changed:&nbsp;' + unitStatus(st) + (r.response.log[i].inc ? (st == 'com' || st == 'enr' ? ' to' : ' of') + '&nbsp;Incident #' + r.response.log[i].inc : '');
                                $msg = 'Status changed: <span class="status '.$row['details'].'" style="margin-right:0">'.$resource_status[$row['details']].'</span>'.($row['inc'] ? ($row['details'] == 'com' || $row['details'] == 'enr' ? ' to' : ' of').' Incident #'.$row['inc'] : '');
                            } else if ($row['which'] == 2) {
                                $msg = $row['details'];
                            }
                            ?>
                                <tr>
                                <td><?=date('n/j/Y', $row['time'])?></td>
                                <td><?=date('H:i:s', $row['time'])?></td>
                                <td style="font-weight:bold"><?=($row['f'] ? $row['f'] : 'CAD')?></td>
                                <td><?=$row['dispatcher']?></td>
                                <td><?=$msg?></td>
                                </tr>
                            <?}?>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div> 
    </div>
</main>

<?=javascriptConfig()?>
<?=js(array('jquery','main'))?>

</body></html>