<?
session_start();
$isLoggedIn = isset($_SESSION['uid']);

$title = "BlazeBoard - Wildfire Dashboard - Map of Fire";
$desc = "BlazeBoard is Map of Fire's wildfire dashboard, displaying active fires, fire size, suppression costs, personnel, and fuel types in one view.";
?>
<!DOCTYPE html>
<html lang="en-US">

<head>
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <title><?= $title ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <meta name="description" content="<?= $desc ?>" />
    <meta property="og:title" content="<?= $title ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/preview_mapofire.png" />
    <meta property="og:image:alt" content="<?= $title ?>" />
    <meta property="og:image:width" content="1920" />
    <meta property="og:image:height" content="1080" />
    <meta property="og:site_name" content="Map of Fire" />
    <meta property="og:url" content="https://mapofire.com/blazeboard" />
    <meta property="fb:app_id" content="100092541746116" />
    <meta property="og:description" content="<?= $desc ?>" />
    <meta name="twitter:title" content="<?= $title ?>" />
    <meta name="twitter:description" content="<?= $desc ?>" />
    <meta name="twitter:image" content="//mapotechnology.com/assets/images/preview_mapofire.png">
    <link rel="stylesheet" href="//mapotechnology.com/assets/css/global.css">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="stylesheet" href="//mapofire.com/src/css/dashboard/main.css">
    <script async src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="apple-touch-icon" sizes="114x114" href="//mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="//mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="//mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="//mapotechnology.com/assets/images/mf-site.webmanifest">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap">
    </noscript>
</head>

<body>
    <header>
        <div class="heading">
            <div class="title" title="Map of Fire Wi-Fire Dash">
                <img src="//mapotechnology.com/assets/images/mapofire_logo_transparent.png"
                    title="Map of Fire Wi-Fire Dash" alt="Map of Fire logo" loading="lazy" class="logo">
                <img src="//mapotechnology.com/assets/images/mapofire_icon_transparent.png"
                    title="Map of Fire Wi-Fire Dash" alt="Map of Fire logo" loading="lazy" class="icon">
                <h1>BlazeBoard</h1>
            </div>
            <div class="data">
                <p><?= $isLoggedIn ? "Hi, $_SESSION[first_name]" : '<a style="color:#fff" href="//mapotechnology.com/secure/login?service=mapofire&next=' . urlencode($_SERVER['REQUEST_URI']) . '">Login</a>' ?></p>
                <span id="now"></span>
            </div>
            <i id="menuIcon" class="fas fa-ellipsis-vertical"></i>
        </div>
    </header>

    <main>
        <div class="column" id="left">
            <div class="grid highlight">
                <div class="card">
                    <div class="card-content">
                        <h2>Total Incidents</h2>
                        <p class="stat" id="af"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Current Acres</h2>
                        <p class="stat" id="cb"><span class="loading"></span></p>
                    </div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-content">
                        <h2>Cause: Human</h2>
                        <p class="stat" id="cause"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Cause: Natural</h2>
                        <p class="stat" id="cause2"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Personnel</h2>
                        <p class="stat" id="psnl"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>YTD Cost</h2>
                        <p class="stat" id="cost"><span class="loading"></span></p>
                    </div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-content">
                        <h2>Active</h2>
                        <p class="stat status active" id="act"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Contained</h2>
                        <p class="stat status contained" id="contain"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Controlled</h2>
                        <p class="stat status controlled" id="control"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Out</h2>
                        <p class="stat status out" id="out"><span class="loading"></span></p>
                    </div>
                </div>
            </div>

            <hr>

            <div class="grid">
                <div class="card">
                    <div class="card-content">
                        <h2>Fires by GACC</h2>
                        <select id="gacc" disabled>
                            <option>Loading...</option>
                        </select>
                        <p class="stat" id="gaccCount"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Acres by GACC</h2>
                        <p class="stat" id="gaccAcresCount"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Fires by Landowner</h2>
                        <select id="landowners" disabled>
                            <option selected value="federal">Federal</option>
                            <option value="state">State</option>
                            <option value="other">Other</option>
                        </select>
                        <p class="stat" id="landownerCount"><span class="loading"></span></p>
                    </div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-content">
                        <h2>Fuel: Timber</h2>
                        <p class="stat" id="timber"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Fuel: Grass</h2>
                        <p class="stat" id="grass"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Fuel: Brush</h2>
                        <p class="stat" id="brush"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Fuel: Slash</h2>
                        <p class="stat" id="slash"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Fuel: Other</h2>
                        <p class="stat" id="other"><span class="loading"></span></p>
                    </div>
                </div>
            </div>
        </div>

        <div class="column" id="right">
            <hr class="screen">

            <div class="grid highlight">
                <div class="card">
                    <div class="card-content">
                        <h2>New Incidents</h2>
                        <p class="stat" id="newinc" style="color:var(--green)"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Wildfires</h2>
                        <p class="stat" id="type_wf"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Smoke Checks</h2>
                        <p class="stat" id="type_sc"><span class="loading"></span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <h2>Prescribed Burns</h2>
                        <p class="stat" id="type_rx"><span class="loading"></span></p>
                    </div>
                </div>
            </div>

            <div class="grid" id="cta1">
                <div class="card no-bg">
                    <div class="card-content">
                        <a href="//mapofire.com?utm_campaign=mapofire&utm_medium=cta_btn_1&utm_source=blazeboard" class="btn cta btn-yellow btn-large" style="margin:0">See wildfires on the map</a>
                    </div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-content">
                        <h2 class="filterable">
                            <span>Current Wildfires</span>
                            <div>
                                <i style="font-size:14px" class="far fa-filters"></i>
                                <select id="typeFilter" size="1" multiple disabled>
                                    <option selected value="all">Wildfires</option>
                                    <option selected value="smk">Smoke Checks</option>
                                    <option selected value="rx">RX Burns</option>
                                </select>
                                <select id="sizeFilter" disabled>
                                    <option value="0">0-100 acres</option>
                                    <option selected value="100">>100 acres</option>
                                    <option value="1000">>1,000 acres</option>
                                    <option value="10000">>10,000 acres</option>
                                </select>
                            </div>
                        </h2>

                        <div class="table" id="wildfireList">
                            <span class="loading"></span>
                        </div>

                        <a href="//mapofire.com?utm_campaign=mapofire&utm_medium=cta_btn_2&utm_source=blazeboard" id="cta2" class="btn cta btn-orange btn-large">See wildfires on the map</a>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <p>&copy; <?= date('Y') ?> MAPO LLC</p>
        <ul class="footer-menu">
            <li><a href="//mapotechnology.com/about">About</a></li>
            <li><a href="//mapotechnology.com/about/contact">Contact</a></li>
            <li><a href="//mapotechnology.com/purchase/mapofire?utm_campaign=mapofire&utm_medium=footer&utm_source=blazeboard">Pricing</a></li>
            <li><a href="//mapotechnology.com/about/legal/terms">Terms</a></li>
            <li><a href="//mapotechnology.com/about/legal/privacy">Privacy</a></li>
        </ul>
    </footer>

    <!--<script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>-->
    <script src="../src/js/dashboard/main.js"></script>
    <!--<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X03WWLX3BJ'<?= isset($_COOKIE['guid']) ? ",{'user_id':'$_COOKIE[guid]'}" : '' ?>);</script>-->
</body>

</html>