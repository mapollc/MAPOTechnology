<!DOCTYPE html>
<html>

<head>
    <title>Trending Fires in the US - Map of Fire</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap">
    </noscript>
    <style>
        html,
        body {
            font-family: roboto;
            font-size: 16px;
            margin: 0;
            padding: 0;
            background-color: #333;
            line-height: 1.2;
        }

        .logo {
            margin: 2em 0 0 0;
            text-align: center;
        }

        .logo img {
            max-height: 80px;
        }

        .spinner {
            display: block;
            margin: 1em auto;
            width: 30px;
            height: 30px;
            border: 3px solid rgb(241 143 1 / 80%);
            border-top-color: rgb(241 143 1 / 20%);
            opacity: 1;
        }

        .dashboard {
            display: flex;
            gap: 2em;
            max-width: 1600px;
            padding: 2em;
            margin: 0 auto;
        }

        .column {
            flex: 1;
            min-width: 300px;
            background-color: #fff;
            padding: 1em;
            border-radius: 8px;
            box-shadow: 0 0 10px rgb(0 0 0 / 0.1);
        }

        .column h1 {
            font-size: 30px;
            font-weight: 400;
            color: var(--light-blue);
        }

        .column .desc {
            display: block;
            margin: 1em 0;
            padding: 0;
            line-height: 1.2;
            color: var(--blue-gray);
            font-size: 14px;
            text-transform: uppercase;
        }

        ul.fires-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        ul.fires-list li {
            display: inline-flex;
            width: 100%;
            align-items: center;
            gap: 1em;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            user-select: none;
            cursor: pointer;
            transition: all .15s ease-in-out;
        }

        ul.fires-list li:hover {
            background-color: #f9f9f9;
        }

        ul.fires-list li .spot {
            width: 53px;
            font-size: 20px;
            font-weight: 100;
            padding: 0 .5em;
        }

        ul.fires-list li h2 {
            font-size: 18px;
            color: var(--blue);
            margin: 0 0 8px 0;
        }

        ul.fires-list li .data {
            font-size: 14px;
            line-height: 1.2;
        }

        ul.fires-list li .data b {
            font-weight: 500;
        }

        ul.fires-list li:last-child {
            border-bottom: none;
        }

        footer {
            display: block;
            border-top: 1px solid #444;
            margin: 3em 2em 0 2em;
            text-align: center;
            padding: 3em;
            color: #ccc;
        }

        @media (max-width: 768px) {
            .logo img {
                max-height: 50px;
            }
            .dashboard {
                flex-direction: column;
            }
        }

        @media (max-width: 525px) {
            .column h1, .column .desc {
                text-align: center;
            }
            ul.fires-list li .spot {
                width: 72px;
            }
            ul.fires-list li .data {
                font-size: 16px;
            }
        }
    </style>
</head>

<body>
    <div class="logo">
        <a href="https://mapofire.com">
            <img src="https://www.mapotechnology.com/assets/images/mapofire_logo_transparent.png" title="Map of Fire logo" alt="Map of Fire logo">
        </a>
    </div>

    <div class="dashboard">
        <section class="column" id="trending-fires">
            <h1>Trending Fires</h1>
            <p class="desc"></p>
            <div class="spinner"></div>
            <ul class="fires-list"></ul>
        </section>
        <section class="column" id="popular-fires">
            <h1>Popular Fires</h1>
            <p class="desc"></p>
            <div class="spinner"></div>
            <ul class="fires-list"></ul>
        </section>
    </div>

    <footer>
        &copy; <?=date('Y')?> MAPO LLC
    </footer>

    <script>
        function ucfirst(s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        }

        function ucwords(s) {
            if (s.search(/\s/g) >= 0) {
                var a = s.split(' '),
                    o = '';

                a.forEach(function(s) {
                    o += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
                });

                return o.substring(0, o.length - 1);
            } else {
                return ucfirst(s);
            }
        }

        function numberFormat(n, d = 2) {
            return Intl.NumberFormat('en-US', {
                maximumFractionDigits: d
            }).format(n);
        }
        class Fires {
            constructor() {
                this.apiKey = 'cf707f0516e5c1226835bbf0eece4a0c';
                this.allFires = new Map();
                this.tfUl = document.querySelector('#trending-fires');
                this.pfUl = document.querySelector('#popular-fires');
            }

            fireName(n, t, i) {
                let o = '';
                if (t == 'Prescribed Fire') {
                    o = (n.search('RX') >= 0 ? n : n + ' RX');
                } else if (t == 'Smoke Check') {
                    o = 'Smoke Check' + (i != undefined ? '#' + i.split('-')[1] + '-' + parseInt(i.split('-')[2]) : '');
                } else {
                    o = (n == undefined ? '' : (n == '' ? 'Incident #' + parseInt(i.split('-')[2]) : ucwords(n.toLowerCase())) + ' Fire');
                }

                return o;
            }

            findFire(id) {
                return this.allFires.get(id) ?? null;
            }

            async getAllFires() {
                const data = await fetch('https://api.mapotechnology.com/v1/wildfires/all,new,smk?key=' + this.apiKey);

                if (data.ok) {
                    const fires = await data.json();

                    fires.features.forEach((inc) => {
                        this.allFires.set(parseInt(inc.properties.wfid, 10), inc);
                    });

                    this.getTrending();
                    this.getPopular();
                }
            }

            async getTrending() {
                const data = await fetch('https://api.mapotechnology.com/v1/events?key=' + this.apiKey + '&test=1');

                if (data.ok) {
                    const fires = await data.json();

                    this.display(fires, true);
                }
            }

            async getPopular() {
                const data = await fetch('https://api.mapotechnology.com/v1/events?limit=15&key=' + this.apiKey);

                if (data.ok) {
                    const fires = await data.json();

                    this.display(fires, false);
                }
            }

            display(fires, isTrend) {
                let count = 0,
                    totalAcres = 0,
                    states = [];

                (isTrend ? this.tfUl : this.pfUl).querySelector('.spinner').remove();

                fires.top.forEach((inc, n) => {
                    if (count > 9) return;

                    const fire = this.findFire(inc.wfid);

                    if (fire) {
                        const name = this.fireName(fire.properties.name, fire.properties.type, fire.properties.incidentId),
                            acres = fire.properties.acres == 'Unknown' || fire.properties.acres == '' ? 'Unknown' : numberFormat(fire.properties.acres),
                            add = fire.properties.acres == 'Unknown' || fire.properties.acres == '' ? 0 : fire.properties.acres,
                            clicks = isTrend ? '' : ' &nbsp;&middot;&nbsp; <b>' + numberFormat(inc.count) + '</b> views',
                            li = document.createElement('li');

                        totalAcres += add;
                        states.push(fire.properties.state);

                        li.innerHTML = '<div class="spot">#' + parseInt(count + 1) + '</div><div><h2>' + name + '</h2>' +
                            '<div class="data">' + fire.properties.near + ' &nbsp;&middot;&nbsp; <b>' + acres + '</b> acres' + clicks + '</b></div></div>';

                        li.addEventListener('click', () => {
                            window.open('https://mapofire.com/' + fire.properties.url.replace('wildfire/', 'fires/'));
                        });

                        (isTrend ? this.tfUl : this.pfUl).querySelector('ul').appendChild(li);

                        count++;
                    }
                });

                const noOfStates = [...new Set(states)];

                (isTrend ? this.tfUl : this.pfUl).querySelector('.desc').innerHTML = 'These 10 fires are burning ' + numberFormat(Math.round(totalAcres)) + ' acres across ' + noOfStates.length + ' states';
            }
        }

        document.onreadystatechange = async () => {
            if (document.readyState == 'complete') {
                new Fires().getAllFires();
            }
        };
    </script>
</body>

</html>