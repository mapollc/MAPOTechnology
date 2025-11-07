<?
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211);

$caches = [
    'dms_status' => 'ODOT VMS',
    'odot_incidents' => 'ODOT Incidents',
    'odot_incidents_rw' => 'ODOT Incidents (Road Work)',
    'road_weather' => 'ODOT Road & Weather (1237) Reports',
    'odot_webcams' => 'ODOT Roadside Cameras',
    'api-fires_new' => 'Wildfire API: New',
    'api-fires_all' => 'Wildfire API: All',
    'api-fires_smk' => 'Wildfire API: Smoke Checks',
    'api-fires_rx' => 'Wildfire API: RX Burns',
    'api-fires_all,new' => 'Wildfire API: New & All',
    'api-fires_all,new,smk' => 'Wildfire API: New, Smoke Checks & All',
    'events' => 'Top Fires for Map of Fire'
];

$files = [
    '/home/mapo/public_html/cron/cache/rwis.json' => 'ODOT RWIS'
];

foreach ($files as $name => $desc) {
    $status[] = [$name, $desc, filemtime($name)]; 
}

foreach ($caches as $name => $desc) {
    $cache = $memcache->get("$name-time");
    
    if ($cache) {
        $status[] = [$name, $desc, $cache];    
    } else {
        $cache2 = $memcache->get($name.'_time');

        if ($cache2) {
            $status[] = [$name, $desc, $cache];    
        }
    }
}

$memcache->quit();
?>
<div class="row">
    <div class="col">
        <div class="card">
            <h1>Services Cache Status</h1>

            <ul>
            <?foreach($status as $item) {
                echo "<li><b>$item[1]:</b> " . ($item[2] > time() ? 'Expires in ' . until($item[2]) : 'Last updated ' . ago($item[2])).'</li>';
            }?>
            </ul>
        </div>
    </div>
</div>