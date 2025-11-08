var opener = window.opener;

$(document).ready(function () {
    opener.$('.incidents #incident').each(function () {
        if ($(this).attr('data-num') != num && $(this).attr('data-num') != undefined) {
            $('#incs').append('<option value="' + $(this).attr('data-id') + '">' + $(this).attr('data-num') + ' (' + $(this).attr('data-name') + ')</option>');
        }
    });

    /*$('#incs').append('<option value="other">Other</option>');

    $('#relateIncident').on('change', function () {
        if ($(this).find('option:selected').val() == 'other') {
            $('#other').show();
        } else {
            $('#other').hide();
        }
    });*/
});

$(document).on('submit', 'form#relateIncident', function (e) {
    e.preventDefault();

    if ($('#incs').find('option:selected').val() == '') {
        opener.displayMsg('error', 'You must select an incident to relate.');
    } else {
        var n = $('#incs').find('option:selected').text();

        if (confirm('Are you sure you want to relate these calls?')) {
            $.ajax({
                url: api('forms', 'relate'),
                method: 'POST',
                data: $('form#relateIncident').serialize(),
                dataType: 'json',
                success: function (res) {
                    if (res.return.response.error == 1) {
                        opener.displayMsg('error', 'Those incidents are already related.');
                    } else {
                        opener.displayMsg('success', 'That incident was related to ' + n + '.');
                    }

                    opener.getIncidents();
                    opener.getResources();
                    opener.getLog();
                    window.close();
                }
            });
        }
    }
});