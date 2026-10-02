<?
include_once '/home/mapo/database.inc.php';

function truncate($text, $maxLength = 160)
{
    $text = trim(strip_tags($text));
    $sentences = preg_split('/(?<=[.!?])\s+/', $text);

    $desc = '';

    foreach ($sentences as $sentence) {
        $sentence = trim($sentence);

        if (!$sentence) continue;
        $candidate = $desc ? "$desc $sentence" : $sentence;

        if (strlen($candidate) > $maxLength) break;
        $desc = $candidate;
    }

    return $desc ?: substr($text, 0, $maxLength);
}

function format($text)
{
    $o = '';
    preg_match_all('/<ul>(.*?)<\/ul>/si', $text, $out1);

    for ($i = 0; $i < count($out1[0]); $i++) {
        $text = str_replace($out1[0][$i], '{list' . $i . '}', $text);
    }

    $h = ['<em>', '</em>', '<strong>', '</strong>'];
    $re = ['<i>', '</i>', '<b>', '</b>'];

    for ($i = 0; $i < count($h); $i++) {
        $text = str_replace($h[$i], $re[$i], $text);
    }

    preg_match_all('/(.*)\s+/', $text . '
', $para);
    foreach ($para[1] as $p) {
        $o .= '<p>' . trim($p) . '</p>';
    }

    for ($i = 0; $i < count($out1[0]); $i++) {
        $o = preg_replace('/<p>\{list' . $i . '\}<\/p>/', $out1[0][$i], $o);
    }

    $o = preg_replace('/<li>(.*)<\/li>/', '<li><p>$1</p></li>', $o);

    return $o;
}

$con2 = mapoTrailsDB();

$trail = executeQuery(
    'i',
    [$_GET['tid']],
    "SELECT t.title, t.type, author, contributors, route, season, keywords, created, updated, term, file, m.title AS caption, public, premium
    FROM trails t
    LEFT JOIN media m ON m.trail_id = t.id
    LEFT JOIN categories c ON c.trail_id = t.id
    WHERE t.id = ? AND m.delta = 0",
    true
);

mysqli_close($con2);

$includeMaplibre = true;

$title = $trail['title'];
$metaDesc = truncate($trail['route']);
$metaPhoto = $trail['file'] ? "//cdn.mapotrails.com/photos/large/{$trail['file']}" : null;
$keywords = '';

if ($trail['keywords'] != '') {
    foreach (json_decode($trail['keywords']) as $kw) {
        $keywords .= "<span class=\"label\">#$kw</span>";
    }
}

include_once './header.inc.php';

echo $headerContent;

if (!$trail || $trail['public'] == 0) {
    http_response_code(404);
    include_once '../error.php';
    exit();
}
?>

<main>
    <div class="container">
        <div class="trail-header">
            <h1><?= $trail['title'] ?></h1>
            <div class="subtitle">
                <?= implode(' &middot; ', json_decode($trail['term'])) ?>
                <?= $trail['season'] ? "&middot; <b>Season:</b> $trail[season]" : '' ?>
            </div>

            <div class="pill-group">
                <span class="label">#<?= ucfirst($trail['type']) ?></span>
                <?= $keywords ?>
            </div>
        </div>

        <? if ($trail['premium'] && $_SESSION['role'] != 'ADMIN') { ?>
            <div style="margin:4rem auto;font-size:22px;font-weight:300;line-height:2">
                <i class="far fa-lock" style="font-size:20px;color:gold;padding-right:5px"></i>
                Please <a href="https://auth.mapotechnology.com/login?fail=1&service=mapotrails&next=<?= urlencode("https://{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}") ?>">login</a>
                to access this content
            </div>
        <? } else { ?>
            <div class="photos">
                <div class="photo placeholder" data-layout="1"></div>
                <div class="photo placeholder" data-layout="2"></div>
                <div class="photo placeholder" data-layout="3"></div>
            </div>

            <ul class="stats">
                <li data-stat="distance">
                    <span class="caption">Distance</span>
                    <div class="value placeholder"></div>
                </li>
                <li data-stat="max">
                    <span class="caption">Max. Altitude</span>
                    <div class="value placeholder"></div>
                </li>
                <li data-stat="min">
                    <span class="caption">Min. Altitude</span>
                    <div class="value placeholder"></div>
                </li>
                <li data-stat="gain">
                    <span class="caption">Gain</span>
                    <div class="value placeholder"></div>
                </li>
                <li data-stat="loss">
                    <span class="caption">Loss</span>
                    <div class="value placeholder"></div>
                </li>
                <li data-stat="slope">
                    <span class="caption">Avg. Slope</span>
                    <div class="value placeholder"></div>
                </li>
            </ul>

            <div id="chart"></div>
            
            <div class="route">
                <?= format($trail['route']) ?>

                <span class="byline">
                    Trail data mapped by <u><?= $trail['author'] ?></u> on <?= date('F j, Y', $trail['created']) ?>
                    <?= $trail['updated'] - $trail['created'] > 86400 ? " &middot; Last update " . date('F j, Y', $trail['updated']) : '' ?>
                    <?= $trail['contributors'] ? "&middot; Contributors: <u>$trail[contributors]</u>" : '' ?>
                    <? if ($_SESSION['role'] === 'ADMIN') { ?>
                        <a href="//mapotechnology.com/account/admin/trails/edit?id=<?= $_GET['tid'] ?>" style="font-size:14px;margin-left:5px">
                            <i class="fas fa-pen"></i> edit guide
                        </a>
                    <? } ?>
                </span>
            </div>

            <div id="map" data-tid="<?= $_GET['tid'] ?>"></div>

            <h2>Waypoints</h2>

            <ul class="waypoints">
                <li class="load">
                    <div class="placeholder" style="width:35px;height:35px"></div>
                    <div class="data">
                        <h3 class="placeholder" style="height:26px;margin-bottom:2px"></h3>
                        <span class="placeholder" style="width:120px;height:14px"></span>
                        <p class="placeholder" style="width:50%;height:18px"></p>
                    </div>
                </li>
                <li class="load">
                    <div class="placeholder" style="width:35px;height:35px"></div>
                    <div class="data">
                        <h3 class="placeholder" style="height:26px;margin-bottom:2px"></h3>
                        <span class="placeholder" style="width:120px;height:14px"></span>
                        <p class="placeholder" style="width:50%;height:18px"></p>
                    </div>
                </li>
                <li class="load">
                    <div class="placeholder" style="width:35px;height:35px"></div>
                    <div class="data">
                        <h3 class="placeholder" style="height:26px;margin-bottom:2px"></h3>
                        <span class="placeholder" style="width:120px;height:14px"></span>
                        <p class="placeholder" style="width:50%;height:18px"></p>
                    </div>
                </li>
            </ul>

            <div id="guide-photos"></div>
        <? } ?>
    </div>
</main>

<? include_once './footer.inc.php' ?>