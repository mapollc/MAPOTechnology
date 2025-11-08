<?
/*$center = explode(',', $_REQUEST['center']);
$zoom = $_REQUEST['zoom'];
$tile = $_REQUEST['tile'];
$ths = ($_REQUEST['trailheads'] == 'true' ? true : false);
$trails = ($_REQUEST['trails'] == 'true' ? true : false);
$snotel = ($_REQUEST['snotel'] == 'true' ? true : false);
$avy = ($_REQUEST['avy'] == 'true' ? true : false);
$avyOpac = ($_REQUEST['avyOpac'] ? $_REQUEST['avyOpac'] : 40);
$aspect = ($_REQUEST['aspect'] == 'true' ? true : false);
$aspOpac = ($_REQUEST['aspOpac'] ? $_REQUEST['aspOpac'] : 40);
$way = ($_REQUEST['waypoints'] == 'true' ? true : false);
$fs = ($_REQUEST['usfs'] == 'true' ? true : false);
$method = ($_REQUEST['method'] ? 1 : 0);
 
/*$perimeters = array('minSize' => $_REQUEST['perimeters']['minSize'],
                    'color' => $_REQUEST['perimeters']['color'],
                    'zoom' => $_REQUEST['perimeters']['zoom'],
                    'ttip' => $_REQUEST['perimeters']['ttip']);
$weather = array('temp' => $_REQUEST['weather']['temp'],
                'wind' => $_REQUEST['weather']['wind']);*/

/*$time = time();
$settings = serialize(array('center' => array($center[0], $center[1]),
                            'zoom' => $zoom,
                            'tile' => $tile,
                            'trailheads' => $ths,
                            'trails' => $trails,
                            'avy' => $avy,
                            'aspect' => $aspect,
                            'avyOpac' => $avyOpac,
                            'aspOpac' => $aspOpac,
                            'snotel' => $snotel,
                            'waypoints' => $way,
                            'usfs' => $fs
                            /*'saveFreq' => $_REQUEST['saveFreq'],
                            'locallySave' => $_REQUEST['locallySave'],
                            'checkboxes' => $_REQUEST['checkboxes'],
                            'coordsDisplay' => $_REQUEST['coordsDisplay'],
                            'perimeters' => $perimeters,
                            'weather' => $weather,
                            'acres' => $_REQUEST['acres']*//*
                        ));

$_SESSION['mtsettings'] = $settings;

if ($_SESSION['uid']) {
    mysqli_query($con, "UPDATE trail_settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = '$_SESSION[uid]'");
    mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$_SESSION[uid]'");
}

$returnJson = array('success' => 1, 'time' => $time);*/

if ($method == 'folders') {
    if ($_SESSION['uid']) {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

        // list folders
        if ($function == 'list') {
            $result = mysqli_query($con2, "SELECT fid, name, items, created, modified FROM user_data_folders WHERE uid = '$_SESSION[uid]' ORDER BY name ASC");
            while ($row = mysqli_fetch_assoc($result)) {
                $fol[] = ['id' => $row['fid'], 'name' => $row['name'], 'items' => json_decode($row['items']), 'created' => intval($row['created']), 'modified' => intval($row['modified'])];
            }

            $returnJson = array('folders' => $fol);
        }

        // create a folder
        if ($function == 'create') {
            $id = mysqli_real_escape_string($con2, $_REQUEST['id']);
            $name = mysqli_real_escape_string($con2, $_REQUEST['name']);
            $created = mysqli_real_escape_string($con2, $_REQUEST['created']);
            $modified = mysqli_real_escape_string($con2, $_REQUEST['modified']);

            $sql = "INSERT INTO user_data_folders (uid,fid,name,items,created,modified) VALUES('$_SESSION[uid]','$id','$name','[]','$created','$modified')";

            if (mysqli_query($con2, $sql)) {
                $returnJson = array('response' => 'success', 'msg' => 'Successfully created folder #' . $id);
            } else {
                if (mysqli_errno($con2) == 1062) {
                    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'This folder exists already.');
                }
            }
        }

        // update folder details
        if ($function == 'update') {
            if (!$_REQUEST['id']) {
                $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An invalid GIS ID was sent for this feature.');
            } else {
                $id = mysqli_real_escape_string($con2, $_REQUEST['id']);
                $name = mysqli_real_escape_string($con2, $_REQUEST['name']);
                $items = mysqli_real_escape_string($con2, preg_replace('/\s{1,}/', '', $_REQUEST['items']));
                $modified = mysqli_real_escape_string($con2, $_REQUEST['modified']);
    
                $sql = "UPDATE user_data_folders SET ";

                if (isset($_REQUEST['name'])) {
                    $sql .= "name = (CASE WHEN name != '$name' THEN '$name' ELSE name END), ";
                }
                if (isset($_REQUEST['items'])) {
                    $sql .= "items = (CASE WHEN items != '$items' THEN '$items' ELSE items END), ";
                }

                $sql .= "modified = '$modified' WHERE uid = '$_SESSION[uid]' AND fid = '$id'";

                $exists = mysqli_num_rows(mysqli_query($con2, "SELECT id FROM user_data_folders WHERE uid = '$_SESSION[uid]' AND fid = '$id'"));

                if ($exists == 0) {
                    $returnJson = array('response' => 'error', 'code' => 3, 'msg' => 'The folder you\'re trying to update doesn\'t exist.');
                } else {
                    mysqli_query($con2, $sql);
                    $returnJson = array('response' => 'success', 'msg' => 'Successfully updated folder #' . $id);
                }
            }
        }

        // delete a folder
        if ($function == 'delete') {
            if (!$_REQUEST['id']) {
                $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An invalid GIS ID was sent for this feature.');
            } else {
                $id = mysqli_real_escape_string($con2, $_REQUEST['id']);
                $exists = mysqli_num_rows(mysqli_query($con2, "SELECT fid FROM user_data_folders WHERE uid = '$_SESSION[uid]' AND fid = '$id'"));

                if ($exists == 0) {
                    $returnJson = array('response' => 'error', 'code' => 3, 'msg' => 'The folder you\'re trying to delete doesn\'t exist.');
                } else {
                    mysqli_query($con2, "DELETE FROM user_data_folders WHERE fid = '$id'");
                    $returnJson = array('response' => 'success', 'msg' => 'Successfully deleted folder #' . $id);
                }
            }
        }
    }
} else if ($method == 'objects') {
    if ($_SESSION['uid']) {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

        // return all features from DB
        if ($function == 'list') {
            if ($_GET['extra'] == 'uploads') {
                $result = mysqli_query($con2, "SELECT fid, fileName, u.file, size, u.type AS fileType, gis_id AS id, ud.type, name, color, geojson AS coords, ud.stats, notes, ud.created, ud.modified FROM user_data AS ud LEFT JOIN userMapUploads AS u ON u.fid = ud.file WHERE ud.file != 0 AND ud.uid = '$_SESSION[uid]' ORDER BY u.created DESC");

                while ($row = mysqli_fetch_assoc($result)) {
                    $feat = [];
                    $fid = $row['fid'];

                    if (!isset($features[$fid])) {
                        $features[$fid] = array('fid' => intval($row['fid']), 'fileName' => $row['fileName'], 'file' => $row['file'], 'type' => $row['fileType'], 'size' => intval($row['size']), 'features' => []);
                    }

                    foreach ($row as $k => $v) {
                        if ($k != 'fid' && $k != 'fileName' && $k != 'file' && $k != 'fileType' && $k != 'size') {
                            $feat[$k] = $k == 'coords' || $k == 'stats' ? json_decode($v) : ($k == 'created' || $k == 'modified' || $k == 'size' || $k == 'fid' ? intval($v) : $v);
                        }
                    }

                    $features[$fid]['features'][] = $feat;
                }
                $features = array_values($features);
            } else {
                $result = mysqli_query($con2, "SELECT gis_id AS id, type, name, color, geojson AS coords, notes, stats, created, modified FROM user_data WHERE file = 0 AND uid = '$_SESSION[uid]' ORDER BY created DESC");

                while ($row = mysqli_fetch_assoc($result)) {
                    $feat = $row;

                    foreach ($row as $k => $v) {
                        $feat[$k] = $k == 'coords' || $k == 'stats' ? json_decode($v) : ($k == 'created' || $k == 'modified' ? intval($v) : $v);
                    }

                    $features[] = $feat;
                }
            }

            $returnJson = array('features' => $features);
        }

        // create new gis object
        if ($function == 'create') {
            $file = $_REQUEST['fid'] ? mysqli_real_escape_string($con2, $_REQUEST['fid']) : 0;
            $id = mysqli_real_escape_string($con2, $_REQUEST['id']);
            $type = mysqli_real_escape_string($con2, $_REQUEST['type']);
            $name = mysqli_real_escape_string($con2, $_REQUEST['name']);
            $color = mysqli_real_escape_string($con2, $_REQUEST['color']);
            $geojson = mysqli_real_escape_string($con2, preg_replace('/\s{1,}/', '', $_REQUEST['coords']));
            $notes = mysqli_real_escape_string($con2, $_REQUEST['notes']);
            $stats = mysqli_real_escape_string($con2, preg_replace('/\s{1,}/', '', $_REQUEST['stats']));
            $created = mysqli_real_escape_string($con2, $_REQUEST['created']);
            $modified = mysqli_real_escape_string($con2, $_REQUEST['modified']);

            $sql = "INSERT INTO user_data (uid,file,gis_id,type,name,color,geojson,notes,stats,created,modified) VALUES('$_SESSION[uid]','$file','$id','$type','$name','$color','$geojson','$notes','$stats','$created','$created')";

            if (mysqli_query($con2, $sql)) {
                $returnJson = array('response' => 'success', 'msg' => 'Successfully created feature #' . $id);
            } else {
                if (mysqli_errno($con2) == 1062) {
                    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'This feature exists already.');
                }
            }
        }

        // update an existing object
        if ($function == 'update') {
            if (!$_REQUEST['id']) {
                $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An invalid GIS ID was sent for this feature.');
            } else {
                $id = mysqli_real_escape_string($con2, $_REQUEST['id']);
                $name = mysqli_real_escape_string($con2, $_REQUEST['name']);
                $color = mysqli_real_escape_string($con2, $_REQUEST['color']);
                $geojson = mysqli_real_escape_string($con2, preg_replace('/\s{1,}/', '', $_REQUEST['coords']));
                $notes = mysqli_real_escape_string($con2, $_REQUEST['notes']);
                $stats = mysqli_real_escape_string($con2, preg_replace('/\s{1,}/', '', $_REQUEST['stats']));
                $modified = mysqli_real_escape_string($con2, $_REQUEST['modified']);

                $sql = "UPDATE user_data SET ";

                if (isset($_REQUEST['name'])) {
                    $sql .= "name = (CASE WHEN name != '$name' THEN '$name' ELSE name END), ";
                }
                if (isset($_REQUEST['color'])) {
                    $sql .= "color = (CASE WHEN color != '$color' THEN '$color' ELSE color END), ";
                }
                if (isset($_REQUEST['coords'])) {
                    $sql .= "geojson = (CASE WHEN geojson != '$geojson' THEN '$geojson' ELSE geojson END), ";
                }
                if (isset($_REQUEST['notes'])) {
                    $sql .= "notes = (CASE WHEN notes != '$notes' THEN '$notes' ELSE notes END), ";
                }
                if (isset($_REQUEST['stats'])) {
                    $sql .= "stats = (CASE WHEN stats != '$stats' THEN '$stats' ELSE stats END), ";
                }

                $sql .= "modified = '$modified' WHERE uid = '$_SESSION[uid]' AND gis_id = '$id'";

                $exists = mysqli_num_rows(mysqli_query($con2, "SELECT oid FROM user_data WHERE uid = '$_SESSION[uid]' AND gis_id = '$id'"));

                if ($exists == 0) {
                    $returnJson = array('response' => 'error', 'code' => 3, 'msg' => 'The feature you\'re trying to update doesn\'t exist.');
                } else {
                    mysqli_query($con2, $sql);
                    $returnJson = array('response' => 'success', 'msg' => 'Successfully updated feature #' . $id);
                }
            }
        }

        // delete an existing object
        if ($function == 'delete') {
            if (!$_REQUEST['id']) {
                $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'An invalid GIS ID was sent for this feature.');
            } else {
                $id = mysqli_real_escape_string($con2, $_REQUEST['id']);
                $exists = mysqli_num_rows(mysqli_query($con2, "SELECT oid FROM user_data WHERE uid = '$_SESSION[uid]' AND gis_id = '$id'"));

                if ($exists == 0) {
                    $returnJson = array('response' => 'error', 'code' => 3, 'msg' => 'The feature you\'re trying to delete doesn\'t exist.');
                } else {
                    mysqli_query($con2, "DELETE FROM user_data WHERE gis_id = '$id'");
                    $returnJson = array('response' => 'success', 'msg' => 'Successfully deleted feature #' . $id);
                }
            }
        }/* else {
        $returnJson = array('response' => 'error', 'code' => 9, 'msg' => 'Unauthenticated user');
    }*/
    }

    //  OLD METHODS //
} else if ($method == 'data') {
    if ($_SESSION['uid']) {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

        $row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT content, uploads, folders, time FROM userMapObjects WHERE uid = '$_SESSION[uid]' LIMIT 1"));
        mysqli_close($con2);

        $returnJson = array('userMapObjects' => array('features' => base64_encode($row['content']), 'uploads' => base64_encode($row['uploads']), 'folders' => base64_encode($row['folders']), 'sync' => intval($row['time'])));
    } else {
        $returnJson = array('error' => true, 'msg' => 'User not logged in');
    }
} else {
    $data = json_decode($_REQUEST['data']);
    $settings = json_encode($data->settings);
    $method = $_REQUEST['method'] == true ? 1 : 0;
    $time = time();

    if (!$data->version) {
        $_SESSION['mtsettings'] = $settings;
    }

    if ($_SESSION['uid']) {
        $set = mysqli_real_escape_string($con, $settings);

        mysqli_query($con, "UPDATE trail_settings SET settings = '$set', method = '$method', time = '$time' WHERE uid = '$_SESSION[uid]'") or die(mysqli_error($con));
        mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$_SESSION[uid]'") or die(mysqli_error($con));

        /*if ($data->content->draw != null || $data->content->uploads != null || $data->content->folders != null) {
            $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

            $a = mysqli_real_escape_string($con, base64_decode($data->content->draw));
            $b = mysqli_real_escape_string($con, base64_decode($data->content->uploads));
            $c = mysqli_real_escape_string($con, base64_decode($data->content->folders));

            $sql = "INSERT INTO userMapObjects (uid,content,uploads,folders,time) VALUES('$_SESSION[uid]','$a','$b','$c','$time') ON DUPLICATE KEY UPDATE content = '$a', uploads = '$b', folders = '$c', time = '$time'";

            mysqli_query($con2, $sql) or die(mysqli_error($con2));

            mysqli_close($con2);
        }*/
    }

    $returnJson = array('success' => 1, 'time' => $time);
}
