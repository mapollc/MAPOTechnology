<p style="margin-bottom:30px;text-align:center">Already have an account? <a class="fl" href="login?<?= explode('?', $_SERVER['REQUEST_URI'])[1] ?>">Login</a></p>

<input type="hidden" name="location" value="">

<input type="text" name="first_name" value="<?= $fname ?>" required placeholder="First Name">
<input type="text" name="last_name" value="<?= $lname ?>" required placeholder="Last Name">
<input type="email" name="email" value="<?= $email ?>" required placeholder="Email Address">
<input type="tel" name="phone" value="" placeholder="Phone Number" maxlength="12" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">
<div class="password">
    <input type="password" name="pass" value="" required placeholder="Password">
    <a href="#" onclick="return false" data-d="true">show</a>
</div>

<div class="req container" style="display:none">
    <span id="p1">Your password must be at least 8 characters</span>
    <span id="p2">Your password must have at least 1 number</span>
    <span id="p3">Your password must have at least 1 lowercase letter</span>
    <span id="p4">Your password must have at least 1 uppercase letter</span>
    <span id="p5">Your password must be at least 1 symbol</span>
</div>

<input type="password" name="confirm_pass" value="" required placeholder="Confirm Password">

<div id="meets" class="container" style="display:none;font-size:14px;color:var(--red)">Your passwords don't match</div>

<div style="position:relative">
    <input type="text" id="city" autocomplete="off" value="Getting location..." disabled>
    <div id="cityResults" class="results"></div>
    <a href="#" id="wrong" style="display:block;width:100%;margin:0 0 20px 0" onclick="return false">Wrong location?</a>
</div>

<div class="checkbox" style="display:block;margin:0">
    <input type="checkbox" id="tos" name="tos" value="1">
    <label for="tos" style="display:inline;font-size:13px;line-height:1.5">By creating an account, you're indicating you have read and agree to our <a href="//mapotechnology.com/about/legal/terms">Terms</a> and <a href="//mapotechnology.com/about/legal/privacy">Privacy Policy</a>.</label>
</div>

<input type="submit" class="btn btn-lg btn-blue dis" id="create" data-o="<?= isset($_GET['session_id']) ? 'Finalize Subscription' : 'Create Account' ?>" value="<?= isset($_GET['session_id']) ? 'Finalize Subscription' : 'Create Account' ?>">