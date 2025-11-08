<?
/*****  ALGORITHM TO PULL WILDFIRE DATA FROM IRWIN  *****/
set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);

date_default_timezone_set('UTC');

require '/home/mapo/public_html/db.ini.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';

class Incident {
    public $fire;
    public $properties;

    public function __construct($fire = null)
    {
        $this->fire = $fire;
        $this->properties = $fire->properties;
    }

    function attributes()
    {
        return $this->properties;
    }

    function getLat()
    {
        return $this->fire->geometry->coordinates[1];
    }

    function getLon()
    {
        return $this->fire->geometry->coordinates[0];
    }

    function getCoords()
    {
        return [$this->getLat(), $this->getLon()];
    }

    function getState()
    {
        return str_replace('US-', '', $this->properties->POOState);
    }

    function getCounty()
    {
        return $this->properties->POOCounty;
    }

    function geocode($near)
    {
        return json_encode([
            'fips' => intval($this->properties->POOFips),
            'county' => $this->getCounty(),
            'state' => $this->getState(),
            'near' => $near
        ]);
    }

    function getIncidentNum()
    {
        return $this->properties->UniqueFireIdentifier;
    }

    function incidentNum()
    {
        $in = $this->getIncidentNum();
        $e = explode('-', $in);

        return [
            'id' => $in,
            'unit' => $e[1],
            'num' => $e[2]
        ];
    }

    function dispatch()
    {
        return $this->properties->CreatedBySystem == 'cfcad' ? 'CAL FIRE' : $this->properties->DispatchCenterID;
    }

    function times()
    {
        $disc = round($this->properties->FireDiscoveryDateTime / 1000, 0);

        return [
            'year' => date('Y', $disc),
            'discovered' => $disc,
            'updated' => round($this->properties->ModifiedOnDateTime_dt / 1000, 0)
        ];
    }

    function size()
    {
        $is = $this->properties->IncidentSize;
        $fa = $this->properties->FinalAcres;
        $da = $this->properties->DiscoveryAcres;

        return $is ? $is : ($fa ? $fa : $da);
    }

    function fuels() {  
        $fuels = null;
        $a = $this->properties->PrimaryFuelModel;
        $b = $this->properties->SecondaryFuelModel;

        if ($a) {
            $fuels[] = $a;            
        }

        if ($b) {
            $fuels[] = $b;            
        }

        return $fuels != null ? implode(', ', $fuels) : '';
    }

    function status()
    {
        $status = [];
        $contain = $this->properties->ContainmentDateTime;
        $control = $this->properties->ControlDateTime;
        $out = $this->properties->FireOutDateTime;

        if ($contain != '') {
            $status['Contain'] = round($contain / 1000, 0);
        }

        if ($control != '') {
            $status['Control'] = round($control / 1000, 0);
        }

        if ($out != '') {
            $status['Out'] = round($out / 1000, 0);
        }

        return count($status) == 0 ? '' : json_encode($status);
    }
}

include_once '/home/mapo/public_html/cron/dispatch.inc.php';

$runQuery = false;
$total = 0;
$lastModified = date('m/d/Y%20H:i:s', strtotime('-15 minutes'));

foreach($newDispatchCenters as $center) {
    $url = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=DispatchCenterID+%3D+%27'.$center.'%27&IncidentTypeCategory+%3C%3E+%27CX%27+AND+ModifiedOnDateTime_dt+%3E%3D+DATE+%27' . $lastModified . '%27&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=ModifiedOnDateTime_dt+DESC&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=geojson';
    $json = json_decode(file_get_contents($url));
    $total = count($json->features);

    // loop through all the incidents
    for ($i = 0; $i < $total; $i++) {
        ////for ($i = 0; $i < 3; $i++) {
        $fire = new Incident($json->features[$i]);
        $prop = $fire->attributes();
        $state = $fire->getState();
        $county = $fire->getCounty();
        $agency = $fire->dispatch();
        $numbering = $fire->incidentNum();
        $lat = $fire->getLat();
        $lon = $fire->getLon();
        $incidentID = $numbering['id'];
        $unit = $numbering['unit'];
        $incNumOnly = $numbering['num'];
        $name = mysqli_real_escape_string($con, incidentName($prop->IncidentName, $incidentID));
        $type = $prop->IncidentTypeCategory == 'WF' ? 'Wildfire' : ($prop->IncidentTypeCategory == 'RX' ? 'Prescribed Fire' : '');
        $year = $fire->times()['year'];
        $discovered = $fire->times()['discovered'];
        $updated = $fire->times()['updated'];
        $near = getLocation($con, $fire->getCoords(), false, $state);
        $acres = $fire->size();
        $fuels = $fire->fuels();
        $status = mysqli_real_escape_string($con, $fire->status());
        $time = time();
        $timezone = getTimezone($fire->getCoords());
        $geo = mysqli_real_escape_string($con, $fire->geocode($near));

        // prepare mysql statements
        $sqlQueries .= "INSERT INTO wildfires (incidentID,incidentNumOnly,state,agency,unit,`year`,`date`,name,type,lat,lon,geo,near,acres,`status`,notes,resources,fuels,captured,updated,timezone,display,owner)
        VALUES('$incidentID','$incNumOnly','$state','$agency','$unit','$year','$discovered','$name','$type','$lat','$lon','$near','$geo','$acres','$status','','','$fuels','$time','$time','$timezone','1','system')
        ON DUPLICATE KEY UPDATE state = IF('$state' = '', state, '$state'), agency = VALUES(agency), unit = VALUES(unit), `year` = VALUES(`year`), `date` = VALUES(`date`), name = '$name', type = '$type', 
        lat = '$lat', lon = '$lon', geo = '$near', 
        acres = CASE WHEN '$acres' IS NULL OR '$acres' = '' THEN acres WHEN CAST('$acres' AS FLOAT) > CAST(acres AS FLOAT) THEN '$acres' ELSE acres END,
        `status` = '$status',
        fuels = CASE WHEN fuels = '' OR fuels IS NULL THEN '$fuels' ELSE fuels END, captured = VALUES(captured),
        updated = '$time', timezone = '$timezone', display = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END, owner = VALUES(owner);";

        // add a record for a change in fire acreage
        if ($acres != '') {
            $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated) SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentID' AND NOT EXISTS
            (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentID');";
        }

        $total++;
    }

    echo "Finished with $center (modified $total incidents)...
";

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
        }
    } else {
        echo $sqlQueries;
    }

    break;
}

mysqli_close($con);

echo "
---- Finished processing wildfire data ($total incidents modified) ----
";