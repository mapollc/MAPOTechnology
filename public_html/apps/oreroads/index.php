<?
date_default_timezone_set('America/Los_Angeles');
session_start();

if (strpos($_SERVER['REQUEST_URI'], 'oreroads') !== false) {
    header('Location: ..'.str_replace('oreroads', 'oregonroads', $_SERVER['REQUEST_URI']));
    exit();
}

function webUrl($append, $source = '') {
    return 'https://apps.mapotechnology.com/oregonroads'.($append ? $append : '').($source != '' ? '?utm_campaign=oregonroads&utm_medium=landing_page&utm_source='.$source : '');
}

$downloadUrl = 'https://play.google.com/store/apps/details?id=com.mapollc.oreroads';
$title = 'OregonRoads - Real-time Winter Road Conditions App';
$desc = 'Get real-time updates on Oregon winter road conditions, incidents, and traveler information from ODOT through our convenient Android app or web map.';
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$title?></title>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?>">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="OregonRoads">
    <meta property="og:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/oreroads/fDXRt3B.png">
    <meta property="og:image:alt" content="OregonRoads - MAPO LLC">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="twitter:title" content="<?=$title?>">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="https://www.mapotechnology.com/assets/images/oreroads/fDXRt3B.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#f99d1c">
    <meta name="robots" content="index,follow">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <script src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link href="../src/css/oreroads.css" rel="stylesheet">
    <?/*<link href="oreroads.css" rel="stylesheet">*/?>
    <head>
    <body>

        <header>
            <div class="container">
                <a href="#" style="height:45px"><img class="logo" src="https://www.mapotechnology.com/assets/images/oreroads/oreroads_square_logo.png"></a>
                <span style="padding:0 0.5em;font-style:italic;font-weight:100;color:#666">by</span>
                <a href="https://www.mapotechnology.com"><img style="height:30px" src="https://www.mapotechnology.com/assets/images/mapo_logo.png"></a>
            </div>
        </header>

        <div class="header-wrapper">
            <div class="header-product">
                <div class="overlay"></div>
                <div class="hero">
                    <div class="content-wrap">
                        <div class="content">
                            <h1>The innovative road conditions app for Oregon</h1>
                            <p>Find the latest winter road conditions, current weather, and view roadside cameras across the entire state of Oregon.</p>
                            
                            <div class="ctas">
                                <a href="<?=$downloadUrl?>" class="btn"><i class="fab fa-android"></i>Download for Android</a>
                                <a href="<?=webUrl('','hero')?>" class="btn btn-blue"><i class="far fa-laptop"></i>Use the Web App</a>
                            </div>
                        </div>
                    </div>
                    <div class="app">
                        <img src="https://www.mapotechnology.com/assets/images/oreroads/nwi3fNa.png">
                    </div>
                </div>
            </div>
        </div>
        <div class="spacer"></div>

        <section>
            <div class="container">
                <h1 class="center">Easily find the information you're looking for</h1>

                <ul class="highlight">
                    <li>
                        <i class="fas fa-road"></i>
                        <h2>Road Conditions</h2>
                        <span>Live weather reports from transportation crews during the winter months</span>
                    </li>
                    <li>
                        <i class="fad fa-video"></i>
                        <h2>Roadside Cameras</h2>
                        <span>Check over 800 cameras alongside Oregon's interstates and highways</span>
                    </li>
                    <li>
                        <i class="fad fa-car-burst"></i>
                        <h2>Incidents</h2>
                        <span>Get details on crashes, hazards, and other incidents along your trip route</span>
                    </li>
                    <li>
                        <i class="fas fa-temperature-low"></i>
                        <h2>Road Weather Information Systems (RWIS)</h2>
                        <span>See current air & road temperatures, pavement friction, and more</span>
                    </li>
                </ul>

                <div class="ctas center" style="margin-top:3rem">
                    <a href="<?=$downloadUrl?>" class="btn">Find your road conditions</a>
                    <a href="<?=webUrl('','desc_list')?>" class="btn btn-black">Open Map</a>
                </div>
            </div>
        </section>

        <section style="background-color:#f9f9f9">
            <div class="container">
                <div class="row">
                    <div class="col" style="flex-direction:column">
                        <h1 class="center">Your Favorites</h1>

                        <p class="center" style="color:#999">Favorite any road reports, roadside cameras, and weather stations you like for quick reference in the future.</p>

                        <ul class="highlight" style="margin-top:1em">
                            <li><h2>Road Reports</h2><span>winter road conditions</span></li>
                            <li><h2>Roadside Cameras</h2><span>a live look at what's happening on Oregon roads</span></li>
                            <li><h2>Road Weather Information Systems (RWIS)</h2><span>weather station data including air & pavement temperatures</span></li>
                        </ul>
                    </div>
                    <div class="col justify-center">
                        <img src="https://www.mapotechnology.com/assets/images/oreroads/bgBNQ0e.png">                        
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="row rev">
                    <div class="col justify-center">
                        <img src="https://www.mapotechnology.com/assets/images/oreroads/cwtnL1T.png">
                    </div>
                    <div class="col" style="flex-direction:column">
                        <h1 class="center">Notifications</h1>
                        <p class="center hl">Setup custom push notifications to be notified about changing road conditions based on your favorite road segments.</p>
                        <p class="center hl">Be notified about interstate or highway closures that occur by choosing any highway in Oregon.</p>

                        <p class="center"><a href="<?=$downloadUrl?>" class="btn btn-black">Start getting notifications</a></p>
                    </div>
                </div>
            </div>
        </section>

        <section class="dark">
            <div class="container">
                <p class="center">This app is a third-party app built by MAPO LLC. The data and information used in this app is provided by the Oregon Department of Transportation (ODOT)&mdash;an 
                    official government agency. However, this app is not an official government app, and is not affiliated or associated with ODOT or the State of Oregon in any way.</p>
            </div>
        </section>

        <section>
            <div class="container">
                <div class="row" style="align-items:center">
                    <div class="col" style="flex-direction:column">
                        <h1 class="title c"><span>Easily</span> see road conditions</h1>
                        <p class="hl">7 easily-identifiable colors denote what road conditions are throughout Oregon's interstates & highways.<sup>1</sup></p>


                        <div class="legend">
                            <div style="background-color:#bdbdbd"></div>
                            <div style="background-color:#000"></div>
                            <div style="background-color:#2196f3"></div>
                            <div style="background-color:#ff9800"></div>
                            <div style="background-color:#827717"></div>
                            <div style="background-color:#7e57c2"></div>
                            <div style="background-color:#d32f2f"></div>
                        </div>

                        <div class="center" style="margin-top:3em">
                            <a href="<?=webUrl('#rw=210','rw')?>" class="btn btn-blue">See a live example</a>
                        </div>
                    </div>
                    <div class="col justify-center">
                        <img src="https://www.mapotechnology.com/assets/images/oreroads/Ah7Y4xo.png">
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="row rev" style="align-items:center">
                    <div class="col justify-center">
                        <img src="https://www.mapotechnology.com/assets/images/oreroads/3SEiu89.png">
                    </div>
                    <div class="col" style="flex-direction:column">
                        <h1 class="title c"><span>Know</span> what the weather is</h1>
                        <p class="hl">Get more than just the temperature&mdash;see how cold the pavement surface is and the type of "grip" you'll have while driving.<sup>2</sup></p>

                        <div class="center" style="margin-top:3em">
                            <a href="<?=webUrl('#rwis=12RW011','rwis')?>" class="btn">See a live example</a>
                        </div>
                    </div>
                </div>

                <p class="center" style="margin-top:4em"><small><sup>1</sup> ODOT maintenance crews provide these reports five times per day and at other times when conditions change significantly.</small><br>
                <small><sup>2</sup> Not all roadside weather stations provide pavement temperatures and/or road friction coefficient.</small></p>
            </div>
        </section>

        <section style="background-color:#f9f9f9">
            <div class="container center">
                <img src="https://www.mapotechnology.com/assets/images/oreroads/pJg1DYY.png" style="height:100px">
                <p style="color:#555;text-transform:uppercase">Find <i>your</i> road conditions & weather</p>
                <h1>Available exclusively for Android & Web</h1>

                <div class="ctas center">
                    <a href="<?=$downloadUrl?>" class="btn btn-blue"><i class="fab fa-google-play"></i>Download Now</a>
                    <a href="<?=webUrl('', 'bottom')?>" class="btn btn-black"><i class="far fa-laptop"></i>Open Map</a>
                </div>

                <div class="highlight" style="margin-top:3em">
                    <h2>Buy us a coffee!</h2>
                    <p>Help support MAPO LLC by making a contribution. It helps us continue to make updates, fix bugs, and add new features to OregonRoads&mdash;both in the Android app and the Web App.</p>
                    <a href="https://donate.stripe.com/00g16L0nd0NXfni8wx" class="btn btn-stripe"><i class="fab fa-stripe"></i> Donate</a>
                </div>
            </div>
        </section>

        <footer>
            <div class="container" style="flex-direction:column;justify-content:center">
                &copy; <?=date('Y')?> MAPO LLC
                <ul>
                    <li><a href="https://www.mapotechnology.com/about">About</a></li>
                    <li><a href="https://www.mapotechnology.com/about/contact">Contact</a></li>
                    <li><a href="https://www.mapotechnology.com/about/legal/terms">Terms</a></li>
                    <li><a href="https://www.mapotechnology.com/about/legal/privacy">Privacy</a></li>
                    <li><a href="https://www.mapotechnology.com/<?=($_SESSION['uid'] ? 'account/home' : 'secure/login')?>"><?=($_SESSION['uid'] ? 'Account' : 'Login')?></a></li>
                </ul>
            </div>
        </footer>

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
        <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6');</script>
    </body>
</html>