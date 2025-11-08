<?
function convertTime($s) {
    return strtotime(substr($s, 4, 2).'/'.substr($s, 6, 2).'/'.substr($s, 0, 4).' '.substr($s, 8, 2).':'.substr($s, 10, 2).' UTC');
}

function spcTime($t) {
    $p = explode(' ', $t);

    return strtotime($p[4].' '.$p[5].', '.$p[6].' '.substr($p[0], 0, 2).':'.substr($p[0], 2, 2).' '.$p[1].' '.$p[2]);
}

function expireTime($s) {
    $d = substr($s, 0, 2);
    $t = substr($s, 2, 2).':'.substr($s, 4, 2).' UTC';

    if ($d == date('d')) {
        $m = date('m/d/Y');
    } else if ($d == date('d', strtotime('+1 day'))) {
        $m = date('m/d/Y', strtotime('+1 day'));
    } else if ($d == date('d', strtotime('+2 days'))) {
        $m = date('m/d/Y', strtotime('+2 days'));
    } else if ($d == date('d', strtotime('+3 days'))) {
        $m = date('m/d/Y', strtotime('+3 days'));
    }
    return strtotime($m.' '.$t);
}

function outlookText($spc) {
    $text = '';
    $extra = '';
    preg_match('/<pre>(.*?)<\/pre>/s', $spc, $pre);
    preg_match('/(\d{4} [A-Z]+ [A-Z]+ [A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4})/', $pre[1], $d);
    preg_match('/Valid(.*?\n)(.*)/s', rtrim(ltrim(explode('CLICK TO GET', $pre[1])[0])), $a);
    $issued = spcTime($d[1]);
    $valid = textValid(0, $issued, $a[1]);
    $expires = textValid(1, $issued, $a[1]);

    $go = explode('...Please see', $a[2])[0];

    if ($go) {
        preg_match('/.PREV DISCUSSION...(.*)/s', $go, $prev);

        if ($prev) {
            preg_match_all('/\.\.\.(.*?)\.\.\.\n(.*?)(?=\n\.\.\.|\z)/s', preg_replace('/^( {3,})/m', '', $prev[0]), $z);

            $count = 0;
            foreach ($z[0] as $l) {
                preg_match('/\.\.\.(.*?)\.\.\.\n(.*?)(?=\n\.\.\.|\z)/s', $l, $p);

                if ($count == 0) {
                    date_default_timezone_set('America/Chicago');
                    preg_match('/(ISSUED) ([0-9A-Za-z\s]+)\/(.*)/s', preg_replace('/\n/', ' ', $p[1]), $g);
                    $extra .= '<p><b><u>PREVIOUS DISCUSSION: issued '.date('D, M j, Y \a\t g:i A T', spcTime($g[2])).'</u></b></p><p><b>'.ltrim(rtrim($g[3])).'...</b></p>';
                } else {
                    $extra .= '<p><b>...'.preg_replace('/\n/', ' ', $p[1]).'...</b></p>';
                }

                foreach (preg_split('/\n\n/', $p[2]) as $ea) {
                    if ($ea != '') {
                        $extra .= '<p>'.preg_replace('/\n/', ' ', $ea).'</p>';
                    }
                }

                $count++;
            }
        }
    }

    preg_match('/(.*?)(\n\s+\.\.([A-Za-z\/]+)..\s([0-9\/]+))/s', ltrim(rtrim($a[2])), $b);
    preg_match_all('/\.\.\.(.*?)\.\.\.\n(.*?)(?=\n\.\.\.|\z)/s', preg_replace('/^( {3,})/m', '', $b[1]), $c);
    $forecaster = $b[3];

    foreach ($c[0] as $l) {
        preg_match('/\.\.\.(.*?)\.\.\.\n(.*?)(?=\n\.\.\.|\z)/s', $l, $p);

        $text .= '<p><b>...'.preg_replace('/\n/', ' ', $p[1]).'...</b></p>';

        foreach (preg_split('/\n\n/', $p[2]) as $ea) {
            if ($ea != '') {
                $text .= '<p>'.ltrim(preg_replace('/\n/', ' ', $ea)).'</p>';
            }
        }
    }

    $text = str_replace('. </p>', '.</p>', preg_replace('/\s{2,}/m', ' ', $text.($extra ? $extra : '')));
    $text = preg_replace('/<b>(.*?)<\/b><b>(.*?)<\/b>/s', "<p><b>$1</b></p><p><b>$2</b></p>", $text);

    return [$issued, $valid, $expires, $text, $forecaster];
}

function textValid($int, $issued, $valid) {
    date_default_timezone_set('UTC');
    $val = explode(' - ', ltrim($valid));
    
    return strtotime(date('F', $issued).' '.substr($val[$int], 0, 2).', '.date('Y', $issued).' '.substr($val[$int], 2, 2).':'.substr($val[$int], 4, 2).' UTC');
}

if ($function == 'text') {
    date_default_timezone_set('America/Chicago');

    if ($method == 'fire' && $_REQUEST['day'] > 2 || $method == 'severe' && $_REQUEST['day'] > 4) {
        $returnJson = array('outlook' => null);
    } else {
        if ($method == 'fire') {
            $spc = 'https://www.spc.noaa.gov/products/fire_wx/fwdy'.$_REQUEST['day'].'.html';
        } else {
            $spc = $_REQUEST['day'] == 4 ? 'https://www.spc.noaa.gov/products/exper/day4-8/' : 'https://www.spc.noaa.gov/products/outlook/day'.$_REQUEST['day'].'otlk.html';            
        }
        $data = outlookText(get_html($spc));
        $issued = $data[0];
        $valid = $data[1];
        $expires = $data[2];
        $text = $data[3];
        $forecaster = $data[4];

        if ($method == 'fire') {
            $image[] = 'fire_wx/day'.$_REQUEST['day'].'fireotlk.png';
        } else {
            if ($_REQUEST['day'] == 4) {
                $image[] = 'exper/day4-8/day4prob.gif';
            } else {
                $image[] = 'outlook/day'.$_REQUEST['day'].'otlk.gif';

                if ($_REQUEST['day'] == 3) {
                    $image[] = 'outlook/day'.$_REQUEST['day'].'prob.gif';
                } else {
                    $image[] = 'outlook/day'.$_REQUEST['day'].'probotlk_torn.gif';
                    $image[] = 'outlook/day'.$_REQUEST['day'].'probotlk_wind.gif';
                    $image[] = 'outlook/day'.$_REQUEST['day'].'probotlk_hail.gif';
                }
            }
        }

        $returnJson = [
            'outlook' => [
                'day' => $_REQUEST['day'] == 4 ? '4-8' : intval($_REQUEST['day']),
                'type' => $method,
                'dow' => date('l') == date('l', $valid) ? 'Today' : date('l', $valid),
                'issued' => $issued,
                'valid' => $valid,
                'expires' => $expires,
                'text' => $text,
                'graphics' => $image,
                'forecaster' => $forecaster
            ]
        ];
    }
} else {
    date_default_timezone_set('UTC');

    if ($method == 'fire') {
        $url = ['https://www.spc.noaa.gov/products/fire_wx/day'.$_REQUEST['day'].'fw_dryt.lyr.geojson',
                'https://www.spc.noaa.gov/products/fire_wx/day'.$_REQUEST['day'].'fw_windrh.lyr.geojson'];

    } else {
        $url = ['https://www.spc.noaa.gov/products/outlook/day'.$_REQUEST['day'].'otlk_cat.nolyr.geojson'];
    }

    for ($x = 0; $x < count($url); $x++) {
        $otlk = array();
        $json = json_decode(file_get_contents($url[$x]));

        for ($i = 0; $i < count($json->features); $i++) {
            $c = $json->features[$i]->geometry->coordinates;
            $label = $json->features[$i]->properties->LABEL2;
            $stroke = $json->features[$i]->properties->stroke;
            $fill = $json->features[$i]->properties->fill;
            $iss = convertTime($json->features[$i]->properties->ISSUE);
            $e = convertTime($json->features[$i]->properties->EXPIRE);
            $v = convertTime($json->features[$i]->properties->VALID);

            if ($c) {
                $otlk[] = array('type' => 'Feature', 'geometry' => array('type' => $json->features[$i]->geometry->type, 'coordinates' => $c),
                                'properties' => array('name' => $label, 'stroke' => $stroke, 'fill' => $fill, 'issue' => $iss, 'valid' => $v, 'expires' => $e));
            }
        }
    }

    $returnJson = array('type' => 'FeatureCollection', 'features' => $otlk);
}