<input type="hidden" name="email" value="<?= $_GET['email'] ?>">
<input type="hidden" name="oauth_token" value="<?= $_GET['oauth_token'] ?>">
<? if ($_GET['subscriber'] == 1) {
    echo '<input type="hidden" name="subscriber" value="1">';
} ?>

<p style="padding:1em 0;font-size:18px;text-align:center">Confirm your email address, <b><?= $_GET['email'] ?></b>?</p>
<input type="submit" class="btn btn-lg btn-blue" data-o="Confirm Email" value="Confirm Email">