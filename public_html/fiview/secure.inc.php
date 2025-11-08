<?
$urlag = explode('.', $_SERVER[HTTP_HOST])[0];

# If session user ID is not set, redirect to login; can't access w/o authentication
if(!isset($_SESSION[uid]) || !$_COOKIE['agency']){
    $_SESSION = array();
    session_unset();
    session_regenerate_id();
    
    setcookie("agency", '', (time()-$cookieLength), '/', $cookieURL);

    header('Location: '.$domain.'?error=1');
    exit();
} else {
    # If the agency the user logged into does not match the agency they work for, redirect to login
    if(time() > $_SESSION[expire]){
        $_SESSION = array();
        session_unset();
        session_regenerate_id();
        
        setcookie("agency", '', (time()-$cookieLength), '/', $cookieURL);

        header('Location: '.$domain.'?error=5');
        exit();  
    }
 
    # If the agency the user logged into does not match the agency they work for, redirect to login
    if($_SESSION[user_agency] != strtoupper($_SESSION[agency])){
    header('Location: '.$domain.'?error=2');
    exit();  
    }
    
    # If URL doesn't match the agency for this user, redirect to login
    if($urlag != $_SESSION[agency]){
    header('Location: '.$domain.'?error=3');
    exit();
    }
    
    # OPTIONAL FEATURE; if the IP address of the user's device is not allowed by the admin, redirect to login
    if(!validateIP($settings[default_ip])){
    header('Location: '.$domain.'?error=4');
        exit();
    }
 
    /*$asql = mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$aid'");
    $ae = mysqli_num_rows($asql);
    if($ae==1){
    $agency = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$aid'"));
        if($urlag!=$_SESSION[agency]){
        header('Location: '.$domain.str_replace($urlag, $_SESSION[agency], $_SERVER[REQUEST_URI]));
        }
    }else{
    header('Location: '.$domain.'?error=3');
    exit();  
    }*/
}
?>