<?
function getDetails($item)
{
    $demo = $item['demographics'] ? json_decode($item['demographics']) : null;

    return [
        'uqid' => $item['uqid'],
        'replaces' => $item['replaces'],
        'identifier' => $item['identifier'],
        'product' => $item['product'],
        'issued' => floatval($item['issued']),
        'valid' => floatval($item['valid']),
        'expires' => floatval($item['expires']),
        'discussion' => $item['discussion'] ?? null,
        'demographics' => $demo
    ];
}

if ($method == 'products') {
    if (!$function) {
        $item = $helper->query(
            'i',
            [$_REQUEST['uqid']],
            "SELECT uqid, replaces, product AS identifier, name AS product, issued, valid, expires, discussion, demographics, geojson FROM products AS p LEFT JOIN product_types AS pt ON pt.identifier = p.product AND pt.oid = p.oid WHERE p.uqid = ? LIMIT 1",
            $con2
        );

        $returnJson = getDetails($item);
    }

    if ($function == 'list') {
        $results = $helper->query(
            'i',
            [$_REQUEST['orgID']],
            "SELECT pt.identifier, pt.name AS type_name, uqid, MAX(p.issued) AS last_issued FROM product_types AS pt LEFT JOIN products AS p ON p.product = pt.identifier WHERE pt.oid = ? GROUP BY pt.identifier, pt.name ORDER BY last_issued DESC",
            $con2
        );

        $returnJson = ['products' => $results];
    } else if ($function == 'active') {
        $get = $helper->query(
            'ii',
            [$_REQUEST['orgID'], time()],
            "SELECT uqid, replaces, product AS identifier, name AS product, issued, valid, expires, discussion, demographics, geojson FROM products AS p LEFT JOIN product_types AS pt ON pt.identifier = p.product AND pt.oid = p.oid WHERE p.oid = ? AND (expires > ? OR expires IS NULL) ORDER BY issued DESC",
            $con2
        );

        if ($get && count($get) > 0) {
            $active = [];

            foreach ($get as $item) {
                $json = json_decode($item['geojson']);

                $active[] = getDetails($item);
            }
        }

        $returnJson = ['products' => $active ?? null];
    } else if ($function == 'geojson') {
        if (isset($_REQUEST['uqid'])) {
            $item = $helper->query(
                'i',
                [$_REQUEST['uqid']],
                "SELECT uqid, replaces, product AS identifier, name AS product, issued, valid, expires, discussion, demographics, geojson FROM products AS p LEFT JOIN product_types AS pt ON pt.identifier = p.product AND pt.oid = p.oid WHERE p.uqid = ? LIMIT 1",
                $con2
            );

            $geojson = json_decode($item['geojson']);

            for ($i = 0; $i < count($geojson->features); $i++) {
                $color = $geojson->features[$i]->properties->color;
                $geojson->features[$i]->properties = getDetails($item);
                $geojson->features[$i]->properties['color'] = $color;
                $geojson->features[$i]->id = $geojson->features[$i]->properties['uqid'];

                $features[] = $geojson->features[$i];
            }
        } else {
            $where = "p.oid = ? AND (expires > ? OR expires IS NULL)";
            $types = 'ii';
            $fields = [$_REQUEST['orgID'], time()];

            if (isset($_REQUEST['type'])) {
                $where .= " AND product = ?";
                $types .= 's';
                $fields[] = $_REQUEST['type'];
            }

            $get = $helper->query(
                $types,
                $fields,
                "SELECT uqid, replaces, product AS identifier, name AS product, issued, valid, expires, discussion, demographics, geojson FROM products AS p LEFT JOIN product_types AS pt ON pt.identifier = p.product AND pt.oid = p.oid WHERE $where ORDER BY issued DESC",
                $con2
            );

            if ($get && count($get) > 0) {
                foreach ($get as $item) {
                    $geojson = json_decode($item['geojson']);

                    for ($i = 0; $i < count($geojson->features); $i++) {
                        $color = $geojson->features[$i]->properties->color;
                        $geojson->features[$i]->properties = getDetails($item);
                        $geojson->features[$i]->properties['color'] = $color;
                        $geojson->features[$i]->id = $geojson->features[$i]->properties['uqid'];

                        $features[] = $geojson->features[$i];
                    }
                }
            }
        }

        $returnJson = ['type' => 'FeatureCollection', 'features' => $features];
    }
}
