<?
$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM avalanche WHERE id = $_GET[id]"));

if (!$row) {
    echo errorCode('Report Not Found', 'The avalanche report you\'re looking for doesn\'t exist.');
} else {
?>
<div class="row">
    <div class="col">
        <div class="card">
            <h1>Avalanche <?=ucfirst($row['type'])?> Report #<?=$row['id']?></h1>

            <a target="blank" class="btn btn-lg btn-green" href="https://avalanche.org/avalanche-accidents/#/report/<?=$row['avy_id']?>">View Report</a>

            <a class="btn btn-gray" href="#" onclick="history.go(-1);return false">Go back</a>
        </div>
    </div>
</div>
<?}?>