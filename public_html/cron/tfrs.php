<?
date_default_timezone_set('UTC');

function artcc($c)
{
    $n = '';
    switch ($c) {
        case 'ZAB':
            $n = 'Albuquerque';
            break;
        case 'ZAN':
            $n = 'Anchorage';
            break;
        case 'ZTL':
            $n = 'Atlanta';
            break;
        case 'ZBW':
            $n = 'Boston';
            break;
        case 'ZAU':
            $n = 'Chicago';
            break;
        case 'ZOB':
            $n = 'Cleveland';
            break;
        case 'ZDV':
            $n = 'Denver';
            break;
        case 'ZFW':
            $n = 'Fort Worth';
            break;
        case 'ZHU':
            $n = 'Houston';
            break;
        case 'ZID':
            $n = 'Indianapolis';
            break;
        case 'ZJX':
            $n = 'Jacksonville';
            break;
        case 'ZKC':
            $n = 'Kansas City';
            break;
        case 'ZLA':
            $n = 'Los Angeles';
            break;
        case 'ZME':
            $n = 'Memphis';
            break;
        case 'ZMA':
            $n = 'Miami';
            break;
        case 'ZMP':
            $n = 'Minneapolis';
            break;
        case 'ZNY':
            $n = 'New York';
            break;
        case 'ZOA':
            $n = 'Oakland';
            break;
        case 'ZLC':
            $n = 'Salt Lake City';
            break;
        case 'ZSE':
            $n = 'Seattle';
            break;
        case 'ZDC':
            $n = 'Washington D.C.';
            break;
    }
    return $n;
}

function decimalToDMS($decimal, $isLat = true)
{
    $direction = $isLat ? 'N' : 'W';
    $decimal = abs($decimal);
    $degrees = floor($decimal);
    $minutesFull = ($decimal - $degrees) * 60;
    $minutes = floor($minutesFull);
    $seconds = ($minutesFull - $minutes) * 60;

    if ($seconds >= 59.9995) {
        $seconds = 0;
        $minutes++;
    }

    if ($minutes >= 60) {
        $minutes = 0;
        $degrees++;
    }

    $minutes = round($minutes, 2);
    $seconds = round($seconds, 2);

    return "{$degrees}&deg;{$minutes}'{$seconds}\"{$direction}";
}

function convert($s, $isLon = false)
{
    $c = ltrim(str_replace(['N,W'], '', $s), '0');
    return floatval(($isLon ? '-' : '') . $c);
}

$json = json_decode(file_get_contents('https://tfr.faa.gov/geoserver/TFR/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=TFR:V_TFR_LOC&maxFeatures=300&outputFormat=application/json&srsname=EPSG:4326'));
$features = [];

if ($json->features) {
    foreach ($json->features as $f) {
        $p = $f->properties;
        $id = str_replace('V_TFR_LOC.', '', $f->id);

        if ($p->LEGAL == 'HAZARDS') {
            $text = json_decode(json_encode(simplexml_load_file("https://tfr.faa.gov/download/detail_" . str_replace('/', '_', $id) . ".xml")));
            //$text = json_decode(json_encode(simplexml_load_file("https://tfr.faa.gov/download/detail_6_7376.xml")));
            $details = $text->Group->Add->Not;

            if (str_contains($details->txtDescrPurpose, 'FIRE FIGHTING')) {
                $m = $p->LAST_MODIFICATION_DATETIME;
                $date = substr($m, 4, 2) . '/' . substr($m, 6, 2) . '/' . substr($m, 0, 4);
                $time = substr($m, 8, 2) . ':' . substr($m, 10, 2) . ' UTC';
                $updated = strtotime("$date $time");

                $lower = strtolower("{$details->TfrNot->TFRAreaGroup->aseTFRArea->valDistVerLower} {$details->TfrNot->TFRAreaGroup->aseTFRArea->uomDistVerLower}");
                $upper = strtolower("{$details->TfrNot->TFRAreaGroup->aseTFRArea->valDistVerUpper} {$details->TfrNot->TFRAreaGroup->aseTFRArea->uomDistVerUpper}");

                $avx = $details->TfrNot->TFRAreaGroup->aseShapes->Abd->Avx;
                $center = $radius = null;

                if (is_array($avx)) {
                    foreach ($avx as $reg) {
                        $lat = convert($reg->geoLat);
                        $lon = convert($reg->geoLong, true);
                        $center[] = [
                            'dec' => "$lat, $lon",
                            'dms' => decimalToDMS($lat, true) . ', ' . decimalToDMS($lon)
                        ];
                    }
                } else {
                    $lat = convert($avx->geoLat);
                    $lon = convert($avx->geoLong, true);
                    $center = [
                        'dec' => "$lat, $lon",
                        'dms' => decimalToDMS($lat, true) . ', ' . decimalToDMS($lon)
                    ];
                    $radius = "{$avx->valRadiusArc} {$avx->uomRadiusArc}";
                }

                $features[] = [
                    'type' => 'Feature',
                    'id' => str_replace('/', '', $id),
                    'geometry' => $f->geometry,
                    'properties' => [
                        'type' => $p->LEGAL,
                        'id' => $id,
                        'state' => $p->STATE,
                        'location' => $details->AffLocGroup->txtNameCity . ', ' . $details->AffLocGroup->txtNameUSState,
                        'artcc' => [
                            'id' => $p->CNS_LOCATION_ID,
                            'name' => artcc($p->CNS_LOCATION_ID),
                            'phone' => $details->txtAddrCoordPhone,
                            'freq' => $details->valFreqPOC
                        ],
                        'airspace' => [
                            'altitude' => [$lower, $upper],
                            'lower' => $details->TfrNot->TFRAreaGroup->aseTFRArea->codeExclVerLower,    // from the surface up to and including
                            'upper' => $details->TfrNot->TFRAreaGroup->aseTFRArea->codeExclVerUpper,
                            'center' => $center,
                            'radius' => $radius
                        ],
                        'purpose' => $details->txtDescrPurpose,
                        'notam' => $details->txtDescrUSNS,
                        'valid' => [
                            'from' => strtotime($details->dateEffective),
                            'to' => strtotime($details->dateExpire)
                        ],
                        'issued' => strtotime($details->NotUid->dateIssued),
                        'modified' => $updated
                    ]
                ];
            }
        }
    }
}

file_put_contents('./cache/tfrs.json', json_encode($features));
echo 'Finished compiling TFRs...
';