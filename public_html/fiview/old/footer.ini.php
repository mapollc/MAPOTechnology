<div id="modal"><div id="content"></div></div>
<div id="shadow"></div>
<div id="page_loading"><img src="<?=$baseurl?>/assets/images/loading.svg" alt=""></div>

<script>
var host = '<?=$baseurl?>/',
    agency = '<?=$_SESSION[agency]?>',
    base = 'agency/' + agency + '/',
		uid = <?=$_SESSION[uid]?>/*,
		perms = <?=unserialize($_SESSION[permissions])?>*/;
</script>
<script src="https://code.jquery.com/jquery-<?=$versions['jquery']?>.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@<?=$versions['bootstrap']?>/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
<script async src="https://kit.fontawesome.com/1c625a1d4e.js"></script>
<script async src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
<?foreach($scripts as $s){
echo '<script src="'.$baseurl.'/'.$s.'"></script>
';
}?>
</body>
</html>