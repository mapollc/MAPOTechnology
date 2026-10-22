<?
$trail = executeQuery(
    'i',
    [$_GET['id']],
    "SELECT id, title FROM trails WHERE id = ? LIMIT 1",
    true
);

if (!$trail) {
    echo pageNotFound();
    return;
}
?>

<h1><?= $trail['title'] ?></h1>

<div id="map" style="width:100%;height:500px" class="placeholder" data-trail-id="<?= $trail['id'] ?>"></div>