<?
/*if ($_SESSION['uid'] == 1) {
    $stripeLive = false;
}*/

require_once '/home/mapo/public_html/subs.inc.php';
require_once '/home/mapo/stripe/init.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);

if ($_GET['method'] == 'portal') {
    try {
        $portal = $stripe->billingPortal->sessions->create([
            'customer' => $_GET['cid'],
            'return_url' => ($_GET['next'] ? $_GET['next'] : 'https://www.mapotechnology.com/account/billing' . (isset($_GET['ref']) ? '?ref=' . $_GET['ref'] : '')),
        ]);

        header("Location: $portal->url");
        exit();
    } catch (Exception $e) {
        echo message(false, $e->getMessage());
    }
}

/*if ($_GET['method'] == 'manage') {
    require_once '/home/mapo/public_html/users/admin/incs/manage-subs.ini.php';
} else {*/
// get customer ID and any subscriptions from the DB
$now = time();
$customerID = mysqli_fetch_assoc(mysqli_query($con, "SELECT cid FROM billing WHERE email = '$user[email]' ORDER BY status ASC, created DESC LIMIT 1"))['cid'];
$sql = mysqli_query($con, "SELECT * FROM billing WHERE status != 'expired' AND email = '$user[email]' ORDER BY created DESC");
$num = mysqli_num_rows($sql);

if (isset($_REQUEST['cancel'])) {
    if ($_REQUEST['when'] == 'immediate') {
        $msg = 'Your subscription has been canceled. You no longer have access to premium features.';
    } else {
        $msg = 'Your subscription will be canceled at the end of your billing period.';
    }

    echo message(true, $msg, false, true);
}

if (isset($_GET['needed']) && $_GET['needed'] == 'upgrade') {
    echo message(true, 'Please upgrade your subscription to gain access to even more features and tools.', true, true);
}

if (isset($_REQUEST['upgrade'])) {
    $msg = 'Your subscription has been upgraded. Your default payment method was charged accordingly.';

    if (isset($_POST['forced'])) {
        $msg .= ' <a href="https://mapofire.com">Return to Map of Fire</a>';
    }
    
    echo message(true, $msg, false, true);
}

if (isset($_REQUEST['downgrade'])) {
    echo message(true, 'Your subscription was downgraded. Your next invoice will be prorated accordingly.', false, true);
}

if (isset($_REQUEST['resume'])) {
    echo message(true, 'Your subscription has been resumed. Your payment method will continue to be charged as scheduled.', false, true);
}

if (isset($_GET['checkout_id'])) {
    echo message(true, 'Thank you! Your ' . ($_GET['isTrial'] == 1 ? 'free 7-day trial' : 'subscription') . ' is now active. You now have access to premium tools & features.', false, true);
}
?>
<div class="row">
    <div class="col w100">
        <div class="card">
            <h1 style="text-align:center">Subscriptions & Billing</h1>

            <?
            if ($num == 0) { ?>
                <p style="text-align:center">
                    You're not currently subscribed. Unlock premium and professional features to get the most out of our service.
                </p>
                <p style="text-align:center">
                    <a href="https://www.mapotechnology.com/purchase/mapofire?ref=account&customer_email=<?=$user['email']?><?= ($customerID ? '&cid=' . $customerID : '') ?>" class="btn btn-green"><?=$customerID ? 'Get access to premium features' : 'Start Your Free Trial'?></a>
                </p>
                <? } else {
                while ($row = mysqli_fetch_assoc($sql)) {
                    $upgrade = $downgrade = false;
                    $product = $plan->setPlan(null, $row['plan']);
                    
                    if (str_contains($plan->getPriceName(), 'ignite')) {
                        $upgrade = true;
                        $newName = $plan->allPlans()[2]['name'];
                        $newPlan = $plan->allPlans()[2]['price_id'][1]['id'];
                    } else {
                        $downgrade = true;
                        $newName = $plan->allPlans()[1]['name'];
                        $newPlan = $plan->allPlans()[1]['price_id'][0]['id'];
                    }

                    try {
                        $sub = $stripe->subscriptions->retrieve($row['subscription'], []);
                        $invoicePreview = $stripe->invoices->upcoming([
                            'customer' => $row['cid'],
                            'subscription' => $row['subscription'],
                            'subscription_details' => [
                                'items' => [
                                    [
                                        'id' => $sub->items->data[0]->id,
                                        'price' => $newPlan
                                    ]
                                ],
                                'proration_behavior' => 'always_invoice'
                            ]
                        ]);

                        $canceled = $row['status'] == 'cancel' ? true : false;
                        $cancelEndPeriod = $row['cancel_end_period'] == 1 ? true : false;
                        $pm = $stripe->paymentMethods->retrieve($sub->default_payment_method, []);
                        $amountDue = $invoicePreview->amount_due;

                        if ($pm->card->brand) {
                            $howPay = ucfirst($pm->card->brand) . ' ending in ' . $pm->card->last4;
                        } else if ($pm->us_bank_account->bank_name) {
                            $howPay = 'Bank account (' . ucfirst($pm->us_bank_account->bank_name) . ') ending in ' . $pm->card->last4;
                        } else {
                            $howPay = ucfirst($pm->type);
                        }
                ?>
                        <div class="sub">
                            <h2 style="font-size:21px"><?= $product->getName() ?></h2>

                            <? if ($canceled) { ?>
                                <span class="sub-badge" style="background-color:#f8d7da;color:#721c24;">canceled</span>
                                <? } else {
                                if ($row['trial']) { ?>
                                    <span class="sub-badge" style="background-color:#fceabb;color:#6b4f00;">trial</span>
                                <? } else { ?>
                                    <span class="sub-badge" style="background-color:#d4edda;color:#155724;">active</span>
                            <? }
                            } ?>

                            <p style="padding-top:1em"><b>Billing cycle:</b> <?= date('M j, Y', $row['start']) . ' - ' . date('M j, Y', $row['end']) ?></p>
                            <? if (!$canceled) {?>
                            <p id="next-pymt"><b>Next payment:</b> $<?= $product->getTotalPrice() ?> on <?= date('M j, Y', $row['end']) ?></p>
                            <? } ?>
                            <p><b>Payment method:</b> <?= $howPay ?> </p>

                            <?if (!$canceled) {
                                if ($row['trial'] == 1) {
                                    $text = 'Your free trial will end on '.date('F j, Y', $row['end']).'. After that, your default payment method will be charged automatically.';   
                                } else {
                                    $text = 'Your subscription is active and will renew on '.date('F j, Y', $sub->current_period_end).'. Your default payment method will be charged automatically.';
                                }?>
                            <span id="trial-notice" class="help"><?=$text?></span>

                            <div class="btn-group" id="cancels">
                                <a class="btn btn-gray" href="#" id="modify" data-amount="<?=$amountDue?>"<?=$_GET['ref'] == 'com.mapollc.mapofire' ? ' data-app="1"' : ''?> data-sid="<?= $row['subscription'] ?>" data-name="<?=$newName?>" data-new-plan="<?=$newPlan?>" data-method="<?=$upgrade ? 'up' : 'down'?>grade" onclick="return false"><?=$upgrade ? 'Up' : 'Down'?>grade</a>
                                <a class="btn btn-red" href="#" id="cancel" <?=$_GET['ref'] == 'com.mapollc.mapofire' ? ' data-app="1"' : ''?> data-sid="<?= $row['subscription'] ?>" data-name="<?=$product->getName()?>" onclick="return false">Cancel subscription</a>
                            </div>
                            <? } 
                            if ($canceled) {?>
                            <span id="can-notice" class="help">Your subscription has been canceled and will remain active until <?= date('F j, Y', $row['end']) ?>.</span>
                            <? } ?>

                            <!--<div id="btns-can" class="btn-group" <?= $canceled ? ' style="display:none"' : '' ?>>
                                <a href="#" id="cancel-now" data-sid="<?= $row['subscription'] ?>" class="btn btn-sm btn-red" onclick="return false">Cancel Now</a>
                                <a href="#" id="cancel-later" data-sid="<?= $row['subscription'] ?>" class="btn btn-sm btn-red" onclick="return false">Cancel Later</a>
                            </div>-->

                            <?if ($canceled) {?>
                            <div id="btns-res" class="btn-group">
                                <a href="#" id="resume" class="btn btn-green"<?=$_GET['ref'] == 'com.mapollc.mapofire' ? ' data-app="1"' : ''?>data-sid="<?= $row['subscription'] ?>" onclick="return false">Resume Subscription</a>
                            </div>
                            <? } ?>

                            <div style="clear:both"></div>
                            <a href="billing/portal?cid=<?=$customerID . (isset($_GET['ref']) ? '&ref=' . $_GET['ref'] : '')?>" style="font-size:14px">Manage Payment Methods</a>
                        </div>
            <? } catch (Exception $e) {
                        //echo $e->getMessage();
                    }
                }
            } ?>
        </div>
    </div>
</div>

<div class="row" style="margin-top:3em">
    <div class="col w100">
        <div class="card">
            <h1 style="text-align:center">Invoices & Receipts</h1>

            <?
            if (!$customerID) {
                echo '<p style="text-align:center">There are no invoices or receipts for your account.</p>';
            } else {
                echo '<div id="invoices" style="text-align:center"><div class="spinner"></div></div>';
                /*try {
                    $invoices = $stripe->invoices->all([
                        'customer' => $customerID,
                        'limit' => 25
                    ]);

                    if (!$invoices || count($invoices) > 0) { ?>
                        <div class="table-responsive">
                            <table class="table small">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Receipt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?
                                    foreach ($invoices as $invoice) {
                                        if ($invoice->status == 'paid') {
                                            $amt = $invoice->amount_paid;
                                        } else {
                                            $amt = $invoice->amount_remaining;
                                        }
                                    ?>
                                        <tr>
                                            <td><?= $invoice->number ? $invoice->number : 'N/A' ?></td>
                                            <td><?= date('F j, Y', $invoice->created) ?></td>
                                            <td>$<?= number_format($amt / 100, 2) ?></td>
                                            <td><span class="inv-paid<?= $invoice->status != 'paid' ? ' no' : '' ?>"><?= $invoice->status ?></span></td>
                                            <td><? if ($invoice->hosted_invoice_url) { ?>
                                                    <a target="blank" href="<?= $invoice->hosted_invoice_url ?>">View</a>
                                                <? }
                                                if ($invoice->invoice_pdf) { ?> &nbsp;&middot;&nbsp; <a href="<?= $invoice->invoice_pdf ?>">Download</a><? } ?>
                                            </td>
                                        </tr>
                                    <? } ?>
                                </tbody>
                            </table>
                        </div>
            <? } else {
                        echo '<p>There are no invoices or receipts for your account.</p>';
                    }
                } catch (Exception $e) {
                    //echo $e->getMessage();
                }*/
            }
            ?>
        </div>
    </div>
</div>
<?//}?>