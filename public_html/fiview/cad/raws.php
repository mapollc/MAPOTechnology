<?
include_once('../includes.inc.php');

/*$us = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM $db.users WHERE uid = '$_SESSION[uid]'"));
$pref = unserialize($us[settings]);*/
$pageTitle = $software_name.' - Response Levels';
$cssArray = array('fonts','fa','main','admin'/*,'dispatch'/*,'jquery'*/);

include_once('../header.inc.php');
?>

<main class="page">
<div class="container">
<div class="row">
<div class="col w-12">
<div class="card">
<h1>RAWS/WIMS Data</h1>

https://api.synopticlabs.org/v2/stations/latest?token=d8c6aee36a994f90857925cea26934be&vars=air_temp,relative_humidity,wind_direction,wind_speed&units=temp%7Cf%2Cspeed%7Cmph&status=active&state=or&network=2

</div>
</div>
</div> 
</div>
</main>

<script>var config = <?=json_encode($config)?>;</script>
<?=js(array('jquery','main'))?>

</body></html>