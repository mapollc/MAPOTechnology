<?
$frontPage = true;
include_once 'header.inc.php';
echo 'test';
?>

<div class="promo">
    <!--<video autoplay muted loop poster="assets/images/promo_Moment.jpg">
        <source src="assets/images/promo.mp4" type="video/mp4">
        Your browser does not support the video tag.
    </video>-->
    <div class="hero">
        <div class="container">
            <div class="row align-items-center justify-content-center">
                <div class="col-lg-8 d-flex flex-column align-items-center">
                    <h1>Empowering Public Safety Through Technology</h1>
                    <p>Technology for public safety, wildfire mapping, and recreation.</p>
                    <p class="d-flex flex-wrap m-0 justify-content-center mt-4">
                        <?//if(date('n')>=4&&date('n')<=9){?>
                        <a href="https://www.mapofire.com?utm_campaign=mapotechnology&utm_medium=cta&utm_source=front_page" style="min-width:200px" class="btn btn-xl btn-light-blue m-2">Track wildfires</a>
                        <?/*}else{?>
                        <a href="https://www.mapotrails.com" class="btn btn-xl btn-red m-2">Find recreation</a>                            
                        <?}*/?>
                        <a href="#" id="wwd" style="min-width:200px" class="btn btn-xl btn-orange m-2">What we do</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<section id="abt">
    <div class="container">
    <h1>About our platforms</h1>
        <div class="row">
            <div class="col-md-6 col-sm-12">
                <img loading="lazy" src="assets/images/VID_20191226_125631.jpg" alt="About MAPO" style="max-width:500px">
            </div>
            <div class="col-md-6 col-sm-12 mt-md-0 mt-sm-4">
                <p>MĂPO (pronounced MAP-oh) started as a collaboration between colleagues seeking to develop a better way to organize, search, track, and find information&mdash;primarily wildfires and 
                    recreation opportunities. As passionate technology users, we began combining data, technology, and subject-matter knowledge into the services we wanted to share
                    with everyone.</p>
                <p>MAPO serves as a platform to give everyone access to public safety data, wildfire information, recreation opportunities, and more. We work many hours, for free, to 
                    provide these services and content on our sites. Please consider contributing to help further our endeavours.</p>
                <p class="text-center mt-3"><a class="btn btn-lg btn-red" href="checkout?price_id=price_1MgyLjIpCdpJm6cT9D5pnE9C"><i class="fas fa-heart"></i> Make a contribution</a></p>
            </div>
        </div>
    </div>
</section>

<section class="ns">
    <div class="container">
        <div class="row">
            <div class="col">
                <h1 class="text-center">Map of Fire: Wildfire Mapping</h1>

                <p class="text-center">Wildfires are becoming increasingly inevitable in the US and modern technology to track and disseminate information is necessary. We built Map of Fire to report on
                    all wildfire incidents. We've added more than 20 other wildfire-centric features to the map, making it one of the most comprehensive tools available for firefighters and community members.</p>

                <div class="row align-items-center mt-4">
                    <div class="col-md-6 col-sm-12">
                        <div class="image-modal" style="background-image:url(assets/images/wildfire%20mapping.jpg)">
                            <div class="overlay">    
                                <h6>Wildfires & Perimeters</h6>
                                <p>Wildfires are grouped into new fires, or active fires. But, we've taken it one step further and grouped various other types of fire data together. 
                                    This is also where you can enable wildfire perimeters to show on the map.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-12 mt-4 mt-md-0">
                        <div class="image-modal" style="background-image:url(assets/images/lightning%20stock.jpg)">
                            <div class="overlay">    
                                <h6>Weather</h6>
                                <p>We incorporated nearly a dozen weather layers into our maps. This includes lightning for the past 24 hours, radar, satellite, weather alerts, and more. 
                                    We pull current conditions from over 90,000 weather stations in the US.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 mt-4">
                        <div class="image-modal" style="background-image:url(assets/images/fi%20satellite.jpg)">
                            <div class="overlay">    
                                <h6>Smoke & Planning</h6>
                                <p>Tracking smoke is easy with NOAA's HRRR smoke modeling data. Overlay other tools like drought conditions, webcams, significant fire potential, wildfire 
                                    risks to homes, and more. Find air quality conditions around the country.</p>
                            </div>
                        </div>
                    </div>
                </div>
            
                <div class="btn-group centered" style="margin:5em 0 0 0">
                    <a href="https://www.mapofire.com?utm_campaign=mapotrails&utm_source=mapotechnology.com&utm_medium=front_page" class="btn btn-lg btn-orange">START TRACKING WILDFIRES</a>
                    <a href="https://play.google.com/store/apps/details?id=com.mapollc.mapofire" class="btn btn-black"><i class="fab fa-android"></i>Get the app</a>
                </div>
            </div>
        </div>
    </div>
</section>

<section style="background-color:#fcfcfc">
    <div class="container">
        <div class="row">
            <div class="col">
                <h1 class="text-center">Map of Trails: The Recreation Hub</h1>

                <p class="text-center">A comprehensive database of recreational trail data, primarily in Eastern Oregon, including multimedia, GPS points, trail descriptions, and more. Summer and 
                    winter trails feature hikes, mountain biking, snowmobiling, and backcountry ("AT") skiing.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="stats">
    <div class="container">
        <div class="row my-1 align-items-center justify-content-around gap-5">
            <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12 my-3">
                <div class="stat" id="s1">
                    <h2>481</h2>
                    <span>trail guides</span>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12 my-3">
                <div class="stat" id="s1">
                    <h2>3,748</h2>
                    <span>photos & videos</span>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12 my-3">
                <div class="stat" id="s1">
                    <h2>4,736</h2>
                    <span>miles of trails</span>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12 my-3">
                <div class="stat" id="s1">
                    <h2>11,463 ft</h2>
                    <span>highest elevation</span>
                </div>
            </div>
        </div>
    </div>
</section>

<section>
    <div class="container">
        <div class="row">
            <div class="col">
                <div class="row align-items-center">
                    <div class="col-12 mt-4">
                        <div class="image-modal" style="background-image:url(assets/images/mapot.png)">
                            <div class="overlay">    
                                <h6>On-the-ground GPS</h6>
                                <p>Most online trail maps use satellite imagery to GPS trails, but that leads to inaccuracies. Our trails have been GPS by a human, on the ground, resulting in the most accurate track possible.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 mt-md-0 mt-sm-4">
                        <div class="image-modal" style="background-image:url(assets/images/pxl_20210926_185531292.jpg)">
                            <div class="overlay">    
                                <h6>Multimedia</h6>
                                <p>Using photos and video, we can showcase what the trails and surrounding areas look like from trail conditions to picturesque mountain views.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 mt-4 mt-md-0">
                        <div class="image-modal" style="background-image:url(assets/images/mapotwy.png)">
                            <div class="overlay">    
                                <h6>Waypoints</h6>
                                <p>Bridges, common avalanche paths, parking, and more&mdash;simply called waypoints on Map-o-Trails. These waypoints mark a abundance of spots along our mapped trails.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <a href="https://www.mapotrails.com/guides/<?=date('n') > 3 && date('n') < 11 ? 'trail' : 'snow'?>?utm_campaign=mapotrails&utm_content=<?=date('n') > 3 && date('n') < 11 ? 'trail' : 'snow'?>&utm_source=mapotechnology.com&utm_medium=front_page" class="btn btn-lg btn-red mt-5" style="display:block;margin:0 auto">FIND A TRAIL FOR YOU</a>
            </div>
        </div>
    </div>
</section>

<section>
    <div class="container">
        <div class="row">
            <div class="col">
                <h1 class="text-center">OregonRoads &mdash; Do a trip check</h1>

                <div class="row align-items-center">
                    <div class="col-lg-6 col-md-12">
                        <img loading="lazy" src="assets/images/oreroads/nwi3fNa.png" style="margin:0 auto;max-height:500px;width:auto">
                    </div>
                    <div class="col-lg-6 col-md-12">
                        <p class="text-center">Do a trip check! Find the latest winter road conditions, current weather, and view roadside cameras across the entire state of Oregon using
                        our innovative road conditions app for Oregon. Download for Android or use on the web!
                        </p>

                        <div class="btn-group mt-5 centered">
                            <a href="https://apps.mapotechnology.com/oregonroads?utm_campaign=oregonroads&utm_source=mapotechnology.com&utm_medium=front_page" class="btn btn-lg btn-orange"><i class="far fa-laptop"></i>Explore the web app</a>
                            <a href="https://play.google.com/store/apps/details?id=com.mapollc.oreroads" class="btn btn-black"><i class="fab fa-android"></i>Download for Android</a>
                            <a href="./oregonroads?utm_campaign=oregonroads&utm_source=mapotechnology.com&utm_medium=front_page" class="btn btn-lg btn-gray">Learn more about it</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!--<section>
    <div class="container">
        <h1 class="text-center">Title</h1>
        <?/*<h1 class="text-center">Wildland Map Subscriptions</h1>

        <p class="text-center">To help support building our wildfire mapping, we offer a premium subscription for users to gain acess to additional features. The premium subscription
            is ideal for firefighters or hobbyists.
        </p>

        <div class="row row-cols-1 row-cols-md-3 mt-5 mb-3 text-center justify-content-around">
            <div class="col">
                <div class="card mb-4">
                    <div class="card-header py-3">
                        <h4 class="my-0">Free</h4>
                    </div>
                    <div class="card-body">
                        <h2 class="card-title pricing-card-title">$0<small>/mo</small></h1>
                        <p class="annualPrice">FREE</p>
                        <ul class="list-unstyled mt-3 mb-4">
                            <li>Access to all wildfires</li>
                            <li>Weather conditions for fires</li>
                            <li>Wildfire perimeters for all LARGE incidents</li>
                            <li>Map layers for weather alerts, air quality, and more</li>
                        </ul>
                        <a href="#" class="btn btn-lg bold">Sign up for free</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card color mb-4">
                    <div class="card-header py-3">
                        <h4 class="my-0">Premium</h4>
                    </div>
                    <div class="card-body">
                        <h2 class="card-title pricing-card-title">$<?=$moprice[0]?><small>/mo</small></h1>
                        <p class="annualPrice">(or $<?=$yrprice[0]?>/yr)</p>
                        <ul class="list-unstyled mt-3 mb-4">
                            <li>Everything in the free tier</li>
                            <li>Advanced map layers: smoke, hi-res satellite, modeling data</li>
                            <li>Fire weather forecasts and data</li>
                            <li>Track individual fires on your dashboard</li>
                        </ul>
                        <a href="#" class="btn btn-lg btn-light-blue">Get started</a>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card mb-4">
                    <div class="card-header py-3">
                        <h4 class="my-0">Donate</h4>
                    </div>
                    <div class="card-body">
                        <h2 class="card-title pricing-card-title">Make a donation</h2>
                        <p class="annualPrice">&nbsp;</p>
                        <ul class="list-unstyled mt-3 mb-4">
                            <li>The wildfire map and other technology is built using high-end servers and we currently spend a lot of volunteer hours maintaining
                                it. Help support our mission by making a one-time or reoccurring contribution!
                            </li>
                        </ul>
                        <a href="#" class="btn btn-lg btn-yellow">Donate</a>
                    </div>
                </div>
            </div>
        </div>*/?>
    </div>
</section>-->

<?include_once 'footer.inc.php'?>