<?
$hidden = '';
$redirectURI = preg_replace('/method=([A-Za-z0-9]+)&?/', '', $_SERVER['REDIRECT_QUERY_STRING']);

if ($service) {
    $hidden .= '<input type="hidden" name="service" value="' . $service . '">';
}

if ($prod) {
    $hidden .= '<input type="hidden" name="prod" value="' . $prod . '">';
}

echo $hidden;
?>

<input type="hidden" name="next" value="<?= $nextURL ?>">

<p style="margin-bottom:30px;text-align:center">Need an account? <a class="fl" href="register<?= isset($_GET['price_id']) ? '?service=' . $service . '&next=' . $nextURL . '&price_id=' . $_GET['price_id'] : ($service ? '?service=' . $service . ($prod ? '&prod=' . $prod : '') : '') ?>">Sign Up</a></p>

<div class="field"><label>Email</label>
    <input type="email" autocomplete="email" required name="email" value="<?= isset($_GET['email']) ? $_GET['email'] : '' ?>" placeholder="Email Address">
</div>

<div class="password field"><label>Password</label>
    <input type="password" name="pass" autocomplete="password" required value="" placeholder="Password">
    <a href="#" id="showpwd" onclick="return false" data-d="true">show</a>
</div>

<input type="submit" class="btn btn-lg btn-blue" <?= $locked ? 'disabled ' : '' ?>data-o="Login" value="Login">
<? if ($source) {
    echo '<input type="button" class="btn btn-lg btn-gray" style="width:100%" onclick="window.location.href=\'<?= $nextURL ?>\'" value="Go Back">';
} ?>

<p class="or">or</p>

<div style="display:flex;justify-content:center">
    <div class="g_id_signin"
        data-type="standard"
        data-size="large"
        data-theme="outline"
        data-text="signin_with"
        data-shape="rectangular"
        data-logo_alignment="left"></div>
</div>

<p style="margin-top:15px;text-align:center"><a class="fl" href="forgot">Forgot Password?</a></p>

<div id="g_id_onload"
    data-client_id="<?= $google_client_id ?>"
    data-login_uri="https://auth.mapotechnology.com<?= $_SERVER['REDIRECT_URL'] ?>"
    data-context="signin"
    data-ux_mode="redirect"
    data-auto_prompt="false"<?= $redirectURI ? '
    data-state="state=' . base64_encode($redirectURI) . '"' : '' ?>>
</div>