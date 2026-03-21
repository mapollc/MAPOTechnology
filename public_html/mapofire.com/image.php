<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

$useMapo = isset($_GET['mapo']);
$path = $_GET['path'];

if ($_GET['type'] == 'spc') {
    $base = imagecreatefrompng("https://www.spc.noaa.gov/products/$path");
    $overlay = imagecreatefrompng('/home/mapo/public_html/images/counties.png');

    $baseWidth = imagesx($base);
    $baseHeight = imagesy($base);
    $overlayWidth = imagesx($overlay);
    $overlayHeight = imagesy($overlay);

    $destX = ($baseWidth - $overlayWidth) / 2;
    $destY = ($baseHeight - $overlayHeight) / 2;

    imagecopy($base, $overlay, $destX, $destY, 0, 0, $overlayWidth, $overlayHeight);

    header('Cache-Control: must-revalidate, public, max-age=21600');
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 21600));
    header('Content-type: image/png');

    ImagePNG($base);
} else {
    $baseUrl = $useMapo
        ? 'https://mapotechnology.com/images/mapofire/incidents/'
        : 'https://inciweb-prod-media-bucket.s3.us-gov-west-1.amazonaws.com/';

    $filename = "{$baseUrl}{$path}";
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $theFile = str_replace(' ', '%20', $filename);
    $src = $ext == 'png' ? imagecreatefrompng($theFile) : imagecreatefromjpeg($theFile);

    if ($_GET['small'] == 1) {
        [$width, $height] = getimagesize($theFile);

        if ($width > 0 && $height > 0) {
            $newWidth = 400;
            $newHeight = $height / ($width / 400);
            $img = imagecreatetruecolor($newWidth, $newHeight);

            if ($ext === 'png') {
                imagealphablending($img, false);
                imagesavealpha($img, true);
            }

            imagecopyresampled($img, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            $out = $img;
        } else {
            $out = $src;
        }
    } else {
        $out = $src;
    }

    header('Cache-Control: must-revalidate, public, max-age=604800');
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));

    if ($ext == 'png') {
        header('Content-type: image/png');
        ImagePNG($out);
    } else {
        header('Content-type: image/jpeg');
        ImageJPEG($out, null, 100);
    }
}