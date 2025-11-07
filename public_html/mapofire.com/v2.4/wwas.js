self.onmessage = (e) => {
    const wwa = e.data,
        helptext = wwa.help.replace(/<p>(.*)<\/p>/gm, '$1'),
        help = (helptext ? '<p class="help"><b>PRECAUTIONARY/PREPAREDNESS ACTIONS</b><br>' + helptext + '</p>' : '');

    let content = `<div class="container">
        <h1 class="title" style="border-color:${wwa.color}">
            ${wwa.title}
        </h1>
        <div class="row geo">
            <div class="col fit">
                <i class="fas fa-location-dot" style="font-size:25px"></i>
            </div>
            <div class="col" id="a" style="flex:1;line-height:1.3">
                ${wwa.area}
            </div>
        </div>
        <div class="message error full no-icon" style="margin:1em 0 2em 0">
            ${wwa.headline}
        </div>
        <div class="bar">
            <p class="times">
                <span>Issued <b>${wwa.issued}</b></span>
                <span>${wwa.onset ? 'Starts' : 'Expires'} <b>${wwa.onset ? wwa.onset : wwa.expires}</b></span>
                <span>Issued by <a target="blank" href="https://weather.gov/${wwa.wfo.toLowerCase()}" title="Issued by the National Weather Service in ${wwa.office}">NWS ${wwa.office}</a></span>
            </p>
        </div>
        <div class="wwa-details">
            ${wwa.text}
            ${help}
        </div>
    </div>`;

    self.postMessage(content);
};