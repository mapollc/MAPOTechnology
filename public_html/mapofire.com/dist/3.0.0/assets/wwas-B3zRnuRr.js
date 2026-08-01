(function(){self.onmessage=e=>{let t=e.data,n=t.help.replace(/<p>(.*)<\/p>/gm,`$1`),r=n?`<p class="help"><b>PRECAUTIONARY/PREPAREDNESS ACTIONS</b><br>${n}</p>`:``,i=t.onset?`from <b>${t.onset}</b> until <b>${t.expires}</b>`:`until <b>${t.expires}</b>`,a=`<div class="container">
        <div class="wwa">
            <header>
                <div class="title">
                    <div class="tray">
                        <h1>${t.title}</h1>
                    </div>
                    <div class="desc">
                        <i class="fas fa-location-dot"></i>
                        <span>${t.area}</span>
                    </div>
                </div>
            </header>

            <p class="timestamps">
                <span>Issued <b>${t.issued}</b></span>
                <span>Valid ${i}</span>
                <span>Issued by <a target="blank" href="https://weather.gov/${t.wfo.toLowerCase()}" title="Issued by the National Weather Service in ${t.office}"><b>NWS ${t.office}</b></a></span>
            </p>

            <div class="headline">
                ${t.headline}
            </div>

            <div class="block">
                <div class="card row">
                    <div class="col wwa-details" data-width="100">
                        ${t.text}
                    </div>
                </div>

                <div class="card row" style="margin-top:calc(var(--spacing) * 1)">
                    <div class="col wwa-details" data-width="100">
                        ${r}
                    </div>
                </div>
            </div>
        </div>
    </div>`;self.postMessage(a)}})();