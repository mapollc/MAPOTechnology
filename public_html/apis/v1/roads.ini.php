<?
function getODOT($url) {
    $curl = curl_init();

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
    curl_setopt($curl, CURLOPT_HTTPHEADER, ['Cache-Control: no-cache', 'Ocp-Apim-Subscription-Key: 35452c0361314863b66308a86b394fa1']);

    $resp = curl_exec($curl);
    curl_close($curl);

    return $resp;
}

function getRW() {
    return getODOT('https://api.odot.state.or.us/tripcheck/RW/Reports');
}

function getIncidents() {
    global $_REQUEST;

    if ($_REQUEST['test'] == 1) {
        return file_get_contents('./cache/testincs.json');
    } else {
        return getODOT('https://api.odot.state.or.us/tripcheck/Incidents');
    }
}

function getLocalIncidents() {
    return file_get_contents('./cache/local_incs.json');
    //return getODOT('https://api.odot.state.or.us/tripcheck/Tle/Events');
}

function getDMS() {
    return getODOT('https://api.odot.state.or.us/tripcheck/Dms/Status');
}

function tt($s) {
    preg_match('/\[(.*?)\|(.*?)\]\s([A-Z]+);?\s(.*)/', $s, $p);
    
    if ($p) {
        return array('road' => $p[1], 'icon' => $p[2], 'direction' => $p[3], 'to' => $p[4]);
    } else {
        preg_match('/\[(.*?)\|(.*?)\]/', $s, $p);

        if ($p) {
            return array('road' => $p[1], 'icon' => $p[2]);
        } else {
            preg_match('/(.*?);\s(.*)/', $s, $p);

            return array('road' => $p[1], 'to' => $p[2]);
        }
    }
}

function weather($n) {
    switch ($n) {
        case 0: return 'No Report';
        case 1: return 'Clear/No Precipitation';
        case 2: return 'Partly Cloudy';
        case 3: return 'Overcast';
        case 4: return 'Ground Fog';
        case 5: return 'Intermittent Showers';
        case 6: return 'Rain';
        case 7: return 'Snow Flurries';
        case 8: return 'Snowing Hard & Continuously';
        case 9: return 'Severe Weather Alert';
        case 91: return 'Severe Weather Alert - Freezing Rain';
        case 92: return 'Severe Weather Alert - High Winds';
        case 93: return 'Severe Weather Alert - Blizzard Conditions';
        case 94: return 'Severe Weather Alert - Dust Storm';
        case 95: return 'Severe Weather Alert - Falling Trees';
    }
}

function cond($n) { 
    switch ($n) {
        case 0: return 'No Report';
        case 1: return 'Bare Pavement';
        case 2: return 'Spots of Ice';
        case 3: return 'Black Ice';
        case 4: return 'Standing Water/Flooding';
        case 5: return 'Snow Pack (Breaking Up)';
        case 6: return 'Packed Snow';
    }
}

function format($s) {
    return str_replace(['Lk Of The Woods', ' Of ', ' The '], ['Lake of the Woods', ' of ', ' the '], preg_replace('/\s([N|S|W|E])b/', ' $1B', implode('/', array_map('ucwords',explode('/', implode('-', array_map('ucwords', explode('-', ucwords(strtolower($s))))))))));
}

function chainReq($n) {
    switch ($n) {
        case '0': $d = 'No restrictions'; break;
        case 'A': $d = 'Carry chains or traction tires'; break;
        case 'B': $d = 'Chains required on vehicles towing or over 10,000 GVW'; break;
        case 'B1': $d = 'Chains required on vehicles towing or single drive axle over 10,000 GVW'; break;
        case 'C': $d = 'CHAINS REQUIRED: Traction tires allowed in place of chains on vehicles under 10,000 GVW and not towing. Vehicles towing must use chains'; break;
        case 'D': $d = 'CHAINS REQUIRED: Traction tires alone are not sufficient'; break;
    }
    return $d;
}

function restrict($d, $c) {
    $desc = chainReq($c->{'restriction-id'});
    $cmv = ($d->{'restriction-id'} == 1 ? 'Visibility of less than 500 feet. Oversized loads drive by your permit.' : 'No restrictions');
    $o['chains'] = array('cond' => $c->{'restriction-id'}, 'desc' => $desc);
    $o['cmv'] = array('restrict' => $cmv);

    if ($c->{'restriction-start-milepost'} != 0 && $c->{'restriction-end-milepost'} != 0) {
        $o['chains']['mileposts'] = [$c->{'restriction-start-milepost'}, $c->{'restriction-end-milepost'}];
    }

    return $o;
}

function hwy($n) {
    return preg_replace('/OR([0-9]+)/', 'ORE$1', preg_replace('/I([0-9]+)/', 'I-$1', $n));
}

function incidentType($n) {
    switch ($n) {
        case 'AL': $t = 'Alarms and Security'; break;
        case 'CN': $t = 'Congestion'; break;
        case 'DV': $t = 'Devices'; break;
        case 'DS': $t = 'Disaster'; break;
        case 'DR': $t = 'Drill'; break;
        case 'MS': $t = 'Miscellaneous'; break;
        case 'OB': $t = 'Obstruction'; break;
        case 'LE': $t = 'Other Agency'; break;
        case 'RW': $t = 'Road Work'; break;
        case 'SP': $t = 'Special and Sporting Events'; break;
        case 'VH': $t = 'Vehicle Incident'; break;
        case 'WT': $t = 'Weather Event'; break;    }
    return $t;
}

function getIncidentDetails($n) {
    // The key is the incident code, and the value is an array: [Description, Priority]
    $incidents = [
        // PRIORITY 1: Life Threat/Immediate Danger
        '60' => ['Air Crash', 1],
        '65' => ['Earthquake', 1],
        '75' => ['Explosion', 1],
        '110' => ['Tsunami', 1],
        '248' => ['Wrong Way Driver', 1],
        '249' => ['Pursuit', 1],
        '255' => ['Road Surface Collapse', 1],
        '285' => ['Downed Power Lines', 1],
        '380' => ['Hazmat', 1],

        // PRIORITY 2: Major Threat to Safety/High Impact ⚠️
        '80' => ['Fire', 2],
        '85' => ['Flood', 2],
        '105' => ['Rail Crash', 2],
        '120' => ['Wildfire', 2],
        '192' => ['Ramp Gate Activation', 2], // UPDATED PRIORITY
        '195' => ['Amber Alert', 2],
        '265' => ['Hazardous Debris', 2],
        '280' => ['Animal Struck - Hazard', 2],
        '290' => ['Hazardous Tree or Vegetation', 2],
        '370' => ['Crash', 2],
        '375' => ['Crash', 2],
        '390' => ['Vehicle Fire', 2],
        '465' => ['Closure', 2], // UPDATED PRIORITY
        '485' => ['Pedestrian in Roadway', 2],
        '95' => ['Disaster', 2],

        // PRIORITY 3: Serious Property Damage/Significant Disruption
        '405' => ['Disabled Vehicle - Hazard', 3],
        '90' => ['Hazmat Cleanup', 3],
        '130' => ['Widespread Power Outages', 3],
        '254' => ['Obstruction on Roadway', 3],
        '257' => ['Sunken Grade', 3],
        '270' => ['Landslide', 3],
        '295' => ['Rock Fall', 3],
        '300' => ['Utility Pole Down', 3],
        '420' => ['Crash Investigation', 3],
        '435' => ['Debris Flow Warning', 3],

        // PRIORITY 4: Moderate Safety Concern/Traffic Disruption
        '145' => ['RR Xing Equipment Failure', 4],
        '150' => ['Signal Not Working', 4],
        '200' => ['Police Activity', 4],
        '252' => ['Agency Assist', 4],
        '260' => ['Avalanche', 4],
        '275' => ['Animal on Roadway', 4],
        '305' => ['High Water', 4],
        '310' => ['Pothole', 4],
        '324' => ['Utility Work', 4],
        '325' => ['Road Construction', 4],
        '330' => ['Road Maintenance Operations', 4],
        '336' => ['Bridge Work', 4],
        '345' => ['Special Event', 4],
        '385' => ['Spilled Load', 4],
        '395' => ['Hazard Tow', 4],
        '400' => ['Liquid Spillage', 4],
        '416' => ['Abandoned Vehicle - Hazard', 4],
        '425' => ['Visibility Issues', 4],
        '430' => ['Winter', 4],
        '440' => ['Flood Warning', 4],
        '445' => ['High Wind Warning', 4],
        '450' => ['Ice Warning', 4],
        '480' => ['Controlled Burn', 4],
        '115' => ['Volcanic Activity', 4],

        // PRIORITY 5: Low Urgency/Routine Conditions ⬇️
        '30' => ['Slow Traffic', 5],
        '35' => ['Stop and Go Traffic', 5],
        '7' => ['Rest Area', 5],
        '460' => ['Bridge Lift', 5],
        '466' => ['Long-term ATIS', 5],
        '525' => ['TOC Alert', 5],
        '261' => ['Erosion', 5],
    ];

    $details = $incidents[$n] ?? ['Unknown Incident', 5];

    return [
        'description' => $details[0],
        'priority' => $details[1]
    ];
}

function maintSec($rpt) {
    switch ($rpt) {
        case 'Pendleton - Milton Freewater': $w = 'Pendleton'; break;
        case 'Cabbage Hill WB': $w = 'Pendleton'; break;
        case 'Cabbage Hill EB': $w = 'Pendleton'; break;
        case 'Pendleton': $w = 'Pendleton'; break;
        case 'Pendleton South': $w = 'Pendleton'; break;
        case 'Weston Mountain': $w = 'Pendleton'; break;
        case 'Hermiston': $w = 'Hermiston'; break;
        case 'Ladd Canyon WB': $w = 'La Grande'; break;
        case 'Ladd Canyon EB': $w = 'La Grande'; break;
        case 'Perry WB': $w = 'La Grande'; break;
        case 'Perry EB': $w = 'La Grande'; break;
        case 'Meacham WB': $w = 'Meacham'; break;
        case 'Meacham EB': $w = 'Meacham'; break;
        case 'Battle Mt Summit': $w = 'Ukiah'; break;
        case 'Ukiah/Hilgard': $w = 'Ukiah'; break;
        case 'Meadowbrook Summit': $w = 'Ukiah'; break;
        case 'Long Creek Mt': $w = 'John Day'; break;
        case 'Tollgate WB': $w = 'Elgin'; break;
        case 'Tollgate EB': $w = 'Elgin'; break;
        case 'Minam Summit': $w = 'Elgin'; break;
        case 'Enterprise': $w = 'Enterprise'; break;
        case 'Flora': $w = 'Enterprise'; break;
        case 'Baker Valley': $w = 'Baker'; break;
        case 'Pleseant Valley WB': $w = 'Baker'; break;
        case 'Pleseant Valley EB': $w = 'Baker'; break;
        case 'Burnt River Canyon': $w = 'Baker'; break;
        case 'Sumpter': $w = 'Baker'; break;
        case 'Three Mile Hill': $w = 'Ontario'; break;
        case 'Halfway Hill': $w = 'Richland'; break;
        case 'Siskiyou Summit NB': $w = 'Ashland'; break;
        case 'Siskiyou Summit SB': $w = 'Ashland'; break;
        case 'Cascade Locks - Hood River': $w = 'Cascade Locks'; break;
        case 'Troutdale - Cascade Locks': $w = 'Cascade Locks'; break;
        case 'Hood River - The Dalles': $w = 'The Dalles'; break;
        case 'The Dalles - Rufus': $w = 'The Dalles'; break;
        case 'The Dalles': $w = 'The Dalles'; break;
        case 'Arlington': $w = 'Arlington'; break;
        case 'Maupin': $w = 'Maupin'; break;
        case 'Tombstone': $w = 'Sweet Home'; break;
        case 'Santiam Pass Smt': $w = 'Santiam Junction'; break;
        case 'Santiam Jct': $w = 'Santiam Junction'; break;
        case 'Sisters': $w = 'Sisters'; break;
        case 'Burns': $w = 'Burns'; break;
        case 'Stinkingwater Summit': $w = 'Juntura'; break;
        case 'Juntura': $w = 'Juntura'; break;
        case 'Government Camp': $w = 'Government Camp'; break;
        case 'Ochoco Summit': $w = 'Austin'; break;
        case 'Blue Box Pass': $w = 'Government Camp/Warm Springs'; break;
        case 'Warm Springs Grade': $w = 'Warm Springs'; break;
        case 'Warm Springs Jct': $w = 'Warm Springs'; break;
        case 'Austin': $w = 'Austin'; break;
        case 'Eldorado Pass': $w = 'Austin'; break;
        case 'Brogan Hill': $w = 'Vale'; break;
        case 'Clatskanie': $w = 'Clatskanie'; break;
        case 'Canyon Mountain': $w = 'John Day'; break;
        case 'Devine Summit': $w = 'John Day'; break;
        case 'Lakeview': $w = 'Lakeview'; break;
        case 'Jordan Valley': $w = 'Jordan Valley'; break;
        case 'Basque': $w = 'Basque'; break;
        case 'Moro': $w = 'Moro'; break;
        case 'Shaniko': $w = 'Moro'; break;
        case 'Cow Canyon': $w = 'Madras'; break;
        case 'Bend': $w = 'Bend'; break;
        case 'South Of Bend': $w = 'Bend'; break;
        case 'Lapine': $w = 'Lapine'; break;
        case 'Chemult': $w = 'Chemult'; break;
        case 'Chiloquin': $w = 'Chiloquin'; break;
        case 'Klamath Falls': $w = 'Klamath Falls'; break;
        case 'Lk Of The Woods': $w = 'Lake of the Woods'; break;
        default: $w = ''; break;
    }
    return $w;
}

/*function decodePolyline($lat1, $lon1, $lat2, $lon2) {
    $json = json_decode(file_get_contents('https://routing.openstreetmap.de/routed-car/route/v1/driving/'.$lon1.','.$lat1.';'.$lon2.','.$lat2.'?overview=false&alternatives=true&steps=true'));

    return array_reverse(Polyline::pair(Polyline::decode($json->routes[0]->legs[0]->steps[0]->geometry)));
}*/

function decodeWkt($linestring) {
    $strippedString = substr($linestring, 11, -1);
    $coordinatePairs = explode(",", $strippedString);
    $coordinates = [];
    
    for ($i = 0; $i < count($coordinatePairs); $i++) {
        $coord = explode(" ", $coordinatePairs[$i]);
        $coordinates[] = [floatval($coord[0]), floatval($coord[1])];
    }

    return $coordinates;
}

function decodePolyline($geotype, $string, $convert = true) {
    $coords = [];

    preg_match_all('/\(([0-9\-.,\s]+)\)/', $string, $a);
    $i = 0;

    foreach ($a[1] as $b) {
        $e = explode(', ', $b);

        foreach ($e as $d) {
            $c = explode(' ', $d);
            if (($c[0] != 0 && $c[0] != null && $c[0] != '') && ($c[1] != 0 && $c[1] != null && $c[1] != '')) {
                if ($geotype == 'MultiLineString') {
                    if ($convert) {
                        $coords[$i][] = convertCoords($c[0], $c[1]);
                    } else {
                        $coords[$i][] = [$c[0], $c[1]];
                    }
                } else {
                    if ($convert) {
                        $coords[] = convertCoords($c[0], $c[1]);
                    } else {
                        $coords[] = [$c[0], $c[1]];
                    }
                }
            }
        }
        $i++;
    }

    return $coords;
}

function vmsFormat($t) {
    $o = preg_replace('/\,FACE([0-9]+)/', '', $t);
    $o = preg_replace('/(([A-Z]+)([0-9]{2}))/', '$2 $3', $o);
    $o = preg_replace('/(LIMIT)(TRUCKS)\s([0-9]{2})([0-9]{2})/', '$1 $3 $2 $4', $o);

    return $o;
}


### START API HERE

// create instance of memcache
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211);

if ($method == 'dms') {
    $cachefilename = 'dms_status';
    $cache = $memcache->get($cachefilename);

    $devices = array();
    $json = json_decode(file_get_contents($_SERVER['DOCUMENT_ROOT'].'/v'.$_GET['version'].'/dms.json'))->{'dms-inventory-items'};

    if (!$cache || time() - $memcache->get($cachefilename.'-time') > 1200 || filemtime('roads.ini.php') > $memcache->get($cachefilename.'-time')) {
        foreach ($json as $j) {
            $devices[$j->{'device-id'}] = $j;
        }
        
        $dms = json_decode(getDMS());

        foreach ($dms->dmsItems as $s) {
            $msgs = array();
            $p1l1 = vmsFormat($s->dmsCurrentMessage->phase1Line1);
            $p1l2 = vmsFormat($s->dmsCurrentMessage->phase1Line2);
            $p1l3 = vmsFormat($s->dmsCurrentMessage->phase1Line3);
            $p2l1 = vmsFormat($s->dmsCurrentMessage->phase2Line1);
            $p2l2 = vmsFormat($s->dmsCurrentMessage->phase2Line2);
            $p2l3 = vmsFormat($s->dmsCurrentMessage->phase2Line3);

            $device = $devices[$s->{'device-id'}];
            $hwy = str_replace('OR', 'ORE', $device->{'route-id'});

            if ($p1l1 != '' || $p1l2 != '' || $p1l3 != '') {
                $msgs[] = [$p1l1, $p1l2, $p1l3];
            }

            if ($p2l1 != '' || $p2l2 != '' || $p2l3 != '') {
                $msgs[] = [$p2l1, $p2l2, $p2l3];
            }

            if ($msgs[0][0] == 'CC or TT' && $msgs[0][1] == '(Face 2)') {
                $msgs[0][0] = 'CARRY CHAINS';
                $msgs[0][1] = 'OR';
                $msgs[0][2] = 'TRACTION TIRES';
            } else if ($msgs[0][0] == 'CR on VT or OVER 10,000 GVW' && $msgs[0][1] == '(Face 4)') {
                $msgs[0][0] = 'CHAINS REQUIRED';
                $msgs[0][1] = 'ON VEHICLES TOWING';
                $msgs[0][2] = 'OR OVER 10000 GVW';
            }

            if (count($msgs) > 0) {
                $prop = array('id' => $device->{'device-id'}, 'name' => $device->{'device-name'}, 'hwy' => $hwy, 'mp' => $device->milepoint, 'attached' => $s->tocsEventId, 'messages' => $msgs);
                $features[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => [$device->longitude, $device->latitude]), 'properties' => $prop);
            }
        }

        $returnJson = array('type' => 'FeatureCollection', 'features' => $features);

        $memcache->set($cachefilename, json_encode($returnJson), 1200);
        $memcache->set($cachefilename.'-time', time(), 1200);
    } else {
        $isCached = true;
        $returnJson = json_decode($cache);
    }
} else if ($method == 'rwis') {
    $json = json_decode(file_get_contents('/home/mapo/public_html/cron/cache/rwis.json'), true)['features'];

    foreach ($json as $s) {
        $loc[] = ['hwy' => $s['properties']['station']['hwy'], 'mp' => $s['properties']['station']['mp']];
    }

    if ($loc != null) {
        uasort($loc, function($a, $b) {
            return [$a['hwy'], $a['mp']] <=> [$b['hwy'], $b['mp']];
        });
    }
    
    foreach ($loc as $k => $v) {
        if (($_REQUEST['grip'] == 1 && $json[$k]['properties']['surface']['grip'] != 'null') || !isset($_REQUEST['grip'])) {
            $features[] = $json[$k];
        }
    }

    $returnJson = array('type' => 'FeatureCollection', 'features' => $features);
} else if ($method == 'incidents') {
    if ($function == 'local') {
        $json = json_decode(getLocalIncidents());

        foreach ($json->Incidents as $incident) {
            $id = $incident->Id;
            $locdesc = $incident->LocationDescription;
            $type = $incident->Type;
            $impact = $incident->Impact;
            $comments = $incident->Comments;
            $dir = str_replace('_', ' ', $incident->Direction);
            preg_match('/([A-Z]+)\(/', $incident->GeometryWkt, $mtchs);
            $geoType = $mtchs[1];
            $geoType = ($geoType == 'MULTILINESTRING' ? 'MultiLineString' : ($geoType == 'LINESTRING' ? 'LineString' : $geoType));
            $created = strtotime($incident->CreateTime);
            $updated = strtotime($incident->UpdateTime);

            if ($geoType == 'MultiLineString' || $geoType == 'LineString') {
                $geo = decodePolyline($geoType, $incident->GeometryWkt);
            } else if ($geoType == 'MultiPoint') {
                $geo = [$geo, [$endLon, $endLat]];
            }

            $prop = [
                'id' => $id,
                'category' => $impact,
                'type' => $type,
                'priority' => 6,
                'location' => [
                    'id' => null,
                    'name' => $locdesc,
                    'hwy' => null,
                    'direction' => $dir,
                    'milepost' => null,
                    'desc' => null
                ],
                'impact' => null,
                'desc' => $comments,
                'lanes' => [],
                'created' => $created,
                'updated' => $updated
            ];

            $feat = ['type' => 'Feature', 'geometry' => ['type' => $geoType, 'coordinates' => $geo], 'properties' => $prop];
            print_r($feat);
        }
    } else {
        $cachefilename = 'odot_incidents'.($function == 'construction' ? '_rw' : '').($_REQUEST['test'] == 1 ? '_test' : '');
        $cache = $memcache->get($cachefilename);

        if (!$cache || filemtime(root() . 'roads.ini.php') > $memcache->get($cachefilename.'-time')) {
            $json = json_decode(getIncidents());

            foreach ($json->incidents as $incident) {
                if ($incident->{'is-active'} == true && ($incident->{'event-type-id'} != 'RW' && $function != 'construction' || $incident->{'event-type-id'} == 'RW' && $function == 'construction')) {
                    $affected = null;
                    //$geo = null;
                    $id = $incident->{'event-id'};
                    $category = incidentType($incident->{'event-type-id'});
                    $details = getIncidentDetails($incident->{'event-subtype-id'});
                    $type = $details['description'];
                    $priority = $details['priority'];
                    $created = strtotime(substr($incident->{'create-time'}, 0, -6));
                    $updated = strtotime(substr($incident->{'update-time'}, 0, -6));
                    $impact = $incident->{'impact-desc'};
                    $type = ($impact == 'Seasonal Closure' ? 'Closure': $type);
                    $desc = $incident->headline;
                    $comments = $incident->comments;
                    $hwy = hwy($incident->location->{'route-id'});
                    $name = $incident->location->{'location-name'};
                    $hid = $incident->location->{'hwy-id'};
                    $hwy = ($hwy == '' ? 'ORE'.$hid : $hwy);
                    $dir = $incident->location->direction;
                    #$geoType = ($incident->location->{'end-location'}->{'end-milepost'} ? ($incident->location->{'geometry-wkt-line'} != '' ? 'LineString' : 'MultiPoint') : 'Point');
                    preg_match('/([A-Z]+)\s/', $incident->location->{'geometry-wkt-line'}, $mtchs);
                    $geoType = ($incident->location->{'end-location'}->{'end-milepost'} ? ($incident->location->{'geometry-wkt-line'} != '' ? $mtchs[1] : 'MultiPoint') : 'Point');
                    $geoType = ($geoType == 'MULTILINESTRING' ? 'MultiLineString' : ($geoType == 'LINESTRING' ? 'LineString' : $geoType));
                    $startLat = $incident->location->{'start-location'}->{'start-lat'};
                    $startLon = $incident->location->{'start-location'}->{'start-long'};
                    $startMP = $incident->location->{'start-location'}->{'start-milepost'};
                    $endLat = $incident->location->{'end-location'}->{'end-lat'};
                    $endLon = $incident->location->{'end-location'}->{'end-long'};
                    $endMP = $incident->location->{'end-location'}->{'end-milepost'};
                    $where = $incident->location->{'start-location'}->{'location-desc'};
                    $where2 = $incident->location->{'end-location'}->{'location-desc'};

                    if (!empty($incident->{'travel-lanes'}->{'affected-lanes'})) {
                        foreach ($incident->{'travel-lanes'}->{'affected-lanes'} as $al) {
                            $affected[] = array('lane' => ucwords(str_replace('-', ' ', $al->{'lane-type'})), 'direction' => $al->direction);
                        }
                    }

                    $countyCoords = [];
                    $mps = array('start' => $startMP);
                    $geo = [$startLon, $startLat];
                    if ($geoType == 'MultiLineString' || $geoType == 'LineString') {
                        //$geo = decodePolyline($startLat, $startLon, $endLat, $endLon);
                        //$geo = [$geo, [$endLon, $endLat]];
                        $geo = decodePolyline($geoType, $incident->location->{'geometry-wkt-line'});
                        $mps['end'] = $endMP;
                    } else if ($geoType == 'MultiPoint') {
                        $geo = [$geo, [$endLon, $endLat]];
                        $mps['end'] = $endMP;
                    } else {
                        $endloc = null;
                    }

                    $prop = array('id' => $id, 'category' => $category, 'type' => $type, 'priority' => $priority, 'location' => array('id' => $hid, 'name' => $name, 'hwy' => $hwy, 'direction' => $dir, 'milepost' => $mps, 'desc' => $where), 'impact' => $impact, 'desc' => $desc);
                    
                    if ($comments) {
                        $link = false;
                        if (strpos($comments, 'Link to Additional Information') !== false) {
                            preg_match('/\((.*?)\)/', $comments, $n);
                            $comments = $n[1];
                            $link = true;
                        }

                        $prop['comments'] = array('link' => $link, 'desc' => $comments);
                    }

                    if ($incident->files) {
                        $prop['files'] = $incident->files;
                    }
                    
                    $prop['lanes'] = $affected;
                    $prop['created'] = $created;
                    $prop['updated'] = $updated;

                    if ($where2) {
                        $prop['location']['enddesc'] = $where2;
                    }

                    #$ups[] = $updated;
                    $feat[] = array('type' => 'Feature', 'geometry' => array('type' => $geoType, 'coordinates' => $geo), 'properties' => $prop);
                }
            }

            if ($feat != null) {
                usort($feat, function($a, $b) {
                    $aHwy = $a['properties']['location']['hwy'] ?? '';
                    $aMilepostStart = (int)($a['properties']['location']['milepost']['start'] ?? 0);
                    $aUpdated = $a['properties']['updated'] ?? 0;
                
                    $bHwy = $b['properties']['location']['hwy'] ?? '';
                    $bMilepostStart = (int)($b['properties']['location']['milepost']['start'] ?? 0);
                    $bUpdated = $b['properties']['updated'] ?? 0;
                
                    return [$aHwy, $aMilepostStart, $aUpdated] <=> [$bHwy, $bMilepostStart, $bUpdated];
                });
            }

            //$noMetadata = true;
            $returnJson = array('type' => 'FeatureCollection', 'features' => $feat);
            $memcache->set($cachefilename, json_encode($returnJson), 300);
            $memcache->set($cachefilename.'-time', time(), 300);
        } else {
            $isCached = true;
            $returnJson = json_decode($cache);
        }
    }
} else if ($method == 'travel') {
    $cachefilename = 'travel_times';
    $cache = $memcache->get($cachefilename);

    if (!$cache || filemtime('roads.ini.php') > $memcache->get($cachefilename.'-time')) {
        $json = json_decode(file_get_contents('https://www.tripcheck.com/Scripts/map/data/traveltime.js?'.time()));

        foreach ($json->features as $a) {
            $tt = $a->attributes;
            $id = $tt->origId;
            $lat = $tt->latitude;
            $lon = $tt->longitude;
            $starting = tt($tt->locationName);
            $updated = strtotime($tt->routes[0]->dt);

            /*if (count($tt->routes) == 1) {
                $ending = tt($tt->routes[0]->routeDest);
                $minTime = $tt->routes[0]->minRouteTime;
                $time = $tt->routes[0]->travelTime;
                $delay = $tt->routes[0]->delay;
                $pct = ($time && $minTime ? ($time - $minTime) / $minTime : null);

                $feat[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => [$lon, $lat]), 'properties' => array('id' => $id, 'start' => $starting, 'end' => $ending, 'minTime' => $minTime, 'travelTime' => $time, 'delay' => $delay, 'variable' => $pct, 'updated' => $updated));
            } else {*/
                $ending = [];

                for ($i = 0; $i < count($tt->routes); $i++) {
                    $minTime = $tt->routes[$i]->minRouteTime;
                    $totalMinTimes[] = $minTime;
                    $time = $tt->routes[$i]->travelTime;
                    $delay = $tt->routes[$i]->delay;
                    $totalDelays[] = ($time != -1 ? $time : 0);
                    $pct = ($time != -1 && $minTime ? ($time - $minTime) / $minTime : null);
                    $ending[] = array('to' => (strpos($tt->routes[$i]->routeDest, '[') !== false ? tt($tt->routes[$i]->routeDest) : $tt->routes[$i]->routeDest));
                }

                $feat[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => [$lon, $lat]), 'properties' => array('id' => $id, 'start' => $starting, 'end' => $ending, 'updated' => $updated));
            //}
        }

        $overall = (array_sum($totalMinTimes) - array_sum($totalDelays)) / array_sum($totalDelays);

        $returnJson = array('type' => 'FeatureCollection', 'features' => $feat, 'overall' => $overall);
        $memcache->set($cachefilename, json_encode($returnJson), 600);
        $memcache->set($cachefilename.'-time', time(), 600);
    } else {
        $isCached = true;
        $returnJson = json_decode($cache);
    }
} else if (!$method) {
    //$cachefile = './cache/road_weather.json';
    $cachefilename = 'road_weather';
    $cache = $memcache->get('road_weather');
    $backup = '../apps/oreroads/rw.json';

    if ($_REQUEST['test'] == 1) {
        $returnJson = array('rw' => json_decode(file_get_contents('./cache/rwtest.json')));
    } else {
        //if (!$cache || filemtime('roads.ini.php') > $memcache->get($cachefilename.'-time')) {
            $getrw = json_decode(getRW())->{'road-weather-reports'};

            /* if no 12-37s are returned from OODT */
            if ($getrw != null && count($getrw) == 0) {
                $json = json_decode(file_get_contents($backup));

                foreach ($json->rw as $rpt) {
                    unset($rpt->temp);
                    unset($rpt->weather);
                    unset($rpt->road);
                    unset($rpt->snow);
                    unset($rpt->notes);
                    unset($rpt->restrict);
                    $rw[] = $rpt;
                }

                $returnJson = array('rw' => $rw);
            } else {
                /* get reprots*/
                foreach ($getrw as $road) {
                    $id = $road->{'station-id'};
                    $hwyid = str_pad($road->location->{'hwy-id'}, 3, '0', STR_PAD_LEFT);
                    $name = format($road->location->{'location-name'});
                    $owner = maintSec($name);
                    $hwy = $road->location->{'route-id'};
                    $mps = [$road->location->{'start-location'}->{'start-milepost'}, $road->location->{'end-location'}->{'end-milepost'}];
                    $temp = round(($road->{'air-temperature'} * (9 / 5)) + 32, 0);
                    $wx = weather($road->{'weather-conditions'}->{'weather-id'});
                    $cond = cond($road->{'road-conditions'}->{'road-cond-id'});
                    $newsn = $road->{'snowfall-accum-rate'};
                    $roadsn = $road->{'adjacent-snow-depth'};
                    $notes = ucfirst($road->{'comments'});
                    $updated = strtotime($road->{'entry-time'});
                    $chains = restrict($road->{'commercial-vehicle-restriction'}, $road->{'driving-restriction'});

                    $rw[] = array('id' => $id, 'hwyID' => $hwyid, 'name' => $name, 'hwy' => $hwy, 'owner' => $owner, 'mileposts' => $mps, 'temp' => $temp, 'weather' => $wx, 'road' => ['id' => $road->{'road-conditions'}->{'road-cond-id'}, 'condition' => $cond],
                    'snow' => ['new' => ($newsn < 0 ? 'Trace' : $newsn), 'roadside' => ($roadsn < 0 ? 'Trace' : $roadsn)], 'notes' => $notes, 'restrict' => $chains, 'updated' => $updated);
                }
            }

            $returnJson = array('rw' => $rw);
            /*$memcache->set($cachefilename, json_encode($returnJson), 600);
            $memcache->set($cachefilename.'-time', time(), 600);            
        } else {
            $isCached = true;
            $returnJson = json_decode($cache);
        }*/
    }
} else if ($method) {
    $returnJson = array('error' => 'Invalid road data type');
}