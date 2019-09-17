import {RTCChatMessage} from './types';
import {getDB} from './db';

export const generateID = (segments = 3): string => {
    const array = new Uint32Array(segments);
    window.crypto.getRandomValues(array);
    return array.join('-');
};

const generateKeys = async () =>
    await window.crypto.subtle.generateKey(
        {
            name: 'RSA-PSS',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        false,
        ['sign', 'verify']
    );

export const getKeys = async (): Promise<CryptoKeyPair> => {
    const keyval = await getDB();
    const keyPair: CryptoKeyPair | undefined = await keyval.get('keys');

    if (keyPair) {
        return keyPair;
    }

    const keys = await generateKeys();
    await keyval.set('keys', keys);

    return keys;
};

export const exportKey = async (key: CryptoKey) => {
    return await crypto.subtle.exportKey('jwk', key);
};

export const importKey = async (jwk: JsonWebKey, keyUsages: 'sign' | 'verify' | ['sign', 'verify']) => {
    return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'RSA-PSS',
            hash: 'SHA-256',
        },
        true,
        Array.isArray(keyUsages) ? keyUsages : [keyUsages]
    );
};

const encode = (message: RTCChatMessage) =>
    new TextEncoder().encode(`${message.author.id}:${message.id}:${message.timestamp}`);

export const signMessage = async (privateKey: CryptoKey, message: RTCChatMessage) => {
    const signature = await window.crypto.subtle.sign(
        {
            name: 'RSA-PSS',
            saltLength: 32,
        },
        privateKey,
        encode(message)
    );
    return {...message, signature: ab2str(signature)};
};

export const verifyMessage = async (publicKey: CryptoKey, message: RTCChatMessage) => {
    if (!message.signature) {
        return false;
    }
    return await window.crypto.subtle.verify(
        {
            name: 'RSA-PSS',
            saltLength: 32,
        },
        publicKey,
        str2ab(message.signature),
        encode(message)
    );
};

// copied from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
const ab2str = (buf: ArrayBuffer) => String.fromCharCode.apply(null, Array.from(new Uint16Array(buf)));
const str2ab = (str: string) => {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};
