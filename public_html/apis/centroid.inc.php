<?
function polygonCentroid(array $coords): ?array
{
    if (!$coords) {
        return null;
    }

    $area = 0;
    $cx = 0;
    $cy = 0;

    for ($i = 0, $j = count($coords) - 1; $i < count($coords); $j = $i++) {

        [$x0, $y0] = $coords[$j];
        [$x1, $y1] = $coords[$i];

        $f = ($x0 * $y1) - ($x1 * $y0);

        $area += $f;
        $cx += ($x0 + $x1) * $f;
        $cy += ($y0 + $y1) * $f;
    }

    $area *= 0.5;

    if ($area == 0) {
        return $coords[0];
    }

    return [
        $cx / (6 * $area),
        $cy / (6 * $area)
    ];
}

function polygonLabelPoint($geometry): ?array
{
    if (!$geometry || !isset($geometry->type, $geometry->coordinates)) {
        return null;
    }

    $polygons = [];

    if ($geometry->type === 'Polygon') {
        $polygons[] = $geometry->coordinates;
    } elseif ($geometry->type === 'MultiPolygon') {
        $polygons = $geometry->coordinates;
    } else {
        return null;
    }

    $bestPoint = null;
    $bestDistance = -INF;

    foreach ($polygons as $polygon) {

        // Exterior ring.
        $outer = $polygon[0] ?? null;

        if (!$outer || count($outer) < 4) {
            continue;
        }

        // Start with the polygon centroid.
        $candidate = polygonCentroid($outer);

        // If centroid isn't inside the polygon, start with its
        // bounding-box center instead.
        if (!pointInPolygon($candidate, $outer)) {
            $candidate = polygonBoundsCenter($outer);
        }

        // If that isn't inside either, use the first vertex.
        if (!pointInPolygon($candidate, $outer)) {
            $candidate = $outer[0];
        }

        // Improve the candidate by searching around it.
        $candidate = improveLabelPoint(
            $candidate,
            $outer
        );

        $distance = pointToPolygonDistance(
            $candidate,
            $outer
        );

        // Keep the candidate that is furthest from the boundary.
        if ($distance > $bestDistance) {
            $bestDistance = $distance;
            $bestPoint = $candidate;
        }
    }

    return $bestPoint;
}

function polygonBoundsCenter(array $ring): array
{
    $minX = INF;
    $maxX = -INF;
    $minY = INF;
    $maxY = -INF;

    foreach ($ring as $point) {
        $minX = min($minX, $point[0]);
        $maxX = max($maxX, $point[0]);
        $minY = min($minY, $point[1]);
        $maxY = max($maxY, $point[1]);
    }

    return [
        ($minX + $maxX) / 2,
        ($minY + $maxY) / 2
    ];
}


// Added: Determine whether a point is inside a polygon.
function pointInPolygon(array $point, array $ring): bool
{
    $inside = false;

    $x = $point[0];
    $y = $point[1];

    for (
        $i = 0, $j = count($ring) - 1;
        $i < count($ring);
        $j = $i++
    ) {
        $xi = $ring[$i][0];
        $yi = $ring[$i][1];

        $xj = $ring[$j][0];
        $yj = $ring[$j][1];

        if (
            (($yi > $y) !== ($yj > $y)) &&
            ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi)
        ) {
            $inside = !$inside;
        }
    }

    return $inside;
}

function pointToPolygonDistance(array $point, array $ring): float
{
    $minDistance = INF;

    for ($i = 0; $i < count($ring) - 1; $i++) {

        $distance = pointToSegmentDistance(
            $point,
            $ring[$i],
            $ring[$i + 1]
        );

        $minDistance = min($minDistance, $distance);
    }

    return $minDistance;
}

function pointToSegmentDistance(
    array $point,
    array $a,
    array $b
): float {
    $px = $point[0];
    $py = $point[1];

    $ax = $a[0];
    $ay = $a[1];

    $bx = $b[0];
    $by = $b[1];

    $dx = $bx - $ax;
    $dy = $by - $ay;

    if ($dx == 0 && $dy == 0) {
        return hypot($px - $ax, $py - $ay);
    }

    $t = (
        ($px - $ax) * $dx +
        ($py - $ay) * $dy
    ) / ($dx * $dx + $dy * $dy);

    $t = max(0, min(1, $t));

    $closestX = $ax + $t * $dx;
    $closestY = $ay + $t * $dy;

    return hypot(
        $px - $closestX,
        $py - $closestY
    );
}

// Added: Search around an initial point for a better label position.
function improveLabelPoint(
    array $point,
    array $ring
): array {
    $bestPoint = $point;

    $bestDistance = pointToPolygonDistance(
        $point,
        $ring
    );

    // Start with a relatively coarse search.
    $step = 0.01;

    for ($iteration = 0; $iteration < 4; $iteration++) {

        $foundBetter = false;

        for ($dx = -1; $dx <= 1; $dx++) {
            for ($dy = -1; $dy <= 1; $dy++) {

                if ($dx === 0 && $dy === 0) {
                    continue;
                }

                $candidate = [
                    $bestPoint[0] + ($dx * $step),
                    $bestPoint[1] + ($dy * $step)
                ];

                if (!pointInPolygon($candidate, $ring)) {
                    continue;
                }

                $distance = pointToPolygonDistance(
                    $candidate,
                    $ring
                );

                if ($distance > $bestDistance) {
                    $bestDistance = $distance;
                    $bestPoint = $candidate;
                    $foundBetter = true;
                }
            }
        }

        // Reduce search size.
        $step /= 2;

        if (!$foundBetter) {
            continue;
        }
    }

    return $bestPoint;
}