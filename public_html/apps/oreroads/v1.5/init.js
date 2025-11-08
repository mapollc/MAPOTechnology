let map,
    settings = null,
    siteTitle = document.title,
    queryParams = window.location.href.split('oregonroads/')[1],
    host = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    apiKey = 'c196d0958608ad2b7d4af2be078ecc54',
    /*apiKey = 'bG9jYWxob3N0',*/
    sub_id = 'price_1OcYB3IpCdpJm6cTvstK4y8N',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    /*mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ',*/
    curtime = new Date(),
    yr = curtime.getFullYear(),
    summerMode = (curtime.getTime() >= new Date('4/15/' + yr + ' 00:00:00').getTime() && curtime.getTime() <= new Date('10/15/' + yr + ' 23:59:59').getTime() ? true : false),
    ROAD_RANGE_DIST = 10,
    basemaps = {
        'light': 'mapbox://styles/mapollc/cm2kmozef00wi01ps649r2lgl',
        'dark': 'mapbox://styles/mapollc/cm33jv42500un01pw5skw9dqr'
    },
    userBaseMap = localStorage.getItem('basemap'),
    dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturdary'],
    short_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long_months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    moving = false,
    menuLoaded = false,
    rwRetrieved = false,
    webcamsRetrieved = false,
    rwisRetrieved = false,
    incidentsRetrieved = false,
    roadWorkRetrieved = false,
    dmsRetrieved = false,
    wwasRetrieved = false,
    roadNetwork = [],
    nwsAlerts = [],
    rwis = [],
    roadwork = [],
    webcams = [],
    incidents = [],
    varMsgSigns = [],
    roads,
    roadReports = [],
    roadsArray = [],
    roadsIDArray = [],
    radarImgs = [],
    radarAnim,
    RADAR_INT = 500,
    radarPlay = true,
    cities = {
        list: [
            { "city": "Adair Village", "lat": "44.6708", "lon": "-123.2158" },
            { "city": "Adams", "lat": "45.7688", "lon": "-118.559" },
            { "city": "Adel", "lat": "42.1929", "lon": "-119.72" },
            { "city": "Adrian", "lat": "43.6762", "lon": "-117.058" },
            { "city": "Agate Beach", "lat": "44.6773", "lon": "-124.0618" },
            { "city": "Agness", "lat": "42.6084", "lon": "-124.074" },
            { "city": "Albany", "lat": "44.628", "lon": "-123.077" },
            { "city": "Alfalfa", "lat": "44.0773", "lon": "-121.0170" },
            { "city": "Allegany", "lat": "43.4252", "lon": "-124.034" },
            { "city": "Aloha", "lat": "45.4920", "lon": "-122.8726" },
            { "city": "Alpine", "lat": "44.3307", "lon": "-123.3625" },
            { "city": "Alsea", "lat": "44.3662", "lon": "-123.615" },
            { "city": "Altamont", "lat": "42.1980", "lon": "-121.7249" },
            { "city": "Alvadore", "lat": "44.1286", "lon": "-123.267" },
            { "city": "Amity", "lat": "45.0985", "lon": "-123.207" },
            { "city": "Annex", "lat": "44.2346", "lon": "-116.9922" },
            { "city": "Antelope", "lat": "44.9218", "lon": "-120.732" },
            { "city": "Applegate", "lat": "42.2571", "lon": "-123.1684" },
            { "city": "Arch Cape", "lat": "45.8851", "lon": "-123.944" },
            { "city": "Arlington", "lat": "45.686", "lon": "-120.188" },
            { "city": "Arock", "lat": "42.9158", "lon": "-117.48" },
            { "city": "Ashland", "lat": "42.1876", "lon": "-122.673" },
            { "city": "Ashwood", "lat": "44.6924", "lon": "-120.653" },
            { "city": "Astoria", "lat": "46.1817", "lon": "-123.827" },
            { "city": "Athena", "lat": "45.8142", "lon": "-118.489" },
            { "city": "Aumsville", "lat": "44.8388", "lon": "-122.859" },
            { "city": "Aurora", "lat": "45.2323", "lon": "-122.808" },
            { "city": "Azalea", "lat": "42.7921", "lon": "-123.221" },
            { "city": "Baker City", "lat": "44.7797", "lon": "-117.834" },
            { "city": "Bandon", "lat": "43.1174", "lon": "-124.407" },
            { "city": "Banks", "lat": "45.6581", "lon": "-123.115" },
            { "city": "Barlow", "lat": "45.2525", "lon": "-122.7216" },
            { "city": "Barview", "lat": "43.3470", "lon": "-124.3073" },
            { "city": "Bates", "lat": "44.5111", "lon": "-118.503" },
            { "city": "Bay City", "lat": "45.5263", "lon": "-123.88" },
            { "city": "Bayside Gardens", "lat": "45.7143", "lon": "-123.9166" },
            { "city": "Beatty", "lat": "42.4251", "lon": "-121.179" },
            { "city": "Beaver", "lat": "45.2838", "lon": "-123.753" },
            { "city": "Beaver Creek", "lat": "45.2757", "lon": "-122.5136" },
            { "city": "Beavercreek", "lat": "45.2526", "lon": "-122.444" },
            { "city": "Beaverton", "lat": "45.4886", "lon": "-122.804" },
            { "city": "Bellfountain", "lat": "44.3654", "lon": "-123.3559" },
            { "city": "Bend", "lat": "44.0982", "lon": "-121.289" },
            { "city": "Bethany", "lat": "45.5613", "lon": "-122.8371" },
            { "city": "Biggs Junction", "lat": "45.6640", "lon": "-120.8389" },
            { "city": "Blachly", "lat": "44.1857", "lon": "-123.551" },
            { "city": "Black Butte Ranch", "lat": "44.3577", "lon": "-121.6589" },
            { "city": "Blodgett", "lat": "44.6417", "lon": "-123.553" },
            { "city": "Blue River", "lat": "44.1636", "lon": "-122.214" },
            { "city": "Bly", "lat": "42.4247", "lon": "-121.179" },
            { "city": "Boardman", "lat": "45.8109", "lon": "-119.695" },
            { "city": "Bonanza", "lat": "42.2932", "lon": "-121.186" },
            { "city": "Boring", "lat": "45.4244", "lon": "-122.384" },
            { "city": "Bridal Veil", "lat": "45.55", "lon": "-122.272" },
            { "city": "Bridge", "lat": "43.0240", "lon": "-124.0070" },
            { "city": "Bridgeport", "lat": "44.483", "lon": "-117.743" },
            { "city": "Brightwood", "lat": "45.3635", "lon": "-122" },
            { "city": "Broadbent", "lat": "42.981", "lon": "-124.122" },
            { "city": "Brogan", "lat": "44.2465", "lon": "-117.515" },
            { "city": "Brookings", "lat": "42.069", "lon": "-124.27" },
            { "city": "Brooks", "lat": "45.0508", "lon": "-122.9576" },
            { "city": "Brothers", "lat": "43.7171", "lon": "-120.47" },
            { "city": "Brownsville", "lat": "44.3888", "lon": "-122.967" },
            { "city": "Bunker Hill", "lat": "43.3502", "lon": "-124.2082" },
            { "city": "Burlington", "lat": "45.6462", "lon": "-122.8426" },
            { "city": "Burns", "lat": "43.525", "lon": "-118.763" },
            { "city": "Butte Falls", "lat": "42.5373", "lon": "-122.551" },
            { "city": "Butteville", "lat": "45.2562", "lon": "-122.8357" },
            { "city": "Buxton", "lat": "45.7429", "lon": "-123.197" },
            { "city": "Camas Valley", "lat": "43.0391", "lon": "-123.683" },
            { "city": "Camp Sherman", "lat": "44.4456", "lon": "-121.659" },
            { "city": "Canby", "lat": "45.2413", "lon": "-122.678" },
            { "city": "Cannon Beach", "lat": "45.8909", "lon": "-123.958" },
            { "city": "Canyon City", "lat": "44.3875", "lon": "-118.946" },
            { "city": "Canyonville", "lat": "42.9347", "lon": "-123.272" },
            { "city": "Cape Meares", "lat": "45.5153", "lon": "-123.9536" },
            { "city": "Carlton", "lat": "45.2929", "lon": "-123.184" },
            { "city": "Carpenterville", "lat": "42.2201", "lon": "-124.3395" },
            { "city": "Cascade Locks", "lat": "45.6714", "lon": "-121.888" },
            { "city": "Cascadia", "lat": "44.3907", "lon": "-122.506" },
            { "city": "Cave Junction", "lat": "42.1402", "lon": "-123.623" },
            { "city": "Cayuse", "lat": "45.6765", "lon": "-118.5736" },
            { "city": "Cedar Hills", "lat": "45.5047", "lon": "-122.8052" },
            { "city": "Cedar Mill", "lat": "45.5355", "lon": "-122.8007" },
            { "city": "Central Point", "lat": "42.4022", "lon": "-122.915" },
            { "city": "Charleston", "lat": "43.3401", "lon": "-124.3301" },
            { "city": "Chemult", "lat": "43.0743", "lon": "-121.865" },
            { "city": "Chenoweth", "lat": "45.6207", "lon": "-121.2363" },
            { "city": "Cheshire", "lat": "44.1717", "lon": "-123.374" },
            { "city": "Chiloquin", "lat": "42.5924", "lon": "-121.872" },
            { "city": "Christmas Valley", "lat": "43.2403", "lon": "-120.678" },
            { "city": "Clackamas", "lat": "45.4156", "lon": "-122.524" },
            { "city": "Clatskanie", "lat": "46.0999", "lon": "-123.187" },
            { "city": "Cloverdale", "lat": "45.2197", "lon": "-123.927" },
            { "city": "Coburg", "lat": "44.1393", "lon": "-123.0588" },
            { "city": "Colton", "lat": "45.1569", "lon": "-122.357" },
            { "city": "Columbia City", "lat": "45.8945", "lon": "-122.816" },
            { "city": "Condon", "lat": "45.2347", "lon": "-120.192" },
            { "city": "Coos Bay", "lat": "43.3519", "lon": "-124.23" },
            { "city": "Coquille", "lat": "43.1805", "lon": "-124.187" },
            { "city": "Corbett", "lat": "45.5201", "lon": "-122.259" },
            { "city": "Cornelius", "lat": "45.5225", "lon": "-123.05" },
            { "city": "Corvallis", "lat": "44.6038", "lon": "-123.273" },
            { "city": "Cottage Grove", "lat": "43.7842", "lon": "-123.058" },
            { "city": "Cove", "lat": "45.3327", "lon": "-117.855" },
            { "city": "Crabtree", "lat": "44.6354", "lon": "-122.899" },
            { "city": "Crane", "lat": "43.397", "lon": "-118.437" },
            { "city": "Crater Lake", "lat": "43.0706", "lon": "-121.863" },
            { "city": "Crawfordsville", "lat": "44.3583", "lon": "-122.851" },
            { "city": "Crescent", "lat": "43.5093", "lon": "-121.742" },
            { "city": "Crescent Lake", "lat": "43.5246", "lon": "-121.956" },
            { "city": "Creswell", "lat": "43.9078", "lon": "-123.034" },
            { "city": "Culp Creek", "lat": "43.6845", "lon": "-122.797" },
            { "city": "Culver", "lat": "44.5095", "lon": "-121.212" },
            { "city": "Curtin", "lat": "43.7528", "lon": "-123.423" },
            { "city": "Cushman", "lat": "43.9857", "lon": "-124.0443" },
            { "city": "Dairy", "lat": "42.2397", "lon": "-121.636" },
            { "city": "Dallas", "lat": "44.9222", "lon": "-123.327" },
            { "city": "Damascus", "lat": "45.4299", "lon": "-122.4462" },
            { "city": "Days Creek", "lat": "42.9801", "lon": "-123.102" },
            { "city": "Dayton", "lat": "45.2017", "lon": "-123.082" },
            { "city": "Dayville", "lat": "44.4696", "lon": "-119.53" },
            { "city": "Deadwood", "lat": "44.1094", "lon": "-123.715" },
            { "city": "Dee", "lat": "45.5882", "lon": "-121.6267" },
            { "city": "Deer Island", "lat": "45.9294", "lon": "-122.926" },
            { "city": "Depoe Bay", "lat": "44.8171", "lon": "-124.054" },
            { "city": "Deschutes River Woods", "lat": "43.9887", "lon": "-121.3608" },
            { "city": "Detroit", "lat": "44.7315", "lon": "-122.147" },
            { "city": "Dexter", "lat": "43.9074", "lon": "-122.826" },
            { "city": "Diamond", "lat": "43.0104", "lon": "-118.664" },
            { "city": "Diamond Lake", "lat": "43.1787", "lon": "-122.1389" },
            { "city": "Dillard", "lat": "43.1672", "lon": "-123.448" },
            { "city": "Disston", "lat": "43.6982", "lon": "-122.7701" },
            { "city": "Donald", "lat": "45.2241", "lon": "-122.841" },
            { "city": "Dora", "lat": "43.1559", "lon": "-123.9562" },
            { "city": "Dorena", "lat": "43.7392", "lon": "-122.889" },
            { "city": "Drain", "lat": "43.6541", "lon": "-123.363" },
            { "city": "Drewsey", "lat": "43.8759", "lon": "-118.535" },
            { "city": "Dufur", "lat": "45.4218", "lon": "-121.163" },
            { "city": "Dundee", "lat": "45.2767", "lon": "-123.019" },
            { "city": "Dunes City", "lat": "43.9079", "lon": "-124.0984" },
            { "city": "Durham", "lat": "45.3942", "lon": "-122.7580" },
            { "city": "Durkee", "lat": "44.5824", "lon": "-117.463" },
            { "city": "Eagle Creek", "lat": "45.3509", "lon": "-122.339" },
            { "city": "Eagle Point", "lat": "42.4842", "lon": "-122.771" },
            { "city": "Echo", "lat": "45.7398", "lon": "-119.191" },
            { "city": "Eddyville", "lat": "44.6003", "lon": "-123.762" },
            { "city": "Elgin", "lat": "45.5917", "lon": "-117.894" },
            { "city": "Elkhorn", "lat": "44.8357", "lon": "-122.3620" },
            { "city": "Elkton", "lat": "43.6382", "lon": "-123.592" },
            { "city": "Elmira", "lat": "44.0933", "lon": "-123.382" },
            { "city": "Elsie", "lat": "45.8657", "lon": "-123.5948" },
            { "city": "Enterprise", "lat": "45.4171", "lon": "-117.271" },
            { "city": "Eola", "lat": "44.9313", "lon": "-123.1205" },
            { "city": "Estacada", "lat": "45.2808", "lon": "-122.313" },
            { "city": "Eugene", "lat": "44.0805", "lon": "-123.073" },
            { "city": "Fair Oaks", "lat": "43.4109", "lon": "-123.2194" },
            { "city": "Fairview", "lat": "45.5392", "lon": "-122.437" },
            { "city": "Fall Creek", "lat": "43.9599", "lon": "-122.782" },
            { "city": "Falls City", "lat": "44.8669", "lon": "-123.444" },
            { "city": "Fields", "lat": "42.2721", "lon": "-118.863" },
            { "city": "Florence", "lat": "43.9898", "lon": "-124.093" },
            { "city": "Foots Creek", "lat": "42.3845", "lon": "-123.1408" },
            { "city": "Forest Grove", "lat": "45.5802", "lon": "-123.153" },
            { "city": "Fort Hill Census Designated Place", "lat": "45.0671", "lon": "-123.5606" },
            { "city": "Fort Klamath", "lat": "42.3907", "lon": "-122.103" },
            { "city": "Fort Rock", "lat": "43.5244", "lon": "-121.169" },
            { "city": "Fossil", "lat": "44.9984", "lon": "-120.213" },
            { "city": "Foster", "lat": "44.4247", "lon": "-122.571" },
            { "city": "Four Corners", "lat": "44.9292", "lon": "-122.9731" },
            { "city": "Fox", "lat": "44.6488", "lon": "-119.1441" },
            { "city": "Frenchglen", "lat": "42.8241", "lon": "-118.918" },
            { "city": "Gales Creek", "lat": "45.5979", "lon": "-123.268" },
            { "city": "Gardiner", "lat": "43.7307", "lon": "-124.106" },
            { "city": "Garibaldi", "lat": "45.561", "lon": "-123.912" },
            { "city": "Gaston", "lat": "45.4513", "lon": "-123.189" },
            { "city": "Gates", "lat": "44.7533", "lon": "-122.383" },
            { "city": "Gearhart", "lat": "46.0294", "lon": "-123.9174" },
            { "city": "Gervais", "lat": "45.1127", "lon": "-122.922" },
            { "city": "Gibbon", "lat": "45.6996", "lon": "-118.3650" },
            { "city": "Gilchrist", "lat": "43.4235", "lon": "-121.703" },
            { "city": "Gladstone", "lat": "45.3898", "lon": "-122.589" },
            { "city": "Glasgow", "lat": "43.4371", "lon": "-124.1961" },
            { "city": "Glendale", "lat": "42.7547", "lon": "-123.383" },
            { "city": "Gleneden Beach", "lat": "44.8847", "lon": "-124.031" },
            { "city": "Glenwood", "lat": "45.6493", "lon": "-123.2709" },
            { "city": "Glide", "lat": "43.2759", "lon": "-123.074" },
            { "city": "Gold Beach", "lat": "42.4499", "lon": "-124.39" },
            { "city": "Gold Hill", "lat": "42.4438", "lon": "-123.064" },
            { "city": "Goshen", "lat": "43.9954", "lon": "-123.0115" },
            { "city": "Government Camp", "lat": "45.2955", "lon": "-121.767" },
            { "city": "Grand Ronde", "lat": "45.0567", "lon": "-123.632" },
            { "city": "Granite", "lat": "44.8100", "lon": "-118.4187" },
            { "city": "Grants Pass", "lat": "42.4687", "lon": "-123.348" },
            { "city": "Grass Valley", "lat": "45.2739", "lon": "-120.761" },
            { "city": "Green", "lat": "43.1509", "lon": "-123.3854" },
            { "city": "Greenhorn", "lat": "44.7087", "lon": "-118.4968" },
            { "city": "Gresham", "lat": "45.5082", "lon": "-122.428" },
            { "city": "Grizzly", "lat": "44.4979", "lon": "-120.9198" },
            { "city": "Haines", "lat": "44.9144", "lon": "-117.939" },
            { "city": "Halfway", "lat": "44.9602", "lon": "-117.127" },
            { "city": "Halsey", "lat": "44.3844", "lon": "-123.122" },
            { "city": "Hammond", "lat": "46.1969", "lon": "-123.95" },
            { "city": "Happy Valley", "lat": "45.4383", "lon": "-122.5142" },
            { "city": "Harbor", "lat": "42.0385", "lon": "-124.2516" },
            { "city": "Harlan", "lat": "44.5398", "lon": "-123.6932" },
            { "city": "Harney", "lat": "43.6432", "lon": "-118.8227" },
            { "city": "Harper", "lat": "43.8753", "lon": "-117.596" },
            { "city": "Harrisburg", "lat": "44.2728", "lon": "-123.114" },
            { "city": "Hauser", "lat": "43.4929", "lon": "-124.2187" },
            { "city": "Hayesville", "lat": "44.9793", "lon": "-122.9738" },
            { "city": "Hazelwood", "lat": "45.5165", "lon": "-122.5240" },
            { "city": "Hebo", "lat": "45.1932", "lon": "-123.833" },
            { "city": "Helix", "lat": "45.9112", "lon": "-118.849" },
            { "city": "Heppner", "lat": "45.3564", "lon": "-119.557" },
            { "city": "Hereford", "lat": "44.5935", "lon": "-117.989" },
            { "city": "Hermiston", "lat": "45.8395", "lon": "-119.286" },
            { "city": "Hilgard", "lat": "45.3521", "lon": "-118.2280" },
            { "city": "Hillsboro", "lat": "45.4476", "lon": "-122.97" },
            { "city": "Hines", "lat": "43.5646", "lon": "-119.081" },
            { "city": "Holland", "lat": "42.1276", "lon": "-123.5390" },
            { "city": "Holley", "lat": "44.3490", "lon": "-122.7855" },
            { "city": "Hood River", "lat": "45.6666", "lon": "-121.54" },
            { "city": "Hoskins", "lat": "44.6768", "lon": "-123.4687" },
            { "city": "Hubbard", "lat": "45.1833", "lon": "-122.803" },
            { "city": "Huntington", "lat": "44.3479", "lon": "-117.262" },
            { "city": "Idanha", "lat": "44.7006", "lon": "-122.071" },
            { "city": "Idaville", "lat": "45.5097", "lon": "-123.8633" },
            { "city": "Idleyld Park", "lat": "43.326", "lon": "-123.027" },
            { "city": "Imbler", "lat": "45.4597995", "lon": "-117.9626619" },
            { "city": "Imnaha", "lat": "45.559387", "lon": "-116.833054" },
            { "city": "Independence", "lat": "44.8433", "lon": "-123.186" },
            { "city": "Ione", "lat": "45.5027", "lon": "-119.824" },
            { "city": "Ironside", "lat": "44.3596", "lon": "-117.833" },
            { "city": "Irrigon", "lat": "45.8995", "lon": "-119.498" },
            { "city": "Island City", "lat": "45.3246", "lon": "-118.0877" },
            { "city": "Jacksonville", "lat": "42.2379", "lon": "-123.039" },
            { "city": "Jamieson", "lat": "44.2226", "lon": "-117.489" },
            { "city": "Jefferson", "lat": "44.7406", "lon": "-123.022" },
            { "city": "Jennings Lodge", "lat": "45.3926", "lon": "-122.6153" },
            { "city": "John Day", "lat": "44.4275", "lon": "-118.948" },
            { "city": "Johnson City", "lat": "45.4045", "lon": "-122.5795" },
            { "city": "Jordan Valley", "lat": "42.9606", "lon": "-117.287" },
            { "city": "Joseph", "lat": "45.353", "lon": "-117.228" },
            { "city": "Junction City", "lat": "44.1958", "lon": "-123.253" },
            { "city": "Juntura", "lat": "43.7456", "lon": "-118.076" },
            { "city": "Keating", "lat": "44.8740", "lon": "-117.5905" },
            { "city": "Keizer", "lat": "45.0069", "lon": "-123.02" },
            { "city": "Keno", "lat": "42.1275", "lon": "-121.964" },
            { "city": "Kent", "lat": "45.082", "lon": "-120.665" },
            { "city": "Kerby", "lat": "42.1952", "lon": "-123.647" },
            { "city": "Kimberly", "lat": "44.6955", "lon": "-119.582" },
            { "city": "King City", "lat": "45.4010", "lon": "-122.8068" },
            { "city": "Kings Valley", "lat": "44.6980", "lon": "-123.4265" },
            { "city": "Kirkpatrick", "lat": "45.6796", "lon": "-118.6499" },
            { "city": "Klamath Agency", "lat": "42.6182", "lon": "-121.9339" },
            { "city": "Klamath Falls", "lat": "42.2217", "lon": "-121.797" },
            { "city": "Knappa", "lat": "46.1851", "lon": "-123.5860" },
            { "city": "La Grande", "lat": "45.3246", "lon": "-118.0877" },
            { "city": "La Pine", "lat": "43.7049", "lon": "-121.532" },
            { "city": "Labish Village", "lat": "45.0191", "lon": "-122.9736" },
            { "city": "Lacomb", "lat": "44.5844", "lon": "-122.7417" },
            { "city": "Lafayette", "lat": "45.2458", "lon": "-123.114" },
            { "city": "Lake Creek", "lat": "42.4208", "lon": "-122.6228" },
            { "city": "Lake Oswego", "lat": "45.4104", "lon": "-122.689" },
            { "city": "Lakeside", "lat": "43.5819", "lon": "-124.159" },
            { "city": "Lakeview", "lat": "42.1877", "lon": "-120.353" },
            { "city": "Langlois", "lat": "42.9157", "lon": "-124.428" },
            { "city": "Lawen", "lat": "43.4429", "lon": "-118.8010" },
            { "city": "Leaburg", "lat": "44.1073", "lon": "-122.6770" },
            { "city": "Lebanon", "lat": "44.5294", "lon": "-122.873" },
            { "city": "Leland", "lat": "42.6384", "lon": "-123.4409" },
            { "city": "Lexington", "lat": "45.3903", "lon": "-119.808" },
            { "city": "Lincoln Beach", "lat": "44.8746", "lon": "-124.0310" },
            { "city": "Lincoln City", "lat": "44.951", "lon": "-124.007" },
            { "city": "Logsden", "lat": "44.7516", "lon": "-123.815" },
            { "city": "Lonerock", "lat": "45.0887", "lon": "-119.8841" },
            { "city": "Long Creek", "lat": "44.7140", "lon": "-119.1041" },
            { "city": "Lookingglass", "lat": "43.1848", "lon": "-123.4999" },
            { "city": "Lorane", "lat": "43.8185", "lon": "-123.243" },
            { "city": "Lostine", "lat": "45.4869", "lon": "-117.442" },
            { "city": "Lowell", "lat": "43.9136", "lon": "-122.766" },
            { "city": "Lyons", "lat": "44.7678", "lon": "-122.605" },
            { "city": "Madras", "lat": "44.6509", "lon": "-121.137" },
            { "city": "Malin", "lat": "42.0191", "lon": "-121.428" },
            { "city": "Manning", "lat": "45.6679", "lon": "-123.207" },
            { "city": "Manzanita", "lat": "45.7202", "lon": "-123.934" },
            { "city": "Mapleton", "lat": "44.0353", "lon": "-123.862" },
            { "city": "Marcola", "lat": "44.2076", "lon": "-122.817" },
            { "city": "Marion", "lat": "44.7719", "lon": "-123.01" },
            { "city": "Marylhurst", "lat": "45.3971", "lon": "-122.648" },
            { "city": "Maupin", "lat": "45.077", "lon": "-121.376" },
            { "city": "Maywood Park", "lat": "45.5524", "lon": "-122.5617" },
            { "city": "McKenzie Bridge", "lat": "44.1751", "lon": "-122.1639" },
            { "city": "McMinnville", "lat": "45.2096", "lon": "-123.218" },
            { "city": "Meacham", "lat": "45.5082", "lon": "-118.419" },
            { "city": "Medford", "lat": "42.3142", "lon": "-122.882" },
            { "city": "Mehama", "lat": "44.7901", "lon": "-122.599" },
            { "city": "Melrose", "lat": "43.2529", "lon": "-123.4574" },
            { "city": "Merlin", "lat": "42.5306", "lon": "-123.433" },
            { "city": "Merrill", "lat": "42.0259", "lon": "-121.57" },
            { "city": "Metolius", "lat": "44.5874", "lon": "-121.1761" },
            { "city": "Metzger", "lat": "45.4491", "lon": "-122.7623" },
            { "city": "Midland", "lat": "42.1331", "lon": "-121.816" },
            { "city": "Mikkalo", "lat": "45.7168", "lon": "-120.199" },
            { "city": "Mill City", "lat": "44.7512", "lon": "-122.48" },
            { "city": "Millersburg", "lat": "44.6779", "lon": "-123.0691" },
            { "city": "Milo", "lat": "42.9307", "lon": "-123.0498" },
            { "city": "Milton-Freewater", "lat": "45.9326", "lon": "-118.389" },
            { "city": "Milwaukie", "lat": "45.4445", "lon": "-122.6220" },
            { "city": "Mission", "lat": "45.6585", "lon": "-118.6655" },
            { "city": "Mist", "lat": "45.9962", "lon": "-123.2565" },
            { "city": "Mitchell", "lat": "44.5468", "lon": "-120.009" },
            { "city": "Molalla", "lat": "45.1212", "lon": "-122.569" },
            { "city": "Monmouth", "lat": "44.8131", "lon": "-123.296" },
            { "city": "Monroe", "lat": "44.3351", "lon": "-123.334" },
            { "city": "Monument", "lat": "44.8708", "lon": "-119.448" },
            { "city": "Moro", "lat": "45.4869", "lon": "-120.733" },
            { "city": "Mosier", "lat": "45.6647", "lon": "-121.375" },
            { "city": "Mount Angel", "lat": "45.0681", "lon": "-122.781" },
            { "city": "Mount Hood", "lat": "45.5339", "lon": "-121.5662" },
            { "city": "Mount Hood Parkdale", "lat": "45.5245", "lon": "-121.586" },
            { "city": "Mount Hood Village", "lat": "45.3433", "lon": "-121.9832" },
            { "city": "Mount Vernon", "lat": "44.4205", "lon": "-119.114" },
            { "city": "Mulino", "lat": "45.2103", "lon": "-122.542" },
            { "city": "Murphy", "lat": "42.339", "lon": "-123.286" },
            { "city": "Myrtle Creek", "lat": "43.0261", "lon": "-123.281" },
            { "city": "Myrtle Point", "lat": "43.0632", "lon": "-124.132" },
            { "city": "Neahkahnie", "lat": "45.7324", "lon": "-123.9399" },
            { "city": "Nehalem", "lat": "45.7107", "lon": "-123.882" },
            { "city": "Neotsu", "lat": "44.9966", "lon": "-123.986" },
            { "city": "Nesika Beach", "lat": "42.5045", "lon": "-124.4065" },
            { "city": "Neskowin", "lat": "45.105", "lon": "-123.972" },
            { "city": "Netarts", "lat": "45.4361", "lon": "-123.943" },
            { "city": "New Hope", "lat": "42.3693", "lon": "-123.3590" },
            { "city": "New Pine Creek", "lat": "42.0525", "lon": "-120.234" },
            { "city": "Newberg", "lat": "45.3089", "lon": "-122.977" },
            { "city": "Newport", "lat": "44.6876", "lon": "-124.007" },
            { "city": "North Albany", "lat": "44.6529", "lon": "-123.1018" },
            { "city": "North Bend", "lat": "43.4362", "lon": "-124.215" },
            { "city": "North Plains", "lat": "45.598", "lon": "-122.996" },
            { "city": "North Powder", "lat": "45.0358", "lon": "-117.938" },
            { "city": "North Springfield", "lat": "44.0748", "lon": "-123.0031" },
            { "city": "Norway", "lat": "43.1009", "lon": "-124.1568" },
            { "city": "Noti", "lat": "44.0966", "lon": "-123.466" },
            { "city": "Nyssa", "lat": "43.8384", "lon": "-117.061" },
            { "city": "O'Brien", "lat": "42.0648", "lon": "-123.704" },
            { "city": "Oak Grove", "lat": "45.4155", "lon": "-122.6349" },
            { "city": "Oak Hills", "lat": "45.5403", "lon": "-122.8413" },
            { "city": "Oakland", "lat": "43.4812", "lon": "-123.4" },
            { "city": "Oakridge", "lat": "43.7469", "lon": "-122.466" },
            { "city": "Oatfield", "lat": "45.4127", "lon": "-122.5942" },
            { "city": "Oceanside", "lat": "45.462", "lon": "-123.966" },
            { "city": "Odell", "lat": "45.6253", "lon": "-121.54" },
            { "city": "Olene", "lat": "42.1718", "lon": "-121.6308" },
            { "city": "Ontario", "lat": "44.0529", "lon": "-116.985" },
            { "city": "Ophir", "lat": "42.5021", "lon": "-124.412" },
            { "city": "Oregon City", "lat": "45.3403", "lon": "-122.561" },
            { "city": "Otis", "lat": "45.0056", "lon": "-123.944" },
            { "city": "Otter Rock", "lat": "44.7476", "lon": "-124.061" },
            { "city": "Oxbow", "lat": "44.9566", "lon": "-116.923" },
            { "city": "Pacific City", "lat": "45.2082", "lon": "-123.959" },
            { "city": "Paisley", "lat": "42.7101", "lon": "-120.514" },
            { "city": "Parkdale", "lat": "45.5131", "lon": "-121.5921" },
            { "city": "Paulina", "lat": "44.1941", "lon": "-119.856" },
            { "city": "Pendleton", "lat": "45.6663", "lon": "-118.794" },
            { "city": "Peoria", "lat": "44.4508", "lon": "-123.2042" },
            { "city": "Perrydale", "lat": "45.0426", "lon": "-123.2557" },
            { "city": "Philomath", "lat": "44.5484", "lon": "-123.409" },
            { "city": "Phoenix", "lat": "42.2745", "lon": "-122.818" },
            { "city": "Pilot Rock", "lat": "45.4843", "lon": "-118.833" },
            { "city": "Pine", "lat": "44.8613", "lon": "-117.0891" },
            { "city": "Pine Grove", "lat": "45.1135", "lon": "-121.3553" },
            { "city": "Pine Hollow", "lat": "45.2420", "lon": "-121.2909" },
            { "city": "Pistol River", "lat": "42.2838", "lon": "-124.3991" },
            { "city": "Placer", "lat": "42.6321", "lon": "-123.3153" },
            { "city": "Pleasant Hill", "lat": "43.9702", "lon": "-122.916" },
            { "city": "Plush", "lat": "42.6096", "lon": "-119.973" },
            { "city": "Pondosa", "lat": "45.0079", "lon": "-117.6427" },
            { "city": "Port Orford", "lat": "42.76", "lon": "-124.486" },
            { "city": "Portland", "lat": "45.4986", "lon": "-122.692" },
            { "city": "Post", "lat": "43.9957", "lon": "-120.231" },
            { "city": "Powell Butte", "lat": "44.2291", "lon": "-121.001" },
            { "city": "Powellhurst", "lat": "45.5040", "lon": "-122.5376" },
            { "city": "Powers", "lat": "42.8823", "lon": "-124.073" },
            { "city": "Prairie City", "lat": "44.4572", "lon": "-118.711" },
            { "city": "Prescott", "lat": "46.0487", "lon": "-122.8879" },
            { "city": "Princeton", "lat": "42.737", "lon": "-118.66" },
            { "city": "Prineville", "lat": "44.3009", "lon": "-120.838" },
            { "city": "Prospect", "lat": "42.7443", "lon": "-122.526" },
            { "city": "Rainier", "lat": "46.0582", "lon": "-122.964" },
            { "city": "Raleigh Hills", "lat": "45.4852", "lon": "-122.7567" },
            { "city": "Redmond", "lat": "44.2754", "lon": "-121.206" },
            { "city": "Redwood", "lat": "42.4219", "lon": "-123.3915" },
            { "city": "Reedsport", "lat": "43.679", "lon": "-124.075" },
            { "city": "Rhododendron", "lat": "45.3784", "lon": "-121.866" },
            { "city": "Richland", "lat": "44.7665", "lon": "-117.168" },
            { "city": "Rickreall", "lat": "44.9851", "lon": "-123.203" },
            { "city": "Riddle", "lat": "42.9536", "lon": "-123.371" },
            { "city": "Rieth", "lat": "45.6610", "lon": "-118.8714" },
            { "city": "Riley", "lat": "43.1356", "lon": "-119.685" },
            { "city": "River Road", "lat": "44.0840", "lon": "-123.1337" },
            { "city": "Rivergrove", "lat": "45.3852", "lon": "-122.7333" },
            { "city": "Riverside", "lat": "43.5081", "lon": "-118.099" },
            { "city": "Riverton", "lat": "43.1573", "lon": "-124.2746" },
            { "city": "Rockaway Beach", "lat": "45.6116", "lon": "-123.939" },
            { "city": "Rockcreek", "lat": "45.5525", "lon": "-122.8757" },
            { "city": "Rockwood", "lat": "45.5190", "lon": "-122.4770" },
            { "city": "Rogue River", "lat": "42.5016", "lon": "-123.15" },
            { "city": "Rose Lodge", "lat": "44.8491", "lon": "-124.044" },
            { "city": "Roseburg", "lat": "43.2233", "lon": "-123.366" },
            { "city": "Rowena", "lat": "45.6701", "lon": "-121.2749" },
            { "city": "Ruch", "lat": "42.2314", "lon": "-123.0403" },
            { "city": "Rufus", "lat": "45.68", "lon": "-120.699" },
            { "city": "Saginaw", "lat": "43.8335", "lon": "-123.042" },
            { "city": "Saint Benedict", "lat": "45.0565", "lon": "-122.784" },
            { "city": "Saint Helens", "lat": "45.8718", "lon": "-122.873" },
            { "city": "Saint Paul", "lat": "45.2208", "lon": "-122.953" },
            { "city": "Salem", "lat": "44.9287", "lon": "-122.961" },
            { "city": "Sandy", "lat": "45.3888", "lon": "-122.229" },
            { "city": "Santa Clara", "lat": "44.1035", "lon": "-123.1312" },
            { "city": "Scappoose", "lat": "45.7604", "lon": "-122.934" },
            { "city": "Scio", "lat": "44.6927", "lon": "-122.803" },
            { "city": "Scotts Mills", "lat": "45.0057", "lon": "-122.642" },
            { "city": "Scottsburg", "lat": "43.6645", "lon": "-123.793" },
            { "city": "Seal Rock", "lat": "44.4995", "lon": "-124.056" },
            { "city": "Seaside", "lat": "46.0012", "lon": "-123.922" },
            { "city": "Selma", "lat": "42.2707", "lon": "-123.585" },
            { "city": "Seneca", "lat": "44.1291", "lon": "-118.989" },
            { "city": "Shady Cove", "lat": "42.615", "lon": "-122.812" },
            { "city": "Shaniko", "lat": "45.0582", "lon": "-120.809" },
            { "city": "Shedd", "lat": "44.4658", "lon": "-123.111" },
            { "city": "Sheridan", "lat": "45.1166", "lon": "-123.395" },
            { "city": "Sherwood", "lat": "45.3588", "lon": "-122.866" },
            { "city": "Siletz", "lat": "44.7306", "lon": "-123.911" },
            { "city": "Siltcoos", "lat": "43.8890", "lon": "-124.0637" },
            { "city": "Silver Lake", "lat": "43.2846", "lon": "-120.625" },
            { "city": "Silverton", "lat": "44.8951", "lon": "-122.564" },
            { "city": "Silvies", "lat": "44.0329", "lon": "-118.9352" },
            { "city": "Simnasho", "lat": "44.9729", "lon": "-121.3501" },
            { "city": "Sisters", "lat": "44.3239", "lon": "-121.576" },
            { "city": "Sixes", "lat": "42.8168", "lon": "-124.456" },
            { "city": "Sodaville", "lat": "44.4831", "lon": "-122.8691" },
            { "city": "South Beach", "lat": "44.5531", "lon": "-124.042" },
            { "city": "South Lebanon", "lat": "44.5055", "lon": "-122.8960" },
            { "city": "Sprague River", "lat": "42.7083", "lon": "-121.567" },
            { "city": "Spray", "lat": "44.8118", "lon": "-119.865" },
            { "city": "Springfield", "lat": "44.0656", "lon": "-123.014" },
            { "city": "Stafford", "lat": "45.3786", "lon": "-122.6822" },
            { "city": "Stanfield", "lat": "45.7807", "lon": "-119.217" },
            { "city": "Stayton", "lat": "44.8033", "lon": "-122.758" },
            { "city": "Sublimity", "lat": "44.8611", "lon": "-122.762" },
            { "city": "Summer Lake", "lat": "42.9007", "lon": "-121.17" },
            { "city": "Summerville", "lat": "45.5134", "lon": "-118.019" },
            { "city": "Summit", "lat": "44.6362", "lon": "-123.5769" },
            { "city": "Sumpter", "lat": "44.7292", "lon": "-118.264" },
            { "city": "Sunriver", "lat": "43.8815", "lon": "-121.4368" },
            { "city": "Sutherlin", "lat": "43.3908", "lon": "-123.296" },
            { "city": "Sweet Home", "lat": "44.3931", "lon": "-122.735" },
            { "city": "Swisshome", "lat": "44.0554", "lon": "-123.741" },
            { "city": "Takilma", "lat": "42.0409", "lon": "-123.6223" },
            { "city": "Talent", "lat": "42.2361", "lon": "-122.789" },
            { "city": "Tangent", "lat": "44.5378", "lon": "-123.102" },
            { "city": "Telocaset", "lat": "45.1010", "lon": "-117.8263" },
            { "city": "Tenmile", "lat": "43.0914", "lon": "-123.564" },
            { "city": "Terrebonne", "lat": "44.3587", "lon": "-121.184" },
            { "city": "The Dalles", "lat": "45.599", "lon": "-121.193" },
            { "city": "Three Rivers", "lat": "43.8366", "lon": "-121.4646" },
            { "city": "Thurston", "lat": "44.0915", "lon": "-122.869" },
            { "city": "Tidewater", "lat": "44.3872", "lon": "-123.894" },
            { "city": "Tigard", "lat": "45.4243", "lon": "-122.7827" },
            { "city": "Tillamook", "lat": "45.4573", "lon": "-123.828" },
            { "city": "Tiller", "lat": "42.9244", "lon": "-122.92" },
            { "city": "Timber", "lat": "45.7293", "lon": "-123.323" },
            { "city": "Toledo", "lat": "44.6273", "lon": "-123.932" },
            { "city": "Tollgate", "lat": "45.7804", "lon": "-118.0927" },
            { "city": "Tolovana Park", "lat": "45.8711", "lon": "-123.959" },
            { "city": "Trail", "lat": "42.6765", "lon": "-122.76" },
            { "city": "Tri-City", "lat": "42.9893", "lon": "-123.3000" },
            { "city": "Troutdale", "lat": "45.5276", "lon": "-122.398" },
            { "city": "Troy", "lat": "45.9468", "lon": "-117.4516" },
            { "city": "Tualatin", "lat": "45.3683", "lon": "-122.756" },
            { "city": "Tumalo", "lat": "44.1561", "lon": "-121.3280" },
            { "city": "Turner", "lat": "44.8109", "lon": "-122.944" },
            { "city": "Tutuilla", "lat": "45.6142", "lon": "-118.7065" },
            { "city": "Tygh Valley", "lat": "45.24", "lon": "-121.311" },
            { "city": "Ukiah", "lat": "45.1348", "lon": "-118.928" },
            { "city": "Umapine", "lat": "45.9760", "lon": "-118.5010" },
            { "city": "Umatilla", "lat": "45.9159", "lon": "-119.297" },
            { "city": "Umpqua", "lat": "43.3892", "lon": "-123.513" },
            { "city": "Union", "lat": "45.1918", "lon": "-117.836" },
            { "city": "Unity", "lat": "44.4351", "lon": "-118.191" },
            { "city": "Vale", "lat": "44.0134", "lon": "-117.289" },
            { "city": "Veneta", "lat": "44.0462", "lon": "-123.349" },
            { "city": "Vernonia", "lat": "45.8606", "lon": "-123.202" },
            { "city": "Vida", "lat": "44.134", "lon": "-122.491" },
            { "city": "Waldport", "lat": "44.4215", "lon": "-124.047" },
            { "city": "Wallowa", "lat": "45.5686", "lon": "-117.528" },
            { "city": "Walterville", "lat": "44.1263", "lon": "-122.633" },
            { "city": "Walton", "lat": "44.0339", "lon": "-123.594" },
            { "city": "Wamic", "lat": "45.2256", "lon": "-121.2927" },
            { "city": "Wapinitia", "lat": "45.1143", "lon": "-121.2565" },
            { "city": "Warm Springs", "lat": "44.7628", "lon": "-121.302" },
            { "city": "Warren", "lat": "45.823", "lon": "-122.883" },
            { "city": "Warrenton", "lat": "46.1463", "lon": "-123.92" },
            { "city": "Wasco", "lat": "45.5939", "lon": "-120.696" },
            { "city": "Waterloo", "lat": "44.4948", "lon": "-122.8243" },
            { "city": "Wedderburn", "lat": "42.4568", "lon": "-124.402" },
            { "city": "Welches", "lat": "45.3392", "lon": "-121.965" },
            { "city": "West Linn", "lat": "45.3669", "lon": "-122.65" },
            { "city": "West Scio", "lat": "44.7098", "lon": "-122.8812" },
            { "city": "West Slope", "lat": "45.4962", "lon": "-122.7731" },
            { "city": "Westfall", "lat": "43.9481", "lon": "-117.75" },
            { "city": "Westfir", "lat": "43.7549", "lon": "-122.504" },
            { "city": "Westlake", "lat": "43.908", "lon": "-124.069" },
            { "city": "Weston", "lat": "45.8142", "lon": "-118.424" },
            { "city": "Westport", "lat": "46.1303", "lon": "-123.3714" },
            { "city": "Wheeler", "lat": "45.6898", "lon": "-123.884" },
            { "city": "White City", "lat": "42.4184", "lon": "-122.815" },
            { "city": "Whiteson", "lat": "45.1515", "lon": "-123.1968" },
            { "city": "Wilbur", "lat": "43.3178", "lon": "-123.343" },
            { "city": "Wilderville", "lat": "42.3713", "lon": "-123.512" },
            { "city": "Willamina", "lat": "45.1199", "lon": "-123.539" },
            { "city": "Williams", "lat": "42.2278", "lon": "-123.28" },
            { "city": "Wilsonville", "lat": "45.3018", "lon": "-122.762" },
            { "city": "Wimer", "lat": "42.5445", "lon": "-123.1480" },
            { "city": "Winchester", "lat": "43.2804", "lon": "-123.356" },
            { "city": "Winchester Bay", "lat": "43.6729", "lon": "-124.1828" },
            { "city": "Winston", "lat": "43.1004", "lon": "-123.455" },
            { "city": "Wolf Creek", "lat": "42.6647", "lon": "-123.37" },
            { "city": "Wood Village", "lat": "45.5358", "lon": "-122.4205" },
            { "city": "Woodburn", "lat": "45.1474", "lon": "-122.856" },
            { "city": "Worden", "lat": "42.0454", "lon": "-121.8664" },
            { "city": "Yachats", "lat": "44.3215", "lon": "-124.089" },
            { "city": "Yamhill", "lat": "45.3514", "lon": "-123.218" },
            { "city": "Yoncalla", "lat": "43.5946", "lon": "-123.241" }
        ]
    },
    layersList = [
        {
            'layer': 'roads',
            'name': 'Road Conditions',
            'default': summerMode ? false : true,
            'desc': 'See current road conditions on interstates and highways'
        },
        {
            'layer': 'webcams',
            'name': 'Travel Cameras',
            'default': true,
            'desc': 'Live images of road &amp; weather conditions'
        },
        {
            'layer': 'rwis',
            'name': 'Live Weather',
            'default': summerMode ? false : true,
            'desc': 'Live weather conditions information'
        },
        {
            'layer': 'incidents',
            'name': 'Incidents',
            'default': true,
            'desc': 'Current incidents and closures impacting highways'
        },
        {
            'layer': 'vms',
            'name': 'Dynamic Message Signs',
            'default': false,
            'desc': 'See current messages on roadside variable signs'
        },
        {
            'layer': 'traffic',
            'name': 'Traffic',
            'default': summerMode ? true : false,
            'desc': 'Display real-time traffic conditions from MapBox'
        },
        {
            'layer': 'construction',
            'name': 'Road Work',
            'default': summerMode ? true : false,
            'desc': 'Display road &amp; bridge maintenance and construction projects'
        },
        {
            'layer': 'radar',
            'name': 'Weather Radar',
            'default': false,
            'desc': 'Show live weather radar across the state'
        }
    ],
    metro = {
        list: [
            {
                name: 'Portland',
                center: [45.434599, -122.655487],
                zoom: 11
            },
            {
                name: 'Salem',
                center: [44.916194, -122.940444],
                zoom: 11
            },
            {
                name: 'Eugene',
                center: [44.050583, -123.033142],
                zoom: 11
            },
            {
                name: 'Medford/Ashland',
                center: [42.273244, -122.783203],
                zoom: 10
            },
            {
                name: 'Bend',
                center: [44.056258, -121.272583],
                zoom: 11.5
            },
            {
                name: 'Santiam/Redmond',
                center: [44.351350, -121.495056],
                zoom: 11
            },
            {
                name: 'Columbia Gorge',
                center: [45.5953, -121.1642],
                zoom: 10.7
            },
            {
                name: 'Pendleton to La Grande',
                center: [45.477947, -118.313140],
                zoom: 11
            },
            {
                name: 'Cabbage Hill',
                center: [45.592509, -118.610715],
                zoom: 14
            },
            {
                name: 'Ladd Canyon',
                center: [45.171872, -117.959518],
                zoom: 11
            }
        ]
    },
    disclaimer = 'OregonRoads is a third-party app built by MAPO LLC. The data and information used in this app is provided by the ' +
        'Oregon Department of Transportation (ODOT)&mdash;an official government agency. However, this app is not an official government app, and is not affiliated or ' +
        'associated with ODOT or the State of Oregon in any way. Please acknowledge that you read and agree with this disclaimer.',
    noRes = '<div id="result" class="none">Searching...</div>',
    modal = null,
    dialog = '<div class="wrapper"><h1></h1><p></p><div class="buttons"><a href="#" id="neg" class="cta" onclick="return false"></a><a href="#" id="pos" class="cta" onclick="return false"></a></div></div>',
    template = '<h1 style="align-items:center"></h1><span class="updated"></span><div class="rows"></div>',
    template2 = '<h1 style="align-items:center"></h1><div class="popup-content"></div>',
    reportTemplate = '<span id="close"></span><h1 style="margin-bottom:0.5em;align-items:center"></h1><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="rw">Road</li><li class="tab" data-tab="wx">Weather</li>' +
        '<li class="tab" data-tab="cams">Cameras</li><li class="tab" data-tab="incs">Incidents</li></ul><div class="tab-content"><div class="content active" data-tab="rw">Loading...</div>' +
        '<div class="content" data-tab="wx">Loading...</div><div class="content" data-tab="cams">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>',
    loading = '<svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" style="position:absolute;top:unset;left:50%;transform:translateX(-50%)" viewBox="0 0 200 200"><radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)"><stop offset="0" stop-color="#FF156D"></stop><stop offset=".3" stop-color="#FF156D" stop-opacity=".9"></stop><stop offset=".6" stop-color="#FF156D" stop-opacity=".6"></stop><stop offset=".8" stop-color="#FF156D" stop-opacity=".3"></stop><stop offset="1" stop-color="#FF156D" stop-opacity="0"></stop></radialGradient><circle transform-origin="center" fill="none" stroke="url(#a12)" stroke-width="10" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70"><animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform></circle><circle transform-origin="center" fill="none" opacity=".2" stroke="#FF156D" stroke-width="10" stroke-linecap="round" cx="100" cy="100" r="70"></circle></svg>';

!function (e) { if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var n; "undefined" != typeof window ? n = window : "undefined" != typeof global ? n = global : "undefined" != typeof self && (n = self), n.geojsonExtent = e() } }(function () { return function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = "function" == typeof require && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } for (var i = "function" == typeof require && require, o = 0; o < r.length; o++)s(r[o]); return s }({ 1: [function (require, module, exports) { function getExtent(_) { for (var ext = extent(), coords = geojsonCoords(_), i = 0; i < coords.length; i++)ext.include(coords[i]); return ext } var geojsonCoords = require("@mapbox/geojson-coords"), traverse = require("traverse"), extent = require("@mapbox/extent"), geojsonTypesByDataAttributes = { features: ["FeatureCollection"], coordinates: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"], geometry: ["Feature"], geometries: ["GeometryCollection"] }, dataAttributes = Object.keys(geojsonTypesByDataAttributes); module.exports = function (_) { return getExtent(_).bbox() }, module.exports.polygon = function (_) { return getExtent(_).polygon() }, module.exports.bboxify = function (_) { return traverse(_).map(function (value) { if (value) { var isValid = dataAttributes.some(function (attribute) { return value[attribute] ? -1 !== geojsonTypesByDataAttributes[attribute].indexOf(value.type) : !1 }); isValid && (value.bbox = getExtent(value).bbox(), this.update(value)) } }) } }, { "@mapbox/extent": 2, "@mapbox/geojson-coords": 4, traverse: 7 }], 2: [function (require, module, exports) { function Extent(bbox) { return this instanceof Extent ? (this._bbox = bbox || [1 / 0, 1 / 0, -(1 / 0), -(1 / 0)], void (this._valid = !!bbox)) : new Extent(bbox) } module.exports = Extent, Extent.prototype.include = function (ll) { return this._valid = !0, this._bbox[0] = Math.min(this._bbox[0], ll[0]), this._bbox[1] = Math.min(this._bbox[1], ll[1]), this._bbox[2] = Math.max(this._bbox[2], ll[0]), this._bbox[3] = Math.max(this._bbox[3], ll[1]), this }, Extent.prototype.equals = function (_) { var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] == other[0] && this._bbox[1] == other[1] && this._bbox[2] == other[2] && this._bbox[3] == other[3] }, Extent.prototype.center = function (_) { return this._valid ? [(this._bbox[0] + this._bbox[2]) / 2, (this._bbox[1] + this._bbox[3]) / 2] : null }, Extent.prototype.union = function (_) { this._valid = !0; var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] = Math.min(this._bbox[0], other[0]), this._bbox[1] = Math.min(this._bbox[1], other[1]), this._bbox[2] = Math.max(this._bbox[2], other[2]), this._bbox[3] = Math.max(this._bbox[3], other[3]), this }, Extent.prototype.bbox = function () { return this._valid ? this._bbox : null }, Extent.prototype.contains = function (ll) { if (!ll) return this._fastContains(); if (!this._valid) return null; var lon = ll[0], lat = ll[1]; return this._bbox[0] <= lon && this._bbox[1] <= lat && this._bbox[2] >= lon && this._bbox[3] >= lat }, Extent.prototype.intersect = function (_) { if (!this._valid) return null; var other; return other = _ instanceof Extent ? _.bbox() : _, !(this._bbox[0] > other[2] || this._bbox[2] < other[0] || this._bbox[3] < other[1] || this._bbox[1] > other[3]) }, Extent.prototype._fastContains = function () { if (!this._valid) return new Function("return null;"); var body = "return " + this._bbox[0] + "<= ll[0] &&" + this._bbox[1] + "<= ll[1] &&" + this._bbox[2] + ">= ll[0] &&" + this._bbox[3] + ">= ll[1]"; return new Function("ll", body) }, Extent.prototype.polygon = function () { return this._valid ? { type: "Polygon", coordinates: [[[this._bbox[0], this._bbox[1]], [this._bbox[2], this._bbox[1]], [this._bbox[2], this._bbox[3]], [this._bbox[0], this._bbox[3]], [this._bbox[0], this._bbox[1]]]] } : null } }, {}], 3: [function (require, module, exports) { module.exports = function (list) { function _flatten(list) { return Array.isArray(list) && list.length && "number" == typeof list[0] ? [list] : list.reduce(function (acc, item) { return Array.isArray(item) && Array.isArray(item[0]) ? acc.concat(_flatten(item)) : (acc.push(item), acc) }, []) } return _flatten(list) } }, {}], 4: [function (require, module, exports) { var geojsonNormalize = require("@mapbox/geojson-normalize"), geojsonFlatten = require("geojson-flatten"), flatten = require("./flatten"); module.exports = function (_) { if (!_) return []; var normalized = geojsonFlatten(geojsonNormalize(_)), coordinates = []; return normalized.features.forEach(function (feature) { feature.geometry && (coordinates = coordinates.concat(flatten(feature.geometry.coordinates))) }), coordinates } }, { "./flatten": 3, "@mapbox/geojson-normalize": 5, "geojson-flatten": 6 }], 5: [function (require, module, exports) { function normalize(gj) { if (!gj || !gj.type) return null; var type = types[gj.type]; return type ? "geometry" === type ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: gj }] } : "feature" === type ? { type: "FeatureCollection", features: [gj] } : "featurecollection" === type ? gj : void 0 : null } module.exports = normalize; var types = { Point: "geometry", MultiPoint: "geometry", LineString: "geometry", MultiLineString: "geometry", Polygon: "geometry", MultiPolygon: "geometry", GeometryCollection: "geometry", Feature: "feature", FeatureCollection: "featurecollection" } }, {}], 6: [function (require, module, exports) { module.exports = function e(t) { switch (t && t.type || null) { case "FeatureCollection": return t.features = t.features.reduce(function (t, r) { return t.concat(e(r)) }, []), t; case "Feature": return t.geometry ? e(t.geometry).map(function (e) { var r = { type: "Feature", properties: JSON.parse(JSON.stringify(t.properties)), geometry: e }; return void 0 !== t.id && (r.id = t.id), r }) : [t]; case "MultiPoint": return t.coordinates.map(function (e) { return { type: "Point", coordinates: e } }); case "MultiPolygon": return t.coordinates.map(function (e) { return { type: "Polygon", coordinates: e } }); case "MultiLineString": return t.coordinates.map(function (e) { return { type: "LineString", coordinates: e } }); case "GeometryCollection": return t.geometries.map(e).reduce(function (e, t) { return e.concat(t) }, []); case "Point": case "Polygon": case "LineString": return [t] } } }, {}], 7: [function (require, module, exports) { function Traverse(obj) { this.value = obj } function walk(root, cb, immutable) { var path = [], parents = [], alive = !0; return function walker(node_) { function updateState() { if ("object" == typeof state.node && null !== state.node) { state.keys && state.node_ === state.node || (state.keys = objectKeys(state.node)), state.isLeaf = 0 == state.keys.length; for (var i = 0; i < parents.length; i++)if (parents[i].node_ === node_) { state.circular = parents[i]; break } } else state.isLeaf = !0, state.keys = null; state.notLeaf = !state.isLeaf, state.notRoot = !state.isRoot } var node = immutable ? copy(node_) : node_, modifiers = {}, keepGoing = !0, state = { node: node, node_: node_, path: [].concat(path), parent: parents[parents.length - 1], parents: parents, key: path.slice(-1)[0], isRoot: 0 === path.length, level: path.length, circular: null, update: function (x, stopHere) { state.isRoot || (state.parent.node[state.key] = x), state.node = x, stopHere && (keepGoing = !1) }, "delete": function (stopHere) { delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, remove: function (stopHere) { isArray(state.parent.node) ? state.parent.node.splice(state.key, 1) : delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, keys: null, before: function (f) { modifiers.before = f }, after: function (f) { modifiers.after = f }, pre: function (f) { modifiers.pre = f }, post: function (f) { modifiers.post = f }, stop: function () { alive = !1 }, block: function () { keepGoing = !1 } }; if (!alive) return state; updateState(); var ret = cb.call(state, state.node); return void 0 !== ret && state.update && state.update(ret), modifiers.before && modifiers.before.call(state, state.node), keepGoing ? ("object" != typeof state.node || null === state.node || state.circular || (parents.push(state), updateState(), forEach(state.keys, function (key, i) { path.push(key), modifiers.pre && modifiers.pre.call(state, state.node[key], key); var child = walker(state.node[key]); immutable && hasOwnProperty.call(state.node, key) && (state.node[key] = child.node), child.isLast = i == state.keys.length - 1, child.isFirst = 0 == i, modifiers.post && modifiers.post.call(state, child), path.pop() }), parents.pop()), modifiers.after && modifiers.after.call(state, state.node), state) : state }(root).node } function copy(src) { if ("object" == typeof src && null !== src) { var dst; if (isArray(src)) dst = []; else if (isDate(src)) dst = new Date(src.getTime ? src.getTime() : src); else if (isRegExp(src)) dst = new RegExp(src); else if (isError(src)) dst = { message: src.message }; else if (isBoolean(src)) dst = new Boolean(src); else if (isNumber(src)) dst = new Number(src); else if (isString(src)) dst = new String(src); else if (Object.create && Object.getPrototypeOf) dst = Object.create(Object.getPrototypeOf(src)); else if (src.constructor === Object) dst = {}; else { var proto = src.constructor && src.constructor.prototype || src.__proto__ || {}, T = function () { }; T.prototype = proto, dst = new T } return forEach(objectKeys(src), function (key) { dst[key] = src[key] }), dst } return src } function toS(obj) { return Object.prototype.toString.call(obj) } function isDate(obj) { return "[object Date]" === toS(obj) } function isRegExp(obj) { return "[object RegExp]" === toS(obj) } function isError(obj) { return "[object Error]" === toS(obj) } function isBoolean(obj) { return "[object Boolean]" === toS(obj) } function isNumber(obj) { return "[object Number]" === toS(obj) } function isString(obj) { return "[object String]" === toS(obj) } var traverse = module.exports = function (obj) { return new Traverse(obj) }; Traverse.prototype.get = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) { node = void 0; break } node = node[key] } return node }, Traverse.prototype.has = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) return !1; node = node[key] } return !0 }, Traverse.prototype.set = function (ps, value) { for (var node = this.value, i = 0; i < ps.length - 1; i++) { var key = ps[i]; hasOwnProperty.call(node, key) || (node[key] = {}), node = node[key] } return node[ps[i]] = value, value }, Traverse.prototype.map = function (cb) { return walk(this.value, cb, !0) }, Traverse.prototype.forEach = function (cb) { return this.value = walk(this.value, cb, !1), this.value }, Traverse.prototype.reduce = function (cb, init) { var skip = 1 === arguments.length, acc = skip ? this.value : init; return this.forEach(function (x) { this.isRoot && skip || (acc = cb.call(this, acc, x)) }), acc }, Traverse.prototype.paths = function () { var acc = []; return this.forEach(function (x) { acc.push(this.path) }), acc }, Traverse.prototype.nodes = function () { var acc = []; return this.forEach(function (x) { acc.push(this.node) }), acc }, Traverse.prototype.clone = function () { var parents = [], nodes = []; return function clone(src) { for (var i = 0; i < parents.length; i++)if (parents[i] === src) return nodes[i]; if ("object" == typeof src && null !== src) { var dst = copy(src); return parents.push(src), nodes.push(dst), forEach(objectKeys(src), function (key) { dst[key] = clone(src[key]) }), parents.pop(), nodes.pop(), dst } return src }(this.value) }; var objectKeys = Object.keys || function (obj) { var res = []; for (var key in obj) res.push(key); return res }, isArray = Array.isArray || function (xs) { return "[object Array]" === Object.prototype.toString.call(xs) }, forEach = function (xs, fn) { if (xs.forEach) return xs.forEach(fn); for (var i = 0; i < xs.length; i++)fn(xs[i], i, xs) }; forEach(objectKeys(Traverse.prototype), function (key) { traverse[key] = function (obj) { var args = [].slice.call(arguments, 1), t = new Traverse(obj); return t[key].apply(t, args) } }); var hasOwnProperty = Object.hasOwnProperty || function (obj, key) { return key in obj } }, {}] }, {}, [1])(1) });

function isVisible(el) {
    if (el == null) {
        return false;
    } else {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
}

function ucwords(str) {
    return str
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

/*function get(q) {
    return document.querySelector(q);
}

function getAll(q) {
    return document.querySelectorAll(q);
}*/

function plural(v) {
    return (v > 1 ? 's' : '');
}

function matheq(d, s, r) {
    return Math.floor(((d / s) - Math.floor(d / s)) * r);
}

function timeAgo(t, w = null, c = null) {
    var val, d = (c ? c : Math.round(new Date().getTime() / 1000)) - t;
    if (d < 5) {
        val = 'Just now';
    } else if (d >= 5 && d < 60) {
        val = d.toFixed(0) + ' sec' + plural(d);
    } else if (d >= 60 && d < 3600) {
        val = Math.floor(d / 60) + ' min' + plural(Math.floor(d / 60)) + ((matheq(d, 60, 60) !== 0) ? ',&nbsp;' + matheq(d, 60, 60) + ' sec' + plural(matheq(d, 60, 60)) : '');
    } else if (d >= 3600 && d < 86400) {
        val = Math.floor(d / 3600) + ' hour' + plural(Math.floor(d / 3600)) + ((matheq(d, 3600, 60) !== 0) ? ',&nbsp;' + matheq(d, 3600, 60) + ' min' + plural(matheq(d, 3600, 60)) : '');
    } else if (d >= 86400 && d < 172800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400)) + ((matheq(d, 86400, 24) !== 0) ? ',&nbsp;' + matheq(d, 86400, 24) + ' hour' + plural(matheq(d, 86400, 24)) : '');
    } else if (d >= 172800 && d < 604800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400));
    } else if (d >= 604800 && d < 2419200) {
        val = Math.floor(d / 604800) + ' week' + plural(Math.floor(d / 604800));
    } else if (d >= 2419200 && d < 31536000) {
        val = Math.floor(d / 2419200) + ' month' + plural(Math.floor(d / 2419200));
    } else if (d >= 31536000) {
        val = Math.floor(d / 31536000) + ' year' + plural(Math.floor(d / 31536000));
    }
    if (w == 1) {
        val = val.split(', ')[0];
    }
    if (t == null) {
        return 'Never';
    } else if (val == 'Just now') {
        return val;
    } else {
        return val + ' ago';
    }
}

async function api(url, fields = null) {
    let result,
        hasParams = false,
        ops = {
            method: url.search('weather.gov') >= 0 || url.search('mapbox.com') >= 0 ? 'GET' : 'POST',
        },
        fd = new FormData();

    if (url.search(apiURL) >= 0 || url.search(host) >= 0) {
        fd.append('key', apiKey);
    }

    if (fields != null) {
        hasParams = true;
        fields.forEach((v) => {
            fd.append(v[0], v[1]);
        });
    }

    if (url.search('weather.gov') < 0 && url.search('mapbox.com') < 0) {
        ops['body'] = fd;
    }

    if (navigator.onLine) {
        await fetch(url, ops).then(async (resp) => {
            result = await resp.json();
        }).catch((e) => {
            console.error(e.message);
        });

        return result;
    } else {
        console.error('You are not connected to the internet');
        return null;
    }
}

function handleURIIntents() {
    /* allows users to go directly to a feature based on the app URL */
    if (queryParams !== undefined) {
        const router = new Router(queryParams),
            theID = router.id(),
            flyTo = function (center, zoom = null) {
                map.flyTo({
                    center: center,
                    zoom: zoom == null ? map.getZoom() + 2.5 : zoom
                });
            },
            updateURI = function (title = '') {
                if (title) {
                    document.title = title + ' | ' + siteTitle;
                }
            };

        let intvl = setInterval(() => {
            if (router.type() == 'road-segment' && rwRetrieved && rwisRetrieved && incidentsRetrieved && roadWorkRetrieved && dmsRetrieved && webcamsRetrieved) {
                const data = JSON.parse(atob(theID)),
                    report = compileReports(data.name);

                new RoadNetwork(
                    data.lat,
                    data.lon,
                    data.hwy
                ).getRange(
                    report,
                    data.name,
                    true
                );

                clearInterval(intvl);
            } else if (router.type() == 'road-report' && rwRetrieved) {
                let s,
                    reports = [];

                roads.features.forEach((roadReports) => {
                    if (roadReports.properties.id == theID) {
                        s = counterpart(roadReports.properties.name.toLowerCase());
                        reports.push(roadReports.properties);
                    }
                });

                roads.features.forEach((roadReports) => {
                    if (roadReports.properties.name.toLowerCase() == s.toLowerCase()) {
                        reports.push(roadReports.properties);
                    }
                });

                updateURI('Report Report for ' + reports[0].name);
                new Modal(reports).roadReport(reports[0].name);
                clearInterval(intvl);
            } else if (router.type() == 'rwis' && rwisRetrieved) {
                const cams = [];

                fetchRWIS(theID, (f) => {
                    if (f != null) {
                        /* get webcams nearby to this RWIS */
                        webcams.forEach((cam) => {
                            const dist = distance(f.geometry.coordinates[1], f.geometry.coordinates[0], cam.geometry.coordinates[1], cam.geometry.coordinates[0]);

                            if (dist <= 1) {
                                cams.push(cam);
                            }
                        });

                        updateURI('Current Weather: ' + f.properties.station.name);
                        new Modal(f.properties).rwis(cams);
                    }
                });

                clearInterval(intvl);
            } else if (router.type() == 'incident' && incidentsRetrieved) {
                findIncident(theID, (inc) => {
                    if (inc == null) {
                        createDialog('Incident Not Found', `We are unable to locate incident #${theID}. It may already be resolved or it doesn't exist.`);
                    } else {
                        updateURI(inc.properties.type + ' @ ' + inc.properties.location.hwy + ' MP ' + inc.properties.location.milepost.start + (inc.properties.location.milepost.end ? '-' + inc.properties.location.milepost.end : '') + (inc.properties.location.direction ? ' ' + inc.properties.location.direction : ''));
                        new Modal(inc.properties).incident();
                    }
                });

                clearInterval(intvl);
            } else if (router.type() == 'construction' && roadWorkRetrieved) {
                roadwork.features.forEach((inc) => {
                    if (inc.properties.id == theID) {
                        if (inc.geometry.type == 'Point') {
                            flyTo(inc.geometry.coordinates);
                        } else {
                            map.fitBounds(inc.geometry.coordinates);
                        }
                        updateURI(inc.properties.type + ' @ ' + inc.properties.location.hwy + ' MP' + inc.properties.location.milepost.start + (inc.properties.location.milepost.end ? '-' + inc.properties.location.milepost.end : '') + (inc.properties.location.direction ? ' ' + inc.properties.location.direction : ''));
                        new Modal(inc.properties).incident();
                    }
                });

                clearInterval(intvl);
            } else if (router.type() == 'dms' && dmsRetrieved) {
                if (varMsgSigns.length > 0) {
                    varMsgSigns.features.forEach((sign) => {
                        if (sign.properties.id == theID) {
                            flyTo(sign.geometry.coordinates);
                            updateURI(sign.properties.name);
                            new Modal(sign.properties).vms();
                        }
                    });
                }

                clearInterval(intvl);
            } else if (router.type() == 'camera' && webcamsRetrieved) {
                let geo = null,
                    firstName,
                    cams = [];

                webcams.forEach((w) => {
                    for (let i = 0; i < w.properties.cameras.length; i++) {
                        if (w.properties.cameras[i].id == theID) {
                            firstName = w.properties.cameras[i].name;
                            geo = w.geometry.coordinates;
                            cams.push(w.properties.cameras[i]);
                        }
                    }
                });

                flyTo(geo);
                updateURI(firstName);
                new Modal(cams).webcam(geo);
                clearInterval(intvl);
            } else if (router.type() == 'area') {
                let area = theID.replaceAll('-', ' ')
                    .split(' ')
                    .map(word => {
                        return word == 'to' ? word : word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');

                if (theID.search('to') < 0) {
                    area = area.replace(' ', '/');
                }

                metro.list.forEach((m) => {
                    if (m.name == area) {
                        map.flyTo({
                            center: [m.center[1], m.center[0]],
                            zoom: m.zoom
                        });

                        updateURI(`${m.name} Area Road Conditions`);
                    }
                });
                clearInterval(intvl);
            }
        }, 500);
    } else {
        if (document.querySelector('#modal').style.display == 'flex') {
            document.querySelector('#modal').style.display = 'none';
            document.querySelector('#modal').classList.remove('full');
            document.querySelector('#modal').classList.remove('disclaimer');
        }
    }
}

function removeHash() {
    const newUrl = window.location.origin + '/oregonroads' + (window.location.search.search('version') ? window.location.search : '') + window.location.hash;
    window.history.pushState({}, siteTitle, newUrl);
    document.title = siteTitle;
}

function progress(m) {
    if (isVisible(document.querySelector('#loading'))) {
        /*document.querySelector('#loading').querySelector('span').innerHTML = m;*/
    }
}

function hideLoading() {
    if (isVisible(document.querySelector('#loading'))) {
        document.querySelector('#loading').remove();
    }

    if (document.querySelector('.logo') && !isVisible(document.querySelector('.logo'))) {
        document.querySelector('.logo').style.display = 'block';
    }
}

function storageIsOld(n, t) {
    /*if ((new Date().getTime() - localStorage.getItem(n + '_time')) > t * 1000) {
        return true;
    } else {
        return false;
    }*/
    return true;
}

function gripHelper(g) {
    var r = '';
    var c = '';

    if (g >= 0.81) {
        r = 'Dry';
        c = 'Ideal conditions';
    } else if (g >= 0.6 && g < 0.81) {
        r = 'Dry or generally wet';
        c = 'Very good';
    } else if (g >= 0.5 && g < 0.6) {
        r = 'Forming snow pack or ice';
        c = 'Okay';
    } else if (g >= 0.45 && g < 0.5) {
        r = 'Snow-covered or icy';
        c = 'Fair';
    } else if (g >= 0.4 && g < 0.45) {
        r = 'Packed snow or snow-covered';
        c = 'Poor';
    } else if (g >= 0.3 && g < 0.4) {
        r = 'Icy';
        c = 'Very poor';
    } else if (g < 0.3) {
        r = 'Ice-covered';
        c = 'Extremely poor';
    }

    return [c, r];
}

function grip(v) {
    const a = gripHelper(v),
        m = 'A surface friction of ' + v + ' is usually ' + a[0].toLowerCase() + ' and the road is likely ' + a[1].toLowerCase() + '.';

    createDialog('Road Grip', m);
}

function road(i) {
    let c = '';
    switch (i) {
        case 0: c = '#bdbdbd'; break;
        case 1: c = '#000'; break;
        case 2: c = '#2196f3'; break;
        case 3: c = '#ff9800'; break;
        case 4: c = '#827717'; break;
        /*case 5: c = '#0cb5c9'; break;*/
        case 5: c = '#7e57c2'; break;
        case 6: c = '#d32f2f'; break;
    }

    return c;
}

function roadName(s) {
    return s.replace(/((OR)([0-9]+))/gm, '$2E$3')
        .replace(/((I)([0-9]+))/gm, '$2-$3');
}

function createDialog(t, m, neg = false, pb = 'Ok', nb = '') {
    if (document.querySelector('.dialog') != null) {
        document.querySelector('.dialog').remove();
    }

    const d = document.createElement('div');

    d.innerHTML = dialog;
    d.classList.add('dialog');
    document.body.appendChild(d);
    document.querySelector('.dialog h1').innerHTML = t;
    document.querySelector('.dialog p').innerHTML = m.replaceAll('..', '.');
    document.querySelector('.dialog #pos').innerHTML = pb;

    if (!neg) {
        document.querySelector('.dialog #neg').remove();
    } else {
        document.querySelector('.dialog #neg').innerHTML = nb;
    }

    document.querySelector('.backdrop').style.display = 'block';
}

function animate(elem, max, d) {
    let pos = 0;

    let id = setInterval(() => {
        if (pos == max) {
            clearInterval(id);

            setTimeout(() => {
                elem.remove();
            }, elem.innerHTML.split(' ').length / 2.5 * 1000);
        } else {
            pos++;
            if (d == 'top') {
                elem.style.top = pos + 'px';
            } else if (d == 'bottom') {
                elem.style.bottom = pos + 'px';
            }
        }
    }, 5);
}

function Snackbar(m) {
    document.body.insertAdjacentHTML('beforeend', '<div class="snackbar">' + m + '</div>');
    animate(document.querySelector('.snackbar'), 16, 'bottom');
}

function saveLoc() {
    const arr = {
        'lat': map.getCenter().lat,
        'lon': map.getCenter().lng,
        'z': map.getZoom()
    };

    new Geo(map.getCenter().lat, map.getCenter().lng, map.getZoom()).saveLocation();
}

function findIncident(id, callback) {
    let found = false;

    incidents.forEach((f) => {
        if (f.properties.id == id) {
            if (f.geometry.type == 'Point') {
                map.flyTo({
                    center: f.geometry.coordinates,
                    zoom: 12
                });
            } else {
                map.fitBounds(geojsonExtent(f.geometry), {
                    padding: 60
                });
            }

            found = true;
            callback(f);
        }
    });

    if (!found) {
        callback(null);
    }
}

function goToRW(n) {
    const report = new Data().compileReports(n);

    document.querySelector('#modal').classList.remove('full');
    new Modal(report).roadReport(n);
}

function fetchRWIS(id, callback) {
    rwis.forEach((stn) => {
        if (stn.properties.id == id) {
            callback(stn);
        }
    });

    callback(null);
}

function goToRWIS(id) {
    fetchRWIS(id, (stn) => {
        if (stn != null) {
            new Modal(stn.properties).rwis();
        }
    });
}

function compileReports(name) {
    let report = [],
        tf = name.toLowerCase(),
        s = counterpart(tf);

    roadReports.forEach(ea => { if (ea.name.toLowerCase() == tf) report.push(ea); });

    if (s != '') {
        roadReports.forEach(ea => { if (ea.name == s) report.push(ea); });
    }

    return report;
}

function counterpart(tf) {
    let s = '';

    if (tf == 'tollgate wb') {
        s = 'Tollgate EB'
    } else if (tf == 'tollgate eb') {
        s = 'Tollgate WB'
    } else if (tf == 'siskiyou summit nb') {
        s = 'Siskiyou Summit SB'
    } else if (tf == 'siskiyou summit sb') {
        s = 'Siskiyou Summit NB'
    } else if (tf == 'meacham eb') {
        s = 'Meacham WB'
    } else if (tf == 'meacham wb') {
        s = 'Meacham EB'
    } else if (tf == 'ladd canyon eb') {
        s = 'Ladd Canyon WB'
    } else if (tf == 'ladd canyon wb') {
        s = 'Ladd Canyon EB'
    } else if (tf == 'pleasant valley eb') {
        s = 'Pleasant Valley WB'
    } else if (tf == 'pleasant valley wb') {
        s = 'Pleasant Valley EB'
    } else if (tf == 'cabbage hill eb') {
        s = 'Cabbage Hill WB'
    } else if (tf == 'cabbage hill wb') {
        s = 'Cabbage Hill EB'
    } else if (tf == 'perry wb') {
        s = 'Perry EB';
    } else if (tf == 'perry eb') {
        s = 'Perry WB';
    }

    return s;
}

function genFav(cat, id, title) {
    const is = isFavorite(cat, id.toString());
    return '<i id="fav" class="fas fa-heart ' + (!is ? 'un' : '') + 'favorite" data-category="' + cat + '" data-title="' + title + '" data-id="' + id + '" title="' + (is ? 'Remove from' : 'Add to') + ' favorites" aria-hidden="true"></i>';
}

function syncFavorites(success = false) {
    const save = async (success) => {
        let data = {
            "roadReports": JSON.parse(localStorage.getItem('favorites_roadReports')),
            "rwis": JSON.parse(localStorage.getItem('favorites_rwis')),
            "cameras": JSON.parse(localStorage.getItem('favorites_cameras'))
        };

        sync = Math.round(new Date().getTime() / 1000);

        const response = await api(apiURL + 'oreroads', [
            ['token', settings.getToken()],
            ['settings', JSON.stringify(data)]
        ]);

        if (response) {
            if (response.success == 1) {
                if (success) {
                    createDialog('Sync Success', 'Your favorite road reports, cameras, and weather stations were successfully synced to your account.');
                }
                console.info('User favorites were successfully synced.');
            } else {
                if (success) {
                    createDialog('Sync Error', 'There was an error syncing your favorite road reports, cameras, and weather stations to your account.');
                }
                console.error('There was en error syncing user favorites.');
            }
        }
    };

    if (settings.user != null) {
        save(success);
    } else {
        return null;
    }
}

function isFavorite(cat, id) {
    const s = localStorage.getItem('favorites_' + cat);

    if (s == null || s == 'null' || s == '') {
        return false;
    } else {
        return (JSON.parse(s).includes(id) ? true : false);
    }
}

function getBearing(startLat, startLng, destLat, destLng) {
    startLat = deg2rad(startLat);
    startLng = deg2rad(startLng);
    destLat = deg2rad(destLat);
    destLng = deg2rad(destLng);

    const y = Math.sin(destLng - startLng) * Math.cos(destLat),
        x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng),
        brng = this.rad2deg(Math.atan2(y, x));

    return getCompassDirection((brng + 360) % 360);
}

function getCompassDirection(b) {
    var d,
        b = Math.round(b / 22.5);

    switch (b) {
        case 1:
            d = "NNE";
            break;
        case 2:
            d = "NE";
            break;
        case 3:
            d = "ENE";
            break;
        case 4:
            d = "E";
            break;
        case 5:
            d = "ESE";
            break;
        case 6:
            d = "SE";
            break;
        case 7:
            d = "SSE";
            break;
        case 8:
            d = "S";
            break;
        case 9:
            d = "SSW";
            break;
        case 10:
            d = "SW";
            break;
        case 11:
            d = "WSW";
            break;
        case 12:
            d = "W";
            break;
        case 13:
            d = "WNW";
            break;
        case 14:
            d = "NW";
            break;
        case 15:
            d = "NNW";
            break;
        default:
            d = "N";
    }
    return d;
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371,
        dLat = deg2rad(lat2 - lat1),
        dLon = deg2rad(lon2 - lon1),
        a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c;

    return (d / 1.609);
}

function deg2rad(d) {
    return d * (Math.PI / 180);
}

function rad2deg(r) {
    return r * (180 / Math.PI);
}

function windChill(t, v) {
    return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(v, 0.16)) + (0.4275 * t * Math.pow(v, 0.16)));
}

function rh(t, td) {
    const a = 17.625,
        b = 243.04;

    return (100 * (Math.exp((a * td) / (b + td)) / Math.exp((a * t) / (b + t)))).toFixed(1);
}

class Router {
    constructor(qp) {
        this.params = qp;
        this.map = ['type', 'id', 'extra'];
        this.route = [];
        this.params = this.params.split('?')[0].split('#')[0].split('/');

        for (let i = 0; i < this.params.length; i++) {
            this.route[this.map[i]] = this.params[i];
        }
    }

    type() {
        return this.route.type ? this.route.type : null;
    }

    id() {
        return this.route.id ? this.route.id : null;
    }

    extra() {
        return this.route.extra ? this.route.extra : null;
    }
}