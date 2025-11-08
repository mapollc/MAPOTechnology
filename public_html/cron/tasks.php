<?
date_default_timezone_set('America/Los_Angeles');
ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once '../db.ini.php';

$now = time();
$sqlQueries = '';

/*function dualDomains()
{
    $msg = '';
    $fireVersion = '2.2';
    $jsFiles = ['incident.js', 'service-worker.js', 'wwas.js'];

    if (file_exists("/home/mapo/public_html/mapofire.com/v$fireVersion") && !file_exists("/home/mapo/public_html/wildfiremap.org/v$fireVersion")) {
        mkdir("/home/mapo/public_html/wildfiremap.org/v$fireVersion");

        $msg .= "Created new app version folder...
";
    }

    foreach ($jsFiles as $fileName) {
        if (!file_exists("/home/mapo/public_html/wildfiremap.org/v$fireVersion/$fileName") || filemtime("/home/mapo/public_html/mapofire.com/v$fireVersion/$fileName") > filemtime("/home/mapo/public_html/wildfiremap.org/v$fireVersion/$fileName")) {
            $put = file_put_contents(
                "/home/mapo/public_html/wildfiremap.org/v$fireVersion/$fileName",
                file_get_contents("/home/mapo/public_html/mapofire.com/v$fireVersion/$fileName")
            );

            $msg .= "Updated the \"$fileName\" file across dual domains...
";
        }
    }

    return $msg;
}*/

function sendReminderEmails() {
    global $now;
    global $con;

    $ppl = 0;
    $months2 = 365.25 / 6;
    $haventLoggedInSince = time() - $months2;
    $usql = mysqli_query($con, "SELECT first_name AS name, email, created, last_active AS active, type, time AS sent FROM users AS u LEFT JOIN reminders AS r ON r.uid = u.uid AND r.type = 'last_active' WHERE last_active <= $haventLoggedInSince OR last_active = '' ORDER BY last_active DESC");
    #$usql = mysqli_query($con, "SELECT u.uid, first_name AS name, email, created, last_active AS active, type, time AS sent FROM users AS u LEFT JOIN reminders AS r ON r.uid = u.uid AND r.type = 'last_active' WHERE u.uid = 1");

    while ($row = mysqli_fetch_assoc($usql)) {
        if ($now - $row['sent'] > (60 * 60 * 24 * $months2)) {
            $name = $row['name'];
            $email = $row['email'];
            $created = date('l, F j, Y \a\t g:i A', $row['created']);
            $never = $row['active'] == 0 ? true : false;
            $last = $never ? 'have never logged into any MAPO services' : 'haven\'t logged into any MAPO services since '.date('F j, Y', $row['active']);
            $msg = "We noticed that you $last.";

            if (sendEmail($email, "$name, we've missed you!", 'notactive', ['{name}' => $name, '{msg}' => $msg, '{created}' => $created])) {
                mysqli_query($con, "INSERT INTO reminders (uid,type,time) VALUES($row[uid],'last_active',$now)");
                $ppl++;
            }
        }
    }

    echo "Sent account reminder emails to $ppl users...
";
}

function syncFireFiles() {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://data.mapotechnology.com/generate-js.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch);

    return "$output
";
}

// expire any sessions that show as active, but have expired according to current time
$result = mysqli_query($con, "SELECT sid FROM sessions WHERE expires != 0 AND expires < '$now' AND source NOT LIKE 'com.mapollc%'");
while ($row = mysqli_fetch_assoc($result)) {
    $sqlQueries .= "UPDATE sessions SET expires = 0 WHERE sid = '$row[sid]';";
}

// remove user access to premium content if their subscription has expired
$result = mysqli_query($con, "SELECT email FROM billing WHERE end < '$now' AND active != 0");
while ($row = mysqli_fetch_assoc($result)) {
    $sqlQueries .= "UPDATE billing SET active = 0 WHERE email = '$row[email]';";
}

// run ALL sql queries
if ($sqlQueries) {
    if (mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con))) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) {
                }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) {
            }
        } while (mysqli_next_result($con));
    }
}

mysqli_close($con);

// delete old, cached API files older than 5 days
$dir = '/home/mapo/public_html/apis/cache/';
$cached = scandir($dir);

foreach ($cached as $file) {
    if (substr($file, 0, 3) == 'api' && (($now - filemtime($dir . $file)) > (60 * 60 * 24 * 5) || filesize($dir . $file) == 0)) {
        unlink($dir . $file);
    }
}

// delete old cron emails
$dir2 = '/home/mapo/mail/cur/';
$cached = scandir($dir2);

foreach ($cached as $file) {
    if ($file != '.' && $file != '..') {
        $e = explode('.', $file);
        if ($now - filemtime($dir2 . $e[0]) > (60 * 60 * 24 * 3) && $file) {
            unlink($dir2 . $file);
        }
    }
}

// delete old log files every 12 hours
$dir3 = '/home/mapo/logs/';
$logs = scandir($dir3);

foreach ($logs as $file) {
    if ($file != '.' && $file != '..') {
        if (time() - filectime($dir3 . $file) > 60 * 60 * 12) {
            if (!is_dir($dir3 . $file)) {
                unlink($dir3 . $file);
            }
        }
    }
}

// delete trash items every 3 days
$dir5 = '/home/mapo/.trash/';
$trash = scandir($dir5);

foreach ($trash as $file) {
    if ($file != '.' && $file != '..') {
        if (time() - filectime($dir5 . $file) > 60 * 60 * 24 * 3) {
            if (!is_dir($dir5 . $file)) {
                unlink($dir5 . $file);
            }
        }
    }
}

// delete old cache files on mapofire every 3 days
$dir4 = '/home/mapo/public_html/mapofire.com/apis/cache/';
$cached2 = scandir($dir4);

foreach ($cached2 as $file) {
    if ($file != '.' && $file != '..') {
        $e = explode('.', $file);
        if ($now - filemtime($dir4 . $e[0]) > (60 * 60 * 24 * 3) && $file) {
            unlink($dir4 . $file);
        }
    }
}

echo syncFireFiles();
////echo sendReminderEmails();

echo '-------------------------------------------------------
Completed all maintenance tasks...';
