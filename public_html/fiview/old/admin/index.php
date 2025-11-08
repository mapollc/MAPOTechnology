<?
include('../header.ini.php');

$page = $_GET[page];
$mode = $_GET[mode];
$function = $_GET['function'];
?>
<section class="page">
 <div class="container-fluid">
  <div class="row">
   <div class="col">
    <?include_once($_GET[page].'.ini.php')?>
   </div>
  </div>
 </div>
</section>
<?
$scripts[] = 'src/assets/resources/js/general';
$scripts[] = 'src/assets/resources/js/admin';

include('../footer.ini.php');
?>