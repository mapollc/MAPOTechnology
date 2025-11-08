let apiURL = 'https://api.mapotechnology.com/v1/',
    apiKey = 'c196d0958608ad2b7d4af2be078ecc54',
    submitBtn = document.querySelector('input[type=submit]'),
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
    };

class SSO {
    async request(data, method = null) {
        let resp;
        data.append('key', apiKey);

        return await fetch(apiURL + 'user' + (method ? '/' + method : ''), {
            credentials: 'include',
            method: 'POST',
            body: data
        });
    }

    uniqueDID(s) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
            .then(h => {
                return Array.from(new Uint8Array(h)).map(byte => byte.toString(16).padStart(2, '0')).join('');
            });
    }

    loginWithGoogle(r) {
        removeErrors();

        submitBtn.value = 'Signing you in...';
        submitBtn.disabled = true;

        const fd = new FormData();
        fd.append('google', 1);
        fd.append('token', r);

        document.querySelector('input[name=email]').disabled = true;
        document.querySelector('input[name=pass]').disabled = true;

        if (document.querySelector('input[name=service]')) {
            fd.append('service', document.querySelector('input[name=service]').value);
        }

        if (document.querySelector('input[name=next]')) {
            fd.append('next', document.querySelector('input[name=next]').value);
        }

        if (document.querySelector('input[name=subscribe]')) {
            fd.append('subscribe', document.querySelector('input[name=subscribe]').value);
        }

        if (document.querySelector('input[name=price_id]')) {
            fd.append('price_id', document.querySelector('input[name=price_id]').value);
        }

        this.doLogin(fd);
    }

    doLogin(fd) {
        this.request(fd, 'login').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
            }

            if (api.auth) {
                window.location.href = api.next;
            }
        });
    }

    login() {
        removeErrors();
        const fd = new FormData();

        document.querySelectorAll('#login input').forEach((e) => {
            fd.append(e.getAttribute('name'), e.value);
        });

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
            } else {
                document.querySelector('.wrapper h1').insertAdjacentHTML('afterend', '<p style="font-size:18px;font-weight:100;text-align:center;line-height:1.5;margin:25px 0">Your password was successfully reset. Please check your email for a link to reset your password.</p>');
                document.querySelector('#forgot').style.display = 'none';
            }
        });
    }

    reset() {
        removeErrors();
        const fd = new FormData();

        fd.append('verify', document.querySelector('input[name=verify]').value);
        fd.append('email', document.querySelector('input[name=email]').value);
        fd.append('oauth_token', document.querySelector('input[name=oauth_token]').value);
        fd.append('pass', document.querySelector('input[name=pass]').value);
        fd.append('confirm_pass', document.querySelector('input[name=confirm_pass]').value);

        this.request(fd, 'reset').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
            } else if (api.response == 'success') {
                window.location.href = 'login?reset=1';
            }
        });
    }

    confirmation() {
        const fd = new FormData();

        fd.append('ip', document.querySelector('input[name=ip]').value);
        fd.append('oauth_token', document.querySelector('input[name=oauth_token]').value);
        fd.append('email', document.querySelector('input[name=email]').value);

        if (document.querySelector('input[name=subscriber]')) {
            fd.append('subscriber', document.querySelector('input[name=subscriber]').value);
        }

        this.request(fd, 'confirmation').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');

                if (api.code != 2) {
                    submitBtn.disabled = false;
                }

                createError(api.msg);
            } else {
                if (api.response == 'success') {
                    window.location.href = './login?confirm=1&valid=1' + (api.subscribed ? '&src=mapofire&subscriber=1&next=' + encodeURIComponent('https://mapofire.com?ref=new_subscriber=1') : '');
                }
            }
        });
    }

    register() {
        removeErrors();
        const fd = new FormData();

        fd.append('ip', document.querySelector('input[name=ip]').value);
        fd.append('location', document.querySelector('input[name=location]').value);
        fd.append('first_name', document.querySelector('input[name=first_name]').value);
        fd.append('last_name', document.querySelector('input[name=last_name]').value);
        fd.append('email', document.querySelector('input[name=email]').value);
        fd.append('phone', document.querySelector('input[name=phone]').value);
        fd.append('pass', document.querySelector('input[name=pass]').value);
        fd.append('confirm_pass', document.querySelector('input[name=confirm_pass]').value);
        fd.append('tos', document.querySelector('input[name=tos]').checked ? 1 : 0);

        if (document.querySelector('input[name=subscribe]')) {
            fd.append('subscribe', document.querySelector('input[name=subscribe]').value);
            fd.append('price_id', document.querySelector('input[name=price_id]').value);

            if (document.querySelector('input[name=product_key]')) {
                fd.append('product_key', document.querySelector('input[name=product_key]').value);
            }

            if (document.querySelector('input[name=trial]')) {
                fd.append('trial', document.querySelector('input[name=trial]').value);
            }
        }


        this.request(fd, 'register?1').then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error') {
                submitBtn.value = submitBtn.getAttribute('data-o');
                submitBtn.disabled = false;
                createError(api.msg);
            } else if (api.response == 'success') {
                if (api.subscribe) {
                    window.location.href = api.next;
                } else {
                    let yayMsg = 'Your account was successfully created. Please check your email for a confirmation link to verify your account.';

                    if (api.subscribe.active) {
                        yayMsg = 'Thank you for subscribing! Your account was succesfully created. Please check your email for a confirmation link to verify your account.';
                    }

                    if (document.querySelector('#crfas')) {
                        document.querySelector('#crfas').remove();
                    }

                    document.querySelector('.wrapper h1').insertAdjacentHTML('afterend', '<p style="font-size:18px;font-weight:100;text-align:center;line-height:1.5;margin:25px 0">' + yayMsg + '</p>');
                    document.querySelector('#register').style.display = 'none';
                }
            }
        });
    }
}

function createError(msg) {
    removeErrors();
    document.querySelector('form').insertAdjacentHTML('beforebegin', '<div id="loginerrors" class="message error">' + msg + '</div>');
}

function removeErrors() {
    const e = document.querySelector('#loginerrors');

    if (e) {
        e.remove();
    }
}

function loginWithGoogle() {
    new SSO().loginWithGoogle(gtoken);
}

document.addEventListener('DOMContentLoaded', () => {
    const sso = new SSO();

    if (document.querySelector('#confirmation')) {
        document.querySelector('#confirmation').addEventListener('submit', (e) => {
            e.preventDefault();

            sso.confirmation();

            submitBtn.value = 'Verifying...';
            submitBtn.disabled = true;
        });
    }

    if (document.querySelector('#login')) {
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
        if (typeof gtoken !== 'undefined') {
            loginWithGoogle();
        }

        document.querySelector('#login').addEventListener('submit', (e) => {
            e.preventDefault();

            sso.login();

            submitBtn.value = 'Loading...';
            submitBtn.disabled = true;
        });
    } else if (document.querySelector('#forgot')) {
        document.querySelector('#forgot').addEventListener('submit', (e) => {
            e.preventDefault();

            if (document.querySelector('input[name=verify]')) {
                sso.reset();
            } else {
                sso.forgot();
            }

            submitBtn.value = 'Loading...';
            submitBtn.disabled = true;
        });
    } else if (document.querySelector('#register')) {
        document.querySelector('#register').addEventListener('submit', (e) => {
            e.preventDefault();

            sso.register();

            submitBtn.value = 'Loading...';
            submitBtn.disabled = true;
        });
    }

    if (document.querySelector('#register')) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&format=json&addressdetails=1')
                    .then(async (resp) => {
                        const nom = await resp.json();
                        let a = (nom.address.city ? nom.address.city : (nom.address.town ? nom.address.town : (nom.address.village ? nom.address.village : (nom.address.hamlet ? nom.address.hamlet : nom.address.county)))),
                            b = nom.address.state,
                            c = nom.address.postcode,
                            d = {
                                city: a,
                                state: b,
                                zip: c,
                                lat: nom.lat,
                                lon: nom.lon
                            };

                        document.querySelector('#city').value = a + ', ' + b + (c ? ' ' + c : '');
                        document.querySelector('input[name=location]').value = JSON.stringify(d);
                    })
                    .catch((error) => {
                        console.error(error);

                        document.querySelector('#city').value = 'Unable to get your location';
                        document.querySelector('input[name=location]').value = '';
                    });
            }, (error) => {
                document.querySelector('#city').value = 'Unable to get your location';
                document.querySelector('input[name=location]').value = '';
                console.error('Geolocation error:' + error.message);
            });

        document.querySelector('#wrong').addEventListener('click', (e) => {
            const city = document.querySelector('#city');

            city.setAttribute('placeholder', 'Search for a city...');
            city.value = '';
            city.disabled = false;
            city.focus();
        });

        document.querySelector('input[type=tel]').addEventListener('keyup', (e) => {
            const t = e.target.value;

            if (t != '') {
                if (t.match(/[^$,.\d-]/)) {
                    e.target.value = '';
                } else {
                    if (t.length < 12 && t.search('-') >= 0) {
                        e.target.value = t.replaceAll('-', '');
                    } else {
                        e.target.value = t.replace(/(\d\d\d)(\d\d\d)(\d\d\d\d)/, '$1-$2-$3');
                    }
                }
            }
        });

        document.querySelector('#city').addEventListener('focus', () => {
            document.querySelector('#cityResults').innerHTML = '<p style="padding:10px">Searching...</p>';
            document.querySelector('#cityResults').style.display = 'block';
        });

        document.querySelector('#city').addEventListener('keyup', async (e) => {
            const results = document.querySelector('#cityResults'),
                v = e.target.value;

            if (v == '') {
                results.innerHTML = '<p style="padding:10px">Searching...</p>';
                results.style.display = 'block';
            } else {
                const fd = new FormData();
                fd.append('key', apiKey);
                fd.append('citiesonly', 1);
                fd.append('q', v);

                await fetch(apiURL + 'search', {
                    method: 'POST',
                    body: fd
                }).then(async (resp) => {
                    const r = await resp.json();

                    if (r.rs) {
                        let res = '';
                        for (var i = 0; i < r.rs.length; i++) {
                            res += '<div class="result" data-lat="' + r.rs[i].lat + '" data-lon="' + r.rs[i].lon + '" data-name="' + r.rs[i].name + '">' + r.rs[i].name + '</div>';
                        }

                        results.innerHTML = res;
                    } else {
                        results.innerHTML = '<p style="padding:10px">No results found...</p>';
                    }
                }).catch((error) => {
                    console.error(error);
                });
            }
        });

        document.querySelector('input[name=tos]').addEventListener('click', (e) => {
            submitBtn.classList.toggle('dis');

            if (e.target.checked) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        });
    }

    if (document.querySelector('#showpwd')) {
        document.querySelector('#showpwd').addEventListener('click', (e) => {
            if (e.target.getAttribute('data-d') == 'true') {
                e.target.innerHTML = 'hide';
                e.target.setAttribute('data-d', 'false');
                document.querySelector('input[name=pass]').setAttribute('type', 'text');
            } else {
                e.target.innerHTML = 'show';
                e.target.setAttribute('data-d', 'true');
                document.querySelector('input[name=pass]').setAttribute('type', 'password');
            }
        });
    }

    if (document.querySelector('#register') || (document.querySelector('#forgot') && document.querySelector('input[name=verify]'))) {
        document.querySelector('input[name=pass]').addEventListener('focus', () => {
            document.querySelector('.req').style.display = 'block';
        });

        document.querySelector('input[name=pass]').addEventListener('blur', () => {
            document.querySelector('.req').style.display = 'none';
        });

        document.querySelector('input[name=pass]').addEventListener('keyup', (e) => {
            const pa = e.target.value;

            if (pa.length >= 8) {
                document.querySelector('span#p1').classList.add('met');
            } else {
                document.querySelector('span#p1').classList.remove('met');
            }

            if (pa.match(/[A-Z]/gm) != null) {
                document.querySelector('span#p4').classList.add('met');
            } else {
                document.querySelector('span#p4').classList.remove('met');
            }

            if (pa.match(/[a-z]/gm) != null) {
                document.querySelector('span#p3').classList.add('met');
            } else {
                document.querySelector('span#p3').classList.remove('met');
            }

            if (pa.match(/[0-9]/gm) != null) {
                document.querySelector('span#p2').classList.add('met');
            } else {
                document.querySelector('span#p2').classList.remove('met');
            }

            if (pa.match(/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/gm) != null) {
                document.querySelector('span#p5').classList.add('met');
            } else {
                document.querySelector('span#p5').classList.remove('met');
            }
        });

        document.querySelector('input[name=confirm_pass]').addEventListener('focus', () => {
            document.querySelector('#meets').style.dislay = 'block';
        });

        document.querySelector('input[name=confirm_pass]').addEventListener('blur', () => {
            document.querySelector('#meets').style.display = 'none';
        });

        document.querySelector('input[name=confirm_pass]').addEventListener('keyup', (e) => {
            if (e.target.value == document.querySelector('input[name=pass]').value) {
                document.querySelector('#meets').style.color = 'var(--green)';
                document.querySelector('#meets').innerHTML = 'Your passwords match';
            } else {
                document.querySelector('#meets').style.color = 'var(--red)';
                document.querySelector('#meets').innerHTML = 'Your passwords don\'t match';
            }
        });
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('result')) {
        let n = e.target.getAttribute('data-name'),
            c = n.match(/(.*?),/gm),
            s = n.match(/[A-Z][A-Z]/gm),
            z = n.match(/[0-9]+/gm);

        document.querySelector('#city').value = n;
        document.querySelector('#city').disabled = true;
        document.querySelector('#cityResults').style.display = 'none';
        document.querySelector('#cityResults').innerHTML = '';

        var json = {
            "city": c[0],
            "state": stateLabels[s[0]],
            "zip": z[0],
            "lat": e.target.getAttribute('data-lat'),
            "lon": e.target.getAttribute('data-lon')
        };

        document.querySelector('input[name=location]').value = JSON.stringify(json);
    }
});