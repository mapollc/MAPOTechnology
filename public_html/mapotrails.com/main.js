/*var type = ['trail', 'trail', 'snow', 'snow', 'trail', 'trail', 'snow', 'trail', 'trail', 'trail', 'trail', 'trail', 'trail', 'ski', 'trail', 'trail', 'trail', 'snow', 'trail'],
    activities = ['All Activities', 'ATV', 'Alpine Ski', 'Backcountry Ski', 'Beginner', 'Big Ride', 'Big Ski', 'Climb', 'Dirtbike', 'Fantasy', 'Gravel Bike', 'Hike', 'Mountain Bike', 'Nordic Ski', 'Private', 'Race', 'Road Bike', 'Snowmobile', 'Summit'];*/
var domain = 'https://www.mapotrails.com/',
    cdn = 'https://cdn.mapotrails.com/';

function wpIcon(i) {
    var icon,
        t = 1,
        color;

    switch (i) {
        case 'atv':
            icon = 'fad fa-truck-monster';
            color = '#738104';
            t = 1;
            break;
        case 'climb':
            icon = 'far fa-pickaxe';
            color = '#d1b80b';
            t = 1;
            break;
        case 'big ride':
            icon = 'far fa-roller-coaster';
            color = '#f4511e';
            t = 1;
            break;
        case 'dirtbike':
            icon = 'far fa-motorcycle';
            color = '#061895';
            t = 1;
            break;
        case 'hike':
            icon = 'far fa-person-hiking';
            color = '#24a7ff';
            break;
        case 'fantasy':
            icon = 'far fa-wand-sparkles';
            color = '#f48fb1';
            break;
        case 'road bike':
            icon = 'fas fa-road';
            color = '#3a3a3a';
            t = 1;
            break;
        case 'gravel bike':
            icon = 'fas fa-xmarks-lines';
            color = '#a3a3a3';
            t = 1;
            break;
        case 'mountain bike':
            icon = 'fa-solid fa-person-biking-mountain';
            color = '#15cf05';
            t = 0;
            break;
        case 'backcountry ski':
            icon = 'far fa-person-skiing';
            color = '#24ffd0';
            t = 0;
            break;
        case 'alpine ski':
            icon = 'far fa-person-skiing';
            color = '#24ffd0';
            t = 0;
            break;
        case 'nordic ski':
            icon = 'far fa-person-skiing-nordic';
            color = '#24ffd0';
            t = 0;
            break;
        case 'snowmobile':
            icon = 'fas fa-person-snowmobiling';
            color = '#f99d3e';
            t = 1;
            break;
    }

    return '<div style="display:inline-block;width:28px;height:28px;border-radius:5px;margin-right:10px;padding:5px 0;text-align:center;border:1px solid #878787;box-shadow:0 0 10px rgb(50 50 50 / 30%);background-color:' + color + ';color:#' + (t == 1 ? 'fff' : '282829') + '"><i class="' + icon + '"></i></div>';
}

function filterTrails() {
    let counter = 0,
        total = 0,
        q = document.getElementById('q').value,
        results = document.getElementById('results');

    document.querySelectorAll('#guides .guide').forEach((t) => {
        if (t.getAttribute('title').toLowerCase().search(q.toLowerCase()) < 0 || t.querySelector('.guide-desc p').innerHTML.toLowerCase().search(q.toLowerCase()) < 0) {
            t.style.display = 'none';
            counter++;
        } else if (parseFloat(document.getElementById('dist').value) > 0 && parseFloat(t.getAttribute('data-dist')) >= parseFloat(document.getElementById('dist').value)) {
            t.style.display = 'none';
            counter++;
        } else {
            total++;
            t.style.display = 'flex';
        }
    });

    results.innerHTML = '<b>' + total + '</b> trail' + (total != 1 ? 's ' : '') + ' match' + (total != 1 ? '' : 'es') + ' your filters';
}

function premiumTrails(p, u) {
    if (p == 0) {
        return true;
    } else {
        if (u != null) {
            if (u.subscribe && u.subscribe.active == 1 || user.role == 'ADMIN') {
                return true;
            }
        } else {
            return false;
        }
    }
}

async function getTrails(cat, act, area, q = null) {
    var d = new FormData();
    d.append('filter', (cat == 'all' || cat == null ? '' : cat));
    d.append('seo', 2);
    d.append('desc', 1);

    if (act != 'all-activities' && act != undefined) {
        d.append('category', act.replaceAll('-', ' '));
    }

    if (area && area != 'all areas') {
        d.append('area', area.replaceAll('-', ' '));
    }
    const req = await fetch('https://api.mapotechnology.com/v1/trails/list?key=cf707f0516e5c1226835bbf0eece4a0c', {
        method: 'POST',
        body: d
    });

    if (req.ok) {
        var t = await req.json();

        var r = '',
            rr = '',
            results = document.getElementById('results');

        if (t.trails != null) {
            rr = '<b>' + t.trails.length + '</b> trail' + (t.trails.length != 1 ? 's ' : '') + ' match' + (t.trails.length != 1 ? '' : 'es') + ' your filters';
            results.setAttribute('data-start', t.trails.length + document.querySelectorAll('#guides .guide').length);

            for (var i = 0; i < t.trails.length; i++) {
                var trail = t.trails[i],
                    premium = premiumTrails(trail.premium, user),
                    dist = (trail.stats ? trail.stats.distance : 0),
                    icons = '';

                if (trail.category != null) {
                    trail.category.forEach(function (tc) {
                        /*icons += wpIcon(tc.toLowerCase());*/
                        icons += '<div class="tag">' + tc + '</div>';
                    });
                }

                r += '<div class="guide" data-prem="' + trail.premium + '" data-dist="' + (dist !== undefined ? dist : '') + '" title="' + trail.title + '">' +
                    '<div class="guide-media"><a href="' + (premium ? domain + trail.url : '#" onclick="return false') + '" aria-label="Read more on ' + trail.title + '">' +
                    '<img onerror="replaceImg(this)" loading="lazy" src="' + cdn + 'photos/large/' + trail.photo.url + '" alt="' + (trail.photo.caption ? trail.photo.caption : trail.title) + '" title="' + (trail.photo.caption ? trail.photo.caption : trail.title) + '"></a></div>' +
                    '<div class="guide-desc"><h2><a href="' + domain + trail.url + '">' + (trail.premium == 1 ? '<i class="far fa-lock prem" title="Premium guide"></i>' : '') + trail.title + '</a></h2>' +
                    '<div class="tags"><div class="tag">' + (isNaN(dist) ? dist : dist.toFixed(1)) + ' mi</div>' + (icons ? icons : '') + '</div><p>' + trail.route + '</p>' +
                    '<a class="btn btn-lg btn-blue' + (!premium ? ' disabled' : '') + '" style="margin-top:1.25em"' + (premium ? ' href="' + domain + trail.url + '"' : '') + ' aria-label="Read more on ' + trail.title + '">Explore full guide</a></div></div>';
            }

            if (r) {
                document.getElementById('guides').insertAdjacentHTML('beforeend', r);
            }/* else {
                document.getElementById('guides').innerHTML = '<h2>No results found</h2>';
            }
        } else {
            rr = '<b>0</b> trails matching your filters';
            document.getElementById('guides').innerHTML = '<h2>No results found</h2>';*/
        }

        results.innerHTML = rr;

        filterTrails();
    }
}

function replaceImg(i) {
    const el = document.createElement('div');
    el.classList.add('noimg');
    i.parentElement.parentElement.appendChild(el);
    i.parentElement.remove();
}

function ucwords(s) {
    var c = '';
    s = s.toString().replaceAll('-', ' ');

    if (s.search(/\s/g) >= 0) {
        var w = s.split(' ');

        w.forEach(function (e) {
            c += e.charAt(0).toUpperCase() + e.slice(1) + ' ';
        });

        return c.slice(0, -1);
    } else {
        return ucfirst(s);
    }
}

function ucfirst(s) {
    return s.toString().charAt(0).toUpperCase() + s.slice(1);
}

function tf(t) {
    t = ucwords(t.replace('-', ' '));
    return (t.substr(-1) == 'e' ? t.substr(0, t.length - 1) : t) + 'ing';
}

document.querySelector('form#query').onkeyup = function (e) {
    e.preventDefault();

    filterTrails();
};

document.getElementById('type').onchange = function() {
    const s = this.options[this.selectedIndex].value;
    window.location.href = domain + 'guides/' + (s ? s : 'all');
};

document.getElementById('category').onchange = function() {
    var s = this.options[this.selectedIndex].value.split('/'),
        a = document.getElementById('areas').options[document.getElementById('areas').selectedIndex].value,
        type = s[0],
        act = s[1],
        /*title = 'All ' + (s != 'all' ? ucfirst(type) + ' ' : '') + 'Guides' + (act ? ' for ' + (act == 'all-activities' ? 'All Activities' : tf(act)) + ' ' : '') + (a ? (a == 'all-areas' ? 'in All Areas' : 'near ' + ucwords(a.replace('-', ' '))) : ''),*/
        url = domain + 'guides/' + /*(act == 'all-activities' ? 'all' : */type/*)*/ + '/' + act + (a == 'all-areas' ? '' : '/' + a);

    window.location.href = url;
    /*history.pushState('', title, url);
    document.title = title + ' - Map-o-Trails';
    getTrails((s == 'all-activities' ? '' : type), act, a);*/
};

document.getElementById('areas').onchange = function() {
    var a = this.options[this.selectedIndex].value,
        s = document.getElementById('category').options[document.getElementById('category').selectedIndex].value.split('/'),
        type = s[0],
        t = s[1],
        /*title = 'All ' + (s != 'all' ? ucfirst(type) + ' ' : '') + 'Guides' + (t ? ' for ' + (t == 'all-activities' ? 'All Activities' : tf(t)) + ' ' : '') + (a ? (a == 'all-areas' ? 'in All Areas' : 'near ' + ucwords(a.replace('-', ' '))) : ''),*/
        url = domain + 'guides/' + type + '/' + t + (a == 'all-areas' ? '' : '/' + a);

    window.location.href = url;
    /*history.pushState('', title, url);
    document.title = title + ' - Map-o-Trails';
    getTrails((t == 'all-activities' ? '' : type), t, a);*/
};

document.getElementById('dist').onchange = function () {
    var val = this.value;

    document.getElementById('distval').innerHTML = (val == 0 ? 'Any' : val + ' mi.');

    filterTrails();
};

window.onload = function () {
    if (window.innerWidth <= 768) {
        document.getElementById('results').classList.add('mx-auto');
    } else {
        document.getElementById('results').classList.remove('mx-auto');
    }
};

window.onresize = function () {
    if (window.innerWidth <= 768) {
        document.getElementById('results').classList.add('mx-auto');
    } else {
        document.getElementById('results').classList.remove('mx-auto');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    var g = document.getElementById('guides'),
        a = g.getAttribute('data-category'),
        b = g.getAttribute('data-activity'),
        c = g.getAttribute('data-area');

    getTrails(a, b, c);
});