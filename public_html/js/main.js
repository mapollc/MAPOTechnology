var host = 'https://www.mapotechnology.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    key = 'c196d0958608ad2b7d4af2be078ecc54',
    pn = window.location.pathname,
    headerChange = (pn == '/' ? 100 : 50);

async function sendMessage(form) {
    const send = await fetch(apiUrl + 'message?key=' + key, {
        method: 'POST',
        body: new FormData(document.querySelector('form'))
    });

    if (send.ok) {
        const resp = await send.json();

        if (resp.success == 1) {
            form.insertAdjacentHTML('beforebegin', '<div class="message success">Your message was successfully sent to us! We will respond as soon as possible.</div>');

            document.querySelectorAll('form input, form textarea').forEach(function (n) {
                n.value = '';
            });

            document.querySelector('select[name=subject]').selectedIndex = 0;
            document.querySelector('input[type=submit]').disabled = false;
            document.querySelector('input[type=submit]').value = 'Send Message';
        } else {
            if (resp.error == 1) {
                var m = 'Your message was unable to be sent. Try emailing us directly.';
            } else if (resp.error == 2) {
                var m = 'You didn\'t complete all the required fields. Try again.';
            }

            form.insertAdjacentHTML('beforebegin', '<div class="message error">' + m + '</div>');
        }
    }
}

document.querySelector('.menu_icon').addEventListener('click', function () {
    if (this.getAttribute('data-open') == '0') {
        this.setAttribute('data-open', '1');
        document.querySelector('.menu_icon i').classList.add('fa-times');
        document.querySelector('.menu_icon i').classList.remove('fa-bars');
        document.querySelector('ul.navbar_menu').style.display = 'flex';
    } else {
        this.setAttribute('data-open', '0');
        document.querySelector('.menu_icon i').classList.remove('fa-times');
        document.querySelector('.menu_icon i').classList.add('fa-bars');
        document.querySelector('ul.navbar_menu').style.display = 'none';
    }
});

window.onresize = function () {
    if (window.outerWidth >= 768) {
        document.querySelector('ul.navbar_menu').style.display = '';
        document.querySelector('.menu_icon').setAttribute('data-open', '0');
        document.querySelector('.menu_icon i').classList.remove('fa-times');
        document.querySelector('.menu_icon i').classList.add('fa-bars');
    }
};

window.onscroll = function () {
    if (pn == '/') {
        var t = document.querySelector('section.stats').offsetTop,
            b = t + window.outerHeight,
            h = window.scrollTop,
            w = window.outerWidth,
            vb = h + window.outerHeight;

        if (b > h && t < vb) {
            document.querySelector('section.stats').style.animation = 'stats 2.5s';
        } else {
            document.querySelector('section.stats').style.animation = '';
        }
    }

    if ((h < 400 && w > 450) || (h < 75 && w < 450)) {
        document.querySelector('.promo, .banner').style.height = 'calc(100% - ' + h + 'px)';
    }

    if (document.querySelector('header').getAttribute('data-mt') != 1) {
        if (window.scrollY > headerChange) {
            document.querySelector('header').classList.add('dark');
            document.querySelector('.logo').style.display = 'none';
            document.querySelector('.logo2').style.display = 'block';
        } else {
            document.querySelector('header').classList.remove('dark');
            document.querySelector('.logo').style.display = 'block';
            document.querySelector('.logo2').style.display = 'none';
        }
    }
};

window.onload = function () {
    if (document.querySelector('header').getAttribute('data-mt') != 1) {
        if (window.scrollY > headerChange) {
            document.querySelector('header').classList.add('dark');
            document.querySelector('.logo').style.display = 'none';
            document.querySelector('.logo2').style.display = 'block';
        } else {
            document.querySelector('header').classList.remove('dark');
            if (document.querySelector('logo')) {
                document.querySelector('logo').style.display = 'block';
            }
            if (document.querySelector('logo2')) {
                document.querySelector('logo2').style.display = 'none';
            }
        }
    }

    if (pn == '/donate/success') {
        gtag("event", "purchase", {
            transaction_id: pid,
            value: pamt,
            tax: 0.00,
            shipping: 0.00,
            currency: "USD"
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#wwd')) {
        document.querySelector('#wwd').addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector('#abt').scrollIntoView();
            /*document.querySelector('html, body').animate({
                scrollTop: (document.querySelector('abt').offsetTop / 2) - 50
            }, 1000);*/

            return false;
        });
    }

    if (pn == '/about/contact' || pn == '/contact') {
        const rc = document.createElement('script');
        rc.src = 'https://www.google.com/recaptcha/api.js?render=6Ld5X1AkAAAAAF7AVZbd60fGTNqx-bYJ6s9wnlrC';
        document.body.appendChild(rc);

        document.querySelector('form#contact').addEventListener('submit', function (e) {
            e.preventDefault();
            var form = this;

            var errors = false,
                errorMsg = '';

            if (document.querySelector('#senderror')) {
                document.querySelector('#senderror').remove();
            }
            document.querySelector('input[type=submit]').disabled = true;
            document.querySelector('input[type=submit]').val = 'Sending...';

            if (document.querySelector('input[name=fname]').value == '') {
                errors = true;
                errorMsg += 'Please provide your first name.<br>';
            }

            if (document.querySelector('input[name=lname]').value == '') {
                errors = true;
                errorMsg += 'Please provide your last name.<br>';
            }

            if (document.querySelector('input[name=email]').value == '') {
                errors = true;
                errorMsg += 'Please provide your email address.<br>';
            }

            if (document.querySelector('select[name=subject]').options[document.querySelector('select[name=subject]').selectedIndex].value == '-- Reason for message --') {
                errors = true;
                errorMsg += 'Please select a reason for contacting us.<br>';
            }

            if (document.querySelector('textarea[name=msg]').value == '') {
                errors = true;
                errorMsg += 'Your must enter some kind of message to send.';
            }

            if (errors) {
                form.insertAdjacentHTML('beforebegin', '<div class="message error" id="senderror">' + errorMsg + '</div>');
                document.querySelector('form#contact input[type=submit]').disabled = false;
                document.querySelector('form#contact input[type=submit]').value = 'Send Message';
            } else {
                grecaptcha.ready(function () {
                    grecaptcha.execute('6Ld5X1AkAAAAAF7AVZbd60fGTNqx-bYJ6s9wnlrC', {
                        action: 'submit'
                    }).then(async function (token) {
                        var fd = new FormData();
                        fd.append('token', token);
                        fd.append('ip', document.querySelector('input[name=ip]').value);

                        const validate = await fetch(apiUrl + 'recaptcha?key=' + key, {
                            method: 'POST',
                            body: fd
                        });

                        if (validate.ok) {
                            const resp = await validate.json();
                            
                            if (resp.success) {
                                sendMessage(form);
                            } else {
                                form.insertAdjacentHTML('beforebegin', '<div class="message error" id="senderror">You have failed automatic reCAPTCHA verification.</div>');

                                document.querySelectorAll('form input, form select, form textarea').forEach(function (n) {
                                    n.disabled = true;
                                });
                            }
                        }
                    });
                });
            }
        });
    }
});