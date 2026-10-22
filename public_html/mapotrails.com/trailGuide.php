<?
include_once '/home/mapo/database.inc.php';

function subtitleIcon($terms)
{
    $json = strtolower($terms);
    $terms = json_decode($json, true) ?? [];

    $icons = [
        'ski'           => 'person-skiing',
        'bike'          => 'person-biking',
        'snowmobile'    => 'person-snowmobiling',
        'hike'          => 'person-hiking',
        'mountain bike' => 'person-biking-mountain',
    ];

    $icon = 'info-circle';

    foreach ($icons as $key => $name) {
        if (in_array($key, $terms) || str_contains($json, $key)) {
            $icon = $name;
        }
    }

    return $icon;
}

function formatMonthsToSeason($season) {
    $months = json_decode($season);
    if (empty($months)) return 'null';
    
    // Clean, deduplicate, and sort month numbers
    $unique = array_values(array_unique(array_filter($months, fn($m) => $m >= 1 && $m <= 12)));
    sort($unique);
    
    if (count($unique) === 12) return 'year round';
    if (empty($unique)) return 'null';

    $monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    if (count($unique) === 1) {
        return $monthNames[$unique[0] - 1];
    }

    // Check for standard contiguous range (e.g., [5, 6, 7, 8] -> may-aug)
    $isContiguous = true;
    for ($i = 1; $i < count($unique); $i++) {
        if ($unique[$i] !== $unique[$i - 1] + 1) {
            $isContiguous = false;
            break;
        }
    }

    if ($isContiguous) {
        return $monthNames[$unique[0] - 1] . '-' . $monthNames[end($unique) - 1];
    }

    // Check for wrap-around range (e.g., December to April -> [12, 1, 2, 3, 4])
    if (in_array(12, $unique, true) && in_array(1, $unique, true)) {
        $endPart = 1;
        while (in_array($endPart + 1, $unique, true)) $endPart++;
        
        $startPart = 12;
        while (in_array($startPart - 1, $unique, true)) $startPart--;

        if ((13 - $startPart) + $endPart === count($unique)) {
            return $monthNames[$startPart - 1] . '-' . $monthNames[$endPart - 1];
        }
    }

    // Fallback for fragmented selections
    return $monthNames[$unique[0] - 1] . '-' . $monthNames[end($unique) - 1];
}

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

if (!$trail) $title = 'Page Not Found';

include_once './header.inc.php';

echo $headerContent;

if (!$trail) {
    http_response_code(404);
    include_once './error.php';
    exit();
}

$keywords = '';
$terms = $trail['term'];

if ($trail['keywords'] != '') {
    foreach (json_decode($trail['keywords']) as $kw) {
        if ($kw != '') $keywords .= "<span class=\"label\">#$kw</span>";
    }
}

$season = formatMonthsToSeason($trail['season']);
?>

<main>
    <div class="container">
        <?= (int) $trail['public'] === 0 && $_SESSION['role'] == 'ADMIN' ? '<div class="watermark"><i style="margin-right:0.5rem" class="fas fa-circle-info"></i>trail guide is not public</div>' : '' ?>

        <div class="trail-header">
            <h1><?= $trail['title'] ?></h1>
            <div class="subtitle">
                <?= (int) $trail['premium'] === 1 ? '<i class="fas fa-star" style="color:var(--yellow)"></i> PREMIUM GUIDE' : '' ?>
                <i class="fas fa-<?= subtitleIcon($terms) ?>"></i>
                <?= implode(' &middot; ', json_decode($terms)) ?>
                <?= $trail['season'] ? "<i class=\"fas fa-calendar-days\"></i> $season" : '' ?>
            </div>

            <div class="pill-group">
                <span class="label">#<?= ucfirst($trail['type']) ?></span>
                <?= $keywords ?>
            </div>
        </div>

        <? if ((int) $trail['premium'] === 1 && $_SESSION['role'] != 'ADMIN') { ?>
            <div style="margin:4rem auto;font-size:22px;font-weight:300;line-height:2">
                <i class="far fa-lock" style="font-size:20px;color:gold;padding-right:5px"></i>
                This is a premium trail guide. Please <a href="https://auth.mapotechnology.com/login?fail=1&service=mapotrails&next=<?= urlencode("https://{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}") ?>">login</a>
                to access this content.
            </div>
        <? return;
        }

        if ((int) $trail['public'] === 0 && $_SESSION['role'] != 'ADMIN') { ?>
            <div style="margin:4rem auto;font-size:22px;font-weight:300;line-height:2">
                <i class="far fa-lock" style="font-size:20px;color:gold;padding-right:5px"></i>
                This trail is unavailable to the public. Please <a href="https://auth.mapotechnology.com/login?fail=1&service=mapotrails&next=<?= urlencode("https://{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}") ?>">login</a>
                to access this content.
            </div>
        <? return;
        }
        ?>

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

        <a href="../../../trails/<?= $_GET['tid'] ?>" class="btn btn-xl btn-green" style="display:block;margin:1rem auto">Explore this guide on the map</a>

        <div class="route">
            <?= format($trail['route']) ?>
        </div>
    
        <span class="byline">
            Trail data mapped by <u><?= $trail['author'] ?></u> on <?= date('F j, Y', $trail['created']) ?>
            <?= $trail['updated'] - $trail['created'] > 86400 ? " &middot; Last update " . date('F j, Y', $trail['updated']) : '' ?>
            <?= $trail['contributors'] ? "&middot; Contributors: <u>$trail[contributors]</u>" : '' ?>
            <? if ($_SESSION['role'] === 'ADMIN') { ?>
                <a href="//mapotechnology.com/account/admin/trails/edit?id=<?= $_GET['tid'] ?>" style="font-size:14px;margin-left:1rem">
                    <i class="fas fa-pen"></i> edit guide
                </a>
            <? } ?>
        </span>
    
        <div id="map" class="loading" data-tid="<?= $_GET['tid'] ?>"></div>

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

        <h2>Trail Photos</h2>

        <div id="guide-photos"></div>
    </div>
</main>

<? include_once './footer.inc.php' ?>