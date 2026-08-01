<?
function isJson($string)
{
    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
}

function getSessions($sql)
{
    global $user_agent;
    global $user;

    $location = $user['location'];
    $asess = [];

    while ($row = mysqli_fetch_assoc($sql)) {
        $agent = $user_agent->parse($row['host']);
        $ua = agent($agent);
        $icon = '';

        if ($row['location'] == '' || $row['location'] == 'a:2:{s:8:"location";s:4:", , ";s:3:"isp";N;}') {
            $json = json_decode(file_get_contents('https://ipwho.is/' . $row['ip']));
            $location = serialize(['location' => "$json->city, $json->region_code, $json->country", 'isp' => $json->connection->isp]);
            mysqli_query($con, "UPDATE sessions SET location = '$location' WHERE sid = '$row[sid]'");
        } else {
            $location = $row['location'];
        }

        $l = unserialize($row['location']);
        $location = $l['location'] . ($l['isp'] ? '<span style="color:#939393;font-size:15px"> via ' . $l['isp'] . '</span>' : '');

        if ($agent->os->family == 'Android') {
            $icon = 'android';
        } else if ($agent->os->family == 'iOS' || $agent->device->brand == 'Apple') {
            $icon = 'apple';
        } else if ($agent->os->family == 'Windows') {
            $icon = 'windows';
        }

        if (isJson($row['host'])) {
            $js = json_decode($row['host']);
            $icon = 'android';
            $ua = "$js->make $js->model";
        } else {
            if (str_contains($row['host'], 'okhttp')) {
                $ua = 'Android App';
            }
        }

        $cur = $row['token'] == $_COOKIE['token'] ? '<span class="cursess">Current Session</span>' : '';
        $ip = $row['ip'] ? "<p class=\"ip\">{$row['ip']}" . ($location ? " &middot; $location" : '') . '</p>' : '';
        $un = until($row['expires']);
        $lid = date('D, M j, Y g:i A T', $row['created']);
        $isj = !isJson($row['host']) ? "<p class=\"host\">$row[host]</p>" : '';

        $asess[] = [
            'icon' => $icon,
            'ua' => $ua,
            'cur' => $cur,
            'ip' => $ip,
            'lid' => $lid,
            'un' => $un,
            'isj' => $isj,
            'sid' => $row['sid']
        ];
    }

    return $asess;
}

if ($_GET['sess_rem'] == 1) {
    echo message(true, 'That session was successfully terminated. You\'ll have to re-login on that device in the future.');
}

$packages = ['com.mapollc.oreroads', 'com.mapollc.mapofire'];
$appNames = ['OregonRoads', 'Map of Fire'];

if ($function == 'terminate') {
    $sid = mysqli_real_escape_string($con, $_GET['sid']);

    if (isset($_POST['confirm_delete']) && isset($_POST['confirm'])) {
        mysqli_query($con, "UPDATE sessions SET expires = 0 WHERE sid = $sid AND uid = $_SESSION[uid]");
        header("Location: {$baseURL}account/settings/devices?sess_rem=1");
    }

    $num = mysqli_num_rows(mysqli_query($con, "SELECT * FROM sessions WHERE sid = $sid AND uid = $_SESSION[uid]"));

    if ($num == 0) {
        echo invalidPermissions();
        return;
    } ?>

    <div class="row">
        <div class="col">
            <div class="card">
                <h1>Terminate This Session</h1>

                <p>By terminating this session, you will be logged out of this device and have to login again on that specific device. Are you sure you want to end this session?</p>

                <form action="" method="post">
                    <input type="hidden" name="confirm_delete" value="1">
                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="confirm" value="Yes, I\'m sure">
                        <input type="button" class="btn btn-red" onclick="history.go(-1)" value="No, go back">
                    </div>
                </form>
            </div>
        </div>
    </div>
<?
    return;
}

$now = time();
$sql = mysqli_query($con, "SELECT sid, token, ip, host, source, location, created, expires FROM sessions WHERE uid = '$_SESSION[uid]' AND expires > 0 AND expires > '$now' ORDER BY created DESC");
$listOfSessions = getSessions($sql);
?>

<div class="row">
    <div class="col">
        <div class="card">
            <h1>Device Logins</h1>

            <? if ($listOfSessions && count($listOfSessions) > 0) {
                foreach ($listOfSessions as $session) {
                    echo "<div class=\"session\">
                        <div>
                            <h6>
                                <i class=\"fa-brands fa-{$session['icon']}\"></i>
                                <span>{$session['ua']}</span>
                                {$session['cur']}
                            </h6>

                            {$session['ip']}
                            <p class=\"times\">Logged in {$session['lid']} &middot; Session expires in {$session['un']}</p>
                            {$session['isj']}
                        </div>
                        <div>
                            <a class=\"btn btn-sm\" style=\"margin:0\" href=\"../settings/devices/terminate?sid={$session['sid']}\">Logout this device</a>
                        </div>
                    </div>";
                }
            } ?>
        </div>
    </div>
</div>