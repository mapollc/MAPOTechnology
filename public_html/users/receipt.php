<?
ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);

session_start();

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

if (!$_SESSION['email']) {
    http_response_code(403);
    exit;
}

$invoiceId = preg_replace('/[^a-zA-Z0-9_]/', '', $_GET['id']);
$json = json_decode(file_get_contents("https://api.mapotechnology.com/v2/account/receipt?key=c196d0958608ad2b7d4af2be078ecc54&id=$invoiceId" . (isset($_GET['devel']) ? '&devel=1' : '')));

if (!$json) {
    http_response_code(404);
    exit;
}

$data = $json->receipt;

if ($data->customer->email != $_SESSION['email']) {
    /*http_response_code(403);
    exit;*/
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #<?= $data->invoice_number ?> - MAPO LLC</title>
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap">
    <link rel="stylesheet" href="//mapotechnology.com/src/css/receipt.css">
    <script async src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
</head>

<body>

    <div class="toolbar">
        <div class="actions">
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fa-solid fa-print"></i> Print
            </button>
            <!--<button class="btn btn-primary" onclick="window.print()">
                <i class="fa-solid fa-download"></i> Download PDF
            </button>-->
        </div>
    </div>

    <div class="document-container">
        <header class="brand-header">
            <div class="header-top">
                <div class="logo">
                    <img src="https://mapotechnology.com/assets/images/mapo_logo_small.png">
                </div>

                <div class="document-title-badge">
                    <span class="status-badge <?= $data->status ?>">
                        <i class="fa-solid fa-circle-<?= $data->status === 'paid' ? 'check' : 'x' ?>"></i> <?= $data->status == 'void' ? 'Void' : (($data->status != 'paid' ? 'Unp' : 'P') . 'aid') ?>
                    </span>
                </div>
            </div>

            <div class="header-grid">
                <div class="meta-item">
                    <div class="meta-label">Invoice Number</div>
                    <div class="meta-value"><?= $data->invoice_number ?></div>
                </div>
                <? if ($data->receipt_number) { ?>
                    <div class="meta-item" id="receiptNoMeta">
                        <div class="meta-label">Receipt Number</div>
                        <div class="meta-value"><?= $data->receipt_number ?></div>
                    </div>
                <? } ?>
                <div class="meta-item">
                    <div class="meta-label">Date Issued</div>
                    <div class="meta-value"><?= $data->date ?></div>
                </div>
                <div class="meta-item" id="datePaidMeta">
                    <div class="meta-label"><?= $data->due_date ? 'Due Date' : 'Payment Date' ?></div>
                    <div class="meta-value"><?= $data->due_date ?? $data->payment_date ?></div>
                </div>
            </div>
        </header>

        <main class="document-body">
            <? if ($data->hosted_invoice_url && $data->status == 'open') { ?>
                <a class="pay" href="<?= $data->hosted_invoice_url ?>">Pay this invoice</a>
            <? } ?>

            <section class="parties-grid">
                <div class="party-block">
                    <div class="party-label">Pay To</div>
                    <div class="party-name">MAPO LLC</div>
                    <p>
                        69336 Summerville Road<br>
                        Summerville, OR 97876<br>
                        payments@mapotechnology.com
                    </p>
                </div>

                <div class="party-block">
                    <div class="party-label">Bill To</div>
                    <div class="party-name"><?= $data->customer->name ?></div>
                    <p>
                        <?= $data->customer->address->line1 ?: 'N/A' ?><br>
                        <?= $data->customer->address->line2 ? $data->customer->address->line2 . '<br>' : '' ?>
                        <?= $data->customer->address->city ?>,
                        <?= $data->customer->address->state ?>
                        <?= $data->customer->address->postal_code ?><br>
                        <?= $data->customer->email ?>
                    </p>
                </div>

            </section>

            <section class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-center">Unit Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <? foreach ($data->items as $item) { ?>
                            <tr>
                                <td>
                                    <div class="item-desc"><?= $item->description ?></div>
                                    <div class="item-subtext"><?= date('M j, Y', $item->period->start) . ' - ' . date('M j, Y', $item->period->end) ?></div>
                                </td>
                                <td class="text-center"><?= $item->quantity ?></td>
                                <td class="text-center">$<?= $item->amount ?></td>
                                <td class="text-right">$<?= $item->amount * $item->quantity ?></td>
                            </tr>
                        <? } ?>
                    </tbody>
                </table>
            </section>

            <section class="financial-summary">
                <div class="summary-box">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>$<?= number_format($data->costs->subtotal, 2) ?></span>
                    </div>
                    <? if ($data->costs->discount) { ?>
                        <div class="summary-row credit">
                            <span><?= $data->costs->discount->code ?> (<?= ($data->costs->discount->type != 'percent' ? '$' : '') . $data->costs->discount->value . ($data->costs->discount->type == 'percent' ? '%' : '') ?>)</span>
                            <span>-$<?= number_format($data->costs->discount->amount, 2) ?></span>
                        </div>
                    <? } ?>
                    <div class="summary-row">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                    </div>
                    <div class="summary-row">
                        <span>Total</span>
                        <span>$<?= number_format($data->costs->total, 2) ?></span>
                    </div>
                    <? if (!empty($data->costs->applied_balance) && $data->costs->applied_balance !== 0) { ?>
                        <div class="summary-row credit">
                            <span>Applied balance</span>
                            <span>$<?= number_format($data->costs->applied_balance, 2) ?></span>
                        </div>
                    <? } ?>
                    <div class="summary-row total">
                        <?
                        $isPaid = $data->status === 'paid';
                        $displayAmount = $data->costs->total;
                        if (isset($data->costs->applied_balance) && $data->costs->applied_balance > 0 && !$isPaid) {
                            $displayAmount -= $data->costs->applied_balance;
                        }
                        $displayAmount = max(0, $displayAmount);
                        ?>
                        <span id="totalPaidLabel">Amount <?= $isPaid ? 'Paid' : 'Due' ?></span>
                        <span id="totalAmount">$<?= number_format($displayAmount, 2) ?></span>
                    </div>
                </div>
            </section>

            <? if ($isPaid) { ?>
                <h2>Payments</h2>
                <?
                $pm = $data->payment;
                $howPay = ucfirst($pm->type);

                if ($pm->type == 'card') {
                    $howPay = '<p style="display:inline-flex;align-items:center;gap:.33rem">' . cardIcon($pm->brand) . ucfirst($pm->brand) . " &ndash; {$pm->acct}</p>";
                }

                if ($pm->type == 'us_bank_account') {
                    $howPay = "Bank account &ndash; {$pm->acct}";
                }
                ?>
                <table>
                    <thead>
                        <tr>
                            <th>Payment Method</th>
                            <th>Date</th>
                            <th class="text-right">Amount Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><?= $howPay ?></td>
                            <td><?= $data->payment_date ?></td>
                            <td class="text-right">$<?= number_format($displayAmount, 2) ?></td>
                        </tr>
                    </tbody>
                </table>
            <? } ?>
        </main>

        <footer class="document-footer">
            <div class="footer-note">
                <i class="fa-solid fa-lock"></i>
                <span>Processed securely via <a href="//stripe.com" target="_blank">Stripe</a></span>
            </div>
            <div>
                Questions? Contact us at <a href="mailto:payments@mapotechnology.com"><strong>payments@mapotechnology.com</strong></a>
            </div>
        </footer>

    </div>
</body>

</html>