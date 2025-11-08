<?
#$year = isset($_GET['year']) ? $_GET['year'] : date('Y');
if (isset($_GET['start']) && isset($_GET['end'])) {
    $start = strtotime($_GET['start'].' 00:00:00');
    $end = strtotime($_GET['end'].' 23:59:59');
} else {
    $start = strtotime('1/1/'.date('Y').' 00:00:00');
    $end = time();
}

$when = "(date >= $start AND date <= $end)";

$where = isset($_GET['q']) && $_GET['q'] != '' ? ' AND (name LIKE \'%' . $_GET['q'] . '%\' OR incidentID LIKE \'%' . $_GET['q'] . '%\')' : '';
$where .= isset($_GET['type']) && $_GET['type'] != '' ? ' AND type = \'' . $_GET['type'] . '\'' : '';
//$where .= isset($_GET['state']) && $_GET['state'] != '' ? ' AND state = \'' . $_GET['state'] . '\'' : '';
$where .= isset($_GET['unit']) && $_GET['unit'] != '' ? ' AND incidentID LIKE \'%' . $_GET['unit'] . '%\'' : '';
$where .= isset($_GET['dispatch']) && $_GET['dispatch'] != '' ? ' AND agency = \'' . $_GET['dispatch'] . '\'' : '';
$where .= isset($_GET['display']) && $_GET['display'] != '' ? ' AND display = \'' . ($_GET['display'] == 'yes' ? 1 : 0) . '\'' : '';

if (isset($_GET['state']) && is_array($_GET['state']) && !empty($_GET['state'][0])) {
    foreach ($_GET['state'] as $state) {
        $states .= "state = '$state' OR ";
    }

    $where .= " AND (".substr($states, 0, -4).")";
}

$rowsPerPage = 100;

if ($function == 'duplicates') {
    $year = date('Y');
    $where = preg_replace('/AND\s([a-z]+)\s=\s/m', 'AND t1.$1 = ', str_replace(['AND display = \'1\'', 'AND display = \'0\''], ['', ''], $where)) . ' AND date > ' . strtotime('-1 week');
    //$query = "SELECT t1.* FROM wildfires t1 JOIN (SELECT state, name FROM wildfires WHERE year = $year AND display = 1 GROUP BY state, name HAVING COUNT(*) > 1) t2 ON t1.state = t2.state AND t1.name = t2.name WHERE t1.year = $year AND t1.display = 1 $where ORDER BY state ASC, name ASC, acres DESC";
    //$query = "SELECT t1.* FROM wildfires t1 JOIN (SELECT state, name, MAX(date) as max_date FROM wildfires WHERE year = $year AND display = 1 GROUP BY state, name HAVING COUNT(*) > 1) t2 ON t1.state = t2.state AND t1.name = t2.name WHERE t1.year = $year AND t1.display = 1 $where ORDER BY t1.state ASC, t1.name ASC, t1.acres DESC";
    $query = "SELECT t1.* FROM wildfires t1 JOIN (SELECT state, name, MAX(date) as max_date FROM wildfires WHERE $when AND display = 1 GROUP BY state, name HAVING COUNT(*) > 1) t2 ON t1.state = t2.state AND t1.name = t2.name WHERE t1.year = $year AND t1.display = 1 $where ORDER BY t1.state ASC, t1.name ASC, t1.acres DESC";
    
    $sql = mysqli_query($con, $query);
    $totalRows = mysqli_num_rows($sql);

    $totalPages = ceil($totalRows / $rowsPerPage);

    $currentPage = isset($_GET['results']) ? $_GET['results'] : 1;
    $offset = ($currentPage - 1) * $rowsPerPage;
    $query .= " LIMIT $offset, $rowsPerPage";
    $pagination = new Pagination($currentPage, $totalPages);
} else {
    $query = "SELECT wfid, agency, incidentID, type, state, name, year, date, acres, updated, display, owner FROM wildfires WHERE $when $where AND display IS NOT NULL ORDER BY " . (isset($_GET['sort']) ? ($_GET['sort'] == 'acres' ? 'CAST(acres AS float)' : $_GET['sort']) . ' ' . $_GET['order'] : (!isset($_GET['q']) || (isset($_GET['q']) && $_GET['q'] == '') ? "date DESC" : "CAST(acres AS float) DESC"));

    $totalRows = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS totalRows FROM wildfires WHERE $when $where AND display IS NOT NULL"))['totalRows'];
    $totalPages = ceil($totalRows / $rowsPerPage);

    $currentPage = isset($_GET['results']) ? $_GET['results'] : 1;
    $offset = ($currentPage - 1) * $rowsPerPage;
    $query .= " LIMIT $offset, $rowsPerPage";
    $pagination = new Pagination($currentPage, $totalPages);

    $sql = mysqli_query($con, $query);
}

if (isset($_GET['unit']) && $_GET['unit'] != '') {
    $juris = mysqli_fetch_assoc(mysqli_query($con, "SELECT agency, unit, area FROM dispatch_zones WHERE unit = '$_GET[unit]' LIMIT 1"));
    $unit = $juris['unit'] . ': ' . $juris['agency'] . ($juris['area'] ? ' / ' . $juris['area'] : '');
}

$addtl = ($_GET['q'] != '' ? 'q=' . $_GET['q'] . '&' : '') . ($_GET['unit'] != '' ? 'unit=' . $_GET['unit'] . '&' : '') . ($_GET['state'] != '' ? 'state=' . $_GET['state'] . '&' : '');
?>
<h1>Wildfire Management<?= $function == 'duplicates' ? ': Duplicates' : '' ?></h1>

<div class="controls">
    <form action="" method="get" style="align-items:flex-end">
        <? if ($_GET['sort']) {
            echo '<input type="hidden" name="sort" value="' . $_GET['sort'] . '">';
        }
        if ($_GET['order']) {
            echo '<input type="hidden" name="order" value="' . $_GET['order'] . '">';
        } ?>

        <input type="text" class="input" style="max-width:300px" name="q" placeholder="Search incidents..." value="<?= $_GET['q'] ? $_GET['q'] : '' ?>">

        <? if ($function != 'duplicates') { ?>
            <!--<select name="year" class="input" style="max-width:100px">
                <option>- Year -</option>
                <? for ($i = date('Y'); $i >= 2014; $i--) {
                    echo '<option ' . ($year == $i ? 'selected ' : '') . 'value="' . $i . '">' . $i . '</option>';
                } ?>
            </select>-->
            <div>
                <label>Start Date</label><!--0830-->
                <input type="date" style="max-width:130px" class="input" name="start" min="2010-01-01" value="<?= isset($_GET['start']) ? $_GET['start'] : date('Y').'-01-01' ?>" max="<?= date('Y-m-d') ?>">
            </div>

            <div>
                <label>End Date</label>
                <input type="date" style="max-width:130px" class="input" name="end" min="2010-01-01" value="<?= isset($_GET['end']) ? $_GET['end'] : date('Y-m-d') ?>" max="<?= date('Y-m-d') ?>">
            </div>

        <? } ?>

        <select name="type" class="input" style="max-width:175px">
            <option value="">All Types</option>
            <option <?= $_GET['type'] != '' ? 'selected ' : '' ?>value="Wildfire">Wildfire</option>
            <option <?= $_GET['type'] == 'Smoke Check' ? 'selected ' : '' ?>value="Smoke Check">Smoke Check</option>
            <option <?= $_GET['type'] == 'Complex' ? 'selected ' : '' ?>value="Complex">Complex</option>
        </select>

        <select name="state[]" class="input" multiple size="3" style="max-width:190px">
            <option <?=!isset($_GET['state']) ? 'selected ' : ''?>value="">All States</option>
            <? foreach ($statesArray as $k => $v) {
                echo '<option ' . (isset($_GET['state']) && in_array($k, $_GET['state']) ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
            } ?>
        </select>
        <select name="dispatch" class="input" style="max-width:210px">
            <option value="">All Dispatches</option>
            <? foreach ($newDispatchCenters as $c) {
                echo '<option ' . ($_GET['dispatch'] == $c ? 'selected ' : '') . 'value="' . $c . '">' . $c . '</option>';
            } ?>
        </select>

        <? if ($function != 'duplicates') { ?>
            <select name="display" class="input" style="max-width:134px">
                <option <?= $_GET['display'] != 'no' ? 'selected ' : '' ?>value="yes">Shown on map</option>
                <option <?= $_GET['display'] == 'no' ? 'selected ' : '' ?>value="no">Hidden on map</option>
            </select>
        <? } ?>

        <div style="position:relative">
            <input type="hidden" name="unit" value="<?= $_GET['unit'] ?>">
            <input type="text" class="input" id="q" style="width:350px" autocomplete="off" value="<?= $unit ?>" placeholder="Search by jurisdiction...">
            <div class="search-results"></div>
        </div>

        <input type="submit" class="btn btn-blue" value="Search">
        <input type="button" onclick="window.location.href='wildfires'" class="btn btn-gray" value="Clear">
        <a href="wildfires/controls" class="btn btn-yellow">Additional Controls</a>
        <!--<div class="btn-group">
            <a class="btn btn-light-blue" href="<?= $linkURL ?>admin/wildfires?cache=clear">Clear API Cache</a>
            <? if ($function != 'duplicates') { ?><a class="btn btn-red" href="<?= $linkURL ?>admin/wildfires/duplicates">See Duplicates</a><? } ?>
            <a class="btn btn-yellow" href="<?= $linkURL ?>admin/wildfires/log">Acres History</a>
            <? if ($permission->fire()->add()) { ?><a class="btn btn-green" href="<?= $linkURL ?>admin/wildfires/create">Create New Incident</a><? } ?>
            <a href="<?= $linkURL ?>admin/wildfires/stats">Statistics</a>
        </div>-->
    </form>
</div>

<?= $pagination->showing($totalRows) ?>

<? if ($function == 'duplicates') {
    echo '<span style="color:red">Rows marked in red are suggestions to hide from the map</span>';
} ?>

<div class="table-responsive">
    <table class="table">
        <thead class="sortable">
            <tr>
                <th onclick="window.location.href='?sort=incidentID&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">Incident #</th>
                <th onclick="window.location.href='?sort=state&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">State</th>
                <th onclick="window.location.href='?sort=name&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">Incident Name</th>
                <th onclick="window.location.href='?sort=date&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Discovery Date</th>
                <th onclick="window.location.href='?sort=type&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? '&' . $queryParams : '') ?>'">Type</th>
                <th onclick="window.location.href='?sort=acres&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Acres</th>
                <th onclick="window.location.href='?sort=updated&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? '&' . $queryParams : '') ?>'">Last Update</th>
                <th>Displayed</th>
                <th>&nbsp;</th>
            </tr>
        </thead>
        <tbody>
            <? while ($row = mysqli_fetch_assoc($sql)) {
                $show_fire = true;
                //$show_fire = $row['year'] != date('Y') ? 1 : wildfireAlgorithm('all', $row['type'], unserialize($row['status']), $row, 0);
                if ($show_fire) {
                    //$crit = $row['state'].$row['name'] == $lastName && ($lastAcres || !$row['acres']) && $lastID == substr($row['incidentID'], -3) ? true : false;
                    $is_duplicate = is_duplicate_fire($row, $last_fire);
            ?>
                    <tr<?= !$function && $row['display'] != '1' ? ' style="color:red"' : ($function == 'duplicates' && $is_duplicate ? ' style="color:red"' : '') ?>>
                        <td><?= $row['incidentID'] ?></td>
                        <td><?= $row['state'] ?></td>
                        <td><?= incidentName($row['name'], $row['incidentID'], $row['type']) . ($row['type'] != 'Smoke Check' ? ' Fire' : '') ?></td>
                        <td><?= time() - $row['date'] > 86400 ? date('n/j/Y H:i', $row['date']) : ago($row['date']) ?></td>
                        <td><?= $row['type'] ?></td>
                        <td><?= size($row['acres']) ?></td>
                        <td><?= ago($row['updated']) ?></td>
                        <td><?= $row['display'] == '1' ? 'Yes' : 'No' ?></td>
                        <td><? if ($permission->fire()->edit()) { ?>
                                <a style="font-weight:400!important" href="<?= $linkURL ?>admin/wildfires/<?= $row['owner'] == 'mapo' ? 'modify' : 'edit' ?>?wfid=<?= $row['wfid'] ?>">edit</a>
                            <? if ($function == 'duplicates') {
                                    echo ' | <a href="#" class="hidefrommap" data-wfid="' . $row['wfid'] . '" onclick="return false">hide</a>';
                                }
                            } ?>
                        </td>
                        </tr>
                <? }
                /*$lastID = substr($row['incidentID'], -3);
                $lastName = $row['state'].$row['name'];
                $lastAcres = $row['acres'];*/
                $last_fire = $row;
            } ?>

        </tbody>
    </table>
</div>

<?= $pagination->links() ?>