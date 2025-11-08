var jop = '';

/* autogenerate the dispatcher's username based on their first and last name*/
$('input[name=first_name]').on('blur', function () {
    var f = $(this).val().substr(0, 1).toLowerCase();
    $('input[name=username]').val(f + $('input[name=last_name]').val().toLowerCase());
});

$('input[name=last_name]').on('blur', function () {
    var f = $('input[name=first_name]').val().substr(0, 1).toLowerCase();
    $('input[name=username]').val(f + $(this).val().toLowerCase());
});

/* when the resource type is change */
$('select[name=type]').on('change', function () {
    var u = $('input[name=unit]'),
        s = $(this).find('option:selected').val();

    if (u.val() == '' && s != '- Choose Type -') {
        u.val(s);
    }
});

$(document).on('click', '[id^=addRow]', function () {
    if ($(this).attr('data-what') == 'Jurisdictions') {
        var st = '';

        /*var c = '<input type="text" name="value[]" style="display:inline-block;width:100px;margin-right:1em" placeholder="' + agency.toUpperCase() + '" value="">' +
            '<input type="text" name="name[]" style="display:inline-block;margin-right:1em" placeholder="Jurisdiction Name" value="">' +
            '<select style="display:inline-block;width:400px" name="agencies[]"><option></option>' + jop + '</select>' +
            '<a href="#" class="btn red sm" style="margin-left:0.5em" id="removeRow" onclick="return false"><i class="fas fa-delete-left"></i></a>';*/

        dispatchStates.forEach(function (s) {
            st += '<option value="' + s + '">' + s + '</option>';
        });

        var c = '<select id="dstate" name="state[]" style="display:inline-block;width:100px;margin-right:10px"><option></option>' + st + '</select>&nbsp;' +
                '<select id="dagencies" name="agency[]" style="display:inline-block;margin-right:10px" disabled><option>- Choose Agency -</option></select>&nbsp;' +
                '<select id="darea" name="unit[]" style="display:inline-block;margin-right:10px" disabled><option>- Choose Unit -</option></select>&nbsp;' +
                '<input type="text" id="dunit" style="display:inline-block;margin-right:10px;width:150px" disabled>&nbsp;' +
                '<a href="#" class="btn red sm" style="margin-left:0.5em" id="removeRow" onclick="return false"><i class="fas fa-delete-left"></i></a>';

    } else {
        var c = '<input type="text" name="types[]" style="display:inline-block" placeholder="' + $(this).attr('data-what') + '" value="">' +
            '<a href="#" class="btn red sm" style="margin-left:0.5em" id="removeRow" onclick="return false"><i class="fas fa-delete-left"></i></a>';
    }

    $('ol').append('<li data-id="' + ($('ol li').length + 1) + '">' + c + '</li>');
});

$(document).on('keyup', 'input[name^=phone]', function () {
    var v = $(this).val(),
        cleaned = (' ' + v).replace(/\D/g, ''),
        match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
        $(this).val('(' + match[1] + ') ' + match[2] + '-' + match[3]);
    } else {
        $(this).val(v.replace(/[^0-9]+/g, ''));
    }
});

$(document).on('click', '[id^=removeRow]', function () {
    if (confirm('Are you sure you want to remove this?') == true) {
        $(this).parent().remove();
    }
});

$(document).ready(function () {
    if (window.location.pathname.split('/')[4] == 'jurisdictions') {
        /*allAgencies.forEach(function (l, n) {
            jop += '<option value="' + l + '">' + l + '</option>';
        });*/

        $(document).on('change', '[id^=dstate]', function () {
            var d = $(this).parent().children().eq(1),
                s = $(this).find('option:selected').val();

            d.html('<option>- Choose Agency -</option>').prop('disabled', true);

            $.ajax({
                url: 'https://' + config.baseURL + '/config/api',
                method: 'POST',
                data: {
                    m: 1,
                    state: s
                },
                dataType: 'json',
                success: function (r) {
                    r.response.forEach(function (n) {
                        d.append('<option value="' + n + '">' + n + '</option>');
                    });
                    d.prop('disabled', false);
                }
            });
        });

        $(document).on('change', '[id^=dagencies]', function () {
            var d = $(this).parent().children().eq(2),
                s = $(this).parent().children().eq(0).find('option:selected').val(),
                a = $(this).find('option:selected').val();

            d.html('<option>- Choose Unit -</option>').prop('disabled', true);

            $.ajax({
                url: 'https://' + config.baseURL + '/config/api',
                method: 'POST',
                data: {
                    m: 2,
                    state: s,
                    agency: a
                },
                dataType: 'json',
                success: function (r) {
                    r.response.forEach(function (n) {
                        var k = Object.keys(n),
                            t = n[k];
                        d.append('<option value="' + k + '">' + t + '</option>');
                    });
                    d.prop('disabled', false);
                }
            });
        });

        $(document).on('change', '[id^=darea]', function () {
            $(this).parent().append('<input type="hidden" name="area[]" value="' + $(this).find('option:selected').text() + '">');
            $(this).parent().children().eq(3).val($(this).find('option:selected').val());
        });
    }

    setInterval(function () {
        var d = new Date(),
            t = (d.getHours() < 10 ? 0 : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? 0 : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? 0 : '') + d.getSeconds();
        $('#now').html(t);
    }, 1000);
});