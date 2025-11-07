<?
$sql1 = mysqli_query($con, "SELECT state, unit, agency, area FROM dispatch_zones ORDER BY unit ASC");
$sql2 = mysqli_query($con, "SELECT REPLACE(SUBSTRING(incidentID, 6, 6), '-', '') AS unit, COUNT(*) AS total FROM wildfires WHERE year = 2023 GROUP BY REPLACE(SUBSTRING(incidentID, 6, 6), '-', '') ORDER BY total DESC");
$sql3 = mysqli_query($con, "SELECT state, year, COUNT(*) AS total FROM wildfires GROUP BY state, year ORDER BY total DESC, year DESC");

while ($row = mysqli_fetch_assoc($sql1)) {
    $zones[$row['unit']][] = array('state' => $row['state'], 'agency' => $row['agency'], 'area' => $row['area']);
}

while ($row = mysqli_fetch_assoc($sql2)) {
    if ($zones[$row['unit']][0]['agency']) {
        $table .= '<tr><td>'.$zones[$row['unit']][0]['state'].'</td><td>'.$row['unit'].'</td><td>'.$zones[$row['unit']][0]['agency'].'</td>'.
                '<td>'.$zones[$row['unit']][0]['area'].'</td><td>'.number_format($row['total'], 0).'</td></tr>';

        $count[$zones[$row['unit']][0]['agency']] += $row['total'];
    }
}
asort($count);
$events = array_reverse($count);

while ($row = mysqli_fetch_assoc($sql3)) {
    $table2 .= '<tr><td>'.convertState($row['state'], 1).'</td><td>'.$row['year'].'</td><td>'.number_format($row['total']).'</td></tr>';
}
?>
<h2>Growing Wildfires</h2>



<h2>Total Incidents by Agency</h2>
<div class="table-responsive">
    <table class="table">
        <thead>
            <tr>
                <th>Agency</th>
                <th>Total Incidents</th>
            </tr>
        </thead>
        <tbody>
        <?foreach ($events as $a => $t) {
            echo '<tr><td>'.$a.'</td><td>'.number_format($t, 0).'</td></tr>';
        }?>
        </tbody>
    </table>
</div>

<h2 style="margin-top:1em">Total Incidents by Unit</h2>
<div class="table-responsive">
    <table class="table">
        <thead>
            <tr>
                <th>State</th>
                <th>Unit</th>
                <th>Agency</th>
                <th>Area</th>
                <th>Total Incidents</th>
            </tr>
        </thead>
        <tbody>
            <?=$table?>
        </tbody>
    </table>
</div>

<h2 style="margin-top:1em">Total Incidents by Year & State</h2>
<div class="table-responsive">
    <table class="table">
        <thead>
            <tr>
                <th>State</th>
                <th>Year</th>
                <th>Total Incidents</th>
            </tr>
        </thead>
        <tbody>
            <?=$table2?>
        </tbody>
    </table>
</div>