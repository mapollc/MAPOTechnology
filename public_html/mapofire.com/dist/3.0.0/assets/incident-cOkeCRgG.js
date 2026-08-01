(function(){let e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w=!0,T=new Intl.NumberFormat(`en-US`,{maximumFractionDigits:2}),E={month:`short`,day:`numeric`,year:`numeric`,hour:`numeric`,minute:`2-digit`,hour12:!0,timeZone:`America/Los_Angeles`},D=e=>T.format(e),O=e=>new Date(e*1e3).toLocaleString(`en-US`,E).replace(/(.*),\s(.*)/gm,`$1 at $2`),k=e=>e.charAt(0).toUpperCase()+e.slice(1),A=e=>{let t=e.replace(/\s/g,``);return`<div class="social">
            <i class="fab fa-facebook" title="Post on Facebook about #${t}" data-action="socialShare" data-social="fb"></i>
            <i class="fab fa-x-twitter" title="Share #${t} on X" data-action="socialShare" data-social="x"></i>
            <i class="fab fa-tiktok" title="Find #${t} on TikTok" data-action="socialShare" data-social="tt"></i>
            <i class="fal fa-share-nodes" title="Share: text, email, or copy link" data-action="sharer"></i>
        </div>`},j=()=>`<p class="disclaimer">This information is collected from various state and federal interagency dispatch centers and other official government sources.
    While we make every effort to provide accurate and up-to-date data, it may not reflect the latest conditions. Always verify with your local authorities for
    current information on evacuations, fire activity, or other critical safety alerts.</p>`,M=()=>{if(m==null)return``;let e=m.website==``?``:`<p><a target="blank" href="${m.website}">${m.website}</a></p>`;return`<div class="block">
        <h2>Dispatch Center</h2>
        <div class="card dispatch">
            <dt class="label large" style="line-height:1.3;font-weight:500">${m.name} (${m.agency})</dt>
            <dd><p style="padding-bottom:0;font-weight:100">${m.location}</p>${e}</dd>
        </div>
    </div>`},N=(e,t)=>{let n=[...new Map(e.map(e=>[e.desc,e])).values()],r=n.length,i=e=>`<div class="card">${e.map(e=>`<dt class="label">${e.desc}</dt><dd>${e.info}</dd>`).join(``)}</div>`;if(t===1)return i(n);let a=Math.ceil(r/2),o=n.slice(0,a),s=n.slice(a);return`${i(o)}${i(s)}`},P=()=>{if(C==null)return``;let e=[],t=``,n=[`Basic Information`,`Current Situation`,`Current Weather`,`Outlook`],r=[`basic`,`cursit`,`inciwx`,`otlk`];return C.photo&&(t=`<div class="col" data-width="25">
            <figure>
                <a href="https://www.mapofire.com/src/images/incident?path=${C.photo.url}" target="_blank">
                    <img loading="lazy" src="https://www.mapofire.com/src/images/incident?path=${C.photo.url}" alt="${C.photo.caption}" title="${C.photo.caption}">
                </a>
                <figcaption>${C.photo.caption}</figcaption>
            </figure>
        </div>`),e.push(`<div class="inciweb">
        ${C.incident_info==``?``:`<div class="block" id="overview">
            <h2>Incident Overview</h2>

            <div class="card row">
                <div class="col text" data-width="${C.photo?75:100}">
                    ${C.incident_info}
                </div>
                ${t}
            </div>
        </div>`}
    `),n.forEach((t,n)=>{if(C.current.data[t].length){let i=r[n]==`inciwx`||r[n]==`otlk`?1:2;e.push(`<div class="block" id="${r[n]}">
                <h2>${t}</h2>

                <div class="grid cols-${i} top-align">
                    ${N(C.current.data[t],i)}
                </div>
            </div>`)}}),C.contacts.pio&&e.push(`<div class="block">
            <h2>Public Information</h2>

            <div class="card row">
                <div class="col" data-width="100">
                    <p>${C.contacts.pio}</p>
                </div>
            </div>
        </div>`),e.length?e.join(``)+`</div>`:``},F=()=>{let e=i?.ground??{},t=i?.aircraft??{};return[{icon:`fa-house`,label:`Threatened`,value:D(i?.structures??0)},{icon:`fa-shovel`,label:`Crews`,value:e.crews??0},{icon:`fa-truck-fire`,label:`Engines`,value:e.engines??0},{icon:`fa-bulldozer`,label:`Dozers`,value:e.dozers??0},{icon:`fa-helicopter`,label:`Helicopters`,value:t.helicopters??0},{icon:`fa-plane`,label:`Planes`,value:t.fixedWing??0}].map(e=>`<div class="card">
        <dt class="label icon ${e.icon}">${e.label}</dt>
        <span ${r?``:`class="blur" `}style="font-size:20px">${r?e.value:0}</span>
    </div>`).join(``)};self.onmessage=T=>{let E=T.data.fire,N=E.json,I=T.data.role,L=T.data.vars,R=N.fire,z=R.properties;r=T.data.hasPermissions,e=L.domain,m=L.center,t=L.tracked,u=L.acres,n=L.sizeUnit,a=L.reported,o=L.updated,s=z.wfid,c=z.type,l=z.incidentId,d=R.protection.dispatch,f=R.protection,h=t.includes(parseInt(s)),g=z.containment,i=z.sitRep,_=!z.notes||z.notes==``?`None provided`:z.notes,v=!z.fuels||z.fuels==``?`None specified`:z.fuels,b=!z.resources||z.resources==``?`None reported`:z.resources,x=z.behavior?Object.values(z.behavior).join(`, `):null,y=z.cost??null,p=R.geometry?.geo.near||`N/A`,C=R.inciweb??null,S=z.cause?Object.values(z.cause).join(` / `):`Unknown`,w=!(!z.cause||z.cause.includes(`Undetermined`));let B=`${R.geometry.lat.toFixed(4)}, ${R.geometry.lon.toFixed(4)}`,V=I===`ADMIN`?`<a target="blank" href="${e}account/admin/wildfires/${d==`MAPO`?`modify`:`edit`}?wfid=${s}" style="display:inline-block;font-size:14px;color:var(--box-orange);margin-right:5px"><i class="far fa-pen-to-square"></i></a>`:``,H=!f.agency&&!f.unit?`Unknown`:(f.agency?f.agency:``)+(f.area?` &mdash; ${f.area}`:``),U=f.logo||d===`CAL FIRE`?`<img loading="lazy" class="logo" src="${e}assets/images/icons/fire/agencies/agency_${f.logo?f.logo:d==`CAL FIRE`?`calfire`:``}_logo.png" alt="${f.agency} - ${f.area} (${f.unit})" title="${f.agency} - ${f.area} (${f.unit})">`:`<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map w-3 h-3" aria-hidden="true"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path><path d="M15 5.764v15"></path><path d="M9 3.236v15"></path></svg>`,W=()=>`<span id="spinner" style="width:18px;height:18px"></span>`,G=`<div class="container">
        <div class="incident">
            ${R.time.year<new Date().getFullYear()?`<div class="archived"><i class="far fa-lock-keyhole"></i><span style="line-height:1.2">This ${c.toLowerCase()} is a historical incident and is no longer active.</span></div>`:``}
            <header>
                <div class="title">
                    <div class="tray">
                        ${V}
                        <h1>${E.fireName}</h1>
                    </div>
                    <div class="desc">
                        ${U}
                        <span>${E.geoLocate}</span>
                    </div>
                </div>
                <div class="tr">
                    <a href="#" class="btn btn-${h?`black`:`yellow`} btn-sm" onclick="return false" style="margin:0" id="trackFire" data-action="trackFire" data-mode="${h?`unfollow`:`follow`}" data-id="${s}" title="${h?`You're following this incident`:`Start following this incident`}"><i class="far fa-${h?`check`:`plus`}"></i>Follow${h?`ing`:``} this incident</a>
                </div>
            </header>

            <p class="timestamps">
                <span>Last updated <b>${o}</b></span>
                <span>Reported <b>${a.useAgo?a.ago:O(R.time.discovered)}</b></span>
                <span>Incident <b>#${l}</b></span>
            </p>

            <div class="grid cols-4 stats">
                <div class="card">
                    <dt class="label">Status</dt>
                    <span class="status ${E.status}" style="min-width:123px" title="${k(E.status)}">${E.status}</span>
                </div>
                <div class="card">
                    <dt class="label">Size</dt>
                    <p class="fire-size" data-action="copy"><span>${u}</span>${n}</p>
                </div>
                <div class="card">
                    <dt class="label">Containment</dt>
                    <div class="containment">
                        <div class="contain-bar ${g.replace(`%`,``)<50?``:`progress`}">
                            <div style="width:${g}${g==`100%`?`;border-radius:4px`:``}"></div>
                            <h3>${g}</h3>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <dt class="label">Coordinates</dt>
                    <span class="coords" data-action="copy" title="Coordinates for ${E.fireName}">${B}</span>
                </div>
            </div>

            <div class="grid cols-${z.image!=null&&!C?3:2} top-align">
                <div class="card initial">
                    <dt class="label icon fa-location-dot">Initial Location</dt>
                    <dd>${p??`N/A`}</dd>

                    <dt class="label icon fa-tower-observation">Responsible Agency</dt>
                    <dd>${H}</dd>

                    <dt class="label icon fa-notes">Dispatch Notes</dt>
                    <dd>${_}</dd>

                    <dt class="label icon fa-trees">Fuels</dt>
                    <dd>${v}</dd>
                </div>
                <div class="card initial">
                    <dt class="label icon fa-sensor-triangle-exclamation">Initial Resources</dt>
                    <dd>${b}</dd>

                    <dt class="label icon fa-wave-pulse">Fire Behavior</dt>
                    <dd>${x??`Unknown`}</dd>

                    <dt class="label icon fa-circle-dollar">Estimated Costs</dt>
                    <dd>${y==null?`Not reported`:`$${D(y)}`}</dd>
                
                    ${w?`<dt class="label icon fa-cloud-question">Cause</dt>
                    <dd>${S??`Unknown`}</dd>`:``}
                </div>
                ${z.image!=null&&!C?`<div class="card">
                    <a class="figure" target="_blank" href="../../../src/images/incident?mapo=1&path=${z.image}">
                        <img loading="lazy" class="mapoIncPhoto" src="../../../src/images/incident?mapo=1&path=${z.image}&small=1">
                    </a>
                </div>`:``}
            </div>

            <div class="grid cols-6">${F()}</div>

            <div class="grid cols-2">
                <div id="curwx" class="card">
                    <h3>Nearby Weather Conditions</h3>

                    <div class="table" data-cols="4">
                        <div id="a">
                            <i class="fal fa-temperature-high"></i>
                            <h4>${W()}</h4>
                            <dt class="label">Temperature</dt>
                        </div>
                        <div id="b">
                            <i class="fal fa-droplet-percent"></i>
                            <h4>${W()}</h4>
                            <dt class="label">Humidity</dt>
                        </div>
                        <div id="c">
                            <i class="fas fa-location-arrow" style="transform:rotate(-45deg)"></i>
                            <h4>${W()}</h4>
                            <dt class="label">Direction</dt>
                        </div>
                        <div id="d">
                            <i class="fal fa-wind"></i>
                            <h4>${W()}</h4>
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
                            <h4>${W()}</h4>
                            <dt class="label">Min. Humidity</dt>
                        </div>
                        <div id="d">
                            <i class="fal fa-wind"></i>
                            <h4>${W()}</h4>
                            <dt class="label">Max. Wind Spd.</dt>
                        </div>
                        <div id="a">
                            <i class="fal fa-temperature-high"></i>
                            <h4>${W()}</h4>
                            <dt class="label">Max. Temp.</dt>
                        </div>
                        <div id="c">
                            <i class="fal fa-wind"></i>
                            <h4>${W()}</h4>
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

            ${P()}

            ${m==null?``:M()}

            ${A(E.fireName)}

            ${j()}
        </div>
    </div>`;self.postMessage(G)}})();