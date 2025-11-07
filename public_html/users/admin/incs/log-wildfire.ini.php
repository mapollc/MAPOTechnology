<?
$since = strtotime('-1 month');
$cachefilename = 'wildfire-changes';
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211); 
$cache = $memcache->get($cachefilename);

if (!$cache) {
    $sql = mysqli_query($con, "SELECT name, wfid, ah.incidentID, ah.acres, ah.updated FROM acres_history AS ah LEFT JOIN wildfires AS w ON w.incidentId = ah.incidentID WHERE w.type != 'Prescribed Fire' AND ah.updated > $since ORDER BY updated DESC");

    while ($data = mysqli_fetch_assoc($sql)) {
        $group[$data['incidentID']][] = [$data['acres'], $data['updated'], $data['name'], $data['wfid']];
    }

    $memcache->set($cachefilename, json_encode($group), 3600);
} else {
    $group = json_decode($cache);
}

foreach ($group as $k => $inc) {
    if (count($inc) > 1 && $inc[0][0] && $inc[1][0]) {
        $diff = $inc[0][0] - $inc[1][0];
        $verb = $diff == 0 ? 'not changed' : ($diff > 0 ? 'grown' : 'been resized');
        $color = $diff > 0 ? 'red' : '#000';
        $rows[] = [$diff, $inc[0][3], $inc[0][2].' (#' . $k . ') has ' . $verb . ' <span style="font-weight:600;color:'.$color.'">' . number_format($diff) . ' acres</span> in the last ' . str_replace([' ago', ', '], ['', ' and '], ago($inc[1][1]))];
    }
}
sort($rows);
$rows = array_reverse($rows);
?>
<h1>Significant Wildfire Changes</h1>

<span class="help">A list of size changes of wildfires in the US over the last 1 month.</span>

<div class="table-responsive">
    <table class="table">
        <thead class="sortable">
            <tr>
                <th>Entry</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
        <?foreach($rows as $entry) {
            echo "<tr><td>$entry[2]</td><td><a target=\"blank\" href=\"https://mapofire.com/f/$entry[1]\">View on map</td></tr>";
        }?>
        </tbody>
    </table>
</div>