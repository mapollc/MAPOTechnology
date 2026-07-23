let lat, lon, tempUnit, windUnit;

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

const forecastLabels = [
    { label: 'Max Temperature', path: 'maxTemp', format: 'temp' },
    { label: 'Min Temperature', path: 'minTemp', format: 'temp' },
    { label: 'Min Relative Humidity', path: 'rh.min', format: 'rhpct' },
    { label: 'Max Relative Humidity', path: 'rh.max', format: 'rhpct' },
    { label: 'Average Wind Speed', path: 'wind.avg', format: 'mph' },
    { label: 'Avg. Transport Winds', path: 'wind.transport.avg', format: 'mph' },
    { label: 'Max Wind Speed', path: 'wind.max', format: 'mph' },
    { label: 'Max Wind Gust Speed', path: 'wind.gust.speed', format: 'mph' },
    { label: 'Max Wind Gust Time', path: 'wind.gust.time', format: 'date' },
    { label: 'Average POP', path: 'pop.avg', format: 'pct' },
    { label: 'Maximum Sky Cover', path: 'sky.max', format: 'pct' },
    { label: 'Average Sky Cover', path: 'sky.avg', format: 'pct' },
    { label: 'Min Mixing Height', path: 'mixing.min', format: 'ft' },
    { label: 'Max Mixing Height', path: 'mixing.max', format: 'ft' }
];

const hourlyLabels = [
    { label: 'Temperature', path: 'temp', format: 'temp' },
    { label: 'Relative Humidity', path: 'rh', format: 'rhpct' },
    { label: 'Wind Direction', path: 'winds.dir', format: 'dir' },
    { label: 'Wind Speed', path: 'winds.speed', format: 'mph' },
    { label: 'Wind Gusts', path: 'winds.gust', format: 'mph' },
    { label: 'Transport Winds', path: 'winds.transport', format: 'mph' }
];

const formatters = {
    temp: (v) => temp(v) + '°' + (tempUnit === 'f' ? 'F' : 'C'),
    pct: (v) => v + '%',
    rhpct: (v) => v + '%',
    mph: (v) => speed(v) + ' ' + windUnit,
    ft: (v) => v + ' ft.',
    date: (v) => new Date(v).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    dir: (v) => `<span class="wind-dir ttip" data-tooltip="${getCompassDirection(v)}" style="transform:rotate(${(Number(-45 + v) + 180) % 360}deg)"></span>`,
    default: (v) => v
};

const colorScales = {
    temp: {
        thresh: [-60, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 140],
        colors: ["#91003f", "#ce1256", "#e7298a", "#df65b0", "#ff73df", "#ffbee8", "#ffffff", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f", "#0d007d", "#0d339c", "#0066c2", "#299eff", "#4ac7ff", "#73d7ff", "#adffff", "#30cfc2", "#009996", "#125757", "#066d2c", "#31a354", "#74c476", "#a1d99b", "#d3ffbe", "#ffffb3", "#ffeda0", "#fed176", "#feae2a", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026", "#800026", "#590042", "#280028"]
    },
    rh: {
        thresh: [0.1, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100],
        colors: ["#aaaaaa", "#910022", "#a61122", "#bd2e24", "#d44e33", "#e36d42", "#fa8f43", "#fcad58", "#fed884", "#fff2aa", "#e6f49d", "#bce378", "#71b55c", "#26914b", "#00572e"]
    },
    wind: {
        thresh: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 100, 120, 140],
        colors: ["#103F78", "#225EA8", "#1D91C0", "#41B6C4", "#7FCDBB", "#B4D79E", "#DFFF9E", "#FFFFA6", "#FFE873", "#FFC400", "#FFAA00", "#FF5900", "#FF0000", "#A80000", "#6E0000", "#FFBEE8", "#FF73DF"]
    }
};

const wx = {
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
        transport: {
            avg: []
        },
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
    },
    vent: []
};

const hourly = {
    time: [],
    temp: [],
    rh: [],
    winds: {
        transport: [],
        speed: [],
        gust: [],
        dir: []
    }
};

function getCompassDirection(bearing) {
    const dir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dir[Math.round(bearing / 22.5) % 16];
}

function average(arr) {
    return nf0.format(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function getLocation(data) {
    const miles = Number((data.distance.value / 1609).toFixed(1));
    const direction = getCompassDirection(data.bearing.value);

    return `${miles} mile${miles === 1 ? '' : 's'} ${direction} of ${data.city}, ${data.state}`;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const temp = (v) => tempUnit == 'c' ? nf0.format((v - 32) * (5 / 9)) : v;
const cToF = (t) => Math.round(((9 / 5) * t) + 32);
const kphToMph = (v) => nf0.format(v / 1.609);

function speed(v) {
    if (windUnit == 'm/s') {
        return nf1.format(v / 2.237);
    } else if (windUnit == 'kts') {
        return nf0.format(v / 1.151);
    } else if (windUnit == 'km/h') {
        return nf0.format(v * 1.609);
    } else {
        return v;
    }
}

function getTextColor(color) {
    if (!color || color === "transparent") return "#000";

    const m = color.match(/rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/);
    if (!m) return "#000";

    const r = parseInt(m[1], 10) / 255,
        g = parseInt(m[2], 10) / 255,
        b = parseInt(m[3], 10) / 255,
        toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
        R = toLinear(r),
        G = toLinear(g),
        B = toLinear(b),
        luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    return luminance > 0.5 ? '#2c2c2c' : '#fff';
}

function hexToRgba(hex, alpha) {
    if (!hex || hex === 'transparent') {
        return `rgba(0,0,0,${alpha})`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r} ${g} ${b} / ${alpha * 100}%)`;
}

function getColor(value, obj) {
    if (value === null || value === undefined) return 'unset';

    const thresholds = colorScales[obj]['thresh'];
    const colors = colorScales[obj]['colors'];

    for (let i = 0; i < thresholds.length; i++) {
        if (value <= thresholds[i] || i === thresholds.length - 1) {
            return hexToRgba(colors[i], 0.95);
        }
    }

    return hexToRgba(colors[colors.length - 1], 0.95);
}

function getStyleForFormat(format, value) {
    if (value == null || isNaN(value)) return '';

    let bg;

    switch (format) {
        case 'temp':
            bg = getColor(value, 'temp');
            break;
        case 'rhpct':
            bg = getColor(value, 'rh');
            break;
        case 'mph':
            bg = getColor(value, 'wind');
            break;
        default:
            bg = null;
            return '';
    }

    return `background-color:${bg};color:${getTextColor(bg)}`;
}

async function getWeather(json) {
    let error = false;
    let startTime = null;
    let maxTime = null;

    const getValuesForDate = (values, date, transform = v => v) => {
        return values
            .filter(v => new Date(v.validTime.split('/')[0]).getDate() == date)
            .map(v => transform(v.value, v));
    };

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

        // add list of dates to an array
        wx.dates = ob.maxTemperature.values.map(t => new Date(t.validTime.split('/')[0]).getTime());

        // add list of max temps to an array
        wx.maxTemp = ob.maxTemperature.values.map(t => cToF(t.value));

        // add list of min temps to an array
        wx.minTemp = ob.minTemperature.values.map(t => cToF(t.value));

        ob.temperature.values.forEach((item, i) => {
            const time = new Date(item.validTime.split('/')[0]).getTime();

            if (!startTime && time >= Date.now()) {
                startTime = time;
                maxTime = startTime + 86400000;
            }

            if (!startTime || time > maxTime) return;
            if (time < startTime) return;

            hourly.time.push(new Date(time).getTime());
            hourly.temp.push(cToF(item.value));
            hourly.rh.push(ob.relativeHumidity.values[i]?.value);
            hourly.winds.transport.push(kphToMph(ob.transportWindSpeed.values[i]?.value));
            hourly.winds.speed.push(kphToMph(ob.windSpeed.values[i]?.value));
            hourly.winds.gust.push(kphToMph(ob.windGust.values[i]?.value));
            hourly.winds.dir.push(ob.windDirection.values[i]?.value);
        });

        wx.dates.forEach((day, i) => {
            const date = new Date(day).getDate();
            let rhum = [],
                spd = [],
                trans = [],
                gust = [],
                gustTime = [],
                mh = [],
                cov = [],
                pop = [];

            rhum = getValuesForDate(ob.relativeHumidity.values, date);
            spd = getValuesForDate(ob.windSpeed.values, date, v => v / 1.609);
            trans = getValuesForDate(ob.transportWindSpeed.values, date, v => v / 1.609);
            gust = getValuesForDate(ob.windGust.values, date, v => v / 1.609);
            gustTime = getValuesForDate(
                ob.windGust.values,
                date,
                (v, item) => new Date(item.validTime.split('/')[0]).getTime()
            );
            mh = getValuesForDate(ob.mixingHeight.values, date, v => v * 3.281);
            cov = getValuesForDate(ob.skyCover.values, date);
            pop = getValuesForDate(ob.probabilityOfPrecipitation.values, date);

            const gi = gust.indexOf(Math.max.apply(null, gust));

            wx.rh.min.push(Math.min.apply(null, rhum));
            wx.rh.max.push(Math.max.apply(null, rhum));
            wx.wind.max.push(Math.round(Math.max.apply(null, spd)));
            wx.wind.avg.push(average(spd));
            wx.wind.transport.avg.push(average(trans));
            wx.wind.gust.speed.push(Math.round(Math.max.apply(null, gust)));
            wx.wind.gust.time.push(gustTime[gi]);
            wx.mixing.min.push(nf0.format(Math.min.apply(null, mh)));
            wx.mixing.max.push(nf0.format(Math.max.apply(null, mh)));
            wx.pop.avg.push(average(pop));
            wx.sky.min.push(nf0.format(Math.min.apply(null, cov)));
            wx.sky.avg.push(average(cov));
            wx.sky.max.push(nf0.format(Math.max.apply(null, cov)));
        });

        return error ? null : wx;
    } catch (error) {
        console.error('There is an error getting FWF', error);
        return null;
    }
}

function createForecastTable(type, data, numDays = 5) {
    let firstBreak = 0;
    let html = ['<table class="forecast-table"><thead><tr class="date-group"><th></th>'];

    if (type == 'hourly') {
        numDays = hourly.time.length;
        const times = hourly.time.map(t => new Date(t));
        let currentDay = null;
        let dayCount = 0;

        const formatDate = (dt) => Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(dt);

        times.forEach((dt, i) => {
            const dayStr = formatDate(dt);

            if (currentDay === null) {
                currentDay = dayStr;
                dayCount = 1;
            } else if (dayStr === currentDay) {
                dayCount++;
            }

            const nextDayStr = times[i + 1] ? formatDate(times[i + 1]) : null;
            if (nextDayStr !== currentDay || i === times.length - 1) {
                html.push(`<th colspan="${dayCount}">${currentDay}</th>`);
                currentDay = nextDayStr;
                if (firstBreak == 0) firstBreak = dayCount - 1;
                dayCount = 0;
            }
        });

        html.push('</tr><tr><th></th>');

        times.forEach((h, n) => {
            html.push(`<th${n == firstBreak ? ' style="border-right:3px solid #ff8cb5"' : ''}>${Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(h)}</th>`);
        });
    } else {
        const displayDates = data.dates.slice(0, numDays);

        displayDates.forEach(ts => {
            const d = new Date(ts),
                isToday = d.getDate() == new Date().getDate(),
                isTomorrow = d.getDate() == new Date(new Date().getTime() + 86400000).getDate();

            let date = d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            if (isToday) {
                date = 'Today';
            } else if (isTomorrow) {
                date = 'Tomorrow';
            }

            html.push(`<th>${date}</th>`);
        });
    }

    html.push('</tr></thead><tbody>');

    // Rows
    (type == 'hourly' ? hourlyLabels : forecastLabels).forEach(item => {
        html.push(`<tr><td class="row-label">${item.label}</td>`);

        const values = getNestedValue(data, item.path);
        const rowValues = Array.isArray(values) ? values.slice(0, numDays) : Array(numDays).fill(null);

        rowValues.forEach((val, n) => {
            if (val == null || val === '∞' || val === '-∞' || String(val) == 'NaN') {
                html.push('<td>--</td>');
                return;
            }

            const formatter = formatters[item.format] || formatters.default,
                displayValue = formatter(val),
                style = getStyleForFormat(item.format, val);

            html.push(`<td style="${style}${type == 'hourly' && n == firstBreak ? ';border-right:3px solid #ff8cb5' : ''}">${displayValue}</td>`);
        });

        html.push('</tr>');
    });

    html.push('</tbody></table>');
    return html.join('');
}

self.onmessage = async (e) => {
    lat = e.data.lat;
    lon = e.data.lon;
    tempUnit = e.data.units.temp;
    windUnit = e.data.units.wind;

    try {
        const resp = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
        if (!resp.ok) return self.postMessage(null);

        const json = await resp.json();
        if (!json) return self.postMessage(null);

        const data = await getWeather(json.properties);

        if (data == null) {
            return self.postMessage('<div style="display:block;text-align:center"><div class="message error">We were unable to get a fire weather forecast for this location. Please try again.</div></div>');
        }

        const table = createForecastTable('hourly', hourly);
        const table2 = createForecastTable('daily', data, 5);

        self.postMessage(`<div class="container">
                <header>
                    <div class="title">
                        <div class="tray">
                            <h1 class="title">Fire Weather Forecast</h1>
                        </div>
                        <div class="desc">
                            <i class="fas fa-location-dot" style="font-size:24px"></i>
                            <span>Forecast for ${data.location} at ${nf0.format(data.elevation)} ft.</span>
                        </div>
                    </div>
                </header>

                <h2>Hourly Forecast</h2>
                <div class="forecast-table-wrapper hourly">${table}</div>

                <h2>5-day Forecast</h2>
                <div class="forecast-table-wrapper daily">${table2}</div>
            </div>`
        );
    } catch (error) {
        console.error('There is an error generating a FWF', error);

        self.postMessage({
            success: false
        });
    }
};