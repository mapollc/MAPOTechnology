self.onmessage = (e) => {
    const wwa = e.data;
    const helpText = wwa.help.replace(/<p>(.*)<\/p>/gm, '$1');
    const help = helpText ? `<p class="help"><b>PRECAUTIONARY/PREPAREDNESS ACTIONS</b><br>${helpText}</p>` : '';
    const valid = wwa.onset ? `from <b>${wwa.onset}</b> until <b>${wwa.expires}</b>` : `until <b>${wwa.expires}</b>`;

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
                </div>
            </header>

            <p class="timestamps">
                <span>Issued <b>${wwa.issued}</b></span>
                <span>Valid ${valid}</span>
                <span>Issued by <a target="blank" href="https://weather.gov/${wwa.wfo.toLowerCase()}" title="Issued by the National Weather Service in ${wwa.office}"><b>NWS ${wwa.office}</b></a></span>
            </p>

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