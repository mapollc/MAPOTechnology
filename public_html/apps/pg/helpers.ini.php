<?
class Helpers
{
    public $org;
    public $states;

    public function __construct($org)
    {
        $this->org = $org;
        $this->states = [
            'AL' => 'ALABAMA',
            'AK' => 'ALASKA',
            'AZ' => 'ARIZONA',
            'AR' => 'ARKANSAS',
            'CA' => 'CALIFORNIA',
            'CO' => 'COLORADO',
            'CT' => 'CONNECTICUT',
            'DE' => 'DELAWARE',
            'DC' => 'DISTRICT OF COLUMBIA',
            'FL' => 'FLORIDA',
            'GA' => 'GEORGIA',
            'HI' => 'HAWAII',
            'ID' => 'IDAHO',
            'IL' => 'ILLINOIS',
            'IN' => 'INDIANA',
            'IA' => 'IOWA',
            'KS' => 'KANSAS',
            'KY' => 'KENTUCKY',
            'LA' => 'LOUISIANA',
            'ME' => 'MAINE',
            'MD' => 'MARYLAND',
            'MA' => 'MASSACHUSETTS',
            'MI' => 'MICHIGAN',
            'MN' => 'MINNESOTA',
            'MS' => 'MISSISSIPPI',
            'MO' => 'MISSOURI',
            'MT' => 'MONTANA',
            'NE' => 'NEBRASKA',
            'NV' => 'NEVADA',
            'NH' => 'NEW HAMPSHIRE',
            'NJ' => 'NEW JERSEY',
            'NM' => 'NEW MEXICO',
            'NY' => 'NEW YORK',
            'NC' => 'NORTH CAROLINA',
            'ND' => 'NORTH DAKOTA',
            'OH' => 'OHIO',
            'OK' => 'OKLAHOMA',
            'OR' => 'OREGON',
            'PA' => 'PENNSYLVANIA',
            'RI' => 'RHODE ISLAND',
            'SC' => 'SOUTH CAROLINA',
            'SD' => 'SOUTH DAKOTA',
            'TN' => 'TENNESSEE',
            'TX' => 'TEXAS',
            'UT' => 'UTAH',
            'VT' => 'VERMONT',
            'VA' => 'VIRGINIA',
            'WA' => 'WASHINGTON',
            'WV' => 'WEST VIRGINIA',
            'WI' => 'WISCONSIN',
            'WY' => 'WYOMING'
        ];
    }

    public function getState($state)
    {
        return ucwords(strtolower($this->states[$state]));
    }

    public function dateFormat($t)
    {
        return date($this->org->dateFormat(), $t);
    }

    public function timeFormat($t, $tz = false)
    {
        return date($this->org->timeFormat() . ($tz ? ' T' : ''), $t);
    }

    public function dateTime($t, $tz = false)
    {
        return $this->dateFormat($t) . ' ' . $this->timeFormat($t, $tz);
    }

    public function timeAgoOrUntil($timestamp)
    {
        if ($timestamp < time()) return $this->timeAgo($timestamp);
        else return $this->until($timestamp, true);
    }

    public function plural($v)
    {
        return $v > 1 ? 's' : '';
    }

    public function timeAgo($timestamp)
    {
        if ($timestamp == 0) {
            return 'Never';
        }

        $diff = time() - (int) $timestamp;

        if ($diff < 10) {
            return 'Just now';
        }

        $units = [
            31536000 => 'year',
            2628000 => 'month',
            604800 => 'week',
            86400 => 'day',
            3600 => 'hour',
            60 => 'min',
            1 => 'sec',
        ];

        foreach ($units as $seconds => $unit) {
            if ($diff >= $seconds) {
                $value = floor($diff / $seconds);
                $remainder = $diff % $seconds;

                $result = "$value $unit" . $this->plural($value);

                if ($remainder > 0) {
                    $foundNext = false;
                    foreach ($units as $nextSeconds => $nextUnit) {
                        if ($foundNext) {
                            $remainderValue = floor($remainder / $nextSeconds);
                            if ($remainderValue > 0) {
                                $result .= ", $remainderValue $nextUnit" . $this->plural($remainderValue);
                                break;
                            }
                        }

                        if ($seconds === $nextSeconds) $foundNext = true;
                    }
                }

                return "$result ago";
            }
        }

        return 'Unknown';
    }

    public function until($timestamp, $in = false)
    {
        $diff = (int) $timestamp - time();

        if ($diff < 10) {
            return 'Just now';
        }

        $units = [
            31536000 => 'year',
            2419200 => 'month',
            604800 => 'week',
            86400 => 'day',
            3600 => 'hour',
            60 => 'min',
            1 => 'sec',
        ];

        foreach ($units as $seconds => $unit) {
            if ($diff >= $seconds) {
                $value = floor($diff / $seconds);
                $remainder = $diff % $seconds;

                $result = "$value $unit" . $this->plural($value);

                if ($remainder > 0 && isset($units[array_search($unit, array_values($units)) + 1])) {
                    $remainderUnit = array_values($units)[array_search($unit, array_values($units)) + 1];
                    $remainderSeconds = array_search($remainderUnit, $units);
                    $remainderValue = floor($remainder / $remainderSeconds);
                    if ($remainderValue > 0) {
                        $result .= ", $remainderValue $remainderUnit" . $this->plural($remainderValue);
                    }
                }

                return ($in ? 'in ' : '') . $result;
            }
        }

        return 'Unknown';
    }

    public function query($types = '', $params = [], $sql, $useCon = null)
    {
        global $con;
        $db = $useCon ?? $con;

        $stmt = $db->prepare($sql);
        if ($stmt === false) return ['error' => "Prepare failed: {$db->error}"];

        if ($types && !empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if (!$stmt->execute()) {
            $stmt->close();
            return ['error' => "Execute failed: {$db->error}"];
        }

        if (stripos(trim($sql), 'SELECT') === 0) {
            $result = $stmt->get_result();

            if ($result) {
                // Check if query has LIMIT 1
                if (preg_match('/\sLIMIT\s+1\s*$/i', $sql)) {
                    $row = $result->fetch_assoc();
                    $stmt->close();
                    return $row ?: null;
                } else {
                    $rows = [];
                    while ($row = $result->fetch_assoc()) {
                        $rows[] = $row;
                    }
                    $stmt->close();
                    return $rows;
                }
            } else {
                $stmt->close();
                return [];
            }
        } else {
            $stmt->close();
            return null;
        }
    }

    private function median($arr)
    {
        sort($arr); // added: sort values
        $count = count($arr);
        $mid = floor($count / 2);

        if ($count % 2) {
            return $arr[$mid]; // added: odd count → middle value
        } else {
            return ($arr[$mid - 1] + $arr[$mid]) / 2; // added: even count → average of two middle values
        }
    }

    public function getCities($feature)
    {
        global $pgen;
        $bbox = $this->bbox($feature);

        $geo = $this->query(
            'dddd',
            [$bbox[1], $bbox[3], $bbox[0], $bbox[2]],
            "SELECT city, county, state_name AS state, lat, lon, population FROM cities WHERE (lat >= ? AND lat <= ?) AND (lon >= ? AND lon <= ?) AND population > 0 GROUP BY city, state_name ORDER BY population DESC",
            $pgen->con2
        );

        $cities = [];
        $counties = [];
        $states = [];
        $pop = 0;

        // parse cities
        foreach ($geo as $place) {
            if ($this->pointInPolygon($place['lat'], $place['lon'], $feature)) {
                $pop += $place['population'];
                $counties[] = $place['county'];
                $states[] = $place['state'];
                $cities[] = $place['city'];
            }
        }

        $cities = array_values(array_unique($cities));
        $counties = array_values(array_unique($counties));
        $states = array_values(array_unique($states));

        return [
            'cities' => $cities,
            'counties' => $counties,
            'states' => $states,
            'affectedPopulation' => $pop
        ];
    }
    public function bbox($feature)
    {
        $coords = [];

        $geometry = $feature->geometry ?? null;
        if (!$geometry) return [0, 0, 0, 0];

        $rawCoords = $geometry->coordinates;

        foreach ($rawCoords as $ring) {
            foreach ($ring as $point) {
                $coords[] = $point;
            }
        }

        $lons = array_column($coords, 0);
        $lats = array_column($coords, 1);

        return [
            min($lons),
            min($lats),
            max($lons),
            max($lats)
        ];
    }

    private function pointInPolygon($lat, $lon, $feature)
    {
        $geometry = $feature->geometry ?? null;
        $coords = $geometry->coordinates;

        if ($geometry->type == 'Polygon') {
            return $this->pointInRings($lon, $lat, $coords);
        } elseif ($geometry->type == 'MultiPolygon') {
            foreach ($coords as $polygon) {
                if ($this->pointInRings($lon, $lat, $polygon)) return true;
            }
        }
        return false;
    }

    private function pointInRings($x, $y, $rings)
    {
        foreach ($rings as $ring) {
            if ($this->pointInSingleRing($x, $y, $ring)) return true;
        }
        return false;
    }

    private function pointInSingleRing($x, $y, $ring)
    {
        $inside = false;
        $n = count($ring);
        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            if ((($ring[$i][1] > $y) != ($ring[$j][1] > $y)) &&
                ($x < ($ring[$j][0] - $ring[$i][0]) * ($y - $ring[$i][1]) / ($ring[$j][1] - $ring[$i][1]) + $ring[$i][0])
            ) {
                $inside = !$inside;
            }
        }
        return $inside;
    }
}
