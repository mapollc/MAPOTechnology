<?
$noMetadata = true;
$style = $function;

function inlineURL($type, $style)
{
    global $version;
    global $_REQUEST;

    return "https://{$_SERVER['HTTP_HOST']}/v$version/maps/$type/$style?key=$_REQUEST[key]";
}

$mappingFolder = '/home/mapo/mapping/';

if ($method == 'tiles') {
    $tile = $function;
    $x = $_REQUEST['x'];
    $y = $_REQUEST['y'];
    $z = $_REQUEST['z'];

    $path = "/home/mapo/public_html/cron/tiles/$tile/";

    if (!file_exists($path)) {
        return $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The tile name specified does not exist'];
    }

    $file = "{$path}$z/$x/$y.pbf";

    if (!file_exists($file)) {
        http_response_code(404);
        return;
    }

    while (ob_get_level()) {
        ob_end_clean();
    }

    $data = file_get_contents($file);
    $uncompressed = @gzdecode($data);

    if ($uncompressed !== false) {
        $data = $uncompressed;
    }

    echo $data;
    return;
}

if ($method == 'style') {
    $path = "{$mappingFolder}$style.json";

    if (!file_exists($path)) {
        $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The tilejson style does not exist or cannot be found'];
    } else {
        $json = json_decode(file_get_contents($path), $style == 'usfs' ? false : true);

        if ($style != 'usfs') {
            $json['sprite'] = inlineURL('sprites', $style);
            $json['glyphs'] = inlineURL('fonts', 'all') . '&fontstack={fontstack}&range={range}';
        } else {
            $json->sprite = inlineURL('sprites', $style);
            $json->glyphs = inlineURL('fonts', 'all') . '&fontstack={fontstack}&range={range}';
        }

        $returnJson = $json;
    }

    return;
}

if ($method == 'sprites') {
    $path = "{$mappingFolder}sprites/$style";

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

    return;
}

if ($method == 'fonts') {
    $path = "{$mappingFolder}fonts/$_GET[fontstack]/$_GET[range].pbf";

    header('Content-type: application/x-protobuf');
    echo file_get_contents($path);
    return;
}

$returnJson = ['response' => 'error', 'code' => 500, 'msg' => 'The data type specified is not valid'];