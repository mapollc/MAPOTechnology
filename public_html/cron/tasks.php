<?
date_default_timezone_set('America/Los_Angeles');
ini_set('display_errors', 1);
error_reporting(E_ERROR | E_PARSE);

include_once '../db.ini.php';

$now = time();
$year = date('Y', $now);
$sqlQueries = [];

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

function sendReminderEmails()
{
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
            $last = $never ? 'have never logged into any MAPO services' : 'haven\'t logged into any MAPO services since ' . date('F j, Y', $row['active']);
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

function syncFireFiles()
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://data.mapotechnology.com/generate-js.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch);

    return "$output
";
}

function deleteOldAPIFiles()
{
    $dir = '/home/mapo/public_html/apis/cache/';
    foreach (scandir($dir) as $f) {
        if (str_starts_with($f, 'api') && (($GLOBALS['now'] - filemtime("$dir$f")) > 432000 || !filesize("$dir$f"))) {
            @unlink("$dir$f");
        }
    }
    return "Old API cache files deleted...
";
}

function deleteCronEmails()
{
    $dir = '/home/mapo/mail/cur/';
    foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
        if (($GLOBALS['now'] - filemtime($dir . explode('.', $f)[0])) > 259200) {
            @unlink("$dir$f");
        }
    }
    return "Old system emails deleted...
";
}

function deleteOldLogFiles()
{
    $dir = '/home/mapo/logs/';
    foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
        if (!is_dir("$dir$f") && (time() - filectime("$dir$f")) > 43200) {
            @unlink("$dir$f");
        }
    }
    return "Old log files deleted...
";
}

function deleteMFCache()
{
    $dir = '/home/mapo/public_html/mapofire.com/apis/cache/';
    foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
        if (($GLOBALS['now'] - filemtime($dir . explode('.', $f)[0])) > 259200) {
            @unlink("$dir$f");
        }
    }
    return "Old Map of Fire API cache files deleted...
";
}

function deleteTrash()
{
    $dir = '/home/mapo/.trash/';
    foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
        if (!is_dir("$dir$f") && (time() - filectime("$dir$f")) > 259200) {
            @unlink("$dir$f");
        }
    }
    return "Files in trash deleted...
";
}

function inciwebContainment()
{
    global $con;
    global $year;

    $q = [];
    $iw = mysqli_query($con, "SELECT state, year, name, data FROM `inciweb` WHERE year = $year");
    while ($row = mysqli_fetch_assoc($iw)) {
        $arr = unserialize($row['data'])['data'];

        if ($arr['Current Situation']) {
            foreach ($arr['Current Situation'] as $item) {
                if (isset($item['desc']) && strtolower($item['desc']) === 'containment' && $item['info'] === '100%') {
                    $stat = json_encode(['Contain' => -1]);
                    $q[] = "UPDATE wildfires SET status = '$stat' WHERE year = $row[year] AND state = '$row[state]' AND name LIKE '%$row[name]%' AND (status IS NULL OR status = '' OR status != '$stat')";
                }
            }
        }
    }

    return $q;
}
function expireSessions()
{
    global $con;
    global $now;

    $q = [];
    $result = mysqli_query($con, "SELECT sid FROM sessions WHERE expires != 0 AND expires < '$now' AND source NOT LIKE 'com.mapollc%'");
    while ($row = mysqli_fetch_assoc($result)) {
        $q[] = "UPDATE sessions SET expires = 0 WHERE sid = '$row[sid]'";
    }
    return $q;
}

function inactiveSubs()
{
    global $con;
    global $now;
    $q = [];

    $result = mysqli_query($con, "SELECT email FROM billing WHERE end < $now AND status != 'expired'");
    while ($row = mysqli_fetch_assoc($result)) {
        $q[] = "UPDATE billing SET status = 'expired' WHERE email = '$row[email]'";
    }

    return $q;
}

function freshenTopFires()
{
    $memcache = new Memcached();
    if (!count($memcache->getServerList())) $memcache->addServer('127.0.0.1', 11211);

    if ($memcache->get('trendingFires_v1')) $memcache->delete('trendingFires_v1');
    if ($memcache->get('trendingFires_v2')) $memcache->delete('trendingFires_v2');

    $ago = strtotime('-15 minutes');
    return ["DELETE FROM topFires WHERE time < $ago"];
}

function updateLocations()
{
    global $con;
    $time = strtotime('-1 day');
    $queries = [];

    $result = mysqli_query($con, "SELECT wfid, state, lat, lon FROM `wildfires` WHERE date >= $time AND near LIKE '%\"near\":\"\"%'");
    while ($row = mysqli_fetch_assoc($result)) {
        $coords = [$row['lat'], $row['lon']];
        $state = $row['state'];
        $getLocation = getLocation($con, $coords, false, $state);
        $getCounty = getCounty($con, $coords);
        $geo = mysqli_real_escape_string($con, $getLocation);
        $near = $getCounty ?: [
            'county' => null,
            'fips' => null
        ];

        $near['near'] = $getLocation ?: null;
        $near = mysqli_real_escape_string($con, json_encode($near));

        $queries[] = "UPDATE wildfires SET near = '$near', geo = '$geo' WHERE wfid = $row[wfid]";
    }

    return $queries;
}

// if an inciweb fire says a fire is 100% contained, update the wildfires database with that info
$sqlQueries = [...$sqlQueries, ...inciwebContainment()];
echo 'Wildfires DB updated with contained status from Inciweb...
';

// expire any sessions that show as active, but have expired according to current time
$sqlQueries = [...$sqlQueries, ...expireSessions()];
echo 'Inactive user sessions set to expired...
';

// remove top fires to keep top fires' algorithm fresh
$sqlQueries = [...$sqlQueries, ...freshenTopFires()];
echo 'Top fires algorithm refreshed...
';

// update locations of any fires that are lacking a location
$sqlQueries = [...$sqlQueries, updateLocations()];
echo 'Updated locations of location-less wildfires...
';

// remove user access to premium content if their subscription has expired
$sqlQueries = [...$sqlQueries, ...inactiveSubs()];
echo 'Inactive subscriptions set to expired and permissions removed...

====== Executing MySQL queries ======
';

// run ALL sql queries
if (!empty($sqlQueries)) {
    $sql = implode(';', $sqlQueries);

    if (mysqli_multi_query($con, $sql) or die(mysqli_error($con))) {
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
echo '
====== Starting file maintenance tasks ======
';

// delete old, cached API files older than 5 days
echo deleteOldAPIFiles();

// delete old cron emails
echo deleteCronEmails();

// delete old log files every 12 hours
echo deleteOldLogFiles();

// delete trash items every 3 days
echo deleteTrash();

// delete old cache files on mapofire every 3 days
echo deleteMFCache();

// generate wildfire API for faster loads
echo syncFireFiles();

// send emails to users who haven't been active in awhile
////echo sendReminderEmails();

echo '====== Completed all maintenance tasks ======
';
