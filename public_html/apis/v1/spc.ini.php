<?
$reportTypes = '[{"NAME":"Avalanche","LABEL":"Avalanche","LONG":"aval","OLD_LONG":"","ABBREVIATION":"AV","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"winter","PRIORITY":"5"},{"NAME":"Blizzard","LABEL":"Blizzard","LONG":"bliz","OLD_LONG":"bliz","ABBREVIATION":"BL","SHORT":"B","REQ_MAG":"","FORMAT":"","CATEGORY":"winter","PRIORITY":"3"},{"NAME":"Blowing Dust","LABEL":"Blowing Dust","LONG":"bdst","OLD_LONG":"","ABBREVIATION":"BD","SHORT":"","REQ_MAG":"","FORMAT":"%1d","CATEGORY":"otherw","PRIORITY":"4"},{"NAME":"Coastal Flood","LABEL":"Coastal Flood","LONG":"csfl","OLD_LONG":"","ABBREVIATION":"CF","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"7"},{"NAME":"Debris Flow","LABEL":"Debris Flow","LONG":"dbfl","OLD_LONG":"","ABBREVIATION":"DF","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"rain","PRIORITY":"4"},{"NAME":"Downburst","LABEL":"Downburst","LONG":"dnbt","OLD_LONG":"","ABBREVIATION":"DB","SHORT":"","REQ_MAG":"","FORMAT":"%1d","CATEGORY":"othert","PRIORITY":"3"},{"NAME":"Drought","LABEL":"Drought","LONG":"drgt","OLD_LONG":"","ABBREVIATION":"DR","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"2"},{"NAME":"Dust Storm","LABEL":"Dust Storm","LONG":"dust","OLD_LONG":"","ABBREVIATION":"DS","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"otherw","PRIORITY":"3"},{"NAME":"Extreme Heat","LABEL":"Extreme Heat","LONG":"exht","OLD_LONG":"","ABBREVIATION":"EH","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"temp","PRIORITY":"1"},{"NAME":"Extreme Cold","LABEL":"Extreme Cold","LONG":"excd","OLD_LONG":"","ABBREVIATION":"EC","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"temp","PRIORITY":"2"},{"NAME":"Flash Flood","LABEL":"Flash Flood","LONG":"flfd","OLD_LONG":"flashflood","ABBREVIATION":"FF","SHORT":"O","REQ_MAG":"","FORMAT":"","CATEGORY":"rain","PRIORITY":"3"},{"NAME":"Flood","LABEL":"Flood","LONG":"flod","OLD_LONG":"flood","ABBREVIATION":"FL","SHORT":"D","REQ_MAG":"","FORMAT":"","CATEGORY":"rain","PRIORITY":"2"},{"NAME":"Fog","LABEL":"Fog","LONG":"defg","OLD_LONG":"","ABBREVIATION":"FG","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"3"},{"NAME":"Freeze","LABEL":"Freeze","LONG":"frez","OLD_LONG":"","ABBREVIATION":"FZ","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"temp","PRIORITY":"4"},{"NAME":"Freezing Rain","LABEL":"Fz Rain","LONG":"fzra","OLD_LONG":"fzrn","ABBREVIATION":"FR","SHORT":"F","REQ_MAG":"","FORMAT":"%3d","CATEGORY":"winter","PRIORITY":"4"},{"NAME":"Funnel Cloud","LABEL":"Funnel Cd","LONG":"fcld","OLD_LONG":"","ABBREVIATION":"FC","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"othert","PRIORITY":"2"},{"NAME":"Hail","LABEL":"Hail","LONG":"hail","OLD_LONG":"hail","ABBREVIATION":"HA","SHORT":"A","REQ_MAG":"100","FORMAT":"%3d","CATEGORY":"severe","PRIORITY":"2"},{"NAME":"High Surf","LABEL":"High Surf","LONG":"hsrf","OLD_LONG":"","ABBREVIATION":"SF","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"1"},{"NAME":"High Sust Winds","LABEL":"High Sust Winds","LONG":"hwnd","OLD_LONG":"","ABBREVIATION":"HW","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"otherw","PRIORITY":"3"},{"NAME":"Hurricane","LABEL":"Hurricane","LONG":"hurr","OLD_LONG":"","ABBREVIATION":"HU","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"tropical","PRIORITY":"2"},{"NAME":"Ice Jam","LABEL":"Ice Jam","LONG":"ijam","OLD_LONG":"","ABBREVIATION":"IJ","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"6"},{"NAME":"Ice Jam Flooding","LABEL":"Ice Jam Flooding","LONG":"ijfl","OLD_LONG":"","ABBREVIATION":"IF","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"7"},{"NAME":"Lakeshore Flood","LABEL":"Lkshore Fld","LONG":"lkfl","OLD_LONG":"","ABBREVIATION":"LF","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"rain","PRIORITY":"6"},{"NAME":"Landslide","LABEL":"Landslide","LONG":"lnsd","OLD_LONG":"","ABBREVIATION":"LS","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"rain","PRIORITY":"5"},{"NAME":"Landspout","LABEL":"Landspout","LONG":"lspt","OLD_LONG":"","ABBREVIATION":"LT","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"othert","PRIORITY":"4"},{"NAME":"Lightning","LABEL":"Lightning","LONG":"lght","OLD_LONG":"lightning","ABBREVIATION":"LI","SHORT":"C","REQ_MAG":"","FORMAT":"","CATEGORY":"othert","PRIORITY":"1"},{"NAME":"Misc Mrn\/Srf Hzd","LABEL":"Misc Mrn\/Srf Hzd","LONG":"mmsh","OLD_LONG":"","ABBREVIATION":"SH","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"3"},{"NAME":"Non-Tstm Wnd Dmg","LABEL":"NonTS Wnd Dmg","LONG":"ntwd","OLD_LONG":"","ABBREVIATION":"NW","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"otherw","PRIORITY":"2"},{"NAME":"Non-Tstm Wnd Gst","LABEL":"NonTS Wnd Gst","LONG":"ntwg","OLD_LONG":"","ABBREVIATION":"NG","SHORT":"","REQ_MAG":"","FORMAT":"%1d","CATEGORY":"otherw","PRIORITY":"1"},{"NAME":"Rain","LABEL":"Rain","LONG":"rain","OLD_LONG":"","ABBREVIATION":"RA","SHORT":"","REQ_MAG":"","FORMAT":"%3d","CATEGORY":"rain","PRIORITY":"1"},{"NAME":"Rip Currents","LABEL":"Rip Current","LONG":"ripc","OLD_LONG":"","ABBREVIATION":"RC","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"2"},{"NAME":"Seiche","LABEL":"Seiche","LONG":"seic","OLD_LONG":"","ABBREVIATION":"SE","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"4"},{"NAME":"Significant Hail","LABEL":"Sig Hail","LONG":"sighail","OLD_LONG":"","ABBREVIATION":"SH","SHORT":"","REQ_MAG":"200","FORMAT":"%3d","CATEGORY":"severe","PRIORITY":"5"},{"NAME":"Significant Wind Gust","LABEL":"Sig Wind","LONG":"sigwind","OLD_LONG":"","ABBREVIATION":"SG","SHORT":"","REQ_MAG":"75","FORMAT":"%1d","CATEGORY":"severe","PRIORITY":"6"},{"NAME":"Sleet","LABEL":"Sleet","LONG":"slet","OLD_LONG":"sleet","ABBREVIATION":"SL","SHORT":"L","REQ_MAG":"","FORMAT":"%3d","CATEGORY":"winter","PRIORITY":"6"},{"NAME":"Sneaker Wave","LABEL":"Snkr Wave","LONG":"snwv","OLD_LONG":"","ABBREVIATION":"SW","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"5"},{"NAME":"Snow","LABEL":"Snow","LONG":"snow","OLD_LONG":"snow","ABBREVIATION":"SN","SHORT":"S","REQ_MAG":"","FORMAT":"%3d","CATEGORY":"winter","PRIORITY":"1"},{"NAME":"Snow\/Ice Dmg","LABEL":"Snow\/Ice Dmg","LONG":"sidg","OLD_LONG":"","ABBREVIATION":"SD","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"winter","PRIORITY":"7"},{"NAME":"Snow Squall","LABEL":"Snow Squall","LONG":"snsq","OLD_LONG":"","ABBREVIATION":"SQ","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"winter","PRIORITY":"2"},{"NAME":"Storm Surge","LABEL":"Storm Surge","LONG":"srge","OLD_LONG":"","ABBREVIATION":"SS","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"tropical","PRIORITY":"4"},{"NAME":"Tornado","LABEL":"Tornado","LONG":"torn","OLD_LONG":"torn","ABBREVIATION":"TO","SHORT":"T","REQ_MAG":"","FORMAT":"","CATEGORY":"severe","PRIORITY":"1"},{"NAME":"Tropical Cyclone","LABEL":"Tropical Cyclone","LONG":"tcyc","OLD_LONG":"","ABBREVIATION":"TC","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"tropical","PRIORITY":"1"},{"NAME":"Tropical Storm","LABEL":"Tropical Storm","LONG":"tpst","OLD_LONG":"","ABBREVIATION":"TS","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"tropical","PRIORITY":"3"},{"NAME":"Tsunami","LABEL":"Tsunami","LONG":"tsun","OLD_LONG":"","ABBREVIATION":"TU","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"coastal","PRIORITY":"6"},{"NAME":"Tstm Wnd Dmg","LABEL":"Wind Dmg","LONG":"wndg","OLD_LONG":"wndg","ABBREVIATION":"TW","SHORT":"W","REQ_MAG":"","FORMAT":"","CATEGORY":"severe","PRIORITY":"4"},{"NAME":"Tstm Wnd Gst","LABEL":"Wind Gust","LONG":"wind","OLD_LONG":"gust","ABBREVIATION":"TG","SHORT":"G","REQ_MAG":"58","FORMAT":"%1d","CATEGORY":"severe","PRIORITY":"3"},{"NAME":"Vog","LABEL":"Vog","LONG":"vfog","OLD_LONG":"","ABBREVIATION":"VF","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"4"},{"NAME":"Volcanic Ash","LABEL":"Volc Ash","LONG":"vash","OLD_LONG":"","ABBREVIATION":"VA","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"5"},{"NAME":"Waterspout","LABEL":"Waterspout","LONG":"wspt","OLD_LONG":"","ABBREVIATION":"WS","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"othert","PRIORITY":"5"},{"NAME":"Wildfire","LABEL":"Wildfire","LONG":"fire","OLD_LONG":"fire","ABBREVIATION":"WF","SHORT":"R","REQ_MAG":"","FORMAT":"","CATEGORY":"other","PRIORITY":"1"},{"NAME":"Wind Chill","LABEL":"Wind Chill","LONG":"exwc","OLD_LONG":"","ABBREVIATION":"WC","SHORT":"","REQ_MAG":"","FORMAT":"","CATEGORY":"temp","PRIORITY":"3"}]';

function getReportType($t) {
    global $reportTypes;
    $types = json_decode($reportTypes);

    for ($i = 0; $i < count($types); $i++) {
        if ($types[$i]->ABBREVIATION == $t) {
            return $types[$i]->NAME;
        }
    }

    return null;
}

function between($getdate) {
    global $_REQUEST;

    $between = [strtotime($getdate.' 12:00 UTC'), strtotime($getdate.' 12:00 UTC') + 86400];

    if (isset($_REQUEST['usetime']) && $_REQUEST['usetime'] == 'local') {
        date_default_timezone_set('America/Los_Angeles');
        $offset = intval(date('Z'));
        $between[0] += $offset;
        $between[1] += $offset;
    }

    return $between;
}

if ($method == 'reports') {
    date_default_timezone_set('UTC');

    $code = 404;
    $error = false;

    if (isset($_REQUEST['date'])) { 
        if (strlen($_REQUEST['date']) < 10 || is_nan($_REQUEST['date'])) {
            $msg = 'The provided date must be in unix format';
            $error = true;
        } else if ($_REQUEST['date'] > strtotime('tomorrow midnight')) {
            $msg = 'Reports cannot be retrieved for future dates';
            $error = true;
        }
    }

    if ($error) {
        $returnJson = ['response' => 'error', 'code' => $code, 'msg' => $msg];
    } else {
        $getdate = isset($_REQUEST['date']) ? date('Ymd', $_REQUEST['date']) : date('Ymd');
        $between = between($getdate);

        $json = get_data('https://www.spc.noaa.gov/exper/reports/v3/src/getAllReports.php?date='.$getdate.'&geojson&getDataSources');

        if (!$json) {
            $returnJson = ['response' => 'error', 'code' => 500, 'msg' => 'Unable to retrieve storm reports at this time'];
        } else {
            $category = null;
            $types = isset($_REQUEST['types']) ? explode(',', $_REQUEST['types']) : null;
            $count;
            $countStates;

            if (isset($_REQUEST['category'])) {
                if ($_REQUEST['category'] == 'severe') {
                    $category = ['TO','HA','SH','TG','LT','LI','WS'];
                } else if ($_REQUEST['category'] == 'winter') {
                    $category = ['BL','EC','FZ','FR','SL','SN','SD','SQ','WC'];
                }
            }
            
            for ($i = 0; $i < count($json['features']); $i++) {
                $prop = $json['features'][$i]['properties'];
                $theType = $prop['Type'];

                if ((!isset($_REQUEST['types']) || $types != null && in_array($theType, $types)) &&
                    ($category == null || ($category != null && in_array($theType, $category))) &&
                    (!isset($_REQUEST['state']) || (isset($_REQUEST['state']) && $_REQUEST['state'] == $prop['St'])) &&
                    (!isset($_REQUEST['wfo']) || (isset($_REQUEST['wfo']) && $_REQUEST['wfo'] == $prop['Office']))) {
                    $when = substr($prop['Date'], 4, 2).'/'.substr($prop['Date'], 6, 2).'/'.substr($prop['Date'], 0, 4).' '.substr($prop['Time'], 0, 2).':'.substr($prop['Time'], 2, 2).' UTC';

                    if (strtotime($when) >= $between[0] && strtotime($when) < $between[1]) {
                        $mag = $prop['Mag'] == 'UNK' ? null : (!is_nan(floatval($prop['Mag'])) ? floatval($prop['Mag']) / 100 : null);

                        $features[] = [
                            'id' => intval($prop[' #']),
                            'occurred' => strtotime($when),
                            'type' => [
                                'code' => $theType,
                                'name' => getReportType($theType),
                            ],
                            'location' => [
                                'city' => ($prop['Distance'] != 0 ? $prop['Distance'].' mile '.$prop['Direction'].' of ' : '').$prop['City'],
                                'county' => $prop['County'],
                                'state' => $prop['St'],
                                'fips' => $prop['FIPS'],
                                'coordinates' => $json['features'][$i]['geometry']['coordinates']
                            ],
                            'impact' => [
                                'magnitude' => $mag,
                                'remark' => $prop['Remark'],
                                'fatalities' => intval($prop['Fatalities']),
                                'injuries' => intval($prop['Injuries'])
                            ],
                            'source' => $prop['Source'],
                            'wfo' => $prop['Office']
                        ];

                        $count[$theType]++;
                        $countStates[$prop['St']]++;
                    }
                }
            }

            if ($features && count($features) > 0) {
                usort($features, function($a, $b) {
                    return $b['occurred'] - $a['occurred'];
                });

                foreach ($count as $k => $v) {
                    $ct[getReportType($k)] = $v;
                }

                foreach ($countStates as $k => $v) {
                    $ct2[$k] = $v;
                }

                ksort($ct);
                ksort($ct2);

                $stats = ['total' => count($features), 'types' => $ct, 'states' => $ct2];
            }

            $returnJson = ['reports' => [
                'valid' => [
                    $between[0],
                    $between[1]
                ],
                'stats' => $stats,
                'data' => $features
                ]
            ];
        }
    }
}