let lat,
    lon,
    tempUnit,
    windUnit;

const forecastLabels = [
    { label: 'Max Temperature', path: 'maxTemp', format: 'temp' },
    { label: 'Min Temperature', path: 'minTemp', format: 'temp' },
    { label: 'Min Relative Humidity', path: 'rh.min', format: 'rhpct' },
    { label: 'Max Relative Humidity', path: 'rh.max', format: 'rhpct' },
    { label: 'Average Wind Speed', path: 'wind.avg', format: 'mph' },
    { label: 'Max Wind Speed', path: 'wind.max', format: 'mph' },
    { label: 'Max Wind Gust Speed', path: 'wind.gust.speed', format: 'mph' },
    { label: 'Max Wind Gust Time', path: 'wind.gust.time', format: 'date' },
    { label: 'Average POP', path: 'pop.avg', format: 'pct' },
    { label: 'Maximum Sky Cover', path: 'sky.max', format: 'pct' },
    { label: 'Average Sky Cover', path: 'sky.avg', format: 'pct' },
    { label: 'Min Mixing Height', path: 'mixing.min', format: 'ft' },
    { label: 'Max Mixing Height', path: 'mixing.max', format: 'ft' }
],
    tempThresholds = [-60, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 140],
    tempColors = ["#91003f", "#ce1256", "#e7298a", "#df65b0", "#ff73df", "#ffbee8", "#ffffff", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f", "#0d007d", "#0d339c", "#0066c2", "#299eff", "#4ac7ff", "#73d7ff", "#adffff", "#30cfc2", "#009996", "#125757", "#066d2c", "#31a354", "#74c476", "#a1d99b", "#d3ffbe", "#ffffb3", "#ffeda0", "#fed176", "#feae2a", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026", "#800026", "#590042", "#280028"],
    rhThresholds = [0.1, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100],
    rhColors = ["#aaaaaa", "#910022", "#a61122", "#bd2e24", "#d44e33", "#e36d42", "#fa8f43", "#fcad58", "#fed884", "#fff2aa", "#e6f49d", "#bce378", "#71b55c", "#26914b", "#00572e"],
    wx = {
        location: null,
        elevation: null,
        dates: [],
        minTemp: [],
        maxTemp: [],
        rh: {
            min: [],
            max: []
        },
        wind: {
            avg: [],
            max: [],
            gust: {
                time: [],
                dir: [],
                speed: []
            }
        },
        mixing: {
            min: [],
            max: []
        },
        pop: {
            avg: []
        },
        sky: {
            avg: [],
            min: [],
            max: []
        }
    };

function getCompassDirection(b) {
    var d,
        b = Math.round(b / 22.5);

    switch (b) {
        case 1:
            d = "NNE";
            break;
        case 2:
            d = "NE";
            break;
        case 3:
            d = "ENE";
            break;
        case 4:
            d = "E";
            break;
        case 5:
            d = "ESE";
            break;
        case 6:
            d = "SE";
            break;
        case 7:
            d = "SSE";
            break;
        case 8:
            d = "S";
            break;
        case 9:
            d = "SSW";
            break;
        case 10:
            d = "SW";
            break;
        case 11:
            d = "WSW";
            break;
        case 12:
            d = "W";
            break;
        case 13:
            d = "WNW";
            break;
        case 14:
            d = "NW";
            break;
        case 15:
            d = "NNW";
            break;
        default:
            d = "N";
    }
    return d;
}

function average(arr) {
    let total = 0;

    arr.forEach((v) => {
        total += v;
    });

    return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(total / arr.length);
}

async function getWeather(json) {
    let error = false;

    try {
        wx.location = getLocation(json.relativeLocation.properties);

        const response = await fetch(json.forecastGridData);

        if (!response.ok) {
            console.error('There is an error getting FWF', error);
            error = true;
        }

        const responseData = await response.json();
        const ob = responseData.properties;

        wx.elevation = Math.round(ob.elevation.value * 3.281);

        ob.maxTemperature.values.forEach((t) => {
            wx.dates.push(new Date(t.validTime.split('/')[0]).getTime());
            wx.maxTemp.push(Math.round(((9 / 5) * t.value) + 32));
        });

        ob.minTemperature.values.forEach((t) => {
            wx.minTemp.push(Math.round(((9 / 5) * t.value) + 32));
        });

        wx.dates.forEach((day) => {
            const date = new Date(day).getDate(),
                rhum = [],
                spd = [],
                gust = [],
                gustTime = [],
                mh = [],
                cov = [],
                pop = [];

            ob.relativeHumidity.values.forEach((rh) => {
                const d = new Date(rh.validTime.split('/')[0]).getDate();

                if (d == date) {
                    rhum.push(rh.value);
                }
            });

            ob.windSpeed.values.forEach((s) => {
                const d = new Date(s.validTime.split('/')[0]).getDate();

                if (d == date) {
                    spd.push(s.value / 1.609);
                }
            });

            ob.windGust.values.forEach((s) => {
                const d = new Date(s.validTime.split('/')[0]);

                if (d.getDate() == date) {
                    gust.push(s.value / 1.609);
                    gustTime.push(d.getTime());
                }
            });

            ob.mixingHeight.values.forEach((s) => {
                const d = new Date(s.validTime.split('/')[0]);

                if (d.getDate() == date) {
                    mh.push(s.value * 3.281);
                }
            });

            ob.skyCover.values.forEach((s) => {
                const d = new Date(s.validTime.split('/')[0]);

                if (d.getDate() == date) {
                    cov.push(s.value);
                }
            });

            ob.probabilityOfPrecipitation.values.forEach((s) => {
                const d = new Date(s.validTime.split('/')[0]);

                if (d.getDate() == date) {
                    pop.push(s.value);
                }
            });

            const gi = gust.indexOf(Math.max.apply(null, gust));

            wx.rh.min.push(Math.min.apply(null, rhum));
            wx.rh.max.push(Math.max.apply(null, rhum));
            wx.wind.max.push(Math.round(Math.max.apply(null, spd)));
            wx.wind.avg.push(average(spd));
            wx.wind.gust.speed.push(Math.round(Math.max.apply(null, gust)));
            wx.wind.gust.time.push(gustTime[gi]);
            wx.mixing.min.push(Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.min.apply(null, mh)));
            wx.mixing.max.push(Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max.apply(null, mh)));
            wx.pop.avg.push(average(pop));
            wx.sky.min.push(Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.min.apply(null, cov)));
            wx.sky.avg.push(average(cov));
            wx.sky.max.push(Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max.apply(null, cov)));
        });

        return error ? null : wx;
    } catch (error) {
        console.error('There is an error getting FWF', error);
        return null;
    }
}

function getLocation(data) {
    const total = (data.distance.value / 1609).toFixed(1).toString(),
        dist = total.substring(total.length - 1) == '0' ? total.split('.')[0] : total;

    return dist + ' mile' + (dist == '1' ? '' : 's') + ' ' + getCompassDirection(data.bearing.value) + ' of ' + data.city + ', ' + data.state;
}

function getNestedValue(obj, path) {
    // Safely gets a nested value from an object using a dot-separated path string
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function temp(v) {
    if (tempUnit == 'c') {
        return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format((v - 32) * (5 / 9));
    } else {
        return v;
    }
}

function speed(v) {
    if (windUnit == 'm/s') {
        return Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(v / 2.237);
    } else if (windUnit == 'kts') {
        return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v / 1.151);
    } else if (windUnit == 'km/h') {
        return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v * 1.609);
    } else {
        return v;
    }
}

function hexToRgba(hex, alpha) {
    if (!hex || hex === 'transparent') {
        return `rgba(0,0,0,${alpha})`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getColor(value, thresholds, colors) {
    if (value === null || value === undefined) {
        return 'unset';
    }

    for (let i = 0; i < thresholds.length; i++) {
        if (value <= thresholds[i] || i === thresholds.length - 1) {
            return hexToRgba(colors[i], 0.35);
        }
    }

    return hexToRgba(colors[colors.length - 1], 0.35);
}

function createForecastTable(data, numDays = 5) {
    let html = '<table class="forecast-table">';

    html += '<thead><tr>';
    html += '<th></th>';

    const displayDates = data.dates.slice(0, numDays);
    displayDates.forEach(timestamp => {
        const date = new Date(timestamp);
        html += `<th>${date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })}</th>`;
    });

    html += '</tr></thead><tbody>';

    forecastLabels.forEach(item => {
        html += '<tr>';
        html += `<td class="row-label">${item.label}</td>`;

        const values = getNestedValue(data, item.path);

        if (Array.isArray(values)) {
            const displayValues = values.slice(0, numDays);

            displayValues.forEach(value => {
                let displayValue,
                    style = '';

                if (value === null || value === undefined || value == '∞' || value == '-∞' || isNaN(value)) {
                    displayValue = '--';
                } else if (item.format === 'date') {
                    const date = new Date(value);
                    displayValue = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                } else if (item.format === 'temp') {
                    displayValue = temp(value) + '&deg;' + (tempUnit == 'f' ? 'F' : 'C');
                    style = ' style="background-color:' + getColor(value, tempThresholds, tempColors) + '"';
                } else if (item.format === 'pct' || item.format === 'rhpct') {
                    displayValue = value + '%';

                    if (item.format == 'rhpct') {
                        style = ' style="background-color:' + getColor(value, rhThresholds, rhColors) + '"';
                    }
                } else if (item.format === 'mph') {
                    displayValue = speed(value) + ' ' + windUnit;
                } else if (item.format === 'ft') {
                    displayValue = value + ' ft.';
                } else {
                    displayValue = value;
                }

                html += `<td${style}>${displayValue}</td>`;
            });
        } else {
            for (let i = 0; i < numDays; i++) {
                html += `<td>--</td>`;
            }
        }
        html += '</tr>';
    });

    html += '</tbody></table>';

    return html;
}

self.onmessage = async (e) => {
    lat = e.data.lat;
    lon = e.data.lon;
    tempUnit = e.data.units.temp;
    windUnit = e.data.units.wind;

    try {
        await fetch('https://api.weather.gov/points/' + lat.toFixed(4) + ',' + lon.toFixed(4))
            .then(async (response) => {
                const json = await response.json();

                if (json) {
                    let content = '';
                    const data = await getWeather(json.properties);

                    if (data == null) {
                        content = '<div style="display:block;text-align:center"><div class="message error">We were unable to get a fire weather forecast for this location. Please try again.</div></div>';
                    } else {
                        const table = createForecastTable(data, 5);

                        content = `<div class="container"><h1 class="title">Fire Weather Forecast</h1>
                            <div class="row geo">
                                <div class="col fit">
                                    <i class="fas fa-location-dot" style="font-size:25px"></i>
                                </div>
                                <div class="col" id="a" style="flex:1;line-height:1.3">
                                    Forecast for ${data.location} at ${Intl.NumberFormat().format(data.elevation)} ft.
                                </div>
                            </div>
                            <div class="forecast-table-wrapper">${table}</div>
                        </div>`;
                    }

                    self.postMessage(content);
                } else {
                    self.postMessage(null);
                }
            });
    } catch (error) {
        console.error('There is an error generating a FWF', error);

        self.postMessage({
            success: false
        });
    }
};