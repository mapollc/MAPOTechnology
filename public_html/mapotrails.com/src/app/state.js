export const searchResults = document.querySelector('#search-results');

export const global = {
    map: null,
    marker: null,
    conversion: null,
    mapControls: [],
    inits: {
        clickListener: null,
        controlsAtBottom: null,
    },
    trails: null,
    selected: null,
    trackStartsEnds: null,
    loadingImages: new Set(),
    clickListener: null,
    changeListener: null,
    layers: [
        {
            id: 'trailheads',
            name: 'Trailheads',
            desc: 'Display trailheads and trail starting points on the map',
            default: true,
            mapLayers: ['cluster-ths', 'cluster-count', 'trailheads']
        },
        {
            id: 'trails',
            name: 'Trails',
            desc: 'Display trails on the map',
            default: true,
            mapLayers: ['trails', 'trails_title']
        },
        {
            id: 'waypoints',
            name: 'Waypoints',
            desc: 'Display informational points for trails on the map',
            default: true,
            mapLayers: ['waypoints']
        }
    ]
};

export const impactHeader = `<header>
    <h3 id="a" class="title">
        <div class="placeholder" style="width:225px;height:28px"></div>
    </h3>
    <div id="mclose" data-action="close-impact" title="Close window">
        <i class="far fa-xmark" data-action="close-impact"></i>
    </div>
</header>`;

export const stateLabels = {
    'AB': { name: 'Alberta', center: [-113.5, 54.5] },
    'ACT': { name: 'Australian Capital Territory', center: [149.0014, -35.4900] },
    'AL': { name: 'Alabama', center: [-86.8295337, 33.2588817] },
    'AK': { name: 'Alaska', center: [-149.680909, 64.4459613] },
    'AZ': { name: 'Arizona', center: [-111.7632755, 34.395342] },
    'AR': { name: 'Arkansas', center: [-92.4479108, 35.2048883] },
    'BC': { name: 'British Columbia', center: [-123.5, 54.5] },
    'CA': { name: 'California', center: [-118.7559974, 36.7014631] },
    'CO': { name: 'Colorado', center: [-105.6077167, 38.7251776] },
    'CT': { name: 'Connecticut', center: [-72.7342163, 41.6500201] },
    'DE': { name: 'Delaware', center: [-75.4013315, 38.6920451] },
    'DC': { name: 'District of Columbia', center: [-77.0365529, 38.8948932] },
    'FL': { name: 'Florida', center: [-81.4639835, 27.7567667] },
    'GA': { name: 'Georgia', center: [-83.1137366, 32.3293809] },
    'HI': { name: 'Hawaii', center: [-157.975203, 21.2160437] },
    'ID': { name: 'Idaho', center: [-114.74121, 45.61788] },
    'IL': { name: 'Illinois', center: [-89.4337288, 40.0796606] },
    'IN': { name: 'Indiana', center: [-86.1746933, 40.3270127] },
    'IA': { name: 'Iowa', center: [-93.3122705, 41.9216734] },
    'KS': { name: 'Kansas', center: [-98.5821872, 38.27312] },
    'KY': { name: 'Kentucky', center: [-85.1551411, 37.5726028] },
    'LA': { name: 'Louisiana', center: [-92.007126, 30.8703881] },
    'MB': { name: 'Manitoba', center: [-97.8, 55.0] },
    'ME': { name: 'Maine', center: [-68.8590201, 45.709097] },
    'MD': { name: 'Maryland', center: [-76.9382069, 39.5162234] },
    'MA': { name: 'Massachusetts', center: [-72.032366, 42.3788774] },
    'MI': { name: 'Michigan', center: [-84.6824346, 43.6211955] },
    'MN': { name: 'Minnesota', center: [-94.6113288, 45.9896587] },
    'MS': { name: 'Mississippi', center: [-89.7348497, 32.9715645] },
    'MO': { name: 'Missouri', center: [-92.5617875, 38.7604815] },
    'MT': { name: 'Montana', center: [-109.6387579, 47.3752671] },
    'NB': { name: 'New Brunswick', center: [-66.0, 46.5] },
    'NE': { name: 'Nebraska', center: [-99.5873816, 41.7370229] },
    'NL': { name: 'Newfoundland', center: [-58.0, 53.0] },
    'NS': { name: 'Nova Scotia', center: [-63.5, 45.0] },
    'NSW': { name: 'New South Wales', center: [147.0167, -32.1633] },
    'NV': { name: 'Nevada', center: [-116.8537227, 39.5158825] },
    'NH': { name: 'New Hampshire', center: [-71.6553992, 43.4849133] },
    'NJ': { name: 'New Jersey', center: [-74.4041622, 40.0757384] },
    'NM': { name: 'New Mexico', center: [-105.993007, 34.5708167] },
    'NY': { name: 'New York', center: [-74.0060152, 40.7127281] },
    'NC': { name: 'North Carolina', center: [-79.0392919, 35.6729639] },
    'ND': { name: 'North Dakota', center: [-100.540737, 47.6201461] },
    'NT': { name: 'Northwest Territories', center: [-117.0, 64.0] },
    'NTT': { name: 'Northern Territory', center: [133.3578, -19.3833] },
    'NU': { name: 'Nunavut', center: [-90.0, 71.0] },
    'OH': { name: 'Ohio', center: [-82.6881395, 40.2253569] },
    'OK': { name: 'Oklahoma', center: [-97.2684063, 34.9550817] },
    'ON': { name: 'Ontario', center: [-84.0, 50.0] },
    'OR': { name: 'Oregon', center: [-120.737257, 43.9792797] },
    'PA': { name: 'Pennsylvania', center: [-77.7278831, 40.9699889] },
    'PE': { name: 'Prince Edward Island', center: [-63.5, 46.3] },
    'QC': { name: 'Quebec', center: [-71.5, 52.0] },
    'QLD': { name: 'Queensland', center: [144.4317, -22.4870] },
    'RI': { name: 'Rhode Island', center: [-71.5992372, 41.7962409] },
    'SA': { name: 'South Australia', center: [135.7633, -30.0583] },
    'SC': { name: 'South Carolina', center: [-80.4363743, 33.6874388] },
    'SD': { name: 'South Dakota', center: [-100.348761, 44.6471761] },
    'SK': { name: 'Saskatchewan', center: [-106.0, 52.0] },
    'TAS': { name: 'Tasmania', center: [146.5933, -42.0214] },
    'TN': { name: 'Tennessee', center: [-86.2820081, 35.7730076] },
    'TX': { name: 'Texas', center: [-99.5120986, 31.8160381] },
    'UT': { name: 'Utah', center: [-111.7143584, 39.4225192] },
    'VIC': { name: 'Victoria', center: [144.2800, -36.8542] },
    'VT': { name: 'Vermont', center: [-72.5002608, 44.5990718] },
    'VA': { name: 'Virginia', center: [-78.4927721, 37.1232245] },
    'WA': { name: 'Washington', center: [-120.74014, 47.75107] },
    'WAA': { name: 'Western Australia', center: [122.2983, -25.3281] },
    'WV': { name: 'West Virginia', center: [-80.8408415, 38.4758406] },
    'WI': { name: 'Wisconsin', center: [-89.6884637, 44.4308975] },
    'WY': { name: 'Wyoming', center: [-107.5685348, 43.1700264] },
    'YT': { name: 'Yukon', center: [-135.0, 62.0] }
};