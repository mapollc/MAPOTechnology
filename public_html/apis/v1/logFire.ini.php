<?
//[{"wfid":"137670401","count":1,"data":{"wfid":"137670401","name":"Sawlog","state":"MT","type":"Wildfire","acres":1500,"discovered":1746133679,"updated":1746795873}},{"wfid":"137428042","count":1,"data":{"wfid":"137428042","name":"Promise","state":"OR","type":"Wildfire","acres":2.5,"discovered":1745638920,"updated":1746803619}}]
if (!$_REQUEST['data']) {
    $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'No click data was provided'];
} else {
    $time = time();
    $old = $time - 60 * 60 * 2;
    $fires = json_decode($_REQUEST['data'], true);

    mysqli_query($con, "DELETE FROM topFires WHERE time < '$old'");

    foreach ($fires as $fire) {
        $wfid = $fire['wfid'];
        $count = $fire['count'];
        $data = json_encode($fire['data']);

        prepareQuery('isissi', [
            $wfid,
            $data,
            $count,
            $time,
            $time,
            $count
        ], 
        "INSERT INTO topFires (wfid, data, count, time) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE time = ?, count = count + ?");
    }

    $returnJson = array('success' => '1');
}

/*if (!$_REQUEST['data']) {
    $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'No click data was provided'];
} else {
    $fires = json_decode($_REQUEST['data'], true);
    $file = '/home/mapo/public_html/apis/cache/event.json';
    $src = file_get_contents($file);

    if (!empty($src)) {
        function search($old, $id) {
            for ($i = 0; $i < count($old); $i++) {
                if ($old[$i]['wfid'] == $id) {
                    return $i;
                }
            }

            return -1;
        }
    }

    if (!file_exists($file) || empty($src)) {
        $data = $fires;
    } else {
        $old = json_decode($src, true);

        for ($i = 0; $i < count($fires); $i++) {
            $in = search($old, $fires[$i]['wfid']);
            
            if ($in < 0) {
                $old[] = $fires[$i];
            } else {
                $old[$in]['count'] = $old[$in]['count'] + $fires[$i]['count'];
            }
        }

        $data = $old;
    }

    $save = fopen($file, 'w');
    fwrite($save, json_encode($data));
    fclose($save);

    $returnJson = array('success' => '1');
}


/*$fires = json_decode($_REQUEST['data']);
$src = file_get_contents('./cache/event.json');

/*foreach($fires as $f) {
    $old[] = $f->a;
}

if ($events) {
    for ($i = 0; $i < count($events); $i++) {
        for ($x = 0; $x < $events[$i]->count; $x++) {
            $e[] = $events[$i]->wfid;
        }
    }
} else {
    $e = array();
}

$all = array_count_values(array_merge($old, $e));

foreach($all as $k => $v) {
    $arr[] = array('wfid' => $k, 'count' => $v);
}*/

/*function search($e, $id) {
    for ($i = 0; $i < count($e); $i++) {
        if ($e[$i]->wfid == $id) {
            return $i;
        }
    }
}

if ($src && $src != 'null' && $src != '') {
    $events = json_decode($src);
    print_r($fires);
    print_r($events);

    foreach ($fires as $f) {
        $pos = search($events, $f->fire->wfid);
        echo $pos;
    }

} else {
    foreach ($fires as $f) {
        $log[] = ['click' => $f->clicks, 'wfid' => $f->fire->wfid];
    }
}

$arr = $log;

$file = fopen('./cache/event.json', 'w');
fwrite($file, json_encode($arr));
fclose($file);

/*if ($src && $src != 'null' && $src != '') {
    $wfids = [];
    $upd = [];
    $log = [];
    $events = json_decode($src, true);

    foreach ($fires as $f) {
        $wfids[] = $f->fire->wfid;
        $upd[] = $f->fire->updated;
    }

    $add = false;
    foreach ($events as $e) {
        if (in_array($e['fire']['wfid'], $wfids)) {
            $e['clicks'] += 1;
            $e['fire']['updated'] = max($upd);

            $add = true;
        }

        $log[] = $e;
    }

    if (!$add) {
        $log[] = $fires[0];
    }

    $arr = $log;
} else {
    $arr = $fires;
}*/

#print_r($arr);
#$file = fopen('./cache/event.json', 'w');
#fwrite($file, json_encode($arr));
#fclose($file);

/*if ($_SESSION['uid']) {
    $e = mysqli_real_escape_string($con, serialize($fires));
    $time = time();
    mysqli_query($con, "INSERT INTO previous_fires (uid,entries,time) VALUES('$_SESSION[uid]','$e','$time')");
}*/