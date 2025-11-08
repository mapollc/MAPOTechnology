<?
function versionDate($matches) {
    $version = $matches[1];
    $date = date('F j, Y', strtotime($matches[2].' 00:00:00 '.date('T')));

    return "<p style=\"font-weight:400\"><b style=\"font-weight:500\">$version</b> &mdash; Released $date</p>";
}

function android() {
    $file = file_get_contents('https://docs.google.com/document/d/e/2PACX-1vTg47sHjMbOHAOJRNoY2v71qhawpk0hFQBh8W5RdW5_7b2NDGyYK7mUQx9Udy4piOZxXR6uxXpVmc1F/pub');

    preg_match('/Map of Fire: Android Change Log<\/span><\/p>(.*)<\/div>/', $file, $a);
    $b = preg_replace('/<span class="[a-z0-9\s]+"><a class="[a-z0-9\s]+" href="(.*?)">(.*?)<\/a><\/span>/', '', $a[1]);
    $c = str_replace('</div>', '', preg_replace('/<p class="[a-z0-9\s]+">(<span class="[a-z0-9\s]+"><\/span>)?<\/p>/', '', $b));
    
    return preg_replace_callback('/<p class="[a-z0-9\s]+"><span class="[a-zA-z0-9\s]+">(v[\.0-9]+)\s-\s([\d\/]+)<\/span><\/p>/', 'versionDate', $c);
}

function getChanges() {
    global $log;
    $content = '';

    usort($log, function ($a, $b) {
        $date1 = strtotime($a['date'].' 00:00:00 PDT');
        $date2 = strtotime($b['date'].' 00:00:00 PDT');

        return $date2 <=> $date1;
    });

    foreach ($log as $change) {
        $lis = '';
        foreach ($change['changes'] as $li) {
            $lis .= '<li>' . $li . '</li>';
        }

        $content .= '<p style="font-weight:400"><b style="font-weight:500">v' . $change['version'] . '</b> &mdash; Released ' . date('F j, Y', strtotime($change['date'].' 00:00:00 PDT')) . '</p>';
        $content .= '<ul>' . $lis . '</ul>';
    }

    return $content;
}

$log[] = ['version' => '2.4', 'date' => '10/1/2025', 'changes' => [
'Numerous bug and performance fixes',
'Integrated subscriptions into the platform',
'Migrated from Mapbox to Maplibre',
'Fixed issues with dark mode compatability'
]];
$log[] = ['version' => '2.3', 'date' => '6/15/2025', 'changes' => [
'Numerous bug fixes',
'Added clustering to MODIS hotspots for better map visibility',
'Incorporated Canadian wildfires and wildfire perimeters',
'Numerous code improvements and rewrites for speed and efficiency',
'Updates to GIS database',
'Moved "dark mode" setting to user account (only available for users that have accounts)',
'Bug fixes when in dark mode',
'Added a new layer called "PNW Evacuation Vulnerability"',
'Made minor UI changes to evacuation polygons',
'UI changes to map settings menu',
'Added detailed RAWS fire weather information to weather stations',
'Improvements made to incident weather concerns',
'Added a new fire weather forecast feature to see fire weather at a clicked location',
'Smoke forecasts can now be viewed up to 13 hours for the current time instead of just the next hour\'s forecast',
'Fixed issues with navigation menu when screen size changes',
'Fixed issue with determining icons caused by failed expressions within Mapbox',
'Updated Mapbox SDK to v3.12.0'
]];
$log[] = ['version' => '2.2.250523', 'date' => '5/23/2025', 'changes' => ['Fixed issues with map search when searching for GIS (eg: lakes, peaks, etc)']];
$log[] = ['version' => '2.2.250509', 'date' => '5/9/2025', 'changes' => ['Several bug & performance fixes', 'Minor UI changes']];
$log[] = ['version' => '2.2.250425', 'date' => '4/25/2025', 'changes' => ['Fixed issues with map search when searching for states']];

$title = 'Map of Fire - Release Notes';
include_once '../header.inc.php';
?>

<section>
    <div class="container">
        <h2>Android App</h2>

        <?echo android()?>

        <h2>Web/Browser</h2>

        <?echo getChanges()?>

    </div>
</section>

<?include_once '../footer.inc.php'?>