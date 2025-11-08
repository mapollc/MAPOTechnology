<!DOCTYPE html>
<html>

<head>
    <title>RWIS Monitor for ODOT 5306</title>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//tripcheck.com">
    <link rel="preconnect" href="//cdnjs.cloudflare.com">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=1" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@200;400;600" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box
        }

        html,
        body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: roboto;
            font-size: 15px
        }

        main {
            display: flex;
            width: 100%;
            height: 100%;
            flex-direction: row;
            overflow: hidden;
            border: 1px solid black
        }

        main .reports {
            position: relative;
            flex: 1 1 50%;
            border: 1px solid red;
        }

        main .reports .content {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            display: block;
            width: 100%;
            max-width: 600px;
        }

        main .cameras {
            display: flex;
            flex-direction: column;
            flex: 1 1 50%;
            border: 1px solid red
        }

        main .cameras .upper,
        main .cameras .lower {
            display: flex;
            flex: 1 1 auto;
            max-height: 50%;
            padding: 2em;
            border: 1px solid blue
        }

        .cameras img {
            display: block;
            margin: 0 auto;
            height: 100%;
            max-height: 450px;
            /*background-repeat: no-repeat;
        background-size: contain;
        background-position: center;*/
            transition: all .3s ease-in-out;
        }

        .rwis {
            display: flex;
            flex: 1;
            flex-direction: row-reverse;
            justify-content: space-around;
            align-items: center;
        }

        .rwis #wxtable,
        .rwis #wxtable2 {
            flex: 0 0 auto;
            width: 30%;
        }

        .rwis .cam {
            flex: 0 0 auto;
        }

        .rw1237 {
            display: block;
            width: 100%;
            padding: 2em;
            margin-bottom: 2.25em;
            box-shadow: 0 0 20px rgb(0 0 0 / 10%);
            border-radius: 10px;
            border: 1px solid rgb(0 0 0 / 7%);
        }

        .rw1237:last-child {
            margin-bottom: 0
        }

        @scope(.rw1237, .rwis) {
            h1 {
                display: block;
                margin: 0 0 1em 0;
                padding: 0 0 0.2em 0;
                text-align: center;
                font-size: 20px;
                text-transform: uppercase;
                border-bottom: 1px solid #333
            }

            p.upd {
                display: block;
                text-align: center;
                color: #888;
                font-style: italic;
            }

            .wrapper {
                display: flex;
                flex-direction: column;
                gap: 0.5em
            }

            @scope(.wrapper) {
                .row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 18px
                }

                .row.v {
                    flex-direction: column;
                    gap: 0.5em
                }

                .row .title {
                    font-weight: bold;
                    color: #444
                }
            }
        }
    </style>
</head>

<body>

    <main>
        <div class="reports">
            <div class="content"></div>
        </div>
        <div class="cameras">
            <div class="upper">
                <div class="rwis">
                    <div id="wxtable"></div>
                    <div class="cam"></div>
                </div>
            </div>
            <div class="lower">
                <div class="rwis">
                    <div id="wxtable2"></div>
                    <div class="cam"></div>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <!--<script src="https://www.tripcheck.com/tv/scripts/jquery.Scroller-1.0.min.js"></script>-->
    <script>
        let host = 'https://api.mapotechnology.com/v1/',
            key = 'bG9jYWxob3N0' /*'cf707f0516e5c1226835bbf0eece4a0c'*/ ,
            roads,
            rwisData,
            rwisIDs = [],
            rw = ['Cabbage Hill EB', 'Cabbage Hill WB', 'Meacham EB', 'Meacham WB', 'Ladd Canyon EB', 'Ladd Canyon WB', 'Baker Valley', 'Pleasant Valley EB', 'Pleasant Valley WB', 'Burnt River Canyon'],
            rwis = [{
                    camera: 'DeadmanP-CabbageHill_pid623.jpg',
                    rwis: '12RW011',
                    pos: 'top'
                },
                {
                    camera: 'I-84 at DeadmanPassW_pid4467.jpg',
                    rwis: '12RW011',
                    pos: 'top'
                },
                {
                    camera: 'I-84 at Meacham EB MP237.10_pid4465.jpg',
                    rwis: '12RW012',
                    pos: 'top'
                },
                {
                    camera: 'I-84 at Meacham WB MP237.10_pid4463.jpg',
                    rwis: '12RW012',
                    pos: 'top'
                },
                {
                    camera: 'I-84 at Meacham WB_pid4453.jpg',
                    rwis: '12RW013',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at Meacham EB_pid4455.jpg',
                    rwis: '12RW013',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at Spring Creek EB_pid4461.jpg',
                    rwis: '12RW014',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at ORE244 Hilgard_pid4287.jpg',
                    rwis: '13RW012',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at ORE244 Hilgard_pid4335.jpg',
                    rwis: '13RW012',
                    pos: 'bottom'
                },
                {
                    camera: 'LaddCreekBase_pid1554.jpg',
                    rwis: '13RW001',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at LaddCrk270E_pid4511.jpg',
                    rwis: '13RW002',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at LaddCrk270W_pid4513.jpg',
                    rwis: '13RW002',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at Ladd Creek Summit_pid3531.JPG',
                    rwis: '13RW004',
                    pos: 'bottom'
                },
                {
                    camera: 'I-84 at Clover Creek EB_pid2325.JPG',
                    rwis: '13RW010',
                    pos: 'bottom'
                },
                {
                    camera: 'North Powder_pid2379.JPG',
                    rwis: '13RW005',
                    pos: 'bottom'
                },
                {
                    camera: 'ORE204 at Tollgate_pid4411.jpg',
                    rwis: '13RW007',
                    pos: 'top'
                },
                {
                    camera: 'ORE204 at Spout Springs_pid4503.jpg',
                    rwis: '13RW014',
                    pos: 'top'
                },
                {
                    camera: 'ORE204 at Spout Springs WB_pid4602.jpg',
                    rwis: '13RW014',
                    pos: 'top'
                },
                {
                    camera: 'I-84 at Baker Valley W_pid3656.jpg',
                    rwis: '13RW009',
                    pos: 'top'
                },
                {
                    camera: 'I-84 at MP309_pid4361.jpg',
                    rwis: null,
                    pos: 'top'
                },
                {
                    camera: 'I-84 at Alder CreekE_pid4594.jpg',
                    rwis: '13RW016'
                }
            ],
            apiURL = function(n) {
                return host + n + '?key=' + key;
            },
            cameraCount = 0,
            ANIMATION_SPEED = 23,
            CAMERA_REFRESH = 5,
            rwTemplate = '<div class="rw1237"><h1>{{name}}</h1><p class="upd">{{upd}}</p><div class="wrapper">{{lines}}</div></div>';

        function plural(v) {
            return (v > 1 ? 's' : '');
        }

        function matheq(d, s, r) {
            return Math.floor(((d / s) - Math.floor(d / s)) * r);
        }

        function timeAgo(t, w = null, c = null) {
            var val,
                d = (c ? c : Math.round(new Date().getTime() / 1000)) - t;

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

        function add1237(name, temp, wx, road, newsn, roadsn, notes, chains, updated) {
            let fd = '<div class="row"><div class="title">Air Temp</div><div class="val">' + temp + '&deg;F</div></div>' +
                '<div class="row"><div class="title">Weather</div><div class="val">' + wx + '</div></div>' +
                '<div class="row"><div class="title">Road</div><div class="val">' + road + '</div></div>' +
                '<div class="row"><div class="title">New Snow</div><div class="val">' + newsn + ' in.</div></div>' +
                '<div class="row"><div class="title">Roadside Snow</div><div class="val">' + roadsn + ' in.</div></div>' +
                (notes ? '<div class="row v"><div class="title">Notes</div><div class="val">' + notes + '</div></div>' : '') +
                '<div class="row v"><div class="title">Chain Requirements</div><div class="val">' + chains + '</div></div>';

            let el = rwTemplate.replace('{{name}}', name)
                .replace('{{upd}}', 'Updated ' + timeAgo(updated))
                .replace('{{lines}}', fd);
            document.querySelector('.reports .content').insertAdjacentHTML('beforeend', el);
        }

        function gripHelper(g) {
            var r = "";
            var c = "";

            if (g >= 0.8) {
                r = "Mostly dry";
                c = "Very good";
            } else if (g >= 0.6) {
                r = "Dry or generally wet";
                c = "Very good";
            } else if (g >= 0.5 && g < 0.6) {
                r = "Forming snow pack or ice";
                c = "Okay";
            } else if (g >= 0.45 && g < 0.5) {
                r = "Snow-covered or icy";
                c = "Fair";
            } else if (g >= 0.4 && g < 0.45) {
                r = "Packed snow or snow-covered";
                c = "Poor";
            } else if (g >= 0.3 && g < 0.4) {
                r = "Icy";
                c = "Very poor";
            } else if (g < 0.3) {
                r = "Ice-covered";
                c = "Extremely poor";
            }

            return [c, r];
        }

        function wxData(id, pos) {
            if (id == 'null' && !rwisIDs.includes(id)) {
                document.querySelector((pos == 'top' ? '#wxtable' : '#wxtable2')).innerHTML = '';
            } else {
                rwisData.features.forEach((feat) => {
                    const wx = feat.properties.weather,
                        road = feat.properties.surface;

                    if (feat.properties.station.id == id) {
                        const temp = Math.round(wx.temp),
                            wdir = (wx.wind.dir == 'null' ? null : wx.wind.dir),
                            wspd = (wx.wind.speed == 'null' || wx.wind.dir == 'null' && wx.wind.speed == 0 ? null : Math.round(wx.wind.speed)),
                            wgst = (wx.wind.gust == 'null' || wx.wind.dir == 'null' && wx.wind.gust == 0 ? null : wx.wind.gust),
                            grip = (road.grip == 'null' ? null : road.grip),
                            roadTemp = (road.pavement.length == 0 ? null : Math.round(road.pavement[0]));

                        const el = '<div class="wrapper"><div class="row"><div class="title">Air Temp</div><div class="val">' + temp + '&deg;F</div></div>' +
                            (roadTemp != null ? '<div class="row"><div class="title">Road Temp</div><div class="val">' + roadTemp + '&deg;F</div></div>' : '') +
                            (grip != null ? '<div class="row"><div class="title">Surface Friction</div><div class="val">' + (grip * 100) + '%</div></div>' : '') +
                            (grip != null ? '<div class="row"><div class="title">Road Surface</div><div class="val">' + gripHelper(grip)[1] + '</div></div>' : '') +
                            (wdir != null && wspd != null ? '<div class="row"><div class="title">Wind</div><div class="val">' + wdir + ' / ' + wspd + ' mph</div></div>' : '') +
                            '<p class="upd">Reported ' + timeAgo(feat.properties.updated) + '</p></div>';

                        if (pos == 'top') {
                            document.querySelector('#wxtable').innerHTML = el;
                        } else {
                            document.querySelector('#wxtable2').innerHTML = el;
                        }
                    }
                });
            }
        }

        function startScroll() {
            let scroll,
                doScroll = function() {
                    let wrapper = document.querySelector('.reports .content'),
                        bottom = wrapper.offsetTop + wrapper.offsetHeight;

                    if (bottom <= 0) {
                        clearInterval(scroll);
                        wrapper.style.top = '100%';
                        scroll = setInterval(function() {
                            doScroll();
                        }, ANIMATION_SPEED);
                    } else {
                        $('.reports .content').animate({
                            top: '-=1'
                        }, 0);
                    }
                };

            scroll = setInterval(function() {
                doScroll();
            }, ANIMATION_SPEED);
        }

        async function getRoads() {
            fetch(apiURL('roads'))
                .then(async (data) => {
                    roads = await data.json();
                    let count = 0;

                    roads.rw.forEach((e) => {
                        const name = e.name;

                        if (rw.includes(name)) {
                            const temp = e.temp,
                                wx = e.weather,
                                road = e.road.condition,
                                newsn = e.snow.new,
                                roadsn = e.snow.roadside,
                                notes = e.notes,
                                chains = e.restrict.chains.desc,
                                updated = e.updated;

                            add1237(name, temp, wx, road, newsn, roadsn, notes, chains, updated);
                            count++;

                            if (count == rw.length) {
                                startScroll();
                            }
                        }
                    });
                });
        }

        async function getRWIS() {
            fetch(apiURL('roads/rwis'))
                .then(async (data) => {
                    let topCams = [],
                        bottomCams = [],
                        tn = 0,
                        bn = 0,
                        topPos = 1,
                        bottomPos = 1,
                        rand = new Date().getTime(),
                        upper = document.querySelector('.cameras .upper'),
                        lower = document.querySelector('.cameras .lower');

                    rwisData = await data.json();

                    rwisData.features.forEach((feat) => {
                        rwisIDs.push(feat.properties.station.id);
                    });

                    rwis.forEach((r) => {
                        if (r.pos == 'top') {
                            topCams.push(r.camera);
                            upper.querySelector('.rwis .cam').insertAdjacentHTML('beforeend', '<img data-rwis="' + r.rwis + '" data-id="' + tn + '"' + (tn != 0 ? ' style="display:none"' : '') + ' src="https://tripcheck.com/RoadCams/cams/' + r.camera + '">');
                            wxData(r.rwis, 'top');
                            tn++;
                        } else {
                            bottomCams.push(r.camera);
                            lower.querySelector('.rwis .cam').insertAdjacentHTML('beforeend', '<img data-rwis="' + r.rwis + '" data-id="' + bn + '"' + (bn != 0 ? ' style="display:none"' : '') + ' src="https://tripcheck.com/RoadCams/cams/' + r.camera + '">');
                            wxData(r.rwis, 'bottom');
                            bn++;
                        }
                    });

                    setInterval(function() {
                        let upper = document.querySelectorAll('.cameras .upper img'),
                            lower = document.querySelectorAll('.cameras .lower img');

                        upper.forEach((e) => {
                            e.style.display = 'none';
                        });

                        lower.forEach((e) => {
                            e.style.display = 'none';
                        });

                        wxData(upper[topPos].getAttribute('data-rwis'), 'top');
                        wxData(lower[bottomPos].getAttribute('data-rwis'), 'bottom');

                        upper[topPos].style.display = 'block';
                        lower[bottomPos].style.display = 'block';

                        topPos = (topPos == topCams.length - 1 ? 0 : topPos + 1);
                        bottomPos = (bottomPos == bottomCams.length - 1 ? 0 : bottomPos + 1);
                    }, CAMERA_REFRESH * 1000);
                });
        }

        window.onload = (e) => {
            getRWIS();
            getRoads();

            setInterval(function() {
                window.location.href = window.location.href;
            }, 300000);
        };
    </script>

</body>

</html>