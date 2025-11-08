<?
$time = time();
$uid = 1;
$maxSize = 15728640; // 15 mb

function formatBytes($bytes)
{
    $units = array('B', 'KB', 'MB', 'GB', 'TB');

    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);

    $bytes /= pow(1024, $pow);

    return round($bytes, 1) . ' ' . $units[$pow];
}

if ($method == 'list') {
    $sql = mysqli_query($con2, "SELECT fid, fileName, file, type, stats, created, modified FROM userMapUploads WHERE uid = '$uid'");
    while ($row = mysqli_fetch_assoc($sql)) {
        foreach ($row as $k => $v) {
            $data[$k] = ($k == 'created' || $k == 'modified' || $k == 'fid' ? floatval($v) : $v);
        }

        $files[] = $data;
    }

    $out = array('files' => $files);
} else if ($method == 'rename') {
    $name = mysqli_real_escape_string($con2, $_REQUEST['n']);
    mysqli_query($con2, "UPDATE userMapUploads SET fileName = '$name', modified = '$time' WHERE fid = '$_REQUEST[fid]'");

    $out = array('success' => 1);
} else if ($method == 'custom') {
    if ($_GET['function'] == 'list') {
        $row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT content, profile, time FROM userMapObjects WHERE uid = '$uid'"));

        $out = array('content' => json_decode($row['content']), 'profile' => json_decode($row['profile']), 'sync' => $row['time']);
    } else {
        if ($_REQUEST['geo'] != 'null') {
            $geo = mysqli_real_escape_string($con2, ($_REQUEST['geo'] ? $_REQUEST['geo'] : ''));
            $profiles = mysqli_real_escape_string($con2, ($_REQUEST['profile'] ? $_REQUEST['profile'] : ''));

            $num = mysqli_num_rows(mysqli_query($con2, "SELECT oid FROM userMapObjects WHERE uid = '$uid'"));
            if ($num == 0) {
                $sql = "INSERT INTO userMapObjects (uid,content,profile,time) VALUES('$uid','$geo','$profiles','$time')";
            } else {
                $sql = "UPDATE userMapObjects SET content = '$geo', profile = '$profiles', time = '$time' WHERE uid = '$uid'";
            }

            mysqli_query($con2, $sql) or die(mysqli_error($con2));

            $out = array('success' => 1);
        }
    }
} else if ($method == 'retreive') {
    if ($_REQUEST['fid']) {
        $filename = '../data/userGIS/' . base64_decode($_REQUEST['fid']);

        if (file_exists($filename)) {
            $out = '';
            echo file_get_contents($filename);
            $noMetadata = true;
        } else {
            $out = array('error' => 'File does not exist');
        }
    } else {
        $out = array('error' => 'No file ID specified');
    }
} else {
    $target_dir = '../data/userGIS/';
    $fileName = md5(date('YmdHisv') . microtime());
    $target_file = $target_dir . $fileName;

    $original = $_FILES['file']['name'];
    $size = $_FILES['file']['size'];
    $basename = basename($original);
    $fileType = strtolower(pathinfo($target_dir . $basename, PATHINFO_EXTENSION));
    $fileName .= '.' . $fileType;
    $target_file .= '.' . $fileType;

    $uploadOk = true;
    $msg = '';

    // Check if file already exists
    if (file_exists($target_file)) {
        $fileName = md5(date('YmdHisv', strtotime('+1 second')) . microtime());
        $target_file = $target_dir . $fileName . '.' . $fileType;
    }

    // Check file size
    if ($size > $maxSize) {
        $msg = 'Sorry, your file is ' . formatBytes($size) . ' in size and cannot exceed 10 MB.';
        $uploadOk = false;
    }

    // Allow certain file formats
    if ($fileType != 'gpx' && $fileType != 'geojson' && $fileType != 'json' && $fileType != 'kml') {
        $msg = 'You tried to upload a .' . $fileType . ' file. Only .gpx, .geojson, .json, or .kml files are allowed.';
        $uploadOk = false;
    }

    // Check if $uploadOk is set to 0 by an error
    if ($uploadOk === false) {
        $out = array('error' => $msg);
        // if everything is ok, try to upload file
    } else {
        if (move_uploaded_file($_FILES['file']['tmp_name'], $target_file)) {
            if ($uid) {
                $time = time();
                mysqli_query($con2, "INSERT INTO userMapUploads (uid,fileName,file,stats,type,size,created,modified) VALUES('$uid','$original','$fileName','','$fileType','$size','$time','$time')") or die(mysqli_error($con2));
                $fid = mysqli_insert_id($con2);
            }

            $out = array('success' => 1, 'fid' => $fid, 'file' => $fileName, 'type' => $fileType, 'size' => $size, 'name' => $original, 'create' => $time, 'modify' => $time);

            if ($fid) {
                $out['fid'] = $fid;
            }
        } else {
            $out = array('error' => 'Sorry, there was an error uploading your file.');
        }
    }
}

$returnJson = $out;
