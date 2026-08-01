import { ENV } from './config.js';

export class Mapolytics {
    // ADDED: centralized storage key
    static STORAGE_KEY = 'client_logger_pending';

    constructor(options = {}) {
        this.apiUrl = `${ENV.apiURL}mapolytics`;

        this.maxLogs = options.maxLogs ?? 250;
        this.batchSize = options.batchSize ?? 25;
        this.flushInterval = options.flushInterval ?? 60000;

        // ADDED: prevents overlapping uploads
        this.isFlushing = false;

        // ADDED: unique session id
        this.sessionId = crypto.randomUUID();

        this.logs = [];

        // ADDED: preserve original console methods
        this.originalConsole = {
            log: console.log.bind(console),
            info: console.info.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console)
        };

        this.restoreLogs();
        this.init();
    }

    // ADDED: initialization
    init() {
        this.hookConsole();
        this.hookErrors();
        this.hookFetch();
        this.hookUnload();

        // ADDED: retry any unsent logs from previous session
        if (this.logs.length > 0) setTimeout(() => this.flush(), 5000);

        // ADDED: periodic uploads
        setInterval(() => this.flush(), this.flushInterval);
    }

    // ADDED: load pending logs
    restoreLogs() {
        try {
            const saved = localStorage.getItem(ClientLogger.STORAGE_KEY);

            if (saved) this.logs = JSON.parse(saved) || [];
        } catch (e) {
            this.logs = [];
        }
    }

    // ADDED: persist pending logs
    persistLogs() {
        try {
            localStorage.setItem(
                ClientLogger.STORAGE_KEY,
                JSON.stringify(this.logs)
            );
        } catch (e) { }
    }

    // ADDED: hook console methods
    hookConsole() {
        ['log', 'info', 'warn', 'error'].forEach(level => {
            console[level] = (...args) => {
                this.addLog(level, {
                    message: args.map(arg => this.serialize(arg)).join(' ')
                });

                this.originalConsole[level](...args);

                if (this.logs.length >= this.batchSize) this.flush();
            };
        });
    }

    // ADDED: uncaught exception and promise monitoring
    hookErrors() {
        window.addEventListener('error', event => {
            this.addLog('exception', {
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack ?? null
            });

            this.flush();
        });

        window.addEventListener('unhandledrejection', event => {
            this.addLog('promise', {
                reason: this.serialize(event.reason),
                stack: event.reason?.stack ?? null
            });

            this.flush();
        });
    }

    // ADDED: fetch monitoring
    hookFetch() {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const url = String(args[0] || '');

            // ADDED: ignore logger requests
            if (url.includes(this.apiUrl)) return originalFetch.apply(window, args);

            try {
                const response = await originalFetch.apply(window, args);

                if (!response.ok) {
                    this.addLog('fetch', {
                        url,
                        status: response.status,
                        statusText: response.statusText
                    });
                }

                return response;
            } catch (error) {
                this.addLog('fetch', {
                    url,
                    error: error.message
                });

                throw error;
            }
        };
    }

    // ADDED: unload handling
    hookUnload() {
        const sendLogs = () => {
            if (!this.logs.length) return;

            try {
                navigator.sendBeacon(
                    this.apiUrl,
                    new Blob(
                        [JSON.stringify(this.buildPayload())],
                        { type: 'application/json' }
                    )
                );
            } catch (e) { }
        };

        window.addEventListener('pagehide', sendLogs);
        window.addEventListener('beforeunload', sendLogs);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') sendLogs();
        });
    }

    // ADDED: unified log insertion
    addLog(level, data) {
        this.logs.push({
            level,
            timestamp: Date.now(),
            ...data
        });

        // ADDED: trim old logs
        if (this.logs.length > this.maxLogs) {
            this.logs.splice(0, this.logs.length - this.maxLogs);
        }

        this.persistLogs();
    }

    // ADDED: upload logs
    async flush() {
        if (this.isFlushing || !this.logs.length) return;

        this.isFlushing = true;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.buildPayload()),
                keepalive: true
            });

            if (!response.ok) throw new Error(`Logger API returned ${response.status}`);

            this.logs = [];
            localStorage.removeItem(ClientLogger.STORAGE_KEY);
        } catch (e) {
            // ADDED: keep logs for future retry
            this.persistLogs();
        } finally {
            this.isFlushing = false;
        }
    }

    // ADDED: payload builder
    buildPayload() {
        return {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height
            },
            logs: this.logs
        };
    }

    // ADDED: safe serializer
    serialize(value) {
        try {
            if (value instanceof Error) {
                return JSON.stringify({
                    message: value.message,
                    stack: value.stack
                });
            }

            if (typeof value === 'object' && value !== null) return JSON.stringify(value);

            return String(value);
        } catch (e) {
            return '[unserializable]';
        }
    }
}