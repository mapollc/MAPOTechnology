var agency = config.agency.toLowerCase(),
    host = 'https://' + config.baseURL.replace(agency + '.', '') + '/',
    domain = 'https://' + config.baseURL + '/',
    app = config.app.toLowerCase(),
    reloadTime = ((config.settings.reload_time ? config.settings.reload_time : 300) * 1000),
    statusTimer = ((config.settings.status_timer ? config.settings.status_timer : 2) * 60 * 1000),
    settings,
    stopLogFetch = 0;

function timeAgo(t, w) {
    var val,
        d = Math.round(new Date().getTime() / 1000) - t,
        ct = new Date(t * 1000),
        days = Math.floor(d / (3600 * 24)),
        hrs = Math.floor(d % (3600 * 24) / 3600),
        mins = Math.floor(d % 3600 / 60),
        secs = Math.floor(d % 60),
        r3 = dow[ct.getDay()] + ', ' + months[ct.getMonth()] + ' ' + (ct.getDate() < 10 ? '0' : '') + ct.getDate() + ', ' + ct.getFullYear() + ' - ' + (ct.getHours() < 10 ? '0' : '') + ct.getHours() + ':' + (ct.getMinutes() < 10 ? '0' : '') + ct.getMinutes() + ':' + (ct.getSeconds() < 10 ? '0' : '') + ct.getSeconds(),
        r2 = ((ct.getMonth() + 1) < 10 ? '0' : '') + (ct.getMonth() + 1) + '/' + (ct.getDate() < 10 ? '0' : '') + ct.getDate() + '/' + ct.getFullYear() + ' ' + (ct.getHours() < 10 ? '0' : '') + ct.getHours() + ':' + (ct.getMinutes() < 10 ? '0' : '') + ct.getMinutes() + ':' + (ct.getSeconds() < 10 ? '0' : '') + ct.getSeconds(),
        /*r1 = (days > 0 ? days + 'd ' : '') + (hrs > 0 ? hrs + 'h ' : '') + mins + 'm ' + (days < 2 ? secs + 's' : '');*/
        r1 = (days >= 1 ? (days < 10 ? '0' : '') + days + ':' : '') + (hrs < 10 ? '0' : '') + hrs + ':' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    return (!t ? '' : (w == 3 ? r3 : (w == 2 ? r2 : r1)));
}

function number_format(i, d = 1, dp = '.', ts = ',') {
    i = (i + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+i) ? 0 : +i,
        pc = !isFinite(+d) ? 0 : Math.abs(d),
        sep = (typeof ts === 'undefined') ? ',' : ts,
        dec = (typeof dp === 'undefined') ? '.' : dp,
        s = '',
        toFixedFix = function (n, pc) {
            var k = Math.pow(10, pc);
            return '' + Math.round(n * k) / k;
        };
    s = (pc ? toFixedFix(n, pc) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < pc) {
        s[1] = s[1] || '';
        s[1] += new Array(pc - s[1].length + 1).join('0');
    }
    return s.join(dec).replace('.0', '');
}

function decToDeg(a) {
    var abs = Math.abs(a),
        deg = Math.floor(abs),
        minTrunc = (abs - deg) * 60,
        min = Math.floor(minTrunc),
        sec = ((minTrunc - min) * 60).toFixed(1);

    return [deg, min, sec];
}

function degToDec(a, b, c) {
    return Number(a) + Number(b) / 60 + Number(c) / (60 * 60);
}

function api(a, f) {
    return domain + 'ajax/api/' + a + '/' + f;
}

function checkPerms(p) {
    return (userPerms.indexOf(p) >= 0 ? true : false);
}

$(document).ready(function () {
    setInterval(function () {
        var d = new Date(),
            t = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
        $('#now').html(t);
    }, 1000);
});

/* menu controls */
$('#menu-icon').click(function () {
    if ($(this).attr('data-pos') == 0) {
        $('nav').animate({
            left: '0'
        }, 500);
        $(this).attr('data-pos', 1).addClass('fa-times').removeClass('fa-bars');
    } else {
        $('nav').animate({
            left: '-275px'
        }, 500);
        $(this).attr('data-pos', 0).removeClass('fa-times').addClass('fa-bars');
    }
});

$('#notify').click(function () {
    if ($('.dropdown-menu').is(':visible')) {
        $('.arrow-up').fadeOut();
        $('.dropdown-menu').fadeOut();
    } else {
        $('.arrow-up').fadeIn();
        $('.dropdown-menu').fadeIn();
    }
});

$(document).on('mousedown', function (e) {
    /* Open quick action menu on right click, to assign resources already attached to an incident */
    /*if (e.which == 3) {
      e.preventDefault();
        var p = $(e.target).position();

      $('.context-menu').css({
          'top': (p.top + 18),
                'left': p.left
        }).html('').fadeIn();
    }*/
});

$('input[type=range]').on('change', function () {
    $('#level' + $(this).attr('data-zone')).html($(this).val());
});

$(document).on('mouseup', function (e) {
    /* close various features when clicked outside of their div */
    var $target = $(e.target);

    if (!$('.dropdown-menu').is($target) && $('.dropdown-menu').has($target).length === 0) {
        $('.dropdown-menu').hide();
        $('.arrow-up').hide();
    }

    if (!$('nav').is($target) && $('nav').has($target).length === 0 && !$('#menu-icon').is($target) && $('#menu-icon').has($target).length === 0) {
        $('nav').animate({
            left: '-275px'
        }, 500);
        $('#menu-icon').attr('data-pos', 0).removeClass('fa-times').addClass('fa-bars');
    }

    if (!$('.select-list').is($target) && $('.select-list').has($target).length === 0 && !$('#searchUnit').is($target) && $('#searchUnit').has($target).length === 0) {
        $('.select-list').hide().html('').css({
            'min-height': 0,
            'top': 0,
            'left': 0
        });
    }
});

$(document).on('click', '.tabs .tab-nav ul li', function () {
    /*$('.tabs .tab-nav ul li a').on('click', function() {*/
    var t = $(this).attr('data-tab');

    $('.tab-content > div').each(function () {
        $(this).hide();
    });

    $('.tab-nav ul li').each(function () {
        $(this).removeClass('active');
    });

    $(this).addClass('active');
    $('#' + t).show();
});
