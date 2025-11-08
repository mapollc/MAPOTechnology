var settings = config.settings,
    opener = window.opener,
    dispatchers = opener.dispatchers,
    jurisdictions = opener.jurisdictions,
    zones = opener.zones,
    incidentTypes = opener.incidentTypes;

function setNowDate(e) {
    var a = new Date(),
        t = a.getFullYear() + '-' + ((a.getMonth() + 1) < 10 ? '0' : '') + (a.getMonth() + 1) + '-' + (a.getDate() < 10 ? '0' : '') + a.getDate() + 'T' + (a.getHours() < 10 ? '0' : '') + a.getHours() + ':' + (a.getMinutes() < 10 ? '0' : '') + a.getMinutes();

    e.attr('type', 'datetime-local').val((e.val() == '' ? t : e.val()));
}

function setNow(w) {
    var t = new Date(),
        mo = ((t.getMonth() + 1) < 10 ? '0' : '') + (t.getMonth() + 1),
        d = (t.getDate() < 10 ? '0' : '') + t.getDate(),
        y = t.getFullYear(),
        h = (t.getHours() < 10 ? '0' : '') + t.getHours(),
        m = (t.getMinutes() < 10 ? '0' : '') + t.getMinutes();

    $('input[name=' + w + '_date]').val(mo + '/' + d + '/' + y);
    $('input[name=' + w + '_time]').val(h + ':' + m);
}

function getGeoData(y, z) {
    $('select[name=state]').prop('disabled', true);
    $('select[name=county]').prop('disabled', true);

    $('#addNewIncident input[name=t]').prop('disabled', true);
    $('#addNewIncident input[name=r]').prop('disabled', true);
    $('#addNewIncident input[name=s]').prop('disabled', true);
    $('#addNewIncident input[name=ss]').prop('disabled', true);
    $('#addNewIncident input[name=location]').prop('disabled', true);

    /* get the incident state & county */
    $.ajax({
        url: opener.api(app, 'geo'),
        method: 'POST',
        data: {
            lat: y,
            lon: z
        },
        dataType: 'json',
        success: function (d) {
            var a = short_states[long_states.indexOf(d.response.state)],
                b = d.response.county;

            $('select[name=state]').find('option').remove().end().append('<option value="' + a + '">' + a + '</option>').prop('disabled', false);
            $('select[name=county]').find('option').remove().end().append('<option value="' + b + '">' + b + '</option>').prop('disabled', false);
            $('select[name=zone] option').each(function () {
                if ($(this).val() == d.response.zone || d.response.zone == null && $(this).val() == '') {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#addNewIncident input[name=t]').val(d.response.trs.t).prop('disabled', false);
            $('#addNewIncident input[name=r]').val(d.response.trs.r).prop('disabled', false);
            $('#addNewIncident input[name=s]').val(d.response.trs.s).prop('disabled', false);
            $('#addNewIncident input[name=ss]').val(d.response.trs.ss).prop('disabled', false);
            $('#addNewIncident input[name=location]').val(d.response.geolocation).prop('disabled', false);
        }
    });

    /*$.ajax({
        url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=%7B%22x%22%3A+' + z + '%2C+%22y%22%3A+' + y + '%2C+%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&outFields=NAME%2CSTATE_NAME&returnGeometry=false&returnQueryGeometry=false&f=json',
        method: 'GET',
        dataType: 'json',
        success: function(d) {
        var a = short_states[long_states.indexOf(d.features[0].attributes.STATE_NAME)],
            b = d.features[0].attributes.NAME.replace(' County', '');
        $('select[name=state]').find('option').remove().end().append('<option value="' + a + '">' + a + '</option>');
        $('select[name=county]').find('option').remove().end().append('<option value="' + b + '">' + b + '</option>');
        }
    });*/

    /* Get TRS info & proximal location to a city */
    /*$.ajax({
    url: 'https://www.firewxavy.org/api/v2/geocode?token=cd62b422f5f06384ff76db30894fa8b20dd1edf5&application=1',
    method: 'POST',
    data: {
        lat: y,
        lon: z,
        trs: 1
    },
    dataType: 'json',
    success: function(g) {
        $('#addNewIncident input[name=t]').val(g.trs.all.T);
        $('#addNewIncident input[name=r]').val(g.trs.all.R);
        $('#addNewIncident input[name=s]').val(g.trs.all.S);
        $('#addNewIncident input[name=location]').val(g.geolocation.distance + ' ' + g.geolocation.bearing + ' of ' + g.city);
    }
    });*/

    /*$('select[name=status]').find('option[value=1]').prop('selected', 'selected');*/
}

function getIRTime(value, w) {
    var r = '';

    value.forEach(function (v) {
        if (v.status == w) {
            r = v.time;
        }
    });
    return (r ? timeAgo(r, 2) : '');
}

function loadIncForms() {
    dispatchers.forEach(function (v, n) {
        $('select[name=calltaker]').append('<option value="' + v[0] + '">' + v[1].last + ', ' + v[1].first + '</option>');
        $('select[name=dispatcher]').append('<option value="' + v[0] + '">' + v[1].last + ', ' + v[1].first + '</option>');
    });

    jurisdictions.forEach(function (v) {
        $('select[name=juris]').append('<option ' + (settings.default_jurisdiction == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>');
    });

    zones.forEach(function (v) {
        $('select[name=zone]').append('<option ' + (settings.default_zone == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>');
    });
    $('select[name=zone]').append('<option value="OPZ">Outside Jurisdiction</option>');

    incidentTypes.forEach(function (v) {
        $('select[name=type]').append('<option ' + (settings.default_incident == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>');
    });

    incidentOptions.fuels.forEach(function (k, v) {
        $('#fuels').append('<label class="checkbox" for="fuelType' + v + '"><input type="checkbox" name="fuels[]" id="fuelType' + v + '" value="' + k.toLowerCase() + '">' + k + '</label>');
    });

    incidentOptions.fuelModel.forEach(function (v, n) {
        $('select[name=behavior1]').append('<option value="' + v + '">' + v + '</option>');
        $('select[name=behavior2]').append('<option value="' + v + '">' + v + '</option>');
    });

    cardinal.forEach(function (v) {
        $('select[name=wind_dir]').append('<option value="' + v + '">' + v + '</option>');
        $('select[name=aspect]').append('<option value="' + v + '">' + v + '</option>');
    });
}

function editIncident() {
    $.ajax({
        url: opener.api(app, 'incident'),
        method: 'POST',
        data: {
            id: nid
        },
        dataType: 'json',
        success: function (d) {
            var a = new Date(d.response.reported * 1000),
                ctl = new Date(d.response.details.control * 1000),
                cnt = new Date(d.response.details.contain * 1000),
                out = new Date(d.response.details.out * 1000),
                rpt_time = a.getFullYear() + '-' + ((a.getMonth() + 1) < 10 ? '0' : '') + (a.getMonth() + 1) + '-' + (a.getDate() < 10 ? '0' : '') + a.getDate() + 'T' + a.getHours() + ':' + (a.getMinutes() < 10 ? '0' : '') + a.getMinutes(),
                control_date = ((ctl.getMonth() + 1) < 10 ? '0' : '') + (ctl.getMonth() + 1) + '/' + (ctl.getDate() < 10 ? '0' : '') + ctl.getDate() + '/' + ctl.getFullYear(),
                control_time = (ctl.getHours() < 10 ? '0' : '') + ctl.getHours() + ':' + (ctl.getMinutes() < 10 ? '0' : '') + ctl.getMinutes(),
                contain_date = ((cnt.getMonth() + 1) < 10 ? '0' : '') + (cnt.getMonth() + 1) + '/' + (cnt.getDate() < 10 ? '0' : '') + cnt.getDate() + '/' + cnt.getFullYear(),
                contain_time = (cnt.getHours() < 10 ? '0' : '') + cnt.getHours() + ':' + (cnt.getMinutes() < 10 ? '0' : '') + cnt.getMinutes(),
                out_date = ((out.getMonth() + 1) < 10 ? '0' : '') + (out.getMonth() + 1) + '/' + (out.getDate() < 10 ? '0' : '') + out.getDate() + '/' + out.getFullYear(),
                out_time = (out.getHours() < 10 ? '0' : '') + out.getHours() + ':' + (out.getMinutes() < 10 ? '0' : '') + out.getMinutes();

            document.title = 'Edit Incident: ' + d.response.name + ' (' + d.response.juris + '-' + d.response.num + ')';

            /* prepend old information so we can determine if it has been changed on save */
            $('input[name=num]').attr('name', 'numDisplay').prop('disabled', true);
            $('#addNewIncident').prepend('<input type="hidden" name="id" value="' + nid + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="num" value="' + d.response.num + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldprimunit" value="' + d.response.details.primaryUnit + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldname" value="' + d.response.name + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldzone" value="' + d.response.zone + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldstatus" value="' + d.response.status + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldacres" value="' + d.response.details.current_acres + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldjuris" value="' + d.response.juris + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldlat" value="' + d.response.lat + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldlon" value="' + d.response.lon + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldtrs" value="' + d.response.details.t + d.response.details.r + d.response.details.s + d.response.details.ss + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldic" value="' + d.response.details.ic + '">');
            $('#addNewIncident').prepend('<input type="hidden" name="oldict" value="' + d.response.details.ict + '">');

            /* add notes to the incident */
            var notes = '';
            d.response.activityLog.forEach(function (n) {
                notes += '<div style="display:flex;align-items:flex-start;padding:5px 0"><div style="flex:0 0 200px;width:200px"><b>' + timeAgo(n.time, 2) + ' [' + n.t + ']</b></div>' +
                    '<div style="display:flex;flex:0 0 100px;width:100px"><span class="truncate">' + (n.f == '' ? 'CAD' : n.f) + '</span></div>' +
                    '<div style="padding-left:15px">' + n.details.replaceAll('\\r\\n', '<br>') + '</div></div></div>';
            });
            $('#incidentNotes').html(notes);

            /* add resources that are involved in the call     not com enr ons lea clr */
            if (d.response.unitLog) {
                var resps = '<table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;border-color:#545454"><thead><th style="width:10%">Unit</th><th style="">Assigned</th><th style="width:12.86%">Notified</th>' +
                '<th style="width:12.86%">Committed</th><th style="width:12.86%">Enroute</th><th style="width:12.86%">On-Scene</th><th style="width:12.86%">Leaving</th><th style="width:12.86%">Cleared</th></thead><tbody>';
            
                Object.entries(d.response.unitLog).forEach(entry => {
                    const [unit, value] = entry;

                    resps += '<tr style="font-size:14px"><td>' + unit + '</td>' +
                        '<td>' + getIRTime(value, 'asgn') + '</td>' +
                        '<td>' + getIRTime(value, 'not') + '</td>' +
                        '<td>' + getIRTime(value, 'com') + '</td>' +
                        '<td>' + getIRTime(value, 'enr') + '</td>' +
                        '<td>' + getIRTime(value, 'ons') + '</td>' +
                        '<td>' + getIRTime(value, 'lea') + '</td>' +
                        '<td>' + getIRTime(value, 'clr') + '</td></tr>';
                });
                $('#incidentResponse').html(resps + '</tbody></table>');
            }

            if (d.response.details.primaryUnit) {
                $('#addNewIncident select[name=priUnit]').append('<option selected value="' + d.response.details.primaryUnit + '">' + d.response.details.primaryUnit + '</option>');
            }
            
            opener.$('.resources #unit').each(function() {
                if (d.response.juris + '-' + d.response.num == $(this).attr('data-inc') && $(this).attr('data-unit') != d.response.details.primaryUnit) {
                    $('#addNewIncident select[name=priUnit]').append('<option value="' + $(this).attr('data-unit') + '">' + $(this).attr('data-unit') + '</option>');
                }
            });

            /* if incident type is law enforcement, modify the incident screen */
            if (d.response.type == 'Law Enforcement') {
                $('input[name=initial_acres]').prop('disabled', true);
                $('input[name=current_acres]').prop('disabled', true);
                $('#fueltitle').html('');
                $('input[name^=fuels]').parent().hide();
                $('input[name^=rp]').prop('disabled', true);
                $('#incdet').hide();
                $('#tbr').hide();

                $('.tab-nav ul li[data-tab=tab2]').hide();                
                $('.tab-nav ul li[data-tab=tab3]').hide();
                $('#fiinc').hide();
            } else {
                if (d.response.details.fuels) {
                    d.response.details.fuels.forEach(function (v, k) {
                        $('#addNewIncident input[name^=fuels]').each(function () {
                            if ($(this).val() == v.toLowerCase()) {
                                $(this).prop('checked', true);
                            }
                        });
                    });
                }
            }

            $('#addNewIncident input[name=year]').val(a.getFullYear());
            $('#addNewIncident select[name=juris] option').each(function () {
                if (d.response.juris == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            $('#addNewIncident input[name=numDisplay]').val(d.response.num);
            $('#addNewIncident input[name=name]').val(d.response.name);
            $('#addNewIncident select[name=type] option').each(function () {
                if (d.response.type == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            $('#addNewIncident input[name=datetime]').attr('type', 'datetime-local').val(rpt_time);

            if ($('input[name=coord_type').val() == 'dms') {
                if (d.response.lat != 0) {
                    var a = decToDeg(d.response.lat),
                        b = decToDeg(d.response.lon);

                    $('#addNewIncident input[name=latdeg]').val(a[0]);
                    $('#addNewIncident input[name=latmin]').val(a[1]);
                    $('#addNewIncident input[name=latsec]').val(a[2]);
                    $('#addNewIncident input[name=londeg]').val(b[0]);
                    $('#addNewIncident input[name=lonmin]').val(b[1]);
                    $('#addNewIncident input[name=lonsec]').val(b[2]);
                }
            } else {
                $('#addNewIncident input[name=lat]').val((d.response.lat != 0 ? d.response.lat : ''));
                $('#addNewIncident input[name=lon]').val((d.response.lon != 0 ? d.response.lon : ''));
            }

            $('#addNewIncident input[name=t]').val(d.response.details.t);
            $('#addNewIncident input[name=r]').val(d.response.details.r);
            $('#addNewIncident input[name=s]').val(d.response.details.s);
            $('#addNewIncident input[name=ss]').val(d.response.details.ss);
            $('#addNewIncident select[name=zone] option').each(function () {
                if (d.response.zone == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            if (d.response.details.county != null) {
                $('#addNewIncident select[name=county]').append('<option value="' + d.response.details.county + '">' + d.response.details.county + '</option>');
            }
            if (d.response.details.state != null) {
                $('#addNewIncident select[name=state]').append('<option value="' + d.response.details.state + '">' + d.response.details.state + '</option>');
            }
            $('#addNewIncident input[name=location]').val(d.response.details.location);
            $('#addNewIncident input[name=initial_acres]').val(d.response.details.initial_acres);
            $('#addNewIncident input[name=current_acres]').val(d.response.details.current_acres);
            $('#addNewIncident textarea[name=notes]').val(d.response.details.notes);
            $('#addNewIncident select[name=wind_dir] option').each(function () {
                if (d.response.details.wind_dir == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            $('#addNewIncident select[name=wind_spd] option').each(function () {
                if (d.response.details.wind_spd == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            $('#addNewIncident select[name=aspect] option').each(function () {
                if (d.response.details.aspect == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            $('#addNewIncident select[name=slope] option').each(function () {
                if (d.response.details.slope == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            $('#addNewIncident input[name=control_date]').val((d.response.details.control_date ? d.response.details.control_date : ''));
            $('#addNewIncident input[name=control_time]').val((d.response.details.control_time ? d.response.details.control_time : ''));
            $('#addNewIncident input[name=contain_date]').val((d.response.details.contain_date ? d.response.details.contain_date : ''));
            $('#addNewIncident input[name=contain_time]').val((d.response.details.contain_time ? d.response.details.contain_time : ''));
            $('#addNewIncident input[name=out_date]').val((d.response.details.out_date ? d.response.details.out_date : ''));
            $('#addNewIncident input[name=out_time]').val((d.response.details.out_time ? d.response.details.out_time : ''));

            if (d.response.type == 'Law Enforcement') {
                $('#addNewIncident input[name=rp]').prop('disabled', true);
                $('#addNewIncident input[name^=rp_phone]').eq(0).prop('disabled', true);
                $('#addNewIncident input[name^=rp_phone]').eq(1).prop('disabled', true);
            } else {
                $('#addNewIncident input[name=rp]').val(d.response.details.rp);
                $('#addNewIncident input[name^=rp_phone]').eq(0).val(d.response.details.rp_phone[0]);
                $('#addNewIncident input[name^=rp_phone]').eq(1).val(d.response.details.rp_phone[1]);
            }

            $('#addNewIncident input[name=ic]').val(d.response.details.ic);
            $('#addNewIncident input[name=ic_notes]').val(d.response.details.ic_notes);

            if (d.response.details.ict == 1) {
                $('#addNewIncident input[name=ict][value=1]').prop('checked', true);
                $('#addNewIncident input[name=ict][value=0]').prop('checked', false);
            } else {
                $('#addNewIncident input[name=ict][value=0]').prop('checked', true);
                $('#addNewIncident input[name=ict][value=1]').prop('checked', false);
            }

            $('#addNewIncident select[name=status] option').each(function () {
                if (d.response.status == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#addNewIncident select[name=calltaker] option').each(function () {
                if (d.response.calltaker == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#addNewIncident select[name=priUnit] option').each(function () {
                if (d.response.details.primaryUnit == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#addNewIncident select[name=dispatcher] option').each(function () {
                if (d.response.dispatcher == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });

            /* deal with the causes of the fire */
            $('#addNewIncident select[name=cause] option').each(function () {
                if (d.response.details.cause == $(this).val()) {
                    $(this).prop('selected', 'selected');
                }
            });
            if (d.response.details.cause == 'Human') {
                $('select[name=gen_cause]').find('option').remove().end().append('<option>- General -</option>');
                $('select[name=spec_cause]').find('option').remove().end().append('<option>- Specific -</option>');
                incidentOptions.causes.general.human.forEach(function (v) {
                    $('select[name=gen_cause]').append('<option ' + (d.response.details.gen_cause == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>').prop('disabled', false);
                });
                if (!d.response.details.gen_cause) {
                    $('select[name=gen_cause]').find('option[value=Undetermined]').prop('selected', 'selected');
                }
                incidentOptions.causes.specific.forEach(function (v) {
                    $('select[name=spec_cause]').append('<option ' + (d.response.details.spec_cause == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>').prop('disabled', false);
                });
                if (!d.response.details.spec_cause) {
                    $('select[name=spec_cause]').find('option[value="Under Investigation"]').prop('selected', 'selected');
                }
            } else if (d.response.details.cause == 'Natural') {
                $('select[name=gen_cause]').find('option').remove().end().append('<option>- General -</option>');
                $('select[name=spec_cause]').find('option').remove().end().append('<option>- Specific -</option>').prop('disabled', true);
                incidentOptions.causes.general.natural.forEach(function (v) {
                    $('select[name=gen_cause]').append('<option ' + (d.response.details.gen_cause == v ? 'selected ' : '') + 'value="' + v + '">' + v + '</option>').prop('disabled', false);
                });
            } else {
                $('select[name=gen_cause]').find('option').remove().end().append('<option>- General -</option>').prop('disabled', true);
                $('select[name=spec_cause]').find('option').remove().end().append('<option>- Specific -</option>').prop('disabled', true);
            }
        }
    });
}

$(document).ready(function () {
    loadIncForms();

    if (mode == 'edit') {
        editIncident();
    } else {
        $('#addNewIncident').prepend('<input type="hidden" name="id" value="' + nid + '">');
        $('#addNewIncident input[name=num]').val(nin.padStart(3, '0'));
        $('#addNewIncident input[name=name]').val('Incident ' + nin.padStart(3, '0').toString());

        opener.$('.resources #unit').each(function () {
            if ($(this).attr('data-unit') != undefined) {
                if ($(this).attr('data-status') != 'ous' && $(this).attr('data-status') != 'com' && $(this).attr('data-status') != 'asgn' && $(this).attr('data-status') != '') {
                    $('#addNewIncident select[name=priUnit]').append('<option value="' + $(this).attr('data-unit') + '">' + $(this).attr('data-unit') + '</option>');
                }
            }
        });

        if ($('input[name=lat]').val() != '' && $('input[name=lon]').val() != '') {
            getGeoData($('input[name=lat').val(), $('input[name=lon').val());
        }
    }

    /* various incident form controls */
    if ($('input[name=coord_type]').val() == 'dec' || $('input[name=coord_type]').val() == '') {
        $(document).on('blur', 'input[name=lat]', function () {
            if ($(this).val() != '' && $('input[name=lon]').val() != '') {
                getGeoData($(this).val(), $('input[name=lon').val());
                $('select[name=status]').find('option[value=1]').prop('selected', 'selected');
            } else {
                $('select[name=status]').find('option[value=2]').prop('selected', 'selected');
                $('select[name=state]').find('option').remove().end();
                $('select[name=county]').find('option').remove().end();
            }
        });

        $(document).on('blur', 'input[name=lon]', function () {
            if ($(this).val() != '' && $('input[name=lat]').val() != '') {
                getGeoData($('input[name=lat').val(), $(this).val());
                $('select[name=status]').find('option[value=1]').prop('selected', 'selected');
            } else {
                $('select[name=status]').find('option[value=2]').prop('selected', 'selected');
                $('select[name=state]').find('option').remove().end();
                $('select[name=county]').find('option').remove().end();
            }
        });
    } else if ($('input[name=coord_type]').val() == 'dms') {
        $(document).on('blur', 'input[name=latsec]', function () {
            if ($(this).val() != '') {
                var dd1 = degToDec($('input[name=latdeg').val(), $('input[name=latmin').val(), $('input[name=latsec').val()),
                    dd2 = degToDec($('input[name=londeg').val(), $('input[name=lonmin').val(), $('input[name=lonsec').val());
                
                getGeoData(dd1, dd2);
                $('select[name=status]').find('option[value=1]').prop('selected', 'selected');
                $('input[name=lat]').val(dd1);
                $('input[name=lon]').val(dd2);
            } else {
                $('select[name=status]').find('option[value=2]').prop('selected', 'selected');
                $('select[name=state]').find('option').remove().end();
                $('select[name=county]').find('option').remove().end();
            }
        });

        $(document).on('blur', 'input[name=lonsec]', function () {
            if ($(this).val() != '') {
                var dd1 = degToDec($('input[name=latdeg').val(), $('input[name=latmin').val(), $('input[name=latsec').val()),
                    dd2 = degToDec($('input[name=londeg').val(), $('input[name=lonmin').val(), $('input[name=lonsec').val());
                
                getGeoData(dd1, dd2);
                $('select[name=status]').find('option[value=1]').prop('selected', 'selected');
                $('input[name=lat]').val(dd1);
                $('input[name=lon]').val(dd2);
            } else {
                $('select[name=status]').find('option[value=2]').prop('selected', 'selected');
                $('select[name=state]').find('option').remove().end();
                $('select[name=county]').find('option').remove().end();
            }
        });
    }

    $(document).on('blur', 'input[name=location]', function () {
        if ($(this).val()) {
            $('select[name=status]').find('option[value=1]').prop('selected', 'selected');
        }
    });

    $(document).on('focus', 'input[name=datetime]', function () {
        setNowDate($(this));
    });

    $(document).on('change', 'select[name=cause]', function () {
        var w = $(this).find('option:selected').val();
        if (w == 'Human') {
            $('select[name=gen_cause]').find('option').remove().end().append('<option>- General -</option>');
            $('select[name=spec_cause]').find('option').remove().end().append('<option>- Specific -</option>');
            incidentOptions.causes.general.human.forEach(function (v) {
                $('select[name=gen_cause]').append('<option value="' + v + '">' + v + '</option>').prop('disabled', false);
            });
            $('select[name=gen_cause]').find('option[value=Undetermined]').prop('selected', 'selected');
            incidentOptions.causes.specific.forEach(function (v) {
                $('select[name=spec_cause]').append('<option value="' + v + '">' + v + '</option>').prop('disabled', false);
            });
            $('select[name=spec_cause]').find('option[value="Under Investigation"]').prop('selected', 'selected');
        } else if (w == 'Natural') {
            $('select[name=gen_cause]').find('option').remove().end().append('<option>- General -</option>');
            $('select[name=spec_cause]').find('option').remove().end().append('<option>- Specific -</option>').prop('disabled', true);
            incidentOptions.causes.general.natural.forEach(function (v) {
                $('select[name=gen_cause]').append('<option value="' + v + '">' + v + '</option>').prop('disabled', false);
            });
        } else {
            $('select[name=gen_cause]').find('option').remove().end().append('<option>- General -</option>').prop('disabled', true);
            $('select[name=spec_cause]').find('option').remove().end().append('<option>- Specific -</option>').prop('disabled', true);
        }
    });

    $(document).on('change', 'select[name=gen_cause]', function () {
        if ($(this).find('option:selected').val() == 'Undetermined') {
            $('select[name=spec_cause]').find('option[value="Under Investigation"]').prop('selected', 'selected');
        }
    });

    $(document).on('change', '#addNewIncident select[name=type]', function () {
        if ($(this).find('option:selected').val() == 'Law Enforcement') {
            setNowDate($('input[name=datetime]'));

            $('#addNewIncident input[name=name]').val($('#addNewIncident input[name=name]').val().replace('Incident ', 'Law Enf '));
            $('#addNewIncident input[name=initial_acres]').prop('disabled', true);
            $('#addNewIncident input[name=current_acres]').prop('disabled', true);
            $('#addNewIncident #fueltitle').html('');
            $('#addNewIncident input[name^=fuels]').parent().hide();
            $('#addNewIncident input[name^=rp]').prop('disabled', true);
            $('#addNewIncident #incdet').hide();
            $('#addNewIncident #tbr').hide();

            $('.tab-nav ul li[data-tab=tab2]').hide();                
            $('.tab-nav ul li[data-tab=tab3]').hide();
            $('#fiinc').hide();
        } else {
            $('#addNewIncident input[name=name]').val($('#addNewIncident input[name=name]').val().replace('Law Enf ', 'Incident '));
            $('#addNewIncident input[name=datetime').attr('type', 'text').val('');
            $('#addNewIncident input[name=initial_acres]').prop('disabled', false);
            $('#addNewIncident input[name=current_acres]').prop('disabled', false);
            $('#addNewIncident #fueltitle').html('Fuels');
            $('#addNewIncident input[name^=fuels]').parent().show();
            $('#addNewIncident input[name^=rp]').prop('disabled', false);
            $('#addNewIncident #incdet').show();
            $('#addNewIncident #tbr').show();

            $('.tab-nav ul li[data-tab=tab2]').show();                
            $('.tab-nav ul li[data-tab=tab3]').show();
            $('#fiinc').show();
        }
    });

    $(document).on('submit', 'form#addNewIncident', function (e) {
        e.preventDefault();
        var b = $(this);

        if (!$('input[name=lat]').val() && !$('input[name=lon]').val() && !$('input[name=location]').val()) {
            opener.displayMsg('error', 'You must specify incident coordinates or a textual location');
        } else if (!$('input[name=lat]').val() && $('input[name=lon]').val()) {
            opener.displayMsg('error', 'You must specify a latitude');
        } else if ($('input[name=lat]').val() && !$('input[name=lon]').val()) {
            opener.displayMsg('error', 'You must specify a longitude');
        } else if (!$('input[name=num]').val()) {
            opener.displayMsg('error', 'You must specify an incident number');
        } else if (!$('input[name=datetime]').val()) {
            opener.displayMsg('error', 'You must enter the incident start date/time');
        } else {
            b.val('Saving...');

            $.ajax({
                url: api('forms', 'incident'),
                method: 'POST',
                data: $(this).serialize(),
                success: function (r) {
                    b.val('Save Incident');

                    if (r.return.response.error == 'name') {
                        opener.displayMsg('error', 'An incident with this name already exists.');
                    } else if (r.return.response.success == 1) {
                        opener.displayMsg('success', 'Incident was successfully saved' + (r.return.response.statusChanged == 1 ? ' and status was changed' : ''));
                        opener.getIncidents();
                        opener.getResources();
                        opener.getLog();
                        window.close();
                    }
                }
            });
        }
    });

    /* cancels the selected incident if added by accident or for another reason not related to being a "false alarm" */
    $(document).on('click', '[id=cancelIncident]', function (e) {
        var id = $(this).parent().parent().parent().find('input[name=id]').val();

        if ($('input[name=oldjuris]').val()) {
            window.close();
        } else {
            var inc = $('select[name=juris]').find('option:selected').val() + '-' + $('input[name=num]').val(),
                ver = confirm('Are you sure you want to void Incident ' + inc + '?');

            /* delete incident number and put it back into the rotation */
            if (ver === true) {
                $.ajax({
                    url: api(app, 'cancel'),
                    method: 'POST',
                    data: {
                        id: id,
                        num: inc
                    },
                    dataType: 'json',
                    success: function (r) {
                        if (r.response.success == 1) {
                            window.close();
                            opener.displayMsg('success', 'Incident ' + inc + ' was successfully voided');
                        }
                    }
                });
            }
        }
    });
});