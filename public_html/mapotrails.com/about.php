<?
$title = 'About the Trail Project';
include_once('header.inc.php');
/*$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
$result = mysqli_query($con2, "SELECT stats FROM stats") or die(mysqli_error($con2));
while($row = mysqli_fetch_assoc($result)){
    $s = unserialize($row['stats']);
    $total += $s['distance'];
}
echo $total;*/
$stats = json_decode('{"totals":{"trails":"475","media":"3681"},"distance":4412.35000000000945874489843845367431640625,"avg":9.26964285714287683504153392277657985687255859375,"max":230.640000000002515889718779362738132476806640625,"alt":11463.057832031250654836185276508331298828125,"loss":-1401.571634684288028438459150493144989013671875,"gain":1845.72837381857198124635033309459686279296875,"words":{"total":110182,"avg":231.474789915966397302327095530927181243896484375}}');
?>

<section class="page">
    <div class="container">
        <div class="crow center">
            <div class="col w-6">
                <h2>Beginnings</h2>
                <p>Map of Trails started as a simple website, under a different name, to house online trail data and multimedia. As the database of trails grew bigger, supplemental GIS data 
                    (such as points of interest, or what we call "waypoints") and thousands of photos were added.
                </p>

                <a href="guides/trail?utm_campaign=mapotrails&utm_source=about&utm_medium=beginnings" class="btn btn-lg btn-yellow" style="margin-top:2em">Find a trail to travel</a>
            </div>
            <div class="col w-6 center">
                <img src="//cdn.mapotrails.com/display/lgr1.png">
                <figure>An early rendition of our online trail mapping</figure>
            </div>
        </div>
    </div>
</section>

<section class="page">
    <div class="container">
        <div class="crow center">
            <div class="col w-12">
                <h2>What we offer</h2>
                <p class="space">Our database of trail data boasts a variety of recreational activities and is growing. Here's our stats of what our online trail mapping offers.</p>

                <div class="mt-stats">
                    <div class="s">
                        <h3><?=$stats->totals->trails?></h3>
                        <h4>Trail Guides</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->distance)?> mi</h3>
                        <h4>Miles of Trail</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->avg, 1)?> mi</h3>
                        <h4>Average Trail Length</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->max, 1)?> mi</h3>
                        <h4>Longest Trail</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->alt, 2)?> ft</h3>
                        <h4>Highest Elevation</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->totals->media)?></h3>
                        <h4>Photos & Videos</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->words->total)?> words</h3>
                        <h4>Trail Descriptions</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->gain, 1)?> ft</h3>
                        <h4>Average Altitude Gain</h4>
                    </div>
                    <div class="s">
                        <h3><?=number_format($stats->loss, 1)?> ft</h3>
                        <h4>Average Altitude Loss</h4>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="page">
    <div class="container">
        <div class="crow rev center">
            <div class="col w-6 center">
                <img src="//cdn.mapotrails.com/display/lgr2.png">
                <figure>The default trail on this map is vastly off compared to our GPS data</figure>
            </div>
            <div class="col w-6">
                <h2>Accuracy</h2>
                <p class="space">Unlike most online trail mapping projects, our data is manually mapped from a human on the ground. This data is gathered using GPS 
                    technology to give the most accurate route for hiking, mountain biking, skiing, or snowmobiling.
                </p>
                <p>With high-accuracy GPS data, our trail data is accurate within 0.0000000437 to 0.437 inches&mdash;less than the length of a grain of rice.</p>

                <a href="./?utm_campaign=mapotrails&utm_source=about&utm_medium=accuracy" class="btn btn-xl btn-red" style="margin-top:2em">Use the map</a>
            </div>
        </div>
    </div>
</section>

<section class="page">
    <div class="container">
        <div class="crow center">
            <div class="col w-6">
                <h2>3-D Mapping</h2>
                <p class="space">Gone are the days of paper or PDF maps&mdash;introducing Map of Trails' newest features that allow viewing trails and routes in 3-D. Using our
                    3-D viewer, you can get a feel for how steep the terrain really is, or look at a satellite view for a realistic feel.
                </p>

                <a href="./?utm_campaign=mapotrails&utm_source=about&utm_medium=3d" class="btn btn-xl btn-light-blue" style="margin-top:2em">Play around in 3-D</a>
            </div>
            <div class="col w-6 center">
                <img src="//cdn.mapotrails.com/display/mt3d.png">
                <figure>3-D mapping enhances route planning</figure>
            </div>
        </div>
    </div>
</section>

<section class="page">
    <div class="container">
        <div class="crow rev center">
            <div class="col w-6 center">
                <img src="//cdn.mapotrails.com/display/avy-layer.png">
                <figure>Various colors indicate degree of slope</figure>
            </div>
            <div class="col w-6">
                <h2>Winter Planning & Avalanche Safety</h2>
                <p class="space">Whether backcountry skiing or snowmobiling, chances are you're riding in terrain where avalanches can happen. Map of Trails offers
                    not only a layer that shows terrain slope and aspect, but additional tools to safely plan your winter travels. Remember, avalanches can occur on any slope,
                    but most occur between 30-45&deg;.
                </p>
                <p>Darker colors, like purple and black, indicate slopes above 45&deg; while oranges and red indicate slopes in the prime avalanche terrain. Any terrain without
                    shaded colors shows that terrain slope is less than 27&deg;.</p>

                <a href="./?utm_campaign=mapotrails&utm_source=about&utm_medium=kbyg" class="btn btn-xl btn-red" style="margin-top:2em">Know before you go</a>
            </div>
        </div>
    </div>
</section>

<section class="page">
    <div class="container">
        <div class="crow">
            <div class="col w-12">
                <h2>Our Trail Guides</h2>

                <p style="margin-bottom:2em">Most of our trail guides, whether for summer or winter activities, feature highly accurate GPS trail data, photos of trail conditions 
                    and scenery, a description of the trail, and points of interest&mdash;which we call "waypoints."
                </p>
            </div>
        </div>

        <div class="crow center">
            <div class="col w-4 center">
                <img src="//cdn.mapotrails.com/display/lgr3.png" style="box-shadow:0 0 20px rgb(10 10 10 / 35%);border-radius:6px">
            </div>
            <div class="col w-4 center">
                <img src="//cdn.mapotrails.com/display/lgr5.png" style="box-shadow:0 0 20px rgb(10 10 10 / 35%);border-radius:6px">
            </div>
            <div class="col w-4 center">
                <img src="//cdn.mapotrails.com/display/lgr4.png" style="box-shadow:0 0 20px rgb(10 10 10 / 35%);border-radius:6px">
            </div>
        </div>

        <a href="./guide/snow/703/angell-basin-backcountry-skiing?utm_campaign=mapotrails&utm_source=about&utm_medium=example" class="btn btn-xl btn-yellow" style="display:block;margin:3em auto 0 auto">See an example</a>
    </div>
</section>

<?
echo generateFooter($js);
?>