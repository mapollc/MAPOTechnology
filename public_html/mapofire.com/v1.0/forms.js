var fireDisplay,
    loadingPopup,
    wwaTemplate,
    spcTemplate,
    riskTemplate,
    stateLabels,
    nwsFireFcst,
    wwaColors,
    newReport,
    userSettingsForm,
    donateForm,
    disclaimer = 'This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.';
/*loginForm,
createForm,
forgotForm;*/

const mappings = new Map();

const roles = {
    ADMIN: "ADMIN",
    PREMIUM: "PREMIUM",
    GUEST: "GUEST"
};

const actions = {
    VIEW_LAYERS: "VIEW_LAYERS",
    PREMIUM_LAYERS: "PREMIUM_LAYERS",
    PREMIUM_BASEMAPS: "PREMIUM_BASEMAPS",
    PREMIUM_DATA: "PREMIUM_DATA",
    USE_TOOLS: "USE_TOOLS",
    CHARTS: "CHARTS",
    ADMIN: "ADMIN",
    PREMIUM_WEATHER: "WEATHER",
    CHANGE_VERSION: "CHANGE_VERSION"
};

mappings.set(actions.VIEW_LAYERS, [roles.ADMIN, roles.PREMIUM, roles.GUEST]);
mappings.set(actions.PREMIUM_LAYERS, [roles.ADMIN, roles.PREMIUM]);
mappings.set(actions.PREMIUM_BASEMAPS, [roles.ADMIN, roles.PREMIUM]);
mappings.set(actions.USE_TOOLS, [roles.ADMIN, roles.PREMIUM]);
mappings.set(actions.PREMIUM_DATA, [roles.ADMIN, roles.PREMIUM]);
mappings.set(actions.CHARTS, [roles.ADMIN, roles.PREMIUM]);
mappings.set(actions.PREMIUM_WEATHER, [roles.ADMIN, roles.PREMIUM]);
mappings.set(actions.ADMIN, [roles.ADMIN]);
mappings.set(actions.CHANGE_VERSION, [roles.ADMIN]);

const layerDesc = {
    'fire': [
        'New wildfires in the last 12 hours',
        'All wildfire incidents',
        'Non-wildfire, smoke checks reported to dispatch centers',
        'Active or planned prescribed burns',
        'Show latest, active mapped wildfire perimeters (some fires only)',
        'See hotspots in the last 24 hours',
        'See hotspots over the last 48 hours',
        'See hotspots over the last 72 hours'
    ],
    'wx': [
        'See current air quality conditions from the EPA',
        'Overlay lightning strikes within the last hour',
        'Overlay lightning strikes from the last 24 hours',
        'View current weather alerts from the NWS',
        'Review current severe & fire outlooks from the SPC',
        'Read the technical fire weather forecast from the NWS',
        'See current weather obs at remote automatic weather stations (RAWS)',
        'See radar imagery from the last 2 hours',
        'Visualize various weather forecast models',
        'Visible satellite imagery',
        'Infrared satellite imagery',
        'Water vapor satellite imagery'
    ],
    'plan': [
        'See current national fire danger (NFDRS)',
        'Show significant fire potential outlooks',
        'See each county\'s wildfire risk based on annual loos, vulnerability & resilience',
        'Overlay wildfire risk to homes model',
        'Overlay wildfire supression difficulty model',
        'Overlay current drought conditions',
        'See ERC charts for predictive service areas (PSA)',
        'Overlay fuel/vegatation LANDFIRE model',
    ],
    'gis': [
        'Overlay counties boundaries',
        'Show USFS national forest & wilderness boundaries',
        'Show USFS road network',
        'Show federal land ownership',
        'Overlay TRS boundaries',
        'Show interagency dispatch center boundaries',
        'Show national Geographic Area Coordination Centers (GACCs)'
    ],
    'smoke': [
        'See HRRR near-surface smoke models',
        'See HRRR vertically integrated smoke models'
    ],
    'cdf': [
        'Overlay administrative unit boundaries',
        'Overlay fire hazard severity zones (FHSZ)'
    ]
};

const risk = {
    'whp': [
        ['N/A', '#fff'],
        ['Very Low', '#38a800'],
        ['Low', '#d1ff73'],
        ['Moderate', '#ffff00'],
        ['High', '#ffaa00'],
        ['Very High', '#ff0000']
    ]
};

const legend = {
    'categories': [
        { 'fire': 'Wildfires' },
        { 'modis': 'MODIS Hotspots' },
        { 'drought': 'Drought Conditions' },
        { 'nfdrs': 'Fire Danger' },
        { 'sfp': 'Sig. Fire Potential' },
        { 'burnProb': 'Burn Probability' },
        { 'fhsz': 'CAL FIRE FHSZ' },
        { 'lands': 'Federal Lands' },
        { 'rth': 'Wildfire Risk to Homes' },
        { 'whp': 'Wildfire Hazard Potential' },
        { 'nri': 'FEMA Wildfire Risk Index' }
    ],
    'items': {
        'fire': [
            ['icon', '<div class="fire-icon new"><i class="fas fa-fire"></i></div>', '', 'New Fire'],
            ['icon', '<div class="fire-icon new fast"><i class="fas fa-fire"></i></div>', '', 'Fast Growing Fire'],
            ['icon', '<div class="fire-icon"><i class="fas fa-fire"></i></div>', '', 'Active Fire (0-100 acres)'],
            ['icon', '<div class="fire-icon big"><i class="fas fa-fire"></i></div>', '', 'Active Fire (100-1K acres)'],
            ['icon', '<div class="fire-icon large"><i class="fas fa-fire"></i></div>', '', 'Active Fire (>1K acres)'],
            ['icon', '<div class="fire-icon contain"><i class="fas fa-fire"></i></div>', '', 'Contained Fire'],
            ['icon', '<div class="fire-icon controlled"><i class="fas fa-fire"></i></div>', '', 'Controlled Fire'],
            ['icon', '<div class="fire-icon rx"><i class="fas fa-prescription"></i></div>', '', 'Prescribed Burn'],
            ['icon', '<div class="fire-icon smkchk"><i class="fas fa-fire"></i></div>', '', 'Smoke Check']
        ],
        'modis': [
            ['icon', '<div class="modis t12"><i class="fas fa-times"></i></div>', '', 'Heat Detection (0-12 hrs)'],
            ['icon', '<div class="modis t24"><i class="fas fa-times"></i></div>', '', 'Heat Detection (12-24 hrs)'],
            ['icon', '<div class="modis t36"><i class="fas fa-times"></i></div>', '', 'Heat Detection (24-36 hrs)'],
            ['icon', '<div class="modis t48"><i class="fas fa-times"></i></div>', '', 'Heat Detection (36-48 hrs)'],
            ['icon', '<div class="modis t72"><i class="fas fa-times"></i></div>', '', 'Heat Detection (48-72 hrs)'],
        ],
        'nfdrs': [
            ['color', '', '#3db471', 'Low'],
            ['color', '', '#00ff00', 'Moderate'],
            ['color', '', '#ffff00', 'High'],
            ['color', '', '#ff8b00', 'Very High'],
            ['color', '', '#b31f1f', 'Extreme'],
        ],
        'sfp': [
            ['color', '', '#85ca0a', 'Little or No Risk'],
            ['color', '', '#ffff00', 'Low Risk'],
            ['color', '', '#ad7c23', 'Moderate Risk'],
            ['color', 'D', '#ff9900', 'Dry'],
            ['color', 'W', '#ff9900', 'Hot & Dry'],
            ['color', 'H', '#ff9900', 'Hot'],
            ['color', 'U', '#ff9900', 'Unstable'],
            ['color', 'L', '#f00', 'Lightning'],
            ['color', 'R', '#f00', 'Recreation'],
            ['color', 'B', '#f00', 'Burn Environment']
        ],
        'burnProb': [
            ['color', '', '#fff0cf', '0-0.01%'],
            ['color', '', '#fddcaf', '0.01-0.02%'],
            ['color', '', '#fdca94', '0.02-0.05%'],
            ['color', '', '#fdb27b', '0.05-0.1%'],
            ['color', '', '#fc8d59', '0.1-0.2%'],
            ['color', '', '#f26d4b', '0.2-.05%'],
            ['color', '', '#e1452f', '0.5-1%'],
            ['color', '', '#c91d13', '1-2.2%'],
            ['color', '', '#a90000', '2.2-4.5%'],
            ['color', '', '#7f0000', '4.5-12.5%']
        ],
        'fhsz': [
            ['color', '', '#ffffba', 'Moderate'],
            ['color', '', '#ffe9bf', 'High'],
            ['color', '', '#ffdfdf', 'Very High']
        ],
        'nri': [
            ['color', '', '#4d6dbd', 'Very Low'],
            ['color', '', '#509bc7', 'Relatively Low'],
            ['color', '', '#f0d55d', 'Relatively Moderate'],
            ['color', '', '#e07069', 'Relatively High'],
            ['color', '', '#c7445d', 'Very High'],
            ['color', '', '#fff', 'No Rating'],
            ['color', '', '#9e9e9e', 'Insufficient Data'],
        ],
        'lands': [
            ['color', '', '#fcb5ce', 'Department of Defense'],
            ['color', '', '#fee67a', 'Bureau of Land Mgmt'],
            ['color', '', '#cabddd', 'National Park Service'],
            ['color', '', '#cdecc5', 'US Forest Service'],
            ['color', '', '#7fcda7', 'US Fish & Wildlife Service'],
            ['color', '', '#ffffb4', 'Bureau of Reclamation'],
            ['color', '', '#fdb56b', 'Bureau of Indian Affairs'],
            ['color', '', '#e4c4a0', 'Other Federal'],
            ['color', '', '#b4e3ef', 'State']
        ],
        'rth': [
            ['color', '', '#fff', '0 percentile'],
            ['color', '', '#f1f2a0', '0-40th percentile'],
            ['color', '', '#f2c13c', '40-70th percentile'],
            ['color', '', '#f28017', '70-90th percentile'],
            ['color', '', '#f21900', '90-95th percentile'],
            ['color', '', '#c4001a', '95-100th percentile'],
        ],
        'whp': [
            ['color', '', '#37a300', 'Very Low'],
            ['color', '', '#a3ff94', 'Low'],
            ['color', '', '#ffff63', 'Moderate'],
            ['color', '', '#ffa300', 'High'],
            ['color', '', '#ee1900', 'Very High'],
            ['color', '', '#e1e1e1', 'Non-burnable'],
            ['color', '', '#006fff', 'Water'],
        ],
        'drought': [
            ['color', '', '#ffff00', 'Abnormally Dry'],
            ['color', '', '#ffcc99', 'Moderate Drought'],
            ['color', '', '#ff6600', 'Severe Drought'],
            ['color', '', '#ff0000', 'Extreme Drought'],
            ['color', '', '#660000', 'Exceptional Drought']
        ]
    }
};

function stateCenter(s) {
    var mc = [],
        st = s.replaceAll('-', ' ').toLowerCase();

    switch (st) {
        case 'alabama': mc = [33.2588817, -86.8295337]; break;
        case 'alaska': mc = [64.4459613, -149.680909]; break;
        case 'arizona': mc = [34.395342, -111.7632755]; break;
        case 'arkansas': mc = [35.2048883, -92.4479108]; break;
        case 'california': mc = [36.7014631, -118.7559974]; break;
        case 'colorado': mc = [38.7251776, -105.6077167]; break;
        case 'connecticut': mc = [41.6500201, -72.7342163]; break;
        case 'delaware': mc = [38.6920451, -75.4013315]; break;
        case 'district of columbia': mc = [38.8948932, -77.0365529]; break;
        case 'florida': mc = [27.7567667, -81.4639835]; break;
        case 'georgia': mc = [32.3293809, -83.1137366]; break;
        case 'hawaii': mc = [21.2160437, -157.975203]; break;
        case 'idaho': mc = [45.61788, -114.74121]; break;
        case 'illinois': mc = [40.0796606, -89.4337288]; break;
        case 'indiana': mc = [40.3270127, -86.1746933]; break;
        case 'iowa': mc = [41.9216734, -93.3122705]; break;
        case 'kansas': mc = [38.27312, -98.5821872]; break;
        case 'kentucky': mc = [37.5726028, -85.1551411]; break;
        case 'louisiana': mc = [30.8703881, -92.007126]; break;
        case 'maine': mc = [45.709097, -68.8590201]; break;
        case 'maryland': mc = [39.5162234, -76.9382069]; break;
        case 'massachusetts': mc = [42.3788774, -72.032366]; break;
        case 'michigan': mc = [43.6211955, -84.6824346]; break;
        case 'minnesota': mc = [45.9896587, -94.6113288]; break;
        case 'mississippi': mc = [32.9715645, -89.7348497]; break;
        case 'missouri': mc = [38.7604815, -92.5617875]; break;
        case 'montana': mc = [47.3752671, -109.6387579]; break;
        case 'nebraska': mc = [41.7370229, -99.5873816]; break;
        case 'nevada': mc = [39.5158825, -116.8537227]; break;
        case 'new hampshire': mc = [43.4849133, -71.6553992]; break;
        case 'new jersey': mc = [40.0757384, -74.4041622]; break;
        case 'new mexico': mc = [34.5708167, -105.993007]; break;
        case 'new york': mc = [40.7127281, -74.0060152]; break;
        case 'north carolina': mc = [35.6729639, -79.0392919]; break;
        case 'north dakota': mc = [47.6201461, -100.540737]; break;
        case 'ohio': mc = [40.2253569, -82.6881395]; break;
        case 'oklahoma': mc = [34.9550817, -97.2684063]; break;
        case 'oregon': mc = [43.9792797, -120.737257]; break;
        case 'pennsylvania': mc = [40.9699889, -77.7278831]; break;
        case 'rhode island': mc = [41.7962409, -71.5992372]; break;
        case 'south carolina': mc = [33.6874388, -80.4363743]; break;
        case 'south dakota': mc = [44.6471761, -100.348761]; break;
        case 'tennessee': mc = [35.7730076, -86.2820081]; break;
        case 'texas': mc = [31.8160381, -99.5120986]; break;
        case 'utah': mc = [39.4225192, -111.7143584]; break;
        case 'vermont': mc = [44.5990718, -72.5002608]; break;
        case 'virginia': mc = [37.1232245, -78.4927721]; break;
        case 'washington': mc = [47.75107, -120.74014]; break;
        case 'west virginia': mc = [38.4758406, -80.8408415]; break;
        case 'wisconsin': mc = [44.4308975, -89.6884637]; break;
        case 'wyoming': mc = [43.1700264, -107.5685348]; break;
    }
    return mc;
}

const agencies = {
    'US Forest Service': 'USFS',
    'Bureau of Land Management': 'BLM',
    'Bureau of Indian Affairs': 'BIA',
    'National Park Service': 'NPS',
    'Bureau of Reclamation': 'BOR',
    'US Fish & Wildlife Service': 'USFWS',
    'Oregon Department of Forestry': 'ODF',
    'Department of Natural Resources': 'DNR',
    'Idaho Department of Lands': 'IDL',
    'California Department of Forestry & Fire Protection': 'CAL FIRE',
    'California Department of Forestry and Fire Protection': 'CAL FIRE'
};

stateLabels = {
    'AB': 'Alberta',
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'BC': 'British Columbia',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District of Columbia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'MB': 'Manitoba',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NB': 'New Brunswick',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NL': 'Newfoundland',
    'NM': 'New Mexico',
    'NS': 'Nova Scotia',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'ON': 'Ontario',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'SK': 'Saskatchewan',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
};

wwaColors = {
    '911 Telephone Outage': '#bfbfbf',
    'Administrative Message': '#fefefe',
    'Air Quality Alert': '#7f7f7f',
    'Air Stagnation Advisory': '#7f7f7f',
    'Arroyo and Small Stream Flood Advisory': '#00fe7e',
    'Ashfall Advisory': '#686868',
    'Ashfall Warning': '#a8a8a8',
    'Avalanche Advisory': '#cc843e',
    'Avalanche Warning': '#1d8ffe',
    'Avalanche Watch': '#f3a35f',
    'Beach Hazards Statement': '#3fdfcf',
    'Blizzard Warning': '#fe4400',
    'Blizzard Watch': '#acfe2e',
    'Blowing Dust Advisory': '#bcb66a',
    'Brisk Wind Advisory': '#d7bed7',
    'Child Abduction Emergency': '#fed600',
    'Civil Danger Warning': '#feb5c0',
    'Civil Emergency Message': '#feb5c0',
    'Coastal Flood Advisory': '#7bfb00',
    'Coastal Flood Statement': '#6a8d22',
    'Coastal Flood Warning': '#218a21',
    'Coastal Flood Watch': '#65cca9',
    'Dense Fog Advisory': '#6f7f8f',
    'Dense Smoke Advisory': '#efe58b',
    'Dust Storm Warning': '#fee3c3',
    'Earthquake Warning': '#8a4412',
    'Evacuation - Immediate': '#7efe00',
    'Excessive Heat Warning': '#c61484',
    'Excessive Heat Watch': '#7f0000',
    'Extreme Cold Warning': '#0000fe',
    'Extreme Cold Watch': '#0000fe',
    'Extreme Fire Danger': '#e89579',
    'Extreme Wind Warning': '#fe8b00',
    'Fire Warning': '#9f512c',
    'Fire Weather Watch': '#feddac',
    'Flash Flood Statement': '#8a0000',
    'Flash Flood Warning': '#8a0000',
    'Flash Flood Watch': '#2d8a56',
    'Flood Advisory': '#00fe7e',
    'Flood Statement': '#00fe00',
    'Flood Warning': '#00fe00',
    'Flood Watch': '#2d8a56',
    'Freeze Warning': '#473c8a',
    'Freeze Watch': '#00fefe',
    'Freezing Fog Advisory': '#007f7f',
    'Freezing Rain Advisory': '#d96fd5',
    'Freezing Spray Advisory': '#00befe',
    'Frost Advisory': '#6394ec',
    'Gale Warning': '#dc9fdc',
    'Gale Watch': '#febfca',
    'Hard Freeze Warning': '#9300d2',
    'Hard Freeze Watch': '#4068e0',
    'Hazardous Materials Warning': '#4a0081',
    'Hazardous Seas Warning': '#d7bed7',
    'Hazardous Seas Watch': '#473c8a',
    'Hazardous Weather Outlook': '#ede7a9',
    'Heat Advisory': '#fe7e4f',
    'Heavy Freezing Spray Warning': '#00befe',
    'Heavy Freezing Spray Watch': '#bb8e8e',
    'High Surf Advisory': '#b954d2',
    'High Surf Warning': '#218a21',
    'High Wind Warning': '#d9a41f',
    'High Wind Watch': '#b7850a',
    'Hurricane Force Wind Warning': '#cc5b5b',
    'Hurricane Force Wind Watch': '#9831cb',
    'Hurricane Local Statement': '#fee3b4',
    'Hurricane Warning': '#db133b',
    'Hurricane Watch': '#fe00fe',
    'Hydrologic Advisory': '#00fe7e',
    'Hydrologic Outlook': '#8fed8f',
    'Ice Storm Warning': '#8a008a',
    'Lake Effect Snow Advisory': '#47d0cb',
    'Lake Effect Snow Warning': '#008a8a',
    'Lake Effect Snow Watch': '#86cdf9',
    'Lake Wind Advisory': '#d1b38b',
    'Lakeshore Flood Advisory': '#7bfb00',
    'Lakeshore Flood Statement': '#6a8d22',
    'Lakeshore Flood Warning': '#218a21',
    'Lakeshore Flood Watch': '#65cca9',
    'Law Enforcement Warning': '#bfbfbf',
    'Local Area Emergency': '#bfbfbf',
    'Low Water Advisory': '#a42929',
    'Marine Weather Statement': '#feeed4',
    'Nuclear Power Plant Warning': '#4a0081',
    'Radiological Hazard Warning': '#4a0081',
    'Red Flag Warning': '#fe1392',
    'Rip Current Statement': '#3fdfcf',
    'Severe Thunderstorm Warning': '#fea400',
    'Severe Thunderstorm Watch': '#da6f92',
    'Severe Weather Statement': '#00fefe',
    'Shelter In Place Warning': '#f97f71',
    'Short Term Forecast': '#97fa97',
    'Small Craft Advisory': '#d7bed7',
    'Small Craft Advisory For Hazardous Seas': '#d7bed7',
    'Small Craft Advisory For Rough Bar': '#d7bed7',
    'Small Craft Advisory For Winds': '#d7bed7',
    'Small Stream Flood Advisory': '#00fe7e',
    'Special Marine Warning': '#fea400',
    'Special Weather Statement': '#fee3b4',
    'Storm Warning': '#9300d2',
    'Storm Watch': '#fee3b4',
    'Test': '#effefe',
    'Tornado Warning': '#fe0000',
    'Tornado Watch': '#fefe00',
    'Tropical Depression Local Statement': '#fee3b4',
    'Tropical Storm Local Statement': '#fee3b4',
    'Tropical Storm Warning': '#b12121',
    'Tropical Storm Watch': '#ef7f7f',
    'Tsunami Advisory': '#d1681d',
    'Tsunami Warning': '#fc6246',
    'Tsunami Watch': '#fe00fe',
    'Typhoon Local Statement': '#fee3b4',
    'Typhoon Warning': '#db133b',
    'Typhoon Watch': '#fe00fe',
    'Urban and Small Stream Flood Advisory': '#00fe7e',
    'Volcano Warning': '#2e4e4e',
    'Wind Advisory': '#d1b38b',
    'Wind Chill Advisory': '#aeeded',
    'Wind Chill Warning': '#afc3dd',
    'Wind Chill Watch': '#5e9d9f',
    'Winter Storm Warning': '#fe68b3',
    'Winter Storm Watch': '#4581b3',
    'Winter Weather Advisory': '#7a67ed'
};

donateForm = '<div class="donate"><div class="content-holder"><i id="close-donate" class="far fa-xmark"></i><div style="display:flex;align-items:center;padding:30px 15px 15px 15px"><div style="font-family:dosis;text-align:center">' +
    '<h1 style="font-size:45px">We need your help!</h1><p style="font-size:21px;padding:25px 0 35px 0;line-height:1.5">We need your help to keep Map-o-Fire going. We volunteer our time to build this service and pay the costs to maintain ' +
    'the servers. Consider "buying us a coffee" or <b>making a donation</b>.</p><a href="https://www.mapotechnology.com/checkout?ref=mapofire" target="blank" class="btn btn-red btn-lg"><i class="fas fa-circle-dollar-to-slot"></i> Donate $10</a></div>' +
    '</div></div></div>';

loadingPopup = popup('<span style="text-align:center">Loading...</span>', '<div class="spinner" style="display:block;width:40px;height:40px;margin:0 auto 10px auto"></div><p style="margin:0;font-size:14px;text-align:center">Getting current weather alerts...</p>');

/*loginForm = '<form id="loginForm"><h1>Account Login</h1><input type="hidden" name="mode" value="login"><input type="email" name="email" placeholder="Email Address"><input type="password" name="pass" placeholder="Password">' +
    '<input type="submit" class="btn btn-yellow" value="Login"><div id="gSignInWrapper"></div><div class="spinner" style="margin:10px 0;width:35px;height:35px;display:none"></div><p style="padding:15px 0 5px 0"><a href="#" id="forgotPwd">Forgot password?</a></p><p>' +
    '<a href="#" id="createAcct">Create an account</a></p></form>';

forgotForm = '<form id="forgotForm"style="display:none"><h1>Forgot Password?</h1><input type="hidden" name="mode" value="forgot"><input type="email" name="email" placeholder="Email Address">' +
    '<input type="submit" class="btn btn-yellow" value="Reset Password"><div class="spinner" style="margin:10px 0;width:35px;height:35px;display:none"></div>' +
    '<p style="padding:15px 0 5px 0"><a href="#" id="doLogin">Login Instead</a></p><p><a href="#" id="createAcct">Create an account</a></p></form>';

createForm = '<form id="registerForm" style="display:none"><h1>Create an account</h1><input type="hidden" name="mode" value="register"><input type="hidden" name="location" value=""><input type="text" name="first_name" placeholder="First Name">' +
    '<input type="text" name="last_name" placeholder="Last Name"><input type="email" name="email" placeholder="Email Address"><input type="password" name="pass" placeholder="Password"><span style="font-size:12px;color:#cbcbcb">Must have at least 1 symbol, number, and 1 upper/lowercase letter</span>' +
    '<input type="password" name="confirm_pass" placeholder="Confirm Password"><input type="text" id="city" value="" placeholder="Getting location..." disabled>' +
    '<div class="checkbox sm"><input type="checkbox" id="tos" name="tos" value="1"><label for="tos" style="font-size:13px"><span style="text-align:center;font-size:14px;line-height:1.2;color:var(--light-gray)">By creating an account, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a></span></label></div>' +
    '<input type="submit" class="btn btn-yellow" value="Create Account" disabled>' +
    '<div class="spinner" style="margin:10px 0;width:35px;height:35px;display:none"></div><p style="padding:10px 0 5px 0"><a href="#" id="doLogin">Login instead</a></p></form>';*/

userSettingsForm = '<div id="settings">' +
    '<div class="r"><div class="var">Save Frequency</div><div class="input"><select id="saveFreq">' +
    '<option value="60000">1 min</option>' +
    '<option value="300000">5 mins</option>' +
    '<option value="600000">10 mins</option>' +
    '<option value="900000">15 mins</option>' +
    '<option value="1800000">30 mins</option></select></div></div>' +
    '<div class="r"><div class="var">Perimeter Color</div><div class="input"><select id="perimColor">' +
    '<option value="default">Default</option>' +
    '<option value="red">Red</option>' +
    '<option value="blue">Blue</option>' +
    '<option value="orange">Orange</option>' +
    '<option value="green">Green</option>' +
    '<option value="purple">Purple</option>' +
    '<option value="brown">Brown</option>' +
    '<option value="black">Black</option></select></div></div>' +
    '<div class="r"><div class="var">Perimeter Tooltip</div><div class="input"><select id="perimTtip">' +
    '<option value="1">Yes</option>' +
    '<option value="0">No</option></select></div></div>' +
    '<div class="r"><div class="var">Perimeter Zoom</div><div class="input"><select id="perimZoom">' +
    '<option value="1">Yes</option>' +
    '<option value="0">No</option></select></div></div>' +
    '<div class="r"><div class="var">Coordinates</div><div class="input"><select id="coordsDisplay">' +
    '<option value="dec">Decimal</option>' +
    '<option value="dms">Degs, Mins, Secs</option>' +
    '<option value="utm">UTM</option></select></div></div>' +
    '<div class="r"><div class="var">Temperature Unit</div><div class="input"><select id="tempUnit">' +
    '<option value="f">&deg;F</option>' +
    '<option value="c">&deg;C</option></select></div></div>' +
    '<div class="r"><div class="var">Wind Speed Unit</div><div class="input"><select id="windSpeedUnit">' +
    '<option value="mph">mph</option>' +
    '<option value="m/s">m/s</option>' +
    '<option value="kts">kts</option>' +
    '<option value="km/h">km/h</option></select></div></div>' +
    '<div class="r"><div class="var">Fire Size Unit</div><div class="input"><select id="acresUnit">' +
    '<option value="acres">acres</option>' +
    '<option value="hectacres">hectacres</option>' +
    '<option value="sqmi">sq. mi.</option>' +
    '<option value="sqkm">sq. km.</option></select></div></div>' +
    '<div class="r"><div class="var">Cache Fire Data</div><div class="input"><select id="locallySave">' +
    '<option value="y">Yes</option>' +
    '<option value="n">No</option></select></div></div>' +
    '<div class="r"><div class="var">Fire Display</div><div class="input"><select id="fireDisplay">' +
    '<option value="page">See incident page</option>' +
    '<option value="map">On the map</option></select></div></div>' +
    '<div style="margin-top:50px;font-size:12px;color:var(--blue-gray);line-height:1.2">&copy; ' + new Date().getFullYear() +
    ' MAPO LLC<br>Version <span id="versionLabel"></span></div></div>';

accountForm = '<h1>{fname} {lname}</h1><p style="margin:20px 0 15px 0;letter-spacing:1px;text-transform:uppercase;font-size:14px;color:var(--blue-gray)">User since {since}</p><div id="sync"><i class="fa-regular fa-arrow-down-to-line"></i><span>Your account was successfully synced</span></div>' +
    '<a class="btn btn-light-blue" style="margin:10px 0 5px" href="https://www.mapotechnology.com/account/mapofire?ref=mapofire">Manage Account</a><br><a class="btn btn-yellow" style="margin:5px 0 10px" href="logout">Logout</a>' +
    '<h3 style="margin:25px 0 10px 0;font-size:18px;color:var(--blue-gray)";letter-spacing:1px>SETTINGS</h3>' + userSettingsForm;

fireDisplay = '<div class="container">' +
    '<div class="row even" id="a" style="align-items:center">' +
    '<div class="col" style="flex-direction:column"><h1 class="placeholder" style="max-width:350px;height:48px"></h1><p class="placeholder" style="margin:0 0 10px 0;max-width:150px;height:20px"></p></div>' +
    '<div class="col">' +
    '<div style="display:flex;flex:1 1;justify-content:flex-end;align-items:center">' +
    '<p class="placeholder" style="height:21px;max-width:360px"></p>' +
    '<p class="placeholder" style="height:50px;max-width:50px;margin-left:10px"></p>' +
    '</div></div></div>' +
    '<div class="row" id="b" style="gap:10px;color:#555;border-radius:3px;margin:10px 0"><div class="placeholder"></div></div>' +
    '<div class="fire-details head" id="c">' +
    '<div class="row">' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fad fa-shield-check"></i></div>' +
    '<div class="c t">Status</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p></div>' +
    '</div>' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fad fa-object-ungroup"></i></div>' +
    '<div class="c t">Acres</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p></div>' +
    '</div>' +
    '</div>' +
    '<div class="row">' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fas fa-location-dot"></i></div>' +
    '<div class="c t">Initial Location</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p></div>' +
    '</div>' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fas fa-tower-observation"></i></div>' +
    '<div class="c t">Jurisdiction</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="row">' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fal fa-notes"></i></div>' +
    '<div class="c t">Dispatch Notes</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p></div>' +
    '</div>' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fad fa-trees"></i></div>' +
    '<div class="c t">Fuels</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p></div>' +
    '</div>' +
    '</div>' +
    '<div class="row">' +
    '<div class="box">' +
    '<div class="c i"><i aria-hidden="true" class="fad fa-sensor-triangle-exclamation"></i></div>' +
    '<div class="c t">Assigned Resources</div>' +
    '<div class="c"><p class="placeholder" style="max-width:50%;margin:0;height:18px"></p></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="row grid" id="e">' +
    '<div class="col">' +
    '<div id="weatherObs" style="width:100%">' +
    '<div class="fire-details linear">' +
    '<h2>Nearby Weather Conditions</h2>' +
    '<div class="body"><h3 class="placeholder" style="min-width:150px;width:50%;height:28px;margin:10px auto"></h3>' +
    '<div class="row">' +
    '<div class="box w3">' +
    '<div class="c" id="temp"><i class="fal fa-temperature-half"></i><span class="desc">Temperature</span>' +
    '<p class="placeholder" style="max-width:50px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '<div class="box w3">' +
    '<div class="c" id="rh"><i class="fal fa-droplet-percent"></i><span class="desc">Humidity</span>' +
    '<p class="placeholder" style="max-width:50px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '<div class="box w3">' +
    '<div class="c" id="wind"><i class="fal fa-wind"></i><span class="desc">Wind</span>' +
    '<p class="placeholder" style="max-width:100px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<p id="upd" class="placeholder" style="margin:10px auto 0 auto;padding:0;max-width:200px;height:18px"></p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="col">' +
    '<div id="incidentForecast" style="width:100%">' +
    '<div class="fire-details linear">' +
    '<h2>24-hr Forecast Concerns</h2>' +
    '<div class="body">' +
    '<div class="row">' +
    '<div class="box w4">' +
    '<div class="c" id="aa"><i class="fal fa-temperature-high"></i><span class="desc">Max Temp</span>' +
    '<p class="placeholder" style="max-width:50px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '<div class="box w4">' +
    '<div class="c" id="ab"><i class="fal fa-droplet-percent"></i><span class="desc">Min Humidity</span>' +
    '<p class="placeholder" style="max-width:50px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '<div class="box w4">' +
    '<div class="c" id="ac"><i class="fal fa-wind"></i><span class="desc">Avg Wind Speed</span>' +
    '<p class="placeholder" style="max-width:50px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '<div class="box w4">' +
    '<div class="c" id="ad"><i class="fal fa-windsock"></i><span class="desc">Max Wind Speed</span>' +
    '<p class="placeholder" style="max-width:50px;margin:0;height:27px"></p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<p id="ae" class="placeholder" style="margin:10px auto 0 auto;padding:0;max-width:200px;height:18px"></p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="fire-details linear" id="d">' +
    '<h2>Dispatch Center</h2>' +
    '<div class="body">' +
    '<div style="margin:0">' +
    '<p class="placeholder" style="max-width:350px;margin:0;height:20px"></p>' +
    '<p class="placeholder" style="max-width:150px;margin:5px 0 0 0;height:20px"></p>' +
    '<p class="placeholder" style="max-width:150px;margin:5px 0 0 0;height:20px"></p>' +
    '<p class="placeholder" style="max-width:150px;margin:5px 0 0 0;height:20px"></p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div id="nbm" class="fire-details linear">' +
    '<h2>Temperature & RH Ensembles</h2>' +
    '<div class="body">' +
    '<div class="chart-wrapper" style="width:100%;height:auto;min-height:400px"></div>' +
    '</div></div><div style="text-align:center;font-size:10px;line-height:1.3;color:var(--blue-gray);margin-top:50px">' + disclaimer + '</div></div>';

    wwaTemplate = '<div class="container"><h1 class="placeholder" style="margin-bottom:25px;max-width:50%;height:52px"></h1><div class="placeholder" style="margin-bottom:25px;height: 70px;"></div>' +
    '<div class="placeholder" style="margin-bottom:25px;height:20px"></div><div class="placeholder" style="height:20px"></div><div class="placeholder" style="height:20px"></div>' +
    '<div class="placeholder" style="height:20px"></div></div>';

spcTemplate = '<div class="container"><h1 class="placeholder" style="margin-bottom:25px;max-width:50%;height:52px"></h1>' +
    '<div class="placeholder" style="height:20px"></div><div class="placeholder" style="height:20px"></div><div class="placeholder" style="height:20px"></div>' +
    '<div class="placeholder" style="height:20px"></div></div>';

riskTemplate = '<div class="container"><h1 id="a" class="placeholder" style="margin-bottom:25px;max-width:50%;height:52px"></h1><div class="row" style="margin:15px 0;font-size:18px;color:#4c4c4c;flex-wrap:nowrap">' +
    '<div class="col" style="flex:1 1;min-width:40px;max-width:40px"><i class="fa-solid fa-location-dot" style="font-size:25px"></i></div>' +
    '<div class="col" style="line-height:1.2" id="b"><p class="placeholder" style="margin:0;max-width:30%;height:22px"></p></div></div><span class="h">This report shows wildfire likelihood, risk to homes from wildfire, and exposure risk to populated areas based on US Forest Service research. <a target="blank" href="https://www.fs.usda.gov/rds/archive/catalog/RDS-2020-0016">Read more</a>.</span>' +
    /*'<div class="risk"><div class="category"><h2>Wildfire Hazard Potential</h2><div class="legd" id="whp"><div class="c"></div><div class="t"></div></div><p id="d" class="placeholder" style="height:21px;font-size:17px;letter-spacing:0.5px"></p>' +
    '<span class="h"><i class="fa-solid fa-square-question"></i> Desc</span></div>' +*/
    '<ul class="rthReport" id="c"><li><div class="rate placeholder" style="margin-bottom:0"></div><p class="placeholder"></p></li><li><div class="rate placeholder" style="margin-bottom:0"></div><p class="placeholder"></p></li>' +
    '<li><div class="rate placeholder" style="margin-bottom:0"></div><p class="placeholder"></p></li></ul>' +
    '<div style="width:100%;height:200px"><canvas id="d" style="margin:0 auto"></canvas></div></div>';

newReport = '<form id="newReport" method="post"><input type="hidden" name="authUser" value="0"><input type="hidden" name="lat" value=""><input type="hidden" name="lon" value=""><b>What type of incident is this?</b>' +
    '<select name="type" style="max-width:165px;padding:8px 12px;margin:10px auto"><option>- Choose -</option><option value="Wildfire">Wildfire</option><option value="Smoke Check">Smoke Check</option><option value="Prescribed Burn">Prescribed Burn</option></select>' +
    '<b>How big is it?</b><br><input type="text" name="size" placeholder="eg: 10" style="display:inline-block;max-width:100px" value=""><div style="display:inline-block;padding-left:5px">acres</div><br>' +
    '<b>Brief description of incident:</b><br><textarea name="notes" placeholder="Anything else you can add" style="min-height:100px;resize:none"></textarea><a class="btn btn-gray" href="#" id="cancelNewRpt" onclick="return false">Cancel</a> &nbsp; <input type="submit" class="btn btn-light-blue" value="Submit Report"></form>';

nwsFireFcst = '<h1 class="placeholder" style="width:75%;height:52px"></h1><p style="width: 490px;height:18px" class="placeholder"></p><h2 class="fwf">Discussion</h2><p class="placeholder" style="width:100%;height:20px"></p>' +
    '<p class="placeholder" style="width:100%;height:20px"></p><p class="placeholder" style="width:100%;height:20px"></p><p class="placeholder" style="width:100%;height:20px"></p><h2 class="fwf">Forecast</h2>' +
    '<p class="placeholder" style="width:35%;height:20px"></p><p class="placeholder" style="width:35%;height:20px"></p><p class="placeholder" style="width:35%;height:20px"></p>';