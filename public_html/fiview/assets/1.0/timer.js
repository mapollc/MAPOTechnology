var settings = config.settings,
    opener = window.opener;

$(document).ready(function () {
    if (p == 1) {
        /* how long overdue is this timer and when was the last comm w/ the unit? */
        if (new Date().getTime() / 1000 >= due) {
            var hla = parseInt(timer);

            /* how long overdue is this timer and when was the last comm w/ the unit? */
            setInterval(function () {
                var tt = $('#timerLastComm').attr('data-time'),
                    ta = timeAgo(parseInt(tt) + hla);
                $('#timerOverdue').html((ta != '00:00:00' ? '-' : '') + ta);
                $('#timerLastComm').html(timeAgo(tt, 2));
            }, 1000);

            /*opener.document.getElementById('notificationSound').play();*/
            if (opener) {
                opener.stopTimers = 1;
            }
        }
    } else if (p == 2) {
        var s = ["0", "600", "900", "1800", "3600", "7200", "14400"],
            k = ["None", "10 minutes", "15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours"];

        $.ajax({
            url: api(app, 'timers'),
            method: 'POST',
            dataType: 'json',
            data: {
                all: 1
            },
            success: function (ret) {
                var tv = '';

                if (ret.response == null) {
                    tv = '<div class="row" style="font-size:18px;padding:5px 10px!important"><div class="col w-12">No resources are on a timer right now</div></div>';
                } else {
                    for (var i = 0; i < ret.response.length; i++) {
                        var r = ret.response;
                        tv += '<div class="row" style="font-size:18px"><div class="col w-3">' + r[i].unit + '</div><div class="col w-4">' + timeAgo(r[i].started, 2) + '</div><div class="col">' + k[s.indexOf(r[i].timer)] + '</div></div>';
                    }
                }

                $('#timerWrapper').html(tv);
            }
        });
    }
    /*var r = opener.currentTimerData,
        timer = '',
        tv = '<div class="row" style="font-weight:bold;font-size:0.85em;margin-bottom:0.25em"><div class="col w-4">Unit</div><div class="col w-4">Last Comm</div><div class="col w-3">Timer Duration</div></div>',
        s = ["0", "600", "900", "1800", "3600", "7200", "14400"],
        k = ["None", "10 minutes", "15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours"];

        if (r) {
        for (var i = 0; i < r.length; i++) {
            if (i == timnum) {
                if (p == 2) {
                    tv += '<div class="row"><div class="col w-4">' + r[i].unit + '</div><div class="col w-4">' + timeAgo(r[i].started, 1) + ' ago</div><div class="col w-3">' + k[s.indexOf(r[i].timer)] + '</div></div>';
                } else {
                    for (var z = 0; z < s.length; z++) {
                        timer += '<option ' + (s[z] == r[i].timer ? 'selected ' : '') + 'value="' + s[z] + '">' + k[z] + '</option>';
                    }

                    var f = '<div style="width:100%;padding:5px 10px;font-family:poppins" class="flash">Check Status: ' + r[i].unit.toUpperCase() + '</div>' +
                        '<form id="statusCheck" style="padding:10px"><input type="hidden" name="unit" value="' + r[i].unit + '"><div class="row form-title align-items-center"><div class="col w-4">Status</div><div class="col w-8"><span class="status ' + r[i].status + '" style="display:inline-block;font-size:1.3em;color:#fff;font-weight:400;padding: 1px 8px">' + opener.unitStatus(r[i].status) + '</span></div>' +
                        '</div><div class="row form-title align-items-center"><div class="col w-4">Resource</div><div class="col w-8"><input type="text" value="' + r[i].unit + '" disabled></div>' +
                        '</div><div class="row form-title align-items-center"><div class="col w-4">Location</div><div class="col w-8"><input type="text" value="' + r[i].location + '" disabled></div>' +
                        '</div><div class="row form-title align-items-center"><div class="col w-4">Timer</div><div class="col w-8" style="font-size:1.3em;color:#fff;font-weight:400"><select name="timer">' + timer + '</select></div>' +
                        '</div><div class="row form-title align-items-center"><div class="col w-4">Last Comm</div><div class="col w-8" id="timerLastComm" style="font-size:1.3em;color:#fff;font-weight:400" data-time="' + r[i].started + '">--</div>' +
                        '</div><div class="row form-title align-items-center"><div class="col w-4">Overdue</div><div class="col w-8" id="timerOverdue" style="font-size:1.3em;color:#fff;font-weight:400" data-time="' + r[i].started + '">--</div>' +
                        '</div><div class="text-center" style="margin-top:3em"><input type="button" id="timerReset" class="green" style="margin-right:1em" value="Reset Timer"><input type="button" id="timerClear" value="Clear Timer"></form></div>';

                    *//* Unit is past their status check time; dispatcher needs to respond to the prompt */
    /*if (new Date().getTime() / 1000 >= r[i].due) {
        var hla = parseInt(r[i].timer);
        $('#timerWrapper').html(f);

        // how long overdue is this timer and when was the last comm w/ the unit?
        setInterval(function () {
            var tt = $('#timerLastComm').attr('data-time'),
                ta = timeAgo(parseInt(tt) + hla);
            $('#timerOverdue').html((ta != '00:00:00' ? '-' : '') + ta);
            $('#timerLastComm').html(timeAgo(tt, 2));
        }, 1000);

        opener.document.getElementById('notificationSound').play();
        opener.stopTimers = 1;
    }
}
}
}

if (p == 2) {
$('#timerWrapper').html(tv);
}
} else {
if (p == 2) {
opener.displayMsg('error', 'No resources are currently set on a timer.');
}
}*/
});

/* reset the status check timer for the selected unit */
$(document).on('click', '[id=timerReset]', function (e) {
    $.ajax({
        url: api('forms', 'timer'),
        method: 'POST',
        data: $('form#statusCheck').serialize() + '&type=reset&overdue=' + $('#timerOverdue').html(),
        success: function (r) {
            if (r.return.response.success == 1) {
                opener.displayMsg('success', 'The timer for ' + r.return.response.unit + ' was reset.');
                window.close();
            }
        }
    });
});

/* clear the status check timer for the selected unit */
$(document).on('click', '[id=timerClear]', function (e) {
    $.ajax({
        url: api('forms', 'timer'),
        method: 'POST',
        data: $('form#statusCheck').serialize() + '&type=clear',
        success: function (r) {
            if (r.return.response.success == 1) {
                /*const index = opener.currentTimerData.indexOf(timnum);
                if (index > -1) {
                    opener.currentTimerData.splice(index, 1);
                }*/
                opener.displayMsg('success', 'The timer for ' + r.return.response.unit + ' was cleared.');
                window.close();
            }
        }
    });
});