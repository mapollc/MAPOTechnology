const apiURL = 'https://api.mapotechnology.com/v1/',
    apiKey = 'c196d0958608ad2b7d4af2be078ecc54',
    submitBtn = document.querySelector('input[type=submit]'),
    city = document.querySelector('#city'),
    userLocation = document.querySelector('input[name=location]'),
    cityResults = document.querySelector('#cityResults'),
    stateLabels = {
        'AL': 'Alabama',
        'AK': 'Alaska',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'DC': 'District of Columbia',
        'FL': 'Florida',
        'GA': 'Georgia',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NY': 'New York',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming'
    },
    ucwords = (s) => {
        const smallWords = new Set(['a', 'an', 'the', 'is', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'with']);
        return s.split(' ').map((word, i) => i === 0 || !smallWords.has(word.toLowerCase()) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(' ');
    },
    createError = (msg) => {
        removeErrors();
        document.querySelector('form').insertAdjacentHTML('beforebegin', '<div id="loginerrors" class="message error">' + msg + '</div>');
    },
    removeErrors = () => {
        const e = document.querySelector('#loginerrors');
        if (e) e.remove();
    },
    nameValidation = (field) => {
        if (field.value == '') return;

        field.value = ucwords(field.value.toLowerCase()).replace(/\bMc([a-z])/g, (match, letter) => {
            return 'Mc' + letter.toUpperCase();
        });
    };

class SSO {
    async request(data, method = null) {
        data.append('key', apiKey);

        return await fetch(apiURL + 'user' + (method ? '/' + method : ''), {
            credentials: 'include',
            method: 'POST',
            body: data
        });
    }

    /*uniqueDID(s) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
            .then(h => {
                return Array.from(new Uint8Array(h)).map(byte => byte.toString(16).padStart(2, '0')).join('');
            });
    }*/

    doLogin(fd) {
        this.request(fd, 'login').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
                return;
            }

            if (api.auth) window.location.href = api.next;
        });
    }

    loginWithGoogle(r) {
        removeErrors();

        if (submitBtn) submitBtn.value = 'Signing you in...';
        if (submitBtn) submitBtn.disabled = true;

        const fd = new FormData();
        fd.append('google', 1);
        fd.append('token', r);

        ['service', 'next', 'subscribe', 'price_id'].forEach((n) => {
            const el = document.querySelector(`input[name=${n}]`);
            if (el) fd.append(n, el.value);
        });

        this.doLogin(fd);
    }

    login() {
        removeErrors();

        const fd = new FormData();
        document.querySelectorAll('#login input').forEach((e) => fd.append(e.getAttribute('name'), e.value));
        this.doLogin(fd);
    }

    forgot() {
        removeErrors();
        const fd = new FormData();

        fd.append('email', document.querySelector('input[name=email]').value);

        this.request(fd, 'forgot').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
                return;
            }

            document.querySelector('.wrapper h1').insertAdjacentHTML(
                'afterend',
                '<p style="font-size:18px;font-weight:100;text-align:center;line-height:1.5;margin:25px 0">Your password was successfully reset. Please check your email for a link to reset your password.</p>'
            );
            document.querySelector('#forgot').style.display = 'none';
        });
    }

    reset() {
        removeErrors();
        const fd = new FormData();

        ['verify', 'email', 'oauth_token', 'pass', 'confirm_pass'].forEach((n) => {
            const el = document.querySelector(`input[name=${n}]`);
            if (el) fd.append(n, el.value);
        });

        this.request(fd, 'reset').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
                return;
            }

            window.location.href = 'login?reset=1';
        });
    }

    invitation() {
        const fd = new FormData();

        ['ip', 'invite_code', 'org_key', 'email', 'first_name', 'last_name', 'pass', 'confirm_pass']
            .forEach((n) => {
                const el = document.querySelector(`input[name=${n}]`);
                if (el) fd.append(n, el.value)
            });

        this.request(fd, 'invitation').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;

                createError(api.msg);
                return;
            }
        });
    }

    confirmation() {
        const fd = new FormData(),
            sub = document.querySelector('input[name=subscriber]');

        ['ip', 'oauth_token', 'email'].forEach((n) => {
            const el = document.querySelector(`input[name=${n}]`);
            if (el) fd.append(n, el.value);
        });

        if (sub) fd.append('subscriber', sub.value);

        this.request(fd, 'confirmation').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');

                if (api.code != 2) submitBtn.disabled = false;
                createError(api.msg);
                return;
            }

            if (api.response == 'success') {
                window.location.href = './login?confirm=1&valid=1' + (api.subscribed ? '&src=mapofire&subscriber=1&next=' +
                    encodeURIComponent('https://mapofire.com?ref=new_subscriber=1') : '');
            }
        });
    }

    register() {
        removeErrors();
        const fd = new FormData();

        ['ip', 'location', 'first_name', 'last_name', 'email', 'phone', 'pass', 'confirm_pass']
            .forEach((n) => {
                const el = document.querySelector(`input[name=${n}]`);
                if (el) fd.append(n, el.value)
            });

        fd.append('tos', document.querySelector('input[name=tos]').checked ? 1 : 0);

        if (document.querySelector('input[name=subscribe]')) {
            ['subscribe', 'price_id', 'product_key', 'trial'].forEach((n) => {
                const el = document.querySelector(`input[name=${n}]`);
                if (el) fd.append(n, el.value);
            });
        }

        this.request(fd, 'register?1').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
                return;
            }

            if (api.response == 'success') {
                if (api.subscribe) {
                    window.location.href = api.next;
                } else {
                    let yayMsg = 'Your account was successfully created. Please check your email for a confirmation link to verify your account.';

                    if (api.subscribe.active) {
                        yayMsg = 'Thank you for subscribing! Your account was succesfully created. Please check your email for a confirmation link to verify your account.';
                    }

                    const crfas = document.querySelector('#crfas');
                    if (crfas) crfas.remove();

                    document.querySelector('.wrapper h1').insertAdjacentHTML('afterend', '<p style="font-size:18px;font-weight:100;text-align:center;line-height:1.5;margin:25px 0">' + yayMsg + '</p>');
                    document.querySelector('#register').style.display = 'none';
                }
            }
        });
    }
}

function loginWithGoogle() {
    new SSO().loginWithGoogle(gtoken);
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof gtoken !== 'undefined') setTimeout(loginWithGoogle, 250);
    const sso = new SSO();

    const confirmation = document.querySelector('#confirmation'),
        invitation = document.querySelector('#invitation'),
        login = document.querySelector('#login'),
        register = document.querySelector('#register'),
        forgot = document.querySelector('#forgot');

    const addSubmitListener = (form, fn, submitText = 'Loading...') => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            fn();
            submitBtn.value = submitText;
            submitBtn.disabled = true;
        });
    };

    if (confirmation) addSubmitListener(confirmation, () => sso.confirmation(), 'Verifying...');
    if (invitation) addSubmitListener(invitation, () => sso.invitation());
    if (login) addSubmitListener(login, () => sso.login());
    if (forgot) addSubmitListener(forgot, () => qs('input[name=verify]') ? sso.reset() : sso.forgot());
    if (register) addSubmitListener(register, () => sso.register());

    /*const unique = {
            'user-agent': navigator.userAgent,
            'ip-address': ipaddr,
            'language': navigator.language,
            'memory': navigator.deviceMemory,
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            'screen': screen,
            'plugins': navigator.plugins
        };

        sso.uniqueDID(unique).then(hash => {
            document.querySelector('input[name=uniqueDID]').value = hash;
        });*/

    if (register) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const resp = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude + '&format=json&addressdetails=1'),
                    nom = await resp.json(),
                    a = nom.address.city || nom.address.town || nom.address.village || nom.address.hamlet || nom.address.county,
                    b = nom.address.state,
                    c = nom.address.postcode,
                    d = { city: a, state: b, zip: c, lat: nom.lat, lon: nom.lon };

                city.value = a + ', ' + b + (c ? ' ' + c : '');
                userLocation.value = JSON.stringify(d);
            } catch (error) {
                console.error(error);
                city.value = 'Unable to get your location';
                userLocation.value = '';
            }
        }, (error) => {
            city.value = 'Unable to get your location';
            userLocation.value = '';
            console.error('Geolocation error:' + error.message);
        });

        document.querySelector('#wrong').addEventListener('click', () => {
            city.value = '';
            city.disabled = false;
            city.setAttribute('placeholder', 'Search for a city...');
            city.focus();
        });

        document.querySelector('input[name="first_name"]').addEventListener('blur', (e) => nameValidation(e.target));
        document.querySelector('input[name="last_name"]').addEventListener('blur', (e) => nameValidation(e.target));
        document.querySelector('input[type=tel]').addEventListener('keyup', (e) => {
            let t = e.target.value;
            if (!t) return;
            if (/[^$,.\d-]/.test(t)) e.target.value = '';
            else if (t.length < 12 && t.includes('-')) e.target.value = t.replaceAll('-', '');
            else e.target.value = t.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        });

        city.addEventListener('focus', () => {
            cityResults.innerHTML = '<p style="padding:10px">Searching...</p>';
            cityResults.style.display = 'block';
        });

        city.addEventListener('keyup', async (e) => {
            const v = e.target.value;

            if (!v) {
                cityResults.innerHTML = '<p style="padding:10px">Searching...</p>';
                cityResults.style.display = 'block';
                return;
            }

            try {
                const fd = new FormData();
                fd.append('key', apiKey);
                fd.append('citiesonly', 1);
                fd.append('q', v);

                const resp = await fetch(apiURL + 'search', { method: 'POST', body: fd }),
                    r = await resp.json();

                if (r.rs) {
                    results.innerHTML = r.rs.map(r => `<div class="result" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.name}">${r.name}</div>`).join('');
                } else {
                    cityResults.innerHTML = '<p style="padding:10px">No results found...</p>';
                }
            } catch (error) {
                console.error(error);
            }
        });

        document.querySelector('input[name=tos]').addEventListener('click', (e) => {
            submitBtn.classList.toggle('dis');
            submitBtn.disabled = !e.target.checked;
        });
    }

    const showPWD = document.querySelector('#showpwd'),
        pass = document.querySelector('input[name=pass]');

    if (showPWD) {
        showPWD.addEventListener('click', (e) => {
            const isShown = e.target.dataset.d === 'true';
            e.target.innerHTML = isShown ? 'hide' : 'show';
            e.target.dataset.d = isShown ? 'false' : 'true';
            pass.type = isShown ? 'text' : 'password';
        });
    }

    if (register || invitation || (forgot && document.querySelector('input[name=verify]'))) {
        const confirmPass = document.querySelector('input[name=confirm_pass]');

        pass.addEventListener('focus', () => document.querySelector('.req').style.display = 'block');
        pass.addEventListener('blur', () => document.querySelector('.req').style.display = 'none');
        pass.addEventListener('keyup', (e) => {
            const pa = e.target.value,
                conds = [
                    ['#p1', pa.length >= 8],
                    ['#p4', /[A-Z]/.test(pa)],
                    ['#p3', /[a-z]/.test(pa)],
                    ['#p2', /\d/.test(pa)],
                    ['#p5', /[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\]/.test(pa)]
                ];

            conds.forEach(([id, met]) => {
                const el = document.querySelector(id);
                if (el) el.classList.toggle('met', met);
            });
        });

        confirmPass.addEventListener('focus', () => document.querySelector('#meets').style.dislay = 'block');
        confirmPass.addEventListener('blur', () => document.querySelector('#meets').style.display = 'none');
        confirmPass.addEventListener('keyup', (e) => {
            const match = e.target.value === pass.value;
            meets.style.color = match ? 'var(--green)' : 'var(--red)';
            meets.innerHTML = match ? 'Your passwords match' : 'Your passwords don\'t match';
        });
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('result')) return;

    let n = e.target.dataset.name,
        c = n.match(/(.*?),/gm),
        s = n.match(/[A-Z]{2}/gm),
        z = n.match(/\d+/gm);

    city.value = n;
    city.disabled = true;
    cityResults.style.display = 'none';
    cityResults.innerHTML = '';

    userLocation.value = JSON.stringify({
        "city": c?.[0],
        "state": stateLabels[s?.[0]],
        "zip": z?.[0],
        "lat": e.target.dataset.lat,
        "lon": e.target.dataset.lon
    });
});