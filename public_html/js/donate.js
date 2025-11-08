let amount = 25.00,
    fees = 0,
    canPay = false,
    donationType = 'once',
    testMode = window.location.search.search('mode=test') >= 0 ? true : false,
    customAmount = document.querySelector('input[name=custom_amt]');

function estimateFees(total = false, venmo = false) {
    const pct = (venmo ? 0.019 : 0.029),
        flat = (venmo ? 0.10 : 0.30),
        fee = (amount * pct) + flat,
        amt = total ? Number(amount) + Number(fee) : fee;

    return Number(amt).toFixed(2);
}

function changeFees() {
    if (document.querySelector('.fees') != null) {
        document.querySelector('.fees label span').innerHTML = '$' + new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(estimateFees(true));
    }
}

function enableBtns() {
    const submit = document.querySelector('#dbox input[type=submit]');

    if (canPay) {
        submit.disabled = false;
    } else {
        submit.disabled = true;
    }
}

function extractUTMParameters(url) {
    const utmParams = {};
    const urlParts = url.split('?');

    if (urlParts.length > 1) {
        const queryString = urlParts[1];
        const params = new URLSearchParams(queryString);
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        let foundUTM = false;

        utmKeys.forEach(key => {
            const value = params.get(key);
            if (value) {
                utmParams[key] = value;
                foundUTM = true;
            }
        });

        return foundUTM ? utmParams : null;
    }

    return null;
}

function error(msg) {
    const err = '<p class="message error">' + msg + '</p>';
    document.querySelector('form').insertAdjacentHTML('beforebegin', err);
}

function venmo() {
    paypal.Buttons({
        fundingSource: paypal.FUNDING.VENMO,
        style: {
            layout: 'vertical',
            size: 'responsive',
            shape: 'rect',
            label: 'donate'
        },
        onClick: () => {
            const feeInput = document.querySelector('input[name=fees]');

            if (feeInput != null && feeInput.checked) {
                fees = estimateFees(false, true);
                amount = (Number(amount) + Number(fees)).toFixed(2).toString();
            }

            gtag('event', 'begin_checkout', {
                value: amount,
                currency: 'USD',
                items: [{
                    item_name: 'Donation',
                    price: amount,
                    quantity: 1
                }],
                donation_type: donationType,
                donation_amount: amount
            });
        },
        createOrder: () => {
            const params = new FormData();

            if (document.querySelector('.message') != null) {
                document.querySelector('.message').remove();
            }

            params.append('key', '50e2c43f8f63ff0ed20127ee2487f15e');
            if (testMode) {
                params.append('mode', 'test');
            }
            params.append('src', 'venmo');
            params.append('amt', Number(amount).toFixed(2).toString());
            
            return fetch('https://api.mapotechnology.com/v2/payment', {
                method: 'POST',
                body: params
            }).then((res) => {
                return res.json();
            }).then((orderData) => {
                if (orderData && orderData.id) {
                    return orderData.id;
                } else {
                    console.error('Error creating order:', orderData);
                    return null;
                }
            });
        },
        onError: (err) => {
            error(err.message);
        },
        onCancel: () => {
            window.location.href = 'https://' + window.location.host + '/donate?cancel=true';
        },
        onApprove: (data) => {
            const fd = new FormData();
            fd.append('key', '50e2c43f8f63ff0ed20127ee2487f15e');
            fd.append('orderID', data.orderID);
            fd.append('src', 'venmo');
            if (testMode) {
                fd.append('mode', 'test');
            }
            return fetch('https://api.mapotechnology.com/v2/payment/capture', {
                method: 'POST',
                body: fd
            }).then((res) => {
                return res.json();
            }).then((details) => {
                let utms = '';
                const utm = extractUTMParameters(window.location.href);

                if (utm != null) {
                    const keys = Object.keys(utm);
    
                    keys.forEach((it) => {
                        utms += '&' + it + '=' + utm[it];
                    });
                }

                if (details && details.status == 'COMPLETED') {
                    window.location.href = 'https://' + window.location.host + '/thank-you?src=venmo&orderID=' + details.id + (utms != '' ? utms : '');
                } else {
                    error(details.details[0].description);
                }
            });
        }
    }).render('#paypal-button-container');
}

document.onreadystatechange = async () => {
    if (document.readyState == 'complete') {
        changeFees();
        venmo();

        if (document.querySelector('input[name=fees]') != null) {
            document.querySelector('input[name=fees]').addEventListener('change', (e) => {
                if (e.target.checked) {
                    fees = estimateFees();
                    amount = Number(Number(amount) + Number(fees)).toFixed(2);
                } else {
                    amount = Number(Number(amount) - Number(fees)).toFixed(2);
                    fees = 0;
                }
            });
        }

        document.querySelector('form#dbox').addEventListener('submit', async (e) => {
            e.preventDefault();

            amount = Number(amount).toFixed(2).toString();

            if (document.querySelector('.message') != null) {
                document.querySelector('.message').remove();
            }

            gtag('event', 'begin_checkout', {
                value: amount,
                currency: 'USD',
                items: [{
                    item_name: 'Donation',
                    price: amount,
                    quantity: 1
                }],
                donation_type: donationType,
                donation_amount: amount
            });

            const submitBtn = document.querySelector('input[type=submit]');
            submitBtn.value = 'Loading...';
            submitBtn.disabled = true;

            const formData = new FormData(e.target);
            const utm = extractUTMParameters(window.location.href);
            const params = new URLSearchParams();
            params.append('key', '50e2c43f8f63ff0ed20127ee2487f15e');

            if (utm != null) {
                const keys = Object.keys(utm);

                keys.forEach((it) => {
                    params.append(it, utm[it]);
                });
            }

            for (const [name, value] of formData) {
                params.append(name, value);
            }

            const submit = await fetch('https://api.mapotechnology.com/v2/payment', {
                method: 'POST',
                body: params
            });

            if (submit.ok) {
                const resp = await submit.json();

                if (resp.response == 'error') {
                    submitBtn.value = 'Donate';
                    submitBtn.disabled = false;
                } else {
                    window.location.href = resp.url;
                }
            }
        });

        document.querySelector('.timing').addEventListener('change', () => {
            const chk = document.querySelector('input[name=timing]:checked');

            donationType = chk.value;
            document.querySelector('.note').style.display = chk.value == 'once' ? 'none' : 'block';
            //document.querySelector('#pay-with-venmo').style.display = chk.value != 'once' ? 'none' : 'inline-flex';
            document.querySelector('#paypal-button-container').style.display = chk.value != 'once' ? 'none' : '';
        });

        document.querySelector('.preset').addEventListener('change', () => {
            amount = parseFloat(
                document.querySelector('input[name=amt]:checked').value
            );
            changeFees();

            if (customAmount.value != '') {
                customAmount.value = '';
            }

            canPay = true;
            enableBtns();
        });

        customAmount.addEventListener('blur', (e) => {
            let value = e.target.value;

            if (value != '') {
                amount = Number(value).toFixed(2);
                e.target.value = amount;
            } else {
                amount = null;
                canPay = false;
                enableBtns(false);
            }
        });

        customAmount.addEventListener('keyup', (e) => {
            if (e.target.value != '') {
                document.querySelectorAll('input[name=amt]').forEach((r) => {
                    r.checked = false;
                });

                canPay = true;
                enableBtns();
            } else {
                canPay = false;
                enableBtns(false);
            }

            let value = e.target.value.replace(/[^0-9.]/g, ''),
                decimalCount = value.split('.').length - 1;

            if (decimalCount > 1) {
                const parts = value.split('.');
                value = parts[0] + '.' + parts.slice(1).join('');
            }

            if (value.includes('.')) {
                const parts = value.split('.');

                if (parts[1] && parts[1].length > 2) {
                    parts[1] = parts[1].slice(0, 2);
                    value = parts.join('.');
                }
            }

            e.target.value = value;
            amount = value;
            changeFees();
        });
    }
};