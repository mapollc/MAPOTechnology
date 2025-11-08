<?
if (!$permission->fire()->edit()) {
    echo invalidPermissions();
} else {
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT w.*, d.agency AS jurisdiction, d.area AS jurisdiction_unit, c.name AS center_name FROM wildfires AS w LEFT JOIN dispatch_centers AS c ON c.agency LIKE w.agency OR c.agency LIKE CONCAT(SUBSTRING(w.agency, 1, 2), '-', SUBSTRING(w.agency, 3, 5)) LEFT JOIN dispatch_zones AS d ON d.unit = SUBSTRING_INDEX(SUBSTRING_INDEX(incidentID, '-', -2), '-', 1) WHERE wfid = '$_GET[wfid]'"));

    if (!$row) {
        echo errorCode('Wildfire Not Found', 'The wildfire incident you are searching for does not exist.');
    } else {
?>
        <h1 class="category">Edit Incident: <?= incidentName($row['name'], $row['incidentID'], $row['type']) . ' (' . $row['incidentID']  . ')' ?></h1>

        <form action="" method="post">
            <input type="hidden" name="wfid" value="<?= $row['wfid'] ?>">

            <table class="table" style="min-width:unset">
                <tbody>
                    <?
                    $count = 0;
                    foreach ($row as $k => $v) {
                        if ($k != 'jurisdiction_unit' && $k != 'center_name' && $k != 'display' && $k != 'lon' && $k != 'incidentNumOnly') {
                            $label = ucfirst($k);
                            $value = $v;

                            if ($k == 'incidentID') {
                                $label = 'Incident ID';
                            } else if ($k == 'wfid') {
                                $label = 'WFID';
                            } else if ($k == 'lat') {
                                $label = 'Coordinates';
                            }

                            if ($k == 'date' || $k == 'captured' || $k == 'updated') {
                                $value = date('l, F j, Y g:i A T', $v);
                            } else if ($k == 'state') {
                                $value = convertState($v, 1);
                            } else if ($k === 'agency') {
                                $value = '<a href="../dispatch/edit?agency=' . $row['agency'] . '">' . $row['agency'] . '</a>' . ($row['center_name'] ? ' &mdash; ' . $row['center_name'] : '');
                            } else if ($k == 'jurisdiction') {
                                $value = $row['jurisdiction'] ? $row['jurisdiction'] . ($row['jurisdiction_unit'] ? ' &mdash; ' . $row['jurisdiction_unit'] : '') : 'N/A';
                            } else if ($k == 'status') {
                                $status = '';

                                if ($v != '') {
                                    $stat = unserialize($v);

                                    foreach ($stat as $n => $t) {
                                        $status .= $n . ': ' . date('n/j/Y H:i', $t) . '<br>';
                                    }

                                    $value = substr($status, 0, -4);
                                } else {
                                    $value = '';
                                }
                            } else if ($k == 'acres') {
                                $value = '<input type="text" class="field" style="display:inline-block;max-width:94px" name="acres" placeholder="0" value="' . size($row['acres']) . '"> acres';
                            } else if ($k == 'lat') {
                                $value = '<a target="blank" href="https://www.mapofire.com/#6/' . $row['lat'] . '/' . $row['lon'] . '">' . $row['lat'] . ', ' . $row['lon'] . '</a>';
                            }

                            if ($value) {
                                echo '<tr><td style="font-weight:bold' . ($count == 0 ? ';border-top:1px solid #ededed' : '') . '">' . $label . '</td>' .
                                    '<td style="' . ($count == 0 ? 'border-top:1px solid #ededed' : '') . '">' . $value . '</td></tr>';
                                $count++;
                            }
                        }
                    } ?>
                    <tr>
                        <td style="font-weight:bold">Display on Map</td>
                        <td>
                            <div class="radio" style="margin:0">
                                <input type="radio" id="d1" name="display" value="1" <?= ($row['display'] == 1 ? ' checked' : '') ?>><label for="d1">Yes</label>
                            </div>
                            <div class="radio" style="margin:0">
                                <input type="radio" id="d2" name="display" value="0" <?= ($row['display'] != 1 ? ' checked' : '') ?>><label for="d2">No</label>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!--<div class="rows">
                <div class="row align-center">
                    <div class="col w17 label">WFID</div>
                    <div class="col w83"><?= $row['wfid'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Year</div>
                    <div class="col w83"><?= $row['year'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Incident ID</div>
                    <div class="col w83"><?= $row['incidentID'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">State</div>
                    <div class="col w83"><?= convertState($row['state'], 1) ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Type</div>
                    <div class="col w83"><?= $row['type'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Name</div>
                    <div class="col w83"><?= $row['name'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Discovered</div>
                    <div class="col w83"><?= date('l, F j, Y g:i A T', $row['date']) ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Dispatch</div>
                    <div class="col w83"><a href="../dispatch/edit?agency=<?= $row['agency'] ?>"><?= $row['agency'] ?></a><?= $row['center_name'] ? ' &mdash; ' . $row['center_name'] : '' ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Jurisdiction</div>
                    <div class="col w83"><?= ($row['jurisdiction'] ? $row['jurisdiction'] . ($row['jurisdiction_unit'] ? ' &mdash; ' . $row['jurisdiction_unit'] : '') : '') ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Coordinates</div>
                    <div class="col w83"><a target="blank" href="https://www.mapofire.com/#13/<?= $row['lat'] . '/' . $row['lon'] ?>"><?= $row['lat'] . ', ' . $row['lon'] ?></a></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Location</div>
                    <div class="col w83"><?= $row['geo'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Size</div>
                    <div class="col w83"><input type="text" class="field" style="display:inline-block;max-width:94px" name="acres" placeholder="0" value="<?= ($row['acres'] != '' && $row['acres'] != 'Unknown' ? number_format($row['acres']) : 'Unknown') ?>"> acres</div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Notes</div>
                    <div class="col w83"><?= $row['notes'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Resources</div>
                    <div class="col w83"><?= $row['resources'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Fuels</div>
                    <div class="col w83"><?= $row['fuels'] ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Updated</div>
                    <div class="col w83"><?= ago($row['updated']) ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Captured</div>
                    <div class="col w83"><?= date('l, F j, Y g:i A T', $row['captured']) ?></div>
                </div>
                <div class="row align-center">
                    <div class="col w17 label">Timezone</div>
                    <div class="col w83"><?= $row['timezone'] ?></div>
                </div>
            </div>

            <label style="margin-top:15px">Display on Map</label>
            <div class="radio">
                <input type="radio" id="d1" name="display" value="1" <?= ($row['display'] == 1 ? ' checked' : '') ?>><label for="d1">Yes</label>
            </div>
            <div class="radio">
                <input type="radio" id="d2" name="display" value="0" <?= ($row['display'] != 1 ? ' checked' : '') ?>><label for="d2">No</label>
            </div>
            <div class="clear"></div>-->

            <div class="btn-group">
                <input type="submit" class="btn btn-green" name="action" value="Save Changes">
                <input type="button" class="btn" value="Go Back" onclick="window.location.href='../wildfires'">
            </div>
        </form>
        </div>
<? }
} ?>