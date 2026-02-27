<div class="row">
    <div class="col w100">
        <div class="card">
            <? if ($_SESSION['org_admin']) {
                echo message(null, 'Your account is part of an commerical group account.', true);
            } ?>

            <h1>Hello, <?= $_SESSION['first_name'] ?>!</h1>
            <h3 style="padding-top:0;font-weight:100">
                Thank you for choosing MAPO. Your account provides personalized access to all our services and allows you to customize your settings.
                Save your preferences and enjoy a seamless experience across all devices.
            </h3>
        </div>
    </div>
</div>

<div class="grid-container">
    <div class="grid-item">
        <? if ($isAdmin) { ?>
            <div class="card dark">
                <h2>MAPO New Users KPIs</h2>

                <div class="table-responsive">
                    <table class="table small">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Last</th>
                                <th>Previous</th>
                                <th>Comparison</th>
                            </tr>
                        </thead>
                        <tbody>
                            <? foreach (['hour', 'day', 'week', 'month', 'year'] as $period) { ?>
                            <tr>
                                <td><?= $period == 'month' ? '30 days' : ucfirst($period) ?></td>
                                <td><?= number_format($newUsersSQL["last_$period"]) ?></td>
                                <td><?= number_format($newUsersSQL["prev_$period"]) ?></td>
                                <td><?= kpiCompare($newUsersSQL, $period) ?></td>
                            </tr>
                            <? } ?>
                        </tbody>
                    </table>
                </div>
            </div>
        <? } ?>

        <div class="card dark">
            <h2>Wildfires Near You</h2>
            <? if ($user['location']) { ?>
                <p class="help">Current wildfires burning within 50 miles of you (<a href="settings/location"><?= $user['location']->city . ', ' . $user['location']->state ?></a>).</p>

                <div id="nearby" class="overflow">
                    <div class="spinner"></div>
                </div>
            <? } else {
                echo '<div class="message error">Your location settings are not set. Would you like to <a href="settings#location">change them</a>?</div>';
            } ?>
        </div>

        <div class="card dark">
            <h2>Map of Trails Uploads</h2>
            <p class="help">Any GPX, KML, or GeoJSON files you've upload to Map of Trails.</p>

            <div id="uploads">
                <div class="spinner"></div>
            </div>
        </div>
    </div>
    <div class="grid-item">
        <? if ($isAdmin) { ?>
            <div class="card dark">
                <h2>MAPO Wildfire Stats</h2>

                <div class="table-responsive">
                    <table class="table small">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Last</th>
                                <th>Previous</th>
                                <th>Comparison</th>
                            </tr>
                        </thead>
                        <tbody>
                            <? foreach (['hour', '6', '12', 'day', 'week', 'month'] as $period) { ?>
                            <tr>
                                <td><?= $period == 'month' ? '30 days' : ($period == '6' || $period == '12' ? "$period hours" : ucfirst($period)) ?></td>
                                <td><?= number_format($newFiresSQL["last_$period"]) ?></td>
                                <td><?= number_format($newFiresSQL["prev_$period"]) ?></td>
                                <td><?= kpiCompare($newFiresSQL, $period, true) ?></td>
                            </tr>
                            <? } ?>
                        </tbody>
                    </table>
                </div>
            </div>
        <? } ?>

        <div class="card dark">
            <h2>Wildfires You Follow</h2>
            <p class="help">All wildfires you are following on Map of Fire.</p>

            <div id="favfires" class="overflow">
                <div class="spinner"></div>
            </div>
        </div>

        <div class="card dark">
            <h2>Your Favorite Trails</h2>
            <p class="help">All recreation trails you are following on Map of Trails.</p>

            <div id="favtrails">
                <div class="spinner"></div>
            </div>
        </div>
    </div>
</div>