import { ENV, config } from '../app/config.js';
import { global, modal, createCSReport } from '../app/state.js';

import * as helper from '../utils/helpers.js';

export class Tooltips {
    constructor(options = {}) {
        this.nav = document.querySelector('nav');
        this.tooltipEl = document.createElement("div");
        this.tooltipEl.className = "tooltip";
        document.body.appendChild(this.tooltipEl);

        this.activeTitle = null;
        this.activeTarget = null;
        this.offset = options.offset || 8;
        this.followMouse = options.followMouse || false;
    }

    show(targetEl, content, event) {
        if (!targetEl || (targetEl.closest('li') && !this.nav.classList.contains('hide'))) return;

        this.tooltipEl.textContent = content;

        this.tooltipEl.style.top = "0px";
        this.tooltipEl.style.left = "-9999px";
        this.tooltipEl.classList.add("show");

        const rect = targetEl.getBoundingClientRect(),
            scrollY = window.scrollY || window.pageYOffset,
            scrollX = window.scrollX || window.pageXOffset,
            tooltipWidth = this.tooltipEl.offsetWidth,
            tooltipHeight = this.tooltipEl.offsetHeight,
            space = {
                top: rect.top,
                bottom: window.innerHeight - rect.bottom,
                left: rect.left,
                right: window.innerWidth - rect.right
            };

        let top, left;
        let arrowClass = '';

        if (this.followMouse && event) {
            top = event.pageY + this.offset;
            left = event.pageX - tooltipWidth / 2;
            arrowClass = '';
        } else {
            const sideThreshold = 150; // px from left/right edges to force horizontal placement

            // LEFT/RIGHT only if element is near viewport edges
            if (rect.left < sideThreshold && space.right >= tooltipWidth + this.offset) {
                // place to right
                top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + scrollX + this.offset;
                arrowClass = 'left';
            } else if (rect.right > window.innerWidth - sideThreshold && space.left >= tooltipWidth + this.offset) {
                // place to left
                top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
                left = rect.left + scrollX - tooltipWidth - this.offset;
                arrowClass = 'right';
            } else if (space.top >= tooltipHeight + this.offset) {
                // place above
                top = rect.top + scrollY - tooltipHeight - this.offset;
                left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
                arrowClass = 'down';
            } else if (space.bottom >= tooltipHeight + this.offset) {
                // place below
                top = rect.bottom + scrollY + this.offset;
                left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
                arrowClass = 'up';
            } else {
                // fallback above
                top = rect.top + scrollY - tooltipHeight - this.offset;
                left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
                arrowClass = 'down';
            }

            // Clamp horizontal/vertical
            if (left < 0) left = 0;
            if (left + tooltipWidth > window.innerWidth)
                left = window.innerWidth - tooltipWidth;
            if (top < 0) top = 0;
            if (top + tooltipHeight > window.innerHeight)
                top = window.innerHeight - tooltipHeight;
        }

        this.activeTarget.removeAttribute('title');
        this.tooltipEl.style.top = `${top}px`;
        this.tooltipEl.style.left = `${left}px`;
        this.tooltipEl.className = `tooltip show ${arrowClass}${targetEl.classList.contains('light') ? ' light' : ''}`;
    }

    hide() {
        this.tooltipEl.classList.remove('show');
    }

    attach(selector, getContent) {
        document.querySelectorAll(selector).forEach(_ => {
            document.addEventListener('mouseover', (e) => {
                const target = e.target.closest(selector);
                if (!target || this.activeTarget === target) return;
                this.activeTarget = target;
                this.activeTitle = target.title;
                this.show(target, getContent(target), e);
            });

            document.addEventListener('mousemove', (e) => {
                if (!this.followMouse || !this.activeTarget) return;
                this.show(this.activeTarget, getContent(this.activeTarget), e);
            });

            document.addEventListener('mouseout', (e) => {
                const target = e.target.closest(selector);
                if (!target || target !== this.activeTarget) return;
                this.hide();
                this.activeTarget.title = this.activeTitle;
                this.activeTitle = null;
                this.activeTarget = null;
            });
        });
    }
}

export function purchaseLink(utm, next = null) {
    if (config.settings.subscriptions().valid() && config.TIERS[config.settings.subscriptions().plan()] == config.PERMISSION_LEVELS.PREMIUM) {
        return `${ENV.domain}account/billing#upgrade=true&sid=${config.settings.subscriptions().subID()}`;
    } else {
        return `${ENV.domain}purchase/mapofire${(utm ? `?utm_campaign=Locked%20Features&utm_source=mapofire&utm_medium=${utm}` : '')}${(next ? '&next=' + next : '')}`;
    }
}

export function notify(t, m, time = 0) {
    const timing = time === 0 ? (((m.split(' ').length / 5) + 0.5) * 1000) + 500 : time * 1000,
        el = document.createElement('div'),
        icon = t == 'success' ? 'fa-check' : (t == 'info' ? 'fa-circle-info' : 'fa-circle-exclamation');

    document.querySelector('div.alert')?.remove();

    el.classList.add('alert', t);

    if (modal.classList.contains('open')) el.classList.add('mo');

    el.style.display = 'flex';
    el.innerHTML = `<i class="fas ${icon}"></i><p>${m}</p>`;
    document.body.append(el);

    setTimeout(() => { el.remove(); }, timing);
}

export function marketing(override = false, utm = null, pick = null) {
    // Centralized marketing timing configuration.
    const DEFAULT_COOLDOWN_DAYS = 3;
    const MAX_COOLDOWN_DAYS = 14;
    const MAX_DISMISSALS = 4;
    const DAY = 24 * 60 * 60 * 1000;

    const now = Date.now();
    const user = config.settings.getUser();
    const userRole = user.role();

    // Read persisted marketing state in one place.
    let lastShown = parseInt(helper.storage('mapofire.marketing.last_shown') || '0', 10);
    let dismissedCount = parseInt(helper.storage('mapofire.marketing.dismiss_count') || '0', 10);
    let cooldownDays = parseInt(helper.storage('mapofire.marketing.cooldown_days') || DEFAULT_COOLDOWN_DAYS, 10);

    // -------------------------------------------------------------------------
    // Determine whether the popup should be shown
    // -------------------------------------------------------------------------

    if (!override && cooldownDays >= MAX_COOLDOWN_DAYS && lastShown > 0 && now - lastShown >= MAX_COOLDOWN_DAYS * DAY) {
        cooldownDays = DEFAULT_COOLDOWN_DAYS;
        dismissedCount = 0;

        helper.storage('mapofire.marketing.cooldown_days', cooldownDays);
        helper.storage('mapofire.marketing.dismiss_count', dismissedCount);
    }

    if (!override) {
        // Never show normal marketing popups to admin/licensee users.
        if (userRole === config.PERMISSION_LEVELS.ADMIN || userRole === config.PERMISSION_LEVELS.LICENSEE) {
            return;
        }

        // Only show once per browser session.
        if (sessionStorage.getItem('mapofire.modal_shown_this_session')) {
            return;
        }

        // Enforce the current cooldown period.
        if (lastShown > 0 && now - lastShown < cooldownDays * DAY) {
            return;
        }
    } else {
        // Explicit overrides are allowed to show again this session.
        sessionStorage.removeItem('mapofire.modal_shown_this_session');
    }

    const variants = {
        A: {
            title: 'Stay Safe. Stay Ahead.',
            text: 'Wildfires don\'t wait and neither should you. Upgrade to gain access to satellite hotspots, smoke models, and wildfire risk overlays.',
            primary: 'Start 7-Day Free Trial',
            secondary: config.settings.user != null ? 'Continue for Free' : 'Continue with Free Plan'
        },
        B: {
            title: 'Unlock Pro Insights.',
            text: 'Make faster, smarter wildfire decisions with advanced fire mapping, premium layers, extra basemaps, and offline access on Android.',
            primary: 'Upgrade Now',
            secondary: 'Keep Free Plan'
        },
        C: {
            title: 'Access Premium Wildfire Tools',
            text: 'Gain access to historical wildfires, fire weather forecasts, premium layers, and additional basemaps. Upgrade now or start a free 7-day trial.',
            primary: 'Start 7-Day Free Trial',
            secondary: config.settings.user != null ? 'Continue for Free' : 'Continue with Free Plan'
        },
        D: {
            title: 'Help Us Keep Map of Fire Available.',
            text: "We're a couple local guys in the western U.S. mountains building Map of Fire to help people stay informed when wildfires threaten their communities. Your donation helps pay for the data, servers, and technology behind the service and keeps it available to everyone!",
            primary: 'Support Our Mission',
            secondary: 'No, thank you'
        }
    };
    pick = pick ?? ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
    const option = variants[pick];

    const content = `<p style="text-align:center;margin:1.5em 0;font-size:18px;color:#252525;font-weight:400">${option.text}</p>
        <div class="btn-group no-margin" style="width:100%;justify-content:space-between">
            <input type="button" id="donate_cta" class="btn btn-red dn" value="${option.primary}" data-variant="${pick}" data-action="start-modal-checkout">
            <input type="button" id="donate_dismiss" class="btn btn-gray dn" value="${option.secondary}" data-dismissedCount="${dismissedCount}" data-variant="${pick}" data-action="close-modal-checkout">
        </div>`;

    const el = document.createElement('div');
    el.classList.add('shadow');
    document.body.appendChild(el);

    helper.createDataForm(option.title, content);

    const df = document.querySelector('#data-form');
    const h1 = df.querySelector('h1');

    df.classList.add('bg');
    h1.style.textAlign = 'center';
    h1.insertAdjacentHTML('beforebegin', `<i class="fad fa-${pick == 'D' ? 'hands-holding-dollar' : 'user-unlock'}" style="display:block;width:100%;text-align:center;font-size:50px;color:#ffcd82;margin-bottom:0.5em"></i>`);

    // mark as shown
    sessionStorage.setItem('mapofire.modal_shown_this_session', '1');
    helper.storage('mapofire.marketing.last_shown', now.toString());

    // postive CTA
    document.querySelector('#donate_cta').addEventListener('click', () => {
        gtag('event', 'subscription_cta_click', {
            'event_category': 'Subscription',
            'event_label': `Variant_${pick}`,
            'source': override ? 'embed' : 'modal',
            'variant': pick
        });

        window.location.href = pick == 'D'
            ? `https://donate.stripe.com/3csg1F7PF8gpfni003${config.settings.getUser().email() ? `?prefilled_email=${encodeURIComponent(config.settings.getUser().email())}` : ''}`
            : purchaseLink(utm ? utm : 'popup');

        global.inits.clickListener.closeDataForm();
    });

    // dismiss CTA
    document.querySelector('#donate_dismiss').addEventListener('click', () => {
        dismissedCount++;

        if (dismissedCount >= MAX_DISMISSALS) {
            cooldownDays = Math.min(cooldownDays * 2, MAX_COOLDOWN_DAYS);

            dismissedCount = 0;

            helper.storage('mapofire.marketing.cooldown_days', cooldownDays);
        }

        helper.storage('mapofire.marketing.dismiss_count', dismissedCount);

        gtag('event', 'subscription_dismiss_click', {
            'event_category': 'Subscription',
            'event_label': `Variant_${pick}`,
            'source': override ? 'embed' : 'modal',
            'variant': pick
        });

        global.inits.clickListener.closeDataForm();
    });
}

export async function startReportProcess(e) {
    let data = null;

    // query the map for the county and state first before requesting from the API
    global.map.queryRenderedFeatures(e.point)?.forEach(feat => {
        if (feat.layer.id == 'counties') {
            data = { geocode: { county: { county: feat.properties.NAME.replace(' County', '') }, state: feat.properties.STATE } };
        }
    });

    // geocode the location via the API
    helper.api(`${ENV.apiURL}geocode/incident${(data != null ? '/near' : '')}`, [['lat', e.lngLat.lat], ['lon', e.lngLat.lng]], true)
        .then(res => {
            if (data == null) {
                data = { geocode: res.geocode };
            } else {
                data.geocode['near'] = res.geocode?.near ?? null;
            }

            createCSReport(data, e.lngLat.lat, e.lngLat.lng);
        });

    helper.createDataForm('Report an incident', `<form id="newReport" method="post">
        <input type="hidden" name="platform" value="web">
        <input type="hidden" name="authUser" value="0">
        <input type="hidden" name="lat">
        <input type="hidden" name="lon">
        <input type="hidden" name="state">
        <input type="hidden" name="version" value="${VERSION}">
        <input type="hidden" name="geolocation">
        
        <div style="display:inline-flex;width:100%;align-items:flex-start;gap:1em">
            <div style="width:50%">
                <label>County</label>
                <input type="text" id="gc" value="Loading..." disabled>
            </div>
            <div style="width:50%">
                <label>State</label>
                <input type="text" id="gs" value="Loading..." disabled>
            </div>
        </div>

        <label>Estimated Location</label>
        <input type="text" id="gl" value="Loading..." disabled>
        
        <label>What type of incident is this?</label>
        <select name="type" required>
            <option>- Choose -</option>
            <option value="Wildfire">Wildfire</option>
            <option value="Smoke Check">Smoke Check</option>
        </select>

        <label>How big is it?</label>
        <input type="number" name="size" placeholder="0" min="0" max="10000" style="display:inline-block;max-width:90px" required>
        <div id="alab" style="display:inline-block;padding-left:5px">acres</div>
        
        <label>Brief description of incident:</label>
        <textarea name="notes" placeholder="Anything else you can add..." style="min-height:100px;resize:none" required></textarea>
        
        <div class="btn-group centered" style="margin-bottom:0">
            <input type="submit" class="btn btn-green" value="Submit Report">
            <a class="btn btn-gray" href="#" data-action="close-data-form" onclick="return false">Cancel</a>
        </div>
        <div class="disclaimer">Submitting this report only sends information to the ${config.productName} team&mdash;it does not send
        any information to emergency resources. Please call 9-1-1 to report a new wildfire. By submitting a report,
        you agree to our <a target="blank" href="//mapotechnology.com/about/legal/terms">Terms of Service</a>.</div>
    </form>`);
}