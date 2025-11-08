<?
$con = mysqli_connect('localhost', 'mapo_main', 'Q.1.w.2.e34', 'mapo_trails');

$sql = mysqli_query($con, "SELECT file FROM media WHERE file != '' AND file NOT LIKE '%youtube://%' ORDER BY file ASC");
while($row = mysqli_fetch_assoc($sql)) {
    #echo '<img src="https://www.lagranderide.com/sites/lagranderide.com/files/'.$row['file'].'" style="width:100px;margin:10px">';
    echo "'".$row['file']."',";
}
?>