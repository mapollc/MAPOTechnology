var incidentForm = '',
    resourceStatusForm = '',
    incOptions = [],
    zones = [],
    incidentTypes = [],
    jurisdictions = [],
    dispatch_states = [],
    dispatchers = [],
    cur_inc_ids = [],
    cur_res_ids = [],
    cur_res_ids_active = [],
    cur_log_ids = [],
    zoneConfig = [],
    responseLevels = [],
    stopTimers = 0,
    initial = true;

function unitStatus(s) {
    var v = '';
    switch (s) {
        case 'ava':
            v = 'Available';
            break;
        case 'asgn':
            v = 'Assigned';
            break;
        case 'com':
            v = 'Committed';
            break;
        case 'enr':
            v = 'Enroute';
            break;
        case 'ins':
            v = 'In-Service';
            break;
        case 'lea':
            v = 'Leaving Scene';
            break;
        case 'not':
            v = 'Notified';
            break;
        case 'ons':
            v = 'On Scene';
            break;
        case 'ous':
            v = 'Out-of-Service';
            break;
    }
    return v;
}

function openScreen(name, form, width = 1200, height = 800) {
    var wh = $(window).height(),
        ww = $(window).width(),
        top = (wh - height) / 2,
        left = (ww - width) / 2;

    window.open(domain + form, name, 'top=' + top + ', left=' + left + ', height=' + height + ', width=' + width + ', menubar=0, resizeable=0, toolbars=0');
}

function savePrefs() {
    const send = {
        'default_dispatch_incs': $('#filter-incidents').find('option:selected').val(),
        'default_dispatch_units': $('#filter-resources').find('option:selected').val(),
        'filter_log': $('#filter-log').find('option:selected').val()
    };
    $.ajax({
        url: api(app, 'preferences'),
        method: 'POST',
        data: send,
        success: function (res) {
            console.info('Preferences saved');
        }
    });
}

function filterIncidents(f, q) {
    $('.incidents #incident').each(function () {
        if ($(this).attr('data-zone') != undefined) {
            var w = $(this).attr('data-zone');
            if (f != w && f != 'all') {
                if ($(this).hasClass('header') === false) {
                    $(this).hide();
                }
            } else {
                $(this).css('display', 'flex');
            }
        }
    });

    if (q) {
        var q = q.toLowerCase();
        $('.incidents #incident').each(function () {
            if ($(this).hasClass('header') === false) {
                var n = $(this).attr('data-name').toLowerCase(),
                    i = $(this).attr('data-num').toLowerCase();
                if ($(this).is(':visible') === true) {
                    if (q == '' || n.search(q) >= 0 || i.search(q) >= 0) {
                        $(this).css('display', 'flex');
                    } else {
                        $(this).hide();
                    }
                }
            }
        });
    }
}

function filterUnits(z, s, q) {
    var q = q.toLowerCase();
    $('.resources #unit').each(function () {
        var zone = $(this).attr('data-zone'),
            status = $(this).attr('data-status');
        if ((z == 'all' && s == 'all') || (z != 'all' && zone == z && s == 'all') || (z == 'all' && status == s && s != 'all') || (z != 'all' && zone == z && status == s && s != 'all')) {
            $(this).css('display', 'flex');
        } else {
            if ($(this).hasClass('header') === false) {
                $(this).hide();
            }
        }
    });
    $('.resources #unit').each(function () {
        if ($(this).hasClass('header') === false) {
            var unit = $(this).attr('data-unit').toLowerCase();
            if ($(this).is(':visible') === true && unit != undefined) {
                if (q == '' || unit.search(q) >= 0) {
                    $(this).css('display', 'flex');
                } else {
                    $(this).hide();
                }
            }
        }
    });
}

function filterLog(d) {
    var v;
    if (d == 1) {
        v = {
            'today': 1
        };
    } else if (d == 2) {
        v = {
            'yesterday': 1
        };
    } else if (d == 2) {
        v = {
            'week': 1
        };
    }
    getLog(v);
}

function displayMsg(t, m) {
    $('#message .text').html(m);

    if (t == 'error') {
        $('#message').addClass('error').removeClass('success');
    } else {
        $('#message').removeClass('error').addClass('success');
    }

    $('#message').animate({
        top: '10px'
    }, 500, function () {
        setTimeout(function () {
            $('#message').animate({
                top: -100
            }, 500);
        }, 4000);
    });
}

function logNewNote() {
    /*$('.shadow').fadeIn();
    $('#modal .modal-header span').html('Log Note');
    $('#modal .content').html('<form id="activityLog" autocomplete="off">' + $('form#activityLog').html() + '</form>');
    $('#modal').addClass('dialog short').fadeIn('fast', function () {
        $('#modal #searchUnit').focus();
    });*/

    openScreen('log', 'screen/log', 600, 325);
}

function commandLine(c) {
    if (c != null) {
        $.ajax({
            url: api(app, 'command'),
            method: 'POST',
            data: {
                q: c
            },
            success: function (data) {
                console.log(data);
            }
        });
    }
}

function getTimers(p) {
    if (stopTimers == 0 && p == 1) {
        $.ajax({
            url: api(app, 'timers'),
            method: 'POST',
            dataType: 'json',
            success: function (r) {
                if (r.response != null) {
                    for (var i = 0; i < r.response.length; i++) {
                        var top = 50,
                            left = 50 + (i * 100);

                        window.open(domain + 'screen/timer?p=' + p + '&d=' + encodeURIComponent(JSON.stringify(r.response[i])), 'timer' + i, 'top=' + top + ', left=' + left + ', height=387, width=425, menubar=0, resizeable=0, toolbars=0');
                    }
                }
            }
        });
    } else if (p == 2) {
        openScreen('allTimers', 'screen/timer?p=2', 625, 387);
    }
}

function getIncidents() {
    $.ajax({
        url: api(app, 'incidents'),
        method: 'POST',
        data: {
            agency: agency
        },
        dataType: 'json',
        success: function (r) {
            if (r.response) {
                var a = '',
                    fetchIDs = [];

                for (var i = 0; i < r.response.length; i++) {
                    var num = r.response[i].juris + '-' + r.response[i].num,
                        s = r.response[i].status,
                        id = r.response[i].id,
                        zone = (r.response[i].zone == null ? '' : r.response[i].zone);

                    fetchIDs.push(id);

                    if (cur_inc_ids.includes(r.response[i].id) === false) {
                        incOptions.push('<option value="' + r.response[i].id + '|' + num + '">' + num + ' (' + r.response[i].name + ') &mdash; ' + (s == 1 ? 'OPEN' : 'PENDING') + '</option>');
                        a += '<div id="incident" class="' + (r.response[i].status == 1 ? 'active' : 'pending') + ' align-items-center" data-id="' + id + '" data-name="' + r.response[i].name + '" data-num="' + num + '" data-zone="' + zone + '" data-time="' + r.response[i].reported + '">' + '<div class="it">' + num + '</div>' + '<div class="it">' + r.response[i].type + '</div>' + '<div class="it"><b>' + r.response[i].name + '</b></div>' + '<div class="it">' + zone + '</div>' + '<div class="it"><span class="' + (r.response[i].status == 1 ? 'open' : 'pending') + '">' + (r.response[i].status == 1 ? 'open' : 'pending') + '</span></div>' + '<div id="incidentTimer" class="it justify-content-right">00:00:00</div>' + '<div class="it context" title="Dispatch resources to this incident"><i class="far fa-ellipsis-vertical" id="incContextM" style="padding:0 5px"></i></div><div id="assigned"></div></div>';
                        cur_inc_ids.push(id);
                    } else {
                        $('.incidents #incident[data-id="' + id + '"]').attr('data-num', num).attr('data-zone', zone).attr('data-name', r.response[i].name);
                        $('.incidents #incident[data-id="' + id + '"] div').eq(0).html(num);
                        $('.incidents #incident[data-id="' + id + '"] div').eq(1).html(r.response[i].type);
                        $('.incidents #incident[data-id="' + id + '"] div').eq(2).html('<b>' + r.response[i].name + '</b>');
                        $('.incidents #incident[data-id="' + id + '"] div').eq(3).html(zone);
                        $('.incidents #incident[data-id="' + id + '"] div').eq(4).html('<span class="' + (r.response[i].status == 1 ? 'open' : 'pending') + '">' + (r.response[i].status == 1 ? 'open' : 'pending') + '</span>');
                    }
                }

                $('.incidents').append(a);
                $('.incidents #incident').each(function () {
                    if (fetchIDs != undefined && fetchIDs.includes($(this).attr('data-id')) === false && $(this).hasClass('header') === false) {
                        $(this).remove();
                    }
                });
            }
        },
        complete: function () {
            if (initial) {
                getResources();
                initial = false;
            }
        }
    });
}

function getResources() {
    $.ajax({
        url: api(app, 'resources'),
        method: 'POST',
        data: {
            agency: agency
        },
        dataType: 'json',
        success: function (r) {
            var u = '',
                inc_r = [];

            if (r.response != null) {
                for (var i = 0; i < r.response.units.length; i++) {
                    var zone = r.response.units[i].zone,
                        typ = r.response.units[i].type,
                        inc = r.response.units[i].inc,
                        status = r.response.units[i].status,
                        ia = r.response.units[i].ia,
                        unit = r.response.units[i].unit,
                        loc = r.response.units[i].location,
                        last_comm = r.response.units[i].last_comm,
                        timer = r.response.units[i].timer;

                    if (cur_res_ids.includes(r.response.units[i].unit) === false) {
                        $('#resourceStatus select[name=unit]').append('<option value="' + unit + '">' + unit + '</option>');

                        u += '<div id="unit" class="drag" title="' + unit + ' (' + unitStatus(status) + ') - Upd:' + timeAgo(last_comm, 2) + '" data-unit="' + unit + '" data-type="' + typ + '" data-ia="' + ia + '" ' + (timer != null ? 'data-timer="' + timer + '"' : '') + 'data-status="' + status + '" ' + (loc ? 'data-loc="' + loc + '" ' : '') + 'data-zone="' + zone + '" data-time="' + last_comm + '"' + (inc ? ' data-inc="' + inc + '"' : '') + '>' + '<div class="un"><span>' + unit + '</span></div>' + '<div class="un"><span class="truncate">' + typ + '</span></div>' + '<div class="un"><span class="status ' + status + '">' + unitStatus(status) + '</span></div>' + '<div class="un">' + zone + '</div>' + '<div id="unitTimer" class="un justify-content-right">00:00:00</div></div>';
                        cur_res_ids.push(unit);

                        if (status != 'ous') {
                            cur_res_ids_active.push(unit);
                        }
                    } else {
                        $('.resources #unit[data-unit="' + unit + '"]').attr('data-time', last_comm);
                        $('.resources #unit[data-unit="' + unit + '"]').attr('data-zone', zone);
                        $('.resources #unit[data-unit="' + unit + '"]').attr('data-loc', loc);
                        $('.resources #unit[data-unit="' + unit + '"]').attr('data-ia', ia);
                        $('.resources #unit[data-unit="' + unit + '"]').attr('data-status', status);
                        $('.resources #unit[data-unit="' + unit + '"] div').eq(2).html('<span class="status ' + status + '">' + unitStatus(status) + '</span>');
                    }
                    $('.incidents #incident').each(function () {
                        if ($(this).attr('data-num') == inc) {
                            inc_r.push($(this).attr('data-num') + '|' + status + '|' + unit);
                        }
                    });
                }

                $('.incidents #incident').each(function () {
                    $(this).find('#assigned').html('');
                });

                for (var x = 0; x < inc_r.length; x++) {
                    var v = inc_r[x].split('|');
                    $('.incidents').find('#incident[data-num="' + v[0] + '"]').find('#assigned').append('<span class="status ' + v[1] + '">' + v[2] + '</span>');
                }

                $('.resources').append(u);
            }
        },
        complete: function () {
            doDefaultFilter();
        }
    });
}

function getLog(sd) {
    var flv = $('#filter-log').find('option:selected').val();
    if (!sd && flv == 'all') {
        sd = {
            today: 1
        };
        stopLogFetch = 0;
    } else {
        if (flv == 1) {
            sd = {
                today: 1
            };
            stopLogFetch = 0;
        } else if (flv == 2) {
            sd = {
                yesterday: 1
            };
            stopLogFetch = 1;
        } else if (flv == 3) {
            sd = {
                week: 1
            };
            stopLogFetch = 1;
        }
    }
    $.ajax({
        url: api(app, 'log'),
        method: 'POST',
        data: sd,
        success: function (r) {
            var c = '';
            if (r.response.log) {
                for (var i = 0; i < r.response.log.length; i++) {
                    if (cur_log_ids.includes(r.response.log[i].lid) === false) {
                        var t = new Date(r.response.log[i].time * 1000),
                            when = (t.getMonth() + 1) + '/' + t.getDate() + '&nbsp;' + (t.getHours() < 10 ? '0' : '') + t.getHours() + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes() + ':' + (t.getSeconds() < 10 ? '0' : '') + t.getSeconds(),
                            st = r.response.log[i].details;
                        if (r.response.log[i].which == 1) {
                            msg = 'Status changed:&nbsp;' + unitStatus(st) + (r.response.log[i].inc ? (st == 'com' || st == 'enr' ? ' to' : ' of') + '&nbsp;Incident #' + r.response.log[i].inc : '');
                        } else if (r.response.log[i].which == 2) {
                            msg = r.response.log[i].details.replaceAll('\\r\\n', '<br>');
                        }
                        $('.log').prepend('<div id="entry" data-lid="' + r.response.log[i].lid + '"><div class="c">' + when + '</div><div class="c">' + (r.response.log[i].f ? r.response.log[i].f : 'CAD') + '</div><div class="c">' + msg + '</div><div class="c">' + r.response.log[i].dispatcher + '</div></div>');
                        cur_log_ids.push(r.response.log[i].lid);
                    }
                }
            }
        }
    });
}

function closeModal() {
    if ($('#modal2').is(':visible') === false) {
        $('#modal').fadeOut(function () {
            $('#modal').removeClass('dialog short');
            $('.shadow').hide().removeClass('up');
            $('#modal .modal-header').css('background-color', 'var(--blue)');
            $('#modal .modal-header span').html('{modal-title}');
            $('#modal .content').html('');
        });
    } else if (($('#modal').is(':visible') === true && $('#modal2').is(':visible') === true) || $('#modal2').is(':visible') === true) {
        $('#modal2').fadeOut(function () {
            $('#modal2').removeClass('dialog short');
            $('.shadow').hide().removeClass('up');
            $('#modal2 .modal-header').css('background-color', 'var(--blue)');
            $('#modal2 .modal-header span').html('{modal-title}');
            $('#modal2 .content').html('');
        });
    }
}

function doDefaultFilter() {
    var fr = $('#filter-resources'),
        fi = $('#filter-incidents');
    if (fi.attr('data-default') != '') {
        filterIncidents(fi.find('option:selected').val(), $('#searchIncidents').val());
    }
    if (fr.attr('data-default') != '') {
        filterUnits(fr.find('option:selected').val(), $('#filter-status').find('option:selected').val(), $('#searchResources').val());
    }
    if ($('#filter-log').attr('data-default') == '') {
        filterLog($('#filter-log').find('option:selected').val());
    } else {
        var a = $('#filter-log').attr('data-default');
        $('#filter-log').find('option[value=' + a + ']').prop('selected', 'selected');
        filterLog(a);
    }
}

function createNewIncident(lat = null, lon = null) {
    $.ajax({
        url: api(app, 'numbering'),
        method: 'POST',
        data: {
            agency: agency
        },
        success: function (d) {
            var nin = d.response.nextIncidentNum.toString(),
                nid = d.response.id;
            openScreen('incident', 'screen/incident/new?nin=' + nin + '&nid=' + nid + (lat && lon ? '&lat=' + lat + '&lon=' + lon : ''), 1062, 744);
        }
    });
}

function changeResourceStatus(z) {
    openScreen('resource', 'screen/resStatus?u=' + z, 600, 600);
}

function initialize() {
    $.ajax({
        url: api(app, 'config'),
        method: 'POST',
        data: {
            agency: agency
        },
        dataType: 'json',
        success: function (r) {
            var fr = $('#filter-resources'),
                fi = $('#filter-incidents'),
                level = [];

            settings = r.response.settings[0];

            r.response.incident.forEach(function (v) {
                incidentTypes.push(v);
            });

            r.response.jurisdiction.forEach(function (v) {
                jurisdictions.push(v.value);
            });

            r.response.dispatchers.forEach(function (v) {
                dispatchers.push([v.uid, v.name]);
            });

            r.response.zone.forEach(function (z, n) {
                var v = z.name;
                zones.push(v);
                zoneConfig.push(z);

                fi.append('<option ' + (fi.attr('data-default') == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>');
                fr.append('<option ' + (fr.attr('data-default') == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>');
            });

            r.response.responseLevels.forEach(function (l) {
                if (l.zones) {
                    l.zones.forEach(function (m) {
                        var nm;

                        zoneConfig.forEach(function (zc) {
                            if (zc.id == m) {
                                nm = zc.name;
                            }
                        });

                        responseLevels[nm] = l.level;
                    });
                }
            });
            console.log(responseLevels);

            $('.loading').hide();
            $('.shadow').hide();
        },
        complete: function () {
            var uhead = '<div id="unit" class="header"><div class="un">Unit</div><div class="un">Type</div><div class="un">Status</div><div class="un">Zone</div><div class="un justify-content-right">Last Comm</div></div>',
                ihead = '<div id="incident" class="header" style="padding:0.25em 5px"><div class="it">Inc #</div><div class="it">Type</div><div class="it">Name</div><div class="it">Zone</div><div class="it">Status</div><div class="it justify-content-right">Elapsed</div><div class="it context" style="min-width:19.19px"></div></div>';

                $('.incidents').html(ihead);
            $('.resources').html(uhead);
        }
    });
}

$(window).on('load', function () {
    getIncidents();
    getTimers(1);

    setInterval(function () {
        getIncidents();
        getResources();
        getTimers(1);

        if (stopLogFetch != 1) {
            getLog();
        }
    }, reloadTime);
});

$(document).ready(function () {
    $('.loading').show();
    $('.shadow').show();

    initialize();

    setInterval(function () {
        $('.incidents #incident').each(function () {
            var it = timeAgo($(this).attr('data-time'));
            $(this).find('#incidentTimer').html(it);
        });

        $('.resources #unit').each(function () {
            var it = timeAgo($(this).attr('data-time'));
            $(this).find('#unitTimer').html(it);
        });
    }, 1000);

    $('#changeUnitStatus').on('click', function () {
        $('.shadow').fadeIn();
        $('#modal .modal-header span').html('Resource Status');
        $('#modal .content').html(resourceStatusForm);
        $('#modal').addClass('dialog short').fadeIn();
    });

    $('#logNote').on('click', function () {
        logNewNote();
    });

    $(document).on('click', '[id^=incident]', function (e) {
        var id = $(this).attr('data-id'),
            num = $(this).attr('data-num');

        if (e.target.className != 'far fa-ellipsis-vertical') {
            openScreen('incident', 'screen/incident/edit?nin=' + num + '&nid=' + id, 1062, 744);
        }
    });

    $(document).on('dblclick', '[id^=unit]', function () {
        if ($(this).hasClass('header') === false) {
            changeResourceStatus($(this).attr('data-unit'));
        }
    });

    $(document).on('click', '[id^=newIncident]', function () {
        createNewIncident();
    });

    $(document).on('click', '[id^=allTimers]', function () {
        getTimers(2);
    });

    $(document).on('click', '[id^=closeModal]', function () {
        closeModal();
    });

    $('#filter-incidents').on('change', function () {
        filterIncidents($(this).find('option:selected').val());
        savePrefs();
    });

    $('#filter-resources').on('change', function () {
        filterUnits($(this).find('option:selected').val(), $('#filter-status').find('option:selected').val(), $('#searchResources').val());
        savePrefs();
    });

    $('#filter-status').on('change', function () {
        filterUnits($('#filter-resources').find('option:selected').val(), $(this).find('option:selected').val(), $('#searchResources').val());
    });

    $('#filter-log').on('change', function () {
        $('.log').html('');
        cur_log_ids = [];
        filterLog($('#filter-log').find('option:selected').val());
        savePrefs();
    });

    $('#searchResources').on('keyup', function () {
        filterUnits($('#filter-resources').find('option:selected').val(), $('#filter-status').find('option:selected').val(), $(this).val());
    });

    $('#searchIncidents').on('keyup', function () {
        filterIncidents($('#filter-incidents').find('option:selected').val(), $(this).val());
    });

    $(document).on('click', 'ul.incContext li', function () {
        var p = $(this).parent();
        p.hide().html('');
        if ($(this).attr('rel') == 'assign') {
            openScreen('assign', 'screen/assign?id=' + p.attr('data-id'), 600, 400);
        } else if ($(this).attr('rel') == 'relate') {
            openScreen('assign', 'screen/relate?id=' + p.attr('data-id'), 700, 300);
        }
    });

    $(document).on('click', '[id^=incContextM]', function (e) {
        var left = e.clientX - 157,
            top = e.clientY,
            p = $(this).parent().parent(),
            i = p.attr('data-id'),
            n = p.attr('data-num');
        $('ul.incContext').attr('data-id', i).attr('data-num', n).html('<li rel="assign">Assign Resources</li><li rel="relate">Relate Incident</li>').css({
            'top': top + 'px',
            'left': left + 'px'
        }).show();
    });

    $(document).on('focus', '#searchUnit', function () {
        var q = $(this).val(),
            so = '',
            dl = $(this).attr('data-log');

        cur_res_ids_active.forEach(function (u, z) {
            so += '<div id="select-option_units" class="select-option" ' + (dl == 1 ? 'data-log="1" ' : '') + 'data-unit="' + u + '">' + u + '</div>';
        });

        $('.select-list').html(so);

        $('.select-list>div').each(function () {
            if ($(this).attr('data-unit').search(q) < 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });

        $('.select-list').css({
            'min-height': '32px',
            'top': ($(this).offset().top + 35.59) + 'px',
            'left': $(this).offset().left + 'px',
        }).show();
    });

    $(document).on('blur', '#searchUnit', function () {
        $(this).val($('#curUnit').val());
    });

    $(document).on('keyup', '#searchUnit', function (e) {
        var q = $(this).val();
        $('.select-list>div').each(function () {
            if ($(this).attr('data-unit').replace('-', '').search(q) < 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });

        if ($('.select-list>div:visible').length == 1) {
            if (e.keyCode == 13) {
                $('#searchUnit').val($('.select-list>div:visible').attr('data-unit'));
                $('.select-list').hide().html('').css({
                    'min-height': 0,
                    'top': 0,
                    'left': 0
                });
            }
        }
    });

    $(document).on('click', '[id=select-option_units]', function () {
        var tu = $('#resourceStatus #curUnit').val(),
            u = $(this).attr('data-unit'),
            dl = $(this).attr('data-log');

        $('#searchUnit').val(u);

        if (dl == 1) {
            $('.select-list').hide().html('').css({
                'min-height': 0,
                'top': 0,
                'left': 0
            });
        } else {
            if (u != tu) {
                $('#modal .content').html('');
                $('.select-list').hide();
                changeResourceStatus(u);
            }
        }

        if ($('form#activityLog').is(':visible')) {
            var inc;

            $('.resources #unit').each(function () {
                if (u == $(this).attr('data-unit')) {
                    inc = $(this).attr('data-inc');
                }
            });

            if (inc) {
                $('form#activityLog').append('<input type="hidden" name="inc" value="' + inc + '">');
            }
        }
    });

    $(document).on('change', '#resourceStatus select[name=unit]', function () {
        var w = $(this).find('option:selected').val();
        
        $('.resources #unit').each(function () {
            var u = $(this).attr('data-unit');
            if (u == w) {
                var s = $(this).attr('data-status'),
                    z = $(this).attr('data-zone'),
                    t = $(this).attr('data-time'),
                    comm = timeAgo(t, 2),
                    i = $(this).attr('data-inc');

                $('#resourceStatus select[name=inc] option').each(function () {
                    if ($(this).val() == i) {
                        $(this).prop('selected', 'selected');
                    }
                });
                if (s == 'asgn' || s == 'com' || s == 'enr' || s == 'ons' || s == 'not') {
                    $('#asgntoinc').show();
                } else {
                    $('#asgntoinc').hide();
                }
                $('#modal .modal-header span').html('Resource Status' + (w ? ':' + u : ''));
                $('#resourceStatus select[name=status]').find('option[value=' + s + ']').prop('selected', 'selected');
                $('#resourceStatus #lastcomm').html(comm);
            }
        });
    });
    $(document).on('change', '#resourceStatus select[name^=status]', function () {
        var a = $(this).find('option:selected').val();
        if (a == 'asgn' || a == 'com' || a == 'enr' || a == 'ons' || a == 'not') {
            $('#asgntoinc').show();
        } else {
            $('#asgntoinc').hide();
        }
    });
    $(document).on('submit', 'form#activityLog', function (e) {
        e.preventDefault();
        if ($('.select-list').is(':visible') === false) {
            $.ajax({
                url: api('forms', 'log'),
                method: 'POST',
                data: $(this).serialize(),
                dataType: 'json',
                success: function (r) {
                    if (r.return.response.success == 1) {
                        closeModal();
                        displayMsg('success', 'Your notes were added to the activity log');
                    }
                }
            });
        }
    });
});
$(document).on('keydown', function (e) {
    if (e.altKey && e.shiftKey && e.which === 78) {
        createNewIncident();
    }
    if (e.altKey && e.which === 67) {
        commandLine(prompt('Command Line'));
    }
    if (e.ctrlKey && e.which === 76) {
        logNewNote();
    }
    if (e.altKey && e.shiftKey && e.which === 85) {
        $('.shadow').fadeIn();
        $('#modal .modal-header span').html('Resource Status');
        $('#modal .content').html(resourceStatusForm);
        $('#modal').addClass('dialog').fadeIn();
    }
});
$(document).on('mouseup', function (e) {
    var $target = $(e.target);
    if (!$('.incContext').is($target) && $('.incContext').has($target).length === 0 && $('.incContext').is(':visible') === true) {
        $('.incContext').hide().html('');
    }
});
$(document).on('keyup', function (e) {
    if (e.keyCode == 27) {
        $('#message').animate({
            top: -100
        }, 500);
        closeModal();
        $('.select-list').hide().css({
            'top': 0,
            'left': 0
        });
    }
});
$('input').on('keyup', function () {
    var a = $(this).attr('data-format'),
        v = $(this).val();
    if (a == 'number' && v) {
        $(this).val(number_format(v));
    } else if (a == 'phone' && v) {
        var cleaned = ('' + v).replace(/\D/g, ''),
            match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        $(this).val('(' + match[1] + ') ' + match[2] + '-' + match[3]);
    }
});