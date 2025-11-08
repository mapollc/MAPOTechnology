var host = 'https://www.mapotechnology.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    key = 'c196d0958608ad2b7d4af2be078ecc54',
    typeTimer,
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
    submitBtn = document.querySelector('input[type=submit]');

async function loginWithGoogle(r) {
    const fd = new FormData();

    if (document.querySelector('#loginerrors')) {
        document.querySelector('#loginerrors').remove();
    }

    fd.append('google', 1);
    fd.append('token', r.credential);

    if (document.querySelector('input[name=src]')) {
        fd.append('src', document.querySelector('input[name=src]').value);
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

    await fetch('../authenticate/login', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        if (data.error) {
            document.querySelector('#secure').insertAdjacentHTML('beforebegin', '<div id="loginerrors" class="message error">' + data.error + '</div>');
        } else {
            window.location.href = data.success;
        }
    });
}

async function doReg() {
    const form = document.querySelector('form#secure');

    await fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form)
    }).then(async (resp) => {
        const data = await resp.json();

        if (data.response == 1) {
            form.querySelector('input[type=submit]').value = 'Create Account';
            form.insertAdjacentHTML('beforebegin', '<div id="regerrors" class="message error">We were unable to create your account. Please try again.</div>');
            document.querySelector('input[name=tos]').checked = false
        } else if (data.response == 2) {
            form.querySelector('input[type=submit]').value = 'Create Account';
            form.insertAdjacentHTML('beforebegin', '<div id="regerrors" class="message error">An account with that email address or phone number already exists.</div>');
            document.querySelector('input[name=tos]').checked = false
        } else {
            let yayMsg = 'Your account was successfully created. Please check your email for a confirmation link to verify your account.';

            if (data.response.subscribe) {
                yayMsg = 'Thank you for subscribing! Your account was succesfully created. Please check your email for a confirmation link to verify your account.';
            }

            document.querySelector('#crfas').remove();
            document.querySelector('.wrapper h1').insertAdjacentHTML('afterend', '<p style="font-size:18px;font-weight:100;text-align:center;line-height:1.5;margin:25px 0">' + yayMsg + '</p>');
            form.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('form#secure')) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&format=json&addressdetails=1')
                .then(async (resp) => {
                    const nom = await resp.json();
                    let a = (nom.address.city ? nom.address.city : (nom.address.town ? nom.address.town : (nom.address.village ? nom.address.village : nom.address.county))),
                        b = nom.address.state,
                        c = nom.address.postcode,
                        d = {
                            city: a,
                            state: b,
                            zip: c,
                            lat: nom.lat,
                            lon: nom.lon
                        };

                    document.querySelector('#city').value = a + ', ' + b + ' ' + c;
                    document.querySelector('input[name=location]').value = JSON.stringify(d);
                })
                .catch((error) => {
                    console.error(error);

                    document.querySelector('#city').value = 'Unable to get your location';
                    document.querySelector('input[name=location]').value = '';
                });
        });
    }

    document.querySelector('.password a').addEventListener('click', (e) => {
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

    if (document.querySelector('form#secure')) {
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

        document.querySelector('input[name=tos]').addEventListener('click', (e) => {
            if (e.target.checked) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        });

        document.querySelector('input[name=pass]').addEventListener('focus', () => {
            document.querySelector('.req').style.display = 'block';
        });

        document.querySelector('input[name=pass]').addEventListener('blur', () => {
            document.querySelector('.req').style.display = 'none';
        });

        document.querySelector('input[name=pass').addEventListener('keyup', () => {
            const pa = document.querySelector('input[name=pass]').value;

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

    /* form submissions */
    if (document.querySelector('#login')) {
        document.querySelector('#login').addEventListener('submit', () => {
            submitBtn.value = 'Loading...';
            submitBtn.disabled = true;
        });
    } else if (document.querySelector('#reset')) {
        const form = document.querySelector('#reset');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            submitBtn.value = 'Loading...';
            document.querySelector('#forgoterrors').remove();

            await fetch(form.getAttribute('action'), {
                method: 'POST',
                body: new FormData(form)
            }).then(async (resp) => {
                const data = await resp.json();
                let msg = '';

                if (data.v == 1) {
                    if (data.success == 1) {
                        window.location.href = 'login?reset=1';
                    } else {
                        switch (data.error) {
                            case 1: msg = 'The token provided does not exist.'; break;
                            case 2: msg = 'The link in your email does not match our records. '; break;
                            case 3: msg = 'Your password reset link expired.'; break;
                            case 4: msg = 'Your passwords don\'t match. Try again.'; break;
                            case 5: msg = 'Your password failed security requirements. Try again.'; break;
                            case 6: msg = 'The token provided can\'t be authenticated. Try again.'; break;
                        }

                        submitBtn.val('Reset Password');
                        document.querySelector('#reset').insertAdjacentHTML('beforebegin', '<div id="forgoterrors" class="message error">' + msg + (data.error <= 3 || data.error == 6 ? ' Please <a href="forgot">reset your password</a> again.' : '') + '</div>');
                    }
                } else {
                    if (data.success == 1) {
                        document.querySelector('.wrapper h1').insertAdjacentHTML('afterend', '<p style="font-size:18px;font-weight:100;text-align:center;line-height:1.5;margin:25px 0">Your password was successfully reset. Please check your email for a link to reset your password.</p>');
                        document.querySelector('#reset').style.display = 'none';
                    } else {
                        if (data.error == 1) {
                            msg = 'You must enter your email address.';
                        } else {
                            msg = 'That email address doesn\'t exist. Try again.';
                        }

                        submitBtn.value = 'Reset Password';
                        document.querySelector('#reset').insertAdjacentHTML('beforebegin', '<div id="forgoterrors" class="message error">' + msg + '</div>');
                    }
                }
            })
        });
    } else if (document.querySelector('#secure')) {
        const form = document.querySelector('#secure');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let error = false,
                msg = '';

            if (document.querySelector('#regerrors')) {
                document.querySelector('#regerrors').remove();
            }

            submitBtn.disabled = true;
            submitBtn.value = 'Loading...';

            if (document.querySelector('input[name=first_name').value == '') {
                error = true;
                msg += 'You must enter your first name<br>';
            }

            if (document.querySelector('input[name=last_name').value == '') {
                error = true;
                msg += 'You must enter your last name<br>';
            }

            if (document.querySelector('input[name=email').value == '') {
                error = true;
                msg += 'You must enter a valid email address<br>';
            }

            if (!document.querySelector('input[name=tos]').checked) {
                error = true;
                msg += 'Your must agree to our Terms & Privacy Policy<br>';
            }

            if (document.querySelector('input[name=pass').value == '') {
                error = true;
                msg += 'You must enter a password<br>';
            } else {
                if (document.querySelector('input[name=pass]').value.length < 8) {
                    error = true;
                    msg += 'Your password must be at least 8 characters<br>';
                }

                if (document.querySelector('input[name=pass]').value.match(/[A-Z]/gm) == null) {
                    error = true;
                    msg += 'Your password must have at least 1 uppercase letter<br>';
                }

                if (document.querySelector('input[name=pass]').value.match(/[a-z]/gm) == null) {
                    error = true;
                    msg += 'Your password must have at least 1 lowercase letter<br>';
                }

                if (document.querySelector('input[name=pass]').value.match(/[0-9]/gm) == null) {
                    error = true;
                    msg += 'Your password must have at least 1 number<br>';
                }

                if (document.querySelector('input[name=pass]').value.match(/[#$%^&@&*()+=\-\[\]\';,.\/{}|":<>?~\\\\]/gm) == null) {
                    error = true;
                    msg += 'Your password must have at least 1 special character<br>';
                }
            }

            if (document.querySelector('input[name=confirm_pass').value == '') {
                error = true;
                msg += 'You must confirm your password<br>';
            } else {
                if (document.querySelector('input[name=pass').value != document.querySelector('input[name=confirm_pass').value) {
                    error = true;
                    msg += 'You passwords do not match<br>';
                }
            }

            // if errors, show message; otherwise submit form
            if (error === true) {
                form.insertAdjacentHTML('beforebegin', '<div id="regerrors" class="message error">' + msg.substring(0, msg.length - 4) + '</div>');
                submitBtn.disabled = false;
                submitBtn.value = 'Create Account';
            } else {
                grecaptcha.ready(function () {
                    grecaptcha.execute('6Ld5X1AkAAAAAF7AVZbd60fGTNqx-bYJ6s9wnlrC', {
                        action: 'submit'
                    }).then(async (token) => {
                        const fd = new FormData();
                        fd.append('token', token);
                        fd.append('ip', document.querySelector('input[name=ip]').value);

                        await fetch(apiUrl + 'recaptcha?key=' + key, {
                            method: 'POST',
                            body: fd
                        }).then(async (resp) => {
                            const r = await resp.json();

                            if (r.success) {
                                doReg();
                            } else {
                                form.insertAdjacentHTML('beforebegin', '<div id="regerrors" class="message error">You have failed automatic reCAPTCHA verification.</div>');
                            }
                        });
                    })
                });
            }
        });
    }
});

document.addEventListener('keyup', async (e) => {
    if (e.target.id == 'city') {
        const results = document.querySelector('#cityResults'),
            v = e.target.value;

        if (v == '') {
            results.innerHTML = '<p style="padding:10px">Searching...</p>';
            results.style.display = 'block';
        } else {
            const fd = new FormData();
            fd.append('citiesonly', 1);
            fd.append('q', v);

            await fetch('https://api.mapotechnology.com/v1/search?key=c196d0958608ad2b7d4af2be078ecc54', {
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
    }
});

document.addEventListener('click', (e) => {
    if (e.target.id == 'wrong') {
        const city = document.querySelector('#city');

        city.setAttribute('placeholder', 'Search for a city...');
        city.value = '';
        city.disabled = false;
        city.focus();
    }

    if (e.target.classList.contains('result')) {
        let n = e.target.getAttribute('data-name'),
            c = n.match(/(.*?),/gm),
            s = n.match(/[A-Z][A-Z]/gm),
            z = n.match(/[0-9]+/gm);

        document.querySelector('#city').value = n;
        document.querySelector('#city').disabled = true;
        document.querySelector('#cityResults').style.display = 'none';
        document.querySelector('#cityResults').innerHTML = '';

        var json = { "city": c[0], "state": stateLabels[s[0]], "zip": z[0], "lat": e.target.getAttribute('data-lat'), "lon": e.target.getAttribute('data-lon') };
        document.querySelector('input[name=location]').value = JSON.stringify(json);
    }
});