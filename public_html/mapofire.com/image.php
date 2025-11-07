<?
$filename = 'https://inciweb-prod-media-bucket.s3.us-gov-west-1.amazonaws.com/'.$_GET['path'];
$e = explode('.', $filename);
$ext = $e[count($e) - 1];

if ($ext == 'png') {
    $src = imagecreatefrompng(str_replace(' ', '%20', $filename));
} else {
    $src = imagecreatefromjpeg(str_replace(' ', '%20', $filename));
}

if ($_GET['small'] == 1) {
    list($width, $height) = getimagesize(str_replace(' ', '%20', $filename));
    $new_width = 400;
    $new_height = $height / ($width / 400);
    $img = imagecreatetruecolor($new_width, $new_height);

    imagecopyresampled($img, $src, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
    $out = $img;
} else {
    $out = $src;
}

header('Cache-Control: must-revalidate, public, max-age=604800');
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));
header('Pragma: cache');

if ($ext == 'png') {
    header('Content-type: image/png');
    ImagePNG($out);
} else {
    header('Content-type: image/jpeg');
    ImageJPEG($out);
}

ImageDestroy($out);