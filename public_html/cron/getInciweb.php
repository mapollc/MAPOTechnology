<?
ini_set('display_errors', 1);
error_reporting(E_PARSE && E_ERROR);
$start_time = microtime(true);

include_once '../config.inc.php';
include_once '../apis/functions.inc.php';

function convertLL($d, $m, $s)
{
    $decimal = $d + ($m / 60) + ($s / 3600);
    $str = rtrim(sprintf('%.12f', $decimal), '0');
    if (preg_match('/(\d)(\1+)$/', $str, $matches)) {
        $digit = $matches[1];
        $str = preg_replace('/' . $digit . '+$/', $digit, $str);
    }

    return floatval($str);
}

function getIncident($url, $timeout = 30)
{
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_ENCODING => '',
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0 Safari/537.36',
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $html = curl_exec($ch);

    if ($html === false) $html = '';

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($httpCode >= 400) $html = '';

    return $html;
}

function formatTime($date)
{
    return strtotime(substr($date, 0, 19) . '+00:00');
}

class InciwebParser
{
    private DOMDocument $dom;
    private DOMXPath $xpath;
    private array $coords;
    private ?int $year;
    private array $allKeys;
    private ?int $updated;

    public function __construct($html)
    {
        libxml_use_internal_errors(true);

        $this->dom = new DOMDocument();
        $this->dom->loadHTML($html);

        libxml_clear_errors();

        $this->xpath = new DOMXPath($this->dom);

        $this->coords = [];
        $this->year = null;
        $this->allKeys = [];
        $this->updated = null;
    }

    private function clean($node)
    {
        $ems = $this->xpath->query(".//em", $node);

        foreach ($ems as $em) {
            $wordCount = str_word_count(trim($em->textContent));

            if ($wordCount > 10) {
                while ($em->firstChild) {
                    $em->parentNode->insertBefore($em->firstChild, $em);
                }

                $em->parentNode->removeChild($em);
            }
        }
    }

    private function formatLinks($node)
    {
        $links = $this->xpath->query(".//a", $node);

        foreach ($links as $link) {
            if (str_contains($link->getAttribute('href'), 'inciweb.wildfire.gov')) {
                while ($link->firstChild) {
                    $link->parentNode->insertBefore($link->firstChild, $link);
                }

                $link->parentNode->removeChild($link);
                continue;
            }

            $link->setAttribute('target', '_blank');
            //$link->setAttribute('rel', 'noopener noreferrer');
        }

        return $node;
    }

    private function innerHTML($node)
    {
        $html = '';

        foreach ($node->childNodes as $child) $html .= $node->ownerDocument->saveHTML($child);

        $html = str_replace(
            ['’', '‘‘', '’’', '–'],
            ["'", '"', '"', '-'],
            $html
        );
        $html = trim(
            str_replace(
                html_entity_decode('&nbsp;'),
                '',
                $html
            )
        );

        $html = preg_replace('/<([A-Za-z]+)><\/([A-Za-z]+)>/', '', $html);

        return $html;
    }

    public function getGeo()
    {
        global $con;

        $state = getState($this->coords);
        $timezone = getTimezone($this->coords);
        $geo = getLocation($con, $this->coords);

        return [
            'state' => $state ?? null,
            'timezone' => $timezone ?? null,
            'geo' => $geo ?? null
        ];
    }

    private function parseItems($key, $value)
    {
        if ($key == 'Coordinates') {
            $coords = null;
            preg_match_all('/([0-9.]+)/', str_replace('  ', '', strip_tags($value)), $matches);
            $c = $matches[0];

            $coords = count($c) == 6
                ? [convertLL($c[0], $c[1], $c[2]), -convertLL($c[3], $c[4], $c[5])]
                : [($c[0] + ($c[1] / 60)), - ($c[2] + $c[3] / 60)];

            $value = implode(', ', $coords);
            $this->coords = $coords;
        }

        if ($key == 'Date of Origin') {
            $date = strtotime(str_replace(' -', '', strip_tags($value)));
            $this->year = date('Y', $date);
        }

        /*if ($key == 'Current as of') {
            $value = [
                'desc' => 'Last Updated',
                'info' => date('D, M j, Y g:i A T', strtotime(str_replace(' - ', ' ', $value)))
            ];
        }

        if ($key == 'Date of Origin') {
            $value = [
                'desc' => 'Fire Discovered',
                'info' => date('D, M j, Y g:i A T', strtotime(str_replace(' - ', ' ', $value)))
            ];
        }*/
        if ($key == 'Current as of') {
            $key = 'Last Updated';
            $value = date('D, M j, Y g:i A T', strtotime(str_replace(' - ', ' ', $value)));
        }

        if ($key == 'Date of Origin') {
            $key = 'Fire Discovered';
            $value = date('D, M j, Y g:i A T', strtotime(str_replace(' - ', ' ', strip_tags($value))));
        }

        if ($key == 'Size') {
            preg_match('/([0-9.,]+)/', $value, $a);
            $acreage = floatval(str_replace(',', '', $a[1]));
            $value = number_format($acreage);
        }

        if ($key == 'Percent of Perimeter Contained') $key = 'Containment';
        if ($key == 'Estimated Containment Date') $value = date('D, M j, Y', strtotime("$value 00:00:00"));

        $key = trim(rtrim($key, ':'), ' ');

        return ['desc' => $key, 'info' => $value];
    }

    private function data($category)
    {
        $data = [];
        $rows = $this->xpath->query("//div[contains(@class,'$category')]//table//tr");
        if (!$rows) return null;

        foreach ($rows as $row) {
            $key = trim($this->xpath->evaluate("string(.//th)", $row));
            $td = $this->xpath->query(".//td", $row)->item(0);

            $parse = $this->parseItems($key, $this->innerHTML($td));

            if ($key !== '' && !in_array($parse['desc'], $this->allKeys)) {
                $data[] = $parse;
            }

            if ($parse['desc'] === 'Last Updated') {
                $this->updated = strtotime($parse['info']);
            }

            $this->allKeys[] = $parse['desc'];
        }

        return $data;
    }

    public function incidentOverview()
    {
        $nodes = $this->xpath->query("//div[@class='incident-overview-copy']");
        $node = $nodes->item(0);

        if (!$node) return null;

        $this->clean($node);
        $this->formatLinks($node);

        return $this->innerHTML($node);
    }

    public function getData()
    {
        $output = [];
        $cats = [
            'Basic Information' => 'basic-information',
            'Current Situation' => 'current-situation',
            'Outlook' => 'outlook',
            'Current Weather' => 'current-weather'
        ];

        foreach ($cats as $cat => $id) {
            $output[$cat] = $this->data($id);
        }

        return $output;
    }

    public function articles()
    {
        $wrapper = $this->xpath->query(
            "(//div[contains(@class,'recent-articles')])[1]"
        )->item(0);

        if (!$wrapper) return [];

        $lis = $this->xpath->query(".//div[contains(@class,'article-item-row')]", $wrapper);

        if (!$lis) return [];

        $articles = [];
        foreach ($lis as $li) {
            $link = $this->xpath->query(".//a", $li)->item(0);

            if (!$link) continue;

            $articles[] = [
                'title' => trim(preg_replace('/\s{2,}/', ' ', $link->textContent)),
                'url' => str_replace('/incident-publication/', '', $link->getAttribute('href')),
                'published' => formatTime($this->xpath->query(".//time", $li)->item(0)?->getAttribute('datetime'))
            ];
        }

        return $articles;
    }

    private function cleanContacts($text)
    {
        return trim(preg_replace('/\s+/u', ' ', str_replace("\xC2\xA0", ' ', implode('<br>', $text))));
    }

    private function unitInfo()
    {
        $wrapper = $this->xpath->query(
            "(//div[contains(@class,'units-main-fields-wrapper')])[1]"
        )->item(0);

        if (!$wrapper) return null;

        $lines = [];

        // Agency
        $agency = $this->xpath->query("./div[contains(@class,'unit-field-item')][1]", $wrapper)->item(0);
        if ($agency) {
            $lines[] = $agency->textContent;
        }

        // Street address
        $street = $this->xpath->query("./div[contains(@class,'unit-field-item')][2]", $wrapper)->item(0);
        if ($street) {
            $lines[] = $street->textContent;
        }

        // City, State ZIP
        $cityStateZip = [];
        foreach ($this->xpath->query("./div[contains(@class,'units-city-state-zip')]/div[contains(@class,'unit-field-item')]", $wrapper) as $item) {
            $cityStateZip[] = $item->textContent;
        }

        if ($cityStateZip) $lines[] = implode(' ', $cityStateZip);

        return $this->cleanContacts($lines);
    }

    private function pio()
    {
        $contact = $this->xpath->query(
            "(//div[contains(@class,'contact-information')])[1]"
        )->item(0);

        if (!$contact) return null;

        $lines = [];

        // Added: PIO name
        $name = $this->xpath->query("./div[contains(@class,'contact-name')]", $contact)->item(0);
        if ($name) {
            $lines[] = $name->textContent;
        }

        // Added: Contact fields (Email, Phone, Hours, etc.)
        foreach ($this->xpath->query("./div[contains(@class,'contact-field')]", $contact) as $field) {

            $label = $this->xpath->query(".//span[contains(@class,'field-label')]", $field)->item(0);
            $value = $this->xpath->query(".//span[contains(@class,'field-content')]", $field)->item(0);

            if (!$label || !$value) {
                continue;
            }

            $lines[] = sprintf(
                '%s %s',
                rtrim($label->textContent, ':'),
                $value->textContent
            );
        }

        return $this->cleanContacts($lines);
    }

    public function contacts()
    {
        return [
            'contact' => $this->unitInfo(),
            'pio' => $this->pio()
        ];
    }

    public function getPhoto()
    {
        $img = $this->xpath->query(
            "(//div[contains(@class,'incident-overview-image-container')]//img)[1]"
        )->item(0);

        if (!$img) return [null, null];

        $cleanUrl = explode('?', str_replace(
            'https://inciweb-prod-media-bucket.s3.us-gov-west-1.amazonaws.com/',
            '',
            html_entity_decode($img->getAttribute('src'))
        ))[0];

        return [
            $cleanUrl,
            $img->getAttribute('alt') ? html_entity_decode($img->getAttribute('alt')) : null
        ];
    }

    public function name()
    {
        $node = $this->xpath->query(
            "//div[contains(@class,'incident-main-content-wrapper')]"
        )->item(0)->textContent;

        preg_match_all('/var phpCurrentIncidentName = "((.|\n)*?)";/', $node, $n);

        return str_replace([' Fire', '&amp;'], ['', '&'], $n[1][0]);
    }

    public function getYear()
    {
        return $this->year ?? date('Y');
    }

    public function lastUpdated()
    {
        return $this->updated ?? 0;
    }
}

$sqlQueries = [];
$inciwebFires = [];
$start = strtotime('1/1/' . date('Y') . ' 00:00:00 PDT');
$end = strtotime('12/31/' . date('Y') . ' 23:59:59 PDT');

$json = json_decode(file_get_contents('https://inciweb.wildfire.gov/api/util/all_select_data'), true);

foreach ($json as $fire) {
    $parts = explode(' - ', $fire['text']);
    $link = strtolower("$parts[1]-" . str_replace(' ', '-', $parts[0]));
    $updated = formatTime($fire['updated_date']);

    if ($fire['type'] == 'state' || time() - $updated > 86400) continue;

    $inciwebFires[] = [
        'id' => $fire['id'],
        'link' => $link,
        'updated' => $updated
    ];
}

$count = 0;

////for ($i = 2; $i < 3; $i++) {
for ($i = 0; $i < count($inciwebFires ?? []); $i++) {
    $time = time();
    $stat = [];

    $iid = $inciwebFires[$i]['id'];
    $link = "https://inciweb.wildfire.gov/incident-information/{$inciwebFires[$i]['link']}";
    $updated = $inciwebFires[$i]['updated'];

    ////if ($iid != '328877') continue;

    $file = getIncident($link);
    $parser = new InciwebParser($file);

    $data = $parser->getData();
    $name = $parser->name();
    $year = $parser->getYear();
    $incidentInfo = mysqli_real_escape_string($con, $parser->incidentOverview());
    $geo = $parser->getGeo();
    $state = $geo['state'];

    $articles = mysqli_real_escape_string($con, json_encode($parser->articles()));
    $contact = mysqli_real_escape_string($con, json_encode($parser->contacts()));
    $pic = $parser->getPhoto();
    $photo = $pic[0] == null || $pic[1] == null ? '' : mysqli_real_escape_string($con, json_encode($pic));

    $arcgis = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=IncidentName+LIKE+%27%25" . strtolower(str_replace(' ', '+', $name)) . "%25%27+AND+POOState+%3D+%27US-$state%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=UniqueFireIdentifier%2CContainmentDateTime%2CControlDateTime%2CFireOutDateTime&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&returnZ=false&returnM=false&returnExceededLimitFeatures=true&sqlFormat=none&f=geojson";
    $json = json_decode(file_get_contents($arcgis));
    $incidentNum = $json->features[0]->properties->UniqueFireIdentifier ?? "$year-NWCG-$iid";

    if (!empty($json->features) && is_array($json->features)) {
        if ($json->features[0]->properties->ContainmentDateTime) {
            $stat['Contain'] = round($json->features[0]->properties->ContainmentDateTime / 1000);
        }
        if ($json->features[0]->properties->ControlDateTime) {
            $stat['Control'] = round($json->features[0]->properties->ControlDateTime / 1000);
        }
        if ($json->features[0]->properties->FireOutDateTime) {
            $stat['Out'] = round($json->features[0]->properties->FireOutDateTime / 1000);
        }
    }

    $acres = $acreage ?? 0;
    $incidentType = str_contains($name, 'Prescribed') || str_contains($name, 'Pile Burning') || str_contains($name, ' RX')
        ? 'Prescribed Fire' : (str_contains($name, ' Complex') ? 'Complex' : 'Wildfire');
    $content = mysqli_real_escape_string($con, json_encode(['data' => $data]));
    $status = $stat ? (count($stat) == 0 ? '' : json_encode($stat)) : '';

    // add or update to inciweb database
    $sqlQueries[] = "INSERT INTO inciweb (incident_id,state,year,name,incident_info,data,articles,contact,photo,captured,updated)
        VALUES('$iid','$state',$year,'$name','$incidentInfo','$content','$articles','$contact','$photo','$time','$time')
    ON DUPLICATE KEY UPDATE
        incident_id = VALUES(incident_id),
        state = '$state',
        year = '$year',
        name = VALUES(name),
        incident_info = '$incidentInfo',
        data = '$content',
        articles = '$articles',
        photo = '$photo',
        contact = '$contact',
        updated = '$updated'";

    // update wildfires database
    $sqlQueries[] = "UPDATE wildfires SET acres = CASE WHEN '$acres' > acres THEN '$acres' ELSE acres END WHERE incidentID = '$incidentNum'";

    $count++;

    echo 'Processed ' . ($i + 1) . ' of ' . count($inciwebFires ?? []) . ' incidents from Inciweb...' . PHP_EOL;
}

if (!empty($sqlQueries)) {
    $runQueries = implode(';', $sqlQueries);

    $runSQL = mysqli_multi_query($con, $runQueries);
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
}

echo "Completed adding/updating $count Inciweb incidents..." . PHP_EOL;

mysqli_close($con);