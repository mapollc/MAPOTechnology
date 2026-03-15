<form id="issueProduct" action="" method="post">
    <? if ($pgen->id() == 'update') {
        echo "<input type=\"hidden\" name=\"replaces\" value=\"$_GET[id]\">";
    } ?>
    <input type="hidden" name="product" value="<?= $product['identifier'] ?>">
    <input type="hidden" name="features" value='<?= $previous['geojson'] ?>'>

    <? if ($settings->validity == 0) {
        echo '<p>This product does not have a valid or expire time.</p>';
    } else { ?>
        <div class="inline">
            <? if ($pgen->id() == 'update') {
                echo '<div><label>Previous Author</label>';
                echo "<input type=\"text\" class=\"field\" style=\"max-width:200px\" value=\"{$author['first_name']} {$author['last_name']}\" disabled>";
                echo '</div>';
            } ?>
            <div>
                <label>Valid from</label>
                <? if ($settings->issuance == 'now') { ?>
                    <input type="text" class="field" style="max-width:185px" value="<?= $helper->dateTime(time(), true) ?>" disabled>
                <? } else { ?>
                    <div style="display:inline-flex;gap:0.5rem">
                        <input type="date" name="validFromDate" class="field" style="max-width:126px"
                            min="<?= date('Y-m-d') ?>"
                            value="<?= date('Y-m-d', $previous ? $previous['valid'] : time()) ?>">

                        <select name="validFromTime">
                            <?= timeOptions($previous['valid'] ?? null, false) ?>
                        </select>
                    </div>
                <? } ?>
            </div>

            <div>
                <label>Valid until</label>
                <? if ($settings->expires == 'predefined') { ?>
                    <input type="text" class="field" style="max-width:185px" value="<?= $helper->dateTime(strtotime("+{$settings->expiresAfter} hours"), true) ?>" disabled>
                <? } else { ?>
                    <div style="display:inline-flex;gap:0.5rem">
                        <input type="date" name="validToDate" class="field" style="max-width:126px"
                            min="<?= date('Y-m-d', strtotime('+12 hours')) ?>"
                            value="<?= date('Y-m-d', $previous ? $previous['expires'] : strtotime('+12 hours')) ?>">

                        <select name="validToTime">
                            <?= timeOptions($previous['expires'] ?? null, true) ?>
                        </select>
                    </div>
                <? } ?>
            </div>

            <div>
                <input type="submit" name="issue" class="btn btn-green" value="<?= $issOrUp ?> Product">
            </div>
        </div>
    <? } ?>

    <div class="prod-layout">
        <? if ($settings->textbox == '1') { ?>
            <div class="disc">
                <h3>Discussion</h3>
                <textarea name="discussion"><?= $previous ? str_replace(['<p>', '</p>'], '', $previous['discussion']) : '' ?></textarea>
            </div>
        <? } ?>

        <div style="width:100%">
            <h3>Geospatial Layout</h3>
            <div id="map" data-config='<?= json_encode(['colors' => $settings->colors, 'names' => $settings->names]) ?>'></div>
            <? if ($previous['demographics']) {
                $demo = json_decode($previous['demographics']);
                ?>
                <span style="font-size:14px">
                    <b>Population affected:</b> <?= number_format($demo->population, 0) ?><br>
                    <b>Cities included: </b> <?= implode(', ', $demo->cities) ?><br>
                    <b>Counties included: </b> <?= implode(', ', $demo->counties) ?><br>
                    <b>States included: </b> <?= implode(', ', $demo->states) ?>
                </span>
            <? } ?>
        </div>
    </div>
</form>