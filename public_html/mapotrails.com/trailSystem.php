<?
ini_set('session.cookie_domain', '.mapotrails.com');
session_start();

$id = $_GET['sid'];
$trail = json_decode(file_get_contents('https://api.mapotechnology.com/v1/trails/system?key=cf707f0516e5c1226835bbf0eece4a0c&id=' . $id));

$title = $trail->system->name.' Trail System';
$metaphoto = 'https://cdn.mapotrails.com/photos/large/'.$trail->system->trails[0]->photo->url;
$bannerImage = 'background-image:url(https://cdn.mapotrails.com/photos/'.$trail->system->trails[0]->photo->url.')';
$metacaption = $trail->system->trails[0]->photo->caption;

include_once 'header.inc.php';
?>

<?=generateFooter()?>