<?
$error_code = ($_GET['error'] ? $_GET['error'] : 404);

switch($error_code){
    case '500' : $title='500 Internal Server Error'; $msg='An error was encountered while processing your request. Typically this is a temporary condition. Please contact the web site owner for further assistance'; break;
    case '404' : $title='404 Not Found'; $msg='The page "'.$_SERVER['REQUEST_URI'].'" doesn\'t exist.<br>The link you followed may be broken, or the page may have been removed'; break;
    case '403' : $title='403 Forbidden'; $msg='Access denied to the page "'.$_SERVER['REQUEST_URI'].'".<br>You are not allowed to view this directory or content'; break;
    case '401' : $title='401 Unauthorized'; $msg='The server could not verify that you are authorized to access this page. Either you supplied the wrong credentials, such as a bad password, or you are not allowed to access this page'; break;
}

include_once('header.inc.php');
//$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
?>

<section class="page">
    <div class="container">
        <h2 style="text-align:center;line-height:1.5;padding:5em 0"><?=$msg?></h2>
    </div>
</section>

<?
echo generateFooter($js);
?>