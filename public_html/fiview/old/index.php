<?
session_start();
include('config.inc.php');
$a = mysqli_query($con, "SELECT * FROM $db.agencies ORDER BY agency_id ASC");
while($ag = mysqli_fetch_assoc($a)){
 $agencies .= '<option value="'.strtolower($ag[agency_id]).'">('.$ag[agency_id].') '.$ag[shortname].'</option>';
}
?>
<!DOCTYPE html>
<html>
<head>
<title><?=$software_name?></title>
<link href="https://fonts.googleapis.com/css?family=Noto+Sans+JP:200,500,400,600|Source+Sans+Pro:200,400,600" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css"  rel="stylesheet" crossorigin="anonymous">
<style>
*{box-sizing:border-box}
html,body{width:100%;height:100%;margin:0;padding:0;background-color:#eee;}
.container-fluid, .row.hold{height:100%;}
form{padding:25px;text-align:center;background-color:#fff;border-radius:5px;box-shadow:0 0 5px #282829;}
form h1{font-family:Noto Sans JP;line-height:100%;padding:0 0 25px 0;font-size:35px;font-weight:bold;color:#dc3545;}
input,input:-webkit-autofill,select:-webkit-autofill{width:100%;background-color:inherit;margin:10px 0;}
:focus{outline:none}
</style>
</head>
<body>

<div class="container-fluid">
 <div class="row hold justify-content-center align-items-center">
  <div class="col-md-5">
   <form action="do.php" method="post">
    <input type="hidden" name="action" value="login">
    <?if(isset($_GET[r])){ echo '<input type="hidden" name="r" value="'.$_GET[r].'">'; }?>
		<h1><?=$software_name?></h1>
		<?if(isset($_GET[error])){?>
		<div class="alert alert-danger"><?=($_GET[error]==1 ? 'The password you entered is incorrect' : ($_GET[error]==2 ? 'You must select an agency to login' : ($_GET[error]==3 ? 'You must be logged in to access this' : 'You are not authorized to access '.strtoupper($_GET[agency]))))?>.</div>
		<?}?>
    <select name="agency" class="form-control">
    <option value="">- Choose Agency -</option>
    <?=$agencies?>
    </select>
    <input type="text" name="username" class="form-control" placeholder="Username" value="">
    <input type="password" name="password" class="form-control" placeholder="Password" value="">
    <input type="submit" class="btn btn-primary" value="Login">
   </form>
  </div>
 </div>
</div>

</body>
</html>