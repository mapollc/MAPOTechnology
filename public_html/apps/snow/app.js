let apiKey = 'c196d0958608ad2b7d4af2be078ecc54',
    dashboards = {
        'wallowas': ['MOSO3', 'TYLO3', 447, 1288, 'SCHO3', 'ANRO3', 1230, 'MHWO3', 1229],
        'blues': ['TOHW1', 'MLKO3', 'HIRO3', 'ESPO3', 'BMSO3', 'COLO3', 1245, 'WFCO3', 'BORO3']
    },
    unit = {
        'temp': {
            'f': 'F',
            'c': 'C'
        },
        'height': {
            'f': '"',
            'c': 'cm'
        }
    },
    useUnit = unit.temp.f;

function timeAgo(t, w = null, c = null) {
    let val,
        d = (c ? c : Math.round(new Date().getTime() / 1000)) - t,
        plural = (v) => {
            return (v > 1 ? 's' : '');
        },
        matheq = (d, s, r) => {
            return Math.floor(((d / s) - Math.floor(d / s)) * r);
        };

    if (d < 5) {
        val = 'Just now';
    } else if (d >= 5 && d < 60) {
        val = d.toFixed(0) + ' sec' + plural(d);
    } else if (d >= 60 && d < 3600) {
        val = Math.floor(d / 60) + ' min' + plural(Math.floor(d / 60)) + ((matheq(d, 60, 60) !== 0) ? ',&nbsp;' + matheq(d, 60, 60) + ' sec' + plural(matheq(d, 60, 60)) : '');
    } else if (d >= 3600 && d < 86400) {
        val = Math.floor(d / 3600) + ' hour' + plural(Math.floor(d / 3600)) + ((matheq(d, 3600, 60) !== 0) ? ',&nbsp;' + matheq(d, 3600, 60) + ' min' + plural(matheq(d, 3600, 60)) : '');
    } else if (d >= 86400 && d < 172800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400)) + ((matheq(d, 86400, 24) !== 0) ? ',&nbsp;' + matheq(d, 86400, 24) + ' hour' + plural(matheq(d, 86400, 24)) : '');
    } else if (d >= 172800 && d < 604800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400));
    } else if (d >= 604800 && d < 2419200) {
        val = Math.floor(d / 604800) + ' week' + plural(Math.floor(d / 604800));
    } else if (d >= 2419200 && d < 31536000) {
        val = Math.floor(d / 2419200) + ' month' + plural(Math.floor(d / 2419200));
    } else if (d >= 31536000) {
        val = Math.floor(d / 31536000) + ' year' + plural(Math.floor(d / 31536000));
    }
    if (w == 1) {
        val = val.split(', ')[0];
    }

    return (t == null ? 'Never' : val + (val != 'Just now' ? ' ago' : ''));
}

function sn(n) {
    if (useUnit == 'C') {
        return n == 0 ? 0 : n.toFixed(1);
    } else {
        return n;
    }
}

function getData(reload = false) {
    const wrapper = document.querySelector('#weather'),
        stations = dashboards[dashboard];

    if (reload) {
        wrapper.innerHTML = '';
    }

    stations.forEach((stn) => {
        /* if station is a snolite */
        const isSnolite = Number.isInteger(stn);

        if (isSnolite) {
            stn = 'snolite/' + stn;
        }

        wrapper.insertAdjacentHTML('beforeend', '<div class="station" data-id="' + stn + '"></div>');
    });

    stations.forEach(async (stn) => {
        /* if station is a snolite */
        const isSnolite = Number.isInteger(stn);

        if (isSnolite) {
            stn = 'snolite/' + stn;
        }

        const fd = new FormData();
        fd.append('key', apiKey);
        fd.append('unit', useUnit.toLowerCase());

        await fetch('https://api.mapotechnology.com/v1/weather/' + stn, {
            method: 'POST',
            body: fd
        })
            .then(async (resp) => {
                let card = '',
                    data = await resp.json();

                if (data.response) {
                    card = '<p style="font-size:18px;color:#fff;text-align:center;line-height:1.3">Current conditions are not available for ' + stn.replace('snolite/', '') + '.</p>';
                    wrapper.querySelector('.station[data-id="' + stn + '"]').classList.add('unavail');
                } else {
                    let wx = data.weather,
                        tempUnit = wx.unit == 'f' ? unit.temp.f : unit.temp.c,
                        heightUnit = wx.unit == 'f' ? unit.height.f : unit.height.c,
                        temp = wx.obs.temp.current;

                    card += '<h2><p>' + wx.name + '</p><span>elev. ' + wx.elevation + ' ft</span></h2>' +
                        '<div class="components"><div class="now">' +
                        '<p class="temp">' + (temp == null ? '--' : Math.round(temp)) + '<sup class="unit">&deg;' + tempUnit + '</sup></p>' +
                        '</div><div class="snow">';

                    if (wx.obs.snow) {
                        const sn6 = wx.obs.snow['6hr'] || wx.obs.snow['6hr'] == 0 ? sn(wx.obs.snow['6hr']) + '<span' + (wx.unit != 'f' ? ' class="cm"' : '') + '>' + heightUnit + '</span>' : '--',
                            sn12 = wx.obs.snow['12hr'] || wx.obs.snow['12hr'] == 0 ? sn(wx.obs.snow['12hr']) + '<span' + (wx.unit != 'f' ? ' class="cm"' : '') + '>' + heightUnit + '</span>' : '--',
                            sn24 = wx.obs.snow['24hr'] || wx.obs.snow['24hr'] == 0 ? sn(wx.obs.snow['24hr']) + '<span' + (wx.unit != 'f' ? ' class="cm"' : '') + '>' + heightUnit + '</span>' : '--';

                        card += '<div class="item hs"><label>Snow Depth</label>' +
                            '<div class="value">' + wx.obs.snow.hs + '<span' + (wx.unit != 'f' ? ' class="cm"' : '') + '>' + heightUnit + '</span></div>' +
                            '</div><div class="item"><label>6-hr Snow</label>' +
                            '<div class="value">' + sn6 + '</div>' +
                            '</div><div class="item"><label>12-hr Snow</label>' +
                            '<div class="value">' + sn12 + '</div>' +
                            '</div><div class="item"><label>24-hr Snow</label>' +
                            '<div class="value">' + sn24 + '</div>' +
                            '</div>';
                    }

                    card += '</div></div><span class="updated">Last report ' + timeAgo(wx.updated) + '</span>' +
                        (!isSnolite ? '<a href="https://www.weather.gov/wrh/timeseries?site=' + wx.id + '&hours=72" target="blank" class="btn centered">More Details</a>' : '');
                }

                wrapper.querySelector('.station[data-id="' + stn + '"]').innerHTML = card;
            });
    });
}

window.addEventListener('click', (e) => {
    if (e.target.parentElement.classList.contains('toggle')) {
        if (e.target.getAttribute('data-deg') == 'c') {
            document.querySelector('.toggle span[data-deg=c]').classList.add('selected');
            document.querySelector('.toggle span[data-deg=f]').classList.remove('selected');

            useUnit = unit.temp.c;
        } else {
            document.querySelector('.toggle span[data-deg=f]').classList.add('selected');
            document.querySelector('.toggle span[data-deg=c]').classList.remove('selected');

            useUnit = unit.temp.f;
        }

        getData(true);
    }
});

window.addEventListener('load', (e) => {
    getData();
});