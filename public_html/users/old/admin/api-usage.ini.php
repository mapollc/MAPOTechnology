<?
if ($user['permissions']['view']['api'] != 1) {
    echo invalidPermissions();
} else {
$includeChartjs = true;
$start = strtotime(date('n/j/Y').' 12:00:00 AM');
$start2 = strtotime('1/1/'.date('Y').' 12:00:00 AM');
$end = strtotime(date('n/j/Y').' 11:59:59 PM');
$hty = ($end - $start2) / (60 * 60);
for ($i = 0; $i < 24; $i++) {
    $count[$i] = 0;
    $times[$i] = 0;
    $lab[] = date('g A', ($start + ($i * 60 * 60)));
}

$sql = mysqli_query($con, "SELECT * FROM apiUsage WHERE time >= $start AND time <= $end ORDER BY time DESC");
$sql2 = mysqli_query($con, "SELECT domain, COUNT(apiUsage.token) AS total, AVG(elapsed) AS elapsed FROM apiUsage LEFT JOIN apitokens ON apitokens.token = apiUsage.token WHERE elapsed >= 0 AND time >= $start2 GROUP BY apiUsage.token ORDER BY total DESC");
$sql3 = mysqli_query($con, "SELECT request, COUNT(request) AS total FROM apiUsage WHERE request != '' GROUP BY request ORDER BY total DESC LIMIT 15");

while ($row = mysqli_fetch_assoc($sql)) {
    for ($i = 0; $i < 24; $i++) {
        $x = $i + 1;
        if ($row['time'] >= ($start + ($i * 60 * 60)) && $row['time'] <= ($start + ($x * 60 * 60))) {
            $count[$i]++;
            $times[$i] = round(floatval($row['elapsed'] >= 0 ? $row['elapsed'] : 0), 4);
        }
    }

    if ($row['response'] == 0) {
        $successful++;
    } else {
       $failed++;
    }
}
$total = $successful + $failed;
?>
<div class="row">
    <div class="col">
        <div class="card">
            <h3>API Requests - Today</h3>
            <canvas id="chart1" style="width:100%;height:300px;padding:15px 0"></canvas>
            <p><b>Successful Responses:</b> <?=$successful?> (<?=round(($successful/$total)*100, 1)?>%) &middot; 
            <b>Failed Responses:</b> <?=$failed?> (<?=round(($failed/$total)*100, 1)?>%)</p>
        </div>
        <div class="card">
            <h3>API Response Time - Today</h3>
            <canvas id="chart2" style="width:100%;height:300px;padding:15px 0"></canvas>
        </div>

        <div class="card">
            <h3>Top API Users YTD</h3>
            
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr><th>API User</th><th>Count</th><th>Requests/Hour<th>Avg. Response Time</th></tr>
                    </thead>
                    <tbody>
                        <?while($row = mysqli_fetch_assoc($sql2)){
                            echo '<tr><td>'.($row['domain'] ? $row['domain'] : 'Unknown').'</td><td>'.number_format($row['total']).'</td>'.
                                '<td>'.round($row['total'] / $hty, 2).'</td><td>'.round($row['elapsed'], 3).' secs</td></tr>';
                        }?>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h3>Top Requests YTD</h3>
            
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr><th>Request</th><th>Count</th><th>Avg/Day</th></tr>
                    </thead>
                    <tbody>
                        <?while($row = mysqli_fetch_assoc($sql3)){
                            echo '<tr><td>'.$row['request'].'</td><td>'.number_format($row['total']).'</td><td>'.number_format($row['total'] / round((time() - $start2) / (60 * 60 * 24))).'</td></tr>';
                        }?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>var labels = <?=json_encode($lab)?>, dataset = <?=json_encode($count)?>, dataset2 = <?=json_encode($times)?>;</script>
<?}?>