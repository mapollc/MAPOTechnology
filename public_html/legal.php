<?
$title = $_GET['doc'] == 'terms' ? 'Terms of Service' : 'Privacy Policy';
include_once 'header.inc.php';
?>

<section>
    <div class="container">
        <div class="legal">
            <?
            if ($_GET['doc'] == 'privacy') {
                $url = '2PACX-1vRb4qd6qIfjZcM0nms-UjGfLTly-MVwzGKa-wW7xfyphWw3U1sdyCUr0pSW1E4aQ8ULjvwMiYo59wV-';
            } else {
                $url = '2PACX-1vSNCu7nUWG67F_j_1nnKYwYUPYEJYC0N-k0xYrvSG_dHi773UYgT8NGdwFlIE7Pz-mEsW2Uar97Xf-4';
            }

            $out = str_replace('Effective:', '<b>Effective:</b>', preg_replace('/href\=\"(.*?)q\=(.*?)&(.*?)\"/', 'href="$2"', preg_replace('/ class=".*?"/', '', explode('<script', explode('</style>', file_get_contents('https://docs.google.com/document/d/e/'.$url.'/pub?embedded=true'))[1])[0])));
            $out = preg_replace('/(<p><span>([0-9\.]+)(.*?)<\/span><\/p>)/', '<p><span style="font-style:italic">$2$3</span></p>', $out);

            echo $out;
            echo '<p class="mt-4">A print copy of the '.$title.' is <a target="blank" href="https://docs.google.com/document/d/e/'.$url.'/pub?embedded=true">available here</a>.';
            ?>
        </div>
    </div>
</section>

<?include_once('footer.inc.php')?>