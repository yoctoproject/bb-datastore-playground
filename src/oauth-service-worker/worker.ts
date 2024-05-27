import {IDBPDatabase} from "idb/build/entry";
import {DBSchema, openDB} from 'idb';
import {expose} from 'comlink'

declare let self: ServiceWorkerGlobalScope;


interface OAuthDataSchema extends DBSchema {
    access_tokens: {
        key: string;
        value: {
            access_token: string;
        };
    };
}

self.addEventListener("install", () => {
    // noinspection JSIgnoredPromiseFromCall
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

export class OAuthServiceWorker {
    private _db: IDBPDatabase<OAuthDataSchema> | null = null;

    async initialize() {
        if (!this._db) {
            this._db = await openDB<OAuthDataSchema>("oauth-data", 1, {
                upgrade(db) {
                    db.createObjectStore("access_tokens");
                }
            });
            console.log("OPENED DATABASE! :)");
        } else {
            console.log("Database already open");
        }
    }

    async isLoggedIn(): Promise<boolean> {
        return !!(await this.readToken());
    }

    async readToken(): Promise<{ access_token: string } | null> {
        await this.initialize();

        const record = await this._db.get("access_tokens", "github");
        return record || null;
    }

    async logIn(code: string): Promise<boolean> {
        await this.initialize();
        if (await this.isLoggedIn()) {
            console.warn("TODO already logged in");
        }

        try {
            const ret = await fetch("https://github-oauth.laplante.io", {
                method: "POST",
                mode: "cors",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    code,
                })
            });

            const result = await ret.json();
            if (result.error) {
                console.error(result.error);
                return false;
            }

            await this._db.put("access_tokens", {
                access_token: result.token,
            }, "github");

            return true;
        } catch (e) {
            console.error(e);
        }

        return false;
    }
}

const oauthServiceWorker = new OAuthServiceWorker();

self.addEventListener("message", (event) => {
    if (event.data.comlinkInit) {
        expose(oauthServiceWorker, event.data.port);
        return;
    }
});

function isGithubAPIUrl(urlToCheck: string): boolean {
    const githubAPIHost = new URL('https://api.github.com').host;
    try {
        const checkUrlHost = new URL(urlToCheck).host;
        return checkUrlHost === githubAPIHost;
    } catch (error) {
        return false;
    }
}

async function handleRequest(request) {
    const token = await oauthServiceWorker.readToken();

    if (token) {
        const headers = new Headers(request.headers);
        headers.set('Authorization', `Bearer ${token.access_token}`);

        const req = new Request(request, {
            headers,
        });

        return await fetch(req);
    }
}

self.addEventListener("fetch",  (event) => {
    if (isGithubAPIUrl(event.request.url)) {
        event.respondWith(handleRequest(event.request));
    }
});