function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function ucwords(s) {
    if (s.search(/\s/g) >= 0) {
        var a = s.split(' '),
            o = '';

        a.forEach(function (s) {
            o += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
        });

        return o.substring(0, o.length - 1);
    } else {
        return ucfirst(s);
    }
}

function parseFireName(n, t, i) {
    let o = '';
    if (t == 'Prescribed Fire') {
        o = (n.search('RX') >= 0 ? n : n + ' RX');
    } else if (t == 'Smoke Check') {
        o = 'Smoke Check' + (i != undefined ? '#' + i.split('-')[1] + '-' + parseInt(i.split('-')[2]) : '');
    } else {
        o = (n == undefined ? '' : (n == '' ? 'Incident #' + parseInt(i.split('-')[2]) : ucwords(n.toLowerCase())) + ' Fire');
    }
    return o;
}

function getStatus(s, n) {
    if (s == '' || s === false && n == '') {
        return 'active';
    } else {
        return (s == null ? (n.search('contain') >= 0 ? 'contained' : (n.search('control') >= 0 ? 'controlled' : 'active')) : (s.Out ? 'out' : (s.Control ? 'controlled' : (s.Contain ? 'contained' : ''))));
    }
}

function juris() {
    return '<b>' + type.toUpperCase() + '</b> reported' +
        (dispatch == '' || (dispatch == 'MAPO' && agency.agency == '') ? ' by National Interagency Fire Center' :
            (agency.area ? (agency.area.search(' Center') >= 0 ? ' by' : ' in') + ' ' +
                (abbr ? abbr + ' ' : '') + agency.area : (agency.unit == 'NWCG' ? ' by NWCG/Inciweb' : '')
            )
        ) + ',&nbsp;' + stateLabels[state].v;
}

function social() {
    return `<div class="social">
        <i class="fab fa-facebook social" title="Share on Facebook" onclick="socialShare('fb')"></i>
        <i class="fab fa-x-twitter social" title="Tweet on X" onclick="socialShare('tw')"></i>
        <i class="fab fa-tiktok social" title="Find videos on TikTok" onclick="socialShare('tt')"></i>
        <i class="fal fa-share-nodes" title="Share: text, email, or copy link" data-action="sharer"></i>
    </div>`;
}

function disclaimer() {
    return `<p class="disclaimer">
        This information is based on an automated collection of data from various state and federal
        interagency dispatch centers and other governmental sources. Always refer to your local sources for
        the latest updates on evacuations or other critical information.
    </p>`;
}

function incidentDetails(json) {
    let fields = json.length,
        inci = '<div class="col w' + (fields == 1 ? '10' : '5') + '0"><div class="data-list">';
    col1 = fields - Math.floor(fields / 2);

    for (let i = 0; i < col1; i++) {
        inci += '<div class="field"><div class="label">' + json[i].desc + '</div>' +
            '<div class="desc">' + json[i].info + '</div></div>';
    }

    if (fields > 1) {
        inci += '</div></div><div class="col w50"><div class="data-list">';

        for (let i = col1; i < fields; i++) {
            inci += '<div class="field"><div class="label">' + json[i].desc + '</div>' +
                '<div class="desc">' + json[i].info + '</div></div>';
        }
    }

    return inci + '</div></div>';
}

function getInciweb() {
    let content = '',
        overview;

    if (inciweb != null) {
        if (inciweb.photo) {
            overview = `<div class="row">
                <div class="col w25">
                    <figure>
                        <a href="https://www.mapofire.com/src/images/incident?path=${inciweb.photo.url}&small=1" target="blank"><img loading="lazy" src="https://www.mapofire.com/src/images/incident?path=${inciweb.photo.url}" alt="${inciweb.photo.caption}" title="${inciweb.photo.caption}"></a>
                        <span><i class="far fa-message" style="padding-right:0.5em"></i>${inciweb.photo.caption}</span>
                    </figure>
                </div>
                <div class="col w75">
                    ${inciweb.incident_info}
                </div>
            </div>`;
        } else {
            overview = inciweb.incident_info;
        }

        content += `<div class="row inciweb">
    <div class="col w100">
        <h2>Incident Overview</h2>
        <div class="text">
            ${overview}
        </div>
    </div>
</div>`;

        ['Basic Information', 'Current Situation', 'Current Weather', 'Outlook'].forEach((field) => {
            if (inciweb.current.data[field]) {
                content += `<h2>${field}</h2><div class="row">${incidentDetails(inciweb.current.data[field])}</div>`;
            }
        });

        if (inciweb.contacts.pio) {
            content += `<div class="row"><div class="col w100">
                <h2>Public Information</h2>
                <p>${inciweb.contacts.pio}</p>
            </div></div>`;
        }
    }

    if (center == null) {
        content += `<div class="dispatch"></div>`;
    } else {
        if (center.website != '') {
            website = `<p><a target="blank" href="${center.website}">${center.website}</a></p>`;
        }

        content += `<div class="row dispatch">
                <div class="col w100">
                    <h2>Dispatch Center</h2>
                    <p style="font-weight:500">${center.name} (${center.agency})</p>
                    <p>${center.location}</p>
                    ${website}
                </div>
            </div>`;
    }

    return content;
}

function dt(time) {
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
}

let domain, agencies, stateLabels, tracked, sizeUnit, reported, updated,
    wfid, type, state, incID, fireName, acres, dispatch, agency, center, abbr, isTracked,
    fstat, st1, st, contain, notes, fuels, cost, resources, behavior, incstatus = 'Active', inciweb, website = '';

self.onmessage = (e) => {
    let data = e.data.json,
        role = e.data.role,
        vars = e.data.vars,
        fire = data.fire,
        fr = fire.properties,
        curTime = new Date();

    /* assign global variables */
    domain = vars.domain;
    stateLabels = vars.stateLabels;
    agencies = vars.agencies;
    tracked = vars.tracked;
    sizeUnit = vars.sizeUnit;
    reported = vars.reported;
    updated = vars.updated;
console.log(fr.behavior);
    /* assign wildfire related variables */
    wfid = fr.wfid;
    type = fr.type;
    state = fr.fireState;
    incID = fr.incidentId;
    fireName = parseFireName(fr.fireName, type, incID);
    acres = (fr.acres == 'Unknown' ? 'Unknown' : numberFormat(fr.acres));
    dispatch = fire.protection.dispatch;
    agency = fire.protection;
    center = vars.center;
    fstat = fr.status;
    st1 = fire.time.year < curTime.getFullYear() ? 'out' : getStatus(fstat, fr.notes);
    st = st1 ? st1 : 'active';
    abbr = agency.agency != 'US Forest Service' ? agencies[agency.agency] : '';
    isTracked = tracked.includes(parseInt(wfid));
    contain = fr.containment;
    notes = fr.notes ? fr.notes : 'None provided';
    fuels = fr.fuels ? fr.fuels : 'None specified';
    resources = fr.resources ? fr.resources : 'None reported';
    behavior = fr.behavior ? Object.values(fr.behavior).join(', ') : null;
    cost = fr.cost ? fr.cost : null;
    near = fire.geometry.near;
    inciweb = fire.inciweb ? fire.inciweb : null;

    /* get contain, control, out date/times for the incident */
    if (fstat != null && (fstat.Contain || fstat.Control || fstat.Out)) {
        incstatus = '';

        if (fstat.Contain) {
            incstatus += 'Contained ' + (fstat.Contain == -1 ? 'at unknown time' : 'on ' + dt(fstat.Contain)) + ' &middot; ';
        }
        if (fstat.Control) {
            incstatus += 'Controlled ' + (fstat.Control == -1 ? 'at unknown time' : 'on ' + dt(fstat.Control)) + ' &middot; ';
        }
        if (fstat.Out) {
            incstatus += 'Out ' + (fstat.Out == -1 ? 'at unknown time' : 'on ' + dt(fstat.Out)) + ' &middot; ';
        }

        incstatus = incstatus.substring(0, incstatus.length - 10);
    }

    /* create inline variables for the template */
    let coords = fire.geometry.lat.toFixed(4) + ', ' + fire.geometry.lon.toFixed(4),
        edit = role == 'ADMIN' ? '<a target="blank" href="' + domain + 'account/admin/wildfires/' + (dispatch == 'MAPO' ? 'modify' : 'edit') + '?wfid=' + wfid + '" style="display:inline-block;font-size:15px;margin-right:5px"><i class="far fa-pen-to-square"></i></a>' : '',
        jdesc = (!agency.agency && !agency.unit ? 'Unknown' : (agency.agency ? agency.agency + ' &mdash; ' : '') + (agency.area ? agency.area : ''));
    logo = (agency.logo || dispatch == 'CAL FIRE' ? '<img loading="lazy" src="' + domain + 'assets/images/icons/fire/agencies/agency_' + (agency.logo ? agency.logo : (dispatch == 'CAL FIRE' ? 'calfire' : '')) + '_logo.png" alt="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' : '');

    let spin = '<span id="spinner" style="width:18px;height:18px"></span>',
        content = `<div class="container">
    <div class="incident">
        <div class="header">
            <div class="heading">
                <div class="title">
                    <div class="tray">
                        ${edit}
                        <h1>${fireName}</h1>
                    </div>
                    <span title="Coordinates for ${fireName}" class="coords">${coords}</span>
                </div>
            </div>
            <div class="agency">
                <div class="juris">
                    ${logo}
                    <p title="${agency.agency} - ${agency.area} (${agency.unit})" data-adv="${juris(type, agency, dispatch, abbr, stateLabels, state).replaceAll('"', '\'')}">
                        <b>${type.toUpperCase()}</b> reported in ${stateLabels[state].v}
                    </p>
                </div>
            </div>
        </div>

        <div class="stats">
            <div class="stat">
                <p>Status</p>
                <div class="v"><span class="status ${st1}" title="${st1}">${st1}</span></div>
            </div>
            <div class="stat">
                <p>Size</p>
                <div class="v" style="color:var(--red)">${acres} <small>${sizeUnit}</small></div>
            </div>
            <div class="stat">
                <p>Containment</p>
                <div class="v" title="${(contain == 'N/A' ? `Unknown if this incident is contained` : `This incident is ${contain} contained`)}">
                    <div class="cont">
                        <span>${contain}</span>
                        ${(contain != 'N/A' ? `<div class="line"><div style="width:${contain}${contain == '100%' ? ';opacity:1' : ''}"></div></div>` : '')}
                    </div>
                </div>
            </div>
            <div class="stat">
                <a href="#" class="btn btn-${isTracked ? 'black' : 'yellow'} btn-sm" onclick="return false" style="margin:0" id="trackFire" data-action="trackFire" data-mode="${isTracked ? 'unfollow' : 'follow'}" data-id="${wfid}" title="${isTracked ? 'You\'re following this incident' : 'Start following this incident'}"><i class="far fa-${isTracked ? 'check' : 'plus'}"></i>Follow${isTracked ? 'ing' : ''} this incident</a>
            </div>
        </div>

        <div class="bar">
            <p class="times">
                <span>Last updated <b>${updated}</b></span>
                <span title="Reported ${dt(fire.time.discovered)}${center ? ' to ' + center.name : ''}">Reported <b>${reported} <b style="font-weight:100">via</b> ${dispatch}</b></span>
                <span>Incident # <b>${incID}</b></span>
            </p>
        </div>

        <div class="row no-gap75">
            <div class="col w50">
                <div class="data-list">
                    <div class="data">
                        <div class="icon"><i class="fas fa-location-dot"></i></div>
                        <div class="label">Initial Location</div>
                        <div class="value">${near}</div>
                    </div>
                    <div class="data">
                        <div class="icon"><i class="fad far fa-notes"></i></div>
                        <div class="label">Dispatch Notes</div>
                        <div class="value">${notes}</div>
                    </div>
                    <div class="data">
                        <div class="icon"><i class="fal fa-sensor-triangle-exclamation"></i>
                        </div>
                        <div class="label">Initial Resources</div>
                        <div class="value">${resources}</div>
                    </div>
                    ${cost != null ? `<div class="data">
                        <div class="icon"><i class="far fa-circle-dollar"></i>
                        </div>
                        <div class="label">Estimated Costs</div>
                        <div class="value">$${numberFormat(cost)}</div>
                    </div>` : ''}
                </div>
            </div>
            <div class="col w50">
                <div class="data-list">
                    <div class="data">
                        <div class="icon"><i class="fas fa-tower-observation"></i></div>
                        <div class="label">Responsible Agency</div>
                        <div class="value">${jdesc}</div>
                    </div>
                    <div class="data">
                        <div class="icon"><i class="fad fa-trees"></i></div>
                        <div class="label">Fuels</div>
                        <div class="value">${fuels}</div>
                    </div>
                    ${behavior != null ? `<div class="data">
                        <div class="icon"><i class="far fa-wave-pulse"></i>
                        </div>
                        <div class="label">Fire Behavior</div>
                        <div class="value">${behavior}</div>
                    </div>` : ''}
                    <div class="data">
                        <div class="icon"><i class="fad fa-chart-line"></i></div>
                        <div class="label">Incident Status</div>
                        <div class="value cco">
                            ${incstatus}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col w50">
                <div class="card" id="curwx">
                    <h2>Nearby Weather Conditions</h2>
                    <div class="wx">
                        <div class="elmt" id="a">
                            <i class="fal fa-temperature-high"></i>
                            <label>Temperature</label>
                            <h3>${spin}</h3>
                        </div>
                        <div class="elmt" id="b">
                            <i class="fal fa-droplet-percent"></i>
                            <label>Humidity</label>
                            <h3>${spin}</h3>
                        </div>
                        <div class="elmt wind" id="c">
                            <i class="fal fa-wind"></i>
                            <label>Winds</label>
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(0deg)"
                                    width="24" height="24" viewBox="0 0 24 24">
                                    <path fill="var(--orange)"
                                        d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path>
                                </svg>
                                <span>${spin}</span>
                            </h3>
                        </div>
                    </div>
                    <p class="updated"></p>
                </div>
            </div>
            <div class="col w50">
                <div class="card" id="fcstwx">
                    <h2>24-hr Weather Concerns</h2>
                    <div class="wx p4">
                        <div class="elmt" id="b">
                            <i class="fal fa-droplet-percent"></i>
                            <label>Min. Humidity</label>
                            <h3>${spin}</h3>
                        </div>
                        <div class="elmt" id="d">
                            <i class="fal fa-wind"></i>
                            <label>Max. Wind Spd.</label>
                            <h3>${spin}</h3>
                        </div>
                        <div class="elmt" id="a">
                            <i class="fal fa-temperature-high"></i>
                            <label>Max. Temp.</label>
                            <h3>${spin}</h3>
                        </div>
                        <div class="elmt" id="c">
                            <i class="fal fa-wind"></i>
                            <label>Avg. Wind Spd.</label>
                            <h3>${spin}</h3>
                        </div>
                    </div>
                    <p class="updated"></p>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col w100">
                <div id="acres_history"></div>
            </div>
        </div>

        ${getInciweb()}

        ${social()}

        ${disclaimer()}
    </div></div>`;

    self.postMessage(content);
};