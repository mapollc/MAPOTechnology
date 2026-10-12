import * as helpers from '../utils/helpers.js';
import { global, dow, short_months, long_months } from '../app/global.js';
import { config } from '../app/config.js';
import { Modal } from './modal.js';

export class Tables {
    constructor() { }

    rwTable() {
        let content = '',
            exists = false;

        if (global.globalData.roadReports.length > 0) {
            global.globalData.roadReports
                .sort((a, b) => {
                    const name = a.name.localeCompare(b.name);
                    if (name !== 0) return name;
                })
                .forEach(p => {
                    if (p.road) {
                        exists = true;
                        content += `<div class="inc-card" data-type="rw" data-id="${p.name}" onclick="helpers.goToRW('${p.name}')">
                        <div class="wrap">
                            <h2>${p.name}</h2><span class="updated">Last report ${helpers.timeAgo(p.updated)}</span>
                        </div>
                        <div class="rows" style="margin-top:0">
                            <div class="line"><div class="de">Weather</div><span>${p.weather}</span></div>
                            <div class="line"><div class="de">Road Conditions</div><span>${p.road.condition}</span></div>
                        </div>
                    </div>`;
                    }
                });
        }

        global.modal.querySelector('.tab-content .content[data-tab=roads]').innerHTML = exists ? '<input type="text" id="filterRW" class="text" autocomplete="off" placeholder="Search reports...">' + content : 'There are no road reports currently available.';
    }

    webcamTable() {
        let content = '',
            count = 0;

        global.globalData.webcams.forEach(w => {
            w.properties.cameras.forEach(data => {
                if (config.settings.isFavorite('cameras', data.id.toString())) {
                    content += `<div style="${count != 0 ? 'margin-top:var(--spacing);' : ''}text-align:center">
                        <h4 class="fav">${data.name}${new Modal().genFav('cameras', data.id, data.name)}</h4>
                        <img loading="lazy" src="${atob(data.url)}?${new Date().getTime()}" alt="${data.name}" title="${data.name}" class="webcam">
                    </div>`;

                    count++;
                }
            });
        });

        global.modal.querySelector('.tab-content .content[data-tab=cams]').innerHTML = (count == 0 ? 'You currently don\'t have any favorite cameras' : content);
    }

    rwisTable() {
        let content = '';

        global.globalData.rwis
            .filter(a => a.properties?.station !== null)
            .sort((a, b) => {
                const name = a.properties.station.hwy.localeCompare(b.properties.station.hwy);
                if (name !== 0) return name;
                return a.properties.station.mp - b.properties.station.mp;
            })
            .forEach(s => {
                let p = s.properties,
                    pvt;

                if (p.surface.pavement != null) {
                    pvt = Math.round(p.surface.pavement[0]) + '&deg;F';

                    if (p.surface.pavement[1]) {
                        pvt += '/' + Math.round(p.surface.pavement[1]) + '&deg;F';
                    }
                }

                if (p.weather.wind != null) {
                    var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + p.weather.wind.dir + '" style="transform:rotate(' + p.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--dark-orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
                }

                content += `<div class="rwis-card" data-type="rwis" data-id="${p.station.id}" onclick="helpers.goToRWIS('${p.station.id}')">
                <span class="temp">${Math.round(p.weather.temp)}&deg;</span>
                <div class="wrapper">
                    <h2>${helpers.roadName(p.station.name)}</h2>
                    <div class="rows">
                        ${pvt ? `<div class="line"><div class="de">Pavement Temp</div><span>${pvt}</span></div>` : ''}
                        ${p.weather.wind != null ? `<div class="line"><div class="de">Wind</div><span>${wi}${Math.round(p.weather.wind.speed)} mph</span></div>` : ''}
                        ${p.surface.grip != null ? `<div class="line"><div class="de">Surface Friction</div>
                        <span><a href="#" onclick="helpers.grip('${p.surface.grip}');return false">${p.surface.grip * 100}%</a></span></div>` : ''}
                    </div>
                    <span class="updated" style="text-align:left;margin-top:1em">Last reported ${helpers.timeAgo(p.updated)}</span>
                </div>
            </div>`;
            });

        global.modal.querySelector('.tab-content .content[data-tab=rwis]').innerHTML = '<input type="text" id="filterRWIS" class="text" autocomplete="off" placeholder="Search stations...">' + content;
    }

    async incsTable() {
        let content = '',
            alerts = '';

        global.globalData.incidents.forEach(s => {
            if (s.properties.category != 'Road Work') {
                let p = s.properties,
                    loc = p.location,
                    isAlert = false;

                if (p.type == 'Closure' || p.impact == 'Closure' || p.impact == 'Closure with Detour') isAlert = true;

                content += `<div class="inc-card" data-type="incident" data-id="${p.id}" onclick="helpers.goToIncident('${p.id}')">
                    <div class="wrap">
                        <h2>${p.type}</h2>
                        <span class="updated">${helpers.timeAgo(p.updated)}</span>
                    </div>
                    <p style="margin:0;color:var(--blue)">${loc.desc}</p>
                    <span style="color:#555;font-size:14px">
                        ${loc.hwy}${loc.direction ? ` ${global.calculate.direction(loc.direction)}` : ''}, Milepost ${loc.milepost.start}${loc.milepost.end ? `-${loc.milepost.end}` : ''}
                    </span>
                </div>`;

                if (isAlert) {
                    alerts += `<div class="inc-card" data-type="incident" data-id="${p.id}" onclick="helpers.goToIncident('${p.id}')">
                        <div class="wrap">
                            <h2 style="color:var(--red)">${p.type}</h2>
                            <span class="updated">${helpers.timeAgo(p.updated)}</span>
                        </div>
                        <p style="margin:0;color:var(--blue)">${loc.desc}</p>
                        <span style="color:#555;font-size:14px">${loc.hwy}, Milepost ${loc.milepost.start}${loc.milepost.end ? `-${loc.milepost.end}` : ''}
                        ${loc.direction ? ' &middot; ' + loc.direction : ''}</span>
                    </div>`;
                }
            }
        });

        /* parse WWAs */
        if (global.nwsAlerts.length) {
            global.nwsAlerts?.forEach(alert => {
                const d1 = new Date(alert.effective * 1000);
                const d2 = new Date(alert.expires * 1000);

                const tzMatch = d1.toString().match(/\(([A-Za-z\s]+)\)/);
                const tzParts = tzMatch ? tzMatch[1].split(' ') : [''];
                const tz = tzParts.map(p => p[0]).join('');

                const formatTime = d => {
                    const hours = d.getHours();
                    const mins = d.getMinutes();
                    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    const mStr = mins < 10 ? '0' + mins : mins;
                    const ampm = hours >= 12 ? 'P' : 'A';
                    return `${h12}:${mStr} ${ampm}M`;
                };

                const t1 = formatTime(d1);
                const t2 = formatTime(d2);

                const iss = `${short_months[d1.getMonth()]} ${d1.getDate()}, ${d1.getFullYear()} at ${t1} ${tz}`;
                const exp = `${dow[d2.getDay()]}, ${long_months[d2.getMonth()]} ${d2.getDate()}, ${d2.getFullYear()} at ${t2}`;

                alerts += `<div class="wwa-card" onclick="new Modal().wxAlert('${alert.id}')">
                    <div class="wrap"><h2 style="color:var(--red);margin:0!important">${alert.event}</h2></div>
                    <p style="font-size:15px;margin:0">In effect until ${exp}</p>
                    <p style="color:var(--blue-gray);margin:0">${alert.zone}</p>
                    <span class="updated" style="text-align:left">Issued ${iss}</span>
                </div>`;
            });
        }

        global.modal.querySelector('.tab-content .content[data-tab=alerts]').innerHTML = alerts;
        global.modal.querySelector('.tab-content .content[data-tab=incs]').innerHTML = content;
    }
}