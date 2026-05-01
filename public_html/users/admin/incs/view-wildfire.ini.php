<?
if (isset($_GET['unit']) && $_GET['unit'] != '') {
    $juris = mysqli_fetch_assoc(mysqli_query($con, "SELECT agency, unit, area FROM dispatch_zones WHERE unit = '$_GET[unit]' LIMIT 1"));
    $unit = $juris['unit'] . ': ' . $juris['agency'] . ($juris['area'] ? ' / ' . $juris['area'] : '');
}

$addtl = ($_GET['q'] != '' ? 'q=' . $_GET['q'] . '&' : '') .
    ($_GET['unit'] != '' ? 'unit=' . $_GET['unit'] . '&' : '') .
    ($_GET['state'] != '' ? 'state=' . $_GET['state'] . '&' : '');
?>
<h1>Wildfire Management<?= $function == 'duplicates' ? ': Duplicates' : '' ?></h1>

<div class="controls">
    <form action="" id="searchFires" method="get" style="align-items:flex-end">
        <? if ($_GET['sort']) {
            echo '<input type="hidden" name="sort" value="' . $_GET['sort'] . '">';
        }
        if ($_GET['order']) {
            echo '<input type="hidden" name="order" value="' . $_GET['order'] . '">';
        } ?>

        <input type="text" class="input" style="max-width:300px" name="q" placeholder="Search incidents..." value="<?= $_GET['q'] ?: '' ?>">

        <? if ($function != 'duplicates') { ?>
            <div>
                <label>Start Date</label>
                <input type="date" style="max-width:130px" class="input" name="start" min="2010-01-01"
                    value="<?= $_GET['start'] ?? date('Y') . '-01-01' ?>" max="<?= date('Y-m-d') ?>">
            </div>

            <div>
                <label>End Date</label>
                <input type="date" style="max-width:130px" class="input" name="end" min="2010-01-01"
                    value="<?= $_GET['end'] ?? date('Y-m-d') ?>" max="<?= date('Y-m-d') ?>">
            </div>

        <? } ?>

        <select name="type" class="input" style="max-width:175px">
            <option value="">All Types</option>
            <option <?= $_GET['type'] != '' ? 'selected ' : '' ?>value="Wildfire">Wildfire</option>
            <option <?= $_GET['type'] == 'Smoke Check' ? 'selected ' : '' ?>value="Smoke Check">Smoke Check</option>
            <option <?= $_GET['type'] == 'Prescribed Fire' ? 'selected ' : '' ?>value="Prescribed Fire">RX Burn</option>
            <option <?= $_GET['type'] == 'Complex' ? 'selected ' : '' ?>value="Complex">Complex</option>
        </select>

        <select name="state[]" class="input" multiple size="3" style="max-width:190px">
            <option <?= !isset($_GET['state']) ? 'selected ' : '' ?>value="">All States</option>
            <? foreach ($statesArray as $k => $v) {
                echo '<option ' . (isset($_GET['state']) && in_array($k, $_GET['state']) ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
            } ?>
        </select>
        <select name="dispatch" class="input" style="max-width:210px">
            <option value="">All Dispatch Centers</option>
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
    </form>
</div>


<p id="resultsNum" style="min-height:21px;font-size:14px;padding:0"></p>

<? if ($function == 'duplicates') {
    echo '<span style="color:red">Rows marked in red are suggestions to hide from the map</span>';
} ?>

<div class="table-responsive">
    <table class="table" id="listOfFires" data-edit="<?= $permission->fire()->edit() ?>">
        <thead class="sortable">
            <tr>
                <th class="sortTable" data-url="sort=incidentID&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Incident #</th>
                <th class="sortTable" data-url="sort=state&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">State</th>
                <th class="sortTable" data-url="sort=type&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Type</th>
                <th class="sortTable" data-url="sort=name&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Incident Name</th>
                <th class="sortTable" data-url="sort=date&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? "&$queryParams" : '') ?>">Discovery Date</th>
                <th class="sortTable" data-url="sort=acres&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? "&$queryParams" : '') ?>">Acres</th>
                <th class="sortTable" data-url="sort=updated&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? "&$queryParams" : '') ?>">Last Update</th>
                <th>Displayed</th>
                <th>Origin</th>
                <th>&nbsp;</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>

<div class="pagination">
    <div></div>
</div>