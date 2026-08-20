import { ENV, config } from '../app/config.js';
import { global } from '../app/state.js';

import { api, timeAgo, mapMouseOver, geojsonExtent, createDataForm } from '../utils/helpers.js';
import { stateLabels } from '../utils/constants.js';
import { getRings } from '../utils/geometry.js';

import { reorderLayers } from '../map/layers.js';

export class Evacuations {
    constructor() {
        this.activeEvacuations = null;
        this.evacCount = 0;
        this.centroids = [];

        this.ready = this.load();

        this.zoneZoomLevel = {
            min: 10,
            change: 12
        };
    }

    static polygonCentroid(coords) {
        if (!coords) return null;

        let area = 0;
        let cx = 0;
        let cy = 0;

        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const [x0, y0] = coords[j];
            const [x1, y1] = coords[i];

            const f = x0 * y1 - x1 * y0;

            area += f;
            cx += (x0 + x1) * f;
            cy += (y0 + y1) * f;
        }

        area *= 0.5;

        if (area === 0) return coords[0];

        return [
            cx / (6 * area),
            cy / (6 * area)
        ];
    }

    async load() {
        const data = await api(`${ENV.apiURL}evacuations`);

        if (!data?.features) return;

        this.activeEvacuations = data.features;
        this.evacCount = this.activeEvacuations.length;

        // calculate the centers of each evacuation zone
        this.centroids = data.features.map(feature => {
            const { geometry } = feature;

            const ring = geometry?.type === 'Polygon'
                ? geometry?.coordinates[0]
                : geometry?.coordinates[0][0];

            const ctr = Evacuations.polygonCentroid(ring);

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: ctr
                },
                properties: feature.properties
            };
        });

        this.displayEvacs(data);

        return true;
    }

    async createEvacPatterns() {
        const svgs = {
            evac_level1: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDY0MCA2NDAiIGZpbGw9IiMwMjgyM2EiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMzcuNXB4LDI1cHgpIj48ZyBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgxMDBweCwwKSI+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgyMDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSg0MDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48L2c+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwxODBweCkiPjxwYXRoIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDAsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMjAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoNDAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PC9nPjxnIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDEwMHB4LDM2MHB4KSI+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgyMDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSg0MDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48L2c+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCw1NDBweCkiPjxwYXRoIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDAsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMjAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoNDAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PC9nPjwvZz48L3N2Zz4=',
            evac_level2: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDY0MCA2NDAiIGZpbGw9IiNlZGQ2MDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMzcuNXB4LDI1cHgpIj48ZyBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgxMDBweCwwKSI+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgyMDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSg0MDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48L2c+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwxODBweCkiPjxwYXRoIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDAsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMjAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoNDAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PC9nPjxnIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDEwMHB4LDM2MHB4KSI+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgyMDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSg0MDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48L2c+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCw1NDBweCkiPjxwYXRoIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDAsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMjAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoNDAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PC9nPjwvZz48L3N2Zz4=',
            evac_level3: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDY0MCA2NDAiIGZpbGw9IiNlNjAwMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMzcuNXB4LDI1cHgpIj48ZyBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgxMDBweCwwKSI+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgyMDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSg0MDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48L2c+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwxODBweCkiPjxwYXRoIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDAsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMjAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoNDAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PC9nPjxnIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDEwMHB4LDM2MHB4KSI+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSgyMDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48cGF0aCBzdHlsZT0idHJhbnNmb3JtOnRyYW5zbGF0ZSg0MDBweCwwKSBzY2FsZSguMSkiIGQ9Ik01OTQuNTMgNTA4LjYzIDYuMTggNTMuOWMtNi45Ny01LjQyLTguMjMtMTUuNDctMi44MS0yMi40NUwyMy4wMSA2LjE4QzI4LjQzLS44IDM4LjQ5LTIuMDYgNDUuNDcgMy4zN0w2MzMuODIgNDU4LjFjNi45NyA1LjQyIDguMjMgMTUuNDcgMi44MSAyMi40NWwtMTkuNjQgMjUuMjdjLTUuNDIgNi45OC0xNS40OCA4LjIzLTIyLjQ2IDIuODEiLz48L2c+PGcgc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMCw1NDBweCkiPjxwYXRoIHN0eWxlPSJ0cmFuc2Zvcm06dHJhbnNsYXRlKDAsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoMjAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PHBhdGggc3R5bGU9InRyYW5zZm9ybTp0cmFuc2xhdGUoNDAwcHgsMCkgc2NhbGUoLjEpIiBkPSJNNTk0LjUzIDUwOC42MyA2LjE4IDUzLjljLTYuOTctNS40Mi04LjIzLTE1LjQ3LTIuODEtMjIuNDVMMjMuMDEgNi4xOEMyOC40My0uOCAzOC40OS0yLjA2IDQ1LjQ3IDMuMzdMNjMzLjgyIDQ1OC4xYzYuOTcgNS40MiA4LjIzIDE1LjQ3IDIuODEgMjIuNDVsLTE5LjY0IDI1LjI3Yy01LjQyIDYuOTgtMTUuNDggOC4yMy0yMi40NiAyLjgxIi8+PC9nPjwvZz48L3N2Zz4='
        };

        for (const [name, src] of Object.entries(svgs)) {
            const img = new Image();
            img.src = src;

            await img.decode();

            if (!global.map.hasImage(name)) {
                global.map.addImage(name, await createImageBitmap(img));
            }
        }
    }

    displayEvacs(data) {
        this.createEvacPatterns();

        if (!global.map.getSource('evac')) {
            global.map.addSource('evac', {
                type: 'geojson',
                data: data
            });
        }

        if (!global.map.getSource('evac_centriods')) {
            global.map.addSource('evac_centriods', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: this.centroids
                }
            });
        }

        if (!global.map.getLayer('evac_bg')) {
            global.map.addLayer({
                id: 'evac_bg',
                type: 'fill',
                source: 'evac',
                minzoom: 4,
                maxzoom: 14,
                paint: {
                    'fill-pattern': [
                        'concat',
                        'evac_level',
                        ['to-string', ['to-number', ['get', 'level']]]
                    ],
                    'fill-opacity': [
                        'case',
                        ['==', ['to-number', ['get', 'level']], 2],
                        1.0,
                        0.55
                    ]
                },
                layout: {
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });
        }

        if (!global.map.getLayer('evac')) {
            global.map.addLayer({
                id: 'evac',
                type: 'fill',
                source: 'evac',
                minzoom: 4,
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['to-number', ['get', 'level']], 2], '#edd601',
                        ['==', ['to-number', ['get', 'level']], 3], '#e60000',
                        '#02823a'
                    ],
                    'fill-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4,
                        0.3,
                        8,
                        0.2,
                        10,
                        0.1
                    ]
                },
                layout: {
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });

            mapMouseOver('evac');
        }

        if (!global.map.getLayer('evac_outline')) {
            global.map.addLayer({
                id: 'evac_outline',
                type: 'line',
                source: 'evac',
                minzoom: 4,
                paint: {
                    'line-color': '#333',
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'click'], false],
                        3,
                        1
                    ],
                    'line-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4,
                        1.0,
                        11,
                        0.6
                    ]
                },
                layout: {
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });
        }

        if (!global.map.getLayer('evac_title')) {
            global.map.addLayer({
                id: 'evac_title',
                type: 'symbol',
                source: 'evac_centriods',
                minzoom: this.zoneZoomLevel.min,
                paint: {
                    'text-color': '#333',
                    'text-halo-color': '#fff',
                    'text-halo-blur': 1,
                    'text-halo-width': 2
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': config.fonts.source(),
                    'text-field': [
                        'step',
                        ['zoom'],
                        [
                            'case',
                            ['==', ['to-number', ['get', 'level']], 2], 'Level 2: BE SET',
                            ['==', ['to-number', ['get', 'level']], 3], 'Level 3: GO NOW',
                            'Level 1: Be Ready'
                        ],
                        this.zoneZoomLevel.change,
                        [
                            'concat',
                            ['coalesce', ['to-string', ['get', 'zoneID']], ''],
                            '\n',
                            [
                                'case',
                                ['==', ['to-number', ['get', 'level']], 2], 'Level 2: BE SET',
                                ['==', ['to-number', ['get', 'level']], 3], 'Level 3: GO NOW',
                                'Level 1: Be Ready'
                            ]
                        ]
                    ],
                    'text-justify': 'center',
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        this.zoneZoomLevel.min,
                        10,
                        14,
                        16
                    ],
                    'text-max-width': [
                        'step',
                        ['zoom'],
                        8,
                        this.zoneZoomLevel.change,
                        10
                    ],
                    'text-anchor': 'center',
                    'text-offset': [0, 1],
                    'text-letter-spacing': 0.05,
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });
        }

        //global.map.moveLayer('evac', 'perimeters_fill');
        reorderLayers();
    }

    clickListener() {
        const content = [];
        const states = [];
        const counties = [];

        this.activeEvacuations
            ?.sort((a, b) => Number(b.properties.updated) - Number(a.properties.updated))
            .forEach(e => {
                const z = e.properties;
                const nomen = z.level == 1 ? 'Be Ready' : (z.level == 2 ? 'Be Set' : 'Leave Immediately');

                if (!z.county || !z.state) return;

                // Added: store unique states
                if (!states.includes(z.state)) {
                    states.push(z.state);
                }

                // Added: store counties as objects instead of strings
                if (!counties.some(c => c.name === z.county && c.state === z.state)) {
                    counties.push({
                        name: z.county,
                        state: z.state
                    });
                }

                content.push(`<div class="evac level${z.level}" data-state="${z.state}" data-county="${z.county}">
                    <div class="evacTitle">
                        <h3><span class="evac-circ l${z.level}"></span>Level ${z.level}: ${nomen}</h3>
                        <a href="#" class="btn btn-xs btn-black" style="margin:0;min-width:88px" data-action="goToEvacPoly" data-id="${z.id}" onclick="return false">View on Map</a>
                    </div>

                    <details>
                        <summary style="font-weight:400">
                            ${stateLabels[z.state]?.name} &ndash; ${z.county} County
                        </summary>

                        <span style="font-size:15px">${z.notes}</span>
                    </details>

                    <p class="updated" style="text-align:left;color:#4a4a4a">
                        Last updated ${z.updated ? timeAgo(z.updated) : 'N/A'}
                        by ${stateLabels[z.state]?.name} OEM
                    </p>
                </div>`);
            });

        // Added: sort once
        states.sort((a, b) => a.localeCompare(b));
        counties.sort((a, b) => {
            const stateCompare = a.state.localeCompare(b.state);
            return stateCompare || a.name.localeCompare(b.name);
        });

        const stateOptions = states.map(state =>
            `<option value="${state}">${stateLabels[state]?.name}</option>`
        ).join('');

        const countyOptions = counties.map(county =>
            `<option value="${county.name}" data-state="${county.state}">
            ${county.name} County, ${county.state}
        </option>`).join('');

        createDataForm(
            'Active Evacuations',
            `<div class="filterEvacs">
                <select id="evac_states">
                    <option value="">- All States -</option>
                    ${stateOptions}
                </select>

                <select id="evac_county">
                    <option value="">- All Counties -</option>
                    ${countyOptions}
                </select>
            </div>

            <div class="evacs" style="margin:0">
                ${content.join('')}
            </div>`);

        this.filterListener(counties);
    }

    filterListener(counties) {
        let useThisState = '';
        let useThisCounty = '';

        const state = document.querySelector('#evac_states');
        const county = document.querySelector('#evac_county');
        const list = document.querySelectorAll('.evacs .evac');

        // Added: rebuild county dropdown based on selected state
        const updateCountyList = () => {
            county.innerHTML = '<option value="">- All Counties -</option>';

            counties
                .filter(c => !useThisState || c.state === useThisState)
                .forEach(c => {
                    county.insertAdjacentHTML('beforeend', `<option value="${c.name}">${c.name} County</option>`);
                });
        };

        const filter = () => {
            list.forEach(item => {
                const stateMatch = !useThisState || item.dataset.state === useThisState;
                const countyMatch = !useThisCounty || item.dataset.county === useThisCounty;

                item.style.display = (stateMatch && countyMatch) ? 'block' : 'none';
            });
        };

        state.addEventListener('change', e => {
            useThisState = e.target.value;
            useThisCounty = '';

            updateCountyList();

            county.value = '';

            filter();
        });

        county.addEventListener('change', e => {
            useThisCounty = e.target.value;
            filter();
        });

        updateCountyList();
    }

    evacHelper() {
        const btn = document.querySelector('.control.evacBtn');
        if (!btn) return;

        btn.style.display = 'block';
        btn.dataset.tooltip = `Evacuations (${this.evacCount})`;
        if (this.evacCount > 0) btn.innerHTML = `<span class="notify${this.evacCount > 9 ? ' m10' : ''}">${this.evacCount > 9 ? '9+' : this.evacCount}</span>`;
    }

    zoomTo(e) {
        const id = e.dataset.id;
        const layer = global.map.getLayer('evac');

        if (!layer) return;
        if (layer.visibility != 'visible') {
            ['evac', 'evac_outline', 'evac_bg', 'evac_title'].forEach(n => global.map.setLayoutProperty(n, 'visibility', 'visible'));
        }

        const feature = this.activeEvacuations.find(i => i.id == id),
            bounds = geojsonExtent(feature?.geometry);

        if (bounds) {
            global.map.fitBounds(bounds, {
                padding: 100
            });

            global.inits.clickListener.closeDataForm();
        }
    }
}

export class NearbyEvacuations {
    constructor(y, x) {
        this.bufferMiles = 17.5;
        this.x = x;
        this.y = y;
        this.point = [x, y];
    }

    distanceToSegmentMiles(v, w) {
        const distToV = global.conversion.distance(this.y, this.x, v[1], v[0]); // distance from p to v
        const distToW = global.conversion.distance(this.y, this.x, w[1], w[0]); // distance from p to w
        const lineLength = global.conversion.distance(v[1], v[0], w[1], w[0]);

        if (lineLength === 0) return distToV;

        // Treat points as cartesian (approximate) for projection
        const px = this.x, py = this.y,
            vx = v[0], vy = v[1],
            wx = w[0], wy = w[1],
            t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) /
                ((wx - vx) ** 2 + (wy - vy) ** 2);

        if (t < 0) return distToV;
        if (t > 1) return distToW;

        const projX = vx + t * (wx - vx),
            projY = vy + t * (wy - vy);

        return global.conversion.distance(this.y, this.x, projY, projX);
    }

    isPointInPolygon(polygon) {
        let inside = false;
        const [x, y] = this.point;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i],
                [xj, yj] = polygon[j],
                intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    isPointNearPolygon(polygon) {
        if (this.isPointInPolygon(polygon)) return true;
        for (let i = 0; i < polygon.length; i++) {
            const v = polygon[i],
                w = polygon[(i + 1) % polygon.length];
            if (this.distanceToSegmentMiles(v, w) <= this.bufferMiles) return true;
        }
        return false;
    }

    async get() {
        await global.inits.evacuations.ready;

        return this.process();
    }

    process() {
        let grouped = {};

        global.inits.evacuations.activeEvacuations.forEach(feature => {
            let fnotes = '';

            const geom = feature.geometry;
            const polygons = getRings(geom);
            //const polygons = !geom ? [] : (geom?.type === 'Polygon' ? [geom.coordinates[0]] : geom.coordinates.flat());

            const isNear = polygons.some(ring =>
                this.isPointNearPolygon(ring)
            );

            if (isNear) {
                const level = feature.properties.level,
                    notes = feature.properties.notes || '',
                    county = feature.properties.county || '',
                    state = feature.properties.state || '',
                    time = feature.properties.updated || 0;

                if (!grouped[level]) grouped[level] = {
                    level: level,
                    notes: new Set(),
                    counties: new Set(),
                    states: new Set(),
                    updated: new Set()
                };

                if (notes.search('Evac Zone Name') >= 0) fnotes = RegExp(/Evac Zone Name: (.*?)\s\//gm).exec(notes)[1];

                grouped[level].notes.add(fnotes);
                grouped[level].counties.add(county);
                grouped[level].states.add(state);
                grouped[level].updated.add(time);
            }
        });

        return Object.values(grouped).map(group => ({
            level: group.level,
            notes: Array.from(group.notes),
            counties: Array.from(group.counties),
            state: Array.from(group.states),
            updated: Math.max.apply(null, Array.from(group.updated))
        })) ?? null;
    }
}