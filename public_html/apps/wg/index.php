<?
class Warngen {
    public $router;

    public function __construct($router) {
        $this->router = $router;
    }

    public function org() {
        return $this->router->url('a');
    }

    public function page() {
        return $this->router->url('b');
    }

    public function function() {
        return $this->router->url('c');
    }

    public function id() {
        return $this->router->url('d');
    }
}
$org = new Warngen($router);
?>
<!DOCTYPE html>
<html>
    <head>
        <title></title>
    </head>
    <body>
        <h1>WarnGEN</h1>
    </body>
</html>