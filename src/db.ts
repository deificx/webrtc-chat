import {openDB} from 'idb';

type Key = string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange;

export async function getDB() {
    //check for support
    if (!('indexedDB' in window)) {
        throw new Error("This browser doesn't support IndexedDB");
    }

    const storeName = 'keys';

    const dbPromise = await openDB('webrtc-chat', 1, {
        upgrade(upgradedb) {
            if (!upgradedb.objectStoreNames.contains(storeName)) {
                console.log('making a new object store');
                upgradedb.createObjectStore(storeName);
            }
        },
    });

    return {
        async get(key: Key) {
            return (await dbPromise).get(storeName, key);
        },
        async set(key?: Key, val?: any) {
            return (await dbPromise).put(storeName, val, key);
        },
    };
}
