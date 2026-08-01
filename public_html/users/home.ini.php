<div class="row">
    <div class="col w100">
        <div class="card">
            <? if (isset($_SESSION['groups'])) {
                $orgName = $_SESSION['groups']['org_name'];
                echo message(null, "Your account is part of an commerical group account with <b>$orgName</b>.", true);
            } ?>

            <h1>Hello, <?= $_SESSION['first_name'] ?>!</h1>
            <h3 style="padding-top:0;font-weight:100">
                Thank you for choosing MAPO. Your account provides personalized access to all our services and allows you to customize your settings.
                Save your preferences and enjoy a seamless experience across all devices.
            </h3>
        </div>
    </div>
</div>

<? if ($isAdmin) { ?>
    <div class="grid-container">
        <div class="grid-item">
            <div class="card dark admin">
                <h2>MAPO New Users KPIs</h2>

                <div class="table-responsive">
                    <table class="table small">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Last</th>
                                <th>Previous</th>
                            </tr>
                        </thead>
                        <tbody>
                            <? foreach (['hour', 'day', 'week', 'month', 'year'] as $period) { ?>
                                <tr>
                                    <td><?= $period == 'month' ? '30 days' : ucfirst($period) ?></td>
                                    <td><?= number_format($newUsersSQL["last_$period"]) ?></td>
                                    <td><?= number_format($newUsersSQL["prev_$period"]) . kpiCompare($newUsersSQL, $period) ?></td>
                                </tr>
                            <? } ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card dark admin">
                <h2>Crowdsourced Reports (Today)</h2>

                <div id="crowdsourced">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>

        <div class="grid-item">
            <div class="card dark admin">
                <h2>MAPO Wildfire Stats</h2>

                <div class="table-responsive">
                    <table class="table small">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Last</th>
                                <th>Previous</th>
                            </tr>
                        </thead>
                        <tbody>
                            <? foreach (['hour', '6', '12', 'day', 'week', 'month'] as $period) { ?>
                                <tr>
                                    <td><?= $period == 'month' ? '30 days' : ($period == '6' || $period == '12' ? "$period hours" : ucfirst($period)) ?></td>
                                    <td><?= number_format($newFiresSQL["last_$period"]) ?></td>
                                    <td><?= number_format($newFiresSQL["prev_$period"]) . kpiCompare($newFiresSQL, $period, true) ?></td>
                                </tr>
                            <? } ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
<? } ?>

<div class="grid-container">
    <div class="grid-item">
        <div class="card dark">
            <h2>Wildfires Near You</h2>
            <? if ($user['location']) { ?>
                <p class="help">Current wildfires burning within <select id="nearbyFiresDist">
                    <option value="10">10 miles</option>
                    <option value="15">15 miles</option>
                    <option value="25">25 miles</option>
                    <option value="35">35 miles</option>
                    <option value="50">50 miles</option>
                </select> of you (<a href="settings/location"><?= $user['location']->city . ', ' . $user['location']->state ?></a>).</p>

                <div id="nearby">
                    <div class="spinner"></div>
                </div>
            <? } else {
                echo '<div class="message error">Your home location has not been set. Would you like to <a href="settings#location">set it</a>?</div>';
            } ?>
        </div>

        <? if ($isAdmin) { ?>
            <div class="card dark">
                <h2>Map of Trails Uploads</h2>
                <p class="help">Any GPX, KML, or GeoJSON files you've upload to Map of Trails.</p>

                <div id="uploads">
                    <div class="spinner"></div>
                </div>
            </div>
        <? } ?>
    </div>

    <div class="grid-item">
        <div class="card dark">
            <h2>Wildfires You Follow</h2>
            <p class="help">All wildfires you are following on Map of Fire.</p>

            <div id="favfires">
                <div class="spinner"></div>
            </div>
        </div>

        <? if ($isAdmin) { ?>
            <div class="card dark">
                <h2>Your Favorite Trails</h2>
                <p class="help">All recreation trails you are following on Map of Trails.</p>

                <div id="favtrails">
                    <div class="spinner"></div>
                </div>
            </div>
        <? } ?>
    </div>
</div>