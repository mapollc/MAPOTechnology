const host = 'https://www.mapotechnology.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    key = 'c196d0958608ad2b7d4af2be078ecc54',
    pageName = window.location.pathname,
    headerChange = (pageName == '/' ? 100 : 50);

function sendMessage(e) {
    e.preventDefault();
    const form = this;
    const submit = document.querySelector('form#contact input[type=submit]');

    let errors = false,
        errorMsg = '';

    document.querySelector('#senderror')?.remove();
    submit.disabled = true;
    submit.value = 'Sending...';

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

    if (document.querySelector('select[name=subject]').value == '-- Reason for message --') {
        errors = true;
        errorMsg += 'Please select a reason for contacting us.<br>';
    }

    if (document.querySelector('textarea[name=msg]').value == '') {
        errors = true;
        errorMsg += 'Your must enter some kind of message to send.';
    }

    if (errors) {
        form.insertAdjacentHTML('beforebegin', '<div class="message error" id="senderror">' + errorMsg + '</div>');
        submit.disabled = false;
        submit.value = 'Send Message';
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
                        messageSubmit(form);
                    } else {
                        form.insertAdjacentHTML('beforebegin', '<div class="message error" id="senderror">You have failed automatic reCAPTCHA verification.</div>');

                        document.querySelectorAll('form input, form select, form textarea').forEach(n => {
                            n.disabled = true;
                        });
                    }
                }
            });
        });
    }
}

async function messageSubmit(form) {
    const submit = document.querySelector('input[type=submit]');

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
            submit.disabled = false;
            submit.value = 'Send Message';
        } else {
            const msg = resp.error == 1 ? 'Your message was unable to be sent. Try emailing us directly.' : 'You didn\'t complete all the required fields. Try again.';

            form.insertAdjacentHTML('beforebegin', `<div class="message error">${msg}</div>`);
        }
    }
}

window.onresize = function () {
    const nav = document.querySelector('ul.navbar_menu'),
        mi = document.querySelector('.menu_icon i');

    if (window.outerWidth >= 768) {
        nav.style.display = '';
        mi.parentElement.setAttribute('data-open', '0');
        mi.classList.remove('fa-times');
        mi.classList.add('fa-bars');
    }

    document.querySelectorAll('.promo .btn').forEach(b => {
        if (window.outerWidth > 495) {
            b.classList.add('btn-xl')
        } else {
            b.classList.remove('btn-xl')
        }
    });
};

window.onscroll = function () {
    if (pageName == '/') {
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
        } else {
            document.querySelector('header').classList.remove('dark');
        }
    }
};

window.onload = function () {
    if (document.querySelector('header').getAttribute('data-mt') != 1) {
        if (window.scrollY > headerChange) {
            document.querySelector('header').classList.add('dark');
        } else {
            document.querySelector('header').classList.remove('dark');
        }
    }

    if (pageName == '/donate/success') {
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
    const wwd = document.querySelector('#wwd');

    document.querySelector('.menu_icon')?.addEventListener('click', (e) => {
        const nav = document.querySelector('ul.navbar_menu'),
            mi = e.target.querySelector('i');

        if (this.dataset.open == '0') {
            this.setAttribute('data-open', '1');
            mi.classList.add('fa-times');
            mi.classList.remove('fa-bars');
            nav.style.display = 'flex';
        } else {
            this.setAttribute('data-open', '0');
            mi.classList.remove('fa-times');
            mi.classList.add('fa-bars');
            nav.style.display = 'none';
        }
    });

    wwd?.addEventListener('click', (e) => {
        e.preventDefault();

        document.querySelector('#abt').scrollIntoView();
        return false;
    });

    if (pageName == '/') {
        document.querySelectorAll('.promo .btn').forEach(b => {
            if (window.outerWidth > 495) {
                b.classList.add('btn-xl')
            } else {
                b.classList.remove('btn-xl')
            }
        });
    }

    if (pageName == '/about/contact' || pageName == '/contact') {
        const rc = document.createElement('script');
        rc.src = 'https://www.google.com/recaptcha/api.js?render=6Ld5X1AkAAAAAF7AVZbd60fGTNqx-bYJ6s9wnlrC';
        document.body.appendChild(rc);

        document.querySelector('form#contact').addEventListener('submit', (e) => {
            sendMessage(e);
        });
    }
});