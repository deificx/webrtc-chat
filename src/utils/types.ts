import {generateID} from './crypto';

export interface Sdp {
    from: string;
    sdp: RTCSessionDescription;
    to: string;
    key: 'offer' | 'answer' | 'renegotiate';
}

export interface IceCandidate {
    from: string;
    candidate: RTCIceCandidate;
    to: string;
    key: 'ice-candidate';
}

export interface AnnounceClient {
    from: string;
    key: 'announce';
}

export interface Id {
    id: string;
    key: 'id';
}

export type WebSocketMessage = Sdp | IceCandidate | AnnounceClient | Id;

export interface PCEvent {
    type: 'pc:connectionstatechange' | 'pc:negotiationneeded' | 'pc:signalingstatechange';
}

export interface PCCandidateEvent {
    candidate: RTCIceCandidate | null;
    type: 'pc:ice-candidate';
}

export interface PCDataChannelEvent {
    channel: RTCDataChannel;
    type: 'pc:datachannel';
}

export interface Author {
    id: string;
    displayName: string;
}

export interface RTCChatMessage {
    author: Author;
    edited: boolean;
    id: string;
    key: 'rtc:chat';
    message: string;
    signature?: string;
    timestamp: number;
}

export interface RTCKeyMessage {
    author: Author;
    key: 'rtc:public-key';
    publicKey?: CryptoKey;
    exportedPublicKey: JsonWebKey;
}

export interface RoomState {
    authors: Author[];
    editing: string;
    messages: RTCChatMessage[];
}

export const sdpMessage = ({from, to, sdp, key}: Sdp): string =>
    JSON.stringify({
        from,
        sdp,
        to,
        key,
    });

export const iceMessage = ({from, to, candidate, key}: IceCandidate): string =>
    JSON.stringify({
        candidate,
        from,
        to,
        key,
    });

export const announceMessage = ({from, key}: AnnounceClient): string =>
    JSON.stringify({
        from,
        key,
    });

export const createMessage = (author: Author, message: string): RTCChatMessage => ({
    author,
    edited: false,
    id: generateID(),
    message,
    timestamp: Date.now(),
    key: 'rtc:chat',
});

export const createEdit = (author: Author, id: string, message: string): RTCChatMessage => ({
    author,
    edited: true,
    id,
    message,
    timestamp: Date.now(),
    key: 'rtc:chat',
});

export const publicKeyMessage = (author: Author, exportedPublicKey: JsonWebKey): RTCKeyMessage => ({
    author,
    key: 'rtc:public-key',
    exportedPublicKey,
});
