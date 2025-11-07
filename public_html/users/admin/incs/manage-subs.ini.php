<?
if (isset($_GET['sid']) && $_GET['sid'] != '') {
    $sub = prepareQuery('s', [$_GET['sid']], "SELECT * FROM billing WHERE subscription = ?");
}
?>
<div class="row">
    <div class="col w100">
        <div class="card">
            <h1 style="text-align:center">Manage Subscription</h1>

            <? if (!isset($_GET['sid']) || $_GET['sid'] == '') {
                echo message(false, 'You currently don\'t have a valid subscription.');
            } else {?>
            
            <? } ?>
        </div>
    </div>
</div>