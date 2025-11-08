<?
function formFields($trialAllowed = false) {
    global $plan;
    global $trialExhausted;
    $formFields = '';

    if (!$trialExhausted && $trialAllowed) {
        $formFields .= '<input type="hidden" name="trial" value="1">';
    }

    if ($_GET['customer_email'] || $_SESSION['customer_email']) {
        $formFields .= '<input type="hidden" name="customer_email" value="' . ($_SESSION['customer_email'] ? $_SESSION['customer_email'] : $_GET['customer_email']) . '">
';
    }

    if ($_GET['ref']) {
        $formFields .= '<input type="hidden" name="ref" value="'.$_GET['ref'].'">
';
    }

    if ($_GET['cid'] || $_REQUEST['customer_id']) {
        $formFields .= '<input type="hidden" name="cid" value="' . ($_REQUEST['customer_id'] ? $_REQUEST['customer_id'] : $_GET['cid']) . '">
';
    }

    if ($_GET['authenticated']) {
        $formFields .= '<input type="hidden" name="authenticated" value="' . $_GET['authenticated'] . '">
';
    }

    $formFields .= '<input type="hidden" name="cost" value="'. $plan->getTotalPrice() .'">
        <input type="hidden" name="pid" value="'. $plan->getPriceName() .'">
        <input type="hidden" name="name" value="'. $plan->getName() .'">
        <input type="hidden" name="price" value="'. $plan->getPriceID() .'">
        ' . ($_GET['devel'] == 1 ? '<input type="hidden" name="devel" value="1">' : '');

    return $formFields.'
';
}

$suggestUpgrade = isset($_GET['upgrade']);
?>
<section class="plans-section">
    <h2>Choose Your Plan</h2>
    <p>Gain full access to wildfire tools, layers, and alerts on Web and Android.</p>

    <div class="plans">
        <? if (!isset($_GET['ref']) && $_GET['ref'] != 'com.mapollc.mapofire') {?>
        <div class="plan">
            <h3>Lookout</h3>
            <div class="price">$0</div>
            <div class="interval">always</div>
            <ul>
                <li>✅ All wildfires currently reported</li>
                <li>✅ Wildfire perimeters</li>
                <li>✅ Evacuations</li>
                <li>✅ Basic basemaps</li>
                <li>❌ Historical fires</li>
                <li>❌ Satellite hotspots</li>
                <li>❌ Wildfire risk overlays</li>
                <li>❌ Smoke models</li>
            </ul>

            <a href="https://www.mapotechnology.com/secure/register?service=mapofire" class="btn btn-<?=$_SESSION['uid'] ? 'gray disabled' : 'black'?>">Get Started</a>
        </div>
        <? }
        $plan->setPlan('ignite_monthly');
        ?>
        <div class="plan<?=!$suggestUpgrade ? ' highlight' : ''?>">
            <?=!$suggestUpgrade ? '<div class="badge">Most Popular</div>' : ''?>
            <h3>Ignite</h3>
            <div class="price">$<?=$plan->getPrice()?></div>
            <div class="interval">per <?=$plan->getTerm()?></div>
            <ul>
                <li>✅ Satellite hotspots</li>
                <li>✅ Wildfire risk overlays</li>
                <li>✅ Surface smoke models</li>
                <li>✅ Additional basemaps</li>
                <li>✅ Historical fires</li>
                <li>❌ 48-72 hour satellite hotspots</li>
                <li>❌ GIS overlays</li>
                <li>❌ CAL FIRE aircraft</li>
            </ul>

            <? if (!$trialExhausted) {?>
            <p class="trial-text">
                Start your <b style="font-weight:700">7-day free trial</b>. Cancel anytime.
            </p>
            <? } ?>

            <form action="https://www.mapotechnology.com/purchase/<?= $product ?>" id="prem-form" method="post">
                <?=formFields(true);?>
                <input type="submit" <?=$suggestUpgrade ? 'disabled ' : ''?>class="btn btn-orange" value="<?=$trialExhausted ? 'Get Ignite' : 'Try it for free' ?>">
            </form>
        </div>

        <?$plan->setPlan('hotshot_monthly');?>
        <div class="plan<?=$suggestUpgrade ? ' highlight' : ''?>">
            <div class="badge"><?=!$suggestUpgrade ? 'Best for pros' : 'Upgrade features'?></div>
            <h3>Hotshot</h3>
            <div class="price">$<?=$plan->getPrice()?></div>
            <div class="interval">per <?=$plan->getTerm()?></div>
            <ul>
                <li>✅ Offline Maps (Android)</li>
                <li>✅ Additional smoke models</li>
                <li>✅ PNW evacuation risks</li>
                <li>✅ Federal lands & USFS roads</li>
                <li>✅ CAL FIRE aircraft</li>
                <li>✅ USFS basemap</li>
            </ul>

            <form action="https://www.mapotechnology.com/purchase/<?= $product ?>" id="pro-monthly-form" method="post">
                <?=formFields()?>
                <input type="submit" class="btn btn-orange" value="<?=$suggestUpgrade ? 'Upgrade now!' : 'Get full access'?>">
            </form>

            <?$plan->setPlan('hotshot_annual')?>
            <form action="https://www.mapotechnology.com/purchase/<?= $product ?>" id="pro-yearly-form" method="post">
                <?=formFields()?>
                <a href="#" id="pro-yearly" onclick="return false">Or pay yearly and save 10%</a>
            </form>
        </div>
    </div>

    <div class="trust">
        🔒 Secure checkout &nbsp; | &nbsp; Cancel anytime &nbsp; | &nbsp; Instant access &nbsp; | &nbsp; <a href="#comparison">See all features</a>
    </div>
</section>

<section class="feature-section">
    <h2 id="comparison">Full Feature List</h2>

    <div class="features-wrapper">
        <div class="features">
            <div class="row tiers">
                <div></div>
                <div>Lookout (Free)</div>
                <div>Ignite</div>
                <div>Hotshot</div>
            </div>

            <div class="row group">
                <div>Basemaps</div>
            </div>
            <div class="row">
                <div>MAPO Outdoors</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Satellite</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Open Street Map</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Dark</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Terrain</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Topofire</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>USFS Terrain</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>3-D Capable Maps</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>

            <div class="row group">
                <div>Additional Features</div>
            </div>
            <div class="row">
                <div>Incident coordinates</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Fire growth charts</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Spot fire weather forecast</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>

            <div class="row">
                <div>Historical fires & perimeters</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>

            <div class="row">
                <div>Offline maps (Android)</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>

            <div class="row group">
                <div>Map Layers</div>
            </div>
            <div class="row">
                <div>New Fires</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>All Fires</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Smoke Checks</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Prescribed Burns</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Wildfire Perimeters</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Evacuations</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Weather Alerts</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Air Quality</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Doppler Radar</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Visible Satellite</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <!--<div class="row">
                <div>Fire Danger</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>-->
            <div class="row">
                <div>24-hr Satellite Heat Detection</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>1-hr Lightning</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Energy Release Component</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Current Observations</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            
            <div class="row">
                <div>Current Observations w/ RAWS Data</div>
                <div class="xmark">❌</div>
                <div class="check">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Infrared Satellite</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Water Vapor Satellite</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Significant Fire Potential</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Wildfire Likelihood</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Wildfire Risk to Homes</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Drought Monitor</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Fuels/Vegetation</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Smoke Detection</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Surface Smoke</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Oregon Dept. of Forestry Fire Danger</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Smoke Forecast</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Outlooks</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>48-hr Satellite Heat Detection</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>72-hr Satellite Heat Detection</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>24-hr Lightning</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Forecast Models</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>PNW Evacuation Vulnerability</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Vertically Integrated Smoke</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Wildfire Risk Index</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Wildfire Hazard Potential</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>NWS County Warning Areas</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>USFS Road Network</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Federal Lands</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Township Range Section</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Dispatch Boundaries</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>GACC Boundaries</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Cal Fire Hazard Severity Zones</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Cal Fire Administrative Units</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>
            <div class="row">
                <div>Cal Fire Aircraft</div>
                <div class="xmark">❌</div>
                <div class="xmark">❌</div>
                <div class="check">✅</div>
            </div>

        </div>
    </div>
</section>