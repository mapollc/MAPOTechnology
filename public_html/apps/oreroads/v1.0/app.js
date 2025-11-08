let menuLoaded = false,
    roadNetwork = [],
    nwsAlerts = [],
    ROAD_RANGE_DIST = 15,
    dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturdary'],
    short_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long_months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
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
    layersList = {
        l: [
            {
                'layer': 'roads',
                'show': layers_roads,
                'name': 'Road Conditions',
                'desc': 'See current road conditions on interstates and highways'
            },
            {
                'layer': 'webcams',
                'show': layers_webcams,
                'name': 'Travel Cameras',
                'desc': 'Live images of road &amp; weather conditions'
            },
            {
                'layer': 'rwis',
                'show': layers_rwis,
                'name': 'Live Weather',
                'desc': 'Live weather conditions information'
            },
            {
                'layer': 'incidents',
                'show': layers_incidents,
                'name': 'Incidents',
                'desc': 'Current incidents and closures impacting highways'
            },
            {
                'layer': 'vms',
                'show': layers_vms,
                'name': 'Dynamic Message Signs',
                'desc': 'See current messages on roadside variable signs'
            },
            {
                'layer': 'traffic',
                'show': layers_traffic,
                'name': 'Traffic',
                'desc': 'Display real-time traffic conditions from MapBox'
            },
            {
                'layer': 'construction',
                'show': layers_construction,
                'name': 'Road Work',
                'desc': 'Display road &amp; bridge maintenance and construction projects'
            }
        ]
    },
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
                zoom: 12
            },
            {
                name: 'Santiam/Redmond',
                center: [44.351350, -121.495056],
                zoom: 10
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
    dialog = '<h1></h1><p></p><div class="buttons"><a href="#" id="neg" class="cta" onclick="return false"></a><a href="#" id="pos" class="cta" onclick="return false"></a></div>',
    template = '<h1 style="align-items:center"></h1><span class="updated"></span><div class="rows"></div>',
    reportTemplate = '<span id="close"></span><h1 style="margin-bottom:0.5em;align-items:center"></h1><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="rw">Road</li><li class="tab" data-tab="wx">Weather</li>' +
        '<li class="tab" data-tab="cams">Cameras</li><li class="tab" data-tab="incs">Incidents</li></ul><div class="tab-content"><div class="content active" data-tab="rw">Loading...</div>' +
        '<div class="content" data-tab="wx">Loading...</div><div class="content" data-tab="cams">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>',
    loading = '<svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" style="top:unset;left:50%;transform:translateX(-50%)" viewBox="0 0 200 200"><radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)"><stop offset="0" stop-color="#FF156D"></stop><stop offset=".3" stop-color="#FF156D" stop-opacity=".9"></stop><stop offset=".6" stop-color="#FF156D" stop-opacity=".6"></stop><stop offset=".8" stop-color="#FF156D" stop-opacity=".3"></stop><stop offset="1" stop-color="#FF156D" stop-opacity="0"></stop></radialGradient><circle transform-origin="center" fill="none" stroke="url(#a12)" stroke-width="10" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70"><animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform></circle><circle transform-origin="center" fill="none" opacity=".2" stroke="#FF156D" stroke-width="10" stroke-linecap="round" cx="100" cy="100" r="70"></circle></svg>';

function get(q) {
    return document.querySelector(q);
}

function getAll(q) {
    return document.querySelectorAll(q);
}

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

function gripHelper(g) {
    var r = "";
    var c = "";

    if (g > 0.6) {
        r = "Dry to generally wet";
        c = "Very Good";
    } else if (g >= 0.5 && g < 0.6) {
        r = "Slushy to snow-covered";
        c = "Good";
    } else if (g >= 0.4 && g < 0.5) {
        r = "Snow-covered";
        c = "Okay";
    } else if (g >= 0.4 && g < 0.45) {
        r = "Snow-covered to packed snow";
        c = "Poor";
    } else if (g >= 0.3 && g < 0.4) {
        r = "Likely icy";
        c = "Very poor";
    } else if (g < 0.3) {
        r = "Ice-covered";
        c = "Extremely poor";
    }

    return [c, r];
}

function grip(v) {
    const a = gripHelper(v),
        m = 'A surface friction of ' + v + ' is usually ' + a[0].toLowerCase() + ' and the road is likely ' + a[1].toLowerCase() + '.';

    createDialog('Road Grip', m);
}

function roadName(s) {
    return s.replace(/((OR)([0-9]+))/gm, '$2E$3')
        .replace(/((I)([0-9]+))/gm, '$2-$3');
}

function createDialog(t, m, neg = false, pb = 'Ok', nb = '') {
    const d = document.createElement('div');

    d.innerHTML = dialog;
    d.classList.add('dialog');
    document.body.appendChild(d);
    get('.dialog h1').innerHTML = t;
    get('.dialog p').innerHTML = m.replaceAll('..', '.');
    get('.dialog #pos').innerHTML = pb;

    if (!neg) {
        get('.dialog #neg').remove();
    } else {
        get('.dialog #neg').innerHTML = nb;
    }

    get('.backdrop').style.display = 'block';
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
    animate(get('.snackbar'), 16, 'bottom');
}

function hash(t, id) {
    const nh = '#' + t + '=' + id;

    if (window.location.hash != nh) {
        window.location.hash = nh;
    }
}

function isFavorite(cat, id) {
    const s = localStorage.getItem('favorites_' + cat);

    if (s == null || s == '') {
        return false;
    } else {
        return (JSON.parse(s).includes(id) ? true : false);
    }
}

function doFavorites(f, cat, id, title) {
    let n = 'favorites_' + cat,
        cur = localStorage.getItem(n),
        arr = [];

    if (f == 'add') {
        if (cur == null) {
            localStorage.setItem(n, '["' + id + '"]');
        } else {
            JSON.parse(cur).forEach((e) => {
                arr.push(e);
            });

            if (arr.includes(id)) {
                console.error('This item already exists in the user\'s favorites');
            } else {
                arr.push(id.toString());
                localStorage.setItem(n, JSON.stringify(arr));
            }
        }

        Snackbar(title + ' was successfully added to your favorites.');
    } else {
        JSON.parse(cur).forEach((e) => {
            if (e != id) {
                arr.push(e);
            }
        });

        localStorage.setItem(n, JSON.stringify(arr));
        Snackbar(title + ' was successfully removed from your favorites.');
    }

    localStorage.setItem('modTime', Math.round(new Date().getTime() / 1000));
}

async function syncData(doDialog) {
    let data = {
        "roadReports": JSON.parse(localStorage.getItem('favorites_roadReports')),
        "rwis": JSON.parse(localStorage.getItem('favorites_rwis')),
        "cameras": JSON.parse(localStorage.getItem('favorites_cameras'))
    };

    favorites = data;
    sync = Math.round(new Date().getTime() / 1000);

    let fd = new FormData();
    fd.append('uid', user.uid);
    fd.append('settings', JSON.stringify(data));

    await fetch('https://api.mapotechnology.com/v1/oreroads?key=' + key, {
        method: 'POST',
        body: fd
    }).then(async function (resp) {
        if (resp.ok) {
            const json = await resp.json();

            if (json.success == 1) {
                if (doDialog) {
                    createDialog('Sync Success', 'Your favorite road reports, cameras, and weather stations were successfully synced to your account.');
                }
                console.info('User favorites were successfully synced.');
            } else {
                if (doDialog) {
                    createDialog('Sync Error', 'There was an error syncing your favorite road reports, cameras, and weather stations to your account.');
                }
                console.error('There was en error syncing user favorites.');
            }
        }
    });
}

function syncFavorites(success = false) {
    if (user != null) {
        if (localStorage.getItem('modTime') > sync || localStorage.getItem('modTime') == null) {
            syncData(success);
        } else {
            if (favorites == null) {
                if (localStorage.getItem('modTime') != null) {
                    syncData(success);
                }
            } else {
                if (favorites.roadReports !== undefined) {
                    localStorage.setItem('favorites_roadReports', JSON.stringify(favorites.roadReports));
                }

                if (favorites.rwis !== undefined) {
                    localStorage.setItem('favorites_rwis', JSON.stringify(favorites.rwis));
                }

                if (favorites.cameras !== undefined) {
                    localStorage.setItem('favorites_cameras', JSON.stringify(favorites.cameras));
                }

                console.info('Favorites were synced from server');
                localStorage.setItem('modTime', Math.round(new Date().getTime() / 1000));
            }
        }
    }
}

function genFav(cat, id, title) {
    const is = isFavorite(cat, id.toString());
    return '<i id="fav" class="fas fa-heart ' + (!is ? 'un' : '') + 'favorite" data-category="' + cat + '" data-title="' + title + '" data-id="' + id + '" title="' + (is ? 'Remove from' : 'Add to') + ' favorites" aria-hidden="true"></i>';
}

function goToRW(n) {
    let rpts = [],
        use,
        i = 0;

    rw.forEach((r) => {
        if (r.id.search(n.replace(/\s([A-Z])B/gm, '')) >= 0) {
            if (r.id == n) {
                use = i;
            }
            rpts.push(r.properties);
            i++;
        }
    });

    findRoad(n);
    new Modal(rpts).roadReport(n, use);
}

function goToRWIS(id) {
    rwis.getLayers().forEach((s) => {
        if (s.feature.properties.station.id == id) {
            new Modal({ json: s.feature.properties }).rwis();
        }
    });
}

function deg2rad(v) {
    return v * Math.PI / 180;
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

class RoadNetwork {
    constructor(lat = null, lon = null, road = null) {
        this.lat = lat;
        this.lon = lon;
        this.road = road;
    }

    async retrieve() {
        if (localStorage.getItem('road_network') == null) {
            //const resp = await fetch('https://api.mapbox.com/datasets/v1/mapollc/clqe6a9gn145e1mk7fhq1ohoy/features?access_token=pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw&start=' + start);
            const resp = await fetch('https://www.mapotechnology.com/oreroads/mileposts.geojson');

            if (resp.ok) {
                const json = await resp.json();
                localStorage.setItem('road_network', JSON.stringify(json));

                this.mileposts(json);
            }
        } else {
            const json = localStorage.getItem('road_network');
            this.mileposts(JSON.parse(json));
        }
    }

    mileposts(json) {
        let results = [];
        json.features.forEach((e) => {
            const name = e.properties.HWYNAME,
                id = e.properties.HWYNUMB,
                mp = e.properties.MP_DISP.split('.')[0],
                lat = e.geometry.coordinates[1],
                lon = e.geometry.coordinates[0];

            results.push({ id, name, mp, lat, lon });
        });

        results.sort((a, b) => {
            return a.id - b.id || parseFloat(a.mp) - parseFloat(b.mp);
        });

        roadNetwork = results;
    }

    getRange(report) {
        let i = 0,
            mps = [],
            arr = [],
            name = '';

        roadNetwork.forEach((e) => {
            if (this.road == e.id && name == '') {
                name = e.name;
            }
        });

        roadNetwork.forEach((rn) => {
            const dist = distance(this.lat, this.lon, rn.lat, rn.lon);

            if (rn.name == name && dist <= ROAD_RANGE_DIST / 2) {
                arr.push(rn);
                mps.push(rn.mp);
                i++;
            }
        });

        if (mps.length > 0) {
            const mp1 = arr.find((f) => {
                return f.mp == Math.min.apply(null, mps).toString();
            });

            const mp2 = arr.find((f) => {
                return f.mp == Math.max.apply(null, mps).toString();
            });

            this.listFeatures(mp1, mp2, report);
        }
    }

    listFeatures(a, b, report) {
        const minlat = b.lat,
            minlon = a.lon,
            maxlat = a.lat,
            maxlon = b.lon,
            arr = [rwis, webcams, incidents, construction];

        let features = {
            'meta': {
                'hwy': roadName(report[0].hwy),
                'start': a.mp,
                'end': b.mp
            },
            'rw': report,
            'rwis': [],
            'webcams': [],
            'incidents': [],
            'construction': []
        };

        arr.forEach((p, n) => {
            p.getLayers().forEach((f) => {
                if (f._latlng) {
                    const ll = f.getLatLng();

                    if ((ll.lat >= minlat && ll.lat <= maxlat) && (ll.lng >= minlon && ll.lng <= maxlon)) {
                        if (n == 0) {
                            features.rwis.push(f.feature);
                        } else if (n == 1) {
                            features.webcams.push(f.feature);
                        } else if (n == 2) {
                            features.incidents.push(f.feature);
                        } else {
                            features.construction.push(f.feature);
                        }
                    }
                }
            });
        });

        this.displayFeatures(features);
    }

    displayFeatures(report) {
        console.info(report);

        /*const modal = get('#modal');

        modal.innerHTML = reportTemplate;
        modal.querySelector('h1').innerHTML = 'Report for ' + report.meta.hwy + ' from MP ' + report.meta.start + '-' + report.meta.end;

        modal.classList.add('full');
        modal.style.display = 'flex';*/
    }
}

class Geo {
    constructor(lat, lon, zoom) {
        this.lat = lat;
        this.lon = lon;
        this.zoom = zoom;
    }

    saveLocation() {
        localStorage.setItem('map_lat', this.lat);
        localStorage.setItem('map_lon', this.lon);
        localStorage.setItem('map_zoom', this.zoom);
    }

    getLocation() {
        return [
            localStorage.getItem('map_lat'),
            localStorage.getItem('map_lon'),
            localStorage.getItem('map_zoom')
        ];
    }
}

class Modal {
    constructor(json) {
        this.json = json;
        this.ht = '<span id="close"></span>' + template;
    }

    vms() {
        let msg = this.json.messages[0][0] + '<br>' + this.json.messages[0][1] + '<br>' + this.json.messages[0][2];

        if (this.json.messages[1]) {
            msg += '<br><span style="font-weight:100">------------------------------------------------------</span><br>' +
                this.json.messages[1][0] + '<br>' + this.json.messages[1][1] + '<br>' + this.json.messages[1][2];
        }

        hash('dms', this.json.id);

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = this.json.name;
        get('#modal .rows').insertAdjacentHTML('afterend', '<div class="vmsMsg">' + msg + '</div>' + (this.json.attached ? '<small>This message is in relation to incident #' + this.json.attached + '.</small>' : ''));
        get('#modal .rows').remove();

        modal.style.display = 'flex';
    }

    roadReport(name, int = 0) {
        if (this.json.length == 0) {
            createDialog('No Report', 'Currently, there is no road report for ' + name + '.');
        } else {
            let data = this.json[int],
                rows = '';

            hash('rw', data.id);

            rows += '<div class="line"><div class="de">Temperature</div><span>' + data.temp + '&deg;F</span></div>';
            rows += '<div class="line"><div class="de">Road Conditions</div><span' + (data.road.id == 3 ? ' class="bi"' : '') + '>' + data.road.condition + '</span></div>';
            rows += '<div class="line"><div class="de">Weather</div><span>' + data.weather + '</span></div>';
            rows += '<div class="line"><div class="de">New Snow</div><span>' + data.snow.new + ' in</span></div>';
            rows += '<div class="line"><div class="de">Roadside Snow</div><span>' + data.snow.roadside + ' in</span></div>';
            rows += (data.notes ? '<div class="line m"><div class="de">Comments</div><span>' + data.notes + '</span></div>' : '');
            rows += (data.restrict.cmv.restrict ? '<div class="line m"><div class="de">Commerical Vehicle Restrictions</div><span>' + data.restrict.cmv.restrict + '</span></div>' : '');
            rows += (data.restrict.chains.cond != 0 ? '<div class="sz"><h3>Snow Zone</h3><p>' + data.restrict.chains.desc + '</p></div>' : '');
            rows += '<small>This data is reported by ODOT maintenance crews five times per day and at other times when conditions change significantly.</small>';

            modal.innerHTML = this.ht;
            get('#modal h1').style.alignItems = 'center';
            get('#modal h1').innerHTML = '<span class="rc"></span>' + data.name + ' (' + roadName(data.hwy) + ')' + genFav('roadReports', data.name, data.name);
            get('#modal h1 .rc').style.backgroundColor = road(data.road.id);
            get('#modal .updated').innerHTML = 'Last report ' + timeAgo(data.updated);
            get('#modal .rows').innerHTML = rows;

            if (data.restrict.chains.cond != 0 && data.restrict.chains.cond != 'A') {
                get('#modal .updated').insertAdjacentHTML('beforebegin', '<p class="chreq">Chain restrictions are in place</p>');
            }

            if (this.json.length > 1) {
                let ops = '';

                this.json.forEach((w, n) => {
                    ops += '<option ' + (w.name == data.name ? 'selected ' : '') + 'value="' + n + '">' + w.name + '</option>';
                });

                get('#modal .updated').insertAdjacentHTML('beforebegin', '<select id="changeRW" data-json=\'' + JSON.stringify(this.json) + '\'>' + ops + '</select>');
            }

            modal.style.display = 'flex';
        }
    }

    rwis() {
        let data = this.json.json,
            pvt = '',
            rows = '',
            geo;

        hash('rwis', data.station.id);

        rwis.getLayers().forEach((e) => {
            if (e.feature.properties.station.id == data.station.id) {
                geo = e.feature.geometry.coordinates;
            }
        });

        if (data.surface.pavement.length != 0) {
            pvt = Math.round(data.surface.pavement[0]) + '&deg;F';

            if (data.surface.pavement[1]) {
                pvt += '/' + Math.round(data.surface.pavement[1]) + '&deg;F';
            }
        }

        if (data.weather.wind.rawdir != 'null') {
            var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + data.weather.wind.dir + '" style="transform:rotate(' + data.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
        }

        rows += '<div class="line"><div class="de">Temperature</div><span>' + Math.round(data.weather.temp) + '&deg;F</span></div>';
        rows += (data.weather.td != 'null' ? '<div class="line"><div class="de">Dew point</div><span>' + Math.round(data.weather.td) + '&deg;F</span></div>' : '');
        rows += (data.surface.pavement[0] ? '<div class="line"><div class="de">Pavement Temperature</div><span>' + pvt + '</span></div>' : '');
        rows += (data.surface.grip != 'null' ? '<div class="line"><div class="de">Surface Friction</div><span><a href="#" onclick="grip(\'' + data.surface.grip + '\');return false">' + (data.surface.grip * 100) + '%</a></span></div>' : '');
        rows += (data.weather.visibility != 'null' ? '<div class="line"><div class="de">Visibility</div><span>' + data.weather.visibility.toFixed(2) + ' miles</span></div>' : '');
        rows += (data.weather.wind.dir != 'null' ? '<div class="line"><div class="de">Wind Direction</div><span>' + wi + data.weather.wind.dir + '</span></div>' : '');
        rows += (data.weather.wind.dir != 'null' && data.weather.wind.speed != 'null' ? '<div class="line"><div class="de">Wind Speed</div><span>' + Math.round(data.weather.wind.speed) + ' mph</span></div>' : '');
        rows += (data.weather.wind.dir != 'null' && data.weather.wind.gust != 'null' ? '<div class="line"><div class="de">Wind Gust</div><span>' + Math.round(data.weather.wind.gust) + ' mph</span></div>' : '');
        rows += '<a href="#" class="btn" id="getwxf" data-lat="' + geo[1] + '" data-lon="' + geo[0] + '" onclick="return false" style="margin-top:1em"><i class="far fa-snowflake"></i>Get weather forecast</a><small>This data is automatically reported from a network of Road Weather Information Systems (RWIS).</small>';

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = roadName(data.station.name) + genFav('rwis', data.station.id, data.station.name);
        get('#modal .updated').innerHTML = 'Last report ' + timeAgo(data.updated);
        get('#modal .rows').innerHTML = rows;

        modal.style.display = 'flex';
    }

    incident() {
        let data = this.json,
            ty,
            col,
            affected = '';

        hash('incident', data.id);

        if (data.type == 'Crash') {
            ty = 'triangle-exclamation';
            col = '#e65100';
        } else if (data.type == 'Closure') {
            ty = 'do-not-enter';
            col = '#dc3545';
        } else {
            ty = 'diamond-exclamation';
            col = '#fcc733';
        }

        if (data.lanes != null) {
            for (let i = 0; i < data.lanes.length; i++) {
                var aff = data.lanes[i].lane;
                var affDir = data.lanes[i].direction;

                affected += aff + ' (' + affDir + ')<br>';
            }
        }

        var h = '<div class="boxes"><div class="ea"><span>Road</span><p>' + data.location.hwy + '</p></div>' +
            '<div class="ea"><span>Milepost</span><p>' + data.location.milepost.start + (data.location.milepost.end ? '-' + data.location.milepost.end : '') + '</p></div>' +
            (data.location.direction ? '<div class="ea"><span>Direction</span><p>' + data.location.direction + '</p></div>' : '') + '</div>' +
            '<p style="color:var(--blue-gray)">' + data.desc + '</p><div class="rows">' +
            '<div class="line m"><div class="de" style="font-size:13px">Delays</div><span>' + data.impact + '</span></div></div>' +
            '<div class="line m" style="margin-top:0.5em"><div class="de" style="font-size:13px">Lanes Affected</div><span>' + (data.lanes == null ? 'None' : affected) + '</span></div></div>' +
            '<a href="#" class="btn dark" style="margin-top:1em" onclick="findIncident(\'' + data.id + '\');return false">Zoom in</a><span class="bottom">Incident #' + data.id + ' &middot; ' + data.location.name + ' (#' + data.location.id + ')</span>';

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = '<i class="fa-solid fa-' + ty + '" style="color:' + col + ';margin-right:0.75em"></i>' + data.type;
        get('#modal .updated').style.textAlign = 'left';
        get('#modal .updated').innerHTML = 'Updated ' + timeAgo(data.updated) + ' &middot; Reported ' + timeAgo(data.created);
        get('#modal .rows').insertAdjacentHTML('afterend', h);
        get('#modal .rows').remove();

        modal.style.display = 'flex';
    }

    webcam() {
        hash('cam', this.json.id);

        modal.innerHTML = this.ht;
        get('#modal h1').innerHTML = this.json.name + genFav('cameras', this.json.id, this.json.name);
        get('#modal .rows').insertAdjacentHTML('afterend', '<div class="cam_wrapper"></div>');
        get('#modal .rows').insertAdjacentHTML('afterend', '<img loading="lazy" src="' + atob(this.json.url) + '?' + new Date().getTime() + '" alt="' + this.json.name + '" title="' + this.json.name + '" class="webcam"><span class="bottom">' + this.json.county + ' County &middot; Provided by ' + this.json.network + '</span>');
        get('#modal .rows').remove();

        modal.style.display = 'flex';
    }
}

function rwisTable() {
    let content = '';

    rwis.getLayers().forEach((s) => {
        let p = s.feature.properties,
            pvt;

        if (p.surface.pavement.length != 0) {
            pvt = Math.round(p.surface.pavement[0]) + '&deg;F';

            if (p.surface.pavement[1]) {
                pvt += '/' + Math.round(p.surface.pavement[1]) + '&deg;F';
            }
        }

        if (p.weather.wind.rawdir != 'null') {
            var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + p.weather.wind.dir + '" style="transform:rotate(' + p.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
        }

        //content += p.station.name + '<br>' + Math.round(p.weather.temp) + '<br>' + pvt + '<br>' + p.weather.wind.dir + p.weather.wind.speed + '<br>';
        content += '<div class="rwis-card" data-id="' + p.station.id + '" onclick="goToRWIS(\'' + p.station.id + '\')">' +
            '<span class="temp">' + Math.round(p.weather.temp) + '&deg;</span>' +
            '<div class="wrap">' +
            '<h2>' + p.station.name + '</h2>' +
            '<div class="rows">' +
            (pvt ? '<div class="line"><div class="de">Pavement Temp</div><span>' + pvt + '</span></div>' : '') +
            (p.weather.wind.speed != null && p.weather.wind.dir != 'null' ? '<div class="line"><div class="de">Wind</div><span>' + (p.weather.wind.rawdir != 'null' ? wi : '') + (p.weather.wind.speed ? Math.round(p.weather.wind.speed) + ' mph' : '') + '</span></div>' : '') +
            (p.surface.grip != 'null' ? '<div class="line"><div class="de">Surface Friction</div><span><a href="#" onclick="grip(\'' + p.surface.grip + '\');return false">' + (p.surface.grip * 100) + '%</a></span></div>' : '') +
            '</div>' +
            '<span class="updated" style="text-align:left;margin-top:1em">Last reported ' + timeAgo(p.updated) + '</span>' +
            '</div></div>';
    });

    get('#modal .tab-content .content[data-tab=rwis]').innerHTML = '<input type="text" id="filterRWIS" class="text" autocomplete="off" placeholder="Search stations...">' + content;
}

async function incsTable() {
    let content = '',
        alerts = '';

    incidents.getLayers().forEach((s) => {
        if (s.feature && s.feature.properties.category != 'Road Work') {
            let p = s.feature.properties,
                isAlert = false;

            if (p.type == 'Closure' || p.impact == 'Closure' || p.impact == 'Closure with Detour') {
                isAlert = true;
            }

            content += '<div class="inc-card" onclick="findIncident(\'' + p.id + '\', true)"><div class="wrap"><span class="updated" style="float:right">' + timeAgo(p.updated) + '</span><h2>' + p.type + '</h2><p style="color:var(--blue)">' + p.location.desc + '</p>' +
                '<span style="color:#555;font-size:14px">' + p.location.hwy + ' &middot; Milepost ' + p.location.milepost.start + (p.location.milepost.end ? '-' + p.location.milepost.end : '') +
                (p.location.direction ? ' &middot; ' + p.location.direction : '') + '</span></div></div>';

            if (isAlert) {
                alerts += '<div class="inc-card" onclick="findIncident(\'' + p.id + '\', true)"><div class="wrap"><span class="updated" style="float:right">' + timeAgo(p.updated) + '</span><h2 style="color:#e53935">' + p.type + '</h2><p style="color:var(--blue)">' + p.location.desc + '</p>' +
                    '<span style="color:#555;font-size:14px">' + p.location.hwy + ' &middot; Milepost ' + p.location.milepost.start + (p.location.milepost.end ? '-' + p.location.milepost.end : '') +
                    (p.location.direction ? ' &middot; ' + p.location.direction : '') + '</span></div></div>';
            }
        }
    });

    /* parse WWAs */
    if (nwsAlerts.length > 0) {
        for (let i = 0; i < nwsAlerts.length; i++) {
            const d1 = new Date(nwsAlerts[i].effective * 1000),
                d2 = new Date(nwsAlerts[i].expires * 1000),
                tzs = d1.toString().match(/\(([A-Za-z\s]+)\)/)[1].split(' '),
                tz = tzs[0].substring(0, 1) + tzs[1].substring(0, 1) + tzs[2].substring(0, 1),
                t1 = (d1.getHours() == 0 ? 12 : (d1.getHours() > 12 ? d1.getHours() - 12 : d1.getHours())) + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes(),
                t2 = (d2.getHours() == 0 ? 12 : (d2.getHours() > 12 ? d2.getHours() - 12 : d2.getHours())) + ':' + (d2.getMinutes() < 10 ? '0' : '') + d2.getMinutes(),
                iss = short_months[d1.getMonth()] + ' ' + d1.getDate() + ', ' + d1.getFullYear() + ' at ' + t1 + ' ' + (d1.getHours() > 12 ? 'P' : 'A') + 'M ' + tz,
                exp = dow[d2.getDay()] + ', ' + long_months[d2.getMonth()] + ' ' + d2.getDate() + ', ' + d2.getFullYear() + ' at ' + t2 + ' ' + (d2.getHours() > 12 ? 'P' : 'A') + 'M';

            alerts += '<div class="wwa-card" onclick="window.open(\'https://alerts-v2.weather.gov/#/?id=' + nwsAlerts[i].id + '\')"><div class="wrap"><h2>' + nwsAlerts[i].event + '</h2><p style="font-size:15px;margin-bottom:0">In effect until ' + exp + '</p>' +
                '<p style="color:var(--blue-gray)">' + nwsAlerts[i].zone + '</p><span class="updated" style="text-align:left">Issued ' + iss + '</span></div></div>';
        }
    }

    get('#modal .tab-content .content[data-tab=alerts]').innerHTML = alerts;
    get('#modal .tab-content .content[data-tab=incs]').innerHTML = content;
}

function rwTable() {
    let content = '';

    for (let i = 0; i < rw.length; i++) {
        let p = rw[i].properties;

        content += '<div class="inc-card" data-id="' + p.name + '"  onclick="goToRW(\'' + p.name + '\')"><div class="wrap"><span class="updated" style="float:right">Last report ' + timeAgo(p.updated) + '</span><h2>' + p.name + '</h2>' +
            '<div class="rows">' +
            '<div class="line"><div class="de">Weather</div><span>' + p.weather + '</span></div>' +
            '<div class="line"><div class="de">Road Conditions</div><span>' + p.road.condition + '</span></div>' +
            '</div></div></div>';
    }

    get('#modal .tab-content .content[data-tab=roads]').innerHTML = '<input type="text" id="filterRW" class="text" autocomplete="off" placeholder="Search reports...">' + content;
}

function webcamTable() {
    let content = '',
        count = 0;

    webcams.getLayers().forEach((w) => {
        if (isFavorite('cameras', w.feature.properties.id)) {
            content += '<div style="' + (count != 0 ? 'margin-top:0.5em;' : '') + 'text-align:center"><h4>' + w.feature.properties.name + '</h4><img loading="lazy" src="' + atob(w.feature.properties.url) + '?' + new Date().getTime() + '" alt="' + w.feature.properties.name + '" title="' + w.feature.properties.name + '" class="webcam"></div>';
            count++;
        }
    });

    get('#modal .tab-content .content[data-tab=cams]').innerHTML = (count == 0 ? 'You currently don\'t have any favorite cameras' : content);
}

async function getWxFcst(e) {
    let content = content2 = '';
    get('#modal').classList.add('full');
    get('#modal').innerHTML = '<span id="close"></span>' + template.replace('<div class="rows"></div>', loading);

    const resp = await fetch('https://api.mapotechnology.com/v1/forecast?key=' + key + '&lat=' + e.getAttribute('data-lat') + '&lon=' + e.getAttribute('data-lon'));

    if (resp.ok) {
        const json = await resp.json();
        let h = json.forecast.hourly.periods,
            d = json.forecast.daily.periods;

        get('#modal h1').innerHTML = 'Weather Forecast';

        if (json.forecast.hourly.updated == false || json.forecast.daily.updated == false) {
            get('#modal svg').insertAdjacentHTML('afterend', '<p style="text-align:center">The weather forecast for this location is unavailable right now.</p>');
            get('#modal svg').remove();
        } else {
            for (let i = 0; i < h.length; i++) {
                const hr = new Date(h[i].startTime * 1000).getHours(),
                    time = (hr == 0 ? 12 : (hr > 12 ? hr - 12 : hr)) + ' ' + (hr < 12 ? 'A' : 'P') + 'M';

                content += '<div class="tp"><h3>' + h[i].temperature + '&deg;</h3><img title="' + h[i].shortForecast + '" alt="' + h[i].shortForecast + '" src="' + h[i].icon + '"><p>' + time + '</p></div>';
            }

            for (let i = 0; i < d.length; i++) {
                content2 += '<div class="tp"><div class="head"><h3>' + d[i].name + '</h3><img title="' + d[i].shortForecast + '" alt="' + d[i].shortForecast + '" src="' + d[i].icon + '" style="height:65px">' +
                    '<p>' + d[i].temperature + '&deg;</p></div><p style="font-size:15px">' + d[i].detailedForecast + '</p></div>';
            }

            get('#modal .updated').innerHTML = 'Last updated ' + timeAgo(json.forecast.hourly.updated);
            get('#modal svg').insertAdjacentHTML('afterend', '<div class="hrly">' + content + '</div><div class="daily">' + content2 + '</div>');
            get('#modal svg').remove();
        }
    }
}

function doHash(hash) {
    if (hash != '') {
        const s = hash.replace('#', '').split('='),
            htype = s[0],
            id = s[1];

        var int = setInterval(() => {
            if (htype == 'rw' && rw.length != 0) {
                rw.forEach((e) => {
                    if (e.properties.id == id) {
                        new Modal([e.properties]).roadReport(e.id);
                    }
                });

                clearInterval(int);
            }

            if (htype == 'rwis' && rwis.getLayers().length != 0) {
                rwis.getLayers().forEach((e) => {
                    if (e.feature.properties.station.id == id) {
                        const json = { json: e.feature.properties };
                        new Modal(json).rwis();
                    }
                });

                clearInterval(int);
            }

            if (htype == 'cam' && webcams.getLayers().length != 0) {
                webcams.getLayers().forEach((e) => {
                    if (e.feature.properties.id == id) {
                        new Modal(e.feature.properties).webcam();
                    }
                });

                clearInterval(int);
            }

            if (htype == 'dms' && vms.getLayers().length != 0) {
                vms.getLayers().forEach((e) => {
                    if (e.feature.properties.id == id) {
                        new Modal(e.feature.properties).vms();
                    }
                });

                clearInterval(int);
            }

            if (htype == 'incident' && incidents.getLayers().length != 0) {
                let exists = false;

                incidents.getLayers().forEach((e) => {
                    if (e.feature !== undefined && e.feature.properties.id == id) {
                        exists = true;

                        new Modal(e.feature.properties).incident();
                        findIncident(e.feature.properties.id);
                    } else if (e.options.feature !== undefined && e.options.feature.properties.id == id) {
                        exists = true;

                        new Modal(e.options.feature.properties).incident();
                        findIncident(e.options.feature.properties.id);
                    }
                });

                if (!exists) {
                    createDialog('Not Found', 'Incident #' + id + ' is either not active anymore or can\'t be found.');
                }

                clearInterval(int);
            }
        }, 1000);
    }
}

async function wwas() {
    const al = await fetch('https://api.mapotechnology.com/v1/wwas/oreroads?key=' + key);

    if (al.ok) {
        const resp = await al.json();

        if (resp.wwas != null && resp.wwas.length > 0) {
            nwsAlerts = resp.wwas;
        }
    }
}

window.addEventListener('load', () => {
    /* determine versioning for app */
    if (localStorage.getItem('version') == null) {
        localStorage.setItem('version', version);
        localStorage.setItem('buildDate', build);
        localStorage.setItem('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    }

    new RoadNetwork().retrieve();
    wwas();

    const d = '<div class="search">' +
        '<i class="fas fa-search"></i><input type="text" id="search" autocomplete="off" placeholder="Find road reports or cities..."></div>' +
        '<div class="search-results"><div id="result" class="none">Searching...</div></div>' +
        '<img class="logo" src="https://www.mapotechnology.com/assets/images/oreroads/oreroads_logo_small.png" style="cursor:pointer" onclick="window.location.href=window.location.href">' +
        '<div class="mitem-wrapper"><div id="layers" class="mitem" title="Layers"><i class="fa-solid fa-layer-group"></i></div>' +
        '<div id="table" class="mitem" title="Tabular Listing"><i class="fa-sharp fa-regular fa-table"></i></div>' +
        '<div id="areas" class="mitem" title="Zoom Areas"><i class="fa-solid fa-magnifying-glass-plus"></i></div>' +
        '<div id="myfavorites" class="mitem" title="My Favorites"><i class="fa-solid fa-heart"></i></div>' +
        '<div id="user" class="mitem" title="Account"><i class="fa-solid fa-user"></i></div></div>' +
        '<div id="menu"><span id="close"></span></div>' +
        '<div id="modal"></div>' +
        '<div class="backdrop"></div>';

    get('#map').insertAdjacentHTML('afterend', d);

    let menu = get('#menu');

    /* user logged out, show them a message*/
    if (window.location.search.search('loggedOut') >= 0) {
        createDialog('Logged Out', 'You were successfully logged out of your MAPO account.', false, 'Thanks');
        window.history.pushState(null, null, window.location.href.split('?')[0]);
    }

    get('#areas').addEventListener('click', () => {
        let d = document.createElement('div'),
            items = '';

        metro.list.forEach((i) => {
            const zm = i.zoom - (window.outerWidth < 475 ? 2 : (window.outerWidth < 600 ? 1 : 0));
            items += '<li><a href="#" onclick="map.setView([' + i.center[0] + ',' + i.center[1] + '], ' + zm + ');' +
                'get(\'.dialog\').remove();get(\'.backdrop\').style.display=\'none\';return false">' + i.name + '</a></li>';
        });

        d.innerHTML = dialog;
        d.classList.add('dialog');
        document.body.appendChild(d);
        get('.dialog h1').innerHTML = 'Go to an area';
        get('.dialog p').innerHTML = '<ul>' + items + '</ul>';
        get('.dialog #pos').innerHTML = 'Cancel';

        get('.dialog #neg').remove();

        get('.backdrop').style.display = 'block';
    });

    get('#layers').addEventListener('click', () => {
        if (!menuLoaded) {
            let lm = '<h1>Layers</h1>',
                active = [],
                lsl = localStorage.getItem('layers');

            layersList.l.forEach((e) => {
                var chk = null;

                if (lsl != null) {
                    JSON.parse(lsl).forEach((l) => {
                        if (l.layer == e.layer) {
                            chk = (l.show ? true : false);
                        }
                    });
                }

                lm += '<div class="item"><div class="t"><h2>' + e.name + '</h2><span style="font-size:14px">' + e.desc + '</span></div><div class="s">' +
                    '<label class="switch"><input type="checkbox" class="toggle" data-layer="' + e.layer + '"' + ((lsl == null && e.show) || (lsl != null && chk) ? ' checked' : '') + '><span class="slider"></span></label></div></div>';

                active.push({ layer: e.layer, show: e.show });
            });

            if (lsl == null) {
                localStorage.setItem('layers', JSON.stringify(active));
            }

            menu.insertAdjacentHTML('beforeend', lm);
            menuLoaded = true;
        }

        menu.style.display = 'block';
    });

    get('#user').addEventListener('click', () => {
        var uri = window.location.pathname + (window.location.hash ? window.location.hash : '');

        if (windowHost == 'localhost') {
            user = true;
        }

        if (user) {
            document.body.insertAdjacentHTML('beforeend', '<ul id="userMenu"><li class="head"><span>Hi, ' + user.first_name + '</span></li><li onclick="syncFavorites(true)"><a href="#" onclick="return false">Sync Favorites</a></li><li><a href="../account/settings">Account</a></li>' +
                '<li><a href="../logout?next=' + encodeURIComponent(uri + '?loggedOut=1') + '">Logout</a></li><li><a href="#" onclick="createDialog(\'Disclaimer\', disclaimer, false, \'Ok\');get(\'.dialog\').classList.add(\'disclaimer\');get(\'ul#userMenu\').remove();return false">Disclaimer</a></li>' +
                '<li><a target="blank" href="../about/contact">Contact Us</a></li></div>');
            get('ul#userMenu').style.top = get('#user').parentElement.offsetTop + 'px';
            get('ul#userMenu').style.left = (get('#user').parentElement.offsetLeft - 166) + 'px';
        } else {
            window.location.href = 'https://www.mapotechnology.com/secure/login?next=' + encodeURIComponent(uri);
        }
    });

    get('#table').addEventListener('click', () => {
        const modal = get('#modal');

        history.replaceState(null, null, ' ');

        modal.innerHTML = '<span id="close"></span><div class="wrapper"><ul class="tabs"><li class="tab" data-tab="alerts">Alerts</li><li class="tab active" data-tab="rwis">Weather</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="incs">Incidents</li></ul>' +
            '<div class="tab-content"><div class="content" data-tab="alerts">There are currently no high priority alerts.</div><div class="content active" data-tab="rwis">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>';
        modal.classList.add('full');
        modal.style.display = 'flex';

        rwisTable();
        incsTable();
        rwTable();
    });

    get('#myfavorites').addEventListener('click', () => {
        let modal = get('#modal'),
            rwisCount = rwis.getLayers().length,
            rwCount = rw.length;

        history.replaceState(null, null, ' ');

        modal.innerHTML = '<span id="close"></span><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="cams">Cameras</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="rwis">Weather</li></ul>' +
            '<div class="tab-content"><div class="content active" data-tab="cams">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="rwis">Loading...</div></div></div>';
        modal.classList.add('full');
        modal.style.display = 'flex';

        webcamTable();
        rwisTable();

        getAll('#modal .tab-content .content[data-tab=rwis] .rwis-card').forEach((e) => {
            if (!isFavorite('rwis', e.getAttribute('data-id'))) {
                e.remove();
                rwisCount--;
            }

            if (rwisCount == 0) {
                get('#modal .tab-content .content[data-tab=rwis]').innerHTML = 'You currently don\'t have any favorite weather stations';
            }
        });

        rwTable();

        getAll('#modal .tab-content .content[data-tab=roads] .inc-card').forEach((e) => {
            if (!isFavorite('roadReports', e.getAttribute('data-id'))) {
                e.remove();
                rwCount--;
            }

            if (rwCount == 0) {
                get('#modal .tab-content .content[data-tab=roads]').innerHTML = 'You currently don\'t have any favorite road reports';
            }
        });
    });

    get('button.query').addEventListener('click', () => {
        /*roads.getLayers()[0].getLayers().forEach((l) => {
            roadsArray.push(l.feature.properties.name);
        });*/

        get('.search').style.display = 'flex';
        get('#search').focus();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.split('?')[0];

    syncFavorites();

    setInterval(() => {
        window.location.href = window.location.href;
    }, 900000);

    if (!localStorage.getItem('firstLoad')) {
        localStorage.setItem('firstLoad', new Date().getTime() / 1000);
    }

    if (!localStorage.getItem('disclaimer')) {
        let t = setInterval(() => {
            if (rw.length > 0) {
                clearInterval(t);

                setTimeout(() => {
                    createDialog('Disclaimer', disclaimer, false, 'I agree');
                    get('.dialog').classList.add('disclaimer');
                }, 1000);
            }
        }, 500);
    }

    if (localStorage.getItem('layers')) {
        JSON.parse(localStorage.getItem('layers')).forEach((l) => {
            if (l.layer == 'roads') {
                layers_roads = l.show;
            }
            if (l.layer == 'webcams') {
                layers_webcams = l.show;
            }
            if (l.layer == 'rwis') {
                layers_rwis = l.show;
            }
            if (l.layer == 'incidents') {
                layers_incidents = l.show;
            }
            if (l.layer == 'vms') {
                layers_vms = l.show;
            }
            if (l.layer == 'traffic') {
                layers_traffic = l.show;
            }
            if (l.layer == 'construction') {
                layers_construction = l.show;
            }
        });
    }

    doHash(hash);
});

/* on window resize */
window.addEventListener('resize', (e) => {
    const um = get('ul#userMenu');

    if (isVisible(um)) {
        const u = get('#user').parentElement;
        um.style.top = u.offsetTop + 'px';
        um.style.left = (u.offsetLeft - 166) + 'px';
    }
});

/* on event clicks */
window.addEventListener('click', (e) => {
    /* close modal */
    if (e.target.id == 'close') {
        history.replaceState(null, null, ' ');
        e.target.parentElement.style.display = 'none';
        get('#modal').classList.remove('full');
        get('#modal').classList.remove('disclaimer');
    }

    /* click on positive CTA button in dialog */
    if (e.target.id == 'pos' && e.target.classList.contains('cta')) {
        if (get('.dialog').classList.contains('disclaimer')) {
            localStorage.setItem('disclaimer', new Date().getTime() / 1000);
        }

        get('.dialog').remove();
        get('.backdrop').style.display = 'none';
        history.replaceState(null, null, ' ');
    }

    /* get weather forecast */
    if (e.target.id == 'getwxf') {
        getWxFcst(e.target);
    }

    /* on search result click */
    if (e.target.id == 'result') {
        get('#search').value = '';
        get('.search').style.display = 'none';
        get('.search-results').style.display = 'none';
        get('.search-results').innerHTML = noRes;

        if (e.target.getAttribute('data-report')) {
            map.fitBounds(roads.getLayers()[0].getLayers()[e.target.getAttribute('data-id')].getBounds(), {
                padding: [15, 15]
            });

            rw.forEach((l) => {
                if (l.id == e.target.getAttribute('data-report')) {
                    new Modal([l.properties]).roadReport(l.id);
                }
            });
        } else if (e.target.getAttribute('data-city')) {
            map.setView([e.target.getAttribute('data-lat'), e.target.getAttribute('data-lon')], 12);
        }
    }

    /* favorite an item */
    if (e.target.id == 'fav') {
        if (e.target.classList.contains('unfavorite')) {
            e.target.classList.add('favorite');
            e.target.classList.remove('unfavorite');
            e.target.setAttribute('title', 'Remove from favorites');

            doFavorites('add', e.target.getAttribute('data-category'), e.target.getAttribute('data-id'), e.target.getAttribute('data-title'));
        } else {
            e.target.classList.add('unfavorite');
            e.target.classList.remove('favorite');
            e.target.setAttribute('title', 'Add to favorites');

            doFavorites('remove', e.target.getAttribute('data-category'), e.target.getAttribute('data-id'), e.target.getAttribute('data-title'));
        }
    }

    /* tab controls */
    if (e.target.classList.contains('tab')) {
        getAll('ul.tabs li').forEach((t) => {
            t.addEventListener('click', (e) => {
                getAll('ul.tabs li').forEach((p) => {
                    p.classList.remove('active');
                });

                getAll('.tab-content .content').forEach((f) => {
                    f.style.display = (f.getAttribute('data-tab') == t.getAttribute('data-tab') ? 'block' : 'none');
                });

                t.classList.add('active');
            });
        });
    }
});

window.addEventListener('change', (e) => {
    if (e.target.className == 'toggle') {
        let lay,
            active = [];

        switch (e.target.getAttribute('data-layer')) {
            case 'roads': lay = roads; break;
            case 'webcams': lay = webcams; break;
            case 'rwis': lay = rwis; break;
            case 'incidents': lay = incidents; break;
            case 'vms': lay = vms; break;
            case 'traffic': lay = traffic; break;
            case 'construction': lay = construction; break;
        }

        layers(lay, e.target.checked);

        getAll('#menu input[type=checkbox]').forEach((e) => {
            active.push({ layer: e.getAttribute('data-layer'), show: e.checked });
        });
        localStorage.setItem('layers', JSON.stringify(active));
    }

    if (e.target.id == 'changeRW') {
        var e = get('#changeRW');
        new Modal(JSON.parse(e.getAttribute('data-json'))).roadReport(e.options[e.selectedIndex].text, e.options[e.selectedIndex].value);
    }
});

window.addEventListener('mouseup', (e) => {
    var target = e.target,
        modal = get('#modal'),
        search = get('.search'),
        searchRes = get('.search-results'),
        userMenu = get('ul#userMenu');

    if (menu != null) {
        if (target !== menu && !menu.contains(target)) {
            menu.style.display = 'none';
        }
    }

    if (modal != null) {
        if (target !== modal && !modal.contains(target) && !moving) {
            modal.innerHTML = '';
            modal.style.display = 'none';
            history.replaceState(null, null, ' ');
        }
    }

    if (search != null) {
        if (target !== search && !search.contains(target) && target !== searchRes && !searchRes.contains(target)) {
            search.style.display = 'none';
            searchRes.style.display = 'none';
        }
    }

    if (userMenu != null) {
        if (target !== userMenu && !userMenu.contains(target)) {
            userMenu.remove();
        }
    }
});

window.addEventListener('keyup', (e) => {
    var search = e.target,
        md = get('#modal');

    /* close dialog when enter key is pressed */
    if (isVisible(get('.dialog')) && (e.code == 'Enter' || e.code == 'Escape')) {
        get('.dialog').remove();
        get('.backdrop').style.display = 'none';
    }

    /* close modal when esc key is pressed */
    if (isVisible(md) && e.code == 'Escape') {
        history.replaceState(null, null, ' ');
        md.style.display = 'none';
        md.classList.remove('full');
        md.classList.remove('disclaimer');
    }

    if (search.id == 'filterRWIS') {
        if (search.value.length >= 1) {
            getAll('.content[data-tab=rwis] .rwis-card').forEach((e) => {
                const n = e.querySelector('.wrap h2').innerHTML.toString().toLowerCase();

                if (n.search(search.value.replace(/([a-zA-Z]+)\-([0-9]+)?/gm, '$1$2').toLowerCase()) >= 0) {
                    e.style.display = 'flex';
                } else {
                    e.style.display = 'none';
                }
            });
        }
    }

    if (search.id == 'filterRW') {
        if (search.value.length >= 1) {
            getAll('.content[data-tab=roads] .inc-card').forEach((e) => {
                const n = e.querySelector('.wrap h2').innerHTML.toString().toLowerCase();

                if (n.search(search.value.replace(/([a-zA-Z]+)\-([0-9]+)?/gm, '$1$2').toLowerCase()) >= 0) {
                    e.style.display = 'flex';
                } else {
                    e.style.display = 'none';
                }
            });
        }
    }

    if (search.id == 'search') {
        const sr = get('.search-results');

        if (search.value.length >= 2) {
            sr.style.display = 'block';

            let count = 0,
                res = '';

            /* search through all 12-37 reporting stations */
            roadsArray.forEach((e, n) => {
                if (e.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-report="' + e + '" data-id="' + n + '">' + e + '<span>Road Report</span></div>';
                    count++;
                }
            });

            /* search through Oregon cities */
            cities.list.forEach((c) => {
                if (c.city.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-city="' + c.city + '" data-lat="' + c.lat + '" data-lon="' + c.lon + '">' + c.city + ', OR<span>City</span></div>';
                    count++;
                }
            });

            if (count == 0) {
                if (get('.search-result #result.none') != null) {
                    get('.search-results #result.none').innerHTML = 'No results found';
                } else {
                    sr.innerHTML = noRes;
                }
            } else {
                sr.innerHTML = res;
            }
        } else {
            if (get('.search-result #result.none') != null) {
                get('.search-results #result.none').innerHTML = 'No results found';
            } else {
                sr.innerHTML = noRes;
            }
        }
    }
});

window.addEventListener('contextmenu', (e) => {
    if (e.target.localName == 'img' || e.target.localName == 'canvas') {
        e.preventDefault();
    }
});