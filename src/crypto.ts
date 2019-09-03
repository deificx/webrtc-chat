import {RTCChatMessage} from './types';

export const generateID = (segments = 3): string => {
    const array = new Uint32Array(segments);
    window.crypto.getRandomValues(array);
    return array.join('-');
};

export const generateKeys = async () =>
    await window.crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-384',
        },
        true,
        ['sign', 'verify']
    );

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
