<?
if (!isset($_REQUEST['day'])) {
    $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'A date was not supplied'];
    return;
}

$day = str_pad($_REQUEST['day'], 3, '0', STR_PAD_LEFT);
$data = json_decode(file_get_contents("/home/mapo/public_html/mapofire.com/data/maps/spcfire/$day.json"));

$returnJson = $data;