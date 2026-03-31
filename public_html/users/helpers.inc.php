<?
include_once '../db.ini.php';
require_once './secure.inc.php';
include_once '/home/mapo/public_html/subs.inc.php';
require_once 'permissions.inc.php';
require_once $baseRoot . '/vendor/autoload.php';

use UAParser\Parser;

$user_agent = Parser::create();

// include leaflet on these pages only
$maplibrePages = ['mapofire.ini.php'];

// IF THE USER MUST BE A SUPER USER
$isAdmin = $user['role'] == 'ADMIN';
$doNotEdit = [1, 2];
$superAdmin = in_array($_SESSION['uid'], $doNotEdit) ? true : false;
$securePages = array('wildfires', /*'billing',*/ 'admin');
$lock = '<i class="far fa-lock"></i>';

// run any sql queries
if ($path == 'home' && $isAdmin) {
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $newUsersCache = $memcache->get('newUsersKPI');
    $newFiresCache = $memcache->get('newFiresKPI');

    function kpiCompare($variable, $period, $reverse = false)
    {
        $up = '<i class="fas fa-caret-up" style="margin-left:5px;color:var(--green)"></i>';
        $down = '<i class="fas fa-caret-down" style="margin-left:5px;color:var(--red)"></i>';
        if ($reverse) {
            $up = str_replace('up', 'down', str_replace('red', 'green', $up));
            $down = str_replace('down', 'up', str_replace('green', 'red', $up));
        }

        $last = (int) ($variable["last_$period"] ?? 0);
        $prev = (int) ($variable["prev_$period"] ?? 0);

        if ($prev === 0) {
            if ($last > 0) {
                return '100%' . $up;
            } else {
                return '0%';
            }
        }

        $change = round(($reverse ? (($prev - $last) / $last) : (($last - $prev) / $prev)) * 100, 0);

        if ($change > 0) {
            return "$change%$up";
        } elseif ($change < 0) {
            return "$change%$down";
        } else {
            return '0%';
        }
    }

    if ($newUsersCache) {
        $newUsersSQL = json_decode($newUsersCache, true);
    } else {
        $newUsersSQL = mysqli_fetch_assoc(mysqli_query($con, "SELECT
            SUM(created >= UNIX_TIMESTAMP() - 3600) AS last_hour,
            SUM(created BETWEEN UNIX_TIMESTAMP() - 7200 AND UNIX_TIMESTAMP() - 3600) AS prev_hour,
            SUM(created >= UNIX_TIMESTAMP() - 86400) AS last_day,
            SUM(created BETWEEN UNIX_TIMESTAMP() - 172800 AND UNIX_TIMESTAMP() - 86400) AS prev_day,
            SUM(created >= UNIX_TIMESTAMP() - 604800) AS last_week,
            SUM(created BETWEEN UNIX_TIMESTAMP() - 1209600 AND UNIX_TIMESTAMP() - 604800) AS prev_week,
            SUM(created >= UNIX_TIMESTAMP() - 2592000) AS last_month,
            SUM(created BETWEEN UNIX_TIMESTAMP() - 5184000 AND UNIX_TIMESTAMP() - 2592000) AS prev_month,
            SUM(created >= UNIX_TIMESTAMP() - 31536000) AS last_year,
            SUM(created BETWEEN UNIX_TIMESTAMP() - 63072000 AND UNIX_TIMESTAMP() - 31536000) AS prev_year
        FROM users"));

        $memcache->set('newUsersKPI', json_encode($newUsersSQL), 3600);
    }

    if ($newFiresCache) {
        $newFiresSQL = json_decode($newFiresCache, true);
    } else {
        $newFiresSQL = mysqli_fetch_assoc(mysqli_query($con, "SELECT
            SUM(date >= UNIX_TIMESTAMP() - 3600) AS last_hour,
            SUM(date BETWEEN UNIX_TIMESTAMP() - 7200 AND UNIX_TIMESTAMP() - 3600) AS prev_hour,
            SUM(date >= UNIX_TIMESTAMP() - 21600) AS last_6,
            SUM(date BETWEEN UNIX_TIMESTAMP() - 43200 AND UNIX_TIMESTAMP() - 86400) AS prev_6,
            SUM(date >= UNIX_TIMESTAMP() - 43200) AS last_12,
            SUM(date BETWEEN UNIX_TIMESTAMP() - 86400 AND UNIX_TIMESTAMP() - 86400) AS prev_12,
            SUM(date >= UNIX_TIMESTAMP() - 86400) AS last_day,
            SUM(date BETWEEN UNIX_TIMESTAMP() - 172800 AND UNIX_TIMESTAMP() - 86400) AS prev_day,
            SUM(date >= UNIX_TIMESTAMP() - 604800) AS last_week,
            SUM(date BETWEEN UNIX_TIMESTAMP() - 1209600 AND UNIX_TIMESTAMP() - 604800) AS prev_week,
            SUM(date >= UNIX_TIMESTAMP() - 2592000) AS last_month,
            SUM(date BETWEEN UNIX_TIMESTAMP() - 5184000 AND UNIX_TIMESTAMP() - 2592000) AS prev_month
        FROM wildfires"));
        
        $memcache->set('newFiresKPI', json_encode($newFiresSQL), 3600);
    }
}
