<input type="hidden" name="email" value="<?= $_GET['email'] ?>">
<input type="hidden" name="org_key" value="<?= $_GET['org_key'] ?>">
<input type="hidden" name="invite_code" value="<?= $_GET['invite_code'] ?>">
<p style="font-size:18px;text-align:center">Do you want to accept <?= $orgName ?>'s account invite, <b><?= $_GET['email'] ?></b>?</p>

<input type="text" name="first_name" value="<?= $fname ?>" required placeholder="First Name">
<input type="text" name="last_name" value="<?= $lname ?>" required placeholder="Last Name">
<input type="email" name="email" value="<?= $_GET['email'] ?>" readonly placeholder="Email Address">

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

<input type="submit" class="btn btn-lg btn-blue" data-o="Verify Email" value="Verify Email">