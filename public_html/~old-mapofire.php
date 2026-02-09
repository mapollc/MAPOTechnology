<?
$product = 'mapofire';
include_once 'product-header.inc.php';
?>
        <header>
            <div class="container">
                <div class="logos">
                    <a href="#" style="height:45px"><img class="logo" title="Map of Fire logo" alt="Map of Fire logo" src="https://www.mapotechnology.com/assets/images/mapofire_logo.png"></a>
                    <span style="padding:0 0.5em;font-style:italic;font-weight:100;color:#666">by</span>
                    <a href="https://www.mapotechnology.com"><img style="height:30px" title="MAPO logo" alt="MAPO logo" src="https://www.mapotechnology.com/assets/images/mapo_logo.png"></a>
                </div>
                <a href="https://www.mapotechnology.com">Home</a>
            </div>
        </header>

        <div class="header-wrapper">
            <div class="header-product">
                <div class="overlay"></div>
                <div class="hero">
                    <div class="content-wrap">
                        <div class="content">
                            <h1>Get real time information for wildfires near you</h1>
                            <p>Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity across the US.</p>
                            
                            <div class="ctas">
                                <a href="<?=$downloadUrl.'&'.utm('hero')?>" class="btn"><i class="fab fa-android"></i>Download for Android</a>
                                <a href="<?=webUrl('','hero')?>" class="btn btn-blue"><i class="far fa-laptop"></i>Use the Web App</a>
                            </div>
                        </div>
                    </div>
                    <div class="app">
                        <img src="assets/images/mapofire/f4811.png">
                    </div>
                </div>
            </div>
        </div>
        <div class="spacer"></div>

        <section>
            <div class="container">
                <h1 class="center">Everything fire&mdash;at your fingertips</h1>

                <ul class="highlight">
                    <li>
                        <i class="fas fa-fire"></i>
                        <h2>ALL Wildfires</h2>
                        <span>Not just big fires, but all wildfires currently burning in the US<sup>1</sup></span>
                    </li>
                    <li>
                        <i class="fad fa-smoke"></i>
                        <h2>Smoke Forecast</h2>
                        <span>Overlay satellite data or see visual forecasts of where smoke is impacting you</span>
                    </li>
                    <li>
                        <i class="fas fa-bolt-lightning"></i>
                        <h2>Lightning Strikes</h2>
                        <span>Check where lightning is striking or look for new fires after a storm blows through</span>
                    </li>
                    <li>
                        <i class="fas fa-draw-polygon"></i>
                        <h2>Fire Perimeters</h2>
                        <span>See where a fire has already burned, how big it is, and where its burning</span>
                    </li>
                </ul>

                <div class="ctas center" style="margin-top:3rem">
                    <a href="<?=$downloadUrl.'&'.utm('desc_list')?>" class="btn">Find what's burning near you</a>
                    <a href="<?=webUrl('','desc_list')?>" class="btn btn-black">Open Map</a>
                </div>
            </div>
        </section>

        <section style="background-color:#f9f9f9">
            <div class="container">
                <div class="row">
                    <div class="col" style="flex-direction:column">
                        <h1 class="center">A Firefighter's Best Friend</h1>

                        <p class="center" style="color:#999">The last wildfire map you'll need: Map of Fire features nearly 40 layers of wildfire-centric information.</p>

                        <ul class="highlight" style="margin-top:1em">
                            <li><b>Wildfires</b><span>A proprietary algorithm of wildfires burning recently</span></li>
                            <li><b>Weather</b><span>Lightning strikes, weather alerts, air quality, and more</span></li>
                            <li><b>Evacuations</b><span>An every-growing map of evacuations&mdash;all in one place</span></li>
                            <li><b>Planning Tools</b><span>Fire weather models, risk indexes, drought conditions, and fuels</span></li>
                            <li><b>GIS</b><span>Because what map is complete without administrative data</span></li>
                            <li><b>California</b><span>Specially-curated data for California from CAL FIRE</span></li>
                        </ul>
                    </div>
                    <div class="col justify-center">
                        <img src="assets/images/mapofire/r48gasdf.png">                        
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="row rev">
                    <div class="col justify-center">
                        <img src="assets/images/mapofire/81adsfs.png">
                    </div>
                    <div class="col" style="flex-direction:column">
                        <h1 class="center">Historical Maps</h1>
                        <p class="center hl">As wildfires adapt to current landscapes and burn more and more land, it's important to look at old burn scars.</p>
                        <p class="center hl">Find historical wildfire data all the way back to 2015&mdash;using our same app.</p>

                        <p class="center"><a href="<?=webUrl('/archive/2015', 'historical')?>" class="btn btn-black">See a real example</a></p>
                    </div>
                </div>
            </div>
        </section>

        <!--<section class="dark">
            <div class="container">
                <p class="center">This app is a third-party app built by MAPO LLC. The data and information used in this app is provided by the Oregon Department of Transportation (ODOT)&mdash;an 
                    official government agency. However, this app is not an official government app, and is not affiliated or associated with ODOT or the State of Oregon in any way.</p>
            </div>
        </section>-->

        <section>
            <div class="container">
                <div class="row" style="align-items:center">
                    <div class="col" style="flex-direction:column">
                        <h1 class="title c"><span>Monitor</span> large fire growth</h1>
                        <p class="hl">Find historical wildfire growth for large incidents around the country. See how quickly a wildfire grows over time.<sup>2</sup></p>

                        <div class="center" style="margin-top:3em">
                            <a href="<?=webUrl('', 'nearby')?>" class="btn">Find nearby wildfires</a>
                        </div>
                    </div>
                    <div class="col justify-center">
                        <!--<img src="assets/images/mapofire/had84d1.png" style="width:100%">-->
                        <img src="assets/images/mapofire/sdf168s.png">
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="row rev" style="align-items:center">
                    <div class="col justify-center">
                        <img src="assets/images/mapofire/999e9iii.png">
                    </div>
                    <div class="col" style="flex-direction:column">
                        <h1 class="title c"><span>Find</span> realtime information</h1>
                        <p class="hl">We pull data from multiple sources to provide you the latest information on a wildfire 24/7. Find acreage, the fire's status, containment,
                            and more.
                        </p>

                        <div class="center" style="margin-top:3em">
                            <a href="<?=webUrl('','realtime')?>" class="btn">See a live example</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="row" style="align-items:center">
                    <div class="col" style="flex-direction:column">
                        <h1 class="title c"><span>Customize</span> data for you</h1>
                        <p class="hl">We've built Map of Fire with customization in mind. Change your settings to see data the way you want to see it.</p>

                        <div class="center" style="margin-top:3em">
                            <a href="<?=webUrl('','settings')?>" class="btn">Personalize your own map</a>
                        </div>
                    </div>
                    <div class="col justify-center">
                        <img src="assets/images/mapofire/8cs4151.png" style="width:100%">
                    </div>
                </div>
            </div>
        </section>

        <section style="background-color:#f9f9f9">
            <div class="container center">
                <img src="assets/images/mapofire_icon_transparent.png" style="height:100px">
                <p style="color:#555;text-transform:uppercase">Start tracking wildfires near <i>you</i></p>
                <h1>Available for Web and Android</h1>

                <div class="ctas center">
                    <a href="<?=$downloadUrl.'&'.utm('bottom')?>" class="btn btn-blue"><i class="fab fa-google-play"></i>Download Now</a>
                    <a href="<?=webUrl('', 'bottom')?>" class="btn btn-black"><i class="far fa-laptop"></i>Use the Web App</a>
                </div>

                <div class="highlight" style="margin-top:3em">
                    <h2>We need your help!</h2>
                    <p>Help support MAPO LLC by making a contribution. It helps us continue to make updates, fix bugs, and add new features to Map of Fire&mdash;both in the Android app and the Web App.</p>
                    <a href="https://donate.stripe.com/3csg1F7PF8gpfni003?__prefilled_amount=2500" class="btn btn-stripe"><i class="fab fa-stripe"></i> Donate</a>
                </div>

                <p class="center" style="margin-top:4em"><small><sup>1</sup> Wildfires not reported to interagency dispatch centers may not show on the map.</small><br>
                <small><sup>2</sup> Not all wildfires report their change in size. Only available for some incidents.</small></p>
            </div>
        </section>

        <?include_once 'footer.inc.php'?>