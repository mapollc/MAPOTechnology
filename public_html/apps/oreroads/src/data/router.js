export class Router {
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