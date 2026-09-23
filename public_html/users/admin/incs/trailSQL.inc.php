<?
$time = time();
$term = mysqli_real_escape_string($con2, json_encode($_POST['term'] ?? ''));
$title = mysqli_real_escape_string($con2, $_POST['title']);
$route = mysqli_real_escape_string($con2, $_POST['route']);
$season = mysqli_real_escape_string($con2, $_POST['season']);
$contrib = mysqli_real_escape_string($con2, $_POST['contributors']);
$rawKeywords = explode(', ', $_POST['keywords']);
$keywords = mysqli_real_escape_string($con2, json_encode($rawKeywords));

$sqlQueries = '';
$trailID = null;
$wf = null;
$gpxDelta = 0;

$public = $_POST['public'] ?? 0;
$premium = $_POST['premium'] ?? 0;
$type = mysqli_real_escape_string($con2, $_POST['type']);

// add a new trail guide
if ($function == 'create') {
    $author = mysqli_real_escape_string($con2, $_POST['author']);

    mysqli_query($con2, "INSERT INTO trails (`type`,author,title,`route`,keywords,season,contributors,created,updated,public,premium)
    VALUES('$type','$author','$title','$route','$keywords','$season','$contrib','$time','$time',$public,$premium)");

    $trailID = mysqli_insert_id($con2);

    ////logEvent("Created a new trail guide (<a href=\https://www.mapotechnology.com/account/admin/trails/edit?id=$trailID\">$title</a>)");
} else if ($function == 'edit') {
    // edit an existing trail guide
    $trailID = $_POST['id'];

    // update photo captions
    if ($_POST['media']['id']) {
        for ($i = 0; $i < count($_POST['media']['id']); $i++) {
            $id = $_POST['media']['id'][$i];
            $caption = mysqli_real_escape_string($con2, $_POST['media']['caption'][$i]);

            $sqlQueries .= "UPDATE media SET title = '$caption', delta = '$i' WHERE id = $id AND trail_id = $trailID;";
        }
    }

    $sqlQueries .= "UPDATE trails SET type = '$type', title = '$title', route = '$route', season = '$season', contributors = '$contrib', 
        keywords = '$keywords', updated = '$time', public = $public, premium = $premium WHERE id = $trailID;";

    ////logEvent("Edited trail guide #$trailID (<a href=\"https://www.mapotechnology.com/account/admin/trails/edit?id=$trailID\">$title</a>)");
}

// add or update categories
$sqlQueries .= "INSERT INTO categories (trail_id,term) VALUES('$trailID','$term') ON DUPLICATE KEY UPDATE term = '$term';";

// add new multimedia
$multimedia = $_FILES['multimedia'];

if (count($multimedia['name']) > 0) {
    // Get the number of existing media records so delta can continue from there.
    $existing = mysqli_num_rows(mysqli_query($con2, "SELECT delta FROM media WHERE trail_id = $trailID"));

    // Keep delta independent of the upload array index so skipped files
    // don't create gaps in the media delta values.
    $delta = $existing;

    $target_dir = '/home/mapo/public_html/mapotrails.com/data/photos/';

    for ($i = 0; $i < count($multimedia['name']); $i++) {
        // Skip empty upload fields.
        if (empty($multimedia['name'][$i])) {
            continue;
        }

        // Skip files that PHP reported as having an upload error.
        if ($multimedia['error'][$i] !== UPLOAD_ERR_OK) {
            $wf = true;
            continue;
        }

        /*
         * Validate the actual image rather than trusting the filename extension.
         * getimagesize() also gives us the dimensions and MIME type we need later.
         */
        $exif = @getimagesize($multimedia['tmp_name'][$i]);

        if ($exif === false) {
            $wf = true;
            continue;
        }

        $mime = $exif['mime'];

        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif'], true)) {
            $wf = true;
            continue;
        }

        // Get the original extension from the uploaded filename.
        $extn = strtolower(pathinfo($multimedia['name'][$i], PATHINFO_EXTENSION));

        if ($extn === 'jpeg') $extn = 'jpg';

        // Generate a safe filename instead of relying on the user's uploaded filename. This also eliminates filename collisions.
        $basename = pathinfo($multimedia['name'][$i], PATHINFO_FILENAME)
            . '_' . bin2hex(random_bytes(4))
            . '.' . $extn;

        $target_file = "{$target_dir}{$basename}";

        // Move the original image into the photos directory.
        if (!move_uploaded_file($multimedia['tmp_name'][$i], $target_file)) {
            $wf = true;
            continue;
        }

        // Read EXIF data about the photo.
        $exifData = '';

        $exif = @exif_read_data($target_file, 'IFD0');

        if ($exif !== false) {
            $size = $exif['FileSize'] ?? filesize($target_file);
            $ewidth = $exif['COMPUTED']['Width'] ?? null;
            $eheight = $exif['COMPUTED']['Height'] ?? null;

            $date = null;

            if (!empty($exif['DateTimeOriginal'])) {
                $date = strtotime($exif['DateTimeOriginal']);
            } elseif (!empty($exif['FileDateTime'])) {
                $date = $exif['FileDateTime'];
            }

            if ($size && $ewidth && $eheight) {
                $data = [
                    'filesize' => $size,
                    'width'    => $ewidth,
                    'height'   => $eheight,
                    'time'     => $date
                ];

                if (!empty($exif['GPSLatitude']) && !empty($exif['GPSLongitude'])) {
                    $data['coordinates'] = gps(
                        $exif['GPSLatitude'],
                        $exif['GPSLongitude']
                    );
                }

                $exifData = json_encode(
                    $data,
                    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                );
            }
        }

        /*
         * Get the actual image dimensions.
         * $exif is already the getimagesize() result from above,
         * but read it again from the moved file so all processing
         * happens against the final file.
         */
        $exif = @getimagesize($target_file);

        // Remove the original if it somehow isn't a valid image.
        if ($exif === false) {
            unlink($target_file);
            $wf = true;
            continue;
        }

        $width = $exif[0];
        $height = $exif[1];

        $type = match ($exif['mime']) {
            'image/jpeg' => 'jpeg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
            default      => ''
        };

        if (!$type || !$width || !$height) {
            unlink($target_file);
            $wf = true;
            continue;
        }

        // Calculate resized dimensions while preserving aspect ratio.
        $newwidth = 480;
        $newheight = round($height / ($width / $newwidth));

        $newwidth2 = 350;
        $newheight2 = round($height / ($width / $newwidth2));

        // Create the resized images.
        $thumb = imagecreatetruecolor($newwidth, $newheight);
        $thumb2 = imagecreatetruecolor($newwidth2, $newheight2);

        // Preserve transparency for PNG and GIF images.
        if ($type === 'png' || $type === 'gif') {
            imagealphablending($thumb, false);
            imagesavealpha($thumb, true);

            imagealphablending($thumb2, false);
            imagesavealpha($thumb2, true);

            $transparent = imagecolorallocatealpha($thumb, 0, 0, 0, 127);
            $transparent2 = imagecolorallocatealpha($thumb2, 0, 0, 0, 127);

            imagefill($thumb, 0, 0, $transparent);
            imagefill($thumb2, 0, 0, $transparent2);
        }

        // Create the source image.
        $source = match ($type) {
            'jpeg' => @imagecreatefromjpeg($target_file),
            'png'  => @imagecreatefrompng($target_file),
            'gif'  => @imagecreatefromgif($target_file),
            default => false
        };

        if ($source === false) {
            unlink($target_file);

            $wf = true;
            continue;
        }

        // Resize the image to both required sizes.
        imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);
        imagecopyresampled($thumb2, $source, 0, 0, 0, 0, $newwidth2, $newheight2, $width, $height);

        // Save the large and thumbnail versions.
        if ($type === 'jpeg') {
            imagejpeg($thumb, "{$target_dir}large/$basename", 100);
            imagejpeg($thumb2, "{$target_dir}thumbnail/$basename", 100);
        } elseif ($type === 'png') {
            imagepng($thumb, "{$target_dir}large/$basename");
            imagepng($thumb2, "{$target_dir}thumbnail/$basename");
        } elseif ($type === 'gif') {
            imagegif($thumb, "{$target_dir}large/$basename");
            imagegif($thumb2, "{$target_dir}thumbnail/$basename");
        }

        /*
         * Add the media record to the existing SQL query string.
         *
         * Escape values because this is still using the existing
         * multi-query process rather than changing the database workflow.
         */
        $trailID_sql = mysqli_real_escape_string($con2, $trailID);
        $basename_sql = mysqli_real_escape_string($con2, $basename);
        $exifData_sql = mysqli_real_escape_string($con2, $exifData);

        $sqlQueries .= "INSERT INTO media (trail_id, file, type, title, data, delta) VALUES ('$trailID_sql', '$basename_sql', 'photo', '', '$exifData_sql', '$delta');";

        // Increment only after successfully processing the image.
        $delta++;
    }
}

// update or add waypoints
$waypoint = $_POST['waypoint'];

if (!empty($waypoint['id'])) {
    for ($i = 0; $i < count($waypoint['id']); $i++) {
        $id = $waypoint['id'][$i];
        $delta = $waypoint['delta'][$i];
        $lat = $waypoint['lat'][$i];
        $lon = $waypoint['lon'][$i];

        $icon = mysqli_real_escape_string($con2, $waypoint['icon'][$i]);
        $name = mysqli_real_escape_string($con2, $waypoint['name'][$i]);
        $note = mysqli_real_escape_string($con2, $waypoint['note'][$i] ?: 'N/A');

        $elev = getWaypointElev($lat, $lon);

        if (!$id && !$delta) {
            $delta = count($waypoint['delta']) == 1 ? 0 : $i;

            $sqlQueries .= "INSERT INTO waypoints (trail_id,name,lat,lon,elev,note,icon,delta) VALUES('$trailID','$name',$lat,$lon,$elev,'$note','$icon',$delta);";
        } else {
            $sqlQueries .= "UPDATE waypoints SET name = '$name', lat = $lat, lon = $lon, elev = $elev, note = '$note', icon = '$icon' WHERE id = $id AND trail_id = $trailID AND delta = $delta;";
        }
    }
}

// update existing gpx files
$oldgpx = $_POST['oldgpx'] ?? [];

if (!empty($oldgpx)) {
    foreach ($oldgpx['mode'] ?? [] as $i => $mode) {
        $id = $_POST['oldgpx']['id'][$i];

        if (!$id) continue;

        $caption = mysqli_real_escape_string($con2, $_POST['oldgpx']['caption'][$i]);
        $display = $_POST['oldgpx']['display'][$i];
        $filename = basename($_POST['oldgpx']['filename'][$i]);
        $file = "/home/mapo/public_html/mapotrails.com/data/gpx/$filename";

        $sqlQueries .= parseGPX(
            $id,
            $trailID,
            $mode,
            $caption,
            $gpxDelta,
            $display,
            $file,
            false
        );

        $sqlQueries .= "UPDATE gpx SET mode = '$mode', caption = '$caption', delta = $gpxDelta, display = '$display' WHERE id = $id AND trail_id = $trailID;";
        $gpxDelta++;
        //}
    }
}

// add new gpx files
$newGPX = $_POST['gpx'] ?? [];

if (!empty($newGPX['mode'])) {
    $newGPX['mode'] = array_values($newGPX['mode']);
    $newGPX['caption'] = array_values($newGPX['caption']);
    $newGPX['display'] = array_values($newGPX['display']);

    foreach ($newGPX['mode'] as $i => $mode) {
        $delta = $gpxDelta + $i;

        $caption = mysqli_real_escape_string($con2, $newGPX['caption'][$i]);
        $display = $newGPX['display'][$i] ?? 1;

        $sqlQueries .= doUpload(
            $i,
            $trailID,
            $mode,
            $caption,
            $delta,
            $display
        );
    }
}

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

updateTileset();

if ($function == 'edit') {
    if ($wf) {
        echo message(false, 'The multimedia you uploaded is not a PNG, JPEG, or GIF.');
    } else {
        echo message(true, '<b>' . $_POST['title'] . '</b> has successfully been updated.');
    }
} else {
    header("Location: edit?id=$trailID&justadded=1");
}