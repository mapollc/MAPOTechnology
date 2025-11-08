<?
exit();
header('Content-type: application/json');
$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

function words($s) {
    return count(array_filter(preg_split('/\s/', strip_tags($s))));
}

$sql1 = mysqli_fetch_assoc(mysqli_query($con2, "SELECT COUNT(DISTINCT(t.id)) as totalTrails, COUNT(m.id) as totalMedia FROM trails AS t LEFT JOIN media AS m on m.trail_id = t.id"));

$sql2 = mysqli_query($con2, "SELECT stats, route FROM trails LEFT JOIN stats ON stats.trail_id = trails.id");
while ($row = mysqli_fetch_assoc($sql2)) {
    $s = unserialize($row['stats']);
    $dist[] = $s['distance'];
    $elev[] = $s['elevation']['max'];

    $gain[] = $s['altitude']['gain'];
    $loss[] = $s['altitude']['loss'];

    $words[] = words($row['route']);
}

mysqli_close($con2);

$total_distance = array_sum($dist);
$total_words = array_sum($words);
$stats = array('totals' => ['trails' => $sql1['totalTrails'], 'media' => $sql1['totalMedia']],
                'distance' => $total_distance, 'avg' => $total_distance / count($dist), 'max' => max($dist), 'alt' => max($elev),
                'loss' => array_sum($loss) / count($loss), 'gain' => array_sum($gain) / count($gain), 'words' => ['total' => $total_words, 'avg' => $total_words / count($words)]);

echo json_encode($stats);