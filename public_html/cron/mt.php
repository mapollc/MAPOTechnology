<?
$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

function convert($lat) {
    $a = explode('/', $lat[0])[0];
    $b = explode('/', $lat[1])[0];
    $c = explode('/', $lat[2])[0];

    return [$a, $b, $c];
}


function DMStoDD($deg, $min, $sec) {
    return $deg + ((($min * 60) + (substr($sec, 0, -2).'.'.substr($sec, -2))) / 3600);
}

function gps($lat, $lon) {
    $a = convert($lat);
    $b = convert($lon);

    return [DMStoDD($a[0], $a[1], $a[2]), DMStoDD($b[0], $b[1], $b[2]) * -1];
}

$sql = mysqli_query($con2, "SELECT id, file FROM media ORDER BY trail_id ASC, CAST(delta AS INT)");

while ($row = mysqli_fetch_assoc($sql)) {
    $exif = exif_read_data('/home/mapo/public_html/mapotrails.com/data/photos/'.$row['file'], 'IFD0');
    $size = $exif['FileSize'];
    $width = $exif['COMPUTED']['Width'];
    $height = $exif['COMPUTED']['Height'];
    $date = ($exif['DateTimeOriginal'] ? strtotime($exif['DateTimeOriginal']) : $exif['FileDateTime']);

    if ($size && $width && $height) {
    $data = array('filesize' => $size, 'width' => $width, 'height' => $height, 'time' => $date);
    
    if ($exif['GPSLatitude'] && $exif['GPSLongitude']) {
        $data['coordinates'] = gps($exif['GPSLatitude'], $exif['GPSLongitude']);
    }

    $data = serialize($data);

    echo "UPDATE media SET data = '$data' WHERE id = '$row[id]';
";
    }
}
?>