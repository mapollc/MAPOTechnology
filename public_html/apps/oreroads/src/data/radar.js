import { global } from '../app/global.js';

export class Radar {
    constructor() {
        this.RADAR_INT = 500;
    }

    async init() {
        await fetch('https://api.rainviewer.com/public/weather-maps.json').then(async (resp) => {
            const imgs = await resp.json();

            imgs.radar.past.forEach((e) => {
                global.radarImgs.push(e.time);
            });

            let time = (n) => {
                const d = new Date(global.radarImgs[n] * 1000),
                    h = d.getHours(),
                    m = d.getMinutes();

                return (h > 12 ? h - 12 : (h == 12 ? 12 : h)) + ':'.replace(' ', '') + (m < 10 ? '0' : '') + m + (h >= 12 ? 'p' : 'a') + 'm';
            };

            const rl = '<div class="radar"><div><span class="radarControl fas fa-pause"></span><div class="time">' +
                '<input type="range" steps="12" min="0" max="12" value="0">' +
                '<div class="tr"><span>' + time(0) + '</span><span>' + time(6) + '</span><span>' + time(12) + '</span></div></div></div></div>';

            document.body.insertAdjacentHTML('beforeend', rl);

            this.radar();
        });
    }

    radar() {
        let counter = 0;

        global.radarImgs.forEach((e, n) => {
            global.map.addSource('radar-' + n, {
                type: 'raster',
                tiles: ['https://tilecache.rainviewer.com/v2/radar/' + e + '/256/{z}/{x}/{y}/4/0_1.png'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
            });

            global.map.addLayer({
                id: 'radar-layer-' + n,
                type: 'raster',
                source: 'radar-' + n,
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'raster-fade-duration': 0,
                    'raster-opacity': 0.7
                }
            });
        });

        let ra = () => {
            global.radarImgs.forEach((e, n) => {
                global.map.setLayoutProperty('radar-layer-' + n, 'visibility', (n == counter ? 'visible' : 'none'));
                document.querySelector('.radar input[type=range]').value = counter;
            });

            if (counter == global.radarImgs.length - 1) {
                counter = 0;
                clearInterval(global.radarAnim);

                setTimeout(() => {
                    global.radarAnim = setInterval(ra, this.RADAR_INT);
                }, this.RADAR_INT);
            } else {
                counter++;
            }
        };

        global.radarAnim = setInterval(ra, this.RADAR_INT);
    }
}