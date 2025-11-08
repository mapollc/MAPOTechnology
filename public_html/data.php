<?
include_once('db.ini.php');
$fuels = array('Brush', 'Grass', 'Grass-Shrub', 'Slash', 'Timber');

function mean($arr) {
    return array_sum($arr) / count($arr);
}

function std_dev($arr){
    $num_of_elements = count($arr);
    $variance = 0.0;

    $average = mean($arr);

    foreach ($arr as $i) {
        $variance += pow(($i - $average), 2);
    }

    return round((float)sqrt($variance / $num_of_elements), 4);
}

function std_error($arr) {
    return round(std_dev($arr) / sqrt(count($arr)), 4);
}

function quartile($Array, $Quartile) {
    $pos = (count($Array) + 1) * $Quartile;

    if (fmod($pos, 1) == 0) {
        return $Array[$pos];
    } else {
        $fraction = $pos - floor($pos);

        $lower_num = $Array[floor($pos) - 1];
        $upper_num = $Array[ceil($pos) - 1];

        $difference = $upper_num - $lower_num;

        return $lower_num + ($difference * $fraction);
    }
}

function median($numbers) {
    $length = count($numbers);
    $half_length = $length / 2;
    $median_index = (int) $half_length;
    $median = $numbers[$median_index];

    return $median;
}

for ($i=0; $i<5;$i++) {
    $sql = mysqli_query($con, "SELECT temp, rh, wind, IncidentSize, DiscoveryAcres, InitialResponseAcres FROM data WHERE FuelGroup = '$fuels[$i]'");
    while ($row = mysqli_fetch_assoc($sql)) {
        if ($row['temp']) {
            $temp[$i][] = $row['temp'];
        }
        if ($row['rh']) {
            $rh[$i][] = $row['rh'];
        }
        if ($row['wind']) {
            $wind[$i][] = $row['wind'];
        }

        if ($row['InitialResponseAcres'] < $row['DiscoveryAcres']) {
            $sub = $row['IncidentSize'] - $row['InitialResponseAcres'];
            $growth[$fuels[$i]][] = ($sub >= 0 ? $sub : 0);
        } else {
            $sub = $row['IncidentSize'] - $row['DiscoveryAcres'];
            $growth[$fuels[$i]][] = ($sub >= 0 ? $sub : 0);
        }
    }

    sort($temp[$i]);
    sort($rh[$i]);
    sort($wind[$i]);
}

$sql = mysqli_query($con, "SELECT month, temp, rh, wind, IncidentSize, DiscoveryAcres, InitialResponseAcres FROM data");
while ($row = mysqli_fetch_assoc($sql)) {
    if ($row['InitialResponseAcres'] > $row['DiscoveryAcres']) {
        $sub = $row['IncidentSize'] - $row['InitialResponseAcres'];
        $chng[] = ($sub >= 0 ? $sub : 0);
    } else {
        $sub = $row['IncidentSize'] - $row['DiscoveryAcres'];
        $chng[] = ($sub >= 0 ? $sub : 0);
    }

    $month[] = $row['month'];
        $temp2[] = $row['temp'];
        $rh2[] = $row['rh'];
        $wind2[] = $row['wind'];
}/*
?>
<style>table tr td:first-child{font-weight:bold}</style>

<h2>Weather for all fires</h2>
<table border="1" cellpadding="5" cellspacing="0">
    <thead>
        <tr>
            <th></th>
            <th>Temp</th>
            <th>RH</th>
            <th>Wind</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>Min</td><td><?=min($temp2)?></td><td><?=min($rh2)?></td><td><?=min($wind2)?></td></tr>
        <tr><td>Q1</td><td><?=quartile($temp2, 0.25)?></td><td><?=quartile($rh2, 0.25)?></td><td><?=quartile($wind2, 0.25)?></td></tr>
        <tr><td>Median</td><td><?=median($temp2)?></td><td><?=median($rh2)?></td><td><?=median($wind2)?></td></tr>
        <tr><td>Mean</td><td><?=round(mean($temp2), 1)?></td><td><?=round(mean($rh2), 1)?></td><td><?=round(mean($wind2), 1)?></td></tr>
        <tr><td>Q3</td><td><?=quartile($temp2, 0.75)?></td><td><?=quartile($rh2, 0.75)?></td><td><?=quartile($wind2, 0.75)?></td></tr>
        <tr><td>Max</td><td><?=max($temp2)?></td><td><?=max($rh2)?></td><td><?=max($wind2)?></td></tr>
        <tr><td>IQR</td><td><?=quartile($temp2, 0.75)-quartile($temp2, 0.25)?></td><td><?=quartile($rh2, 0.75)-quartile($rh2, 0.25)?></td><td><?=quartile($wind2, 0.75)-quartile($wind2, 0.25)?></td></tr>
        <tr><td>Range</td><td><?=max($temp2)-min($temp2)?></td><td><?=max($rh2)-min($rh2)?></td><td><?=max($wind2)-min($wind2)?></td></tr>
        <tr><td>Std. Dev.</td><td><?=std_dev($temp2)?></td><td><?=std_dev($rh2)?></td><td><?=std_dev($wind2)?></td></tr>
        <tr><td>Std. Error</td><td><?=std_error($temp2)?></td><td><?=std_error($rh2)?></td><td><?=std_error($wind2)?></td></tr>
    </tbody>
</table>

<h2>Weather by Fuel Type</h2>
<table border="1" cellspacing="0" cellpadding="5">
    <thead>
        <tr>
            <th rowspan="2"></th>
            <?foreach($fuels as $f){?>
            <th colspan="3"><?=strtoupper($f)?></th>
            <?}?>
        </tr>
        <tr>
            <th>Temp</th><th>RH</th><th>Wind</th>
            <th>Temp</th><th>RH</th><th>Wind</th>
            <th>Temp</th><th>RH</th><th>Wind</th>
            <th>Temp</th><th>RH</th><th>Wind</th>
            <th>Temp</th><th>RH</th><th>Wind</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Min</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=min($temp[$i])?></td>
                <td><?=min($rh[$i])?></td>
                <td><?=min($wind[$i])?></td>
            <?}?>
        </tr>
        <tr>
            <td>Q1</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=quartile($temp[$i], 0.25) ?></td>
                <td><?=quartile($rh[$i], 0.25) ?></td>
                <td><?=quartile($wind[$i], 0.25) ?></td>
            <?}?>
        </tr>
        <tr>
            <td>Median</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=median($temp[$i]) ?></td>
                <td><?=median($rh[$i]) ?></td>
                <td><?=median($wind[$i]) ?></td>
            <?}?>
        </tr>
        <tr>
            <td>Mean</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=round(mean($temp[$i]), 1)?></td>
                <td><?=round(mean($rh[$i]), 1)?></td>
                <td><?=round(mean($wind[$i]), 1)?></td>
            <?}?>
        </tr>
        <tr>
            <td>Q3</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=quartile($temp[$i], 0.75) ?></td>
                <td><?=quartile($rh[$i], 0.75) ?></td>
                <td><?=quartile($wind[$i], 0.75) ?></td>
            <?}?>
        </tr>
        <tr>
            <td>Max</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=max($temp[$i]) ?></td>
                <td><?=max($rh[$i]) ?></td>
                <td><?=max($wind[$i]) ?></td>
            <?}?>
        </tr>
        <tr>
            <td>IQR</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=quartile($temp[$i], 0.75)-quartile($temp[$i], 0.25) ?></td>
                <td><?=quartile($rh[$i], 0.75)-quartile($rh[$i], 0.25) ?></td>
                <td><?=quartile($wind[$i], 0.75)-quartile($wind[$i], 0.25) ?></td>
            <?}?>
        </tr>
        <tr>
            <td>Range</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=max($temp[$i])-min($temp[$i])?></td>
                <td><?=max($rh[$i])-min($rh[$i])?></td>
                <td><?=max($wind[$i])-min($wind[$i])?></td>
            <?}?>
        </tr>
        <tr>
            <td>Std. Dev.</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=std_dev($temp[$i]) ?></td>
                <td><?=std_dev($rh[$i]) ?></td>
                <td><?=std_dev($wind[$i]) ?></td>
            <?}?>
        </tr>
        <tr>
            <td>Std. Error</td>
            <?for($i=0;$i<5;$i++){?>
                <td><?=std_error($temp[$i]) ?></td>
                <td><?=std_error($rh[$i]) ?></td>
                <td><?=std_error($wind[$i]) ?></td>
            <?}?>
        </tr>
    </tbody>
</table><br>

<h2>Growth (Acres) by Fuel Type</h2>
<table border="1" cellspacing="0" cellpadding="5">
    <thead>
        <tr>
            <th></th>
            <?foreach($fuels as $f){?>
                <th><?=$f?></th>
            <?}?>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><i>n</i></td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.count($growth[$fuels[$i]]).'</td>';
            }?>
        </tr>
        <tr>
            <td>Min</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.min($growth[$fuels[$i]]).'</td>';
            }?>
        </tr>
        <tr>
            <td>Q1</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.quartile($growth[$fuels[$i]], 0.25).'</td>';
            }?>
        </tr>
        <tr>
            <td>Median</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.median($growth[$fuels[$i]]).'</td>';
            }?>
        </tr>
        <tr>
            <td>Mean</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.round(mean($growth[$fuels[$i]]), 2).'</td>';
            }?>
        </tr>
        <tr>
            <td>Q3</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.quartile($growth[$fuels[$i]], 0.75).'</td>';
            }?>
        </tr>
        <tr>
            <td>Max</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.max($growth[$fuels[$i]]).'</td>';
            }?>
        </tr>
        <tr>
            <td>IQR</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.(quartile($growth[$fuels[$i]], 0.75)-quartile($growth[$fuels[$i]], 0.25)).'</td>';
            }?>
        </tr>
        <tr>
            <td>Range</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.(max($growth[$fuels[$i]])-min($growth[$fuels[$i]])).'</td>';
            }?>
        </tr>
        <tr>
            <td>Std. Dev.</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.std_dev($growth[$fuels[$i]]).'</td>';
            }?>
        </tr>
        <tr>
            <td>Std. Error</td>
            <?for($i=0;$i<5;$i++) {
                echo '<td>'.std_error($growth[$fuels[$i]]).'</td>';
            }?>
        </tr>
    </tbody>
</table><br>

<h2>Growth Count by Fuel</h2>
<table border="1" cellpadding="5" cellspacing="0">
    <thead>
        <tr>
            <th></th><th>0</th><th>0-1</th><th>1-10</th><th>10-100</th><th>100-1000</th><th>1000+</th><th>Total</th>
        </tr>
    </thead>
<tbody>
<?
for($x=0;$x<5;$x++){
    $count1 = $count2 = $count3 = $count4 = $count5 = $count6 = 0;

    for($i=0;$i<count($growth[$fuels[$x]]);$i++){
        if ($growth[$fuels[$x]][$i] == 0) {
            $count1++;
        } else if ($growth[$fuels[$x]][$i] > 0 && $growth[$fuels[$x]][$i] <= 1) {
            $count2++;
        } else if ($growth[$fuels[$x]][$i] > 1 && $growth[$fuels[$x]][$i] <= 10) {
            $count3++;
        } else if ($growth[$fuels[$x]][$i] > 10 && $growth[$fuels[$x]][$i] <= 100) {
            $count4++;
        } else if ($growth[$fuels[$x]][$i] > 100 && $growth[$fuels[$x]][$i] <= 1000) {
            $count5++;
        } else if ($growth[$fuels[$x]][$i] > 1000) {
            $count6++;
        }
    }

    $total = $count1 + $count2 + $count3 + $count4 + $count5 + $count6;
    echo '<tr><td>'.$fuels[$x].'</td><td>'.$count1.'</td><td>'.$count2.'</td><td>'.$count3.'</td><td>'.$count4.'</td><td>'.$count5.'</td><td>'.$count6.'</td><td>'.$total.'</td></tr>';
}
?>
</tbody>
</table>

<h2>Growth Count by Size</h2>
<?
$count2 = $count3 = $count4 = $count5 = $count6 = 0;
for($i=0;$i<count($chng);$i++){
    if ($chng[$i] >= 0 && $chng[$i] <= 1) {
        $count2++;
    } else if ($chng[$i] > 1 && $chng[$i] <= 10) {
        $count3++;
    } else if ($chng[$i] > 10 && $chng[$i] <= 100) {
        $count4++;
    } else if ($chng[$i] > 100 && $chng[$i] <= 1000) {
        $count5++;
    } else if ($chng[$i] > 1000) {
        $count6++;
    }

    if ($month[$i] >= 6 && $month[$i] <= 8) {
        if ($chng[$i] >= 0 && $chng[$i] <= 1) {
            $tot1[0]++;
        } else if ($chng[$i] > 1 && $chng[$i] <= 10) {
            $tot2[0]++;
        } else if ($chng[$i] > 10 && $chng[$i] <= 100) {
            $tot3[0]++;
        } else if ($chng[$i] > 100 && $chng[$i] <= 1000) {
            $tot4[0]++;
        } else if ($chng[$i] > 1000) {
            $tot5[0]++;
        }
    } else if ($month[$i] >= 9 && $month[$i] <= 11) {
        if ($chng[$i] >= 0 && $chng[$i] <= 1) {
            $tot1[1]++;
        } else if ($chng[$i] > 1 && $chng[$i] <= 10) {
            $tot2[1]++;
        } else if ($chng[$i] > 10 && $chng[$i] <= 100) {
            $tot3[1]++;
        } else if ($chng[$i] > 100 && $chng[$i] <= 1000) {
            $tot4[1]++;
        } else if ($chng[$i] > 1000) {
            $tot5[1]++;
        }
    } else if ($month[$i] == 12 || $month[$i] <= 2) {
        if ($chng[$i] >= 0 && $chng[$i] <= 1) {
            $tot1[2]++;
        } else if ($chng[$i] > 1 && $chng[$i] <= 10) {
            $tot2[2]++;
        } else if ($chng[$i] > 10 && $chng[$i] <= 100) {
            $tot3[2]++;
        } else if ($chng[$i] > 100 && $chng[$i] <= 1000) {
            $tot4[2]++;
        } else if ($chng[$i] > 1000) {
            $tot5[2]++;
        }
    } else {
        if ($chng[$i] >= 0 && $chng[$i] <= 1) {
            $tot1[3]++;
        } else if ($chng[$i] > 1 && $chng[$i] <= 10) {
            $tot2[3]++;
        } else if ($chng[$i] > 10 && $chng[$i] <= 100) {
            $tot3[3]++;
        } else if ($chng[$i] > 100 && $chng[$i] <= 1000) {
            $tot4[3]++;
        } else if ($chng[$i] > 1000) {
            $tot5[3]++;
        }
    }
}
$sum = $count2 + $count3 + $count4 + $count5 + $count6;
?>
<table border="1" cellspacing="0" cellpadding="5">
    <thead><tr><th>Acres</th><th>Count</th><th>Percent</th></tr></thead>
    <tbody>
        <tr><td>0-1</td><td><?=$count2?></td><td><?=round(($count2/$sum)*100, 1)?>%</td></tr>
        <tr><td>1-10</td><td><?=$count3?></td><td><?=round(($count3/$sum)*100, 1)?>%</td></tr>
        <tr><td>10-100</td><td><?=$count4?></td><td><?=round(($count4/$sum)*100, 1)?>%</td></tr>
        <tr><td>100-1000</td><td><?=$count5?></td><td><?=round(($count5/$sum)*100, 1)?>%</td></tr>
        <tr><td>1000+</td><td><?=$count6?></td><td><?=round(($count6/$sum)*100, 1)?>%</td></tr>
    </tbody>
</table>

<h2>Growth Count by Size & ToY</h2>
<table cellpadding="5" cellspacing="0" border="1">
    <thead>
        <th></th><th>JJA</th><th>SON</th><th>DJF</th><th>MAM</th>
    </thead>
    <tbody>
        <tr><td>0-1</td><td><?=$tot1[0]?></td><td><?=$tot1[1]?></td><td><?=$tot1[2]?></td><td><?=$tot1[3]?></td></tr>
        <tr><td>1-10</td><td><?=$tot2[0]?></td><td><?=$tot2[1]?></td><td><?=$tot2[2]?></td><td><?=$tot2[3]?></td></tr>
        <tr><td>10-100</td><td><?=$tot3[0]?></td><td><?=$tot3[1]?></td><td><?=$tot3[2]?></td><td><?=$tot3[3]?></td></tr>
        <tr><td>100-1000</td><td><?=$tot4[0]?></td><td><?=$tot4[1]?></td><td><?=$tot4[2]?></td><td><?=$tot4[3]?></td></tr>
        <tr><td>>1000</td><td><?=$tot5[0]?></td><td><?=$tot5[1]?></td><td><?=$tot5[2]?></td><td><?=$tot5[3]?></td></tr>
    </tbody>
</table>
*/?>

<table>
<?
$count = 0;
$result = mysqli_query($con, "SELECT month, FuelGroup, IncidentSize, DiscoveryAcres, InitialResponseAcres, temp, rh, wind FROM `data` ORDER BY rh DESC LIMIT 2000");
while($row = mysqli_fetch_assoc($result)){
    if ($row['InitialResponseAcres'] < $row['DiscoveryAcres']) {
        $sub = $row['IncidentSize'] - $row['InitialResponseAcres'];
        $growth = ($sub >= 0 ? $sub : 0);
    } else {
        $sub = $row['IncidentSize'] - $row['DiscoveryAcres'];
        $growth = ($sub >= 0 ? $sub : 0);
    }

    if ($growth > 0) {
        echo '<tr><td>'.$row['month'].'</td><td>'.$row['FuelGroup'].'</td><td>'.$growth.'</td><td>'.$row['temp'].'</td><td>'.$row['rh'].'</td><td>'.$row['wind'].'</td></tr>';
        $count++;
    }

    if ($count == 1000) {
        break;
    }
}
?>
</table>