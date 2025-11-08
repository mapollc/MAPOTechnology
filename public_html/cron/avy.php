<?
#exit();
ini_set('display_errors', 0);
error_reporting(0);
include_once '../db.ini.php';

function seasonYear($date)
{
    $year = date('Y', $date);

    if ($date < strtotime("9/1/$year 00:00:00")) {
        $year -= 1;
    }

    return $year;
}

if (date('n') < 9) {
    $end = date('Y');
} else {
    $end = date('Y') + 1;
}
$start = $end - 1;

for ($x = $start; $x < $end; $x++) {
    $start = $x;
    $end = 1 + $start;
    $json = json_decode(file_get_contents('https://api.avalanche.state.co.us/api/v2/reports?r[observed_at_gteq]=' . $start . '-09-01&r[observed_at_lteq]=' . $end . '-08-31&r[type_in][]=incident_report&r[type_in][]=accident_report&r[sorts][]=observed_at+desc&r[sorts][]=created_at+desc'));

    for ($i = 0; $i < count($json); $i++) {
        #for ($i = 0; $i < 1; $i++) {
        $rpt = $json[$i];
        $id = $rpt->id;
        $state = $rpt->state;
        $lat = $rpt->latitude;
        $lon = $rpt->longitude;
        $type = str_replace('_report', '', $rpt->type);
        $occurred = strtotime($rpt->observed_at);
        $season = seasonYear($occurred);
        $reportCreated = strtotime($rpt->created_at);
        $reportUpdated = strtotime($rpt->updated_at);
        $location = mysqli_real_escape_string($con, $rpt->public_report_detail->location);
        $activity = $rpt->public_report_detail->activity ? mysqli_real_escape_string($con, $rpt->public_report_detail->activity) : '';
        $travelMode = $rpt->public_report_detail->travel_mode;
        $nearbyAvyCtr = $rpt->public_report_detail->closest_avalanche_center;
        $details = mysqli_real_escape_string($con, json_encode($rpt->public_report_detail));
        $noAvys = $rpt->avalanche_observations_count ? $rpt->avalanche_observations_count : 0;
        $avyDetails = mysqli_real_escape_string($con, json_encode($rpt->avalanche_observations));
        $assets = mysqli_real_escape_string($con, json_encode($rpt->assets));
        $involved = $rpt->involvement_summary;
        $in = $involved->involved ? $involved->involved : 0;
        $caught = $involved->caught ? $involved->caught : 0;
        $killed = $involved->killed ? $involved->killed : 0;

        mysqli_query($con, "INSERT IGNORE INTO avalanche (avy_id,state,season,lat,lon,type,occurred,location,activity,travel_mode,nearby_avy_ctr,details,avalanches,avalanche_details,assets,involved,caught,killed,report_created,report_updated)
        VALUES('$id','$state',$season,$lat,$lon,'$type','$occurred','$location','$activity','$travelMode','$nearbyAvyCtr','$details',$noAvys,'$avyDetails','$assets',$in,$caught,$killed,'$reportCreated','$reportUpdated')
        ON DUPLICATE KEY UPDATE avy_id = VALUES(avy_id),state = VALUES(state),season = VALUES(season),lat = VALUES(lat),lon = VALUES(lon),type = VALUES(type),occurred = VALUES(occurred),location = VALUES(location),activity = VALUES(activity),travel_mode = VALUES(travel_mode),nearby_avy_ctr = VALUES(nearby_avy_ctr),details = VALUES(details),avalanches = VALUES(avalanches),avalanche_details = VALUES(avalanche_details),assets = VALUES(assets),involved = VALUES(involved),caught = VALUES(caught),killed = VALUES(killed),report_created = VALUES(report_created),report_updated = $reportUpdated") or die(mysqli_error($con));

        echo $x . ': Done with ' . ($i + 1) . ' of ' . count($json) . '...
';
    }
}
