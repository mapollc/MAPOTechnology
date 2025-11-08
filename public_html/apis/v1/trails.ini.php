<?
$filter = $_REQUEST['filter'];
$search = $_REQUEST['search'];

function truncate($text, $length) {
    $length = abs((int)$length);
    $text = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', strip_tags($text));

    if (strlen($text) > $length) {
        $text = preg_replace("/^(.{1,$length})(\s.*|$)/s", '\\1...', $text);
    }

    return str_replace('....', '...', $text);
}

/*function guideUrl($s, $ty, $id) {
    $s = str_replace(' ', '-', str_replace('  ', ' ', preg_replace('/([^A-Za-z0-9\s]+)/', '', strtolower($s))));
    return 'guides/' . $ty . '/' . $id . '/' . $s;
}*/

/*function distance($lat1, $lon1, $lat2, $lon2) {
 $theta = floatval($lon1) - floatval($lon2);
 $dist  = sin(deg2rad(floatval($lat1))) * sin(deg2rad(floatval($lat2))) + cos(deg2rad(floatval($lat1))) * cos(deg2rad(floatval($lat2))) * cos(deg2rad($theta));
 $dist  = acos($dist);
 $dist  = rad2deg($dist);
 $miles = $dist * 60 * 1.1515;
 return (is_nan($miles) ? 0 : round($miles, 2));
}*/

function trailColor($m) {
    $randcolor = array('cb2626', '40d740', 'ff973a', 'ebeb2e', 'f977dd', '6daee3', '9873f0', 'ff8298', '698d65', '009688', '3949ab', '880e4f');
    $z = rand(0, count($randcolor) - 1);

    if ($m == 'Snowmobile' && $m != 'Single Track') {
        $type = 'Sled';
        $color = 'ff0000';
    } else if ($m == 'Tour') {
        $type = 'Ski';
        $color = '0058aa';
    } else if ($m == 'Ski Line') {
        $type = 'Shred';
        $color = '13ff2f';
    } else if ($m == 'Gravel') {
        $type = 'gravelroad';
        $color = '747474';
    } else if ($m == 'ATV Track') {
        $type = 'ATV';
        $color = '00ffff';
    } else if ($m == 'Road') {
        $type = 'road';
        $color = '000';
    } else if ($m == 'Single Track') {
        $type = 'singletrack';
        $color = $randcolor[$z];
    } else {
        $color = '000';
    }
    return '#'.$color;
}

if ($method == 'list') {
    $where = '1=1';
    if ($filter) {
        $where = ($filter == 'trail' ? "t.type = 'trail'" : "t.type = 'snow'") . " AND";
    }
    if ($search) {
        $where .= " AND (t.title LIKE '%" . $search . "%' OR keywords LIKE '%" . $search . "%') AND";
    }
    if (!$filter && !$search) {
        $where .= ' AND ';
    }
    if ($_REQUEST['category']) {
        $where .= " term LIKE '%$_REQUEST[category]%' AND ";
    }
    if ($_REQUEST['area']) {
        if ($_REQUEST['area'] == 'all areas') {
            $where .= " keywords LIKE '%%' AND ";
        } else {
            $e = explode(' ', $_REQUEST['area']);
            foreach ($e as $a) {
                $kw .= "keywords LIKE '%".$a."%' AND ";
            }
            $where .= " (".substr($kw, 0, -5).") AND ";
        }
    }
    if ($_REQUEST['tid']) {
        $where = "t.id = ".$_REQUEST['tid'];
    }
    $where = (substr($where, -4) == ' AND' || substr($where, -5) == ' AND ' ? substr($where, 0, -4) : $where).' AND public = 1';
    
    $fields = 't.id, t.type, t.title, created, updated, public, premium, season, term, keywords, file, m.title AS caption, stats'.($_REQUEST['desc'] == 1 ? ', route' : '');

    $sql = "SELECT $fields FROM trails AS t LEFT JOIN categories AS c ON c.trail_id = t.id LEFT JOIN stats AS s ON s.trail_id = t.id LEFT JOIN media AS m ON m.trail_id = t.id AND m.type = 'photo' AND (delta = NULL OR delta = (SELECT MIN(delta) FROM media WHERE trail_id = t.id)) ".($where ? "WHERE ".$where." " : "")."ORDER BY id ASC".(isset($_REQUEST['seo']) ? ' LIMIT 4'.($_REQUEST['seo'] == 2 ? ',99999999' : '') : '');
    #echo $sql;
    $result = mysqli_query($con2, $sql);

    while ($row = mysqli_fetch_assoc($result)) {
        $sim = similar_text($row['title'], $search, $pct);
        $sim2 = similar_text($row['keywords'], $search, $pct2);
        $category = unserialize($row['term']);
        $stats = ($row['stats'] ? unserialize($row['stats']) : null);
        
        //if(!$_REQUEST[category] || ($_REQUEST[category]&&in_array($_REQUEST[category], $category))){
        $simtext[] = ($pct2 > $pct ? $pct2 : $pct);
        $content = array('trail_id' => intval($row['id']),
                        'type' => $row['type'],
                        'title' => $row['title'],
                        'photo' => array('thumbnail' => ($row['file'] ? 'thumbnail/' . $row['file'] : 'not_found2.png'),
                                        'url' => ($row['file'] ? $row['file'] : 'not_found2.png'),
                                        'caption' => $row['caption']),
                        'season' => $row['season'],
                        'keywords' => unserialize($row['keywords']),
                        'category' => (count($category) && $category[0] == "" ? array('Other') : $category),
                        'stats' => $stats,
                        'public' => intval($row['premium']),
                        'premium' => intval($row['premium']),
                        'updated' => ($row['updated'] ? $row['updated'] : $row['created']),
                        'url' => guideUrl($row['title'], $row['type'], $row['id']));
        
        if (isset($_REQUEST['desc']) && $_REQUEST['desc'] == 1) {
            $content['route'] = ($row['route'] ? truncate($row['route'], 300) : '');
        }

        $data[] = $content;
        //}
    }

    if ($search) {
        arsort($simtext);
        foreach ($simtext as $k => $v) {
            $trails[] = $data[$k];
        }
    } else {
        $trails = $data;
    }

    $return_json = array('trails' => $trails);
} else if ($method == 'nearby') {
    $coords = unserialize(mysqli_fetch_assoc(mysqli_query($con2, "SELECT stats FROM `stats` WHERE trail_id = $_REQUEST[id]"))['stats'])['geo']['start'];
    $sql = mysqli_query($con2, "SELECT t.id, t.type, t.title, season, term, keywords, file, stats FROM trails AS t LEFT JOIN categories AS c ON c.trail_id = t.id LEFT JOIN media AS m ON m.trail_id = t.id LEFT JOIN stats AS s ON s.trail_id = t.id WHERE delta = 0");

    while ($row = mysqli_fetch_assoc($sql)) {
        $stats = unserialize($row['stats']);
        $dist = distance($stats['geo']['start'][0], $stats['geo']['start'][1], $coords[0], $coords[1]);

        if ($dist < ($_REQUEST['distance'] ? $_REQUEST['distance'] : 10)) {
            $trails[] = array('trail_id' => $row['id'],
                            'type' => $row['type'],
                            'title' => $row['title'],
                            'photo' => array('thumbnail' => ($row['file'] ? 'thumbnail/' . $row['file'] : 'not_found2.png'),
                                            'url' => ($row['file'] ? $row['file'] : 'not_found2.png')),
                            'distance' => $dist,
                            'url' => guideUrl($row['title'], $row['type'], $row['id']));
        }
    }
    shuffle($trails);

    $return_json = array('nearby' => $trails);
} else if ($method == 'keywords') {
    $mode = ($_REQUEST['mode'] ? '= \'' . $_REQUEST['mode'] . '\'' : '!= \'\'');
    $sql = "SELECT keywords, mode FROM trails AS t LEFT JOIN gpx AS g ON g.trail_id = t.id WHERE mode $mode ORDER BY t.id ASC";
    $result = mysqli_query($con2, $sql);

    while ($row = mysqli_fetch_assoc($result)) {
        foreach (unserialize($row['keywords']) as $i) {
            $kw[] = $i;
        }
    }

    $kw = array_unique($kw);
    sort($kw);

    $return_json = array('keywords' => $kw);
} else if ($method == 'system') {
    $row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT id, name, trails, type FROM systems WHERE id = '$_GET[id]'"));
    $h = implode(' OR t.id = ', unserialize($row['trails']));
    $res = mysqli_query($con2, "SELECT t.*, c.term AS category, m.file, m.title AS caption FROM trails AS t LEFT JOIN categories AS c ON c.trail_id = t.id LEFT JOIN media AS m ON m.trail_id = t.id AND m.delta = 0 WHERE t.id = $h ORDER BY t.title ASC");

    while ($data = mysqli_fetch_assoc($res)) {
        $data['id'] = intval($data['id']);
        $data['photo'] = ['url' => $data['file'], 'caption' => $data['caption']];
        $data['route'] = truncate($data['route'], 350);
        $data['public'] = intval($data['public']);
        $data['premium'] = intval($data['premium']);
        $data['created'] = floatval($data['created']);
        $data['updated'] = floatval($data['updated']);
        $data['category'] = unserialize($data['category']);
        $data['keywords'] = unserialize($data['keywords']);

        unset($data['file']);
        unset($data['caption']);

        if ($data['category']) {
            foreach ($data['category'] as $c) {
                if (!in_array($c, $cat)) {
                    $cat[] = $c;
                }
            }
        }

        if ($data['keywords']) {
            foreach ($data['keywords'] as $k) {
                if (!in_array($k, $kw)) {
                    $kw[] = $k;
                }
            }
        }

        $trails[] = $data;
    }
    
    $prop = array('id' => $row['id'], 'name' => $row['name'], 'type' => $row['type'], 'url' => str_replace('guide', 'trail-system', guideUrl($row['name'], null, $row['id'])), 
    'categories' => $cat, 'keywords' => $kw, 'trails' => $trails);

    $return_json = array('system' => $prop);
} else if ($method == 'guide') {
    if ($function == 'short') {
        $meta = mysqli_fetch_assoc(mysqli_query($con2, "SELECT id, title, type, route FROM trails WHERE id = '$_REQUEST[id]' LIMIT 1"));
        $photo = mysqli_fetch_assoc(mysqli_query($con2, "SELECT file FROM media WHERE trail_id = '$_REQUEST[id]' AND delta = 0 LIMIT 1"));

        $arr = array('trail_id' => $meta['id'], 'title' => $meta['title'], 'type' => $meta['type'], 'route' => truncate($meta['route'], 165), 'photo' => $photo['file']);
    } else {
        $sql = "SELECT t.*, c.term, m.id AS mid, stats, m.file, m.title AS caption FROM trails AS t LEFT JOIN media AS m ON m.trail_id = t.id LEFT JOIN categories AS c ON c.trail_id = t.id LEFT JOIN stats AS s ON s.trail_id = t.id WHERE t.id = $_REQUEST[id] ORDER BY m.delta ASC";
        #echo $sql;
        $result = mysqli_query($con2, $sql) or die(mysqli_error($con2));
        $result2 = mysqli_query($con2, "SELECT id AS wpid, name, lat, lon, icon, note FROM waypoints WHERE trail_id = '$_REQUEST[id]'");
        $waypoints = [];
        $images = [];
        $meta = false;

        while ($row = mysqli_fetch_assoc($result)) {
            ////print_r($row);
            if (!$meta) {
                foreach ($row as $k => $v) {
                    if ($k == 'stats') {
                        $data['geo'] = unserialize($v)['geo']['start'];
                        $data['stats'] = unserialize($v);
                    } else if ($k != 'file' && $k != 'caption' && $k != 'mid' && $k != 'wpid' && $k != 'name' && $k != 'lat' && $k != 'lon' && $k != 'icon' && $k != 'note') {
                        $data[$k] = $k == 'keywords' || $k == 'term' ? unserialize($v) : $v;
                    }
                }
            }

            #if ($mid) {
                #if (!in_array($row['mid'], $mid)) {
                    if (file_exists('/home/mapo/public_html/mapotrails.com/data/photos/'.$row['file'])) {
                        $images[] = array('file' => $row['file'], 'caption' => $row['caption']);
                    }
                #}
            #}

            /*if (!in_array($row['wpid'], $wpid) && !empty($row['wid']) && $row['icon'] != 'media' && $row['lat'] != 0.0 && $row['lon'] != 0.0) {
                $waypoints[] = array('id' => $row['wid'], 'name' => $row['name'], 'lat' => $row['lat'], 'lon' => $row['lon'], 'icon' => $row['icon'], 'note' => $row['note']);
            }*/

            #$wpid[] = $row['wpid'];
            #$mid[] = $row['mid'];
            $meta = true;
        }

        while ($row = mysqli_fetch_assoc($result2)) {
            $wp = array();

            foreach ($row as $k => $v) {
                $wp[$k] = ($k == 'wpid' || $k == 'lat' || $k == 'lon' ? floatval($v) : $v);
            }

            $waypoints[] = $wp;
        }

        $arr = array('metadata' => $data);

        if (count($images) >= 0) {
            $arr['media'] = $images;
        }
        if (count($waypoints) >= 1) {
            $arr['waypoints'] = $waypoints;
        }
    }

    $return_json = array('guide' => $arr);
} else if ($method == 'geojson') {
    $sql = "SELECT t.id, t.type, t.title, g.id AS gis_id, filename, mode, caption, stats FROM trails AS t LEFT JOIN gpx AS g ON trail_id = t.id LEFT JOIN stats AS s ON s.trail_id = t.id WHERE t.id = '$_REQUEST[id]' AND display = 1 ORDER BY delta ASC";
    $result = mysqli_query($con2, $sql);
    $x = 0;

    while ($row = mysqli_fetch_assoc($result)) {
        $coords = array();

        $url = '../mapotrails.com/data/gpx/'.$row['filename'];
        $xml = json_decode(json_encode(simplexml_load_file($url)));

        for ($i = 0; $i < count($xml->trk->trkseg->trkpt); $i++) {
            $z = ($i == 0 ? 0 : $i - 1);
            $track = $xml->trk->trkseg->trkpt;
            $elev = $track[$i]->ele * 3.28084;
            $distance = floatval(distance($track[$i]->{'@attributes'}->lat, $track[$i]->{'@attributes'}->lon, $track[$z]->{'@attributes'}->lat, $track[$z]->{'@attributes'}->lon, false));
            $dist += (is_nan($distance) ? 0 : $distance);
            $coords[] = array(floatval($track[$i]->{'@attributes'}->lon), floatval($track[$i]->{'@attributes'}->lat));
            $chart[] = array('elev' => $elev, 'dist' => $dist);
        }

        if (count($coords) > 0) {
            $row['stats'] = unserialize($row['stats']);
            $row['color'] = trailColor($row['mode']);
            $row['seq'] = $i;
            $row['chart'] = $chart;
            $features[] = array('type' => 'Feature', 'geometry' => array('type' => 'LineString', 'coordinates' => $coords), 'properties' => $row);
        }
    }

    $return_json = array('type' => 'FeatureCollection', 'features' => $features);
} else if ($method == 'gis') {
    if ($function == 'display') {
        $result = mysqli_query($con2, "SELECT trail_id, id FROM gpx WHERE display = 1 ORDER BY trail_id ASC");
        while ($row = mysqli_fetch_assoc($result)) {
            $ids[$row['trail_id']][] = $row['id'];
        }

        $return_json = array('gis' => $ids);
    } else {
        $sql = "SELECT t.id, t.type, t.title, g.id AS gis_id, filename, mode, caption, stats FROM trails AS t LEFT JOIN gpx AS g ON trail_id = t.id LEFT JOIN stats AS s ON s.trail_id = t.id WHERE g.delta = 0 AND t.id = '$_REQUEST[id]' AND display = 1 ORDER BY delta ASC LIMIT 1";
        $result = mysqli_query($con2, $sql);
        $x = 0;

        while ($row = mysqli_fetch_assoc($result)) {
            $gps = array();
            $dist = 0;

            if ($x == 0) {
                $gis = array('trail_id' => $row['id'], 'title' => $row['title'], 'url' => guideUrl($row['title'], $row['type'], $row['id']), 'stats' => unserialize($row['stats']));
            }

            #if (file_exists('https://www.lagranderide.com/sites/lagranderide.com/files/map_data/' . $row['filename'])) {
                #$xml = json_decode(json_encode(simplexml_load_file('../sites/lagranderide.com/files/map_data/' . $row['filename'])));
                $url = '../mapotrails.com/data/gpx/'.$row['filename'];
            /*} else {
                #$xml = json_decode(json_encode(simplexml_load_file('../sites/lagranderide.com/files/' . $row['filename'])));
                $url = 'https://www.lagranderide.com/sites/lagranderide.com/files/' . $row['filename'];
            }*/
            $xml = json_decode(json_encode(simplexml_load_file($url)));

            for ($i = 0; $i < count($xml->trk->trkseg->trkpt); $i++) {
                $track = $xml->trk->trkseg->trkpt;
                $z = ($i == 0 ? 0 : $i - 1);
                $elev = $track[$i]->ele * 3.28084;
                $distance = floatval(distance($track[$i]->{'@attributes'}->lat, $track[$i]->{'@attributes'}->lon, $track[$z]->{'@attributes'}->lat, $track[$z]->{'@attributes'}->lon, false));
                $dist += (is_nan($distance) ? 0 : $distance);
                $gps[] = array('coords' => array(floatval($track[$i]->{'@attributes'}->lat),
                                                floatval($track[$i]->{'@attributes'}->lon)),
                                'chart' => array('elev' => floatval($elev),
                                                'dist' => $dist));
            }

            $gis['gis'][] = array('id' => $row['gis_id'],
                                'color' => trailColor($row['mode']),
                                'mode' => $row['mode'],
                                'caption' => $row['caption'],
                                'gpx' => $gps);
            $x++;
        }

        $return_json = array('trail' => $gis);
    }
} else if ($method == 'waypoints') {
    /*if (!$_REQUEST['filter']) {
        $where = ($_REQUEST['id'] ? ' AND trail_id = '.$_REQUEST['id'] : '');
        $sql = "SELECT waypoints.id, trail_id, name, lat, lon, elev, trails.type, note, icon FROM waypoints LEFT JOIN trails ON trails.id = trail_id WHERE lat != 0 AND lon != 0 AND icon != '' $where AND trails.public = 1 ORDER BY trail_id ASC, delta ASC";
    } else {
        $sql = "SELECT waypoints.id, trail_id, name, lat, lon, elev, trails.type, note, icon FROM waypoints LEFT JOIN trails ON trails.id = trail_id WHERE lat != 0 AND lon != 0 AND icon != '' AND type = '$_REQUEST[filter]' AND trails.public = 1 ORDER BY trail_id ASC, delta ASC";
        #$sql = "SELECT w.id, w.trail_id, name, lat, lon, elev, note, icon FROM waypoints AS w LEFT JOIN trails ON trails.id = trail_id LEFT JOIN categories AS c ON c.trail_id = w.trail_id WHERE lat != 0 AND lon != 0 AND icon != '' AND c.term LIKE '%$_REQUEST[filter]%' AND trails.public = 1 ORDER BY trail_id ASC, delta ASC";
    }*/
    if ($_REQUEST['category'] || $_REQUEST['activity']) {
        $where = 'AND '.($_REQUEST['category'] ? 'trails.type = \''.$_REQUEST['category'].'\'' : '').($_REQUEST['activity'] ? ' AND categories.term LIKE \'%'.str_replace('-', ' ', $_REQUEST['activity']).'%\'' : '');
        // AND trails.public = 1
        $sql = "SELECT waypoints.id, waypoints.trail_id, name, lat, lon, elev, trails.type, trails.premium, trails.public, note, icon FROM waypoints LEFT JOIN trails ON trails.id = waypoints.trail_id ".($_REQUEST['category'] ? 'LEFT JOIN categories ON categories.trail_id = waypoints.trail_id ' : '')."WHERE icon != 'media' AND lat != 0 AND lon != 0 AND icon != '' $where ORDER BY trail_id ASC, delta ASC";
    } else {
        $where = ($_REQUEST['id'] ? ' AND trail_id = '.$_REQUEST['id'] : '');
        // AND trails.public = 1
        $sql = "SELECT waypoints.id, trail_id, name, lat, lon, elev, trails.type, trails.premium, trails.public, note, icon FROM waypoints LEFT JOIN trails ON trails.id = trail_id WHERE icon != 'media' AND lat != 0 AND lon != 0 AND icon != '' $where ORDER BY trail_id ASC, delta ASC";
    }
    #echo $sql;

    $result = mysqli_query($con2, $sql);

    while ($row = mysqli_fetch_assoc($result)) {
        #$w[] = $row;
        $row['trail_id'] = intval($row['trail_id']);
        $row['id'] = intval($row['id']);
        $row['public'] = intval($row['public']);
        $row['premium'] = intval($row['premium']);
        $f = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => array(floatval($row['lon']), floatval($row['lat']))), 'properties' => $row);
        unset($f['properties']['lat']);
        unset($f['properties']['lon']);
        $w[] = $f;
    }

    #$return_json = array('waypoints' => $w);
    $return_json = array('type' => 'FeatureCollection', 'features' => $w);

    if ($_REQUEST['media'] == 1) {
        $sql2 = mysqli_query($con2, "SELECT trail_id, file, title, data, delta FROM `media` WHERE data LIKE '%\"coordinates\";a:2%' ORDER BY trail_id ASC, CAST(delta as INT) ASC");

        while ($row = mysqli_fetch_assoc($sql2)) {
            $media[] = array('tid' => $row['trail_id'], 'thumbnail' => 'photos/thumbnail/'.$row['file'], 'original' => 'photos/'.$row['file'], 'caption' => $row['title'], 'geo' => unserialize($row['data'])['coordinates']);
        }

        $return_json['media'] = $media;
    }
} else if ($method == 'bounds') {
    $row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT filename FROM gpx WHERE trail_id = '$_REQUEST[id]' AND delta = 0"));
    $url = '../mapotrails.com/data/gpx/'.$row['filename'];
    $xml = json_decode(json_encode(simplexml_load_file($url)));
    $track = $xml->trk->trkseg->trkpt;

    for ($i = 0; $i < count($track); $i++) {
        $lats[] = $track[$i]->{'@attributes'}->lat;
        $lons[] = $track[$i]->{'@attributes'}->lon;
    }

    $return_json = array('bounds' => array('ne' => [floatval(max($lons)), floatval(max($lats))], 'sw' => [floatval(min($lons)), floatval(min($lats))]));
}

$returnJson = $return_json;
