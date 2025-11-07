function nbmTime(t) {
    var a = new Date(t);
    return (a.getHours() == 1 ? months[a.getMonth()] + ' ' + a.getDate() + ' / ' : '') +
        (a.getHours() == 0 ? '12' : (a.getHours() > 12 ? a.getHours() - 12 : a.getHours())) + ' ' +
        (a.getHours() > 12 ? 'P' : 'A') + 'M';
}

async function doNBM(a = null, b = null, stn = null) {
    document.querySelector('.chart-wrapper').innerHTML = '<p style="text-align:center;color:#a9a9a9;margin:10px;font-size:14px">The <a target="blank" href="https://blend.mdl.nws.noaa.gov/">NBM</a> ensemble forecast, with temperatures within one standard deviation of the mean forecasted temperature, and relative humidities. A closer spread imputes more confidence in the forecast.</p><canvas id="chart" style="width:100%;height:400px"></canvas>';

    if (typeof (Chart) === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/chart.js@' + chartJSVersion + '/dist/chart.umd.min.js')
            .then(() => {
                getNBM(a, b, stn);
            });
    } else {
        getNBM(a, b, stn);
    }
}

async function getNBM(a, b, stn) {
    let ctx = document.querySelector('#chart'),
        fd = new FormData(),
        isNull = false,
        dataTemp,
        dataTempMin,
        dataTempMax,
        dataRH,
        ts = [],
        tv = (settings.weather && settings.weather.temp ? settings.weather.temp : 'f'),
        wv = (settings.weather && settings.weather.wind != 'mph' ? settings.weather.wind : 'mph');

    if (stn != null) {
        fd.append('stn', stn);
    } else {
        fd.append('lat', a);
        fd.append('lon', b);
    }
    fd.append('tu', tv);
    fd.append('wu', wv);

    await fetch(apiUrl('nbm', 2), {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const api = await resp.json();

        if (api.nbm.data == null) {
            isNull = true;
        } else {
            let a = [],
                b = [],
                c = [],
                d = [];

            for (var i = 0; i < (api.nbm.data.temp.length > 48 ? 48 : api.nbm.data.temp.length); i++) {
                a.push(api.nbm.data.temp[i].value.toFixed(1));
                b.push(api.nbm.data.temp[i].min.toFixed(1));
                c.push(api.nbm.data.temp[i].max.toFixed(1));
                d.push(Math.round(api.nbm.data.rh[i].value));
                ts.push(nbmTime(api.nbm.data.time[i] * 1000));
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
    }).then(() => {
        if (isNull) {
            document.querySelector('#chart').remove();
            document.querySelector('.chart-wrapper').style.minHeight = 'unset';
            document.querySelector('.chart-wrapper').insertAdjacentHTML('beforeend', '<p class="message error" style="max-width:100%;text-align:center">NBM model data is unavailable right now, please try loading again later.</p>');
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
    });
}