<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

include_once '../db.ini.php';


/*$states = ['AL'=>'ALABAMA', 'AK'=>'ALASKA', 'AZ'=>'ARIZONA', 'AR'=>'ARKANSAS', 'CA'=>'CALIFORNIA', 'CO'=>'COLORADO', 'CT'=>'CONNECTICUT', 'DE'=>'DELAWARE', 'DC'=>'DISTRICT OF COLUMBIA', 'FL'=>'FLORIDA', 'GA'=>'GEORGIA', 'HI'=>'HAWAII', 'ID'=>'IDAHO', 'IL'=>'ILLINOIS', 'IN'=>'INDIANA', 'IA'=>'IOWA', 'KS'=>'KANSAS', 'KY'=>'KENTUCKY', 'LA'=>'LOUISIANA', 'ME'=>'MAINE', 'MD'=>'MARYLAND', 'MA'=>'MASSACHUSETTS', 'MI'=>'MICHIGAN', 'MN'=>'MINNESOTA', 'MS'=>'MISSISSIPPI', 'MO'=>'MISSOURI', 'MT'=>'MONTANA', 'NE'=>'NEBRASKA', 'NV'=>'NEVADA', 'NH'=>'NEW HAMPSHIRE', 'NJ'=>'NEW JERSEY', 'NM'=>'NEW MEXICO', 'NY'=>'NEW YORK', 'NC'=>'NORTH CAROLINA', 'ND'=>'NORTH DAKOTA', 'OH'=>'OHIO', 'OK'=>'OKLAHOMA', 'OR'=>'OREGON', 'PA'=>'PENNSYLVANIA', 'RI'=>'RHODE ISLAND', 'SC'=>'SOUTH CAROLINA', 'SD'=>'SOUTH DAKOTA', 'TN'=>'TENNESSEE', 'TX'=>'TEXAS', 'UT'=>'UTAH', 'VT'=>'VERMONT', 'VA'=>'VIRGINIA', 'WA'=>'WASHINGTON', 'WV'=>'WEST VIRGINIA', 'WI'=>'WISCONSIN', 'WY'=>'WYOMING'];
////$states = ['OR'];

function getClass($type)
{
    $gis = array(
        array('class' => '', 'type' => 'Airport'),
        array('class' => 'place', 'type' => 'Arch'),
        array('class' => 'topo', 'type' => 'Area'),
        array('class' => 'water', 'type' => 'Arroyo'),
        array('class' => 'topo', 'type' => 'Bar'),
        array('class' => 'topo', 'type' => 'Basin'),
        array('class' => 'water', 'type' => 'Bay'),
        array('class' => 'topo', 'type' => 'Beach'),
        array('class' => 'topo', 'type' => 'Bench'),
        array('class' => 'topo', 'type' => 'Bend'),
        array('class' => 'place', 'type' => 'Bridge'),
        array('class' => 'place', 'type' => 'Building'),
        array('class' => 'water', 'type' => 'Canal'),
        array('class' => 'topo', 'type' => 'Cape'),
        array('class' => '', 'type' => 'Cemetery'),
        array('class' => 'place', 'type' => 'Census'),
        array('class' => 'water', 'type' => 'Channel'),
        array('class' => '', 'type' => 'Church'),
        array('class' => '', 'type' => 'Civil'),
        array('class' => 'topo', 'type' => 'Cliff'),
        array('class' => 'topo', 'type' => 'Crater'),
        array('class' => 'topo', 'type' => 'Crossing'),
        array('class' => 'place', 'type' => 'Dam'),
        array('class' => 'water', 'type' => 'Falls'),
        array('class' => 'oceanic', 'type' => 'Flat'),
        array('class' => 'topo', 'type' => 'Forest'),
        array('class' => 'topo', 'type' => 'Gap'),
        array('class' => 'water', 'type' => 'Glacier'),
        array('class' => 'water', 'type' => 'Gut'),
        array('class' => 'water', 'type' => 'Harbor'),
        array('class' => '', 'type' => 'Hospital'),
        array('class' => 'topo', 'type' => 'Island'),
        array('class' => 'topo', 'type' => 'Isthmus'),
        array('class' => 'water', 'type' => 'Lake'),
        array('class' => 'topo', 'type' => 'Lava'),
        array('class' => 'water', 'type' => 'Levee'),
        array('class' => 'place', 'type' => 'Locale'),
        array('class' => 'place', 'type' => 'Military'),
        array('class' => 'place', 'type' => 'Mine'),
        array('class' => 'place', 'type' => 'Oilfield'),
        array('class' => 'topo', 'type' => 'Park'),
        array('class' => 'landmark', 'type' => 'Pillar'),
        array('class' => 'place', 'type' => 'Place'),
        array('class' => 'topo', 'type' => 'Plain'),
        array('class' => '', 'type' => 'Populated Place'),
        array('class' => 'place', 'type' => 'Post Office'),
        array('class' => 'topo', 'type' => 'Range'),
        array('class' => 'water', 'type' => 'Rapids'),
        array('class' => 'topo', 'type' => 'Reserve'),
        array('class' => 'water', 'type' => 'Reservoir'),
        array('class' => 'topo', 'type' => 'Ridge'),
        array('class' => 'water', 'type' => 'River'),
        array('class' => '', 'type' => 'School'),
        array('class' => 'water', 'type' => 'Sea'),
        array('class' => 'topo', 'type' => 'Slope'),
        array('class' => 'water', 'type' => 'Spring'),
        array('class' => 'water', 'type' => 'Stream'),
        array('class' => 'topo', 'type' => 'Summit'),
        array('class' => 'water', 'type' => 'Swamp'),
        array('class' => 'place', 'type' => 'Tower'),
        array('class' => 'topo', 'type' => 'Trail'),
        array('class' => 'place', 'type' => 'Tunnel'),
        array('class' => 'topo', 'type' => 'Valley'),
        array('class' => 'water', 'type' => 'Well'),
        array('class' => 'topo', 'type' => 'Wilderness'),
        array('class' => 'topo', 'type' => 'Woods')
    );

    foreach ($gis as $i) {
        if ($i['type'] == $type) return $i['class'];
    }
    return '';
}

//feature_id|feature_name|feature_class|state_name|state_numeric|county_name|county_numeric|map_name|date_created|date_edited|bgn_type|
//bgn_authority|bgn_date|prim_lat_dms|prim_long_dms|prim_lat_dec|prim_long_dec|source_lat_dms|source_long_dms|source_lat_dec|source_long_dec

//   0        1        2     3    4   5    6      7          8          9        10          11           12         31     14        15          16      17 18  19  20
//1139658|China Cap|Summit|Oregon|41|Union|061|China Cap|11/28/1980|07/17/2020|Official|Board Decision|01/01/1967|450920N|1173037W|45.1555979|-117.5102584| |  |0.0|0.0

foreach ($states as $state => $name) {
    $allValues = [];
    $updated = time();
    $file = file_get_contents('./cache/gis/' . $state . '.txt');
    $rows = array_values(array_filter(preg_split('/\r|\n/', $file)));

    for ($i = 1; $i < count($rows); $i++) {
    //for ($i = 2; $i < 4; $i++) {
        $cols = explode('|', $rows[$i]);
        #print_r($cols);
        $county = mysqli_real_escape_string($con, $cols[5]);
        $fips = mysqli_real_escape_string($con, $cols[4] . $cols[6]);
        $type = mysqli_real_escape_string($con, $cols[2]);
        $class = mysqli_real_escape_string($con, getClass($type));
        $name = mysqli_real_escape_string($con, $cols[1]);
        $place = mysqli_real_escape_string($con, $cols[7]);
        $lat = mysqli_real_escape_string($con, $cols[15]);
        $lon = mysqli_real_escape_string($con, $cols[16]);

        $allValues[] = "('$state', '$fips', '$county', '$class', '$type', '$name', '$place', '$lat', '$lon', '$updated')";
    }

    $chunks = array_chunk($allValues, 500);

    foreach ($chunks as $chunk) {
        $sql = "INSERT INTO gis 
        (state, fips, county, class, type, name, place, lat, lon, updated)
        VALUES " . implode(',', $chunk) . "
        ON DUPLICATE KEY UPDATE
            state = VALUES(state),
            fips = VALUES(fips),
            county = VALUES(county),
            class = VALUES(class),
            type = VALUES(type),
            name = VALUES(name),
            place = VALUES(place),
            lat = VALUES(lat),
            lon = VALUES(lon);";

        if (!mysqli_multi_query($con, $sql)) {
            echo "Error: " . mysqli_error($con) . "\n";
        } else {
            // Clear results if using multi_query
            while (mysqli_more_results($con) && mysqli_next_result($con)) {;
            }
        }
    }

    echo 'Done processing '. $state . '...
';
}

/*foreach ($states as $state => $name) {
    $zipUrl = "https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_" . $state . "_Text.zip";
    $localZip = "/home/mapo/public_html/cron/cache/gis/DomesticNames_" . $state . "_Text.zip";

    file_put_contents($localZip, file_get_contents($zipUrl));
    $extractPath = '/home/mapo/public_html/cron/cache/gis/' . $state;

    if (!is_dir($extractPath)) {
        mkdir($extractPath, 0777, true);
    }

    $zip = new ZipArchive();
    if ($zip->open($localZip) === true) {
        $zip->extractTo($extractPath);
        $zip->close();
        echo "ZIP extracted successfully to $extractPath";
    } else {
        echo "Failed to open ZIP file.";
    }

    echo 'Done with state: ' . $state . '
';
}*/