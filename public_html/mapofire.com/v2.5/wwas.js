self.onmessage = (e) => {
    let valid = '';
    const wwa = e.data,
        helptext = wwa.help.replace(/<p>(.*)<\/p>/gm, '$1'),
        help = (helptext ? '<p class="help"><b>PRECAUTIONARY/PREPAREDNESS ACTIONS</b><br>' + helptext + '</p>' : '');
        
    if (wwa.onset) {
        valid = `from <b>${wwa.onset}</b> until <b>${wwa.expires}</b>`;
    } else {
        valid = `until <b>${wwa.expires}</b>`;
    }

    let content = `<div class="container">
        <div class="wwa">
            <header>
                <div class="title">
                    <div class="tray">
                        <h1>${wwa.title}</h1>
                    </div>
                    <div class="desc">
                        <i class="fas fa-location-dot"></i>
                        <span>${wwa.area}</span>
                    </div>

                    <p class="timestamps">
                        Issued <b>${wwa.issued}</b> &middot; Valid ${valid} &middot; Issued by <a target="blank" href="https://weather.gov/${wwa.wfo.toLowerCase()}" title="Issued by the National Weather Service in ${wwa.office}"><b>NWS ${wwa.office}</b></a>
                    </p>
                </div>
            </header>

            <div class="headline">
                ${wwa.headline}
            </div>

            <div class="block">
                <div class="card row">
                    <div class="col wwa-details" data-width="100">
                        ${wwa.text}
                    </div>
                </div>

                <div class="card row" style="margin-top:calc(var(--spacing) * 1)">
                    <div class="col wwa-details" data-width="100">
                        ${help}
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    self.postMessage(content);
};