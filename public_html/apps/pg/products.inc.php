<?
$where = "p.oid = ?";
$types = 'i';
$arr = [$orgID];

if (isset($_GET['product']) && !empty($_GET['product'])) {
    $types .= 's';
    $arr[] = $_GET['product'];
    $where .= " AND product = ?";
}

$prods = $helper->query(
    $types,
    $arr,
    "SELECT uqid, product, pt.name, replaces, author, issued, valid, expires, pt.data FROM products AS p LEFT JOIN product_types AS pt ON pt.identifier = p.product WHERE $where ORDER BY issued DESC"
);

$getProds = $helper->query(
    'i',
    [$orgID],
    "SELECT identifier, name FROM product_types WHERE oid = ? ORDER BY name ASC"
);

foreach ($getProds as $p) {
    $select = $p['identifier'] == $_GET['product'] ? 'selected ' : '';
    $allProducts .= "<option {$select}value=\"$p[identifier]\">$p[name]</option>";
}
?>
<div class="content">
    <h1><?= $title ?></h1>

    <? if ($prods && count($prods) > 0) { ?>
        <form action="" method="get">
            <div class="inline">
                <div>
                    <label>Filter by</label>
                    <select class="small" name="product">
                        <option value="">- All Products -</option>
                        <?= $allProducts ?>
                    </select>
                </div>
                <div>
                    <input type="submit" class="btn btn-default btn-small" value="Filter">
                </div>
            </div>
        </form>

        <table class="table spacing">
            <thead>
                <tr>
                    <th>Identifier</th>
                    <th>Product</th>
                    <th>Replaces</th>
                    <th>Issued</th>
                    <th>Valid from</th>
                    <th>Valid until</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <?
                $lastDate = null;

                foreach ($prods as $prod) {
                    $tz = json_decode($prod['data'])->timezone;
                    date_default_timezone_set($tz);

                    $iss = date('D, n/j/Y H:i T', $prod['issued']);
                    $validFrom = date('D, n/j/Y H:i T', $prod['valid']);
                    $validTo = date('D, n/j/Y H:i T', $prod['expires']);
                    $expired = $prod['expires'] < time();

                    $url = "../issue/$prod[product]/update?id=$prod[uqid]";

                    $currentDate = date('l, M j', $prod['issued']);

                    if ($currentDate !== $lastDate) {
                        echo "<tr class='date-group'><td colspan='7'>$currentDate</td></tr>";
                        $lastDate = $currentDate;
                    }
                ?>
                    <tr>
                        <td><?= "$prod[product]-$prod[uqid]" ?></td>
                        <td><?= $prod['name'] ?></td>
                        <td><?= $prod['replaces'] !== null ? "$prod[product]-$prod[replaces]" : '' ?></td>
                        <td><span class="help" title="<?= $iss ?>"><?= $helper->timeAgo($prod['issued']) ?></span></td>
                        <td><span <?= $prod['valid'] > time() ? 'class="help" ' : '' ?>title="<?= $validFrom ?>"><?= $prod['valid'] > time() ? $helper->until($prod['valid']) : $validFrom ?></td>
                        <td>
                            <span <?= $prod['expires'] > time() ? 'class="help" ' : '' ?>title="<?= $validTo ?>"><?= $prod['expires'] > time() ? $helper->until($prod['expires']) : $validTo ?>
                                <?= time() > $prod['expires'] ? ' <small style="color:red">(expired)</span>' : '' ?>
                        </td>
                        <td><?= !$expired ? "<a href=\"$url\">update</a>" : '' ?></td>
                    </tr>
                <? } ?>
            </tbody>
        </table>
    <? } ?>
</div>