<?
if (!$con2) {
    $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
}

$sql1 = mysqli_query($con2, "SELECT type, term FROM trails AS t LEFT JOIN categories AS c ON c.trail_id = t.id");
$sql2 = mysqli_query($con2, "SELECT type, keywords FROM trails");

while ($row = mysqli_fetch_assoc($sql1)) {
    $u = unserialize($row['term']);

    foreach ($u as $v) {
        if ($v) {
            $types[] = $row['type'];
            $act[] = $v;
        }
    }
}

while ($row = mysqli_fetch_assoc($sql2)) {
    if ($row['keywords']) {
        $u = unserialize($row['keywords']);

        foreach ($u as $v) {
            if ($v) {
                $kw[] = $v;
            }
        }
    }
}

asort($kw);
asort($act);
$kw = array_values(array_unique($kw));
array_unshift($kw, 'All Areas');

$act = array_unique($act);
foreach ($act as $k => $v) {
    $activity[] = [$types[$k] => $v];
}
//array_unshift($activity, ['trail' => 'All Activities']);

$trails_config = json_encode(array('config' => array('activities' => $activity, 'areas' => $kw)));
#print_r(json_decode($trails_config));