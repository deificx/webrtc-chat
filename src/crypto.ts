import {RTCChatMessage} from './types';

export const generateID = (segments = 3): string => {
    const array = new Uint32Array(segments);
    window.crypto.getRandomValues(array);
    return array.join('-');
};

const generateKeys = async () =>
    await window.crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['sign', 'verify']
    );

export const getKeys = async (): Promise<CryptoKeyPair> => {
    const privateKey = localStorage.getItem('webrtc-chat:privateKey');
    const publicKey = localStorage.getItem('webrtc-chat:publicKey');
    if (!privateKey || !publicKey) {
        const keys = await generateKeys();
        localStorage.setItem('webrtc-chat:privateKey', JSON.stringify(await exportKey(keys.privateKey)));
        localStorage.setItem('webrtc-chat: ', JSON.stringify(await exportKey(keys.publicKey)));
        return keys;
    }
    const keys: CryptoKeyPair = {
        privateKey: await importKey(JSON.parse(privateKey)),
        publicKey: await importKey(JSON.parse(publicKey)),
    };
    return keys;
};

const exportKey = async (key: CryptoKey) => {
    return await crypto.subtle.exportKey('jwk', key);
};

export const exportPublicKey = async () => {
    const {publicKey} = await getKeys();
    return exportKey(publicKey);
};

export const importKey = async (jwk: JsonWebKey) => {
    return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['verify']
    );
};

const encode = (message: RTCChatMessage) =>
    new TextEncoder().encode(`${message.id}:${message.timestamp}:${message.message}`);

export const signMessage = async (privateKey: CryptoKey, message: RTCChatMessage) => {
    const signature = await window.crypto.subtle.sign(
        {
            name: 'ECDSA',
            hash: {name: 'SHA-384'},
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
            name: 'ECDSA',
            hash: {name: 'SHA-384'},
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
