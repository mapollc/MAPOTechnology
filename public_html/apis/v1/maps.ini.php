<?
$noMetadata = true;
$style = $function;

function inlineURL($type, $style)
{
    global $version;
    global $_REQUEST;

    return "https://{$_SERVER['HTTP_HOST']}/v$version/maps/$type/$style?key=$_REQUEST[key]";
}

if ($method == 'style') {
    $path = "/home/mapo/public_html/mapofire.com/data/maps/$style.json";

    if (!file_exists($path)) {
        $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The tilejson style does not exist or cannot be found'];
    } else {
        $json = json_decode(file_get_contents($path), true);

        $json['sprite'] = inlineURL('sprites', $style);
        $json['glyphs'] = inlineURL('fonts', 'all') . '&fontstack={fontstack}&range={range}';

        $returnJson = $json;
    }
} else if ($method == 'sprites') {
    $path = "/home/mapo/public_html/mapofire.com/data/maps/sprites/$style.json";

    if (!file_exists($path)) {
        $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The tilejson style does not exist or cannot be found'];
    } else {
        $get = file_get_contents($path);

        if (str_contains($style, '.png')) {
            header('Content-type: image/png');
            echo $get;
        } else {
            $returnJson = json_decode($get);
        }
    }
} else if ($method == 'fonts') {
    $path = "/home/mapo/public_html/mapofire.com/data/maps/fonts/$_GET[fontstack]/$_GET[range].pbf";

    header('Content-type: application/x-protobuf');
    echo file_get_contents($path);
} else {
    $returnJson = ['response' => 'error', 'code' => 500, 'msg' => 'The data type specified is not valid'];
}