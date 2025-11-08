<div class="row">
    <div class="col w100">
        <div class="card">
            <h1>Hello, <?=$_SESSION['first_name']?>!</h1>
            <h3 style="padding-top:0;font-weight:100">
            Thank you for choosing MAPO. Your account provides personalized access to all our services and allows you to customize your settings.
            Save your preferences and enjoy a seamless experience across all devices.
            </h3>
        </div>
    </div>
</div>

<div class="row">
    <div class="col w50">
        <div class="card dark">
            <h2>Wildfires Near You</h2>
            <?if($user['location']){?>
            <p class="help">Current wildfires burning within 50 miles of you (<a href="settings/location"><?=$user['location']->city.', '.$user['location']->state?></a>).</p>

            <div id="nearby" class="overflow"><div class="spinner"></div></div>
            <?}else{
                echo '<div class="message error">Your location settings are not set. Would you like to <a href="settings#location">change them</a>?</div>';   
            }?>
        </div>
    </div>
    <div class="col w50">
        <div class="card dark">
            <h2>Wildfires You Follow</h2>
            <p class="help">All wildfires you are following on Map of Fire.</p>

            <div id="favfires" class="overflow"><div class="spinner"></div></div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col w50">
        <div class="card dark">
            <h2>Map of Trails Uploads</h2>
            <p class="help">Any GPX, KML, or GeoJSON files you've upload to Map of Trails.</p>

            <div id="uploads"><div class="spinner"></div></div>
        </div>
    </div>
    <div class="col w50">
        <div class="card dark">
            <h2>Your Favorite Trails</h2>
            <p class="help">All recreation trails you are following on Map of Trails.</p>

            <div id="favtrails"><div class="spinner"></div></div>
        </div>
    </div>
</div>