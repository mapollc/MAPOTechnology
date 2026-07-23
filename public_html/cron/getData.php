<?
$startAPITime = microtime(true);

set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);

class GetData
{
    public $fire;
    public $incidentType;
    private $con;

    public function __construct($con, $fire)
    {
        $this->con = $con;
        $this->fire = $fire;
        $this->incidentType = $fire->type;
    }

    public function year()
    {
        return date('Y', $this->getDate());
    }

    public function getDate()
    {
        return strtotime($this->fire->date);
    }

    public function getIncidentType()
    {
        return $this->incidentType;
    }

    private function ident()
    {
        return json_decode($this->fire->fiscal_data);
    }

    public function getIncNumOnly()
    {
        return str_pad($this->ident()->inc_num, 6, 0, STR_PAD_LEFT);
    }

    public function getIncidentNum()
    {
        $ident = $this->ident();

        return $this->year() . '-' . $ident->wfdssunit . '-' . $this->getIncNumOnly();
    }

    public function getUnit()
    {
        $ident = $this->ident();

        return $ident->wfdssunit;
    }

    private function getLat()
    {
        return $this->fire->latitude;
    }

    private function getLon()
    {
        return str_replace('--', '-', "-" . $this->fire->longitude);
    }

    public function getCoords()
    {
        return [$this->getLat(), $this->getLon()];
    }

    public function getStatus()
    {
        $fireStatus = [];
        $fs = json_decode($this->fire->fire_status);

        // if fire is contained
        if ($fs->contain != null) {
            $fireStatus['Contain'] = strtotime($fs->contain);
        }

        // if fire is controlled
        if ($fs->control != null) {
            $fireStatus['Control'] = strtotime($fs->control);
        }

        // if fire is out
        if ($fs->out != null) {
            $fireStatus['Out'] = strtotime($fs->out);
        }

        return mysqli_real_escape_string($this->con, count($fireStatus) > 0 ? json_encode($fireStatus) : '');
    }

    public function notes()
    {
        return mysqli_real_escape_string($this->con, $this->fire->webComment ?? '');
    }

    public function fuels()
    {
        return mysqli_real_escape_string($this->con, $this->fire->fuels);
    }

    public function resources()
    {
        $r = $this->fire->resources[0] == '' || $this->fire->resources[0] == '*******' ? '' : implode(', ', $this->fire->resources);
        return mysqli_real_escape_string($this->con, $r);
    }
}

/*function cleanup()
{
    $count = 0;

    foreach (['run1', 'run2'] as $path) {
        foreach (scandir("/home/mapo/public_html/cron/cache/$path") as $file) {
            if ($file != '.' && $file != '..') {
                unlink("/home/mapo/public_html/cron/cache/$path/$file");
                $count++;
            }
        }
    }

    return $count > 0 ? true : false;
}*/

function isValidIncident($incidentType, $coords)
{
    return ($incidentType == 'Prescribed Fire' || $incidentType == 'Wildfire' || $incidentType == 'Smoke Check' || $incidentType == 'Smoke check') && ($coords[0] != '' && $coords[1] != '' && $coords[0] != '0' && $coords[1] != '0' && $coords[0] != '-' && $coords[1] != '-') ? true : false;
}

function getAllIncidents($center)
{
    global $con;

    $minTime = strtotime('-12 months');
    $incs = [];
    $sql = mysqli_query($con, "SELECT incidentID, lat, lon, state, geo, near, timezone FROM `wildfires` WHERE date >= $minTime AND agency = '$center'");

    while ($row = mysqli_fetch_assoc($sql)) {
        $incs[$row['incidentID']] = [
            'lat' => (float) $row['lat'],
            'lon' => (float) $row['lon'],
            'state' => $row['state'],
            'geo' => $row['geo'],
            'near' => $row['near'],
            'tz' => $row['timezone']
        ];
    }

    return $incs;
}

require '/home/mapo/public_html/config.inc.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';
include_once '/home/mapo/public_html/cron/dispatch.inc.php';
#$newDispatchCenters = ['ORCOC'];

const CHECK_OLD_DATA = true;
$runQuery = true;
$totalProcessed = 0;
$startTime = microtime(true);

foreach ($newDispatchCenters as $center) {
    $altcenter = substr($center, 0, 2) . '-' . substr($center, 2, strlen($center));
    $center = str_replace('-', '', $center);

    // clear out variables for each center
    $sqlQueries = '';
    $usfsIDs = [];
    $count = 0;
    $existingIncs = getAllIncidents($center);

    // retreive JSON file from cache (or live site if necessary) to get fire data from
    #$json = json_decode(file_get_contents('https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/'.$center.'/incidents'))[0];
    $url = file_get_contents("/home/mapo/public_html/cron/cache/run1/$center.json");
    $url2 = file_get_contents("/home/mapo/public_html/cron/cache/run2/$center.json");

    if ($url) {
        $json = json_decode($url);
        $json2 = json_decode($url2);

        // compare to the previous run of incidents
        $previous = [];

        if ($json2 && !empty($json2->data)) {
            foreach ($json2->data as $item) {
                $id = new GetData($con, $item)->getIncidentNum();
                $previous[$id] = json_encode($item);
            }
        }

        if ($json) {
            // last time the CAD was updated
            $cadLastUpdated = strtotime($json->retrieved) + date('Z');

            // if there is a JSON response from wildcad
            if ($json->data) {
                date_default_timezone_set('America/Los_Angeles');

                // loop through each incident in the API
                for ($i = 0; $i < count($json->data); $i++) {
                    $fire = $json->data[$i];

                    // get data from class
                    $data = new GetData($con, $fire);

                    $date = $data->getDate();
                    $incidentType = $data->getIncidentType();
                    $year = $data->year();
                    $incidentNum = $data->getIncidentNum();
                    $incNumOnly = $data->getIncNumOnly();
                    $incidentUnit = $data->getUnit();

                    $prevfire = $previous[$incidentNum] ?? null;

                    // checks if there has been any new information added or modified for this incident
                    if (CHECK_OLD_DATA && ($previous[$incidentNum] ?? null) === json_encode($fire)) {
                        continue;
                    }

                    $coords = $data->getCoords();

                    // Only proccess data if it is the following types of incidents, there are coordinates, and if the fire is >=50 acres OR the fire is <50 acres and is < 1 month old
                    if (isValidIncident($incidentType, $coords)) {
                        $time = time();
                        $nearArr = [];
                        $state = null;
                        $timezone = null;
                        $getLocation = null;
                        $near = null;

                        // Only process data if we haven't already done this incident ID and the incident ID isn't missing the unit identifier
                        if (!isset($usfsIDs[$incidentNum]) && $year <= date('Y') && !str_contains($incidentNum, '--')) {
                            // if latitude/longitude changed from previous dataset, then we need to geocode the incident
                            $needsGeocoded = !isset($existingIncs[$incidentNum]) ||
                                $existingIncs[$incidentNum]['lat'] !== (float) $coords[0] ||
                                $existingIncs[$incidentNum]['lon'] !== (float) $coords[1];

                            if ($needsGeocoded) {
                                $state = getState($coords);
                                $timezone = getTimezone($coords);
                                $getLocation = getLocation($con, $coords, false, $state);
                                $getCounty = getCounty($con, $coords);
                                $nearArr = $getCounty ?? [
                                    'county' => null,
                                    'fips' => null
                                ];

                                if ($getLocation) {
                                    $nearArr['near'] = $getLocation;
                                }

                                $near = json_encode($nearArr);
                            } else {
                                $state = $existingIncs[$incidentNum]['state'];
                                $timezone = $existingIncs[$incidentNum]['tz'];
                                $getLocation = $existingIncs[$incidentNum]['geo'];
                                $near = $existingIncs[$incidentNum]['near'];
                            }

                            $name = mysqli_real_escape_string($con, incidentName($fire->name, $incidentNum));
                            $incidentType = str_contains($name, ' RX') || substr($name, 0, 5) == ' Burn' ? 'Prescribed Fire' : $incidentType;
                            $acres = $fire->acres;
                            $notes = $data->notes();
                            $fuels = $data->fuels();
                            $resources = $data->resources();
                            $status = $data->getStatus();

                            // if the incident is a smoke check but is reporting an acreage, change the incident type to "wildfire"
                            if ($incidentType == 'Smoke Check' && ($acres != '' && $acres != 'Unknown' && $acres > 0)) {
                                $incidentType = 'Wildfire';
                            }

                            // Convert to SQL values
                            $sqlState = $state !== null ? "'" . mysqli_real_escape_string($con, $state) . "'" : "NULL";
                            $sqlTimezone = $timezone !== null ? "'" . mysqli_real_escape_string($con, $timezone) . "'" : "NULL";
                            $sqlGeo = $getLocation !== null ? "'" . mysqli_real_escape_string($con, $geo) . "'" : "NULL";
                            $sqlNear = $near !== null ? "'" . mysqli_real_escape_string($con, $near) . "'" : "NULL";

                            // prepare mysql statements
                            $sqlQueries .= "INSERT INTO wildfires (
                                    incidentID,incidentNumOnly,state,agency,unit,`year`,`date`,name,type,
                                    lat,lon,geo,near,acres,`status`,notes,resources,fuels,captured,updated,
                                    timezone,display,owner
                                )
                                VALUES(
                                    '$incidentNum','$incNumOnly',$sqlState,'$center','$incidentUnit','$year','$date',
                                    '$name','$incidentType','$coords[0]','$coords[1]',$sqlGeo,$sqlNear,'$acres',
                                    '$status','$notes','$resources','$fuels','$time','$time',$sqlTimezone,'1','system'
                                )
                                ON DUPLICATE KEY UPDATE
                                    state = COALESCE($sqlState, state),
                                    agency = VALUES(agency),
                                    unit = VALUES(unit),
                                    `year` = VALUES(`year`),
                                    `date` = VALUES(`date`),
                                    name = VALUES(name),
                                    type = VALUES(type),
                                    lat = VALUES(lat),
                                    lon = VALUES(lon),
                                    geo = COALESCE($sqlGeo, geo),
                                    near = COALESCE($sqlNear, near),
                                    acres = VALUES(acres),
                                    `status` = VALUES(`status`),
                                    notes = CASE WHEN (notes IS NULL OR notes = '') AND VALUES(notes) <> '' THEN VALUES(notes) ELSE notes END,
                                    resources = CASE WHEN (resources IS NULL OR resources = '') AND VALUES(resources) <> '' THEN VALUES(resources) ELSE resources END,
                                    fuels = CASE WHEN (fuels IS NULL OR fuels = '') AND VALUES(fuels) <> '' THEN VALUES(fuels) ELSE fuels END,
                                    updated = '$time',
                                    timezone = COALESCE($sqlTimezone, timezone),
                                    display = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END,
                                    owner = VALUES(owner);
                                ";

                            if ($acres != '') {
                                $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated)
                                        SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS
                                        (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum');";
                            }

                            $count++;
                        }

                        // add FS incident ID to array to reduce duplicated work
                        $usfsIDs[$incidentNum] = true;
                    }
                }

                if ($cadLastUpdated > 0) {
                    $altcenter = str_replace('--', '-', $altcenter);
                    $sqlQueries .= "UPDATE dispatch_centers SET cad_update = '$cadLastUpdated' WHERE agency = '$center' OR agency = '$altcenter';";
                }

                // add or update wildfires in database
                if ($runQuery) {
                    $runSQL = mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con));

                    if ($runSQL) {
                        do {
                            if ($result = mysqli_store_result($con)) {
                                while ($row = mysqli_fetch_row($result)) {
                                }
                                mysqli_free_result($result);
                            }
                            if (mysqli_more_results($con)) {
                            }
                        } while (mysqli_next_result($con));

                        $totalProcessed += $count;
                        echo "Finished with $center (modified $count incidents)...
";
                    } else {
                        echo "Unable to update data for $center...
";
                    }
                } else {
                    echo $sqlQueries;
                }
            }
        }
    } else {
        echo "No WildCAD data exists for $center...
";
    }
}

$elapsed = microtime(true) - $startAPITime;
echo "Processed wildfire data for $totalProcessed incidents in " . ($elapsed > 1 ? round($elapsed, 3) . 's' : round($elapsed, 4) . 'ms') . PHP_EOL;

/*if (cleanup()) {
    echo 'Wildfire data cleaned up...
';
}*/

logEvent('Processed wildfire data', true);
mysqli_close($con);
