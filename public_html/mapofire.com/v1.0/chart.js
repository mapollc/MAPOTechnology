function nbmTime(t) {
    var a = new Date(t);
    return (a.getHours() == 1 ? months[a.getMonth()] + ' ' + a.getDate() + ' / ' : '') +
        (a.getHours() == 0 ? '12' : (a.getHours() > 12 ? a.getHours() - 12 : a.getHours())) + ' ' +
        (a.getHours() > 12 ? 'P' : 'A') + 'M';
}

function doNBM(a = null, b = null, stn = null) {
    console.log(a + ', ' + b);
    var isNull = false;
    $('.chart-wrapper').html('<p style="text-align:center;color:#a9a9a9;margin:10px;font-size:14px">The <a target="blank" href="https://blend.mdl.nws.noaa.gov/">NBM</a> ensemble forecast, with temperatures within +/- one standard deviation of the mean forecasted temperature and relative humidities. A closer spread imputes more confidence in the forecast.</p><canvas id="chart" style="width:100%;height:400px"></canvas>');

    $.getScript('https://cdn.jsdelivr.net/npm/chart.js@' + chartJSVersion + '/dist/chart.umd.min.js', function () {
        var ctx = $('#chart'),
            dataTemp,
            dataTempMin,
            dataTempMax,
            dataRH,
            ts = [],
            tv = (settings.weather && settings.weather.temp ? settings.weather.temp : 'f'),
            wv = (settings.weather && settings.weather.wind != 'mph' ? settings.weather.wind : 'mph');

        $.ajax({
            url: apiUrl('nbm', 2),
            method: 'POST',
            data: {
                stn: stn,
                lat: a,
                lon: b,
                tu: tv,
                wu: wv
            },
            dataType: 'json',
            success: function (api) {
                if (api.nbm.data == null) {
                    isNull = true;
                } else {
                    var a = [],
                        b = [],
                        c = [],
                        d = [];

                    for (var i = 0; i < 48; i++) {
                        a.push(api.nbm.data[i].temp[1]);
                        b.push(api.nbm.data[i].temp[0]);
                        c.push(api.nbm.data[i].temp[2]);
                        d.push(api.nbm.data[i].rh);
                        ts.push(nbmTime(api.nbm.data[i].label * 1000));
                    }

                    dataTemp = {
                        label: 'Mean Temp',
                        data: a,
                        fill: +1,
                        borderColor: 'red',
                        backgroundColor: 'rgb(255 0 0 / 20%)',
                        tension: 0.1,
                        pointRadius: 2,
                        yAxisID: 'y'
                    };

                    dataTempMin = {
                        label: '-1 Std Dev',
                        data: b,
                        fill: -1,
                        borderColor: 'rgb(255 0 0 / 20%)',
                        backgroundColor: 'rgb(255 0 0 / 20%)',
                        tension: 0.1,
                        pointRadius: 0,
                        yAxisID: 'y'
                    };

                    dataTempMax = {
                        label: '+1 Std Dev',
                        data: c,
                        fill: 0,
                        borderColor: 'rgb(255 0 0 / 20%)',
                        backgroundColor: 'rgb(255 0 0 / 20%)',
                        tension: 0.1,
                        pointRadius: 0,
                        yAxisID: 'y'
                    };

                    dataRH = {
                        label: 'Humidity',
                        data: d,
                        fill: -1,
                        borderColor: 'green',
                        tension: 0.1,
                        pointRadius: 2,
                        yAxisID: 'y1'
                    };
                }
            },
            complete: function () {
                if (isNull) {
                    $('#chart').remove();
                    $('.chart-wrapper').css('min-height', 'unset').append('<p class="message error" style="max-width:100%;text-align:center">NBM model data is unavailable right now, please try loading again later.</p>');
                } else {
                    var dsets = [dataTempMin, dataTemp, dataTempMax, dataRH];

                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ts,
                            datasets: dsets
                        },
                        options: {   
                            responsive: true,
                            maintainAspectRatio: true,                     
                            interaction: {
                                mode: 'index',
                                intersect: false
                            },
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Forecast Hour'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Temperature'
                                    },
                                    position: 'left',
                                    /*suggestedMin: Math.min.apply(null, dataTempMin.data),
                                    suggestedMax: Math.max.apply(null, dataTempMax.data),*/
                                    stacked: false,
                                    ticks: {
                                        callback: function (value) {
                                            return value + '°' + (tv == 'f' ? 'F' : 'C');
                                        }
                                    }
                                },
                                y1: {
                                    title: {
                                        display: true,
                                        text: 'Relative Humidity'
                                    },
                                    min: 0,
                                    max: 100,
                                    position: 'right',
                                    grid: {
                                        drawOnChartArea: false,
                                    },
                                    stacked: false,
                                    ticks: {
                                        callback: function (value) {
                                            return value + '%';
                                        }
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                },
                                filler: {
                                    propagate: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            return context.dataset.label + ': ' + context.parsed.y + (context.dataset.label == 'Humidity' ? '%' : '°' + (tv == 'f' ? 'F' : 'C'));
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        });
    });
}