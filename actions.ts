import {AnnounceClient, Sdp, IceCandidate} from './types';

type ANNOUNCE = 'ANNOUNCE';
export const ANNOUNCE: ANNOUNCE = 'ANNOUNCE';
export const announce = (id: string) => ({id, type: ANNOUNCE});
export type Announce = ReturnType<typeof announce>;

type NEW_CLIENT = 'NEW_CLIENT';
export const NEW_CLIENT: NEW_CLIENT = 'NEW_CLIENT';
export const newClient = () => ({type: NEW_CLIENT});
export type NewClient = ReturnType<typeof newClient>;

type NEW_RTC_DATA_CHANNEL = 'NEW_RTC_DATA_CHANNEL';
export const NEW_RTC_DATA_CHANNEL: NEW_RTC_DATA_CHANNEL = 'NEW_RTC_DATA_CHANNEL';
export const newRTCDataChannel = (remoteId: string) => ({remoteId, type: NEW_RTC_DATA_CHANNEL});
export type NewRTCDataChannel = ReturnType<typeof newRTCDataChannel>;

type NEW_RTC_PEER_CONNECTION = 'NEW_RTC_PEER_CONNECTION';
export const NEW_RTC_PEER_CONNECTION: NEW_RTC_PEER_CONNECTION = 'NEW_RTC_PEER_CONNECTION';
export const newRTCPeerConnection = (remoteId: string, sdp?: RTCSessionDescription) => ({
    remoteId,
    sdp,
    type: NEW_RTC_PEER_CONNECTION,
});
export type NewRTCPeerConnection = ReturnType<typeof newRTCPeerConnection>;

type ON_ANNOUNCE = 'ON_ANNOUNCE';
export const ON_ANNOUNCE: ON_ANNOUNCE = 'ON_ANNOUNCE';
export const onAnnounce = (announcement: AnnounceClient) => ({...announcement, type: ON_ANNOUNCE});
export type OnAnnounce = ReturnType<typeof onAnnounce>;

type ON_ANSWER = 'ON_ANSWER';
export const ON_ANSWER: ON_ANSWER = 'ON_ANSWER';
export const onAnswer = (answer: Sdp) => ({...answer, type: ON_ANSWER});
export type OnAnswer = ReturnType<typeof onAnswer>;

type ON_ICE_CANDIDATE = 'ON_ICE_CANDIDATE';
export const ON_ICE_CANDIDATE: ON_ICE_CANDIDATE = 'ON_ICE_CANDIDATE';
export const onIceCandidate = (candidate: IceCandidate) => ({...candidate, type: ON_ICE_CANDIDATE});
export type OnIceCandidate = ReturnType<typeof onIceCandidate>;

type ON_OFFER = 'ON_OFFER';
export const ON_OFFER: ON_OFFER = 'ON_OFFER';
export const onOffer = (offer: Sdp) => ({...offer, type: ON_OFFER});
export type OnOffer = ReturnType<typeof onOffer>;

type ON_RENEGOTIATION = 'ON_RENEGOTIATION';
export const ON_RENEGOTIATION: ON_RENEGOTIATION = 'ON_RENEGOTIATION';
export const onRenegotiation = (offer: Sdp) => ({...offer, type: ON_RENEGOTIATION});
export type OnRenegotiation = ReturnType<typeof onRenegotiation>;

type SEND_ANSWER = 'SEND_ANSWER';
export const SEND_ANSWER: SEND_ANSWER = 'SEND_ANSWER';
export const sendAnswer = (answer: Sdp) => ({...answer, type: SEND_ANSWER});
export type SendAnswer = ReturnType<typeof sendAnswer>;

type SEND_ICE_CANDIDATE = 'SEND_ICE_CANDIDATE';
export const SEND_ICE_CANDIDATE: SEND_ICE_CANDIDATE = 'SEND_ICE_CANDIDATE';
export const sendIceCandidate = (candidate: IceCandidate) => ({...candidate, type: SEND_ICE_CANDIDATE});
export type SendIceCandidate = ReturnType<typeof sendIceCandidate>;

type SEND_OFFER = 'SEND_OFFER';
export const SEND_OFFER: SEND_OFFER = 'SEND_OFFER';
export const sendOffer = (offer: Sdp) => ({...offer, type: SEND_OFFER});
export type SendOffer = ReturnType<typeof sendOffer>;

type SEND_RENEGOTIATION = 'SEND_RENEGOTIATION';
export const SEND_RENEGOTIATION: SEND_RENEGOTIATION = 'SEND_RENEGOTIATION';
export const sendRenegotiation = (offer: Sdp) => ({...offer, type: SEND_RENEGOTIATION});
export type SendRenegotiation = ReturnType<typeof sendRenegotiation>;

type SET_CLIENT_SERVER_ID = 'SET_CLIENT_SERVER_ID';
export const SET_CLIENT_SERVER_ID: SET_CLIENT_SERVER_ID = 'SET_CLIENT_SERVER_ID';
export const setClientServerId = (id: string) => ({id, type: SET_CLIENT_SERVER_ID});
export type SetClientServerId = ReturnType<typeof setClientServerId>;

type SET_REMOTE_DATA_CHANNEL = 'SET_REMOTE_DATA_CHANNEL';
export const SET_REMOTE_DATA_CHANNEL: SET_REMOTE_DATA_CHANNEL = 'SET_REMOTE_DATA_CHANNEL';
export const setRemoteDataChannel = (remoteId: string, channel: RTCDataChannel) => ({
    channel,
    remoteId,
    type: SET_REMOTE_DATA_CHANNEL,
});
export type SetRemoteDataChannel = ReturnType<typeof setRemoteDataChannel>;

type SET_REMOTE_PEER_CONNECTION = 'SET_REMOTE_PEER_CONNECTION';
export const SET_REMOTE_PEER_CONNECTION: SET_REMOTE_PEER_CONNECTION = 'SET_REMOTE_PEER_CONNECTION';
export const setRemotePeerConnection = (remoteId: string, pc: RTCPeerConnection) => ({
    pc,
    remoteId,
    type: SET_REMOTE_PEER_CONNECTION,
});
export type SetRemotePeerConnection = ReturnType<typeof setRemotePeerConnection>;

export type Actions =
    | Announce
    | NewClient
    | NewRTCDataChannel
    | NewRTCPeerConnection
    | OnAnnounce
    | OnAnswer
    | OnIceCandidate
    | OnOffer
    | OnRenegotiation
    | SendAnswer
    | SendIceCandidate
    | SendOffer
    | SendRenegotiation
    | SetClientServerId
    | SetRemoteDataChannel
    | SetRemotePeerConnection;
