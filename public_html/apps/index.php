<?
ini_set('display_errors', 1);
error_reporting(E_ERROR);
ini_set('session.cookie_domain', '.mapotechnology.com');
session_start();
date_default_timezone_set('America/Los_Angeles');

$route = $_GET['route'];

class Apps {
    public $route;
    public $thisApp = null;
    public $apps = array(
        array('name' => 'WarnGEN',
            'url' => 'warngen',
            'path' => './wg',
            'index' => 'index.php',
            'requiresAuth' => true
        ),
        array('name' => 'Winter Dashboards',
            'url' => 'winter',
            'path' => './snow',
            'index' => 'index.php',
            'requiresAuth' => false
        ),
        array('name' => 'WxDashboards',
            'url' => 'wxdashboards',
            'path' => './wxdash',
            'index' => 'index.php',
            'requiresAuth' => false
        ),
        array('name' => 'OregonRoads',
            'url' => 'oregonroads',
            'path' => './oreroads',
            'index' => 'app.php',
            'requiresAuth' => false
        ),
        array('name' => 'CrisisCoord',
            'url' => 'crisiscoord',
            'path' => './evac',
            'index' => 'index.php',
            'requiresAuth' => true
        )
    );

    public function __construct($route) {
        $this->route = $route;

        foreach ($this->apps as $app) {
            if ($app['url'] == $this->route) {
                $this->thisApp = $app;
            }
        }
    }

    public function exists() {
        return $this->thisApp == null ? false : true;
    }

    public function name() {
        return $this->thisApp['name'];
    }

    public function url() {
        return $this->thisApp['url'];
    }

    public function path() {
        return $this->thisApp['path'];
    }

    public function index() {
        return $this->thisApp['index'];
    }

    public function requiresAuth() {
        return $this->thisApp['requiresAuth'];
    }
}

class Router {
    public $params;
    public $url = [];

    public function __construct($params) {
        $this->params = $params['params'];
    }

    public function hasParams() {
        return $this->params ? true : false;
    }

    public function params() {
        $keys = ['a','b','c','d','e','f','g'];
        $parts = explode('/', $this->params);

        $i = 0;
        foreach ($parts as $v) {
            $this->url[$keys[$i]] = $v;
            $i++;
        }
    }

    public function path() {
        return $this->url;
    }

    public function url($key) {
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
            $folder = $_SERVER['DOCUMENT_ROOT'].'/'.$_REQUEST['route'];
            $path = $_REQUEST['params'];

            if (is_dir($folder) && $path && file_exists($folder.'/'.$path)) {
                $ext = explode('.', $path);

                // if the file is a script, run it as such otherwise just get the text contents of the file
                if ($ext[1] == 'php') {
                    include_once $folder.'/'.$path;
                } else {
                    echo file_get_contents($folder.'/'.$path);
                }
            } else {
                header('Location: https://www.mapotechnology.com');
                exit();
            }
        } else {
            if ($thisApp->requiresAuth() && !isset($_SESSION['uid'])) {?>
                <!DOCTPYE html>
                <html lang="en-US">
                    <head>
                        <title><?=$thisApp->name()?> - MAPO LLC</title>
                        <meta charset="utf-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
                        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=1">
                        <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
                        <link rel="apple-touch-icon" sizes="120x120" href="../assets/images/apple-touch-icon.png">
                        <link rel="icon" type="image/png" sizes="32x32" href="../assets/images/favicon-32x32.png">
                        <link rel="icon" type="image/png" sizes="16x16" href="../assets/images/favicon-16x16.png">
                        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400&display=swap">
                        <link href="https://www.mapotechnology.com/assets/css/global.css" rel="stylesheet">
                        <link href="https://www.mapotechnology.com/assets/css/user.css" rel="stylesheet">
                    </head>
                <body>

                <main>
                    <div class="wrapper">
                        <a href="https://www.mapotechnology.com" class="logo"><img style="width:inherit" src="https://www.mapotechnology.com/assets/images/mapo_logo.png"></a>
                        <h1>Login to <?=$thisApp->name()?></h1>

                        <p style="margin:1em 0;line-height:1.5;text-align:center">Accessing <?=$thisApp->name()?> requires authentication. Please login to your account first. 
                        You can login to all of MAPO's apps and services from one account using single sign-on (SSO).</p>

                        <a class="btn btn-blue btn-lg" style="display:block;margin:25px auto 0 auto" href="https://www.mapotechnology.com/secure/login?service=apps&prod=<?=$thisApp->url()?>&next=<?=urlencode($_SERVER['REQUEST_URI'])?>">Login</a>
                        <p class="or">or</p>
                        <a style="display:block;text-align:center" href="https://www.mapotechnology.com/secure/register?service=apps&prod=<?=$thisApp->url()?>&next=<?=urlencode($_SERVER['REQUEST_URI'])?>">Create an account</a>
                    </div>
                </main>

                </body>
                </html>
            <?} else {
                // URL successfully maps to a web app, start the router to create the pages
                $router = new Router($_REQUEST);

                require_once $thisApp->path().'/'.$thisApp->index();
            }
        }
    }
}
?>