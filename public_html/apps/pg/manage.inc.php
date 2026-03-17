<?
if (isset($_POST['save'])) {
    $productDetailsData = json_encode([
        'colors' => $_POST['color'],
        'names' => $_POST['element_name'],
        'timezone' => $_POST['tz'],
        'validity' => $_POST['validity'],
        'issuance' => $_POST['issuance'],
        'expires' => $_POST['expires'],
        'expiresAfter' => $_POST['expiresAfter'],
        'textbox' => $_POST['textbox'],
        'demographics' => $_POST['demographics']
    ]);
}

if ($pgen->id() == 'create' || ($pgen->id() == 'edit' && isset($_GET['duplicate']))) {
    $title = (isset($_GET['duplicate']) ? 'Duplicate' : 'Create') . ' Product';

    if (isset($_POST['save'])) {
        $exists = $helper->query(
            'is',
            [$orgID, $_POST['identifier']],
            "SELECT identifier FROM product_types WHERE oid = ? AND identifier = ? LIMIT 1"
        );

        if ($exists && count($exists) > 0) {
            $message = message(false, "The product with the same identifier already exists. Try again.");
        } else {
            $helper->query(
                'isssiii',
                [$orgID, $_POST['identifier'], $_POST['name'], $productDetailsData, $_POST['status'], time(), time()],
                "INSERT INTO product_types (oid, identifier, name, data, status, created, modified) VALUES(?, ?, ?, ?, ?, ?, ?)"
            );

            $pid = mysqli_insert_id($con);
            $message = message(true, "Your product \"<b>$_POST[name]</b>\" was successfully created. <a href=\"./edit?pid=$pid\">Modify it</a> now.");
        }
    }
}

if ($pgen->id() == 'edit' && !isset($_GET['duplicate'])) {
    if (isset($_POST['save'])) {
        $helper->query(
            'sssiiii',
            [$_POST['identifier'], $_POST['name'], $productDetailsData, $_POST['status'], time(), $orgID, $_POST['pid']],
            "UPDATE product_types SET identifier = ?, name = ?, data = ?, status = ?, modified = ? WHERE oid = ? AND pid = ?"
        );

        $message = message(true, "Your product \"<b>$_POST[name]</b>\" was successfully updated.");
    }

    // get product info from DB
    $prod = $helper->query('ii', [$_GET['pid'], $orgID], "SELECT * FROM product_types WHERE pid = ? AND oid = ? LIMIT 1");
    $data = json_decode($prod['data']);

    $title = (isset($_GET['duplicate']) ? 'Duplicate' : 'Edit') . " Product: $prod[name]";
}

if (!$pgen->id()) {
    $prods = $helper->query('i', [$orgID], "SELECT * FROM product_types WHERE oid = ? ORDER BY identifier ASC");
}
?>

<div class="content">
    <h1><?= $title ?></h1>
    <? if (isset($message)) echo $message; ?>

    <? if ($pgen->id() == 'create' || $pgen->id() == 'edit') { ?>
        <form action="" method="post">
            <? if ($pgen->id() == 'edit' && !isset($_GET['duplicate'])) {
                echo '<input type="hidden" name="pid" value="' . $prod['pid'] . '"';
            } ?>
            <label>Product Identifier</label>
            <input type="hidden" name="identifier" value="<?= $prod['identifier'] ?>">
            <input type="text" class="field" id="ident" value="<?= $prod['identifier'] ?>" disabled>

            <label>Product Name</label>
            <input type="text" name="name" class="field" placeholder="Product name" value="<?= $prod['name'] ?>">

            <label>Default Timezone</label>
            <select name="tz">
                <option>- Choose One -</option>
                <option <?= $data->timezone == 'America/Los_Angeles' ? 'selected ' : '' ?>value="America/Los_Angeles">Pacific (-0700/-0800)</option>
                <option <?= $data->timezone == 'America/Denver' ? 'selected ' : '' ?>value="America/Denver">Mountain (-0600/-0700)</option>
                <option <?= $data->timezone == 'America/Chicago' ? 'selected ' : '' ?>value="America/Chicago">Central (-0500/-0600)</option>
                <option <?= $data->timezone == 'America/New_York' ? 'selected ' : '' ?>value="America/New_York">Eastern (-0400/-0500)</option>
                <option <?= $data->timezone == 'UTC' ? 'selected ' : '' ?>value="UTC">UTC/GMT (+0000)</option>
            </select>

            <label>Product has valid date/times</label>
            <div class="radio-group">
                <div class="radio"><input type="radio" id="i1" name="validity" value="1"<?= $data->validity == '1' ? ' checked' : '' ?>><label for="i1">Yes</label></div>
                <div class="radio"><input type="radio" id="i2" name="validity" value="0"<?= $data->validity != '1' ? ' checked' : '' ?>><label for="i2">No</label></div>
            </div>

            <div id="validFrom"<?= $data->validity != '1' ? ' style="display:none"' : '' ?>>
                <label>Valid from</label>
                <div class="radio-group">
                    <div class="radio"><input type="radio" id="i3" name="issuance" value="now"<?= $data->issuance == 'now' ? ' checked' : '' ?>><label for="i3">On submission</label></div>
                    <div class="radio"><input type="radio" id="i4" name="issuance" value="user"<?= $data->issuance == 'user' ? ' checked' : '' ?>><label for="i4">Let user pick</label></div>
                </div>
            </div>

            <div id="expireable"<?= $data->validity != '1' ? ' style="display:none"' : '' ?>>
                <label>Product has valid date/times</label>
                <div class="radio-group">
                    <div class="radio"><input type="radio" id="i5" name="expires" value="user"<?= $data->expires == 'user' ? ' checked' : '' ?>><label for="i5">Let user pick</label></div>
                    <div class="radio"><input type="radio" id="i6" name="expires" value="predefined"<?= $data->expires == 'predefined' ? ' checked' : '' ?>><label for="i6">Predefined number of hours</label></div>
                </div>
            </div>

            <div id="whenExpires"<?= $data->expires != 'predefined' ? ' style="display:none"' : '' ?>>
                <label>Product expires after</label>
                <select name="expiresAfter">
                    <? for ($i = 1; $i < 25; $i++) {
                        $h = 'hour' . ($i != 1 ? 's' : '');
                        echo "<option " . ($data->expiresAfter == $i ? 'selected ' : '') . "value=\"$i\">$i {$h}</option>";
                    }?>
                </select>
            </div>

            <label>Include Textbox</label>
            <div class="radio-group">
                <div class="radio"><input type="radio" id="e7" name="textbox" value="1"<?= $data->textbox == '1' ? ' checked' : '' ?>><label for="e7">Yes</label></div>
                <div class="radio"><input type="radio" id="e8" name="textbox" value="0"<?= $data->textbox != '1' ? ' checked' : '' ?>><label for="e8">No</label></div>
            </div>

            <label>Calculate States/Counties/Cities for Polygon</label>
            <div class="radio-group">
                <div class="radio"><input type="radio" id="e9" name="demographics" value="1"<?= $data->demographics == '1' ? ' checked' : '' ?>><label for="e9">Yes</label></div>
                <div class="radio"><input type="radio" id="e10" name="demographics" value="0"<?= $data->demographics != '1' ? ' checked' : '' ?>><label for="e10">No</label></div>
            </div>

            <label>Map Elements</label>
            <a href="#" id="addMapEl" class="btn btn-small" style="margin:0.5rem 0" onclick="return false">Add Map Element</a>

            <div id="mapels">
                <?
                $totalRows = $data ? count($data->colors) : 1;
                for ($i = 0; $i < $totalRows; $i++) {
                    $num = $i + 1;
                    $color = $data ? $data->colors[$i] : '';
                    $name = $data ? $data->names[$i] : '';
                ?>
                    <div class="mapel" data-row="<?= $num ?>">
                        <span>#<?= $num ?></span>
                        <input type="color" name="color[]" style="max-width:55px" <?= $data ? " value=\"$color\"" : '' ?>>
                        <input type="text" name="element_name[]" class="field" placeholder="Element name" <?= $data ? " value=\"$name\"" : '' ?>>
                        <a href="#" data-row="<?= $num ?>" <?= $totalRows == 1 ? 'style="display:none" ' : '' ?>class="deleteMapEl btn btn-red btn-small">Delete</a>
                    </div>
                <? } ?>
            </div>

            <label>Product Status</label>
            <div class="radio-group">
                <div class="radio">
                    <input type="radio" id="v1" name="status" value="1" <?= $prod['status'] == '1' ? ' checked' : '' ?>><label for="v1">Active</label>
                </div>
                <div class="radio">
                    <input type="radio" id="v2" name="status" value="0" <?= $prod['status'] != '1' ? ' checked' : '' ?>><label for="v2">Inactive</label>
                </div>
            </div>

            <div class="btn-group">
                <input type="submit" class="btn btn-green" name="save" value="<?= isset($_GET['duplicate']) ? 'Duplicate' : ucfirst($pgen->id()) ?> Product">
                <input type="button" class="btn btn-gray go-back" value="Go back">
            </div>
        </form>

    <? } else { ?>
        <a class="btn" href="./products/create">Create Product</a>

        <table class="table spacing">
            <thead>
                <tr>
                    <th>Identifier</th>
                    <th>Product Name</th>
                    <th># of Elements</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Modified</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <? foreach ($prods as $prod) {
                    $stat = $prod['status'] == 1 ? 'active' : 'inactive';
                ?>
                    <tr>
                        <td><?= $prod['identifier'] ?></td>
                        <td><?= $prod['name'] ?></td>
                        <td><?= count(json_decode($prod['data'])->names) ?></td>
                        <td><span class="status <?= $stat ?>"><?= $stat ?></span></td>
                        <td><?= $helper->dateFormat($prod['created']) ?></td>
                        <td><?= $helper->dateFormat($prod['modified']) ?></td>
                        <td><a href="products/edit?duplicate=1&pid=<?= $prod['pid'] ?>">duplicate</a> | <a href="products/edit?pid=<?= $prod['pid'] ?>">edit</a></td>
                    </tr>
                <? } ?>
            </tbody>
        </table>
    <? } ?>
</div>