<?
$time = time();
$term = serialize($_POST['term']);
$title = mysqli_real_escape_string($con2, $_POST['title']);
$route = mysqli_real_escape_string($con2, $_POST['route']);
$season = mysqli_real_escape_string($con2, $_POST['season']);
$contrib = mysqli_real_escape_string($con2, $_POST['contributors']);
$keywords = mysqli_real_escape_string($con2, serialize(explode(', ', $_POST['keywords'])));
$trailID = null;

// add a new trail guide
if ($function == 'add') {
    $author = mysqli_real_escape_string($con2, $_POST['author']);

    #mysqli_query($con2, "INSERT INTO trails (`type`,author,title,`route`,keywords,season,contributors,created,updated,public,premium) VALUES('$_POST[type]','$author','$title','$route','$keywords','$season','$contrib','$time','$time','$_POST[public]','$_POST[premium]')");
    $trailID = mysqli_insert_id($con2);
    logEvent('Created a new trail guide (<a href="https://www.mapotechnology.com/account/admin/trails/edit?id=' . $trailID . '">' . $title . '</a>)');
}
// edit an existing trail guide
else if ($function == 'edit') {
    $trailID = $_POST['id'];

    // update photo captions
    if ($_POST['media']['id']) {
        for ($i = 0; $i < count($_POST['media']['id']); $i++) {
            $id = $_POST['media']['id'][$i];
            $caption = mysqli_real_escape_string($con2, $_POST['media']['caption'][$i]);
            $sqlQueries .= "UPDATE media SET title = '$caption', delta = '$i' WHERE id = '$id' AND trail_id = '$trailID';";
        }
    }

    $sqlQueries .= "UPDATE trails SET type = '$_POST[type]', title = '$title', route = '$route', season = '$season', contributors = '$contrib', keywords = '$keywords', updated = '$time', public = '$_POST[public]', premium = '$_POST[premium]' WHERE id = '$trailID';";
    logEvent('Edited trail guide #' . $trailID . ' (<a href="https://www.mapotechnology.com/account/admin/trails/edit?id=' . $trailID . '">' . $title . '</a>)');
}

// add or update categories
$sqlQueries .= "INSERT INTO categories (trail_id,term) VALUES('$trailID','$term') ON DUPLICATE KEY UPDATE term = '$term';";

// add new multimedia
if (count($_FILES['multimedia']['name']) > 0) {
    $existing = mysqli_num_rows(mysqli_query($con2, "SELECT delta FROM media WHERE trail_id = '$trailID'"));

    for ($i = 0; $i < count($_FILES['multimedia']['name']); $i++) {
        if (!empty($_FILES['multimedia']['name'][$i])) {
            $extn = pathinfo($_FILES["multimedia"]["name"][$i])['extension'];

            if ($extn == 'jpeg' || $extn == 'jpg' || $extn == 'png' || $extn == 'gif') {
                $target_dir = '/home/mapo/public_html/mapotrails.com/data/photos/';
                $basename = basename($_FILES['multimedia']['name'][$i]);

                if (file_exists($target_dir . $basename)) {
                    $e = explode('.', $basename);
                    $basename = str_replace('.' . $e[count($e) - 1], '', $basename) . '_' . rand(1, 10000) . '.' . $e[count($e) - 1];
                }
                $target_file = $target_dir . $basename;

                move_uploaded_file($_FILES['multimedia']['tmp_name'][$i], $target_file);
                $delta = $existing + $i;

                // get exif data about the photo
                $exif = exif_read_data($target_file, 'IFD0');
                $size = $exif['FileSize'];
                $ewidth = $exif['COMPUTED']['Width'];
                $eheight = $exif['COMPUTED']['Height'];
                $date = ($exif['DateTimeOriginal'] ? strtotime($exif['DateTimeOriginal']) : $exif['FileDateTime']);

                if ($size && $width && $height) {
                    $data = array('filesize' => $size, 'width' => $ewidth, 'height' => $eheight, 'time' => $date);

                    if ($exif['GPSLatitude'] && $exif['GPSLongitude']) {
                        $data['coordinates'] = gps($exif['GPSLatitude'], $exif['GPSLongitude']);
                    }

                    $exifData = serialize($data);
                } else {
                    $exifData = '';
                }

                $sqlQueries .= "INSERT INTO media (trail_id,file,type,title,data,delta) VALUES('$trailID','$basename','photo','','$exifData','$delta');";

                // make a copy of the image and resize it
                $exif = getimagesize($target_file);
                $width = $exif[0];
                $height = $exif[1];
                $type = ($exif['mime'] == 'image/jpeg' ? 'jpeg' : ($exif['mime'] == 'image/png' ? 'png' : ($exif['mime'] == 'image/gif' ? 'gif' : '')));
                $newwidth = 480;
                $newheight = round($height / ($width / 480), 0);
                $newwidth2 = 350;
                $newheight2 = round($height / ($width / 350), 0);
                $thumb = imagecreatetruecolor($newwidth, $newheight);
                $thumb2 = imagecreatetruecolor($newwidth2, $newheight2);
                $source = $type == 'jpeg' ? imagecreatefromjpeg($target_file) : ($type == 'png' ? imagecreatefrompng($target_file) : null);
                imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);
                imagecopyresampled($thumb2, $source, 0, 0, 0, 0, $newwidth2, $newheight2, $width, $height);

                if ($type == 'jpeg') {
                    imagejpeg($thumb, $target_dir . 'large/' . $basename, 100);
                    imagejpeg($thumb2, $target_dir . 'thumbnail/' . $basename, 100);
                } else if ($type == 'png') {
                    imagepng($thumb, $target_dir . 'large/' . $basename);
                    imagepng($thumb2, $target_dir . 'thumbnail/' . $basename);
                }
                imagedestroy($thumb);
                imagedestroy($thumb2);
            } else {
                $wf = true;
            }
        }
    }
}

// update or add waypoints
if ($_POST['waypoint']['id'] && count($_POST['waypoint']['id']) > 0) {
    for ($i = 0; $i < count($_POST['waypoint']['id']); $i++) {
        $name = mysqli_real_escape_string($con2, $_POST['waypoint']['name'][$i]);
        $note = mysqli_real_escape_string($con2, ($_POST['waypoint']['note'][$i] != '' ? $_POST['waypoint']['note'][$i] : 'N/A'));
        $id = $_POST['waypoint']['id'][$i];
        $delta = $_POST['waypoint']['delta'][$i];
        $lat = $_POST['waypoint']['lat'][$i];
        $lon = $_POST['waypoint']['lon'][$i];
        $icon = $_POST['waypoint']['icon'][$i];

        $json = json_decode(file_get_contents('https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify?geometry=%7B%22x%22%3A+' . $lon . '%2C%22y%22%3A+' . $lat . '%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&mosaicRule=&renderingRule=&renderingRules=%5B%7B%22rasterFunction%22%3A+%22None%22%7D%2C%7B%22rasterFunction%22%3A+%22Slope+Degrees%22%7D%2C%7B%22rasterFunction%22%3A+%22Aspect+Degrees%22%7D%2C%7B%22rasterFunction%22%3A+%22Height+Ellipsoidal%22%7D%5D&pixelSize=&time=&returnGeometry=false&returnCatalogItems=false&f=json'));
        $elev = round($json->value * 3.28084, 1);

        if (!$id && !$delta) {
            $delta = count($_POST['waypoint']['delta']) == 1 && !$delta ? 0 : $i;
            $sqlQueries .= "INSERT INTO waypoints (trail_id,name,lat,lon,elev,note,icon,delta) VALUES('$trailID','$name','$lat','$lon','$elev','$note','$icon','$delta');";
        } else {
            $sqlQueries .= "UPDATE waypoints SET name = '$name', lat = '$lat', lon = '$lon', elev = '$elev', note = '$note', icon = '$icon' WHERE id = $id AND trail_id = '$trailID' AND delta = $delta;";
        }
    }
}

// update existing gpx files
if ($_POST['oldgpx']['mode']) {
    $delt = 0;
    for ($i = 0; $i <= max(array_keys($_POST['oldgpx']['mode'])); $i++) {
        $id = $_POST['oldgpx']['id'][$i];
        $mode = $_POST['oldgpx']['mode'][$i];
        $caption = mysqli_real_escape_string($con2, $_POST['oldgpx']['caption'][$i]);
        $display = $_POST['oldgpx']['display'][$i];

        if ($_POST['oldgpx']['id'][$i]) {
            ////print_r(parseGPX($id, $trailID, $mode, $caption, $delt, $display, '/home/mapo/public_html/mapotrails.com/data/gpx/' . $_POST['oldgpx']['filename'][$i], false));
            $sqlQueries .= parseGPX($id, $trailID, $mode, $caption, $delt, $display, '/home/mapo/public_html/mapotrails.com/data/gpx/' . $_POST['oldgpx']['filename'][$i], false);
            
            $sqlQueries .= "UPDATE gpx SET mode = '$mode', caption = '$caption', delta = '$delt', display = '$display' WHERE id = '$id';";
            $delt++;
        }
        //}
    }
}

// add new gpx files
if ($_POST['gpx']) {
    $_POST['gpx']['mode'] = array_values($_POST['gpx']['mode']);
    $_POST['gpx']['caption'] = array_values($_POST['gpx']['caption']);
    $_POST['gpx']['display'] = array_values($_POST['gpx']['display']);

    if ($_POST['gpx']['mode']) {
        for ($i = 0; $i < count($_POST['gpx']['mode']); $i++) {
            $delta = ($_POST['oldgpx']['mode'] ? count($_POST['oldgpx']['mode']) : 0) + $i;
            $mode = $_POST['gpx']['mode'][$i];
            $caption = mysqli_real_escape_string($con2, $_POST['gpx']['caption'][$i]);
            $display = $_POST['gpx']['display'][$i];

            ////print_r(doUpload($con2, $i, $trailID, $mode, $caption, $delta, $display));
            $sqlQueries .= doUpload($con2, $i, $trailID, $mode, $caption, $delta, $display);
        }
    }
}

echo $sqlQueries;
/*if (!$wf) {
    ////echo $sqlQueries;
    $runSQL = mysqli_multi_query($con2, $sqlQueries) or die(mysqli_error($con2));
    if ($runSQL) {
        do {
            if ($result = mysqli_store_result($con2)) {
                while ($row = mysqli_fetch_row($result)) {
                }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con2)) {
            }
        } while (mysqli_next_result($con2));
    }
}*/

//updateTileset();

if ($function == 'edit') {
    if ($wf) {
        echo message(false, 'The multimedia you uploaded is not a PNG, JPEG, or GIF.');
    } else {
        echo message(true, '<b>' . $_POST['title'] . '</b> has successfully been updated.');
    }
} else {
    header('Location: edit?id=' . $trailID . '&justadded=1');
}