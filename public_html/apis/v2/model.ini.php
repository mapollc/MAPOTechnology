<?
class FireSpreadModel
{
    private $init;
    private $lat;
    private $lng;
    private $weather;
    private $rh;
    private $rh_n;
    private $windSpd;
    private $windGust;
    private $wind_n;
    private $gust_n;
    private $windDir;
    private $windToDir;
    private $fuelType;
    private $moistureFactor;
    private $slope;
    private $slopeFactor;
    private $aspect;
    private $uphillDir;
    private $effectiveSpreadDir;
    private $effectiveWindSlopeMag;
    private $updated;
    private $maxWindSpeed = 30, $maxWindGust = 50;
    private $memcache;
    protected $allFuelTypes = [
        -9999 => null,
        91 => 'NB1',
        92 => 'NB2',
        93 => 'NB3',
        98 => 'NB8',
        99 => 'NB9',
        101 => 'GR1',
        102 => 'GR2',
        103 => 'GR3',
        104 => 'GR4',
        105 => 'GR5',
        106 => 'GR6',
        107 => 'GR7',
        108 => 'GR8',
        121 => 'GS1',
        122 => 'GS2',
        123 => 'GS3',
        124 => 'GS4',
        141 => 'SH1',
        142 => 'SH2',
        143 => 'SH3',
        144 => 'SH4',
        145 => 'SH5',
        146 => 'SH6',
        147 => 'SH7',
        148 => 'SH8',
        149 => 'SH9',
        161 => 'TU1',
        162 => 'TU2',
        163 => 'TU3',
        164 => 'TU4',
        165 => 'TU5',
        181 => 'TL1',
        182 => 'TL2',
        183 => 'TL3',
        184 => 'TL4',
        185 => 'TL5',
        186 => 'TL6',
        187 => 'TL7',
        188 => 'TL8',
        189 => 'TL9',
        201 => 'SB1',
        202 => 'SB2',
        203 => 'SB3',
        204 => 'SB4',
    ];

    public function __construct($lat, $lng)
    {
        $this->memcache = new Memcached();
        $this->memcache->addServer('127.0.0.1', 11211);

        $this->lat = $lat;
        $this->lng = $lng;

        $this->getWeather();
    }

    protected function fetch($urls)
    {
        $mh = curl_multi_init();
        $requests = [];

        foreach ($urls as $key => $url) {
            $ch = curl_init($url); // Ensure JSON format
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_multi_add_handle($mh, $ch);
            $requests[$key] = $ch;
        }

        $active = null;
        do {
            $mrc = curl_multi_exec($mh, $active);
        } while ($active);

        $results = [];
        foreach ($requests as $key => $ch) {
            $results[$key] = json_decode(curl_multi_getcontent($ch));
            curl_multi_remove_handle($mh, $ch);
        }
        curl_multi_close($mh);

        return $results;
    }

    private function getWeather()
    {
        $best = null;
        $wx = $this->fetch(['wx' => "https://api.synopticlabs.org/v2/stations/latest?token=44f4f6fef5d3468894bf07594e8862c0&radius={$this->lat},{$this->lng},30&timeformat=%m/%d/%Y%20%H:%M&vars=wind_speed%2Cwind_gust%2Cwind_direction%2Crelative_humidity&units=temp%7Cf%2Cspeed%7Cmph%2Cprecip%7Cin&obtimezone=local&showemptystations=0&status=active&limit=5"]);

        foreach ($wx['wx']->STATION as $stn) {
            $ob = $stn->OBSERVATIONS;

            if (isset($ob->{'wind_speed_value_1'}) && isset($ob->{'wind_direction_value_1'}) && isset($ob->{'relative_humidity_value_1'})) {
                $obTime = strtotime($ob->{'relative_humidity_value_1'}->date_time ?? $ob->{'wind_speed_value_1'}->date_time);

                if (time() - $obTime < 7200) {
                    if (!$best || $stn->DISTANCE < $best->DISTANCE) $best = $stn;
                }
            }
        }

        if ($best) {
            $this->weather = $best->OBSERVATIONS;
            $this->setDT($best->TIMEZONE);

            // get slope, aspect, and fuel type
            $this->getLandData();

            // initialize variables now that we have all the data
            $this->initVars();
        }
    }

    private function getLandData()
    {
        $cacheKey = "landdata_{$this->lat},{$this->lng}";
        $data = $this->memcache->get($cacheKey);

        if (!$data) {
            $base = 'https://lfps.usgs.gov/arcgis/rest/services/';

            $urls = [
                'slope' => "{$base}Landfire_Topo/LF2020_SlpP_CONUS/ImageServer/identify?geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A102100%7D%2C%22x%22%3A{$this->lng}%2C%22y%22%3A{$this->lat}%7D&geometryType=esriGeometryPoint&mosaicRule=%7B%22ascending%22%3Atrue%2C%22mosaicMethod%22%3A%22esriMosaicNorthwest%22%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&renderingRule=&renderingRules=%5B%7B%22rasterFunction%22%3A%22LF2020_SlpP_CONUS%22%7D%5D&pixelSize=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A102100%7D%2C%22x%22%3A{$this->lng}%2C%22y%22%3A{$this->lat}&sliceId=&time=&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=json",
                'aspect' => "{$base}Landfire_Topo/LF2020_Asp_CONUS/ImageServer/identify?geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A102100%7D%2C%22x%22%3A{$this->lng}%2C%22y%22%3A{$this->lat}%7D&geometryType=esriGeometryPoint&mosaicRule=%7B%22ascending%22%3Atrue%2C%22mosaicMethod%22%3A%22esriMosaicNorthwest%22%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&renderingRule=&renderingRules=%5B%7B%22rasterFunction%22%3A%22LF2020_Asp_CONUS%22%7D%5D&pixelSize=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A102100%7D%2C%22x%22%3A{$this->lng}%2C%22y%22%3A{$this->lat}&sliceId=&time=&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=json",
                'fuel' => "{$base}Landfire_LF2024/LF2024_FBFM40_CONUS/ImageServer/identify?geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A102100%7D%2C%22x%22%3A{$this->lng}%2C%22y%22%3A{$this->lat}%7D&geometryType=esriGeometryPoint&mosaicRule=%7B%22ascending%22%3Atrue%2C%22mosaicMethod%22%3A%22esriMosaicNorthwest%22%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&renderingRule=&renderingRules=%5B%7B%22rasterFunction%22%3A%22LF2024_FBFM40_CONUS%22%7D%5D&pixelSize=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A4326%2C%22wkid%22%3A102100%7D%2C%22x%22%3A{$this->lng}%2C%22y%22%3A{$this->lat}&sliceId=&time=&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=json"
            ];
            $data = $this->fetch($urls);

            $this->memcache->set($cacheKey, json_encode($data), strtotime('first day of January next year') - time());
        }

        // slope
        $this->slope = (float)($data['slope']->processedValues[0] ?? 0) / 100;

        // aspect
        $aspVal = $data['aspect']->processedValues[0] ?? 0;
        $this->aspect = $aspVal == -1 ? null : (float)$aspVal;

        // fuel type
        $fuelCode = $data['fuel']->processedValues[0] ?? -9999;
        $fuelName = $this->allFuelTypes[$fuelCode] ?? 'NB1';
        $this->fuelType = ['type' => $fuelName, 'params' => $this->getFuelParams($fuelName)];
    }

    private function setDT($tz)
    {
        $dt = new DateTime($this->weather->{'wind_speed_value_1'}->date_time, new DateTimeZone($tz));
        $this->updated = $dt->getTimestamp();
    }

    private function initVars()
    {
        $this->init = true;

        // init actual wx variables
        $this->windSpd = $this->weather->{'wind_speed_value_1'}->value ?? 0;
        $this->windGust = $this->weather->{'wind_gust_value_1'}->value ?? 0;
        $this->windDir = $this->weather->{'wind_direction_value_1'}->value ?? 0;
        $this->rh = $this->weather->{'relative_humidity_value_1'}->value ?? 50;

        // Downwind direction (correct for spread)
        $this->windToDir = ($this->windDir + 180) % 360;

        // Wind normalization (slightly curved)
        $this->wind_n = min(1, pow($this->windSpd / $this->maxWindSpeed, 0.8));

        // Wind gust normalization (slightly curved)
        $this->gust_n = min(1, pow($this->windGust / $this->maxWindGust, 0.9));

        // RH normalization (stable inverse curve)
        $this->rh_n = max(0, min(1, 1 - ($this->rh / 100)));

        // Moisture effect (softened)
        $this->moistureFactor = 0.25 + (0.75 * pow($this->rh_n, 3));

        // Rothermel's simplified slope spread multiplier
        $this->slopeFactor = 1 + (5.275 * pow($this->slope, 2));

        // Get the direction the fire wants to go UPHILL
        $this->uphillDir = ($this->aspect + 180) % 360;

        $this->calculateWindMag($this->windSpd);
    }

    private function calculateWindMag($wind)
    {
        // 1. Wind Vector (Magnitude * Direction)
        // windToDir is already the "downwind" direction
        $windMag = $wind * $this->fuelType['params']['m'];
        $windRad = deg2rad($this->windToDir);
        $windX = $windMag * sin($windRad);
        $windY = $windMag * cos($windRad);

        // 2. Slope Vector (Magnitude * Direction)
        $slopeX = 0;
        $slopeY = 0;

        // 3. Slope Vector (Magnitude * Direction)
        // slopeFactor - 1 isolates the 'thrust' provided by the slope
        if ($this->aspect !== null) {
            $uphillDir = ($this->aspect + 180) % 360;
            $slopeMag = ($this->slopeFactor - 1) * $this->fuelType['params']['m'];
            $slopeRad = deg2rad($uphillDir);
            $slopeX = $slopeMag * sin($slopeRad);
            $slopeY = $slopeMag * cos($slopeRad);
        }

        // 4. Combine Forces (The Resultant)
        $totalX = $windX + $slopeX;
        $totalY = $windY + $slopeY;

        $this->effectiveSpreadDir = (rad2deg(atan2($totalX, $totalY)) + 360) % 360;
        $this->effectiveWindSlopeMag = hypot($totalX, $totalY);
    }

    private function getCompassDirection($bearing)
    {
        $bearing = ($bearing % 360 + 360) % 360;
        $dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        $longDirs = [
            "north",
            "north-northeast",
            "northeast",
            "east-northeast",
            "east",
            "east-southeast",
            "southeast",
            "south-southeast",
            "south",
            "south-southwest",
            "southwest",
            "west-southwest",
            "west",
            "west-northwest",
            "northwest",
            "north-northwest"
        ];

        $a = round($bearing / 22.5) % 16;
        return ['short' => $dirs[$a], 'long' => $longDirs[$a]];
    }

    private function getWindCategory($speed)
    {
        if ($speed < 5) return 'light';
        if ($speed < 15) return 'moderate';
        if ($speed < 25) return 'strong';
        return 'very strong';
    }

    private function getSpreadLevel($ros)
    {
        if ($ros < 0.15)  return 'low';
        if ($ros < 0.50)  return 'moderate';
        if ($ros < 1.50)  return 'high';
        return 'extreme';
    }

    private function getFuelParams($code)
    {
        // Families of S&B 40 for the formula: (b + (wind * m)) * moisture
        $params = [
            // GRASS: High wind sensitivity
            'GR' => ['m' => 0.18, 'b' => 0.05],
            // GRASS-SHRUB: Moderate-High
            'GS' => ['m' => 0.13, 'b' => 0.04],
            // SHRUB: High fuel load, moderate wind sensitivity
            'SH' => ['m' => 0.15, 'b' => 0.03],
            // TIMBER-UNDERSTORY: Sheltered from wind, higher base
            'TU' => ['m' => 0.07, 'b' => 0.02],
            // TIMBER LITTER: Low wind sensitivity, slow spread
            'TL' => ['m' => 0.04, 'b' => 0.01],
            // SLASH-BLOWDOWN: Heavy fuel, variable
            'SB' => ['m' => 0.06, 'b' => 0.02],
            // NON-BURNABLE
            'NB' => ['m' => 0.00, 'b' => 0.00],
        ];

        $family = substr($code, 0, 2);
        $config = $params[$family] ?? $params['GR']; // Default to GR

        // Fine-tuning based on the intensity digit (1-9)
        // Higher digits in S&B generally mean higher fuel loads
        $loadLevel = (int)substr($code, 2, 1) ?: 2;
        $loadAdjustment = 1 + (($loadLevel - 2) * 0.15); // Adjusts m/b up or down slightly

        return [
            'm' => $config['m'] * $loadAdjustment,
            'b' => $config['b'] * $loadAdjustment
        ];
    }

    private function rateOfSpread()
    {
        $params = $this->fuelType['params'];
        if (!$this->fuelType['type'] || substr($this->fuelType['type'], 0, 2) === 'NB') return 0.001;

        // Use the combined magnitude from our vector math
        $val = ($params['b'] + $this->effectiveWindSlopeMag) * $this->moistureFactor;

        return round($val, 4);
    }

    private function project($lat, $lng, $bearing, $distanceMiles)
    {
        $R = 3959;

        $bearingRad = deg2rad($bearing);
        $latRad = deg2rad($lat);
        $lngRad = deg2rad($lng);

        $newLat = asin(sin($latRad) * cos($distanceMiles / $R) + cos($latRad) * sin($distanceMiles / $R) * cos($bearingRad));

        $newLng = $lngRad + atan2(sin($bearingRad) * sin($distanceMiles / $R) * cos($latRad), cos($distanceMiles / $R) - sin($latRad) * sin($newLat));

        return [
            'lat' => rad2deg($newLat),
            'lng' => rad2deg($newLng)
        ];
    }

    public function generateCone($useGusts = false)
    {
        $steps = 32;

        // if calculating for wind gusts, recalculate
        if ($useGusts) $this->calculateWindMag($this->windGust);

        $ros = $this->rateOfSpread();
        $coords = [];
        $theta = deg2rad($this->effectiveSpreadDir);

        // Anderson (1983) L/W ratio based on wind speed (mph)
        // Formula: L/W = 1 + 0.25 * (WindSpeed^0.8)
        $lw = 1 + (0.25 * pow($this->windSpd, 0.8));
        $headDist = $ros;

        // Usually very slow, roughly 5-10% of head fire in moderate winds
        $backDist = max(0.001, $headDist * (0.1 / $lw));
        $widthDist = max(0.001, ($headDist + $backDist) / $lw);

        // Geometry Setup
        $majorAxis = ($headDist + $backDist) / 2;
        $minorAxis = $widthDist / 2;
        $centerOffset = $majorAxis - $backDist;

        for ($i = 0; $i < $steps; $i++) {
            $alpha = deg2rad($i * (360 / $steps));

            // Ellipse math
            $x = $minorAxis * sin($alpha);
            $y = ($majorAxis * cos($alpha)) + $centerOffset;

            // Rotation Matrix for wind direction
            $rotatedX = $x * cos($theta) + $y * sin($theta);
            $rotatedY = -$x * sin($theta) + $y * cos($theta);

            // Project relative to origin
            $dist = sqrt($rotatedX ** 2 + $rotatedY ** 2);
            $bearing = rad2deg(atan2($rotatedX, $rotatedY));

            $p = $this->project($this->lat, $this->lng, $bearing, $dist);
            $coords[] = [$p['lng'], $p['lat']];
        }

        $coords[] = $coords[0];
        $area = round(M_PI * $majorAxis * $minorAxis * 640, 2);

        return [
            'coords' => $coords,
            'meta' => [
                'lw_ratio' => $lw,
                'head_fire_miles' => $headDist,
                'backing_fire_miles' => $backDist,
                'area' => $area
            ]
        ];
    }

    private function analysis($useGusts = false)
    {
        $ros = $this->rateOfSpread();
        $spreadDirection = $this->getCompassDirection($this->effectiveSpreadDir);
        $class = $this->getWindCategory($useGusts ? $this->windGust : $this->windSpd);
        $spread = $this->getSpreadLevel($ros);

        return [
            'ros' => $ros,
            'spread_direction' => $spreadDirection,
            'wind_class' => $class,
            'spread_class' => $spread
        ];
    }

    private function formatDistance($miles)
    {
        if ($miles < 0.25) {
            $feet = round($miles * 5280);
            return "$feet feet";
        }

        // For anything over a quarter mile, use decimals but round to 2 places
        return round($miles, 2) . " miles";
    }

    private function statement($analysis, $acres)
    {
        return "This fire has a {$analysis['spread_class']} spread potential. " .
            "In the next hour, the risk zone extends approximately {$this->formatDistance($analysis['ros'])}" .
            " {$analysis['spread_direction']['long']}, impacting an estimated {$acres}.";
    }

    public function output()
    {
        if (!$this->init) return [];

        $features = array_map(function ($isGust) {
            $cone = $this->generateCone($isGust);
            $analysis = $this->analysis($isGust);

            $area = $cone['meta']['area'];
            $acres = "$area acre". ($area != 1 ? 's' : '');

            $analysis['statement'] = $this->statement($analysis, $acres);
            $analysis['spread_direction'] = $analysis['spread_direction']['short'];

            return [
                'type' => 'Feature',
                'properties' => [
                    'id' => $isGust ? 'gusts' : 'sustained',
                    'updated' => $this->updated,
                    'valid' => $this->updated + 3600,
                    'weather' => [
                        'wind_direction' => $this->getCompassDirection($this->windDir)['short'],
                        'wind_speed' => $this->windSpd,
                        'wind_gust' => $this->windGust,
                        'relative_humidity' => $this->rh
                    ],
                    'terrain' => [
                        'slope' => $this->slope,
                        'aspect' => $this->getCompassDirection($this->aspect)['short'],
                        'fuel_type' => $this->fuelType['type'],
                    ],
                    'model' => [
                        'wind_n' => $this->wind_n,
                        'gust_n' => $this->gust_n,
                        'rh_n' => $this->rh_n,
                        'rh_factor' => $this->moistureFactor,
                        'slope_factor' => $this->slopeFactor,
                        'fuel_factors' => $this->fuelType['params']
                    ],
                    'vectors' => array_merge($cone['meta'], ['effective_mag' => $this->effectiveWindSlopeMag]),
                    'analysis' => $analysis
                ],
                'geometry' => [
                    'type' => 'Polygon',
                    'coordinates' => [$cone['coords']]
                ]
            ];
        }, [false, true]);

        $features[] = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [$this->lng, $this->lat]
            ],
            'properties' => ['type' => 'origin']
        ];

        return $features;
    }
}

$coords = $_REQUEST['coords'];

if (!isset($coords) || empty($coords)) {
    $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'Invalid or no coordinates were supplied'];
} else {
    $parts = explode(',', $coords);
    $lat = floatval($parts[0]);
    $lng = floatval($parts[1]);

    $model = new FireSpreadModel($lat, $lng);
    $data = $model->output();

    $returnJson = ['type' => 'FeatureCollection', 'features' => $data];
}
