<?
set_time_limit(900);
ini_set('display_errors',1);
ini_set('memory_limit','1024M');
include('/home/mapo/public_html/db.ini.php');
include_once('/home/mapo/public_html/apis/functions.inc.php');
$ss = json_decode(file_get_contents('/home/mapo/public_html/cron/states.json'));
$tzs = json_decode(file_get_contents('/home/mapo/public_html/cron/timezones.json'))->features;

#$dispatchCenters = array('AKCGFC','AKTNFC','ALAIC','AR-AOC','AZ-ADC','AZ-FDC','AZ-PDC','AZ-PHC','AZ-SDC','AZ-TDC','AZ-WDC','CA-ANF','CA-CNF','CA-FICC','CA-GVCC','CA-MICC','CA-ONCC','CA-OVICC','CA-PNF','CA-SNF','CA-STF','CA-YICC','CA-YNP','CALPF','CAMNF','CANCIC','CARICC','CCICC','CO-CRC','CO-FTC','CO-GJC','CO-MTC','CODRC','COPBC','FL-FIC','GAGIC','ID-CDC','ID-GVC','ID-SCC','IDBDC','IDCIC','IDEIC','IDPAC','ILILC','IN-IIC','KY-KIC','LALIC','MI-MIDC','MN-MNCC','MOMOC','MS-MIC','MT-BRC','MT-DDC','MT-GDC','MT-HDC','MT-KDC','MT-KIC','MT-LEC','MT-MDC','MTBDC','NC-NCC','NDNDC','NH-NEC','NM-ABC','NM-ADC','NM-SDC','NM-SFC','NMTDC','NVCNC','NVECC','NVEIC','NVLIC','NVSFC','OR-BIC','OR-COC','OR-EIC','OR-JDCC','OR-RICC','OR-RVC','OR-VAC','ORBMC','ORLFC','PA-MACC','SC-SCC','SC-SRF','SD-GPC','TN-TNC','TX-TIC','UT-CDC','UT-MFC','UT-NUC','UT-RFC','UT-UBC','VAVIC','WA-CWC','WA-NDC','WA-NEC','WA-OLC','WA-PCC','WA-PSC','WACAC','WACCC','WICC','WY-CDC','WY-CPC','WY-TDC');
include_once('dispatch.inc.php');
$dispatchCenters = $oldDispatchCenters;

foreach($dispatchCenters as $center) {
    #$center = 'SDGPC';
    $page = array('recent','open');
    $usfsIDs = array();
    $sqlQueries = '';
    $count = 0;

    #foreach($page as $p) {
        // Get data from wildcad and figure out which columns are what fields
        // then set the array position for that field
        #$url = file_get_contents('http://www.wildcad.net/WC'.$center.$p.'.htm');
        $url = file_get_contents('/home/mapo/public_html/cron/cache/'.$center.'.html');
        preg_match_all('/<TD align=center bgColor="\#eeeeee">([A-Za-z\#\s\/]+)<\/TD>/', $url, $columns);

        $colDate = array_search('Date', $columns[1]);
        $colInc = array_search('Inc #', $columns[1]);
        $colName = array_search('Name', $columns[1]);
        $colType = array_search('Type', $columns[1]);
        $colLat = array_search('Lat/Lon', $columns[1]);
        $colLoc = array_search('Location', $columns[1]);
        $colAcres = array_search('Acres', $columns[1]);
        $colStat = array_search('Status', $columns[1]);
        $colNotes = array_search('WebComment', $columns[1]);
        $colRes = array_search('Resources', $columns[1]);
        $colFuel = array_search('Fuels', $columns[1]);

        // Set the time CAD was last updated
        preg_match('/Prepared ([0-9\/:\s]+)/', $url, $updated);
        $lastUpdated = strtotime($updated[1]);

        // iterate through rows of incidents
        $rows = explode('<TR>', $url);
        for ($i = 3; $i < count($rows); $i++) {
            preg_match_all('/<TD align="CENTER" bgcolor="#FFFFCC"><font size="2">(.*?)<\/font><\/TD>/', $rows[$i], $data);
            if ($colType == '') {
                $incidentType = 'Wildfire';
            } else {
                $incidentType = $data[1][$colType];
            }
            $coords = latLon($data[1][$colLat]);

            // Only proccess data if it is the following types of incidents
            if (($incidentType == 'Prescribed Fire' || $incidentType == 'Wildfire' || $incidentType == 'Smoke Check' || $incidentType == 'Smoke check') && $coords[0] != '' && $coords[1] != '' && $coords[0] != '.' && $coords[1] != '.') {
                $date = strtotime(str_replace('-', '/', $data[1][$colDate]));
                $state = getState($coords, $ss);
                #$incidentNum = incNum($date, $state, $data[1][$colInc]);
                $incidentNum = incNum($date, $state, $data[1][$colInc]);

                // Only process data if we haven't already done this incident ID
                if (!in_array($incidentNum, $usfsIDs)) {
                    $time = time();
                    $year = date('Y', $date);
                    $timezone = getTimezone($coords, $tzs);
                    $name = incidentName($data[1][$colName], $incidentNum);
                    $incidentType = (strpos($name, ' RX') !== FALSE ? 'Prescribed Fire' : $incidentType);
                    $acres = ($data[1][$colAcres] == '.' ? 'Unknown' : floatval($data[1][$colAcres]));
                    $notes = (strlen($colNotes) == 0 || $data[1][$colNotes] == '.' ? '' : ucfirst(strtolower($data[1][$colNotes])));
                    $status = (strlen($colStat) == 0 || $data[1][$colStat] == '.' ? '' : serialize(status($data[1][$colStat])));
                    $fuels = (strlen($colFuel) == 0 || $data[1][$colFuel] == '.' ? '' : $data[1][$colFuel]);
                    $resources = (strlen($colRes) == 0 || $data[1][$colRes] == '.' ? '' : $data[1][$colRes]);
                    $geo = getLocation($con, $coords);

                    // prepare mysql statements
                    $sqlQueries .= "INSERT INTO wildfires (incidentID,state,agency,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display)
                    VALUES('$incidentNum','$state','$center','$year','$date','$name','$incidentType','$coords[0]','$coords[1]','$geo','$acres','$status','$notes','$resources','$fuels','$time','$time','$timezone','1')
                    ON DUPLICATE KEY UPDATE state = '$state', name = '$name', type = '$incidentType', lat = '$coords[0]', lon = '$coords[1]', geo = '$geo', acres = '$acres', status = '$status', notes = '$notes', resources = '$resources', fuels = '$fuels', timezone = '$timezone', updated = '$time';";

                    $sqlQueries .= "UPDATE dispatch_centers SET cad_update = '$time' WHERE agency = '$center';";
                    $count++;
                }

                // add FS incident ID to array to reduce duplicated work
                $usfsIDs[] = $incidentNum;
            }
        }
        #break;
    #}

    // add or update wildfires in database
    #echo $sqlQueries;
    if (mysqli_multi_query($con, $sqlQueries)) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) { }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) { }
        } while (mysqli_next_result($con));
    }

    echo 'Finished with '.$center.' (modified '.$count.' incidents)...
';
}

mysqli_close($con);