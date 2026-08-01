<?
if (!$permission->fire()->edit()) {
    echo invalidPermissions();
} else {
    function getStatus($s, $n, $t = 'Wildfire', $ac = '0')
    {
        $a = strtolower((string)$ac);

        if (!$s && !$n) return 'active';

        if ($s) {
            if ($s['Out'] ?? false) return 'out';
            if ($s['Control'] ?? false) return 'controlled';
            if ($s['Contain'] ?? false) return 'contained';
            if ((array)$s) return ''; // Checks if object has any properties
        }

        $notes = strtolower($n ?? '');
        if (str_contains($notes, 'contain')) return 'contained';
        if (str_contains($notes, 'control')) return 'controlled';

        return ($t === 'Smoke Check' && in_array($a, ['0', 'unknown', '']))
            ? 'unknown'
            : 'active';
    }

    function fireName($n, $t, $i)
    {
        $parts = $i ? explode('-', $i) : [];

        return match ($t) {
            'Prescribed Fire' => str_contains($n ?? '', 'RX') ? $n : "$n RX",
            'Smoke Check' => "Smoke Check" . ($i ? " #{$parts[1]}-" . (int)$parts[2] : ""),
            default => empty($n) ? "Incident #" . (int)($parts[2] ?? 0) : ucwords(strtolower(preg_replace('/^\d+(?=\D)\s?/', '', $n))) . " Fire"
        };
    }

    function formatTime($t)
    {
        if (time() - $t > 86400) return date('D, n/j/Y @ g:i A T', $t);
        else return ago($t);
    }

    function tz($tz)
    {
        return match ($tz) {
            'America/Los_Angeles' => 'Pacific',
            'America/Denver' => 'Mountain',
            'America/Chicago' => 'Central',
            'America/New_York' => 'Eastern',
            default => $tz
        };
    }

    function decimalToDMS($decimal, $type)
    {
        $direction = $type === 'lat' ? ($decimal >= 0 ? 'N' : 'S') : ($decimal >= 0 ? 'E' : 'W');
        $decimal = abs($decimal);
        $degrees = floor($decimal);
        $minutesFloat = ($decimal - $degrees) * 60;
        $minutes = floor($minutesFloat);
        $seconds = round(($minutesFloat - $minutes) * 60, 2);

        return "{$degrees}&deg;{$minutes}'{$seconds}\" {$direction}";
    }

    $inciweb = 0;
    $hist = null;
    $where = "w.wfid = {$_GET['wfid']}";

    if ($_GET['history'] == 1) {
        $sql = "SELECT name, wfid, status, incidentID FROM wildfires w WHERE $where LIMIT 1";
    } else {
        $sql = "SELECT w.*, dc.name AS dcname, dc.location AS dcloc, dc.gacc AS gacc, d.agency AS org, d.area, d.unit, d.logo, ws.fuels AS fuelGroups, ws.causes, ws.behavior, ws.cost, ws.people, ws.image AS incPhoto, ws.resources AS sitRep
                FROM wildfires w 
                LEFT JOIN dispatch_centers dc ON dc.agency = w.agency
                LEFT JOIN wildfiresSupp ws ON ws.incidentID = w.incidentID
                LEFT JOIN dispatch_zones d ON d.unit = w.unit WHERE $where LIMIT 1";

        /*$sql = "SELECT w.*, ws.fuels AS fuelGroup, ws.causes, ws.behavior, ws.image AS incPhoto, d.agency AS jurisdiction, d.area AS jurisdiction_unit, c.name AS center_name FROM wildfires AS w 
        LEFT JOIN dispatch_centers AS c ON c.agency LIKE w.agency OR c.agency LIKE CONCAT(SUBSTRING(w.agency, 1, 2), '-', SUBSTRING(w.agency, 3, 5))
        LEFT JOIN wildfiresSupp AS ws ON ws.incidentID = w.incidentID
        LEFT JOIN dispatch_zones AS d ON d.unit = SUBSTRING_INDEX(SUBSTRING_INDEX(w.incidentID, '-', -2), '-', 1) WHERE wfid = $_GET[wfid] LIMIT 1";*/
    }

    $row = mysqli_fetch_assoc(mysqli_query($con, $sql));

    if (!$row) {
        echo errorCode('Wildfire Not Found', 'The wildfire incident you are searching for does not exist.');
    } else {
        if ($_GET['history'] == 1) {
            $hist = mysqli_query($con, "SELECT acres, updated FROM acres_history WHERE incidentID = '$row[incidentID]' ORDER BY updated DESC");
        } else {
            $inciweb = mysqli_num_rows(mysqli_query($con, "SELECT captured FROM inciweb FORCE INDEX(idx_year_state_name) WHERE year = {$row['year']} AND name LIKE '%{$row['name']}%' AND state = '{$row['state']}' LIMIT 1"));
        }

        date_default_timezone_set($row['timezone'] ?? 'America/Los_Angeles');
        $type = $row['type'];
        $geocode = json_decode($row['near']);
        $acres = $row['acres'];
        $fireStatus = empty($row['status']) ? false : json_decode($row['status'], true);
        if (floatval($row['acres']) > 1000 && (time() - $row['updated'] > (60 * 60 * 24 * 30))) {
            $fireStatus = ['Out' => intval($row['updated'])];
        }
        $status = getStatus($fireStatus, $row['notes'], $type, $acres);
        $hasSitRep = $row['sitRep'] !== null;
        $sr = $hasSitRep ? json_decode($row['sitRep']) : null;

        $request = time() - $row['date'] < 43200 ? 'new' : 'all';
        $alg = wildfireAlgorithm($request, $row['type'], empty($row['status']) ? [] : json_decode($row['status'], true), $row, '', true);

        $conditions = [
            ['Updated <= 5 days ago and is not "UTL"' => false],
            ['Started > 1 day ago and is "UTL"' => false],
            ["Acreage is 0 or unknown and started > 1 day ago" => false],
            ['Type is "smoke check" and started > 2 hours ago and acreage is 0 or "UTL"' => false],
            ["Updated > 3 days ago or never been updated" => false],
            ['Status is "out" and started > 3 days ago' => false],
            ['Status is "contain" or "control" and started > 5 days ago and acreage is <= 1' => false],
            ["Acreage is < 50 and started > 1 month ago" => false],
            ["Acreage is > 1000 and started < 1 month ago" => true],
            ['Is a "historical fires" or "new fires" request' => true]
        ];
?>

        <form action="" method="post" enctype="multipart/form-data">
            <input type="hidden" name="wfid" value="<?= $row['wfid'] ?>">
            <input type="hidden" name="incID" value="<?= $row['incidentID'] ?>">
            <input type="hidden" name="previous_acres" value="<?= $acres ?>">

            <div class="cad-card">
                <div class="header">
                    <div style="flex:0 1 auto">
                        <div class="title">
                            <h1 style="margin:0;color:#5e4949"><?= strtoupper(fireName($row['name'], $type, $row['incidentID'])) ?></h1>
                            <span style="font-size:20px;color:#505050">#<?= $row['incidentID'] ?></span>
                        </div>
                    </div>
                    <div class="details">
                        <span class="status-badge <?= $status ?>"><?= strtoupper($status) ?></span>
                        <div style="color:#000;margin-top:5px">WFID #: <b><?= $row['wfid'] ?></b></div>
                    </div>
                </div>

                <? if ($_GET['history'] == 1) {
                    echo "<a href=\"#\" onclick=\"history.go(-1);return false\" class=\"btn btn-gray\" style=\"margin:0 0 1em 0!important\">Go back</a>";

                    if ($hist->num_rows == 0) {
                        echo '<div class="item" style="margin-top:1em"><span>There are no fire acreage changes reported with this incident.</span></div>';
                    } else {
                        $history = mysqli_fetch_all($hist, MYSQLI_ASSOC);
                        echo PHP_EOL . "<script>const acresHistory=" . json_encode($history) . ";</script>" . PHP_EOL;
                ?>
                        <canvas id="history-chart" style="width:100%;height:260px"></canvas>

                        <div class="table-responsive">
                            <table class="table" style="color:#222">
                                <thead>
                                    <tr>
                                        <th>Update Time</th>
                                        <th>Acres</th>
                                        <th>Change Since Last Update</th>
                                        <th>Time Since Last Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?
                                    foreach ($history as $i => $h) {
                                        $next = $history[$i + 1] ?? null;
                                        $diff = $next ? $h['acres'] - $next['acres'] : 0;
                                        $up = $diff > 0;

                                        $deltaTime = ago($next['updated'], $h['updated']);
                                    ?>
                                        <tr>
                                            <td><?= date('n/j/Y g:i A', $h['updated']) ?></td>
                                            <td><?= number_format($h['acres']) ?></td>
                                            <td>
                                                <? if ($next) {
                                                    echo number_format($diff);

                                                    if ($diff != 0) { ?>
                                                        <i class="fas fa-caret-<?= $up ? 'up' : 'down' ?>" style="margin:0 10px 0 5px;color:var(--<?= $up ? 'green' : 'red' ?>)"></i>
                                                        <small>(<?= number_format(($diff / $next['acres']) * 100, 1) ?>%)</small>
                                                <? }
                                                } else {
                                                    echo '--';
                                                } ?>
                                            </td>
                                            <td>
                                                <?= $next ? str_replace(' ago', '', $deltaTime) : '--' ?>
                                            </td>
                                        </tr>
                                    <? } ?>
                                </tbody>
                            </table>
                        </div>
                    <? }
                } else { ?>
                    <a href="./edit?wfid=<?= $_GET['wfid'] ?>&history=1" class="btn btn-yellow" style="margin:0 0 1em 0!important">View Acres History</a>

                    <details open>
                        <summary>Times</summary>

                        <div class="grid small">
                            <div class="item">
                                <div class="label">Fire Year</div>
                                <span><?= $row['year'] ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Incident Timezone</div>
                                <span><?= tz($row['timezone']) ?> Time</span>
                            </div>
                            <div class="item">
                                <div class="label">Last Updated</div>
                                <span><?= formatTime($row['updated']) ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Discovered</div>
                                <span><?= formatTime($row['date']) ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Captured</div>
                                <span><?= formatTime($row['captured']) ?></span>
                            </div>
                        </div>
                    </details>

                    <details open>
                        <summary>Basic Details</summary>

                        <div class="grid">
                            <div class="item">
                                <div class="label">Incident Type</div>
                                <span><?= $type ?></span>
                            </div>
                            <div class="item">
                                <div class="label">State</div>
                                <span><?= convertState($row['state'], 1) . " ($row[state])" ?></span>
                            </div>
                            <div class="item">
                                <div class="label">County (FIPS)</div>
                                <span><?= "{$geocode->county} County ({$geocode->fips})" ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Nearest Location</div>
                                <span><?= $geocode->near ?></span>
                            </div>
                        </div>

                        <div class="grid">
                            <div class="item">
                                <div class="label">Coordinates</div>
                                <span>
                                    <a target="_blank" href="https://www.mapofire.com/#13/<?= "$row[lat]/$row[lon]" ?>"><?= "$row[lat], $row[lon]" ?></a><br>
                                    <?= decimalToDMS($row['lat'], 'lat') . ', ' . decimalToDMS($row['lon'], 'lon') ?>
                                </span>
                            </div>
                            <div class="item">
                                <div class="label">Dispatch</div>
                                <span><?= "<a href=\"../dispatch/edit?agency=$row[agency]\">$row[agency]</a>" . ($row['dcname'] ? " &ndash; {$row['dcname']}" : '') ?></span>
                            </div>
                            <div class="item">
                                <div class="label">GACC</div>
                                <span><?= "<a href=\"../dispatch?gacc={$row['gacc']}\">{$row['gacc']}</a> &ndash; {$gaccs[$row['gacc']]}" ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Jurisdiction</div>
                                <span><?= ($row['org'] ? $row['org'] . ($row['area'] ? ": {$row['area']}" : '') . ($row['unit'] ? " ($row[unit])" : '') : 'None') ?></span>
                            </div>
                        </div>

                    </details>

                    <details open>
                        <summary>Attributes</summary>

                        <div class="grid">
                            <div class="item">
                                <div class="label">Size</div>
                                <input type="number" name="acres" class="field" style="max-width:106px" step="0.02" placeholder="0" value="<?= $acres ?>" <?= $status == 'out' ? ' disabled title="This fire is out so acreage cannot be changed"' : '' ?>>
                            </div>
                            <div class="item">
                                <div class="label">Behavior</div>
                                <span><?= $row['behavior'] && $row['behavior'] != '[]' ? implode(', ', json_decode($row['behavior'])) : 'N/A' ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Cause</div>
                                <span><?= $row['causes'] && $row['causes'] != '[]' ? implode(' - ', array_unique(json_decode($row['causes']))) : 'N/A' ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Fuels</div>
                                <span><?= $row['fuelGroups'] && $row['fuelGroups'] != '[]' ? implode(', ', json_decode($row['fuelGroups'])) : ($row['fuels'] ? $row['fuels'] : 'N/A') ?></span>
                            </div>
                            <div class="item">
                                <div class="label">WildCAD Notes</div>
                                <span><?= $row['notes'] ? $row['notes'] : 'N/A' ?></span>
                            </div>

                        </div>
                    </details>

                    <details open>
                        <summary>SitRep</summary>

                        <div class="grid">
                            <div class="item">
                                <div class="label">IMT Type</div>
                                <span><?= $hasSitRep && $sr->teamType != '0' ? $sr->teamType : 'N/A' ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Cost-to-Date</div>
                                <span><?= $row['cost'] ? '$' . number_format($row['cost'], 0) : 'Unknown' ?></span>
                            </div>
                            <div class="item">
                                <div class="label">People Assigned</div>
                                <span><?= $row['people'] ? number_format($row['people'], 0) : 'Unknown' ?></span>
                            </div>
                        </div>

                        <div class="grid">
                            <div class="item">
                                <div class="label">Structures Threatened</div>
                                <span><?= $hasSitRep ? number_format($sr->structures, 0) : 0 ?></span>
                            </div>
                            <? foreach ($sr->ground as $k => $v) {
                                echo "<div class=\"item\"><div class=\"label\">$k</div><span>$v</span></div>";
                            } ?>
                            <div class="item">
                                <div class="label">Fixed Wing</div>
                                <span><?= $hasSitRep ? $sr->aircraft->fixedWing : 0 ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Helicopters</div>
                                <span><?= $hasSitRep ? $sr->aircraft->helicopters : 0 ?></span>
                            </div>
                        </div>
                    </details>

                    <details open>
                        <summary>Meta</summary>

                        <div class="grid">
                            <div class="item">
                                <div class="label">Inciweb Data</div>
                                <span><?= $inciweb == 0 ? 'No' : 'Yes' ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Data Source</div>
                                <span><?= $row['owner'] ?></span>
                            </div>
                            <div class="item">
                                <div class="label">Displayed on Map</div>
                                <div class="radio" style="margin:0" title="Display fire on map according to algorithm">
                                    <input type="radio" id="d1" name="display" value="1" <?= $row['display'] == 1 ? ' checked' : '' ?>>
                                    <label for="d1">Yes</label>
                                </div>
                                <div class="radio" style="margin:0" title="Do NOT display fire on map regardless of algorithm">
                                    <input type="radio" id="d2" name="display" value="0" <?= $row['display'] != 1 ? ' checked' : '' ?>>
                                    <label for="d2">No</label>
                                </div>
                            </div>
                        </div>
                    </details>

                    <details>
                        <summary>Incident Photo</summary>
                        <div class="grid">
                            <div class="item">
                                <div class="label">Incident Photo</div>
                                <input type="file" name="incPhoto" id="incPhoto" class="field" style="color:#444;font-size:14px;font-weight:400" accept="image/png, image/jpeg">
                                <? if ($row['incPhoto'] != null) {
                                    $path = "../../../assets/images/mapofire/incidents/$row[incPhoto]";
                                    echo "<a target=\"_blank\" href=\"$path\"><img loading=\"lazy\" style=\"max-width:200px\" src=\"$path\"></a>";
                                } ?>
                            </div>
                        </div>
                    </details>

                    <details>
                        <summary>Algorithm Output</summary>

                        <div class="grid">
                            <div class="item">
                                <?
                                foreach ($alg[0] as $k => $v) {
                                    echo "<span style=\"color:var(--" . ($v == 1 ? 'green' : 'red') . ")\"><b>" . array_keys($conditions[$k - 1])[0] . ":</b> " . ($v == 1 ? 'True' : 'False') . "</span>";
                                }
                                echo "<span><b>Default show on map:</b> " . ($alg[1] == 1 ? 'Yes' : 'No') . "</span>";
                                ?>
                            </div>
                        </div>
                    </details>

                    <div class="btn-group" style="margin:0!important">
                        <input type="submit" class="btn btn-green" name="action" value="Save Changes">
                        <input type="button" class="btn" value="Go Back" onclick="goBack('../wildfires')">
                    </div>
                <? } ?>
            </div>

        </form>
<?    }
} ?>