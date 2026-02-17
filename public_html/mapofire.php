<?
$domain = '//mapotechnology.com/';
$url = "//$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

if (!isset($ga_id)) {
    $site = 'MAPO';
    $ga_id = 'G-J2PB456CE6';
} else {
    $site = 'MF';
}

session_start();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <title>Map of Fire | Real-Time Wildfire & Smoke Awareness</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#f18f01">
    <meta name="robots" content="index,follow">
    <meta name="description" content="Get real-time updates on wildfires, smoke, and lightning strikes across the United States with Map of Fire. Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity.">
    <meta property="og:title" content="Map of Fire: Live Wildfire, Lightning, & Smoke Map - MAPO LLC">
    <meta property="og:description" content="Get real-time updates on wildfires, smoke, and lightning strikes across the United States with Map of Fire. Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity.">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Map of Fire">
    <meta property="og:url" content="<?= $url ?>">
    <meta property="og:image" content="//mapotechnology.com/assets/images/preview_mapofire.png">
    <meta property="og:image:alt" content="Map of Fire - MAPO LLC">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?= $url ?>">
    <meta property="twitter:title" content="Map of Fire: Live Wildfire, Lightning, & Smoke Map - MAPO LLC">
    <meta property="twitter:description" content="Get real-time updates on wildfires, smoke, and lightning strikes across the United States with Map of Fire. Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity.">
    <meta property="twitter:image" content="//mapotechnology.com/assets/images/preview_mapofire.png">
    <link rel="stylesheet" href="//mapotechnology.com/src/css/mapofire.css">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="apple-touch-icon" sizes="114x114" href="//mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="//mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="//mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap">
    </noscript>
</head>

<body>

    <header>
        <div class="nav">
            <div class="logo">
                <a href=""><img src="//mapotechnology.com/assets/images/mapofire_logo.png" alt="Map of Fire logo" title="Map of Fire logo"></a>
            </div>

            <a href="//mapofire.com?utm_campaign=mapofire&utm_medium=<?= $site ?>_Landing Page&utm_source=header" class="btn primary">Open Live Map</a>
        </div>
    </header>

    <section class="hero">
        <div class="container hero-grid">
            <div class="hero-content">
                <h1>Track Wildfires and Smoke Impacts Near You</h1>
                <p>Real-time wildfires, evacuations, smoke, and weather data—everything you need to stay informed and
                    safe during fire season.</p>

                <div class="cta-group">
                    <a href="//mapofire.com?utm_campaign=mapofire&utm_medium=<?= $site ?>_Landing Page&utm_source=hero"
                        class="btn primary">Open Live Map</a>
                    <a href="#premium" class="btn secondary">See Premium Benefits</a>
                </div>
            </div>

            <div class="hero-media">
                <img loading="lazy" src="//mapotechnology.com/assets/images/preview_mapofire_nobg.png"
                    alt="Map of Fire live wildfire map" title="Map of Fire live wildfire map" />
            </div>
        </div>
    </section>

    <section>
        <div class="container">
            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">🔥</div>
                    <h3>Active Wildfire Mapping</h3>
                    <p>View new and ongoing wildfires, plus detailed perimeters and prescribed burns to stay aware of
                        fire activity across the U.S.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💨</div>
                    <h3>Smoke Forecasts</h3>
                    <p>Visualize current and forecasted smoke, including surface and vertically integrated models, to
                        plan for air quality and visibility impacts.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🗺️</div>
                    <h3>Evacuation Zones</h3>
                    <p>See detailed mapping of evacuation areas in Oregon and California to monitor high-risk zones near
                        wildfires.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>Lightning + Weather Data</h3>
                    <p>Track lightning strikes, winds, and humidity in real time to understand wildfire risks and spread
                        potential.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="trust">
        <div class="container">
            <h2>Trusted by Emergency Responders and Public Safety Professionals</h2>
            <div class="content">
                <p>Map of Fire is used by people across many disciplines &mdash; from residents near wildfires to
                    journalists, researchers, and firefighters &mdash; because of its real-time data and reliable
                    visualization tools.</p>
            </div>
        </div>
    </section>

    <section id="premium" class="premium-section">
        <div class="container">
            <div class="display">
                <div>
                    <h2>Unlock Advanced Wildfire Mapping</h2>
                    <p>Unlock premium access to see advanced wildfire activity with 24-72 hour satellite heat detection,
                        infrared and water vapor imagery, and lightning overlays. Track live weather stations, forecast
                        models, and fire potential indicators like ERC, Significant Fire Potential, and wildfire Risk to
                        Homes.</p>

                    <p>Visualize wildfire likelihood, hazard potential, structure exposure, drought conditions, and
                        fuels to get a complete picture of fire risk and make informed, real-time decisions.</p>

                    <div class="cta-group">
                        <a href="//mapotechnology.com/purchase/mapofire?utm_campaign=mapofire&utm_medium=<?= $site ?>_Landing Page&utm_source=upgrade_cta"
                            class="btn premium">Get Premium Access</a>
                        <a href="//play.google.com/store/apps/details?id=com.mapollc.mapofire&utm_campaign=mapofire&utm_medium=<?= $site ?>_Landing Page&utm_source=download_cta" style="line-height:0">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                alt="Get it on Google Play" title="Download Map of Fire on Google Play" style="height:52px"></a>
                    </div>
                </div>
                <div class="img-holder">
                    <img loading="lazy" src="//mapotechnology.com/assets/images/mapofire/r48gasdf.png"
                        alt="Map of Fire Android app" title="Map of Fire Android app">
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; <?= date('Y') ?> MAPO LLC</p>
            <ul class="footer-menu">
                <li><a href="<?=$domain?>about">About</a></li>
                <li><a href="<?=$domain?>about/contact">Contact</a></li>
                <li><a href="<?=$domain?>purchase/mapofire?utm_campaign=mapofire&utm_medium=<?= $site ?>_Landing Page&utm_source=footer">Pricing</a></li>
                <li><a href="<?=$domain?>about/legal/terms">Terms</a></li>
                <li><a href="<?=$domain?>about/legal/privacy">Privacy</a></li>
            </ul>
        </div>
    </footer>

    <script async src="https://www.googletagmanager.com/gtag/js?id=<?= $ga_id ?>"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','<?= $ga_id ?>'<?= isset($_COOKIE['guid']) ? ",{'user_id':'$_COOKIE[guid]'}" : "" ?>);</script>

</body>
</html>