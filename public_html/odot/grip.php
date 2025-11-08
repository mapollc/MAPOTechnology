<?
include_once '../db.ini.php';
#header('Content-Type: text/csv');

$segments = '[{"name":"N Douglas County Line","hwy":"I5","mileposts":[160,168]},{"name":"Rice Hill","hwy":"I5","mileposts":[146.490000000000009094947017729282379150390625,148.490000000000009094947017729282379150390625]},{"name":"Roberts Mt Hill","hwy":"I5","mileposts":[115,118]},{"name":"Canyon Creek Pass","hwy":"I5","mileposts":[87.400000000000005684341886080801486968994140625,99.099999999999994315658113919198513031005859375]},{"name":"Sexton Pass To Stage Pass NB","hwy":"I5","mileposts":[66,81]},{"name":"Sexton Pass To Stage Pass SB","hwy":"I5","mileposts":[81,66]},{"name":"Siskiyou Summit SB","hwy":"I5","mileposts":[11,1]},{"name":"Siskiyou Summit NB","hwy":"I5","mileposts":[1,11]},{"name":"Cascade Locks - Hood River","hwy":"I84","mileposts":[44,64]},{"name":"Troutdale - Cascade Locks","hwy":"I84","mileposts":[13.0299999999999993605115378159098327159881591796875,44]},{"name":"Hood River - the Dalles","hwy":"I84","mileposts":[64,87]},{"name":"The Dalles - Rufus","hwy":"I84","mileposts":[87,112]},{"name":"Arlington","hwy":"I84","mileposts":[112,150]},{"name":"Hermiston","hwy":"I84","mileposts":[167.580000000000012505552149377763271331787109375,193]},{"name":"Pendleton","hwy":"I84","mileposts":[193,215.990000000000009094947017729282379150390625]},{"name":"Perry WB","hwy":"I84","mileposts":[261,250]},{"name":"Perry EB","hwy":"I84","mileposts":[250,261]},{"name":"Meacham WB","hwy":"I84","mileposts":[250,226]},{"name":"Meacham EB","hwy":"I84","mileposts":[226,250]},{"name":"Cabbage Hill WB","hwy":"I84","mileposts":[226,216]},{"name":"Cabbage Hill EB","hwy":"I84","mileposts":[216,226]},{"name":"Ladd Canyon WB","hwy":"I84","mileposts":[280,266]},{"name":"Ladd Canyon EB","hwy":"I84","mileposts":[266,280]},{"name":"Baker Valley","hwy":"I84","mileposts":[285,299.8999999999999772626324556767940521240234375]},{"name":"Pleasant Valley EB","hwy":"I84","mileposts":[300,328]},{"name":"Pleasant Valley WB","hwy":"I84","mileposts":[328,300]},{"name":"Burnt River Canyon","hwy":"I84","mileposts":[328,352]},{"name":"Sunset Summit","hwy":"US26","mileposts":[37.72999999999999687361196265555918216705322265625,45.42999999999999971578290569595992565155029296875]},{"name":"Government Camp","hwy":"US26","mileposts":[42.5,60]},{"name":"Warm Springs Jct","hwy":"US26","mileposts":[67,75.5]},{"name":"Blue Box Pass","hwy":"US26","mileposts":[59.57000000000000028421709430404007434844970703125,67]},{"name":"Ochoco Summit","hwy":"US26","mileposts":[57.2999999999999971578290569595992565155029296875,50]},{"name":"Austin","hwy":"US26","mileposts":[190.469999999999998863131622783839702606201171875,191.30000000000001136868377216160297393798828125]},{"name":"Brogan Hill","hwy":"US26","mileposts":[231.1200000000000045474735088646411895751953125,253.840000000000003410605131648480892181396484375]},{"name":"Eldorado Pass","hwy":"US26","mileposts":[218.43000000000000682121026329696178436279296875,225.229999999999989768184605054557323455810546875]},{"name":"Moro","hwy":"US97","mileposts":[17.96000000000000085265128291212022304534912109375,17.96000000000000085265128291212022304534912109375]},{"name":"Shaniko","hwy":"US97","mileposts":[56.03999999999999914734871708787977695465087890625,56.03999999999999914734871708787977695465087890625]},{"name":"Bend","hwy":"US97","mileposts":[130,145.479999999999989768184605054557323455810546875]},{"name":"South of Bend","hwy":"US97","mileposts":[145.479999999999989768184605054557323455810546875,155.5]},{"name":"Lapine","hwy":"US97","mileposts":[172.18999999999999772626324556767940521240234375,196.419999999999987494447850622236728668212890625]},{"name":"Chemult","hwy":"US97","mileposts":[196.419999999999987494447850622236728668212890625,236.659999999999996589394868351519107818603515625]},{"name":"Chiloquin","hwy":"US97","mileposts":[240.5,243.400000000000005684341886080801486968994140625]},{"name":"Klamath Falls","hwy":"US97","mileposts":[253.900000000000005684341886080801486968994140625,280.16000000000002501110429875552654266357421875]},{"name":"Three Mile Hill","hwy":"I84","mileposts":[352,374]},{"name":"Ontario","hwy":"I84","mileposts":[367,378]},{"name":"Warm Springs Grade","hwy":"US26","mileposts":[99,103]},{"name":"Cow Canyon","hwy":"US97","mileposts":[67.7000000000000028421709430404007434844970703125,80.900000000000005684341886080801486968994140625]}]';
$reports = json_decode($segments);
$diff = 60 * 60 * 1.5;
$csv = 'Snow Zone,RWIS Station,Highway,Start MP,End MP,Time,Time Difference,Temp,Dew point,Grip,Pavement Temp,Road Condition,Chain Restrict
';

foreach ($reports as $rpt) {
    ////if ($rpt->name == 'Ladd Canyon EB') {
        $hwy = $rpt->hwy;
        $mp1 = $rpt->mileposts[0];
        $mp2 = $rpt->mileposts[1];

        $result = mysqli_query($con, "SELECT name, data, time FROM `road_reports` WHERE name = '$rpt->name' ORDER BY time DESC");
        while ($row = mysqli_fetch_assoc($result)) {
            $sql = mysqli_query($con, "SELECT stn, data, time FROM `rwis` WHERE hwy = 'I84' AND ((mp >= $mp1 AND mp <= $mp2) OR (mp >= $mp2 AND mp <= $mp1)) AND ABS($row[time] - time) < $diff ORDER BY time DESC");

            $road = unserialize($row['data']);
            while ($data = mysqli_fetch_assoc($sql)) {
                $wx = unserialize($data['data']);

                $csv .= $row['name'].','.$data['stn'].','.$hwy.','.$mp1.','.$mp2.','.date('n/j/Y g:i A', $data['time']).','.($data['time'] - $row['time']).','.$wx['temp'].','.$wx['dp'].','.$wx['grip'].','.$wx['pavement'][0].','.$road['road']['condition'].','.$road['restrict']['chains']['cond'].'
';
            }
        }
    ////}
}

echo $csv;