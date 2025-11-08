<?
$title = 'Contact Us';
include_once 'header.inc.php';
?>

<section>
    <div class="container">
        <div class="row">
            <div class="col-md-8">
                <h2>Get in Touch!</h2>

                <p>Use this form to send us a message. We'll get back to you as soon as possible.</p>

                <form action="" id="contact" method="post">
                    <input type="hidden" name="ip" value="<?=$_SERVER['REMOTE_ADDR']?>">
                    <input type="hidden" name="host" value="<?=$_SERVER['HTTP_USER_AGENT']?>">
                    <input type="hidden" name="auth_user" value="<?=isset($_SESSION['uid']) ? true : false?>">
                    <?if(isset($_SESSION['uid'])) {
                        echo '<input type="hidden" name="uid" value="'.$_SESSION['uid'].'">';
                    }
                    if (isset($_GET['app_details'])) {
                        echo '<input type="hidden" name="app_details" value="'.$_GET['app_details'].'">';
                    }?>

                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" name="fname" placeholder="John" value="<?=isset($_SESSION['uid']) ? $_SESSION['first_name'] : ''?>" required>
                    </div>

                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" name="lname" placeholder="Smith" value="<?=isset($_SESSION['uid']) ? $_SESSION['last_name'] : ''?>" required>
                    </div>

                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" name="email" placeholder="john@example.com" value="<?=isset($_SESSION['uid']) ? $_SESSION['email'] : ''?>" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Reason for message</label>
                        <select name="subject" required>
                            <option>-- Reason for message --</option>
                            <option>General Inquiry</option>
                            <option>Media Inquiry</option>
                            <option>Technical Problems with Android Apps</option>
                            <option>Technical Problems with Website(s)</option>
                            <option>Wildfire Inquires</option>
                            <option>Trails Inquires</option>
                            <option>Partnership Questions</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Your message</label>
                        <textarea name="msg" placeholder="Type your message..." style="resize:none" required></textarea>
                    </div>

                    <input type="submit" class="btn btn-green btn-lg" value="Send Message">
                </form>    
            </div>
            <div class="col-md-4">
                <h4 style="margin:15px 0 0"><i class="fa-sharp fa-solid fa-envelopes" style="padding-right:15px"></i> Email</h4>
                <p style="padding:7.5px 0 1em 0"><b style="font-weight:400">General Inquiries</b><br>
                <a href="mailto:info@mapotechnology.com">info@mapotechnology.com</a></p>

                <p><b style="font-weight:400">Donation/Subscription Inquiries</b><br>
                <a href="mailto:payments@mapotechnology.com">payments@mapotechnology.com</a></p>

                <h4 style="margin:0"><i class="fa-solid fa-location-dot" style="margin-top:25px;padding-right:15px"></i> Location</h4>
                <p>Based in Summerville, Oregon, USA</p>
            </div>
        </div>
    </div>
</section>

<?include_once 'footer.inc.php'?>