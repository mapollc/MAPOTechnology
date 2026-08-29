<?
/*
 * Perimeters → Vector Tiles
 *
 * Pipeline:
 *   ArcGIS Feature Service
 *        ↓
 *   /var/mapo/data/perimeters/current.geojson
 *        ↓
 *   Tippecanoe
 *        ↓
 *   /home/mapo/public_html/mapofire.com/data/maps/tiles
 */

set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$scriptStart = microtime(true);

$arcgisUrl = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query';
$tileName = 'perimeters';
$geojsonFile = "/home/mapo/tmp/$tileName/current.geojson";
$baseURL = '/home/mapo/public_html/mapofire.com/data/maps/tiles';

$minTileZoom = 5;
$maxTileZoom = 14;
$useCompression = true;

$tileDirectory = "$baseURL/$tileName";
$tempTileDirectory = "$baseURL/$tileName-new";

$recordsPerPage = 500;

// -----------------------------------------------------------------------------
// Run the amount of time that's passed between function innvocation and script start time
// -----------------------------------------------------------------------------

function scriptTime($scriptStart) {
    $scriptDuration = microtime(true) - $scriptStart;
    return "Total runtime: " . sprintf(" (%.2f seconds)\n", $scriptDuration);
}

// -----------------------------------------------------------------------------
// ArcGIS request
// -----------------------------------------------------------------------------

function arcgisRequest(array $params): object
{
    global $arcgisUrl;

    // Added: build the query string with http_build_query()
    // instead of maintaining a manually encoded URL.
    $url = "$arcgisUrl?" . http_build_query($params);

    $context = stream_context_create([
        'http' => [
            'timeout' => 120,
            'ignore_errors' => true
        ]
    ]);

    $error = null;

    set_error_handler(function ($severity, $message) use (&$error) {
        $error = $message;
    });

    $response = file_get_contents($url, false, $context);

    restore_error_handler();

    if ($response === false) {
        throw new RuntimeException('Unable to retrieve data from ArcGIS: ' . ($error ?? 'unknown error'));
    }

    $data = json_decode($response);

    if (!is_object($data)) {
        throw new RuntimeException('ArcGIS returned invalid JSON.');
    }

    if (isset($data->error)) {
        throw new RuntimeException('ArcGIS error: ' . json_encode($data->error, JSON_PRETTY_PRINT));
    }

    return $data;
}

// -----------------------------------------------------------------------------
// ArcGIS query parameters
// -----------------------------------------------------------------------------

// Refactored: keep the WHERE clause in one place.
$year = date('Y');
$where = "(attr_FireDiscoveryDateTime >= DATE '$year-01-01 00:00:00' AND
    attr_FireDiscoveryDateTime <= DATE '$year-12-31 23:59:59') AND
    attr_FireOutDateTime IS NULL";

// Refactored: keep the requested fields in one place.
$outFields = implode(',', [
    'OBJECTID',
    'attr_UniqueFireIdentifier',
    'poly_IncidentName',
    'attr_IncidentName',
    'poly_DateCurrent',
    'poly_GISAcres',
    'poly_Acres_AutoCalc',
    'poly_MapMethod',
    'attr_POOState',
    'attr_ContainmentDateTime',
    'attr_PercentContained',
    'attr_FireOutDateTime'
]);

// -----------------------------------------------------------------------------
// Get feature count
// -----------------------------------------------------------------------------

echo "Getting ArcGIS feature count...\n";

$countResponse = arcgisRequest([
    'where' => $where,
    'returnCountOnly' => 'true',
    'f' => 'json'
]);

if (!isset($countResponse->count)) {
    throw new RuntimeException('ArcGIS did not return a feature count.');
}

$totalFeatures = (int) $countResponse->count;

echo "ArcGIS features: {$totalFeatures}\n";

// -----------------------------------------------------------------------------
// Download features
// -----------------------------------------------------------------------------

$features = [];
$pages = max((int) ceil($totalFeatures / $recordsPerPage), 1);

echo "Pages: {$pages}\n";

for ($page = 0; $page < $pages; $page++) {
    $offset = $page * $recordsPerPage;

    echo sprintf(
        "Downloading page %d of %d (offset %d)...\n",
        $page + 1,
        $pages,
        $offset
    );

    $response = arcgisRequest([
        'where' => $where,
        'outFields' => $outFields,
        'returnGeometry' => 'true',
        'geometryPrecision' => 5,
        'outSR' => 4326,
        'orderByFields' => 'OBJECTID ASC',
        'resultOffset' => $offset,
        'resultRecordCount' => $recordsPerPage,
        'returnExceededLimitFeatures' => 'true',
        'returnExceededLimitGeometries' => 'true',
        'f' => 'geojson'
    ]);

    if (!isset($response->features) || !is_array($response->features)) {
        throw new RuntimeException("ArcGIS returned no features for offset {$offset}.");
    }

    $pageCount = count($response->features);

    echo "  Received {$pageCount} features\n";

    // Added: append this page to the complete feature collection.
    foreach ($response->features as $feature) {
        $features[] = $feature;
    }
}

// -----------------------------------------------------------------------------
// Validate download
// -----------------------------------------------------------------------------

// the ArcGIS dataset can change while we are downloading it, so don't require the final count to exactly match the initial count.
$downloadedFeatures = count($features);

if ($downloadedFeatures === 0 && $totalFeatures > 0) {
    throw new RuntimeException("ArcGIS download failed. Expected {$totalFeatures} features but received 0.");
}

echo "------------------" . PHP_EOL . "Total features downloaded: {$downloadedFeatures}\n";

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