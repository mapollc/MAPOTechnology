let domain, agencies, tracked, sizeUnit, reported, updated, wfid, type, state, incID,
    acres, dispatch, agency, center, isTracked, contain, notes, fuels, cost, resources,
    behavior, cause, inciweb, website = '';

const numberFormat = (n, d = 2) => {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
},
    ucfirst = (s) => {
        return s.charAt(0).toUpperCase() + s.slice(1);
    },
    social = (fireName) => {
        const socialName = fireName.replace(/\s/g, '');

        return `<div class="social">
            <i class="fab fa-facebook" title="Share about #${socialName} on Facebook" onclick="socialShare('fb')"></i>
            <i class="fab fa-x-twitter" title="Tweet about #${socialName} on X" onclick="socialShare('tw')"></i>
            <i class="fab fa-tiktok" title="Find #${socialName} videos on TikTok" onclick="socialShare('tt')"></i>
            <i class="fal fa-share-nodes" title="Share: text, email, or copy link" data-action="sharer"></i>
        </div>`;
    },
    disclaimer = () => {
        return `<p class="disclaimer">This information is collected from various state and federal interagency dispatch centers and other official government sources. While we make every effort to provide accurate and up-to-date data, it may not reflect the latest conditions. Always verify with your local authorities for current information on evacuations, fire activity, or other critical safety alerts.</p>`;
    },
    dispatchCtr = () => {
        if (center == null) return '';
        let website = '';

        if (center.website != '') website = `<p><a target="blank" href="${center.website}">${center.website}</a></p>`;

        return `<div class="grid top-align">
            <div class="card dispatch">
            <h3>Dispatch Center</h3>
                <dt class="label large">${center.name} (${center.agency})</dt>
                <dd><p style="padding-bottom:0">${center.location}</p>${website}</dd>
            </div>
        </div>`;
    },
    incidentDetails = (json, cols) => {
        const uniqueJson = [...new Map(json.map(item => [item.desc, item])).values()],
            totalLength = uniqueJson.length,
            createHTML = (dataArray) => {
                const fields = dataArray.map(item => `
                <dt class="label">${item.desc}</dt>
                <dd>${item.info}</dd>
            `).join('');

                return `<div class="card">${fields}</div>`;
            };

        if (cols === 1) return createHTML(uniqueJson);

        const splitIndex = Math.ceil(totalLength / 2),
            col1Data = uniqueJson.slice(0, splitIndex),
            col2Data = uniqueJson.slice(splitIndex);

        return `${createHTML(col1Data)}${createHTML(col2Data)}`;
    },
    getInciweb = () => {
        let content = '',
            inciwebPhoto = '',
            inciwebFields = ['Basic Information', 'Current Situation', 'Current Weather', 'Outlook'],
            inciwebIDs = ['basic', 'cursit', 'inciwx', 'otlk'];

        if (inciweb != null) {
            if (inciweb.photo) {
                inciwebPhoto = `<div class="col" data-width="25">
                    <figure>
                        <a href="https://www.mapofire.com/src/images/incident?path=${inciweb.photo.url}" target="blank"><img loading="lazy" src="https://www.mapofire.com/src/images/incident?path=${inciweb.photo.url}" alt="${inciweb.photo.caption}" title="${inciweb.photo.caption}"></a>
                        <figcaption>${inciweb.photo.caption}</figcaption>
                    </figure>
                </div>`;
            }

            content += `<div class="inciweb">
                <div class="block" id="overview">
                    <h2>Incident Overview</h2>

                    <div class="card row">
                        <div class="col text" data-width="${inciweb.photo ? 75 : 100}">
                            ${inciweb.incident_info}
                        </div>
                        ${inciwebPhoto}
                    </div>
                </div>`;

            inciwebFields.forEach((field, i) => {
                if (inciweb.current.data[field]) {
                    const useCols = inciwebIDs[i] == 'inciwx' || inciwebIDs[i] == 'otlk' ? 1 : 2;

                    content += `<div class="block" id="${inciwebIDs[i]}">
                        <h2>${field}</h2>

                        <div class="grid cols-${useCols} top-align">
                            ${incidentDetails(inciweb.current.data[field], useCols)}
                        </div>
                    </div>`;
                }
            });

            if (inciweb.contacts.pio) {
                content += `<div class="block">
                    <h2>Public Information</h2>

                    <div class="card row">
                        <div class="col" data-width="100">
                            <p>${inciweb.contacts.pio}</p>
                        </div>
                    </div>
                </div>`;
            }

            return content + `</div>`;
        } else {
            return '';
        }
    },
    dt = (time) => {
        const date = new Date(time * 1000);
        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
        };

        return date.toLocaleString('en-US', options).replace(/(.*),\s(.*)/gm, `$1 at $2`);
    };

self.onmessage = (e) => {
    let object = e.data.fire,
        data = object.json,
        role = e.data.role,
        vars = e.data.vars,
        fire = data.fire,
        fr = fire.properties;

    /* assign global variables */
    domain = vars.domain;
    agencies = vars.agencies;
    center = vars.center;
    tracked = vars.tracked;
    acres = vars.acres;
    sizeUnit = vars.sizeUnit;
    reported = vars.reported;
    updated = vars.updated;

    /* assign wildfire related variables */
    wfid = fr.wfid;
    type = fr.type;
    state = fr.fireState;
    incID = fr.incidentId;
    dispatch = fire.protection.dispatch;
    agency = fire.protection;
    isTracked = tracked.includes(parseInt(wfid));
    contain = fr.containment;
    notes = fr.notes ? fr.notes : 'None provided';
    fuels = fr.fuels ? fr.fuels : 'None specified';
    resources = fr.resources ? fr.resources : 'None reported';
    behavior = fr.behavior ? Object.values(fr.behavior).join(', ') : null;
    cause = fr.cause ? Object.values(fr.cause).join(' / ') : 'Unknown';
    cost = fr.cost ? fr.cost : null;
    near = fire.geometry.near; //fire.geometry.geo.near
    inciweb = fire.inciweb ? fire.inciweb : null;

    /* create inline variables for the template */
    let coords = fire.geometry.lat.toFixed(4).toString() + ', ' + fire.geometry.lon.toFixed(4).toString(),
        edit = role == 'ADMIN' ? '<a target="blank" href="' + domain + 'account/admin/wildfires/' + (dispatch == 'MAPO' ? 'modify' : 'edit') + '?wfid=' + wfid + '" style="display:inline-block;font-size:14px;color:var(--box-orange);margin-right:5px"><i class="far fa-pen-to-square"></i></a>' : '',
        jdesc = (!agency.agency && !agency.unit ? 'Unknown' : (agency.agency ? agency.agency : '') + (agency.area ? ' &mdash; ' + agency.area : '')),
        logo = '';

    if (agency.logo || dispatch == 'CAL FIRE') {
        logo = '<img loading="lazy" class="logo" src="' + domain + 'assets/images/icons/fire/agencies/agency_' + (agency.logo ? agency.logo : (dispatch == 'CAL FIRE' ? 'calfire' : '')) + '_logo.png" alt="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">';
    } else {
        logo = '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map w-3 h-3" aria-hidden="true"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path><path d="M15 5.764v15"></path><path d="M9 3.236v15"></path></svg>';
    }

    const spin = '<span id="spinner" style="width:18px;height:18px"></span>';
    let content = `<div class="container">
        <div class="incident">
            ${fire.time.year < new Date().getFullYear() ? `<div class="archived"><i class="far fa-lock-keyhole"></i><span style="line-height:1.2">This ${type.toLowerCase()} is a historical incident and is no longer active.</span></div>` : ''}
            <header>
                <div class="title">
                    <div class="tray">
                        ${edit}
                        <h1>${object.fireName}</h1>
                    </div>
                    <div class="desc">
                        ${logo}
                        <span>${object.geoLocate}</span>
                    </div>
                </div>
                <div class="tr">
                    <a href="#" class="btn btn-${isTracked ? 'black' : 'yellow'} btn-sm" onclick="return false" style="margin:0" id="trackFire" data-action="trackFire" data-mode="${isTracked ? 'unfollow' : 'follow'}" data-id="${wfid}" title="${isTracked ? 'You\'re following this incident' : 'Start following this incident'}"><i class="far fa-${isTracked ? 'check' : 'plus'}"></i>Follow${isTracked ? 'ing' : ''} this incident</a>
                </div>
            </header>

            <p class="timestamps">
                <span>Last updated <b>${updated}</b></span>
                <span>Reported <b>${vars.reported.useAgo ? vars.reported.ago : dt(fire.time.discovered)}</b></span>
                <span>Incident <b>#${incID}</b></span>
            </p>

            <div class="grid cols-4 stats">
                <div class="card">
                    <dt class="label">Status</dt>
                    <span class="status ${object.status}" style="min-width:123px" title="${ucfirst(object.status)}">${object.status}</span>
                </div>
                <div class="card">
                    <dt class="label">Size</dt>
                    <p class="fire-size" data-action="copy"><span>${acres}</span>${sizeUnit}</p>
                </div>
                <div class="card">
                    <dt class="label">Containment</dt>
                    <div class="containment">
                        <div class="contain-bar ${contain.replace('%', '') < 50 ? '' : 'progress'}">
                            <div style="width:${contain}${contain == '100%' ? ';border-radius:4px' : ''}"></div>
                            <h3>${contain}</h3>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <dt class="label">Coordinates</dt>
                    <span class="coords" data-action="copy" title="Coordinates for ${object.fireName}">${coords}</span>
                </div>
            </div>

            <div class="grid cols-${fr.image != null && !inciweb ? 3 : 2} top-align">
                <div class="card initial">
                    <dt class="label icon fa-location-dot">Initial Location</dt>
                    <dd>${near}</dd>

                    <dt class="label icon fa-tower-observation">Responsible Agency</dt>
                    <dd>${jdesc}</dd>

                    <dt class="label icon fa-notes">Dispatch Notes</dt>
                    <dd>${notes}</dd>

                    <dt class="label icon fa-trees">Fuels</dt>
                    <dd>${fuels}</dd>
                </div>
                <div class="card initial">
                    <dt class="label icon fa-sensor-triangle-exclamation">Initial Resources</dt>
                    <dd>${resources}</dd>

                    <dt class="label icon fa-wave-pulse">Fire Behavior</dt>
                    <dd>${behavior == null ? 'Unknown' : behavior}</dd>

                    <dt class="label icon fa-circle-dollar">Estimated Costs</dt>
                    <dd>${cost == null ? 'Not reported' : `$${numberFormat(cost)}`}</dd>

                    <dt class="label icon fa-cloud-question">Cause</dt>
                    <dd>${cause == null ? 'Unknown' : cause}</dd>
                </div>
                ${fr.image != null && !inciweb ? `<div class="card">
                    <a class="figure" target="_blank" href="../../../src/images/incident?mapo=1&path=${fr.image}">
                        <img loading="lazy" class="mapoIncPhoto" src="../../../src/images/incident?mapo=1&path=${fr.image}&small=1">
                    </a>
                </div>` : ''}
            </div>

            <div class="grid cols-2">
                <div id="curwx" class="card">
                    <h3>Nearby Weather Conditions</h3>

                    <div class="table" data-cols="4">
                        <div id="a">
                            <i class="fal fa-temperature-high"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Temperature</dt>
                        </div>
                        <div id="b">
                            <i class="fal fa-droplet-percent"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Humidity</dt>
                        </div>
                        <div id="c">
                            <i class="fas fa-location-arrow" style="transform:rotate(-45deg)"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Direction</dt>
                        </div>
                        <div id="d">
                            <i class="fal fa-wind"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Wind Speed</dt>
                        </div>
                    </div>

                    <p class="updated"></p>
                </div>
                <div id="fcstwx" class="card">
                    <h3>24-Hour Fire Weather Analysis</h3>

                    <div class="table" data-cols="4">
                        <div id="b">
                            <i class="fal fa-droplet-percent"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Min. Humidity</dt>
                        </div>
                        <div id="d">
                            <i class="fal fa-wind"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Max. Wind Spd.</dt>
                        </div>
                        <div id="a">
                            <i class="fal fa-temperature-high"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Max. Temp.</dt>
                        </div>
                        <div id="c">
                            <i class="fal fa-wind"></i>
                            <h4>${spin}</h4>
                            <dt class="label">Avg. Wind Spd.</dt>
                        </div>
                    </div>

                    <p class="updated"></p>
                </div>
            </div>

            <div id="acres_history_wrapper">
                <h2 id="ah-title">Incident Growth History</h2>
                    
                <div class="card acres_history">
                    <div id="acres_history"></div>
                </div>
            </div>

            ${getInciweb()}

            ${center != null ? dispatchCtr() : ''}

            ${social(object.fireName)}

            ${disclaimer()}
        </div>
    </div>`;

    self.postMessage(content);
};