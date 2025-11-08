<?
ini_set('display_errors',1);
error_reporting(E_ALL);
include_once '../db.ini.php';
/* => ﻿GEOID
            [1] => STUSPS
            [2] => NAME
            [3] => STATE_NAME
            [4] => STATEFP
            [5] => COUNTYFP
            [6] => COUNTYNS
            [7] => POP
            [8] => TOTAL_BUILDINGS
            [9] => BUILDINGS_FRACTION_ME
            [10] => BUILDINGS_FRACTION_IE
            [11] => BUILDINGS_FRACTION_DE
            [12] => BP_STATE_RANK
            [13] => BP_NATIONAL_RANK
            [14] => RISK_STATE_RANK
            [15] => RISK_NATIONAL_RANK*/
function c($v) {
    return floatval(str_replace('%', '', $v) / 100);
}

$json = array_map('str_getcsv', file('wrc.csv'));

for ($i = 1; $i < count($json); $i++) {
#for ($i = 2240; $i < 2242; $i++) {
    $fips = $json[$i][0];
    $state = $json[$i][1];
    $statename = $json[$i][3];
    $county = mysqli_real_escape_string($con, explode(', ', $json[$i][2])[0]);
    $pop = $json[$i][7];
    $bldg = $json[$i][8];
    $bldg_me = c($json[$i][9]);
    $bldg_ie = c($json[$i][10]);
    $bldg_de = c($json[$i][11]);
    $bp_state = c($json[$i][12]);
    $bp_nation = c($json[$i][13]);
    $rps_state = c($json[$i][14]);
    $rps_nation = c($json[$i][15]);
    
    if ($rps_nation < .4) {
        $rank2 = 'Low';
    } else if ($rps_nation >= .4 && $rps_nation < .7) {
        $rank2 = 'Medium';
    } else if ($rps_nation >= .7 && $rps_nation < .9) {
        $rank2 = 'High';
    } else {
        $rank2 = 'Very High';
    }

    if ($bp_nation < .4) {
        $rank1 = 'Low';
    } else if ($bp_nation >= .4 && $bp_nation < .7) {
        $rank1 = 'Medium';
    } else if ($bp_nation >= .7 && $bp_nation < .9) {
        $rank1 = 'High';
    } else {
        $rank1 = 'Very High';
    }

    $arr = array('pop' => $pop, 'buildings' => ['count' => $bldg, 'me' => $bldg_me, 'ie' => $bldg_ie, 'de' => $bldg_de],
    'bp' => ['rank' => $rank1, 'state' => $bp_state, 'us' => $bp_nation], 'rps' => ['rank' => $rank2, 'state' => $rps_state, 'us' => $rps_nation]);
    $data = mysqli_real_escape_string($con, serialize(json_encode($arr)));

    mysqli_query($con, "INSERT INTO risk (fips,state,county,data) VALUES('$fips','$state','$county','$data')");
}

mysqli_close($con);