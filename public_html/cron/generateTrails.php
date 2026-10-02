<?
set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$scriptStart = microtime(true);

$tileName = 'trails';
$geojsonDirectory = '/home/mapo/public_html/mapotrails.com/data/geojson';
$baseURL = '/home/mapo/public_html/mapotrails.com/data/maps/tiles';

$minTileZoom = 9;
$maxTileZoom = 18;
$useCompression = true;

$tileDirectory = "$baseURL/$tileName";
$tempTileDirectory = "$baseURL/$tileName-new";

// -----------------------------------------------------------------------------
// Runtime
// -----------------------------------------------------------------------------

function scriptTime($scriptStart)
{
    $scriptDuration = microtime(true) - $scriptStart;

    return 'Total runtime: ' . sprintf('(%.2f seconds)' . PHP_EOL, $scriptDuration);
}

// -----------------------------------------------------------------------------
// Find GeoJSON files
// -----------------------------------------------------------------------------

echo "Finding trail GeoJSON files...\n";

$files = glob("$geojsonDirectory/*.geojson");

$files = array_values(array_filter(
    $files,
    fn($file) => ctype_digit(pathinfo($file, PATHINFO_FILENAME))
));

if (!$files) {
    throw new RuntimeException("No numeric GeoJSON files found in $geojsonDirectory");
}

sort($files, SORT_NATURAL);

echo 'GeoJSON files found: ' . count($files) . PHP_EOL;

// -----------------------------------------------------------------------------
// Prepare Tippecanoe output directory
// -----------------------------------------------------------------------------

echo "Preparing tile directory...\n";

if (is_dir($tempTileDirectory)) {
    echo "Removing previous temporary tile directory...\n";

    exec(
        'rm -rf ' . escapeshellarg($tempTileDirectory),
        $output,
        $returnCode
    );

    if ($returnCode !== 0) {
        throw new RuntimeException(
            'Unable to remove previous temporary tile directory.'
        );
    }
}

if (!mkdir($tempTileDirectory, 0755, true)) {
    throw new RuntimeException("Unable to create $tempTileDirectory");
}

// -----------------------------------------------------------------------------
// Build Tippecanoe input list
// -----------------------------------------------------------------------------

echo "Preparing GeoJSON input list...\n";

$inputs = implode(
    ' ',
    array_map('escapeshellarg', $files)
);

// -----------------------------------------------------------------------------
// Generate vector tiles
// -----------------------------------------------------------------------------

echo scriptTime($scriptStart);
echo "Generating vector tiles...\n";

$compression = $useCompression ? '' : '--no-tile-compression';

$tippecanoeCommand =
    '/usr/local/bin/tippecanoe ' .
    '-e ' . escapeshellarg($tempTileDirectory) . ' ' .
    '-f ' .
    '-s EPSG:4326 ' .
    "-Z$minTileZoom " .
    "-z$maxTileZoom " .
    "-l " . escapeshellarg($tileName) . ' ' .
    $compression . ' ' .
    '--detect-shared-borders';

echo "$tippecanoeCommand\n";

exec(
    "$tippecanoeCommand $inputs 2>&1",
    $output,
    $returnCode
);

foreach ($output as $line) {
    echo "$line\n";
}

if ($returnCode !== 0) {
    echo "Tippecanoe failed. Existing tiles were NOT changed.\n";

    exec('rm -rf ' . escapeshellarg($tempTileDirectory));

    exit(1);
}

echo "Tippecanoe completed successfully.\n";
echo scriptTime($scriptStart);

// -----------------------------------------------------------------------------
// Set tile ownership
// -----------------------------------------------------------------------------

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

// Remove old backup if one exists.
if (is_dir($backupTileDirectory)) {
    echo "Removing previous tile backup...\n";

    exec(
        'rm -rf ' . escapeshellarg($backupTileDirectory),
        $output,
        $returnCode
    );

    if ($returnCode !== 0) {
        throw new RuntimeException('Unable to remove old tile backup.');
    }
}

// Move current tiles out of the way.
if (is_dir($tileDirectory)) {
    echo "Moving existing tiles to backup...\n";

    if (!rename($tileDirectory, $backupTileDirectory)) {
        throw new RuntimeException('Unable to move existing tile directory.');
    }
}

// Move new tiles into production.
echo "Installing new tiles...\n";

if (!rename($tempTileDirectory, $tileDirectory)) {
    // Restore existing tiles if installation fails.
    if (is_dir($backupTileDirectory)) {
        rename($backupTileDirectory, $tileDirectory);
    }

    throw new RuntimeException('Unable to install new tile directory.');
}

// Remove backup after successful installation.
if (is_dir($backupTileDirectory)) {
    echo "Removing old tile backup...\n";

    exec('rm -rf ' . escapeshellarg($backupTileDirectory));
}

echo "Vector tiles successfully updated.\n";
echo "Tile directory: $tileDirectory\n";
echo scriptTime($scriptStart);



/*$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
include_once '/home/mapo/public_html/apis/functions.inc.php';

function trailColor($m)
{
    $colors = ['cb2626', '40d740', 'ff973a', 'ebeb2e', 'f977dd', '6daee3', '9873f0', 'ff8298', '698d65', '009688', '3949ab', '880e4f'];

    return '#' . match ($m) {
        'Snowmobile' => 'ff0000',
        'Tour' => '0058aa',
        'Ski Line' => '13ff2f',
        'Gravel' => '747474',
        'ATV Track' => '00ffff',
        'Road' => '000',
        'Single Track' => $colors[array_rand($colors)],
        default => '000'
    };
}

function calculateDistance($pointA, $pointB)
{
    $lat1 = (float) $pointA['lat'];
    $lon1 = (float) $pointA['lon'];
    $lat2 = (float) $pointB['lat'];
    $lon2 = (float) $pointB['lon'];

    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = max(-1, min(1, $dist));
    $dist = rad2deg(acos($dist));

    return $dist * 60 * 1.1515 * 5280;
}

function gpxToGeoJson($file)
{
    $prevElev = 0;
    $xml = simplexml_load_file("/home/mapo/public_html/mapotrails.com/data/gpx/$file", 'SimpleXMLElement', LIBXML_NOCDATA);

    if ($xml === false) {
        return null;
    }

    $point = $xml->xpath('//*[local-name()="trkpt"]');

    if (!$point) {
        return null;
    }

    $count = count($point);

    $coords = [];
    $lat = [];
    $lon = [];
    $elevations = [];
    $slopes = [];

    $start = [
        (float) $point[0]['lat'],
        (float) $point[0]['lon']
    ];
    $end = [
        (float) $point[$count - 1]['lat'],
        (float) $point[$count - 1]['lon']
    ];

    $dist = $gain = $loss = 0;

    for ($x = 0; $x < $count; $x++) {
        $elev = (float) $point[$x]->ele * 3.281;

        $elevations[] = $elev;
        $lat[] = (float) $point[$x]['lat'];
        $lon[] = (float) $point[$x]['lon'];
        $coords[] = [
            (float) $point[$x]['lon'],
            (float) $point[$x]['lat']
        ];

        if ($x > 0) {
            $j = $x - 1;
            $distance = calculateDistance($point[$x], $point[$j]);

            if (!is_nan($distance)) {
                $dist += $distance;
            }

            // Calculate the elevation gain/loss
            if ($elev >= $prevElev) {
                $gain += $elev - $prevElev;
            } else if ($elev < $prevElev) {
                $loss += $elev - $prevElev;
            }

            // Calculate slope only when the segment has a measurable horizontal distance
            if ($distance > 0) {
                $slope = round((($elev - $prevElev) / $distance) * 100, 1);

                if (is_finite($slope)) {
                    $slopes[] = $slope;
                }
            }
        }

        $prevElev = $elev;
    }

    $stats = [
        'geo' => [
            'start' => $start,
            'end' => $end
        ],
        'bounds' => [
            'sw' => [
                $lon ? min($lon) : 0,
                $lat ? min($lat) : 0
            ],
            'ne' => [
                $lon ? max($lon) : 0,
                $lat ? max($lat) : 0
            ]
        ],
        'elevation' => [
            'min' => $elevations ? min($elevations) : 0,
            'max' => $elevations ? max($elevations) : 0
        ],
        'altitude' => [
            'gain' => $gain ?? 0,
            'loss' => $loss ?? 0
        ],
        'slope' => [
            'min' => $slopes ? min($slopes) : null,
            'avg' => $slopes ? round(array_sum(array_map('abs', $slopes)) / count($slopes), 1) : null,
            'max' => $slopes ? max($slopes) : null
        ],
        'distance' => round($dist / 5280, 3)
    ];

    return [
        'coords' => $coords,
        'stats' => $stats
    ];
}

$result = mysqli_query($con2, "SELECT t.id, t.title, t.type, term, keywords, stats, premium, public
        FROM trails t
        LEFT JOIN categories c ON c.trail_id = t.id
        LEFT JOIN stats s ON s.trail_id = t.id
        WHERE t.id IS NOT NULL
        ORDER BY t.id ASC");

while ($row = mysqli_fetch_assoc($result)) {
    echo "====== Starting on trail ID # $row[id] ======" . PHP_EOL;

    $data = mysqli_query($con2, "SELECT id, filename, mode, caption, delta, display FROM gpx WHERE trail_id = $row[id] ORDER BY delta ASC");

    $feats = [];

    echo "====== Working through list of GPX files ======" . PHP_EOL;
    while ($gpx = mysqli_fetch_assoc($data)) {
        if (empty($gpx) || $gpx['filename'] == '' || !file_exists("/home/mapo/public_html/mapotrails.com/data/gpx/{$gpx['filename']}")) continue;

        $collect = gpxToGeoJson($gpx['filename']);

        if ($collect == null) continue;

        if ($gpx['delta'] == 0) {
            $new = json_encode($collect['stats']);
            $time = time();
            mysqli_query($con2, "UPDATE stats SET stats = '$new', calculated = $time WHERE trail_id = $row[id]");
        }

        $prop = [
            'trail_id' => (int) $row['id'],
            'id' => (int) $gpx['id'],
            'title' => $row['title'],
            'type' => $row['type'],
            'color' => trailColor($gpx['mode']),
            'url' => guideUrl($row['title'], $row['type'], $row['id']),
            'delta' => $gpx['delta'],
            'term' => json_decode($row['term']),
            'keywords' => json_decode($row['keywords']),
            'mode' => $gpx['mode'],
            'caption' => $gpx['caption'],
            'stats' => $collect['stats'],
            'premium' => $row['premium'],
            'public' => $row['public'],
            'display' => $gpx['display'],
        ];

        $feats[] = [
            'id' => (int) $gpx['id'],
            'type' => 'Feature',
            'geometry' => [
                'type' => 'LineString',
                'coordinates' => $collect['coords']
            ],
            'properties' => $prop
        ];
    }

    echo "...... Parse trail ID # $row[id] ......" . PHP_EOL;

    if ($feats && count($feats) > 0) {
        $geojson = [
            'type' => 'FeatureCollection',
            'features' => $feats
        ];

        $output = json_encode($geojson);
        ////echo $output;

        echo "...... Saving trail ID # $row[id] ......" . PHP_EOL;

        $saveFile = "/home/mapo/public_html/mapotrails.com/data/geojson/{$row['id']}.geojson";

        file_put_contents($saveFile, $output);
        chown($saveFile, 'mapo');
        chgrp($saveFile, 'mapo');
    } else {
        echo "...... DID NOT save trail ID # $row[id] ......" . PHP_EOL;
    }
}

mysqli_close($con2);*/