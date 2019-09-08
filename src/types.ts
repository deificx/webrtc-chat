import {generateID, exportPublicKey} from './crypto';

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
    id: string;
    key: 'rtc:chat';
    message: string;
    signature?: string;
    timestamp: number;
}

export interface RTCKeyMessage {
    author: Author;
    key: 'rtc:public-key';
    exportedPublicKey: JsonWebKey;
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

export const createMessage = (author: Author) => {
    return (message: string): RTCChatMessage => ({
        author,
        id: generateID(),
        message,
        timestamp: Date.now(),
        key: 'rtc:chat',
    });
};

export const publicKeyMessage = async (): Promise<string> =>
    JSON.stringify({
        key: 'rtc:public-key',
        exportedPublicKey: await exportPublicKey(),
    });
