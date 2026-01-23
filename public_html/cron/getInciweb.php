<?
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);
$start_time = microtime(true);

include '/home/mapo/public_html/db.ini.php';
include '/home/mapo/public_html/apis/functions.inc.php';

$start = strtotime('1/1/' . date('Y') . ' 00:00:00 PDT');
$end = strtotime('12/31/' . date('Y') . ' 23:59:59 PDT');

function stripTags($string)
{
    $tags = ['h3', 'img', 'div', 'a', 'span'];
    foreach ($tags as $tag) {
        $string = preg_replace("/<\/?$tag(.|\s)*?>/", '', $string);
    }
    return $string;
}

function removeBreaks($s)
{
    preg_match_all('/<br \/><br \/>(.*?\s)<br \/><br \/>/', $s, $out);
    foreach ($out[0] as $i => $match) {
        $s = str_replace($match, '<p>' . trim($out[1][$i]) . '</p>', $s);
    }
    preg_match_all('/<b>([A-Za-z0-9\s.,)(]+)<\/b>/', $s, $out2);
    foreach ($out2[0] as $i => $match) {
        $s = str_replace($match, trim($out2[1][$i]), $s);
    }
    return $s;
}

function format($t)
{
    $t = trim(str_replace(['<p></p>', '<br /><br /></p>', '<br /> <br /></p>', 'h2>'], ['', '</p>', '</p>', 'p>'], preg_replace('/\\r\\n/', '', $t)));
    $t = stripTags(preg_replace('/<a((.|\n)*?)>((.|\n)*?)<\/a>(\s{1,})\|(\s{1,})<a((.|\n)*?)>((.|\n)*?)<\/a>(\s{1,})\|(\s{1,})<a((.|\n)*?)>((.|\n)*?)<\/a>/', '', $t));
    preg_match_all('/((.|\n)*?)<br \/>(\s?)<br \/>/', $t, $output);

    if (count($output[1]) > 0) {
        $r = '';
        foreach ($output[1] as $line) $r .= "<p>$line</p>";
    } else $r = $t;

    $r = str_replace('<p> Announcements         Closures          News          Photographs          Videos         Maps <br /></p>', '', $r);
    $r = trim(preg_replace('/<p>(\s|)<\/p>/', '', str_replace(['<p> <br />', '<p><p>', 'em>'], ['<p>', '<p>', 'i>'], $r)));
    return preg_replace('/<p>(\s+)<\/p>/', '', $r);
}

function getPhoto($file)
{
    global $con;

    preg_match('/<div class="image-container">(?:\s*(.|\n)*?\s*)<\/div>/', $file, $imgs);
    if (!isset($imgs[0])) return '';
    preg_match('/src="(.*?)"/', $imgs[0], $urls);
    preg_match('/alt="(.*?)"/', $imgs[0], $meta);

    $url = isset($urls[1]) ? explode('?', str_replace('https://inciweb-prod-media-bucket.s3.us-gov-west-1.amazonaws.com/', '', $urls[1]))[0] : '';
    $meta = isset($meta[1]) ? mysqli_real_escape_string($con, rtrim(str_replace('&quot;', '"', $meta[1]), ' ')) : '';
    return $url ? serialize([$url, $meta]) : '';
}

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

function getIncidentInfo($file)
{
    $iinfo = explode('</div>', explode('<div class="incident-overview-copy">', $file)[1])[0];
    $iinfo = preg_replace(
        '/<p><span lang="EN-US"><\/span><span>&nbsp;<\/span><\/p>/',
        '',
        str_replace(
            ['<p>&nbsp;</p>', '<h5>&nbsp;</h5>', '<strong>', '</strong>', '</a>&nbsp;</p>', '</a>nbsp;', '“', '”', '’', ' lang="EN-US"', '<span>&nbsp;</span>'],
            ['', '', '<b>', '</b>', '</a></p>', '</a> ', '"', '"', '\'', '', ''],
            $iinfo
        )
    );
    $iinfo = preg_replace('/<p><b>(DAILY UPDATES|Updates)<\/b>:(.*?)<\/p>/', '', preg_replace('/([\s|&nbsp;]+?)<a href="(.*?)">(.*?)<\/a>([\s&nbsp;]+?)/', '', $iinfo));
    $iinfo = preg_replace('/<\/span>&nbsp;<\/p>/', '</span></p>', preg_replace('/<a href="(.*?)">[<span>|<b>]+(.*?)[<\/span>|<\/b>]+<\/a>/', '<a href="$1">$2</a>', $iinfo));
    $iinfo = preg_replace('/(<p>([<span>|<\/span>|&nbsp;]+)<\/p>)/', '', $iinfo);
    $iinfo = ltrim(rtrim($iinfo));

    return $iinfo == '<p></p>' ? '' : $iinfo;
}

////$ss = json_decode(file_get_contents('/home/mapo/public_html/cron/states.json'));
////$tzs = json_decode(file_get_contents('/home/mapo/public_html/cron/timezones.json'))->features;
$xml = simplexml_load_file('https://inciweb.wildfire.gov/incidents/rss.xml');
#$xml = simplexml_load_file('./inciweb.xml');
$count = 0;
$sqlQueries = '';

////for ($i = 16; $i < 17; $i++) {
for ($i = 0; $i < count($xml->channel->item); $i++) {
    #if (strpos($xml->channel->item[$i]->title, 'Badland Complex') !== false) {
    $link = $xml->channel->item[$i]->link;
    $file = file_get_contents($link);
    $iid = $xml->channel->item[$i]->guid[0];
    $desc = $xml->channel->item[$i]->description;

    $photo = getPhoto($file);

    preg_match_all('/var phpCurrentIncidentName = "((.|\n)*?)";/', $file, $n);
    preg_match_all('/\/([a-z]{5,})\-/', $link, $gi);

    $unitID = strtoupper($gi[1][1]);
    $name = str_replace([' Fire', '&amp;'], ['', '&'], $n[1][0]);
    $time = time();
    $data = [];
    $combin = '';

    // get the incident overview
    $incidentInfo = mysqli_real_escape_string($con, getIncidentInfo($file));

    /* get fire unit and agency pio contact info */
    $br1 = explode('<div class="agency-logo">', explode('<div class="units-main-fields-wrapper">', $file)[1])[0];
    $br2 = explode('<div class="incident-menu-section">', explode('<div class="contact-information">', $file)[1])[0];

    preg_match_all('/(?<=<div class="unit-field-item">)(.*?)(?=<\/div>)/sm', $br1, $p);
    $aa = array_map(fn($l) => str_replace('&nbsp;', '', trim(strip_tags($l))), $p[1] ?? []);

    $who = $aa[1] != ($aa[3] ?? '')
        ? implode('<br>', [$aa[0], $aa[1], $aa[2] ?? '', $aa[3] ?? '', $aa[4] ?? ''])
        : implode('<br>', [$aa[0], $aa[2] ?? '', $aa[3] ?? '', $aa[4] ?? '']);

    preg_match_all('/<div class="contact-[a-z]+">(.*?)(?=<\/div>)/sm', $br2, $q);
    $pio = '';

    foreach ($q[1] ?? [] as $l) {
        preg_match_all('/<s(.*?)>(.*?)<\/s(.*?)>/sm', $l, $b);
        $lab = trim($b[2][0] ?? '');
        $val = trim($b[2][1] ?? '');
        if ($lab && $val) $pio .= "<b>$lab</b> $val<br>";
    }
    $contact = mysqli_real_escape_string($con, serialize(['contact' => $who, 'pio' => rtrim($pio, '<br>')]));

    // get all the data from the tables
    $tables = array('basic-information', 'current-situation', 'outlook', 'current-weather');
    $replacement = ['Coordinatess', 'Current as of', 'Date of Origin'];
    $coords = [];
    $stat = [];

    foreach ($tables as $table) {
        preg_match_all(
            '/<div class="' . $table . ' tablet:grid-col-6">((.|\n)*?)<\/div>/',
            preg_replace(
                '/<time datetime="((.|\n)*?)">((.|\n)*?)<\/time>/',
                '$3',
                preg_replace('/<div class="margin-right-3px">((.|\n)*?)<\/div>/', '$1', $file)
            ),
            $output
        );
        preg_match_all('/<tr>((.|\n)*?)<\/tr>/', $output[1][0], $rows);
        $allHeads = [];

        // get each row in the table
        foreach ($rows[1] ?? [] as $r) {
            preg_match_all('/<th((.|\n)*?)>((.|\n)*?)<\/th>/', $r, $title);
            preg_match_all('/<td((.|\n)*?)>((.|\n)*?)<\/td>/', $r, $val);

            $head = rtrim(trim($title[3][0]), ':');
            $cat = ucwords(str_replace('-', ' ', $table));
            $value = str_replace('&nbsp;', ' ', str_replace('<br />
', '<br>', trim(stripTags($val[3][0]))));
            //$acres = 0;

            if (in_array($head, $allHeads)) continue;

            // format specific pieces of data
            if ($head == 'Coordinates') {
                preg_match_all('/([0-9.]+)/', str_replace('  ', '', $value), $c);
                if (count($c[0]) == 6) {
                    $coords = [convertLL($c[0][0], $c[0][1], $c[0][2]), -convertLL($c[0][3], $c[0][4], $c[0][5])];
                } else {
                    $coords = [($c[0][0] + ($c[0][1] / 60)), - ($c[0][2] + $c[0][3] / 60)];
                }

                $value = implode(', ', $coords);
                $state = getState($coords);
                $timezone = getTimezone($coords);
                $geo = getLocation($con, $coords);
            }

            if ($head == 'Date of Origin') {
                $date = strtotime(str_replace(' -', '', $value));
                $year = date('Y', $date);
            }

            if ($head == 'Size') {
                preg_match('/([0-9.,]+)/', $value, $a);
                $acreage = floatval(str_replace(',', '', $a[1]));
                $value = number_format($acreage);
            }

            if ($head == 'Percent of Perimeter Contained') $head = 'Containment';

            if ($cat == 'Outlook') $value = str_replace(['<p>', '</p>'], ['', '<br>'], $value);

            if ($head == 'Current as of') {
                $data[$cat][] = [
                    'desc' => 'Last Updated',
                    'info' => date('D, M j, Y g:i A T', strtotime(str_replace(' - ', ' ', $value)))
                ];
            }

            if ($head == 'Date of Origin') {
                $data[$cat][] = [
                    'desc' => 'Fire Discovered',
                    'info' => date('D, M j, Y g:i A T', strtotime(str_replace(' - ', ' ', $value)))
                ];
            }

            if ($head == 'Estimated Containment Date') $value = date('D, M j, Y', strtotime($value . ' 00:00:00'));

            if ($head == 'Projected Incident Activity') {
                $new = '';

                preg_match_all('/([0-9]{2})\shours:\s?([A-Za-z0-9\#\'\"\(\)\s\.\,\-]+)/', $value, $lines);

                foreach ($lines[0] as $l) {
                    $new .= '<p>' . $l . '</p>';
                }
                $value = preg_replace('/(<br>\s*)+$/i', '', $new ? $new : $value);
            }

            if (!in_array($head, $replacement)) {
                $data[$cat][] = [
                    'desc' => $head,
                    'info' => preg_replace(
                        '/(<br>\s*)+$/i',
                        '',
                        strip_tags(str_replace('&amp;', '&', preg_replace('/\n/', '', $value)), '<br><p>')
                    )
                ];
            }

            $allHeads[] = $head;
        } // end row loops
    } // end table loops

    if (date('Y') == $year) {
        $json = json_decode(file_get_contents("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=IncidentName+LIKE+%27%25" . strtolower(str_replace(' ', '+', $name)) . "%25%27+AND+POOState+%3D+%27US-$state%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=UniqueFireIdentifier%2CContainmentDateTime%2CControlDateTime%2CFireOutDateTime&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&returnZ=false&returnM=false&returnExceededLimitFeatures=true&sqlFormat=none&f=geojson"));
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
        $content = mysqli_real_escape_string($con, serialize(array('data' => $data)));
        $status = $stat ? (count($stat) == 0 ? '' : serialize($stat)) : '';

        // add or update to inciweb database
        $sqlQueries .= "INSERT INTO inciweb (incident_id,state,year,name,incident_info,data,contact,photo,captured,updated)
            VALUES('$iid','$state','$year','$name','$incidentInfo','$content','$contact','$photo','$time','$time')
            ON DUPLICATE KEY UPDATE incident_id = VALUES(incident_id), state = '$state', year = '$year', name = VALUES(name), incident_info = '$incidentInfo', data = '$content', photo = '$photo', contact = '$contact', captured = VALUES(captured), updated = '$time';";

        // add or update to wildfires database
        $sqlQueries .= "UPDATE wildfires SET acres = CASE WHEN '$acres' > acres THEN '$acres' ELSE acres END WHERE incidentID = '$incidentNum';";
        /*$sqlQueries .= "INSERT INTO wildfires (incidentID,state,agency,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display,owner)
            VALUES('$incidentNum','$state','','$year','$date','$name','$incidentType','$coords[0]','$coords[1]','$geo','$acres','$status','','','','$time','$time','$timezone','1','system')
            ON DUPLICATE KEY UPDATE incidentID = VALUES(incidentID), state = '$state', agency = VALUES(agency), year = VALUES(year), date = VALUES(date), name = '$name', 
            type = VALUES(type), lat = '$coords[0]', lon = '$coords[1]', geo = '$geo', acres = '$acres', status = VALUES(status), notes = '', resources = '', fuels = '', captured = VALUES(captured), updated = '$time', timezone = VALUES(timezone), display = VALUES(display), owner = VALUES(owner);";*/

        $count++;
    }

    echo 'Processed ' . ($i + 1) . ' of ' . count($xml->channel->item) . ' incidents from Inciweb...
';
    #}
}

////echo $sqlQueries;
$runSQL = mysqli_multi_query($con, $sqlQueries);
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

echo 'Completed adding/updating ' . $count . ' Inciweb incidents...
';

mysqli_close($con);
