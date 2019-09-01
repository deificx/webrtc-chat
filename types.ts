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

export interface RTCChatMessage {
    message: string;
    key: 'rtc:chat';
    timestamp: number;
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

export const createMessage = (message: string): RTCChatMessage => ({
    message,
    timestamp: Date.now(),
    key: 'rtc:chat',
});
