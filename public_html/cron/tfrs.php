<?
ini_set('display_errors',1);
header('Content-type: application/json');
include('../db.ini.php');

function artcc($c) {
    switch ($c) {
        case 'ZAB': $n = 'Albuquerque'; break;
        case 'ZAN': $n = 'Anchorage'; break;
        case 'ZTL': $n = 'Atlanta'; break;
        case 'ZBW': $n = 'Boston'; break;
        case 'ZAU': $n = 'Chicago'; break;
        case 'ZOB': $n = 'Cleveland'; break;
        case 'ZDV': $n = 'Denver'; break;
        case 'ZFW': $n = 'Fort Worth'; break;
        case 'ZHU': $n = 'Houston'; break;
        case 'ZID': $n = 'Indianapolis'; break;
        case 'ZJX': $n = 'Jacksonville'; break;
        case 'ZKC': $n = 'Kansas City'; break;
        case 'ZLA': $n = 'Los Angeles'; break;
        case 'ZME': $n = 'Memphis'; break;
        case 'ZMA': $n = 'Miami'; break;
        case 'ZMP': $n = 'Minneapolis'; break;
        case 'ZNY': $n = 'New York'; break;
        case 'ZOA': $n = 'Oakland'; break;
        case 'ZLC': $n = 'Salt Lake City'; break;
        case 'ZSE': $n = 'Seattle'; break;
        case 'ZDC': $n = 'Washington D.C.'; break;
    }
    return $n;
}

$file = file_get_contents('https://tfr.faa.gov/tfr2/list.html');
preg_match_all('/<a href \= "..\/save_pages\/detail_([0-9_]+).html">HAZARDS<\/a>/', $file, $list);

foreach ($list[1] as $get) {
    $json = json_decode(json_encode(simplexml_load_file('https://tfr.faa.gov/save_pages/detail_'.$get.'.xml')));
    $tfr = $json->Group->Add->Not;
    $coords = array();
    $desc = ucfirst(strtolower($tfr->txtDescrPurpose));

    if (strpos($desc, 'fire fighting') !== false) {
        $id = $tfr->NotUid->txtLocalName;
        $artcc = artcc($tfr->codeFacility).' ('.$tfr->codeFacility.')';
        $contact = ucwords(strtolower($tfr->txtNamePOC));
        $phone = $tfr->txtAddrPOCPhone;
        $freq = $tfr->valFreqPOC;
        $issued = strtotime(str_replace('T', ' ', $tfr->NotUid->dateIssued).' UTC');
        $effective = strtotime(str_replace('T', ' ', $tfr->dateEffective));
        $expires = strtotime(str_replace('T', ' ', $tfr->dateExpire));
        $alt = array($tfr->TfrNot->TFRAreaGroup->aseTFRArea->valDistVerLower, $tfr->TfrNot->TFRAreaGroup->aseTFRArea->valDistVerUpper);
        $state = convertState(ucwords(strtolower($tfr->AffLocGroup->txtNameUSState)), 2);

        preg_match('/([0-9]+)NM\s([A-Z]+)\sOF\s(.*)/', $tfr->AffLocGroup->txtNameCity, $out);

        $image = 'https://tfr.faa.gov/save_maps/sect_'.str_replace('/', '_', $id).'.gif';
        $faaloc = $out[1].'NM '.$out[2].' of '.ucwords(strtolower($out[3]));
        $location = round($out[1] * 1.15078, 1).' miles '.$out[2].' of '.ucwords(strtolower($out[3])).', '.$state;

        foreach ($tfr->TfrNot->TFRAreaGroup->abdMergedArea->Avx as $l) {
            $lat = str_replace('N', '', $l->geoLat);
            $lon = '-'.str_replace('W', '', $l->geoLong);
            $coords[] = array(floatval($lon), floatval($lat));
        }

        if ($coords[0][1] == $coords[count($coords) - 1][1] && $coords[0][0] == $coords[count($coords) - 1][0]) {
            unset($coords[count($coords) - 1]);
        }

        $prop = array('id' => $id, 'artcc' => $artcc, 'contact' => array('poc' => $contact, 'phone' => $phone, 'freq' => $freq), 'issued' => $issued, 'begins' => $effective, 'ends' => $expires,
                    'state' => $state, 'altitude' => $alt, 'location' => array('faa' => $faaloc, 'relative' => $location), 'desc' => $desc, 'map' => $image);
        $features[] = array('type' => 'Feature', 'geometry' => array('type' => 'Polygon', 'coordinates' => [$coords]), 'properties' => $prop);
    }
}

$save = fopen('../apis/cache/tfrs.json', 'w');
fwrite($save, json_encode(array('type' => 'FeatureCollection', 'features' => $features)));
fclose($save);
?>