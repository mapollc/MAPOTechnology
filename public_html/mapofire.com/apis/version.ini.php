<?
$allVersions = ['1.0', '1.0.1', '1.1'];
$curVersion = '1.1';

foreach($allVersions as $v) {
    $versions[$v] = ($v == $curVersion ? true : false);
}

$returnJson = array('versions' => $versions);