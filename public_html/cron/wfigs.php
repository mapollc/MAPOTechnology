<?php
set_time_limit(900);
ini_set('memory_limit', '1024M');
ini_set('display_errors', 1);
error_reporting(E_ERROR | E_PARSE);

date_default_timezone_set('UTC');

require_once '/home/mapo/public_html/config.inc.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';
include_once '/home/mapo/public_html/cron/dispatch.inc.php';

class Incident
{
    public object $properties;
    private object $fire;

    public function __construct(object $fire)
    {
        $this->fire = $fire;
        // Normalize GeoJSON (properties) and standard ESRI JSON (attributes) layouts
        $this->properties = $fire->properties ?? $fire->attributes ?? (object)[];
    }

    public function getLat(): float|string
    {
        return $this->fire->geometry->coordinates[1] ?? $this->properties->Latitude ?? '';
    }

    public function getLon(): float|string
    {
        return $this->fire->geometry->coordinates[0] ?? $this->properties->Longitude ?? '';
    }

    public function getCoords(): array
    {
        return [$this->getLat(), $this->getLon()];
    }

    public function getState(): string
    {
        return str_replace('US-', '', $this->properties->POOState ?? '');
    }

    public function getCounty(): string
    {
        return $this->properties->POOCounty ?? '';
    }

    public function getIncidentNum(): string
    {
        return $this->properties->UniqueFireIdentifier ?? '';
    }

    public function geocode(string $near): string
    {
        return json_encode([
            'county' => $this->getCounty(),
            'fips'   => (int) ($this->properties->POOFips ?? 0),
            'near'   => $near
        ]);
    }

    public function incidentNum(): array
    {
        $in = $this->getIncidentNum();
        $e = explode('-', $in);
        return [
            'id'   => $in,
            'unit' => $e[1] ?? '',
            'num'  => $e[2] ?? ''
        ];
    }

    public function dispatch(): string
    {
        return ($this->properties->CreatedBySystem ?? '') === 'cfcad' ? 'CAL FIRE' : ($this->properties->DispatchCenterID ?? '');
    }

    public function times(): array
    {
        $disc = round(($this->properties->FireDiscoveryDateTime ?? time() * 1000) / 1000, 0);
        return [
            'year'       => date('Y', $disc),
            'discovered' => $disc,
            'updated'    => round(($this->properties->ModifiedOnDateTime_dt ?? time() * 1000) / 1000, 0)
        ];
    }

    public function size(): mixed
    {
        return $this->properties->IncidentSize ?: ($this->properties->FinalAcres ?: ($this->properties->DiscoveryAcres ?: ''));
    }

    public function status(): string
    {
        $p = $this->properties;
        $status = array_filter([
            'Contain' => !empty($p->ContainmentDateTime) ? round($p->ContainmentDateTime / 1000) : null,
            'Control' => !empty($p->ControlDateTime) ? round($p->ControlDateTime / 1000) : null,
            'Out'     => !empty($p->FireOutDateTime) ? round($p->FireOutDateTime / 1000) : null,
        ], fn($v) => $v !== null);

        return $status ? json_encode($status) : '';
    }

    public function behavior()
    {
        $p = $this->properties;
        return array_filter([$p->FireBehaviorGeneral ?? null, $p->FireBehaviorGeneral1 ?? null, $p->FireBehaviorGeneral2 ?? null, $p->FireBehaviorGeneral3 ?? null]);
    }

    public function cause()
    {
        $p = $this->properties;
        return array_filter([$p->FireCause ?? null, $p->FireCauseGeneral ?? null, $p->FireCauseSpecific ?? null]);
    }

    public function fuels()
    {
        return array_filter([$this->properties->PrimaryFuelModel ?? null, $this->properties->SecondaryFuelModel ?? null]);
    }

    public function values(string $type): mixed
    {
        return $type === 'people' ? ($this->properties->TotalIncidentPersonnel ?? null) : ($this->properties->EstimatedCostToDate ?? null);
    }
}

function isValidIncident(?string $type, array $coords): bool
{
    return in_array($type, ['Prescribed Fire', 'Wildfire', 'Smoke Check', 'Smoke check'], true)
        && !empty($coords[0]) && !empty($coords[1])
        && !in_array((string)$coords[0], ['0', '-'], true) && !in_array((string)$coords[1], ['0', '-'], true);
}

// ==========================================
// IRWIN SIT REP 209 RESOURCES
// ==========================================
function allZeros($value): bool
{
    if (is_array($value)) {
        foreach ($value as $v) {
            if (!allZeros($v)) {
                return false;
            }
        }
        return true;
    }

    return (int)$value === 0;
}

function sitRep($irwinIDs)
{
    if (empty($irwinIDs)) return null;

    $ids = implode(',', array_map(fn($id) => "'$id'", $irwinIDs));
    $queryParams = [
        'where'          => "IrwinID IN ($ids)",
        'returnGeometry' => 'false',
        'outFields'      => 'UniqueFireIdentifier,Team_Type,SIT_FixedWing,Crews,Dozers,Engines,Helicopters,CALC_TotalStructuresThreatened,SIT_Type1Tankers,SIT_Type2Tankers,SIT_Type3Tankers,SIT_Type4Tankers',
        'f'              => 'geojson'
    ];

    // 3. Build the safe, perfectly encoded URL
    $url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/EGP_Active_Incidents_Prod_Public_View/FeatureServer/0/query?" . http_build_query($queryParams);
    $json = json_decode(@file_get_contents($url));

    if (empty($json->features)) return null;

    $queries = [];
    foreach ($json->features as $fire) {
        $p = $fire->properties;

        $data = [
            'teamType' => $p->Team_Type ?? 0,
            'structures' => $p->CALC_TotalStructuresThreatened ?? 0,
            'ground' => [
                'crews' => $p->Crews ?? 0,
                'dozers' => $p->Dozers ?? 0,
                'engines' => $p->Engines ?? 0
            ],
            'aircraft' => [
                'fixedWing' => $p->SIT_FixedWing ?? 0,
                'helicopters' => $p->Helicopters ?? 0,
                'tankers' => [
                    'type1' => $p->SIT_Type1Tankers ?? 0,
                    'type2' => $p->SIT_Type2Tankers ?? 0,
                    'type3' => $p->SIT_Type3Tankers ?? 0,
                    'type4' => $p->SIT_Type4Tankers ?? 0
                ]
            ]
        ];

        if (allZeros($data)) return null;

        $resources = json_encode($data);
        $queries[] = "UPDATE wildfiresSupp SET resources = '$resources' WHERE incidentID = '{$p->UniqueFireIdentifier}'";
    }

    return $queries;
}

// Global configurations
$runQuery = true;
$currentTime = time();
$sqlQueries = [];

$minutes = 90;
$last20Mins = date('m/d/Y%20H:i:s', strtotime("-$minutes minutes"));
#$last20Mins = date('m/d/Y%20H:i:s', strtotime("1/1/2026 00:00:00"));
$dispatchCenters = $newDispatchCenters;
#$dispatchCenters = ['ORBMC'];

$finalTotal = 0;
$suppCount = 0;

foreach ($dispatchCenters as $center) {
    $irwinIDs = [];
    $centerTotal = 0;

    // Unified API URL: Filters by dispatch center modifications over the last 20 minutes, including all fields
    $url = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_YearToDate/FeatureServer/0/query?where=DispatchCenterID+%3D+%27{$center}%27+AND+IncidentTypeCategory+<>+%27CX%27+AND+ModifiedOnDateTime_dt+>%3D+DATE+%27{$last20Mins}%27&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=ModifiedOnDateTime_dt+DESC&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&sqlFormat=none&f=geojson";

    $json = json_decode(@file_get_contents($url));
    $count = isset($json->features) ? count($json->features) : 0;

    if ($count === 0) {
        echo "No updated incidents from $center...
";
        continue;
    }

    foreach ($json->features as $feature) {
        $fire = new Incident($feature);
        $prop = $fire->properties;

        $incidentType = match ($prop->IncidentTypeCategory ?? '') {
            'WF'    => 'Wildfire',
            'RX'    => 'Prescribed Fire',
            default => '',
        };

        $lat = $fire->getLat();
        $lon = $fire->getLon();

        if (isValidIncident($incidentType, [$lat, $lon])) {
            $incidentNum  = $fire->getIncidentNum();
            $numbering    = $fire->incidentNum();
            $incNumOnly   = $numbering['num'];
            $incidentUnit = $numbering['unit'];

            $state       = $fire->getState();
            $name        = mysqli_real_escape_string($con, incidentName($prop->IncidentName ?? '', $incidentNum));
            $times       = $fire->times();
            $year        = $times['year'];
            $date        = $times['discovered'];
            $geo         = getLocation($con, $fire->getCoords(), false, $state);
            $geolocation = mysqli_real_escape_string($con, $geo);
            $acres       = $fire->size();
            $status      = mysqli_real_escape_string($con, $fire->status());
            $timezone    = getTimezone($fire->getCoords());
            $near        = mysqli_real_escape_string($con, $fire->geocode($geo ?: ''));

            $fuelList = array_filter([$prop->PrimaryFuelModel ?? null, $prop->SecondaryFuelModel ?? null]);
            $fuels    = implode(', ', $fuelList);

            // --------------------------------------------------
            // Write Query for Main Table (wildfires)
            // --------------------------------------------------
            $sqlQueries[] = "INSERT INTO wildfires (
                    incidentID, incidentNumOnly, state, agency, unit, `year`, `date`, name, type,
                    lat, lon, geo, near, acres, `status`, notes, resources, fuels, captured, updated,
                    timezone, display, owner
                ) VALUES (
                    '$incidentNum', '$incNumOnly', '$state', '$center', '$incidentUnit', '$year', '$date',
                    '$name', '$incidentType', '$lat', '$lon', '$geolocation', '$near', '$acres', '$status',
                    '', '', '$fuels', '$currentTime', '$currentTime', '$timezone', '1', 'irwin'
                ) ON DUPLICATE KEY UPDATE
                    state     = IF('$state' = '', state, '$state'),
                    agency    = VALUES(agency),
                    unit      = VALUES(unit),
                    `year`    = VALUES(`year`),
                    `date`    = VALUES(`date`),
                    name      = VALUES(name),
                    type      = VALUES(type),
                    lat       = VALUES(lat),
                    lon       = VALUES(lon),
                    geo       = CASE WHEN VALUES(geo) <> '' AND geo <> VALUES(geo) THEN VALUES(geo) ELSE geo END,
                    near      = CASE WHEN VALUES(near) <> '' AND near <> VALUES(near) THEN VALUES(near) ELSE near END,
                    acres     = VALUES(acres),
                    `status`  = VALUES(`status`),
                    updated   = '$currentTime',
                    timezone  = VALUES(timezone),
                    display   = CASE WHEN display = 0 THEN 0 ELSE VALUES(display) END,
                    owner     = VALUES(owner)";

            if ($acres !== '') {
                $sqlQueries[] = "INSERT INTO acres_history (incidentID, acres, updated)
                    SELECT incidentID, acres, updated FROM wildfires 
                    WHERE incidentID = '$incidentNum' 
                    AND NOT EXISTS (
                        SELECT 1 FROM acres_history 
                        WHERE acres_history.acres = '$acres' 
                        AND acres_history.incidentID = '$incidentNum')";
            }

            // --------------------------------------------------
            // Processing & Writing Query for Supplemental Table
            // --------------------------------------------------
            $fb = $fire->behavior();
            $c  = $fire->cause();
            $f  = $fire->fuels();

            $pplVal  = $fire->values('people');
            $costVal = $fire->values('cost');
            $ppl     = $pplVal !== null ? (int)$pplVal : 'NULL';
            $cost    = $costVal !== null ? (float)$costVal : 'NULL';

            $isUndeterminedOnly = count($c) === 1 && strcasecmp(reset($c), 'Undetermined') === 0;

            //// Only queue supplemental records if they actually contain meaningful data points
            ////if (!(empty($f) && empty($fb) && $cost === 'NULL' && $ppl === 'NULL' && ($isUndeterminedOnly || empty($c)))) {
            $behaveStr = mysqli_real_escape_string($con, json_encode(array_values($fb)));
            $causeStr  = mysqli_real_escape_string($con, json_encode(array_values($c)));
            $fuelStr   = mysqli_real_escape_string($con, json_encode(array_values($f)));

            if ($fuelStr !== '[]' || $behaveStr !== '[]' || $causeStr !== '[]' || $cost !== 'NULL' || $ppl !== 'NULL') {
                $sqlQueries[] = "INSERT INTO wildfiresSupp (incidentID, fuels, causes, behavior, cost, people, image, resources)
                        VALUES ('$incidentNum', '$fuelStr', '$causeStr', '$behaveStr', $cost, $ppl, NULL, NULL)
                        ON DUPLICATE KEY UPDATE
                            fuels    = VALUES(fuels),
                            causes   = VALUES(causes),
                            behavior = VALUES(behavior),
                            cost     = VALUES(cost),
                            people   = VALUES(people),
                            resources = VALUES(resources)";
                $suppCount++;
            }
            ////}

            $irwinIDs[] = $prop->IrwinID;
            $centerTotal++;
        }
    }

    $irwinIDs = array_unique($irwinIDs);
    ////$irwinIDs = ['{7C9D552D-EB84-4CB3-8976-5873EFB213A5}'];

    $sitrep = sitRep($irwinIDs);
    ////echo $sitrep;

    if ($sitrep !== null) {
        $sqlQueries = [...$sqlQueries, ...$sitrep];
        echo "===== Added sit rep 209 resource data to supplemental table =====
";
    }

    $finalTotal += $centerTotal;
    echo "Finished with $center (processed $centerTotal incidents)...
";
}

echo "---- IRWIN fire data retrieval complete ($finalTotal wildfires, supplemented $suppCount fires) ----
";

// ==========================================
// EXECUTING UNIFIED DB TRANSACTIONS
// ==========================================
if ($runQuery && !empty($sqlQueries) && count($sqlQueries) > 0) {
    $runQuery = implode(';', $sqlQueries);

    if (mysqli_multi_query($con, $runQuery)) {
        do {
            if ($result = mysqli_store_result($con)) {
                mysqli_free_result($result);
            }
        } while (mysqli_next_result($con));
        echo "Database batch transactions successfully committed.
";
    } else {
        echo "Database transaction failed: " . mysqli_error($con) . "
";
    }
} else {
    echo implode(';', $sqlQueries);
    echo "No matching modifications captured over intervals. Skipping batch execution.
";
}

mysqli_close($con);
echo "Processing complete!
";
