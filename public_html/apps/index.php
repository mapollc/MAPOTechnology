<?
ini_set('display_errors', 0);
error_reporting(E_ERROR || E_PARSE);
ini_set('session.cookie_domain', '.mapotechnology.com');

if (function_exists('opcache_invalidate')) {
    opcache_invalidate($_SERVER['SCRIPT_FILENAME'], true);
}

session_start();
date_default_timezone_set('America/Los_Angeles');

$route = $_GET['route'];

class Apps
{
    public $route;
    public $thisApp = null;
    public $apps = [
        [
            'name' => 'PolyGEN',
            'url' => 'polygen',
            'path' => './pg',
            'index' => 'index.php',
            'requiresAuth' => true
        ],
        [
            'name' => 'Winter Dashboards',
            'url' => 'winter',
            'path' => './snow',
            'index' => 'index.php',
            'requiresAuth' => false
        ],
        [
            'name' => 'TornadoIQ',
            'url' => 'tornadoiq',
            'path' => './toriq',
            'index' => 'app.php',
            'requiresAuth' => false
        ],
        [
            'name' => 'OregonRoads',
            'url' => 'oregonroads',
            'path' => './oreroads',
            'index' => 'app.php',
            'requiresAuth' => false
        ],
        [
            'name' => 'CrisisCoord',
            'url' => 'crisiscoord',
            'path' => './evac',
            'index' => 'index.php',
            'requiresAuth' => true
        ]
    ];

    public function __construct($route)
    {
        $this->route = $route;

        foreach ($this->apps as $app) {
            if ($app['url'] == $this->route) {
                $this->thisApp = $app;
            }
        }
    }

    public function exists()
    {
        return $this->thisApp == null ? false : true;
    }

    public function name()
    {
        return $this->thisApp['name'];
    }

    public function url()
    {
        return $this->thisApp['url'];
    }

    public function path()
    {
        return $this->thisApp['path'];
    }

    public function index()
    {
        return $this->thisApp['index'];
    }

    public function requiresAuth()
    {
        return $this->thisApp['requiresAuth'];
    }
}

class Router
{
    public $params;
    public $url = [];

    public function __construct($params)
    {
        $this->params = $params['params'];
    }

    public function hasParams()
    {
        return $this->params ? true : false;
    }

    public function params()
    {
        $keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        $parts = explode('/', $this->params);

        $i = 0;
        foreach ($parts as $v) {
            $this->url[$keys[$i]] = $v;
            $i++;
        }
    }

    public function path()
    {
        return $this->url;
    }

    public function things()
    {
        return $this->params;
    }

    public function url($key)
    {
        if ($this->hasParams()) {
            $this->params();

            return $this->url[$key];
        }
    }
}

if ($route == 'authenticate') {
    require_once '/home/mapo/public_html/sso.php';
} else {
    $thisApp = new Apps($route);

    if ($route != 'src') {
        if (!$thisApp->exists()) {
            $folder = $_SERVER['DOCUMENT_ROOT'] . '/' . $_REQUEST['route'];
            $path = $_REQUEST['params'];
            $place = "$folder/$path";

            if (is_dir($folder) && $path && file_exists($place)) {
                $ext = explode('.', $path);

                // if the file is a script, run it as such otherwise just get the text contents of the file
                if ($ext[1] == 'php') {
                    include_once $place;
                } else {
                    // set the content type header if directly accessing js/css/json etc
                    if (preg_match('/\/([^\/]+)\.([a-z0-9]+)$/i', $place, $matches)) {
                        $mimeTypes = [
                            'css'     => 'text/css',
                            'js'      => 'text/javascript',
                            'json'    => 'application/json',
                            'geojson' => 'application/geo+json',
                            'txt'     => 'text/plain'
                        ];

                        $ext = strtolower($matches[2]);
                        if (isset($mimeTypes[$ext])) header('Content-type: ' . $mimeTypes[$ext]);
                    }

                    echo file_get_contents($place);
                }
            } else {
                header('Location: //mapotechnology.com');
                exit();
            }
        } else {
            if ($thisApp->requiresAuth() && !isset($_SESSION['uid'])) {
                include_once 'login.php';
            } else {
                // URL successfully maps to a web app, start the router to create the pages
                $router = new Router($_REQUEST);

                require_once $thisApp->path() . '/' . $thisApp->index();
            }
        }
    }
}
