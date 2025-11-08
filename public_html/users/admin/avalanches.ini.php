<?
$states = ["AK", "CA", "CO", "ID", "MT", "NH", "NM", "NV", "NY", "OR", "TX", "UT", "VT", "WA", "WY"];
$activities = [
    "Backcountry Tourer",
    "Climber",
    "Highway Personnel",
    "Hiker",
    "Human Powered Guided Client",
    "Hybrid Rider",
    "Inbounds Rider",
    "Mechanized Guide",
    "Mechanized Guided Client",
    "Motorist",
    "Other",
    "Others at Work",
    "Rescuer",
    "Resident",
    "Sidecountry Rider",
    "Ski Patroller",
    "Snowmobiler",
    "Snowplayer"
];

function stdev($array) {
    $num = count($array);
    if ($num === 0) {
        return 0;
    }

    $mean = array_sum($array) / $num;
    $variance = 0;

    foreach ($array as $value) {
        $variance += pow($value - $mean, 2);
    }

    return round(sqrt($variance / $num), 4); 
}

function data($data, $i, $s) {
    $x = $i + 1;

    if ($data[$i][$s] != 0 && $data[$x][$s] != 0) {
        $diff = ($data[$i][$s] - $data[$x][$s]) / $data[$x][$s];
        $c = $diff > 0 ? 'red' : 'green';
        return ' <small style="color:var(--' . $c . ')">(' . ($diff > 0 ? '+' : '') . round($diff * 100, 1) . '%)</small>';
    } else if ($data[$i][$s] == 0 && $data[$x][$s] == 1) {
        return ' <small style="color:var(--green)">(-100%)</small>';
    }
}

function countRecurringValues($array) {
    $counts = [];

    foreach ($array as $value) {
        if (array_key_exists($value, $counts)) {
            $counts[$value]++;
        } else {
            $counts[$value] = 1;
        }
    }

    return $counts;
}

if (!$permission->view()->avys()) {
    echo invalidPermissions();
} else {
    if ($function == 'report') {
        include_once 'incs/avy-report.ini.php';
    } else if ($function == 'stats') {
        $where = '';
        $params = str_replace('page=admin&method=avalanches', '', $_SERVER['QUERY_STRING']);

        if ($params) {
            $where = 'WHERE';
            $where .= isset($_GET['activity']) && $_GET['activity'] != '' ? " activity = '$_GET[activity]' AND " : '';
            $where .= isset($_GET['state']) && $_GET['state'] != '' ? " state = '$_GET[state]' AND " : '';

            $where = substr($where, 0, -5);
        }

        $sql = mysqli_query($con, "SELECT season, MIN(occurred) AS start, MAX(occurred) AS end, SUM(involved) AS involved, SUM(caught) AS caught, SUM(killed) AS killed, SUM(JSON_LENGTH(avalanche_details)) AS avalanches FROM avalanche $where GROUP BY season ORDER BY season DESC");
        $sql2 = mysqli_query($con, "SELECT season, state, avalanche_details FROM avalanche ORDER BY season ASC, state ASC");
        $sql3 = mysqli_query($con, "SELECT season, state, SUM(involved) AS involved, SUM(caught) AS caught, SUM(killed) AS killed FROM `avalanche` GROUP BY state, season ORDER BY state, season DESC");

        for ($i = 2009; $i < date('Y'); $i++) {
            $code[$i]['natural'] = 0; $code[$i]['artificial'] = 0; $code[$i]['unknown'] = 0;
            $code2[$i]['vehicle'] = 0; $code2[$i]['human'] = 0; $code2[$i]['explosives'] = 0;
            $code2[$i]['other'] = 0;

            foreach ($states as $s) {
                $state[$i][$s] = 0;
            }
        }

        while ($row = mysqli_fetch_assoc($sql2)) {
            $details = json_decode($row['avalanche_details']);
            
            foreach ($details as $avy) {
                $primary = substr($avy->primary_trigger, 0, 1);
                $sec = substr($avy->primary_trigger, 1, 1);

                if ($primary == 'N') {
                    $code[$row['season']]['natural']++;
                } else if ($primary == 'A') {
                    $code[$row['season']]['artificial']++;

                    if ($sec == 'M' || $sec == 'V' || $sec == 'K') {
                        $code2[$row['season']]['vehicle']++;
                    } else if ($sec == 'A' || $sec == 'E' || $sec == 'L' || $sec == 'B' || $sec == 'X' || $sec == 'H' || $sec == 'P' || ($sec == 'C' && $avy->secondary_trigger == 'c')) {
                        $code2[$row['season']]['explosives']++;
                    } else if ($sec == 'S' || $sec == 'R' || $sec == 'I' || $sec == 'F' || $sec == 'C') {
                        $code2[$row['season']]['human']++;
                    } else {
                        $code2[$row['season']]['other']++;
                    }
                } else {
                    $code[$row['season']]['unknown']++;
                }
            }
        }
        
        while ($row = mysqli_fetch_assoc($sql3)) {
            $stateStats[$row['season']][$row['state']]['involved'] += $row['involved'];
            $stateStats[$row['season']][$row['state']]['caught'] += $row['caught'];
            $stateStats[$row['season']][$row['state']]['killed'] += $row['killed'];
        }
        ?>
        <div class="row">
            <div class="col">
                <div class="card">
                    <h1>Avalanche Statistics for <?=$_GET['state'] != '' ? ucwords(strtolower($statesArray[$_GET['state']])) : 'All States'?></h1>

                    <div class="controls">
                        <form action="" method="get" style="align-items:flex-end">
                            <select name="activity" class="input" style="max-width:235px">
                                <option value="">- All Activities -</option>
                                <? foreach ($activities as $v) {
                                    echo '<option ' . ($_GET['activity'] == $v ? 'selected ' : '') . 'value="' . $v . '">' . $v . '</option>';
                                } ?>
                            </select>

                            <select name="state" class="input" style="max-width:190px">
                                <option value="">- All States -</option>
                                <? foreach ($states as $k) {
                                    echo '<option ' . ($_GET['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($statesArray[$k])) . '</option>';
                                } ?>
                            </select>

                            <input type="submit" class="btn btn-blue" value="Search">
                            <div class="btn-group">
                                <input type="button" class="btn btn-gray" value="Go Back" onclick="history.go(-1)">
                                <input type="button" class="btn btn-yellow" value="View in Google Sheets" onclick="window.open('https://docs.google.com/spreadsheets/d/1_KzxgYaAGPh2qjsGLpJr7w9X_v6fAv01c4DL_b4tW0Y/edit?usp=sharing')">
                            </div>
                        </form>
                    </div>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Winter Season</th>
                                    <th>Reporting Start</th>
                                    <th>Reporting End</th>
                                    <th># of Days</th>
                                    <th>Total Avalanches</th>
                                    <th>Involved</th>
                                    <th>Caught</th>
                                    <th>Killed</th>
                                    <th>Pct. Fatal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?
                                while ($row = mysqli_fetch_assoc($sql)) {
                                    $data[] = $row;
                                }

                                for ($i = 0; $i < count($data); $i++) {
                                    $x = $i + 1;
                                    $pct1 = $pct2 = $pct3 = '';
                                    $day = ($data[$i]['end'] - $data[$i]['start']) / (60 * 60 * 24);
                                    $days = $day < 1 ? 1 : ceil($day);
                                    $fatal = $data[$i]['killed'] / $data[$i]['avalanches'];

                                    if ($i < count($data) - 1) {
                                        $pct1 = data($data, $i, 'involved');
                                        $pct2 = data($data, $i, 'caught');
                                        $pct3 = data($data, $i, 'killed');
                                        
                                        $fatal2 = $data[$x]['killed'] / $data[$x]['avalanches'];
                                        $diff = ($fatal - $fatal2) / $fatal2;
                                        $pct4 = ' <small style="color:var(--'.($diff < 0 ? 'red' : 'green').')">('.round($diff * 100, 1).'%)</small>';
                                    }
                                ?>
                                    <tr>
                                        <td><?= $data[$i]['season'] . '-' . $data[$i]['season'] + 1 ?></td>
                                        <td><?=date('M j, Y', $data[$i]['start'])?></td>
                                        <td><?=date('M j, Y', $data[$i]['end'])?></td>
                                        <td><?= $days + 1 ?></td>
                                        <td><?= $data[$i]['avalanches'] ?></td>
                                        <td><?= $data[$i]['involved'] //. $pct1 ?></td>
                                        <td><?= $data[$i]['caught'] //. $pct2 ?></td>
                                        <td><?= $data[$i]['killed'] //. $pct3 ?></td>
                                        <td><?= round($fatal * 100, 1)?>% <?//=$pct4?></td>
                                    </tr>
                                <?
                                    $total['days'][] = $days;
                                    $total['avys'][] = $data[$i]['avalanches'];
                                    $total['inv'][] = $data[$i]['involved'];
                                    $total['cau'][] = $data[$i]['caught'];
                                    $total['kil'][] = $data[$i]['killed'];
                                    $total['fatal'][] = $fatal;
                                }?>
                                <tr>
                                    <td colspan="2" style="font-weight:bold">Total</td>
                                    <td><?=array_sum($total['days'])?></td>
                                    <td><?=array_sum($total['avys'])?></td>
                                    <td><?=array_sum($total['inv'])?></td>
                                    <td><?=array_sum($total['cau'])?></td>
                                    <td colspan="2"><?=array_sum($total['kil'])?></td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="font-weight:bold">Average</td>
                                    <td><?=round(array_sum($total['days']) / count($total['days']), 4)?></td>
                                    <td><?=round(array_sum($total['avys']) / count($total['avys']), 4)?></td>
                                    <td><?=round(array_sum($total['inv']) / count($total['inv']), 4)?></td>
                                    <td><?=round(array_sum($total['cau']) / count($total['cau']), 4)?></td>
                                    <td><?=round(array_sum($total['kil']) / count($total['kil']), 4)?></td>
                                    <td><?=round(array_sum($total['fatal']) / count($total['fatal']), 4)?></td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="font-weight:bold">Std. Deviation</td>
                                    <td><?=stdev($total['days'])?></td>
                                    <td><?=stdev($total['avys'])?></td>
                                    <td><?=stdev($total['inv'])?></td>
                                    <td><?=stdev($total['cau'])?></td>
                                    <td><?=stdev($total['kil'])?></td>
                                    <td><?=stdev($total['fatal'])?></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h2 style="margin-top:2em">Primary Triggers by Year</h2>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <?foreach($code[2009] as $k => $v) {
                                        echo '<th>'.ucfirst($k).'</th>';
                                    }?>
                                </tr>
                            </thead>
                            <tbody>
                                <?for ($i = date('Y') - 1; $i >= 2009; $i--) {
                                    echo '<tr><td>'.$i.'-'.($i + 1).'</td>';
                                    foreach ($code[$i] as $t) {
                                        echo '<td>'.$t.'</td>';
                                    }
                                    echo '</tr>';
                                }?>
                            </tbody>
                        </table>
                    </div>

                    <h2 style="margin-top:2em">Secondary Triggers by Year</h2>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <?foreach($code2[2009] as $k => $v) {
                                        echo '<th>'.ucwords($k).'</th>';
                                    }?>
                                </tr>
                            </thead>
                            <tbody>
                                <?for ($i = date('Y') - 1; $i >= 2009; $i--) {
                                    echo '<tr><td>'.$i.'-'.($i + 1).'</td>';
                                    foreach ($code2[$i] as $t) {
                                        echo '<td>'.$t.'</td>';
                                    }
                                    echo '</tr>';
                                }?>
                            </tbody>
                        </table>
                    </div>

                    <h2 style="margin-top:2em">Individuals Caught by Year & State</h2>
                    <div class="table-responsive big">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>State</th>
                                    <?foreach ($states as $v) {
                                        echo '<th>'.convertState($v, 1).'</th>';
                                    }?>
                                </tr>
                            </thead>
                            <tbody>
                                <?for($i = date('Y') - 1; $i >= 2009; $i--) {
                                    $cols = '';
                                    foreach ($states as $s) {
                                        $cols .= '<td>'.($stateStats[$i][$s]['caught'] ? $stateStats[$i][$s]['caught'] : 0).'</td>';
                                    }

                                    echo '<tr><td>'.$i.'-'.($i+1).'</td>'.$cols.'</tr>';
                                }?>
                            </tbody>
                        </table>
                    </div>

                    <h2 style="margin-top:2em">Individuals Killed by Year & State</h2>
                    <div class="table-responsive big">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>State</th>
                                    <?foreach ($states as $v) {
                                        echo '<th>'.convertState($v, 1).'</th>';
                                    }?>
                                </tr>
                            </thead>
                            <tbody>
                                <?for($i = date('Y') - 1; $i >= 2009; $i--) {
                                    $cols = '';
                                    foreach ($states as $s) {
                                        $cols .= '<td>'.($stateStats[$i][$s]['killed'] ? $stateStats[$i][$s]['killed'] : 0).'</td>';
                                    }

                                    echo '<tr><td>'.$i.'-'.($i+1).'</td>'.$cols.'</tr>';
                                }?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    <? } else {
        $where = '';
        $params = str_replace('page=admin&method=avalanches', '', $_SERVER['QUERY_STRING']);

        if ($params) {
            $where = 'WHERE';
            $where .= isset($_GET['activity']) && $_GET['activity'] != '' ? " activity = '$_GET[activity]' AND " : '';
            $where .= isset($_GET['state']) && $_GET['state'] != '' ? " state = '$_GET[state]' AND " : '';
            $where .= isset($_GET['start']) && $_GET['start'] != '' ? " occurred >= " . strtotime($_GET['start'] . ' 00:00:00') . " AND " : '';
            $where .= isset($_GET['end']) && $_GET['end'] != '' ? " occurred <= " . strtotime($_GET['end'] . ' 23:59:59') . " AND " : '';
            $where .= $_GET['caught'] == 'true' ? " caught > 0 AND " : '';
            $where .= $_GET['involved'] == 'true' ? " involved > 0 AND " : '';
            $where .= $_GET['killed'] == 'true' ? " killed > 0 AND " : '';

            $where = substr($where, 0, -5);
        }

        $rowsPerPage = 50;
        $totalRows = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS totalRows FROM avalanche $where"))['totalRows'];
        $totalPages = ceil($totalRows / $rowsPerPage);

        $currentPage = isset($_GET['results']) ? $_GET['results'] : 1;
        $offset = ($currentPage - 1) * $rowsPerPage;
        $pagination = new Pagination($currentPage, $totalPages, $rowsPerPage);

        $sort = isset($_GET['sort']) && $_GET['sort'] != '' ? $_GET['sort'] : 'occurred';
        $order = isset($_GET['order']) && $_GET['order'] != '' ? $_GET['order'] : 'DESC';

        $sql = mysqli_query($con, "SELECT id, state, season, type, occurred, activity, location, involved, caught, killed FROM avalanche $where ORDER BY $sort $order LIMIT $offset, $rowsPerPage");
        while ($row = mysqli_fetch_assoc($sql)) {
            $season = $row['season'].'-'.substr($row['season'] + 1, 2);
            $rows .= "<tr" . ($row['killed'] > 0 ? ' style="color:red"' : '') . " onclick=\"window.location.href='avalanches/report?id=$row[id]'\">" .
                "<td>" . ucwords(strtolower($statesArray[$row['state']])) . "</td><td>" . ucfirst($row['type']) . "</td><td>$season</td><td>" . date('n/j/Y g:i A', $row['occurred']) .
                "</td><td>" . ($row['activity'] ? $row['activity'] : 'None') . "</td><td>$row[location]</td>" .
                "<td>$row[involved]</td><td>$row[caught]</td><td>$row[killed]</td></tr>";
        }
    ?>
        <div class="row">
            <div class="col">
                <div class="card">
                    <h1>Avalanche Accidents</h1>

                    <div class="controls">
                        <form action="" method="get" style="align-items:flex-end">
                            <div>
                                <label>Start Date</label><!--0830-->
                                <input type="date" style="max-width:130px" class="input" name="start" min="2009-12-10" value="<?= isset($_GET['start']) ? $_GET['start'] : '' ?>" max="<?= date('Y-m-d', strtotime('-2 days')) ?>">
                            </div>

                            <div>
                                <label>End Date</label>
                                <input type="date" style="max-width:130px" class="input" name="end" min="2009-12-10" value="<?= isset($_GET['end']) ? $_GET['end'] : '' ?>" max="<?= date('Y-m-d', strtotime('-1 day')) ?>">
                            </div>
                            <select name="activity" class="input" style="max-width:235px">
                                <option value="">- All Activities -</option>
                                <? foreach ($activities as $v) {
                                    echo '<option ' . ($_GET['activity'] == $v ? 'selected ' : '') . 'value="' . $v . '">' . $v . '</option>';
                                } ?>
                            </select>

                            <select name="state" class="input" style="max-width:190px">
                                <option value="">- All States -</option>
                                <? foreach ($states as $k) {
                                    echo '<option ' . ($_GET['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($statesArray[$k])) . '</option>';
                                } ?>
                            </select>

                            <div class="checkbox">
                                <input type="checkbox" id="inv" name="involved" value="true" <?= $_GET['involved'] == 'true' ? ' checked' : '' ?>>
                                <label for="inv">Involved</label>
                            </div>

                            <div class="checkbox">
                                <input type="checkbox" id="cau" name="caught" value="true" <?= $_GET['caught'] == 'true' ? ' checked' : '' ?>>
                                <label for="cau">Caught</label>
                            </div>

                            <div class="checkbox">
                                <input type="checkbox" id="kil" name="killed" value="true" <?= $_GET['killed'] == 'true' ? ' checked' : '' ?>>
                                <label for="kil">Killed</label>
                            </div>

                            <input type="submit" class="btn btn-blue" value="Search">
                            <div class="btn-group">
                                <input type="button" class="btn btn-gray" value="Clear" onclick="window.location.href='../admin/avalanches'">
                                <input type="button" class="btn btn-yellow" value="Avy Stats" onclick="window.location.href='../admin/avalanches/stats'">
                            </div>
                        </form>
                    </div>

                    <?= $pagination->showing($totalRows) ?>

                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th onclick="window.location.href='?sort=state&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">State</th>
                                    <th onclick="window.location.href='?sort=type&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">Type</th>
                                    <th onclick="window.location.href='?sort=season&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Season</th>
                                    <th onclick="window.location.href='?sort=occurred&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Occurred</th>
                                    <th onclick="window.location.href='?sort=activity&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">Activity</th>
                                    <th onclick="window.location.href='?sort=location&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">Location</th>
                                    <th onclick="window.location.href='?sort=involved&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Involved</th>
                                    <th onclick="window.location.href='?sort=caught&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Caught</th>
                                    <th onclick="window.location.href='?sort=killed&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Killed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?= $rows ?>
                            </tbody>
                        </table>
                    </div>

                    <?= $pagination->links() ?>
                </div>
            </div>
        </div>
        </div>
<? }
} ?>