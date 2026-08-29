<?
ini_set('display_errors', 1);
error_reporting(E_ALL);
set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);

$scriptStart = microtime(true);
$lastSeen = time();

include_once '/home/mapo/public_html/apis/centroid.inc.php';
include_once '/home/mapo/public_html/config.inc.php';

function scriptTime($scriptStart)
{
    $scriptDuration = microtime(true) - $scriptStart;
    return "Total runtime: " . sprintf(" (%.2f seconds)\n", $scriptDuration);
}

function saveToDB($prop, $center)
{
    global $lastSeen;

    executeQuery(
        'isssisddii',
        [$prop['id'], $prop['state'], $prop['county'], $prop['zoneID'], $prop['level'], $prop['notes'], $center[1], $center[0], $prop['updated'], $lastSeen],
        "INSERT INTO 
            evacuations (id, state, county, zoneID, level, notes, lat, lon, updated, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            state = VALUES(state),
            county = VALUES(county),
            zoneID = VALUES(zoneID),
            level = VALUES(level),
            notes = VALUES(notes),
            lat = VALUES(lat),
            lon = VALUES(lon),
            updated = VALUES(updated),
            last_seen = VALUES(last_seen)"
    );
}

function clearOldData($state)
{
    global $lastSeen;
    global $con;

    executeQuery(
        'si',
        [$state, $lastSeen],
        "DELETE FROM evacuations WHERE state = ? AND last_seen < ?"
    );
}

function saveEvacuation($geo, $arr)
{
    global $features;

    $features[] = [
        'type' => 'Feature',
        'id' => $arr['id'],
        'geometry' => $geo,
        'properties' => $arr
    ];

    $arr['id'] = "$arr[id]-center";
    $arr['feature_type'] = 'center';
    $center = polygonLabelPoint($geo);

    if (!$center) return;

    saveToDB($arr, $center);

    $features[] = [
        'type' => 'Feature',
        'id' => $arr['id'],
        'geometry' => [
            'type' => 'Point',
            'coordinates' => $center
        ],
        'properties' => $arr
    ];
}

$tileName = 'evacuations';
$geojsonFile = "/home/mapo/tmp/$tileName/current.geojson";
$baseURL = '/home/mapo/public_html/mapofire.com/data/maps/tiles';

$minTileZoom = 5;
$maxTileZoom = 14;
$useCompression = true;

$tileDirectory = "$baseURL/$tileName";
$tempTileDirectory = "$baseURL/$tileName-new";
$features = [];

echo "========== Starting evacuation process ==========" . PHP_EOL;
echo "*** Getting Oregon evacuations..." . PHP_EOL;

$ore = json_decode(file_get_contents('https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Fire_Evacuation_Areas_Public/FeatureServer/0/query?geometryPrecision=6&outFields=OBJECTID%2CEvac_Area_Name%2CStructuresWithin%2CAddressesWithin%2CPopulationWithin%2CCounty%2CFire_Evacuation_Level%2Clast_edited_date&where=1%3D1&f=geojson'))->features;

if ($ore) {
    for ($i = 0; $i < count($ore); $i++) {
        $e = $ore[$i]->properties;
        $notes = "Evac Zone Name: $e->Evac_Area_Name / Structures: $e->StructuresWithin / Addresses: $e->AddressesWithin / Population: $e->PopulationWithin";
        $updated = round($e->last_edited_date / 1000);

        saveEvacuation($ore[$i]->geometry, [
            'id' => $e->OBJECTID,
            'state' => 'OR',
            'county' => $e->County,
            'level' => $e->Fire_Evacuation_Level,
            'zoneID' => str_replace('US-OR-', '', $e->Evac_Area_Name),
            'notes' => $notes,
            'updated' => $updated
        ]);
    }

    clearOldData('OR');
}

echo "Finished Oregon evacuations..." . PHP_EOL;
echo "*** Getting Washington evacuations..." . PHP_EOL;

$wash = json_decode(file_get_contents(
    'https://wise.wamil.us/bmw/rest/services/Hosted/Evacuation_Zone_Level_View/FeatureServer/5/query?where=status+%3D+%27Active%27&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&units=esriSRUnit_Foot&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&gdbVersion=&historicMoment=&returnDistinctValues=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnZ=false&returnM=false&multipatchOption=xyFootprint&returnTrueCurves=false&returnCentroid=false&timeReferenceUnknownClient=false&sqlFormat=none&lodType=geohash&f=geojson',
    false,
    stream_context_create(
        [
            "ssl" => [
                "verify_peer"      => false,
                "verify_peer_name" => false,
            ],
        ]
    )
));

if ($wash) {
    for ($i = 0; $i < count($wash->features); $i++) {
        $e = $wash->features[$i]->properties;

        $county = trim(str_replace(['County', '_'], ['', ' '], $e->county));
        $level = str_contains(($e->evactype ?? ''), 'Level 3') ? '3' : (str_contains($e->evactype, 'Level 2') ? '2' : '1');

        saveEvacuation($wash->features[$i]->geometry, [
            'id' => $e->objectid,
            'state' => 'WA',
            'county' => $county,
            'level' => $level,
            'zoneID' => '',
            'notes' => $e->incidentna,
            'updated' => round(($e->dateedited ?? $e->date_added ?? 0) / 1000)
        ]);
    }

    clearOldData('WA');
}

echo "Finished Washington evacuations..." . PHP_EOL;
echo "*** Getting California evacuations..." . PHP_EOL;

$cali = json_decode(file_get_contents('https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/CA_EVACUATIONS_CalOESHosted_view/FeatureServer/0/query?geometryPrecision=6&outFields=*&where=1%3D1&f=geojson'))->features;

if ($cali) {
    for ($i = 0; $i < count($cali); $i++) {
        $e = $cali[$i]->properties;
        $level = $e->STATUS == 'Evacuation Order' ? '3' : ($e->STATUS == 'Evacuation Warning' ? '2' : '1');

        saveEvacuation($cali[$i]->geometry, [
            'id' => $e->OBJECTID,
            'state' => 'CA',
            'county' => ucwords(strtolower($e->COUNTY)),
            'level' => $level,
            'zoneID' => str_replace('US-CA-', '', $e->ZONE_ID),
            'notes' => $e->NOTES,
            'updated' => round($e->EditDate / 1000)
        ]);
    }

    clearOldData('CA');
}

// -----------------------------------------------------------------------------
// Write GeoJSON
// -----------------------------------------------------------------------------

$geojsonDirectory = dirname($geojsonFile);

// Added: make sure the source directory exists.
if (!is_dir($geojsonDirectory)) {
    if (!mkdir($geojsonDirectory, 0755, true)) {
        throw new RuntimeException("Unable to create {$geojsonDirectory}");
    }
}

$geojson = [
    'type' => 'FeatureCollection',
    'features' => $features
];

$json = json_encode($geojson, JSON_UNESCAPED_SLASHES);

if ($json === false) {
    throw new RuntimeException('Unable to encode GeoJSON.');
}

// Added: write to a temporary file first so an incomplete
// download can never replace the current GeoJSON.
$tempGeojsonFile = "$geojsonFile.tmp";

if (file_put_contents($tempGeojsonFile, $json) === false) {
    throw new RuntimeException("Unable to write {$tempGeojsonFile}");
}


// Added: atomically replace the current GeoJSON.
if (!rename($tempGeojsonFile, $geojsonFile)) {
    throw new RuntimeException("Unable to replace {$geojsonFile}");
}

echo "GeoJSON saved: {$geojsonFile}\n";

// -----------------------------------------------------------------------------
// Prepare Tippecanoe output directory
// -----------------------------------------------------------------------------

echo "Preparing tile directory...\n";

if (is_dir($tempTileDirectory)) {
    // Added: remove any tiles left over from a previous failed run.
    exec(
        'rm -rf ' . escapeshellarg($tempTileDirectory),
        $output,
        $returnCode
    );

    if ($returnCode !== 0) {
        throw new RuntimeException('Unable to remove previous temporary tile directory.');
    }
}


if (!mkdir($tempTileDirectory, 0755, true)) {
    throw new RuntimeException("Unable to create {$tempTileDirectory}");
}

// -----------------------------------------------------------------------------
// Generate vector tiles
// -----------------------------------------------------------------------------

echo scriptTime($scriptStart) . PHP_EOL;
echo "Generating vector tiles...\n";

// Refactored: run Tippecanoe directly.
// The script is currently executed as root.
$compression = !$useCompression ? '--no-tile-compression' : '';
$tippecanoeCommand = "/usr/local/bin/tippecanoe -e " . escapeshellarg($tempTileDirectory) .
    " -f -s EPSG:4326 -Z$minTileZoom -z$maxTileZoom -l $tileName $compression --detect-shared-borders " . escapeshellarg($geojsonFile);

echo "$tippecanoeCommand\n";

exec("$tippecanoeCommand 2>&1", $output, $returnCode);

foreach ($output as $line) {
    echo "$line\n";
}

if ($returnCode !== 0) {
    echo "Tippecanoe failed. Existing tiles were NOT changed.\n";

    // Added: clean up failed tile generation.
    exec('rm -rf ' . escapeshellarg($tempTileDirectory));

    exit(1);
}

echo "Tippecanoe completed successfully.\n";
echo scriptTime($scriptStart) . PHP_EOL;

// -----------------------------------------------------------------------------
// Set tile ownership
// -----------------------------------------------------------------------------

// Added: generated tiles need to belong to mapo:mapo.
echo "Setting tile ownership...\n";

exec(
    'chown -R mapo:mapo ' . escapeshellarg($tempTileDirectory),
    $output,
    $returnCode
);

if ($returnCode !== 0) {
    throw new RuntimeException('Unable to set tile ownership.');
}

// -----------------------------------------------------------------------------
// Replace live tiles
// -----------------------------------------------------------------------------

$backupTileDirectory = "$tileDirectory-old";

// Added: remove an old backup if one exists.
if (is_dir($backupTileDirectory)) {
    exec('rm -rf ' . escapeshellarg($backupTileDirectory), $output, $returnCode);

    if ($returnCode !== 0) {
        throw new RuntimeException('Unable to remove old tile backup.');
    }
}


// Move the current tiles out of the way.
if (is_dir($tileDirectory)) {
    echo "Moving existing tiles to backup...\n";

    if (!rename($tileDirectory, $backupTileDirectory)) {
        throw new RuntimeException('Unable to move existing tile directory.');
    }
}

// Move the newly generated tiles into production.
echo "Installing new tiles...\n";

if (!rename($tempTileDirectory, $tileDirectory)) {
    // Added: restore the previous tiles if installation fails.
    if (is_dir($backupTileDirectory)) {
        rename($backupTileDirectory, $tileDirectory);
    }

    throw new RuntimeException('Unable to install new tile directory.');
}

// Added: remove the backup after successful installation.
if (is_dir($backupTileDirectory)) {
    exec('rm -rf ' . escapeshellarg($backupTileDirectory));
}

echo "Vector tiles successfully updated.\n";
echo "Tile directory: {$tileDirectory}\n";

echo scriptTime($scriptStart);

mysqli_close($con);
