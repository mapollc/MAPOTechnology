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

        executeQuery('isissi', [
            $wfid,
            $data,
            $count,
            $time,
            $time,
            $count
        ], 
        "INSERT INTO topFires (wfid, data, count, time) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE time = ?, count = count + ?");
    }

    $returnJson = ['success' => '1'];
}