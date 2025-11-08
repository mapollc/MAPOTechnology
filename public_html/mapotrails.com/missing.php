<?
$files = scandir('./data/photos/');

foreach ($files as $f) {
    if ($f != '.' && $f != '..') {
        /*$name = substr($f, 0, -4).'_0'.substr($f, -4);
        $get = file_get_contents('https://www.lagranderide.com/sites/lagranderide.com/files/styles/thumbnail/public/'.$name);

        if ($get) {
            file_put_contents('./data/photos/thumbnail/'.$f, $get);
        }*/

        $fp = fopen('./data/photos/'.$f, 'rb');
        $headers = exif_read_data($fp);

        $arr[] = array($f, $headers['COMPUTED']['Width'], $headers['COMPUTED']['Height']);
    }
}

usort($arr, function ($a, $b) {
    return $b[1] - $a[1];
});

echo '<table><thead><tr><th>File</th><th>Width</th><th>Height</th></tr></thead>';
foreach($arr as $v){
    echo '<tr><td>'.$v[0].'</td><td>'.$v[1].'</td><td>'.$v[2].'</td></tr>';
}
echo '</table>';

/*$con = mysqli_connect('localhost', 'mapo_main', 'Q.1.w.2.e34', 'mapo_trails');

$result = mysqli_query($con, "SELECT trails.title, file FROM `trails` LEFT JOIN media ON trail_id = trails.id WHERE media.type != 'video'");
while ($row = mysqli_fetch_assoc($result)) {
    $img = './data/photos/'.$row['file'];

    if (!file_exists($img)) {
        //echo $row['file'].'<br>';
        $file = substr($row['file'], 0, -4).'_0'.substr($row['file'], -4);
        $table .= '<tr><td style="'.($row['title'] != $prevtitle ? 'border-top:1px solid black' : '').';font-weight:bold">'.$row['title'].'</td>';
        $table .= '<td><a href="https://www.lagranderide.com/sites/lagranderide.com/files/'.$file.'">'.$file.'</a></td></tr>';
        $prevtitle = $row['title'];

        echo $row['file'].'<br>';
    }
}

/*
<table cellpadding="5" cellspacing="0">
    <?=$table?>
</table>*/
?>