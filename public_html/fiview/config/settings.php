<?
include_once('../includes.inc.php');

$adminTitle = '<a href="'.$baseurl.'/admin">Admin Settings</a> / '.ucwords(str_replace('-', ' ', $_GET[page]));
$pageTitle = $software_name.' - '.strip_tags($adminTitle);
$cssArray = array('fonts','fa','main','admin');

include_once('../header.inc.php');
?>

<main class="page">
<div class="container">
<div class="row">
<div class="col w-12">
<div class="card">

<?include_once($_GET['page'].'.inc.php')?>

</div>
</div>
</div> 
</div>
</main>

<?=javascriptConfig()?>
<?=js(array('jquery','variables','main','admin'))?>

</body>
</html>