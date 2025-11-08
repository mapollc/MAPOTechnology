<?
session_start();
include('config.inc.php');

if($_SESSION[uid]&&$_SESSION[agency]){
 header('Location: '.str_replace('https://', 'https://'.$_SESSION[agency].'.', $domain).'/cad/');
 exit();
}

$a = mysqli_query($con, "SELECT * FROM $db.agencies ORDER BY agency_id ASC");
while($ag = mysqli_fetch_assoc($a)){
 $agencies .= '<option value="'.strtolower($ag[agency_id]).'">('.$ag[agency_id].') '.$ag[shortname].'</option>';
}

switch($_GET[error]){
 case 1: $errorMsg = 'You must be logged in to access CAD.'; break;
 case 2: $errorMsg = 'Your URL settings for this agency\'s CAD are incorrect.'; break;
 case 3: $errorMsg = 'You cannot access this agency\'s CAD.'; break;
 case 4: $errorMsg = 'Your device is not allowed to access '.$software_name.' due to your IP address.'; break;
 case 5: $errorMsg = 'Your login session has expired. Please re-login.'; break;
}
?>
<!DOCTYPE html>
<html>
<head>
<title><?=$software_name?></title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
<?=css(array('fonts','fa','login'))?>
</head>
<body>

<div class="wrapper">
 <div class="logo">
  <div class="content">
   <img src="https://www.fireweatheravalanche.org/assets/images/fwac_side_logo_transparent.png" style="width:100%;max-width:210px">
   <h1><?=$software_suite?><span class="tm">&trade;</span> <span style="letter-spacing:-0.01em">CAD</span></h1><h2>Reset Password</h2>
  </div>
 </div>
 
 <div class="login-wrapper">
  <form id="login" action="" method="post">
   <input type="hidden" name="action" value="login">
   <div class="error"<?=($_GET[error] ? ' style="display:block"' : '')?>><?=$errorMsg?></div>
   
   <input type="password" name="pass" placeholder="New Password" value="">
   <input type="password" name="confirm_pass" placeholder="Confirm Password" value="">
   <!--<input type="submit" value="Login">-->
	 <a href="#" id="submit-btn" onclick="return false"><i class="fa-light fa-arrow-right-to-bracket"></i> Reset Password</a>
  </form>

  <div class="copyright"><b>&copy; <?=date('Y').' '.$software_company?></b><br><br>
  <span style="font-size:0.8em">Use of this system by unauthorized parties is strictly prohibited. Only authorized users of this system may access WildUSA&trade; CAD.</span></div>
 </div>
</div>

<?=js(array('jquery'))?>
<script>
$('#submit-btn').on('click', function(e) {
  e.preventDefault();
  var np = $('#login input[name=pass]').val(),
      cp = $('#login input[name=confirm_pass]').val();
 
  if (np != '' && cp == '') {
    $('.error').html('You must confirm your new password').fadeIn();
  } else if (np == '' && cp != '') {
    $('.error').html('You must enter a new password').fadeIn();
	} else if ($('#login input[name=pass]').length < 8) {
    $('.error').html('Your password must been at least 8 characters').fadeIn();	
  } else if (np != cp) {
    $('.error').html('Your passwords do not match').fadeIn();	
  } else {
    $('.error').fadeOut().html('');

    $.ajax({
      url: 'do',
      method: 'POST',
      data: $('#login').serialize(),
      dataType: 'json',
      success: function(r) {
        /*if (r.error) {
          if (r.error == 1) {
            var m = 'The password you entered is incorrect. Try again.';    
          } else if (r.error == 2) {
            var m = 'You must select the agency you work for.';    
          } else if (r.error == 3) {
            var m = 'You are not employed by this agency. Please login to you correct agency.';    
          } else if (r.error == 4) {
            var m = 'You are not allowed to access CAD with the device you\'re using.';    
          }
          
          $('.error').html(m).fadeIn();
        } else if(r.success == 1) {*/
								window.location.href = r.next;
        /*}*/
      }
    });
  }
});
</script>

</body>
</html>