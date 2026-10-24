<?
$isDevel = isset($_GET['devel']);
if ($isDevel) $stripeLive = false;

require_once '/home/mapo/stripe/init.php';
require_once '/home/mapo/vendor/autoload.php';
require_once '/home/mapo/public_html/subs.inc.php';

$stripe = new \Stripe\StripeClient($stripeSecretKey);
$portal = null;
$portalError = $subFetchError = null;

function cardIcon($c)
{
    $card = match ($c) {
        'visa' => 'cc-visa',
        'mastercard' => 'cc-mastercard',
        'american_express' => 'cc-amex',
        default => ''
    };

    return $card ? "<i class=\"fa-brands fa-$card\" style=\"font-size:20px;color:var(--blue);margin-right:0.33rem\"></i>" : '';
}

// get customer ID and any subscriptions from the DB
$now = time();
$portalUrl = '';
$activeSubscriptionsData = [];

$customerID = $_GET['cid'] ?: mysqli_fetch_assoc(mysqli_query($con, "SELECT cid FROM billing WHERE email = '$user[email]' ORDER BY status ASC, created DESC LIMIT 1"))['cid'];

if ($customerID) {
    $params = null;
    if (isset($_GET['ref'])) $params[] = "ref={$_GET['ref']}";
    if (isset($_GET['devel'])) $params[] = 'devel=1';
    $returnUrl = $_GET['next'] ?: 'https://mapotechnology.com/account/billing' . ($params ? '?' . implode('&', $params) : '');

    // create a session to stripe's portal to manage things on their end
    try {
        $portalSession = $stripe->billingPortal->sessions->create([
            'customer' => $customerID,
            'return_url' => $returnUrl
        ]);

        $portalUrl = $portalSession->url;
    } catch (Exception $e) {
        if (!str_contains($e->getMessage(), 'No such')) {
            $portalError = $e->getMessage();
        }
    }

    // get list of subscriptions for this user
    try {
        $subsList = $stripe->subscriptions->all([
            'customer' => $customerID,
            'status' => 'all',
            'limit' => 5
        ]);

        foreach ($subsList->data as $sub) {
            if (!in_array($sub->status, ['active', 'trialing', 'past_due'])) {
                continue;
            }

            $subId = $sub->id;

            $subRowQuery = mysqli_query($con, "SELECT * FROM billing WHERE subscription = '$subId' LIMIT 1");
            $row = mysqli_fetch_assoc($subRowQuery);
            if (!$row) continue;

            // Plan routing logic
            $product = $plan->setPlan(null, $row['plan'], $isDevel);
            $upgrade = false;
            if (str_contains($plan->getPriceName(), 'ignite')) {
                $upgrade = true;
                $newName = $plan->allPlans()[2]['name'];
                $newPlan = $plan->allPlans()[2]['price_id'][1][$isDevel ? 'id2' : 'id'];
            } else {
                $newName = $plan->allPlans()[1]['name'];
                $newPlan = $plan->allPlans()[1]['price_id'][0][$isDevel ? 'id2' : 'id'];
            }

            // Stripe Upcoming Invoice Preview for Upgrades/Downgrades
            $amountDue = 0;

            try {
                $invoicePreview = $stripe->invoices->createPreview([
                    'customer' => $row['cid'],
                    'subscription' => $subId,
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
                $amountDue = $invoicePreview->total;
            } catch (Exception $e) {
                // Fallback if preview fails
            }

            $howPay = 'Unknown';
            try {
                if (!empty($sub->default_payment_method)) {
                    $pm = $stripe->paymentMethods->retrieve($sub->default_payment_method, []);
                    if (!empty($pm->card->brand)) {
                        $howPay = cardIcon($pm->card->brand) . ucfirst($pm->card->brand) . " ending in {$pm->card->last4}";
                    } elseif (!empty($pm->us_bank_account->bank_name)) {
                        $howPay = 'Bank account (' . ucfirst($pm->us_bank_account->bank_name) . ") ending in {$pm->card->last4}";
                    } else {
                        $howPay = ucfirst($pm->type);
                    }
                }
            } catch (Exception $e) {
            }

            $canceled = ($row['status'] == 'cancel' || $row['cancel_end_period'] == 1);
            $status = $canceled ? 'canceled' : (!empty($row['trial']) ? 'trial' : 'active');

            $activeSubscriptionsData[] = [
                'id' => $subId,
                'product_name' => $product->getName(),
                'product_total_price' => $product->getTotalPrice(),
                'status' => $status,
                'start' => $row['start'],
                'end' => $row['end'],
                'current_period_end' => $sub->current_period_end,
                'trial' => $row['trial'],
                'canceled' => $canceled,
                'how_pay' => $howPay,
                'upgrade' => $upgrade,
                'new_name' => $newName,
                'new_plan' => $newPlan,
                'amount_due' => $amountDue,
                'is_app' => ($_GET['ref'] == 'com.mapollc.mapofire') ? ' data-app="1"' : ''
            ];
        }
    } catch (Exception $e) {
        if (!str_contains($e->getMessage(), 'No such')) {
            $subFetchError = $e->getMessage();
        }
    }
}

if ($_GET['method'] == 'portal') {
    header("Location: $portalUrl");
    exit();
}

if (isset($_REQUEST['cancel'])) {
    $msg = $_REQUEST['when'] == 'immediate'
        ? 'Your subscription has been canceled. You no longer have access to premium features.'
        : 'Your subscription will be canceled at the end of your billing period.';

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

if ($portalError || $subFetchError) {
    echo message(false, $portalError ?? $subFetchError);
}
?>
<div class="row">
    <div class="col w100">
        <div class="card" id="billingCard">
            <? if (isset($_SESSION['groups'])) {
                $orgName = $_SESSION['groups']['org_name'];
                echo message(null, "Your account is part of an commerical group account with <b>$orgName</b>.", true, true);
            } ?>

            <h1 style="text-align:center">Subscriptions & Billing</h1>

            <? if (empty($activeSubscriptionsData)) { ?>
                <p style="text-align:center">
                    You're not currently subscribed. Unlock premium and professional features to get the most out of our services.
                </p>
                <div class="btn-group" style="width:100%;justify-content:center">
                    <a href="https://mapotechnology.com/purchase/mapofire?ref=account&customer_email=<?= $user['email'] ?><?= $customerID ? "&cid=$customerID" : '' ?>" class="btn btn-green"><?= $customerID ? 'Get access to premium features' : 'Start Your Free Trial' ?></a>
                    <? if ($portal) {
                        echo "<a class=\"btn btn-black\" href=\"$portal->url\">Manage Payment Methods</a>";
                    } ?>
                </div>
            <? return;
            }

            $styles = [
                'canceled' => 'background-color:#f8d7da;color:#721c24;',
                'trial'    => 'background-color:#fceabb;color:#6b4f00;',
                'active'   => 'background-color:#d4edda;color:#155724;'
            ];

            foreach ($activeSubscriptionsData as $sub) { ?>
                <div class="sub">
                    <h2 style="font-size:21px"><?= $sub['product_name'] ?></h2>

                    <span class="sub-badge" style="<?= $styles[$sub['status']] ?>"><?= $sub['status'] ?></span>

                    <p style="padding-top:1em">
                        <b>Billing cycle:</b> <?= date('F j, Y', $sub['start']) . ' - ' . date('F j, Y', $sub['end']) ?>
                    </p>

                    <? if (!$sub['canceled']) { ?>
                        <p id="next-pymt"><b>Next payment:</b> $<?= $sub['product_total_price'] ?> on <?= date('F j, Y', $sub['end']) ?></p>
                    <? } ?>

                    <p><b>Payment method:</b> <?= $sub['how_pay'] ?></p>

                    <? if (!$sub['canceled']) {
                        $text = $sub['trial'] == 1
                            ? "Your free trial will end on " . date('F j, Y', $sub['end']) . ". After that, your default payment method will be charged automatically."
                            : "Your subscription is active and will renew on " . date('F j, Y', $sub['current_period_end']) . ". Your default payment method will be charged automatically.";

                        echo "<span id=\"trial-notice\" class=\"help\">$text</span>";
                    } else {
                        echo '<span id="can-notice" class="help">Your subscription has been canceled and it will remain active until ' . date('F j, Y', $sub['end']) . '.</span>';
                    } ?>

                    <div class="btn-group" id="cancels">
                        <div id="processing" style="display:none;align-items:center;gap:1rem">
                            <div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>
                        </div>

                        <? if (!$sub['canceled']) { ?>
                            <a class="btn btn-gray"
                                href="#"
                                id="modify"
                                data-amount="<?= $sub['amount_due'] ?>"
                                <?= $sub['is_app'] ?>
                                data-sid="<?= $sub['id'] ?>"
                                data-name="<?= $sub['new_name'] ?>"
                                data-new-plan="<?= $sub['new_plan'] ?>"
                                data-method="<?= $sub['upgrade'] ? 'up' : 'down' ?>grade"
                                onclick="return false"><?= $sub['upgrade'] ? 'Up' : 'Down' ?>grade</a>

                            <a class="btn btn-red"
                                href="#"
                                id="cancel"
                                <?= $sub['is_app'] ?>
                                data-sid="<?= $sub['id'] ?>"
                                data-name="<?= $sub['product_name'] ?>"
                                onclick="return false">Cancel subscription</a>
                        <? } else { ?>
                            <a href="#"
                                id="resume"
                                class="btn btn-green"
                                <?= $sub['is_app'] ?>
                                data-sid="<?= $sub['id'] ?>"
                                onclick="return false">Resume Subscription</a>
                        <? } ?>
                    </div>

                    <div style="clear:both"></div>
                    <a href="billing/portal?cid=<?= $customerID . (isset($_GET['ref']) ? "&ref={$_GET['ref']}" : '') . ($isDevel ? '&devel=1' : '') ?>" style="font-size:14px">Manage Payment Methods</a>
                </div>
            <? } ?>
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
                echo '<div id="invoices" data-cid="' . $customerID . '" style="text-align:center"><div class="spinner"></div></div>';
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