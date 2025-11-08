var c = '',
    arr = [],
    opener = window.opener;

$(document).ready(function () {
    opener.$('.resources #unit').each(function () {
        if ($(this).hasClass('header') === false) {
            var score = 0,
                unit = $(this).attr('data-unit'),
                s = $(this).attr('data-status'),
                inc = $(this).attr('data-inc'),
                ia = $(this).attr('data-ia'),
                zone = $(this).attr('data-zone'),
                type = $(this).attr('data-type');

            if (ia == 1) {
                if (z == zone) {
                    score += 5;
                }

                if (type == 'Engine') {
                    score += 5;
                } else if (type == 'Hand Crew') {
                    score += 4;
                }

                if (s == 'ava' || s == 'not') {
                    score += 10;
                } else if (s == 'ins') {
                    score += 8;
                } else if (s == 'lea') {
                    score += 6;
                } else {
                    score += 1;
                }

                if (s != 'ous' && s != 'com' && inc != num) {
                    arr.push({
                        score,
                        unit,
                        type,
                        zone,
                        s
                    });
                }
            }
        }
    });

    var suggested = arr.sort(function (a, b) {
        return b.score > a.score ? 1 : b.score < a.score ? -1 : 0
    });

    suggested.forEach(function (v, l) {
        c += '<div class="row" style="margin:5px 0;font-size:18px"><div class="col w-3">' + v.unit + '</div><div class="col w-2"><span class="truncate" style="display:block;width:85px">' + v.type + '</span></div><div class="col w-3">' + v.zone + '</div><div class="col w-3">' +
            '<span class="status ' + v.s + '" style="width:fit-content">' + opener.unitStatus(v.s) + '</span></div><div class="col w-1"><label class="checkbox" for="assignUnit' + l + '">' +
            '<input type="checkbox" id="assignUnit' + l + '" name="units[]" value="' + v.unit + '"></label></div></div>';
    });

    $('form#assignMultiple').append(c);
});