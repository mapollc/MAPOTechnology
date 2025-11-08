<?
$testMode = false;
$domain = 'https://www.mapotechnology.com/';
$host = str_replace('www.', '', $_SERVER['HTTP_HOST']);
ini_set('session.cookie_domain', ".$host");

session_start();

if ($_GET['mode'] == 'test') {
    $testMode = true;
}

if ($testMode) {
    $paypalClientID = 'Ab5Q0vPF1zYCH44h-akUGY6z760tVy2UlEk1vLANzNpXHL4gEI6Oii-BbTrREQKMGqcxSGTAON5YKGKX';
} else {
    $paypalClientID = 'AQJL7RE2fjaGhIo9hMnc0oxHblIvIOnUTDjvSVrTkZXIv5zNCZBYEAx99EO-46b-_Da8xharKvPa15BG';
}

if (!$ga_id) {
    $ga_id = 'G-X03WWLX3BJ';
}
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">

<head>
<link rel="preconnect" href="//ka-p.fontawesome.com">
<link rel="preconnect" href="//fonts.gstatic.com/">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=2, minimum-scale=1, user-scalable=1">
    <title>Donate to support our cause</title>
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#ffc65c">
    <meta name="robots" content="noindex,nofollow">
    <link rel="shortcut icon" href="<?= $domain ?>assets/images/favicon.ico" type="image/x-icon" />
    <link rel="apple-touch-icon" sizes="120x120" href="<?= $domain ?>assets/images/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="<?= $domain ?>assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="<?= $domain ?>assets/images/favicon-16x16.png">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/donate.css">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;800&family=Dosis:wght@400;500;600&display=swap">
    <script async src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
</head>

<body>

    <main>
        <div class="wrapper">
            <a href="https://mapotechnology.com"><img src="https://www.mapotechnology.com/assets/images/mapo_logo.png" style="margin:0 auto"></a>

            <div class="content">
                <h1 style="margin:2em 0 1em 0">Donate to Map of Fire</h1>

                <img src="https://d1wqzb5bdbcre6.cloudfront.net/b4833ab7cd5a39866e52df3b2f5ecfc8a6b892fc08f346b918fde95b1a7adaa1/68747470733a2f2f66696c65732e7374726970652e636f6d2f6c696e6b732f4d44423859574e6a64463878545652594e585a4a63454e6b634570744e6d4e5566475a7358327870646d56664d5445315a334236616d70465656524655445a7a6548493261314a425754413230304e7545536471694f" style="margin:1em auto">

                <p>Support Map of Fire by making a donation to help reduce costs, and help us provide critical wildfire information to everyone!</p>

                <form action="" method="post" id="dbox">
                    <input type="hidden" name="domain" value="<?=str_replace('www.', '', $_SERVER['HTTP_HOST'])?>">
                    <? if ($testMode) {
                        echo '<input type="hidden" name="mode" value="test">';
                    }?>

                    <div class="timing">
                        <label class="switch">
                            <input type="radio" name="timing" value="once" checked>
                            <span>One-time</span>
                        </label>
                        <label class="switch">
                            <input type="radio" name="timing" value="recurring">
                            <span>Recurring</span>
                        </label>
                    </div>

                    <span class="note">Your payment method will be charged once per month until you cancel.</span>

                    <div class="preset">
                        <label class="switch">
                            <input type="radio" name="amt" value="10.00"<?=$_GET['prefilled_amount'] == '10.00' ? ' checked' : ''?>>
                            <span>$10</span>
                        </label>
                        <label class="switch">
                            <input type="radio" name="amt" value="25.00"<?=!isset($_GET['prefilled_amount']) || $_GET['prefilled_amount'] == '25.00' ? ' checked' : ''?>>
                            <span>$25</span>
                        </label>
                        <label class="switch">
                            <input type="radio" name="amt" value="50.00"<?=$_GET['prefilled_amount'] == '50.00' ? ' checked' : ''?>>
                            <span>$50</span>
                        </label>
                    </div>

                    <div class="custom">
                        <span>$</span>
                        <input type="text" name="custom_amt" autocomplete="off" placeholder="Custom amount" value="<?=$_GET['prefilled_amount'] != '10.00' && $_GET['prefilled_amount'] != '25.00' && $_GET['prefilled_amount'] != '50.00' ? $_GET['prefilled_amount'] : ''?>">
                    </div>

                    <?if($_GET['mode']=='test'){?>
                    <div class="fees">
                        <div class="checkbox">
                            <input type="checkbox" name="fees" value="1">
                            <label>Would you like to up your donation to an estimated <span>$x.xx</span> to help cover processing fees?</label>
                        </div>
                    </div>
                    <?}?>

                    <div class="btn-group">
                        <input type="submit" class="btn btn-green btn-lg" value="Donate">
                        <?/*<a href="#" id="pay-with-venmo" class="btn btn-gray btn-lg"><img src="https://donorbox.org/assets/paypal-venmo-6b70bfcd9c3f01334cf28f386dd8262bbc64002e421d8325fe04fa1da03f7cea.png" style="width:auto;height:17px"></a>*/?>
                        <div id="paypal-button-container"></div>
                    </div>
                </form>

                <footer>
                    <span>&copy; <?=date('Y')?> MAPO LLC</span>
                    <a href="https://mapotechnology.com/about/legal/terms">Terms of Service</a>
                    <a href="https://mapotechnology.com/about/legal/privacy">Privacy Policy</a>
                </footer>

            </div>
    </main>

    <script async src="https://www.mapotechnology.com/src/js/donate.js"></script>
    <script src="https://www.paypal.com/sdk/js?client-id=<?=$paypalClientID?>&currency=USD&disable-funding=paylater,card,credit&enable-funding=venmo"></script>
    <?if ($_SESSION['role'] != 'ADMIN') {?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?= $ga_id ?>"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','<?= $ga_id ?>');(function(w, d, s, l, i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j, f);})(window,document,'script','dataLayer','GTM-NZXGFH6');<?if(isset($_GET['cancel'])){echo "gtag('event','cancel_donation');";}?></script>
    <? } ?>
</body>

</html>