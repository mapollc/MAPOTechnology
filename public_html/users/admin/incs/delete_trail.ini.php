<?
if (isset($_POST['verify_delete']) && $_POST['verify_delete'] == 1) {
    $tid = $_POST['id'];

    $result = mysqli_query($con2, "SELECT file FROM media WHERE trail_id = $tid");
    $result2 = mysqli_query($con2, "SELECT id, filename FROM gpx WHERE trail_id = $tid");
    $base = "/home/mapo/public_html/mapotrails.com/data";

    while ($ph = mysqli_fetch_assoc($result)) {
        if (file_exists("$base/photos/{$ph['file']}")) unlink("$base/photos/{$ph['file']}");
        if (file_exists("$base/photos/large/{$ph['file']}")) unlink("$base/photos/large/{$ph['file']}");
        if (file_exists("$base/photos/thumbnail/{$ph['file']}")) unlink("$base/photos/thumbnail/{$ph['file']}");
    }

    while ($g = mysqli_fetch_assoc($result2)) {
        sendToMapbox($g['id'], null, false);
        
        if (file_exists("$base/gpx/{$g['filename']}")) unlink("$base/gpx/{$g['filename']}");
    }

    mysqli_query($con2, "DELETE FROM trails WHERE id = $tid");
    mysqli_query($con2, "DELETE FROM categories WHERE trail_id = $tid");
    mysqli_query($con2, "DELETE FROM gpx WHERE trail_id = $tid");
    mysqli_query($con2, "DELETE FROM media WHERE trail_id = $tid");
    mysqli_query($con2, "DELETE FROM stats WHERE trail_id = $tid");

    header("Location: https://mapotechnology.com/account/admin/trails?deleted=1");
}

$row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT title FROM trails WHERE id = $_GET[id]"));
?>
<div class="row justify-center">
    <div class="col w50">
        <div class="card">
            <h1>Delete Trail</h1>

            <? if ($_POST['confirm_delete'] == 1) { ?>
                <p style="padding-top:0">Are you <b>absolutely</b> sure you want to delete this trail guide?</p>

                <form action="" method="post">
                    <input type="hidden" name="verify_delete" value="1">
                    <input type="hidden" name="id" value="<?= $_POST['id'] ?>">
                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="confirm" value="I'm absolutely sure">
                        <input type="button" class="btn btn-red" onclick="history.go(-2)" value="No, go back">
                    </div>
                </form>
            <? } else { ?>
                <p style="padding-top:0">Are you sure you want to delete the trail guide <b><?= $row['title'] ?></b>? Once deleted, all associated data,
                    waypoints, GPX files, and photos will be deleted.</p>

                <form action="" method="post">
                    <input type="hidden" name="id" value="<?= $_GET['id'] ?>">
                    <input type="hidden" name="confirm_delete" value="1">
                    <div class="btn-group">
                        <input type="submit" class="btn btn-green" name="confirm" value="Yes, I'm sure">
                        <input type="button" class="btn btn-red" onclick="history.go(-1)" value="No, go back">
                    </div>
                </form>
            <? } ?>
        </div>
    </div>
</div>