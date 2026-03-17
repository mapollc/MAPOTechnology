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
    public $con2;

    public function __construct($router, $uid)
    {
        global $_SESSION;

        $this->router = $router;
        $this->sess_uid = $uid;

        if (!isset($_SESSION['org'])) {
            $this->findOrg();
        }

        $this->con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
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

function message($success = false, $msg)
{
    return "<div class=\"message " . ($success ? 'success' : 'error') . "\">$msg</div>";
}

include_once 'helpers.ini.php';

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
