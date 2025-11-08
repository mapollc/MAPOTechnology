<footer>
    <div class="container">
        <div class="row align-items-center">
            <div class="col-md-4 col-sm-12">
                <p style="padding:10px 0">&copy; <?=date('Y')?> MAPO LLC</p>
                <p>HQ'd in Summerville, OR, USA</p>
            </div>
            <div class="col-md-8 col-sm-12">
                <ul class="nav footer-menu">
                    <li><a href="https://www.facebook.com/mapotechnology"><i class="fab fa-facebook-f"></i></a></li>
                    <li><a href="<?=$domain?>about">About</a></li>
                    <li><a href="<?=$domain?>about/contact">Contact</a></li>
                    <li><a href="<?=$domain?>checkout?price_id=<?=$mapoSubscriptions['donate']['live']?>">Donate</a></li>
                    <li><a href="<?=$domain?>about/legal/terms">Terms</a></li>
                    <li><a href="<?=$domain?>about/legal/privacy">Privacy</a></li>
                </ul>
            </div>
        </div>
    </div>
</footer>

<script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6');</script>
<?if(!$productPage || !isset($productPage)){?><script src="<?=$domain?>src/js/main.js"></script><?}?>
<?if($js){
$jsct = 0;
foreach ($js as $j) {
    echo '<script '.($async[$jsct] == 1 ? 'async ' : '').'src="'.$j.'"></script>
';
    $jsct++;
}}?>

</body>
</html>