<?
$file = json_decode(file_get_contents('./cache/tfrs.json'), true);

if (isset($method)) {
    foreach ($file['features'] as $f) {
        if ($f['properties']['id'] == str_replace('-', '/', $method)) {
            $f['properties']['geo'] = $f['geometry'];
            $out = array('tfr' => $f['properties']);
        }
    }
} else {
    $out = $file;
}

$out['updated'] = filemtime('./cache/tfrs.json');

$returnJson = $out;
?>