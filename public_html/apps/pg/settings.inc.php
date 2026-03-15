<?
if (isset($_POST['save'])) {
    $helper->query(
        'sssssi',
        [$_POST['name'], $_POST['short_name'], $_POST['tz'], $_POST['date_format'], $_POST['time_format'], $orgID],
        "UPDATE orgs SET name = ?, short_name = ?, timezone = ?, date_format = ?, time_format = ? WHERE oid = ?"
    );

    $pgen->refreshOrg();
    $message = message(true, 'Your organization settings were successfully saved.');
}
?>

<div class="content">
    <h1><?= $title ?></h1>
    <? if (isset($message)) echo $message; ?>

    <form action="" method="post">
        <label>Organization Name</label>
        <input type="text" name="name" class="field" value="<?= $pgen->getOrg()->name() ?>" placeholder="Full organization name">

        <label>Organization Short Name</label>
        <input type="text" name="short_name" class="field" value="<?= $pgen->getOrg()->shortName() ?>" placeholder="Short organization name">

        <label>Preferred Timezone</label>
        <select name="tz">
            <option>- Choose One -</option>
            <option <?= $pgen->getOrg()->timezone() == 'America/Los_Angeles' ? 'selected ' : '' ?>value="America/Los_Angeles">Pacific (-0700/-0800)</option>
            <option <?= $pgen->getOrg()->timezone() == 'America/Denver' ? 'selected ' : '' ?>value="America/Denver">Mountain (-0600/-0700)</option>
            <option <?= $pgen->getOrg()->timezone() == 'America/Chicago' ? 'selected ' : '' ?>value="America/Chicago">Central (-0500/-0600)</option>
            <option <?= $pgen->getOrg()->timezone() == 'America/New_York' ? 'selected ' : '' ?>value="America/New_York">Eastern (-0400/-0500)</option>
            <option <?= $pgen->getOrg()->timezone() == 'UTC' ? 'selected ' : '' ?>value="UTC">UTC/GMT (+0000)</option>
        </select>

        <label>Date Format</label>
        <select name="date_format">
            <? foreach ($dateFormats as $key => $date) { ?>
                <option <?= $pgen->getOrg()->dateFormat() == $key ? 'selected ' : '' ?>value="<?= $key ?>"><?= $date ?></option>
            <? } ?>
        </select>

        <label>Time Format</label>
        <select name="time_format">
            <? foreach ($timeFormats as $key => $time) { ?>
                <option <?= $pgen->getOrg()->timeFormat() == $key ? 'selected ' : '' ?>value="<?= $key ?>"><?= $time ?></option>
            <? } ?>
        </select>

        <input type="submit" name="save" class="btn btn-green" value="Save Changes">
    </form>
</div>