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

// TODO: use indexedDB to store and retrieve keys
export const getKeys = async (): Promise<CryptoKeyPair> => {
    // let privateKey: string | CryptoKey | null = localStorage.getItem('webrtc-chat:privateKey');
    // let publicKey: string | CryptoKey | null = localStorage.getItem('webrtc-chat:publicKey');
    // if (!privateKey || !publicKey) {
    const keys = await generateKeys();
    // localStorage.setItem('webrtc-chat:privateKey', JSON.stringify(await exportKey(keys.privateKey)));
    // localStorage.setItem('webrtc-chat:publicKey', JSON.stringify(await exportKey(keys.publicKey)));
    return keys;
    // }
    // console.log('reusing keys');
    // try {
    //     const privateJWK: JsonWebKey = JSON.parse(privateKey);
    //     privateKey = await importKey(privateJWK, ['sign', 'verify']);
    //     const publicJWK: JsonWebKey = JSON.parse(publicKey);
    //     publicKey = await importKey(publicJWK, ['sign', 'verify']);
    //     console.log('got keys');
    //     return {
    //         privateKey,
    //         publicKey,
    //     };
    // } catch (error) {
    //     console.error(error);
    // }
    // console.log('could not get keys, regenerating');
    // const keys = await generateKeys();
    // localStorage.setItem('webrtc-chat:privateKey', JSON.stringify(await exportKey(keys.privateKey)));
    // localStorage.setItem('webrtc-chat:publicKey', JSON.stringify(await exportKey(keys.publicKey)));
    // return keys;
};

export const exportKey = async (key: CryptoKey) => {
    return await crypto.subtle.exportKey('jwk', key);
};

export const importKey = async (jwk: JsonWebKey, keyUsages: 'sign' | 'verify' | ['sign', 'verify']) => {
    return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        Array.isArray(keyUsages) ? keyUsages : [keyUsages]
    );
};

const encode = (message: RTCChatMessage) =>
    new TextEncoder().encode(`${message.authorId}:${message.id}:${message.timestamp}`);

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
