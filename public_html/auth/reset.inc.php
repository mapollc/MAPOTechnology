<input type="hidden" name="verify" value="1">
<input type="hidden" name="email" value="<?= $_GET['email'] ?>">
<input type="hidden" name="oauth_token" value="<?= $_GET['oauth_token'] ?>">
<div class="password">
    <input type="password" name="pass" value="" placeholder="New Password">
    <a href="#" onclick="return false" data-d="true">show</a>
</div>

<div class="req container" style="display:none">
    <span id="p1">Your password must be at least 8 characters</span>
    <span id="p2">Your password must have at least 1 number</span>
    <span id="p3">Your password must have at least 1 lowercase letter</span>
    <span id="p4">Your password must have at least 1 uppercase letter</span>
    <span id="p5">Your password must be at least 1 symbol</span>
</div>

<input type="password" name="confirm_pass" value="" placeholder="Confirm Password">

<div id="meets" class="container" style="display:none;font-size:14px;color:var(--red)">Your passwords don't match</div>

<input type="submit" class="btn btn-lg btn-blue" data-o="Reset Password" value="Reset Password">