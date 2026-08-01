import { config } from '../app/config.js';
import { DateFormatter } from '../utils/constants.js';

export function ndfdTime(add = 0) {
    const now = new Date(),
        dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
        [hours, minutes] = now.toTimeString().split(':');

    let h = parseInt(hours, 10);
    if (parseInt(minutes, 10) > 0) h += 1;

    const t = `${dateStr} ${h}:00:00`;
    return new Date(t).getTime() + add * 3600 * 1000;
}

export function sfpTimes() {
    return Array.from({ length: 7 }, (_, z) => {
        const t = new Date();
        t.setDate(t.getDate() + z);

        const y = t.getFullYear(),
            m = String(t.getMonth() + 1).padStart(2, '0'),
            d = String(t.getDate()).padStart(2, '0'),
            dayLabel = z === 0 ? ' (Today)' : (z === 1 ? ' (Tomorrow)' : '');

        return {
            key: `${y}-${m}-${d}T00:00:00.0Z`,
            value: `${DateFormatter.DAYS[t.getDay()]}, ${DateFormatter.MONTHS[t.getMonth()]} ${t.getDate()}${dayLabel}`
        };
    });
}

export function initNDFDTimes() {
    const options = [];
    const fcstTime = config.settings.special().fcstTime();
    let selectedApplied = false;

    for (let i = 0; i < 24; i++) {
        const t = new Date(ndfdTime(i)),
            ts = t.toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z');

        const selected = !selectedApplied && (fcstTime >= ts || (i === 0 && fcstTime < ts)) ? (selectedApplied = true, 'selected ') : '',
            hours = t.getHours(),
            lh = hours % 12 || 12,
            period = hours >= 12 ? 'PM' : 'AM';

        options.push(`<option ${selected}value="${ts}">${lh}:00 ${period}</option>`);
    }

    return options;
}