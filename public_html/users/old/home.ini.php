<?
$pageTitle = 'User Dashboard';

$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
$wh = strtotime('-3 months');
$sql = mysqli_query($con2, "SELECT id, title, author, updated FROM trails WHERE updated >= $wh ORDER BY updated DESC");
$me = mysqli_query($con2, "SELECT * FROM userMapUploads WHERE uid = '$_SESSION[uid]' ORDER BY created DESC") or die(mysqli_error($con2));
while($row = mysqli_fetch_assoc($me)){
    $files[] = $row;
}
mysqli_close($con2);

$cad = str_replace(' ago', '', ago(mysqli_fetch_assoc(mysqli_query($con, "SELECT cad_update FROM dispatch_centers ORDER BY cad_update DESC LIMIT 1"))['cad_update']));
$count = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS c FROM wildfires"))['c'];
?>

<div class="row">
    <div class="col w-4">
        <div class="card">
            <h1>Hello, <?= $_SESSION['first_name'] ?></h1>
            <p style="line-height:1.5">Thanks for being a user of our services. You can manage your account, change map settings, and more using this dashboard.</p>
            
            <div class="user-type">
                <span>
                    <i class="fas fa-user"></i>
                    <i class="fas fa-badge-check"<?=(getUserRole($_SESSION['role']) != 'PREMIUM' && getUserRole($_SESSION['role']) != 'ADMIN' ? ' style="opacity:0.15"' : '')?>></i>
                    <i class="fas fa-lock"<?=($_SESSION['role'] != 'ADMIN' ? ' style="opacity:0.15"' : '')?>></i>
                </span>
                <p>You are a<?=(getUserRole($_SESSION['role']) == 'ADMIN' ? 'n' : '').' <b style="color:var(--red)">'.str_replace('GUEST', 'PUBLIC', getUserRole($_SESSION['role']))?></b> user</p>
            </div>
        </div>

        <div class="card">
            <h1 class="category">Trending Fires</h1>

            <span class="help">These are the trending wildfires people are checking right now.</span>

            <div class="table-responsive" style="margin-top:0">
                <table class="table" id="trending">
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Name</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="3" style="text-align:center">
                                <div class="spinner" style="width:40px;height:40px"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col w-8">
        <div class="card">
            <h1 class="category">Wildfires Near You</h1>

            <span class="help" id="nearyoudesc">These are all the wildfire incidents located within 50 miles of you.</span>

            <div class="table-responsive" style="margin-top:0">
                <table class="table" id="nearyou">
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="4" style="text-align:center">
                                <div class="spinner" style="width:40px;height:40px"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h1 class="category">Wildfires You Follow</h1>

            <span class="help">These are the wildfires you are currently following on Map-o-Fire.</span>

            <div class="table-responsive" style="margin-top:0">
                <table class="table" id="followedfires">
                    <thead>
                        <tr>
                            <th>State</th>
                            <th>Name</th>
                            <th>Acres</th>
                            <th>Location</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="4" style="text-align:center">
                                <div class="spinner" style="width:40px;height:40px"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?/*<div class="row">
            <div class="col w-4">
                <div class="card stat">
                    <h3 class="category">Total Fires</h3>
                    <div>
                        <i class="far fa-tally"></i>
                        <div id="totalFires">0<span>fires</span></div>
                    </div>
                </div>
            </div>
            <div class="col w-4">
                <div class="card stat">
                    <h3 class="category">Fire Data Refreshed</h3>
                    <div>
                        <i class="far fa-timer"></i>
                        <div><?= explode(', ', $cad)[0] ?><?= ($cad != 'Just now' ? '<span>ago</span>' : '') ?></div>
                    </div>
                </div>
            </div>
            <div class="col w-4">
                <div class="card stat">
                    <h3 class="category">Lifetime Fire Count</h3>
                    <div>
                        <i class="fas fa-database"></i>
                        <div><?= number_format($count) ?><span>fires</span></div>
                    </div>
                </div>
            </div>
        </div>*/ ?>

<div class="row">
    <div class="col w-6">
        <div class="card">
            <h1 class="category">Your Favorite Trails</h1>

            <span class="help">These are your favorite trails on Map-o-Trails.</span>

            <div class="table-responsive" style="margin-top:0">
                <table class="table" id="favTrails">
                    <thead>
                        <tr>
                            <th>Trail</th>
                            <th>Distance</th>
                            <th>Max. Altitude</th>
                            <th>Total Elev. Gain</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="4" style="text-align:center">
                                <div class="spinner" style="width:40px;height:40px"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col w-6">
        <div class="card">
            <h1 class="category">Uploaded GIS</h1>

            <span class="help">Any GIS-related waypoints, polygons, or tracks you've uploaded</span>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?foreach ($files as $row){?>
                        <tr>
                            <td><a target="blank" href="https://cdn.mapotrails.com/userGIS/<?=$row['file']?>"><?=$row['fileName']?></a></td>
                            <td><?=$row['type']?></td>
                            <td><?=($row['size'] > 1000000 ? round($row['size'] * 0.000001, 1).' M' : round($row['size'] * 0.001, 1).' K')?>B</td>
                            <td><?=date('M j, Y - g:i A', $row['created'])?></td>
                        </tr>
                        <?}?>
                    </tbody>
                </table>
            </div>
        </div>
        <?if($user['permissions']['trails']['edit']['all'] == 1 || $user['permissions']['trails']['edit']['own'] == 1){?>
            <div class="card">
                <h1 class="category">Recently Edited Trails</h1>

                <span class="help">Recently edited trails in the last 3 months</span>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Trail</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        <?while($row = mysqli_fetch_assoc($sql)){?>
                        <tr>
                            <td><?=$row['title']?></td>
                            <td><?=ago($row['updated'])?></td>
                            <td><?if($user['permissions']['trails']['edit']['all'] == 1 || ($user['permissions']['trails']['edit']['own'] == 1 && $row['author'] == $user['fullName'])){?>
                                <a href="https://www.mapotechnology.com/account/admin/trails/edit?id=<?=$row['id']?>">edit</a>
                            <?}?></td>
                        </tr>
                        <?}?>
                        </tbody>
                    </table>
                </div>
            </div>
        <?}?>
    </div>
</div>