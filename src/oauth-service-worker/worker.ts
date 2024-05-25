import {IDBPDatabase} from "idb/build/entry";
import {DBSchema, openDB} from 'idb';
import {expose} from 'comlink'

declare let self: ServiceWorkerGlobalScope;


interface OAuthDataSchema extends DBSchema {
    access_tokens: {
        key: string;
        value: {
            access_token: string;
            scope: string;
            token_type: string;
        };
    };
}

self.addEventListener("install", () => {
    // noinspection JSIgnoredPromiseFromCall
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
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
        }
    }

    async isLoggedIn(): Promise<boolean> {
        await this.initialize();

        const record = await this._db.get("access_tokens", "github");
        return !!record;
    }
}

const oauthServiceWorker = new OAuthServiceWorker();

self.addEventListener("message", (event) => {
    if (event.data.comlinkInit) {
        expose(oauthServiceWorker, event.data.port);
        return;
    }
});