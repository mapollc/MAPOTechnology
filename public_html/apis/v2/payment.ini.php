<?
if ($method == 'subscriptions') {
    ////require_once '/home/mapo/public_html/db.ini.php';
    require_once '/home/mapo/stripe/init.php';
    require_once '/home/mapo/public_html/subs.inc.php';

    $stripe = new \Stripe\StripeClient($stripeSecretKey);
    $subID = $_REQUEST['sid'];

    if (!$subID) {
        $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'A subscription ID was not provided'];
    } else {
        if ($function == 'get') {
            try {
                $sub = $stripe->subscriptions->retrieve($subID, []);
                $returnJson = $sub;
            } catch (Exception $e) {
                $returnJson = ['response' => 'error', 'code' => $e->getCode(), 'msg' => $e->getMessage()];
            }
        } else {
            // cancel a subscription
            if ($function == 'cancel') {
                try {
                    if ($_REQUEST['timing'] == 'now') {
                        $cancel = $stripe->subscriptions->cancel($subID, []);
                    } else {
                        $cancel = $stripe->subscriptions->update($subID, [
                            'cancel_at_period_end' => true
                        ]);
                    }

                    $returnJson = ['response' => 'success'];
                } catch (Exception $e) {
                    $returnJson = ['response' => 'error', 'code' => $e->getCode(), 'msg' => $e->getMessage()];
                }
            } else if ($function == 'resume') {
                try {
                    $cancel = $stripe->subscriptions->update($subID, [
                        'cancel_at_period_end' => false
                    ]);

                    $returnJson = ['response' => 'success'];
                } catch (Exception $e) {
                    $returnJson = ['response' => 'error', 'code' => $e->getCode(), 'msg' => $e->getMessage()];
                }
            } else if ($function == 'modify') { 
                $now = time();
                $upgrade = false;
                $downgrade = false;
                $plan = new ManageSubs();
                $newPriceID = $_REQUEST['newPriceID'];
                
                if (!$plan->isPlan($newPriceID)) {
                    $returnJson = ['response' => 'error', 'code' => 999, 'msg' => 'The new subscription requested is not valid.'];
                } else {
                    $det = prepareQuery('s', [$subID], "SELECT * FROM billing WHERE subscription = ? LIMIT 1");
                    $plan->setPlan(null, $det['plan']);

                    if (str_contains($plan->getPriceName(), 'ignite')) {
                        $upgrade = true;
                    } else {
                        $downgrade = true;
                    }

                    try {
                        $data = $stripe->subscriptions->retrieve($subID);
                        $subItemID = $data->items->data[0]->id;
                        $currentPriceID = $data->plan->id;

                        if ($currentPriceID == $newPriceID) {
                            $returnJson = ['response' => 'error', 'code' => 998, 'msg' => 'You are already subscribed to this plan.'];
                        } else {
                            // if the user is upgrading to a new plan
                            $update = $stripe->subscriptions->update($subID, [
                                'items' => [
                                    [
                                        'id' => $subItemID,
                                        'price' => $newPriceID
                                    ]
                                ],
                                'proration_behavior' => 'always_invoice'
                            ]);

                            $returnJson = [
                                'response' => 'success',
                                'method' => $upgrade ? 'upgrade' : ($downgrade ? 'downgrade' : null),
                                'new_plan' => $newPriceID,
                                'renewal_date' => $update->current_period_end
                            ];
                        }
                    } catch (Exception $e) {
                        $returnJson = ['response' => 'error', 'code' => $e->getCode(), 'msg' => $e->getMessage()];
                    }
                }
            }
        }
    }
} else {
    $paypalEndpoint = '';
    $testMode = false;
    $paypalClientID = '';
    $paypalSecret = '';

    function getToken()
    {
        global $paypalClientID;
        global $paypalSecret;
        global $paypalEndpoint;
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $paypalEndpoint . 'v1/oauth2/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
        curl_setopt($ch, CURLOPT_USERPWD, "$paypalClientID:$paypalSecret");

        $headers = array();
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            echo 'Error:' . curl_error($ch);
        }
        curl_close($ch);

        return json_decode($result)->access_token;
    }

    function venmoRequest($token, $data)
    {
        global $paypalEndpoint;
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $paypalEndpoint . 'v2/checkout/orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $headers = array();
        $headers[] = 'Authorization: Bearer ' . $token;
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            echo 'Error:' . curl_error($ch);
        }
        curl_close($ch);

        return json_decode($result);
    }

    function executePayment($token, $id)
    {
        global $paypalEndpoint;
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $paypalEndpoint . "v2/checkout/orders/$id/capture");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');

        $headers = array();
        $headers[] = 'Authorization: Bearer ' . $token;
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            echo 'Error:' . curl_error($ch);
        }
        curl_close($ch);

        return json_decode($result);
    }

    if (isset($_REQUEST['mode']) && $_REQUEST['mode'] == 'test') {
        $testMode = true;
    }

    $amount = null;
    $error = false;
    $utms = [];

    // get utm parameters
    if (isset($_REQUEST['utm_campaign'])) {
        $utms[] = 'utm_campaign=' . $_REQUEST['utm_campaign'];
    }

    if (isset($_REQUEST['utm_source'])) {
        $utms[] = 'utm_source=' . $_REQUEST['utm_source'];
    }

    if (isset($_REQUEST['utm_medium'])) {
        $utms[] = 'utm_medium=' . $_REQUEST['utm_medium'];
    }

    // get the donation amount
    if ($method != 'capture') {
        if (isset($_REQUEST['custom_amt']) && $_REQUEST['custom_amt'] != '') {
            $amount = $_REQUEST['custom_amt'];
        } else if (isset($_REQUEST['amt']) && $_REQUEST['custom_amt'] == '') {
            $amount = $_REQUEST['amt'];
        } else {
            $error = true;
        }
    }

    if ($error) {
        $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'A donation amount was not specified'];
    } else {
        if ($_REQUEST['src'] == 'venmo') {
            if ($testMode) {
                $paypalEndpoint = 'https://api-m.sandbox.paypal.com/';
                $paypalClientID = 'Ab5Q0vPF1zYCH44h-akUGY6z760tVy2UlEk1vLANzNpXHL4gEI6Oii-BbTrREQKMGqcxSGTAON5YKGKX';
                $paypalSecret = 'ENtnuWe2LFBHd5NTOihUnCZd_UhhmmVusB2ANWJG9pXmrRsOU70dgxCiwGTcyEWTbuMshEt_r2UhbB6S';
            } else {
                $paypalEndpoint = 'https://api-m.paypal.com/';
                $paypalClientID = 'AQJL7RE2fjaGhIo9hMnc0oxHblIvIOnUTDjvSVrTkZXIv5zNCZBYEAx99EO-46b-_Da8xharKvPa15BG';
                $paypalSecret = 'EEA83QEDoowAE-2QYNqz8libowCZqtFecIQoNUj0bY0CLDM2cIDE7W2WpgHwnCcmR4_nRM5tWIeXJBdA';
            }
            $token = getToken();

            if ($method == 'capture') {
                $returnJson = executePayment($token, $_REQUEST['orderID']);
            } else {
                $data = [
                    'intent' => 'CAPTURE', // Use CAPTURE or AUTHORIZE
                    'payment_source' => [
                        'paypal' => [
                            "experience_context" => [
                                "payment_method_preference" => "IMMEDIATE_PAYMENT_REQUIRED",
                                "landing_page" => "LOGIN",
                                "shipping_preference" => "GET_FROM_FILE",
                                "user_action" => "PAY_NOW",
                                "return_url" => "https://example.com/returnUrl",
                                "cancel_url" => "https://example.com/cancelUrl"
                            ]
                        ]
                    ],
                    'purchase_units' => [
                        [
                            'amount' => [
                                'currency_code' => 'USD',
                                'value' => sprintf('%.2f', $amount),
                            ]
                        ]
                    ],
                ];

                $returnJson = venmoRequest($token, $data);
            }
        } else {
            $stripeLive = $testMode ? false : true;
            require_once '/home/mapo/stripe/init.php';

            $stripe = new \Stripe\StripeClient($stripeSecretKey);
            $amount = str_replace('.', '', strval($amount));

            try {
                $priceData = [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => ($testMode ? 'TEST ' : '') . 'Donation',
                        'description' => 'For over 10 years, we’ve led the way with innovative, real-time wildfire tracking. Our lean, mission-driven team operates at just $0.01 per user, and your donation helps us stay independent, sustainable, and accessible to all.',
                        'images' => [
                            'https://d1wqzb5bdbcre6.cloudfront.net/b4833ab7cd5a39866e52df3b2f5ecfc8a6b892fc08f346b918fde95b1a7adaa1/68747470733a2f2f66696c65732e7374726970652e636f6d2f6c696e6b732f4d44423859574e6a64463878545652594e585a4a63454e6b634570744e6d4e5566475a7358327870646d56664d5445315a334236616d70465656524655445a7a6548493261314a425754413230304e7545536471694f'
                        ]
                    ],
                    'unit_amount' => $amount,
                ];

                if ($_REQUEST['timing'] == 'recurring') {
                    $priceData['recurring'] = [
                        'interval' => 'month',
                        'interval_count' => 1
                    ];
                };

                $checkout_session = $stripe->checkout->sessions->create([
                    'line_items' => [
                        [
                            'price_data' => $priceData,
                            'quantity' => 1,
                        ]
                    ],
                    'custom_fields' => [
                        [
                            'key' => 'fname',
                            'label' => ['type' => 'custom', 'custom' => 'First Name'],
                            'type' => 'text',
                            'optional' => true
                        ],
                        [
                            'key' => 'lname',
                            'label' => ['type' => 'custom', 'custom' => 'Last Name'],
                            'type' => 'text',
                            'optional' => true
                        ],
                    ],
                    'mode' => !isset($_REQUEST['timing']) || $_REQUEST['timing'] == 'once' ? 'payment' : 'subscription',
                    'success_url' => 'https://www.' . $_REQUEST['domain'] . '/thank-you?checkout_id={CHECKOUT_SESSION_ID}' . (count($utms) > 0 ? '&' . implode('&', $utms) : ''),
                    'cancel_url' => 'https://www.' . $_REQUEST['domain'] . '/donate?cancel=true' . (count($utms) > 0 ? '&' . implode('&', $utms) : ''),
                ]);

                $returnJson = ['response' => 'success', 'url' => $checkout_session->url];
            } catch (Error $e) {
                $returnJson = ['response' => 'error', 'code' => $e->getCode(), 'msg' => $e->getMessage()];
            }
        }
    }
}
