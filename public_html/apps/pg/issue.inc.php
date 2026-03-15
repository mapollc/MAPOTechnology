<?
function timeOptions($time = null, $future = false)
{
    for ($i = 0; $i < 24; $i++) {
        $zero = $i < 10 ? '0' : '';
        $op = "{$zero}{$i}:00 " . date('T');
        $compare = $future ? 12 : 1;
        $select = ($i == date('H', $time == null ? strtotime("+$compare hours") : $time) ? 'selected ' : '');

        $timeOptions .= "<option {$select}value=\"$op\">$op</option>";
    }
    return $timeOptions;
}

if (!$pgen->method()) {
    $prods = $helper->query(
        'i',
        [$orgID],
        "SELECT * FROM product_types WHERE oid = ? ORDER BY name ASC"
    );
} else {
    $product = $helper->query(
        'si',
        [$pgen->method(), $orgID],
        "SELECT pid, identifier, name, data, status FROM product_types WHERE identifier = ? AND oid = ? ORDER BY name ASC LIMIT 1"
    );
    $settings = json_decode($product['data']) ?? [];

    // save product on issuance
    if (isset($_POST['issue'])) {
        $geojson = $_POST['features'];
        $geo = json_decode($geojson);
        $demo = json_encode($helper->getCities($geo->features[0]));

        $from = $_POST['validFromDate'] && $_POST['validFromTime'] ? strtotime("$_POST[validFromDate] $_POST[validFromTime]") : time();
        $to = strtotime("$_POST[validToDate] $_POST[validToTime]");
        $disc = preg_replace('/^(?!\s*$)(.*)$/m', '<p>$1</p>', $_POST['discussion']);
        $replaces = $_POST['replaces'] ?? null;

        $helper->query(
            'iisiiiisss',
            [$replaces, $orgID, $_POST['product'], $_SESSION['uid'], time(), $from, $to, $disc, $demo, $geojson],
            "INSERT INTO products (replaces, oid, product, author, issued, valid, expires, discussion, demographics, geojson) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $pid = mysqli_insert_id($con);
        $message = message(true, "Your product \"<b>$product[name]</b>\" was successfully issued. <a href=\"./$product[identifier]/update?id=$pid\">Update it</a> now.");
    }

    // if updating a product, get from database
    if ($pgen->id() == 'update') {
        $previous = null;
        $get = $helper->query(
            'ii',
            [$orgID, $_GET['id']],
            "SELECT * FROM products WHERE oid = ? AND uqid = ?"
        );

        $latest = $helper->query(
            'ii',
            [$orgID, $product['identifier']],
            "SELECT MAX(uqid) as latest FROM products WHERE oid = ? AND product = ? LIMIT 1"
        );

        if ($get) {
            $previous = $get[0];
            $author = $pgen->getUser($previous['author']);
        }
    }
}

$issOrUp = $pgen->id() == 'update' ? 'Update' : 'Issue';
?>
<div class="content">
    <? if (!$pgen->method()) { ?>
        <h1><?= $issOrUp ?> Product</h1>

    <?
        if (count($prods) == 0) {
            echo '<p>There are no products available for you to issue.</p>';
        } else {
            echo '<ul>';
            foreach ($prods as $prod) {
                echo "<li><a href=\"issue/{$prod['identifier']}\">{$prod['identifier']} &ndash; {$prod['name']}</a></li>";
            }
            echo '</ul>';
        }
    } else {
        if ($product == null) {
            echo "<h1>$issOrUp Product</h1><p>The product you\'re looking for does not exist.</p><a href=\"#\" class=\"btn\" style=\"margin-top:2rem\" onclick=\"history.go(-1);return false\">Go back</a>";
        } else {
            date_default_timezone_set($settings->timezone ?? $pgen->getOrg()->timezone());
            echo "<h1>$issOrUp {$product['name']}</h1>";
            if (isset($message)) echo $message;

            if ($product['status'] == 0) {
                echo '<p>This product is not available to issue right now.</p><a href="#" class="btn" style="margin-top:2rem" onclick="history.go(-1);return false">Go back</a>';
            } else if ($latest['latest'] > $_GET['id']) {
                echo "<p>This version of the $product[name] is not the latest version and cannot be modified.</p><a href=\"#\" class=\"btn\" style=\"margin-top:2rem\" onclick=\"history.go(-1);return false\">Go back</a>";
            } else {
                include_once 'polygen.inc.php';
            }
        }
    } ?>
</div>