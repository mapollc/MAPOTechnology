var settings = config.settings,
    opener = window.opener;

$(document).ready(function () {
    var q;

    opener.$('.resources #unit').each(function () {
        if ($(this).attr('data-unit') == unit) {
            q = $(this);
        }
    });

    var u = q.attr('data-unit'),
        s = q.attr('data-status'),
        z = q.attr('data-zone'),
        l = q.attr('data-loc'),
        t = q.attr('data-time'),
        tmr = q.attr('data-timer'),
        ia = q.attr('data-ia'),
        comm = timeAgo(t, 3),
        i = q.attr('data-inc');

    $('#resourceStatus').prepend('<input type="hidden" id="oldStatus" value="' + s + '">');
    $('#resourceStatus').prepend('<input type="hidden" id="curUnit" value="' + u + '">');
    if (l != '' && l != undefined) {
        $('#resourceStatus').prepend('<input type="hidden" id="oldlocation" value="' + l + '">');
    }

    opener.incOptions.forEach(function (v, n) {
        $('select[name=inc]').append(v);
    });

    $('select[name=inc] option').each(function () {
        if ($(this).val().split('|')[1] == i) {
            $(this).prop('selected', 'selected');
        }
    });

    if (s == 'asgn' || s == 'com' || s == 'enr' || s == 'ons' || s == 'lea' || s == 'not') {
        $('#asgntoinc').show();
    } else {
        $('#asgntoinc').hide();
    }

    if (checkPerms('changeIA')) {
        $('#resourceStatus #ia1').prop('disabled', false);
        $('#resourceStatus #ia2').prop('disabled', false);
        $('#resourceStatus input[type=hidden][name=ia]').remove();
    } else {
        $('#resourceStatus #ia1').prop('disabled', true);
        $('#resourceStatus #ia2').prop('disabled', true);
        $('#resourceStatus').prepend('<input type="hidden" name="ia" value="' + ia + '">');
    }

    $('#resourceStatus input[name=ia][value=' + ia + ']').prop('checked', true);
    $('#resourceStatus #searchUnit').val(u);
    $('#resourceStatus textarea[name=location]').val(l);
    
    if (tmr) {
        $('#resourceStatus select[name=timer]').find('option[value=' + tmr + ']').prop('selected', 'selected');
    }

    if (s) {
        $('#resourceStatus select[name=status]').find('option[value=' + s + ']').prop('selected', 'selected');
    }
    
    $('#resourceStatus #lastcomm').html(comm);
});

$(document).on('submit', 'form#resourceStatus', function (e) {
    e.preventDefault();
    var b = $(this),
        rs = $('#resourceStatus select[name=status]').find('option:selected'),
        un = $('#resourceStatus input[id=searchUnit]').val(),
        inc = $('#resourceStatus select[name=inc]').find('option:selected');

    if (un == '') {
        opener.displayMsg('error', 'You must choose a resource to assign' + (rs.text() ? ' as "' + rs.text() + '"' : ''));
    } else if ($('select[name=status]').val() == '') {
        opener.displayMsg('error', 'You must choose a status to assign ' + un + ' to');
    } else if ((rs.val() == 'asgn' || rs.val() == 'com' || rs.val() == 'enr' || rs.val() == 'ons' || rs.val() == 'not') && !inc.val()) {
        opener.displayMsg('error', 'You must assign ' + un + ' to an incident');
    } else {
        b.val('Saving...');

        $.ajax({
            url: api('forms', 'unit'),
            method: 'POST',
            data: $(this).serialize(),
            crossDomain: true,
            success: function (r) {
                b.val('Save Status');

                if (r.return.response.success == 1) {
                    opener.displayMsg('success', 'The status of <b style="padding:0 2px">' + un + '</b> is now <b style="padding:0 2px">' + opener.unitStatus(rs.val()).toUpperCase() + '</b>');
                    opener.getIncidents();
                    opener.getResources();
                    opener.getLog();
                    window.close();
                }
            }
        });
    }
});

/* resource status controls */
$(document).on('focus', '#searchUnit', function () {
    var q = $(this).val(),
        so = '',
        dl = $(this).attr('data-log');

    opener.cur_res_ids_active.forEach(function (u, z) {
        so += '<div id="select-option_units" class="select-option" ' + (dl == 1 ? 'data-log="1" ' : '') + 'data-unit="' + u + '">' + u + '</div>';
    });

    $('.select-list').html(so);

    $('.select-list > div').each(function () {
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

    $('.select-list > div').each(function () {
        if ($(this).attr('data-unit').replace('-', '').search(q) < 0) {
            $(this).hide();
        } else {
            $(this).show();
        }
    });

    if ($('.select-list > div:visible').length == 1) {
        if (e.keyCode == 13) {
            $('#searchUnit').val($('.select-list > div:visible').attr('data-unit'));
            $('.select-list').hide().html('').css({
                'min-height': 0,
                'top': 0,
                'left': 0
            });
        }
    }
});

/*$(document).on('blur', '#searchUnit', function() {
 $('.select-list').hide().css({
   'min-height': 0,
   'top': 0,
   'left': 0,
  });
});*/

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
            opener.changeResourceStatus(u);
        }
    }

    /* if writing a note for the log, get any current incident the unit is on */
    if ($('form#activityLog').is(':visible')) {
        var inc;

        opener.$('.resources #unit').each(function () {
            if (u == $(this).attr('data-unit')) {
                inc = $(this).attr('data-inc');
            }
        });

        if (inc) {
            $('form#activityLog').append('<input type="hidden" name="inc" value="' + inc + '">');
        }
    }

    /*if ($('#modal form').attr('id') == 'resourceStatus') {
          $('.modal-header span').html('Resource Status: ' + u);
    }
        $('.select-list').hide().html('').css({
      'min-height': 0,
      'top': 0,
      'left': 0
    });*/
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

            $('#modal .modal-header span').html('Resource Status' + (w ? ': ' + u : ''));
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