<?

/*****  ALGORITHM TO PULL WILDFIRE DATA FROM IRWIN  *****/
set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);

date_default_timezone_set('UTC');

require '/home/mapo/public_html/db.ini.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';

class Incident
{
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
            'county' => $this->getCounty(),
            'fips' => intval($this->properties->POOFips),
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

    function fuels()
    {
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

function isValidIncident($incidentType, $coords)
{
    return ($incidentType == 'Prescribed Fire' || $incidentType == 'Wildfire' || $incidentType == 'Smoke Check' || $incidentType == 'Smoke check') && ($coords[0] != '' && $coords[1] != '' && $coords[0] != '0' && $coords[1] != '0' && $coords[0] != '-' && $coords[1] != '-') ? true : false;
}

include_once '/home/mapo/public_html/cron/dispatch.inc.php';
#$newDispatchCenters = ['COMTC'];

$runQuery = true;
$lastModified = date('m/d/Y%20H:i:s', strtotime('-15 minutes'));
$finalTotal = 0;

foreach ($newDispatchCenters as $center) {
    $sqlQueries = '';
    $total = 0;
    $url = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=DispatchCenterID+%3D+%27' . $center . '%27+AND+IncidentTypeCategory+<>+%27CX%27+AND+ModifiedOnDateTime_dt+>%3D+DATE+%27' . $lastModified . '%27&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=ModifiedOnDateTime_dt+DESC&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=geojson';
    $json = json_decode(file_get_contents($url));
    $count = count($json->features);

    // check if any incidents exist and then
    // loop through all the incidents
    if ($count == 0) {
        echo "No updated incidents from $center...
";                
    } else {
        for ($i = 0; $i < $count; $i++) {
            ////for ($i = 0; $i < 3; $i++) {
            $time = time();
            $fire = new Incident($json->features[$i]);
            $prop = $fire->attributes();
            $incidentType = $prop->IncidentTypeCategory == 'WF' ? 'Wildfire' : ($prop->IncidentTypeCategory == 'RX' ? 'Prescribed Fire' : '');
            $lat = $fire->getLat();
            $lon = $fire->getLon();

            if (isValidIncident($incidentType, [$lat, $lon])) {
                $incidentNum = $fire->getIncidentNum();
                $numbering = $fire->incidentNum();
                $incidentID = $numbering['id'];
                $incidentUnit = $numbering['unit'];
                $incNumOnly = $numbering['num'];

                $state = $fire->getState();
                $county = $fire->getCounty();
                $agency = $fire->dispatch();
                $name = mysqli_real_escape_string($con, incidentName($prop->IncidentName, $incidentNum));
                $year = $fire->times()['year'];
                $date = $fire->times()['discovered'];
                $updated = $fire->times()['updated'];
                $geo = getLocation($con, $fire->getCoords(), false, $state);
                $acres = $fire->size();
                $fuels = $fire->fuels();
                $status = mysqli_real_escape_string($con, $fire->status());
                $timezone = getTimezone($fire->getCoords());
                $near = mysqli_real_escape_string($con, $fire->geocode($geo));

                // prepare mysql statements
                $sqlQueries .= "INSERT INTO wildfires (
                incidentID,incidentNumOnly,state,agency,unit,`year`,`date`,name,type,
                lat,lon,geo,near,acres,`status`,notes,resources,fuels,captured,updated,
                timezone,display,owner
            )
            VALUES (
                '$incidentNum','$incNumOnly','$state','$center','$incidentUnit','$year','$date',
                '$name','$incidentType','$lat','$lon','$geo','$near','$acres','$status',
                '$notes','$resources','$fuels','$time','$time','$timezone','1','irwin'
            )
            ON DUPLICATE KEY UPDATE
                state = IF('$state' = '', state, '$state'),
                agency = VALUES(agency),
                unit = VALUES(unit),
                `year` = VALUES(`year`),
                `date` = VALUES(`date`),
                name = VALUES(name),
                type = VALUES(type),
                lat = VALUES(lat),
                lon = VALUES(lon),
                geo = VALUES(geo),
                near = VALUES(near),
                acres = VALUES(acres),
                `status` = VALUES(`status`),
                notes = CASE WHEN (notes IS NULL OR notes = '') AND VALUES(notes) <> '' THEN VALUES(notes) ELSE notes END,
                resources = CASE WHEN (resources IS NULL OR resources = '') AND VALUES(resources) <> '' THEN VALUES(resources) ELSE resources END,
                fuels = CASE WHEN (fuels IS NULL OR fuels = '') AND VALUES(fuels) <> '' THEN VALUES(fuels) ELSE fuels END,
                updated = '$time',
                timezone = VALUES(timezone),
                display = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END,
                owner = VALUES(owner);
            ";

                if ($acres != '') {
                    $sqlQueries .= "INSERT INTO acres_history (incidentID,acres,updated)
                    SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$incidentNum' AND NOT EXISTS
                    (SELECT 1 FROM acres_history WHERE acres_history.acres = '$acres' AND acres_history.incidentID = '$incidentNum');
                ";
                }

                $total++;
            }
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
            }
        } else {
            echo $sqlQueries;
        }

        $finalTotal += $total;

        echo "Finished with $center (modified $total incidents)...
";        
    }
}

mysqli_close($con);

echo "
---- Finished processing wildfire data ($finalTotal incidents modified) ----
";