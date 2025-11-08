<?
$noMysql = true;
require_once '../db.ini.php';
require_once '../apis/functions.inc.php';

function fireStatus($v) {
    if ($v == null || $v == '') {
        $s = 'active';
    } else {
        if ($v->Out) {
            $s = 'out';
        }

        if ($v->Contain) {
            $s = 'contained';
        }

        if ($v->Control) {
            $s = 'controlled';
        }
    }

    return $s;
}

function acres($a) {
    if ($a == '' || $a == 'Unknown') {
        return 'Unknown';
    } else {
        return number_format($a, 1);
    }
}

if (isset($_GET['fires'])) {
    $query = implode(',', $_GET['fires']);
} else {
    $query = 'all,new';
}

$json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/wildfires/'.$query.'?key=50e2c43f8f63ff0ed20127ee2487f15e'));

$count = 0;
foreach ($json->features as $fire) {
    $p = $fire->properties;
    $inc[] = array('name' => incidentName($p->name, $p->incidentId, $p->type), 'type' => $p->type, 'state' => ucwords(convertState($p->state, 1)),
        'acres' => (is_numeric($p->acres) ? $p->acres : -1), 'status' => fireStatus($p->status), 'url' => str_replace('wildfire/', 'fires/', $p->url),
        'near' => explode(' of ', $p->near)[1], 'time' => $p->time->discovered);

    if ($count >= 200) {
        break;
    }
    
    $count++;
}
$acres = array_column($inc, 'acres');
array_multisort($inc, SORT_NUMERIC, $acres);
$inc = array_reverse($inc);

$title = 'Current List of US Wildfires';
include_once '../header.inc.php';
?>

<section>
    <div class="container">

    <form style="display:inline-flex;gap:1em;align-items:center;justify-content:center;width:100%;margin-bottom:1em">
        <div class="checkbox">
            <input type="checkbox" id="all" name="fires[]" value="all"<?=!isset($_GET['fires']) || $_GET['fires'] && in_array('all', $_GET['fires']) ? ' checked' : ''?>>
            <label for="all">All Fires</label>
        </div>
        <div class="checkbox">
            <input type="checkbox" id="new" name="fires[]" value="new"<?=!isset($_GET['fires']) || $_GET['fires'] && in_array('new', $_GET['fires']) ? ' checked' : ''?>>
            <label for="new">New Fires</label>
        </div>
        <div class="checkbox">
            <input type="checkbox" id="smk" name="fires[]" value="smk"<?=$_GET['fires'] && in_array('smk', $_GET['fires']) ? ' checked' : ''?>>
            <label for="smk">Smoke Checks</label>
        </div>
        <div class="checkbox">
            <input type="checkbox" id="rx" name="fires[]" value="rx"<?=$_GET['fires'] && in_array('rx', $_GET['fires']) ? ' checked' : ''?>>
            <label for="rx">Prescribed Burns</label>
        </div>
        <input type="submit" class="btn btn-blue" style="margin:0" value="Search">
    </form>

    <table class="minimal">
        <thead>
            <tr>
                <th class="n">Name</th>
                <th>Type</th>
                <th>State</th>
                <th>Size</th>
                <th>Status</th>
                <th>Reported</th>
            </tr>
        </thead>
        <tbody>
        <?foreach($inc as $fire){
            $name = $fire['name'].($fire['type'] != 'Prescribed Fire' ? ' Fire' : '');
            ?>
            <tr onclick="window.location.href='<?=$fire['url']?>'" title="<?=$name?> near <?=$fire['near']?>">
                <td class="n"><?=$name?></td>
                <td><?=$fire['type']?></td>
                <td><?=$fire['state']?></td>
                <td><?=$fire['acres'] < 0 ? $fire['acres'] : number_format($fire['acres'])?> acres</td>
                <td><span class="status <?=$fire['status']?>"><?=ucfirst($fire['status'])?></span></td>
                <td><?=time() - $fire['time'] > 60 * 60 * 24 * 2 ? date('M j, Y', $fire['time']) : ago($fire['time'])?></td>
            </tr>
        <?}?>    
        </tbody>
    </table>
        
    </div>
</section>

<?
include_once '../footer.inc.php';
?>