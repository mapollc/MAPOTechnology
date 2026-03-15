<?
ini_set('display_errors', 1);
ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);

header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
header('Expires: ' . gmdate('D, d M Y H:i:s', strtotime('-1 hour')) . ' GMT');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (function_exists('opcache_reset')) {
    opcache_reset();
}

if (!isset($noMysql) || !$noMysql) {
    try {
        $con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_polygen');
    } catch (mysqli_sql_exception $e) {
        echo '<p style="padding:1em;text-align:center">There is an error connecting to our databases. Some features/services may not work.</p>';
    }
}

$dateFormats = [
    'n/j/y' => 'm/d/YY',
    'n/j/Y' => 'm/d/YYYY',
    'm/d/y' => 'mm/dd/YY',
    'm/d/Y' => 'mm/dd/YYYY',
    'Y-n-j' => 'YYYY-m-d',
    'n-j-Y' => 'm-dd-YYYY',
    'Y-m-d' => 'YYYY-mm-dd',
    'm-d-Y' => 'mm-dd-YYYY'
];

$timeFormats = [
    'g:i A' => 'h:mm A',
    'h:i A' => 'hh:mm A',
    'H:i' => 'HH:mm'
];

class PolyGEN
{
    public $router;
    public $sess_uid;
    private $orgInstance = null;

    public function __construct($router, $uid)
    {
        global $_SESSION;

        $this->router = $router;
        $this->sess_uid = $uid;

        if (!isset($_SESSION['org'])) {
            $this->findOrg();
        }
    }

    // Router shortcuts
    public function org()
    {
        return $this->router->url('a');
    }

    public function page()
    {
        return $this->router->url('b');
    }

    public function method()
    {
        return $this->router->url('c');
    }

    public function id()
    {
        return $this->router->url('d');
    }

    // Private method to fetch organization from DB
    private function findOrg()
    {
        $helper = new Helpers(null);
        $_SESSION['org'] = $helper->query(
            'i',
            [$this->sess_uid],
            "SELECT o.* FROM users AS u LEFT JOIN orgs AS o ON o.oid = u.oid WHERE u.uid = ? LIMIT 1"
        );
    }

    // Return an object with org methods
    public function getOrg()
    {
        global $_SESSION;

        if ($this->orgInstance) {
            return $this->orgInstance;
        }

        $orgData = $_SESSION['org'] ?? [];
        $this->orgInstance = $this->createOrgInstance($orgData);

        return $this->orgInstance;
    }

    public function getUser($uid)
    {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
        $helper = new Helpers(null);

        $user = $helper->query(
            'i',
            [$uid],
            "SELECT first_name, last_name FROM users WHERE uid = ? LIMIT 1",
            $con2
        );

        mysqli_close($con2);
        return $user ?? null;
    }

    public function refreshOrg()
    {
        $this->findOrg();
        $this->orgInstance = $this->createOrgInstance($_SESSION['org']);
        return $this->orgInstance;
    }

    private function createOrgInstance($orgData)
    {
        return new class($orgData) {
            private $org;

            public function __construct($org)
            {
                $this->org = $org;
            }

            public function all()
            {
                return $this->org;
            }

            public function orgID()
            {
                return $this->org['oid'] ?? null;
            }

            public function name()
            {
                return $this->org['name'] ?? null;
            }

            public function shortName($urlSafe = false)
            {
                if ($urlSafe) {
                    return strtolower(str_replace(' ', '_', $this->org['short_name'])) ?? '';
                } else {
                    return $this->org['short_name'] ?? null;
                }
            }

            public function timezone()
            {
                return $this->org['timezone'] ?? 'UTC';
            }

            public function dateFormat()
            {
                global $date_formats;
                return $this->org['date_format'] ?? $date_formats[1];
            }

            public function timeFormat()
            {
                global $time_formats;
                return $this->org['time_format'] ?? $time_formats[0];
            }
        };

        return $this->orgInstance;
    }
}

class Helpers
{
    public $org;

    public function __construct($org)
    {
        $this->org = $org;
    }

    public function dateFormat($t)
    {
        return date($this->org->dateFormat(), $t);
    }

    public function timeFormat($t, $tz = false)
    {
        return date($this->org->timeFormat() . ($tz ? ' T' : ''), $t);
    }

    public function dateTime($t, $tz = false)
    {
        return $this->dateFormat($t) . ' ' . $this->timeFormat($t, $tz);
    }

    public function timeAgoOrUntil($timestamp)
    {
        if ($timestamp < time()) return $this->timeAgo($timestamp);
        else return $this->until($timestamp, true);
    }

    public function plural($v)
    {
        return $v > 1 ? 's' : '';
    }

    public function timeAgo($timestamp)
    {
        if ($timestamp == 0) {
            return 'Never';
        }

        $diff = time() - (int) $timestamp;

        if ($diff < 10) {
            return 'Just now';
        }

        $units = [
            31536000 => 'year',
            2628000 => 'month',
            604800 => 'week',
            86400 => 'day',
            3600 => 'hour',
            60 => 'min',
            1 => 'sec',
        ];

        foreach ($units as $seconds => $unit) {
            if ($diff >= $seconds) {
                $value = floor($diff / $seconds);
                $remainder = $diff % $seconds;

                $result = "$value $unit" . $this->plural($value);

                if ($remainder > 0) {
                    $foundNext = false;
                    foreach ($units as $nextSeconds => $nextUnit) {
                        if ($foundNext) {
                            $remainderValue = floor($remainder / $nextSeconds);
                            if ($remainderValue > 0) {
                                $result .= ", $remainderValue $nextUnit" . $this->plural($remainderValue);
                                break;
                            }
                        }

                        if ($seconds === $nextSeconds) $foundNext = true;
                    }
                }

                return "$result ago";
            }
        }

        return 'Unknown';
    }

    public function until($timestamp, $in = false)
    {
        $diff = (int) $timestamp - time();

        if ($diff < 10) {
            return 'Just now';
        }

        $units = [
            31536000 => 'year',
            2419200 => 'month',
            604800 => 'week',
            86400 => 'day',
            3600 => 'hour',
            60 => 'min',
            1 => 'sec',
        ];

        foreach ($units as $seconds => $unit) {
            if ($diff >= $seconds) {
                $value = floor($diff / $seconds);
                $remainder = $diff % $seconds;

                $result = "$value $unit" . $this->plural($value);

                if ($remainder > 0 && isset($units[array_search($unit, array_values($units)) + 1])) {
                    $remainderUnit = array_values($units)[array_search($unit, array_values($units)) + 1];
                    $remainderSeconds = array_search($remainderUnit, $units);
                    $remainderValue = floor($remainder / $remainderSeconds);
                    if ($remainderValue > 0) {
                        $result .= ", $remainderValue $remainderUnit" . $this->plural($remainderValue);
                    }
                }

                return ($in ? 'in ' : '') . $result;
            }
        }

        return 'Unknown';
    }

    public function query($types = '', $params = [], $sql, $useCon = null)
    {
        global $con;
        $db = $useCon ?? $con;

        $stmt = $db->prepare($sql);
        if ($stmt === false) return ['error' => "Prepare failed: {$db->error}"];

        if ($types && !empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if (!$stmt->execute()) {
            $stmt->close();
            return ['error' => "Execute failed: {$db->error}"];
        }

        if (stripos(trim($sql), 'SELECT') === 0) {
            $result = $stmt->get_result();

            if ($result) {
                // Check if query has LIMIT 1
                if (preg_match('/\sLIMIT\s+1\s*$/i', $sql)) {
                    $row = $result->fetch_assoc();
                    $stmt->close();
                    return $row ?: null;
                } else {
                    $rows = [];
                    while ($row = $result->fetch_assoc()) {
                        $rows[] = $row;
                    }
                    $stmt->close();
                    return $rows;
                }
            } else {
                $stmt->close();
                return [];
            }
        } else {
            $stmt->close();
            return null;
        }
    }

    public function getCities($feature) {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
        $bbox = $this->bbox($feature);
        $pop = 0;

        $geo = $this->query(
            'dddd',
            [$bbox[1], $bbox[3], $bbox[0], $bbox[2]],
            "SELECT city, county, state_name AS state, lat, lon, population FROM cities WHERE (lat >= ? AND lat <= ?) AND (lon >= ? AND lon <= ?) ORDER BY population DESC",
            $con2
        );

        foreach ($geo as $place) {
            if ($this->pointInPolygon($place['lat'], $place['lon'], $feature)) {
                $cities[] = $place['city'];
                $counties[] = $place['county'];
                $states[] = $place['state'];
                $pop += $place['population'];
            }
        }

        $cities = array_values(array_unique($cities));
        $counties = array_values(array_unique($counties));
        $states = array_values(array_unique($states));

        mysqli_close($con2);

        return [
            'cities' => $cities,
            'counties' => $counties,
            'states' => $states,
            'population' => $pop
        ];
    }

    public function bbox($feature)
    {
        $coords = [];

        $geometry = $feature->geometry ?? null;
        if (!$geometry) return [0, 0, 0, 0];

        $rawCoords = $geometry->coordinates;

        foreach ($rawCoords as $ring) {
            foreach ($ring as $point) {
                $coords[] = $point;
            }
        }

        $lons = array_column($coords, 0);
        $lats = array_column($coords, 1);

        return [
            min($lons),
            min($lats),
            max($lons),
            max($lats)
        ];
    }

    public function pointInPolygon($lat, $lon, $feature)
    {
        $geometry = $feature->geometry ?? null;
        $coords = $geometry->coordinates;

        if ($geometry->type == 'Polygon') {
            return $this->pointInRings($lon, $lat, $coords);
        } elseif ($geometry->type == 'MultiPolygon') {
            foreach ($coords as $polygon) {
                if ($this->pointInRings($lon, $lat, $polygon)) return true;
            }
        }
        return false;
    }

    public function pointInRings($x, $y, $rings)
    {
        foreach ($rings as $ring) {
            if ($this->pointInSingleRing($x, $y, $ring)) return true;
        }
        return false;
    }

    public function pointInSingleRing($x, $y, $ring)
    {
        $inside = false;
        $n = count($ring);
        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            if ((($ring[$i][1] > $y) != ($ring[$j][1] > $y)) &&
                ($x < ($ring[$j][0] - $ring[$i][0]) * ($y - $ring[$i][1]) / ($ring[$j][1] - $ring[$i][1]) + $ring[$i][0])
            ) {
                $inside = !$inside;
            }
        }
        return $inside;
    }
}

function message($success = false, $msg)
{
    return "<div class=\"message " . ($success ? 'success' : 'error') . "\">$msg</div>";
}

$pgen = new PolyGEN($router, $_SESSION['uid']);
$helper = new Helpers($pgen->getOrg());
$urlOrg = $pgen->org();
$domain = '//apps.mapotechnology.com';
$orgID = $pgen->getOrg()->orgID();
$baseURL = "$domain/polygen/{$pgen->getOrg()->shortName(true)}/";
$maplibreVersion = '5.20.0';

// set timezone based on org settings
date_default_timezone_set($pgen->getOrg()->timezone());

if ($urlOrg != $pgen->getOrg()->shortName(true)) {
    echo "Organization URL doesn't match organization in session";
    exit();
}

if (!isset($urlOrg)) {
    header("Location: {$baseURL}{$pgen->getOrg()->shortName(true)}");
    exit();
}
