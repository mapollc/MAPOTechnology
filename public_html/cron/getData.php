<?
$startAPITime = microtime(true);

set_time_limit(900);
ini_set('memory_limit','1024M');
ini_set('display_errors',1);
error_reporting(E_ERROR && E_PARSE);

class GetData {
    public $fire;
    public $incidentType;

    public function __construct($fire) {
        $this->fire = $fire;
        $this->incidentType = $fire->type;
    }

    function year() {
        return date('Y', $this->getDate());
    }

    function getDate() {
        return strtotime($this->fire->date);
    }

    function getIncidentType() {
        return $this->incidentType;
    }

    function ident() {
        return json_decode($this->fire->fiscal_data);
    }

    function getIncNumOnly() {
        return str_pad($this->ident()->inc_num, 6, 0, STR_PAD_LEFT);
    }

    function getIncidentNum() {
        $ident = $this->ident();

        return $this->year() . '-' . $ident->wfdssunit . '-' . $this->getIncNumOnly();
    }

    function getUnit() {
        $ident = $this->ident();

        return $ident->wfdssunit;
    }

    function getLat() {
        return $this->fire->latitude;
    }

    function getLon() {
        return str_replace('--', '-', "-" . $this->fire->longitude);
    }

    function getCoords() {
        return [$this->getLat(), $this->getLon()];
    }
}

function cleanup() {
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
}

function isValidIncident($incidentType, $coords) {
    return ($incidentType == 'Prescribed Fire' || $incidentType == 'Wildfire' || $incidentType == 'Smoke Check' || $incidentType == 'Smoke check') && ($coords[0] != '' && $coords[1] != '' && $coords[0] != '0' && $coords[1] != '0' && $coords[0] != '-' && $coords[1] != '-') ? true : false;
}

require '/home/mapo/public_html/db.ini.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';
include_once '/home/mapo/public_html/cron/dispatch.inc.php';
#$newDispatchCenters = ['COFTC'];

$runQuery = true;
$checkOldData = true;

foreach($newDispatchCenters as $center) {
    $startTime = microtime(true);
    $altcenter = substr($center, 0, 2).'-'.substr($center, 2, strlen($center));
    $center = str_replace('-', '', $center);

    // clear out variables for each center
    $sqlQueries = '';
    $usfsIDs = [];
    $count = 0;

    // retreive JSON file from cache (or live site if necessary) to get fire data from
    #$json = json_decode(file_get_contents('https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/'.$center.'/incidents'))[0];
    $url = file_get_contents("/home/mapo/public_html/cron/cache/run1/$center.json");
    $url2 = file_get_contents("/home/mapo/public_html/cron/cache/run2/$center.json");

    if ($url) {
        $json = json_decode($url);
        $json2 = json_decode($url2);

        if ($json) {
            // last time the CAD was updated
            $cadLastUpdated = strtotime($json->retrieved) + date('Z');

            // if there is a JSON response from wildcad
            if ($json->data) {
                date_default_timezone_set('America/Los_Angeles');
                
                // loop through each incident in the API
                for ($i = 0; $i < count($json->data); $i++) {
                    $fire = $json->data[$i];
                    $prevfire = $json2->data[$i];

                    $data = new GetData($fire);
                    $date = $data->getDate();
                    $incidentType = $data->getIncidentType();
                    $ident = json_decode($fire->fiscal_data);
                    $year = $data->year();
                    $incidentNum = $data->getIncidentNum();
                    $incNumOnly = $data->getIncNumOnly();
                    $incidentUnit = $data->getUnit();
        
                    // checks if there has been any new information added or modified for this incident
                    if ($checkOldData && json_encode($fire) != json_encode($prevfire)) {
                        $coords = $data->getCoords();

                        // Only proccess data if it is the following types of incidents, there are coordinates, and if the fire is >=50 acres OR the fire is <50 acres and is < 1 month old
                        if (isValidIncident($incidentType, $coords)) {
                            $state = getState($coords);

                            // Only process data if we haven't already done this incident ID and the incident ID isn't missing the unit identifier
                            if (!in_array($incidentNum, $usfsIDs) && $year <= date('Y') && !str_contains($incidentNum, '--')) {
                                $time = time();
                                $timezone = getTimezone($coords);
                                $getLocation = getLocation($con, $coords, false, $state);
                                $getCounty = getCounty($con, $coords);
                                $name = mysqli_real_escape_string($con, incidentName($fire->name, $incidentNum));
                                $incidentType = strpos($name, ' RX') !== FALSE || substr($name, 0, 5) == ' Burn' ? 'Prescribed Fire' : $incidentType;
                                $acres = $fire->acres;
                                $notes = mysqli_real_escape_string($con, $fire->webComment);
                                $fuels = mysqli_real_escape_string($con, $fire->fuels);
                                $geo = mysqli_real_escape_string($con, $getLocation);
                                $near = null;
                                $resources = mysqli_real_escape_string($con, $fire->resources[0] == '' || $fire->resources[0] == '*******' ? '' : implode(', ', $fire->resources));
                                $fs = json_decode($fire->fire_status);
                                $fireStatus = [];

                                if ($getCounty) {
                                    $near = $getCounty;
                                } else {
                                    $near = [
                                        'county' => null,
                                        'fips' => null
                                    ];
                                }
                                $near['near'] = $getLocation ? $getLocation : null;
                                $near = mysqli_real_escape_string($con, json_encode($near));

                                // if the incident is a smoke check but is reporting an acreage, change the incident type to "wildfire"
                                if ($incidentType == 'Smoke Check' && ($acres != '' && $acres != 'Unknown' && $acres > 0)) {
                                    $incidentType = 'Wildfire';
                                }
                                
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

                                $status = count($fireStatus) > 0 ? serialize($fireStatus) : '';
                            
                                // prepare mysql statements
                                $sqlQueries .= "INSERT INTO wildfires (incidentID,incidentNumOnly,state,agency,unit,`year`,`date`,name,type,lat,lon,geo,near,acres,`status`,notes,resources,fuels,captured,updated,timezone,display,owner)
VALUES('$incidentNum','$incNumOnly','$state','$center','$incidentUnit','$year','$date','$name','$incidentType','$coords[0]','$coords[1]','$geo','$near','$acres','$status','$notes','$resources','$fuels','$time','$time','$timezone','1','system')
ON DUPLICATE KEY UPDATE state = IF('$state' = '', state, '$state'), agency = VALUES(agency), unit = VALUES(unit), `year` = VALUES(`year`), `date` = VALUES(`date`), name = '$name', type = '$incidentType', 
lat = '$coords[0]', lon = '$coords[1]', geo = '$geo', near = '$near', acres = '$acres', `status` = '$status', notes = '$notes', resources = '$resources', fuels = '$fuels', captured = VALUES(captured),
updated = '$time', timezone = '$timezone', display = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END, owner = VALUES(owner);";

                                if ($acres != '') {
                                    $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated) SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS
(SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum');";
                                }
                                $count++;
                            }

                            // add FS incident ID to array to reduce duplicated work
                            $usfsIDs[] = $incidentNum;
                        }
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
                                while ($row = mysqli_fetch_row($result)) {}
                                mysqli_free_result($result);
                            }
                            if (mysqli_more_results($con)) {}
                        } while (mysqli_next_result($con));

                        echo 'Finished with '.$center.' (modified '.$count.' incidents)...
';
                    } else {
                        echo 'Unable to update data for '.$center.'...
';
                    }
                } else {
                    echo $sqlQueries;
                }
            }
        }
    } else {
        echo 'No WildCAD data exists for '.$center.'...
';
    }
}

$elapsed = microtime(true) - $startAPITime;
echo 'Wildfire data processed in '.($elapsed > 1 ? round($elapsed, 3) . 's' : round($elapsed, 4) . 'ms').'
';

/*if (cleanup()) {
    echo 'Wildfire data cleaned up...
';
}*/

logEvent('Processed wildfire data', true);
mysqli_close($con);