<?
ini_set('display_errors', 0);
$con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

$result = mysqli_query($con, "SELECT t.id AS id, t.title AS title, file FROM media AS m LEFT JOIN trails AS t ON t.id = m.trail_id ORDER BY id DESC, CAST(delta as INT) DESC");
$target_dir = '/home/mapo/public_html/mapotrails.com/data/photos/';

echo '<table style="width:100%" border="1" cellspacing="0" cellpadding="5"><thead><tr><th>Trail ID</th><th>Guide Title></th><th>File</th><th>Original</th><th>Large</th><th>Thumbnail</th></tr></thead><tbody>';
while ($row = mysqli_fetch_assoc($result)) {
    $target_file = $target_dir . $row['file'];
    $file1 = file_exists($target_file);
    $file2 = file_exists($target_dir . 'large/' . $row['file']);
    $file3 = file_exists($target_dir . 'thumbnail/' . $row['file']);

    /*if ($file1) {
        $exif = getimagesize($target_file);
        $width = $exif[0];
        $height = $exif[1];
        $type = ($exif['mime'] == 'image/jpeg' ? 'jpeg' : ($exif['mime'] == 'image/png' ? 'png' : ($exif['mime'] == 'image/gif' ? 'gif' : '')));
        $newwidth = 480;
        $newheight = round($height / ($width / 480), 0);
        $newwidth2 = 350;
        $newheight2 = round($height / ($width / 350), 0);
        $source = ($type == 'jpeg' ? imagecreatefromjpeg($target_file) : ($type == 'png' ? imagecreatefrompng($target_file) : null));

        if (!$file2) {
            $thumb = imagecreatetruecolor($newwidth, $newheight);
            imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);

            if ($type == 'jpeg') {
                imagejpeg($thumb, $target_dir . 'large/' . $row['file'], 100);
            } else if ($type == 'png') {
                imagepng($thumb, $target_dir . 'large/' . $row['file']);
            }
            imagedestroy($thumb);

            echo 'Updated "large" image for trail guide #'.$row['id'].'...
';
        }

        if (!$file3) {
            $thumb2 = imagecreatetruecolor($newwidth2, $newheight2);
            imagecopyresampled($thumb2, $source, 0, 0, 0, 0, $newwidth2, $newheight2, $width, $height);

            if ($type == 'jpeg') {
                imagejpeg($thumb2, $target_dir . 'thumbnail/' . $row['file'], 100);
            } else if ($type == 'png') {
                imagepng($thumb2, $target_dir . 'thumbnail/' . $row['file']);
            }

            imagedestroy($thumb2);

            echo 'Updated "thumbnail" image for trail guide #'.$row['id'].'...
';
        }
    }*/

    echo '<tr><td>'.$row['id'].'</td><td>'.$row['title'].'</td><td>'.$row['file'].'</td><td>'.($file1 ? 'YES' : 'NO').'</td><td>'.($file2 ? 'YES' : 'NO').'</td><td>'.($file3 ? 'YES' : 'NO').'</td></tr>';
}
echo '</tbody></table>';
