import 'webrtc-adapter';
import {createStore, applyMiddleware} from 'redux';
import {actionChannel, call, fork, put, select, take, takeEvery} from 'redux-saga/effects';
import createSagaMiddleware, {eventChannel, Channel} from 'redux-saga';
import {
    AnnounceClient,
    Sdp,
    Id,
    IceCandidate,
    RTCEvent,
    RTCChatMessage,
    announceMessage,
    sdpMessage,
    iceMessage,
    createMessage,
} from './types';
import {
    Actions,
    ANNOUNCE,
    ON_ANNOUNCE,
    ON_OFFER,
    SET_CLIENT_SERVER_ID,
    setClientServerId,
    onAnnounce,
    onOffer,
    onAnswer,
    onIceCandidate,
    onRenegotiation,
    ON_RENEGOTIATION,
    sendOffer,
    newRTCPeerConnection,
    NEW_RTC_PEER_CONNECTION,
    NewRTCPeerConnection,
    sendAnswer,
    setRemotePeerConnection,
    SET_REMOTE_PEER_CONNECTION,
    SEND_ANSWER,
    SEND_OFFER,
    SEND_RENEGOTIATION,
    SEND_ICE_CANDIDATE,
    ON_ICE_CANDIDATE,
    NEW_RTC_DATA_CHANNEL,
    setRemoteDataChannel,
    SET_REMOTE_DATA_CHANNEL,
    newRTCDataChannel,
    announce,
    ON_ANSWER,
    sendIceCandidate,
    sendRenegotiation,
    sendRTCMessage,
    SetClientServerId,
    SEND_RTC_MESSAGE,
} from './actions';
// import uuidv4 from 'uuid/v4';
import {produce} from 'immer';

const getSocketEvents = (socket: WebSocket) =>
    eventChannel<AnnounceClient | Id | Sdp | IceCandidate>(subscribe => {
        socket.onmessage = event => {
            try {
                const message: AnnounceClient | Id | Sdp | IceCandidate = JSON.parse(event.data.toString());
                subscribe(message);
            } catch (error) {
                console.warn('failed to parse socket message');
                console.error(error);
            }
        };

        return () => {
            socket.onmessage = null;
        };
    });

function* clientEvents(socket: WebSocket) {
    const events: Channel<AnnounceClient | Id | Sdp | IceCandidate> = yield call(getSocketEvents, socket);

    while (true) {
        const event: AnnounceClient | Id | Sdp | IceCandidate = yield take(events);

        console.log('client-event', event);

        switch (event.key) {
            case 'id':
                yield put(setClientServerId(event.id));
                yield put(announce(event.id));
                break;

            case 'announce':
                yield put(onAnnounce(event));
                break;

            case 'offer':
                yield put(onOffer(event));
                break;

            case 'answer': {
                yield put(onAnswer(event));
                break;
            }

            case 'ice-candidate':
                yield put(onIceCandidate(event));
                break;

            case 'renegotiate':
                yield put(onRenegotiation(event));
                break;
        }
    }
}

function* clientActions(socket: WebSocket) {
    const actions: Channel<Actions> = yield actionChannel([
        ANNOUNCE,
        ON_ANNOUNCE,
        ON_ANSWER,
        ON_OFFER,
        ON_RENEGOTIATION,
        SEND_ANSWER,
        SEND_OFFER,
        SEND_RENEGOTIATION,
        SEND_ICE_CANDIDATE,
    ]);

    while (true) {
        const action: Actions = yield take(actions);

        console.log('client-action', action);

        switch (action.type) {
            case ANNOUNCE:
                yield call([socket, socket.send], announceMessage({from: action.id, key: 'announce'}));
                break;

            case ON_ANNOUNCE:
                // new PC, create offer
                yield put(newRTCPeerConnection(action.from));
                break;

            case ON_ANSWER: {
                const pc: RTCPeerConnection | null = yield select(remotePC, action.from);
                if (pc) {
                    yield pc.setRemoteDescription(action.sdp);
                }
                break;
            }

            case ON_OFFER:
                // new PC, setRemote, answer
                yield put(newRTCPeerConnection(action.from, action.sdp));
                break;

            case ON_ICE_CANDIDATE: {
                const pc: RTCPeerConnection | null = yield select(remotePC, action.from);
                if (pc) {
                    yield pc.addIceCandidate(action.candidate);
                }
                break;
            }

            case ON_RENEGOTIATION: {
                // setRemote, answer
                const pc: RTCPeerConnection | null = yield select(remotePC, action.from);
                if (pc) {
                    yield pc.setRemoteDescription(action.sdp);
                    yield pc.setLocalDescription(yield pc.createAnswer());
                    if (!pc.localDescription) {
                        throw new Error('failed to setup local description');
                    }
                    const from: string = yield select(clientId);
                    yield put(
                        sendAnswer({
                            from,
                            to: action.from,
                            sdp: pc.localDescription,
                            key: 'answer',
                        })
                    );
                }
                break;
            }

            case SEND_ANSWER:
            case SEND_OFFER:
            case SEND_RENEGOTIATION:
                socket.send(sdpMessage(action));
                break;

            case SEND_ICE_CANDIDATE:
                socket.send(iceMessage(action));
                break;

            case SEND_RTC_MESSAGE: {
                const openChannels: RTCDataChannel[] = yield select(channels);
                openChannels.forEach(channel => channel.send(JSON.stringify(action.message)));
                break;
            }
        }
    }
}

function* client() {
    const socket = new WebSocket(`ws://${window.location.hostname}:4321`);

    yield fork(clientEvents, socket);
    yield fork(clientActions, socket);
}

const getPCEvents = (pc: RTCPeerConnection) =>
    eventChannel<RTCEvent>(subscribe => {
        pc.onconnectionstatechange = _ => {
            subscribe({type: 'pc:connectionstatechange'});
        };

        pc.onicecandidate = event => {
            subscribe({candidate: event.candidate, type: 'pc:ice-candidate'});
        };

        pc.onnegotiationneeded = () => {
            subscribe({type: 'pc:negotiationneeded'});
        };

        pc.onsignalingstatechange = _ => {
            subscribe({type: 'pc:signalingstatechange'});
        };

        return () => {
            pc.onconnectionstatechange = null;
            pc.onicecandidate = null;
            pc.onnegotiationneeded = null;
            pc.onsignalingstatechange = null;
        };
    });

function* pcEvents(remoteId: string, pc: RTCPeerConnection) {
    const events = getPCEvents(pc);

    while (true) {
        const event: RTCEvent = yield take(events);

        console.log('pc-event', event);

        switch (event.type) {
            case 'pc:connectionstatechange':
                console.log(`connectionstatechange, remoteId="${remoteId}", state="${pc.connectionState}"`);
                break;

            case 'pc:ice-candidate':
                if (event.candidate) {
                    const from: string = yield select(clientId);
                    yield put(
                        sendIceCandidate({
                            from,
                            to: remoteId,
                            candidate: event.candidate,
                            key: 'ice-candidate',
                        })
                    );
                }
                break;

            case 'pc:negotiationneeded': {
                const from: string = yield select(clientId);
                yield pc.setLocalDescription(yield pc.createOffer());
                if (!pc.localDescription) {
                    throw new Error('failed to setup local description');
                }
                yield put(
                    sendRenegotiation({
                        from,
                        to: remoteId,
                        sdp: pc.localDescription,
                        key: 'renegotiate',
                    })
                );
                break;
            }

            case 'pc:signalingstatechange':
                console.log(`signalingstatechange, remoteId="${remoteId}, state=${pc.signalingState}"`);
                break;
        }
    }
}

const channelEvents = (channel: RTCDataChannel) =>
    eventChannel<RTCChatMessage>(subscribe => {
        channel.onmessage = event => {
            try {
                const message: RTCChatMessage = JSON.parse(event.data);
                subscribe(message);
            } catch (error) {
                console.warn('failed to parse rtc chat message');
                console.error(error);
            }
        };

        return () => {
            channel.onmessage = null;
        };
    });

function* pcActions(remoteId: string, pc: RTCPeerConnection) {
    yield take((action: Actions) => action.type === NEW_RTC_DATA_CHANNEL && action.remoteId === remoteId);

    console.log(`taking new rtc data channel, remoteId="${remoteId}"`);

    const channel = pc.createDataChannel('chat', {negotiated: true, id: 0});

    yield put(setRemoteDataChannel(remoteId, channel));

    channel.onopen = _event => {
        console.log('RTCDataChannel opened', remoteId);
    };

    const events = channelEvents(channel);

    while (true) {
        const event: RTCChatMessage = yield take(events);
        console.log(event);
    }
}

function* pc({remoteId, sdp}: NewRTCPeerConnection) {
    console.log('setting up new peer connection to', remoteId);

    const pc = new RTCPeerConnection({
        iceServers: [
            {urls: [`stun:${window.location.hostname}:3478`]},
            {
                credential: 'a',
                credentialType: 'password',
                username: 'a',
                urls: [`turn:${window.location.hostname}:3478`],
            },
        ],
    });

    yield fork(pcEvents, remoteId, pc);
    yield fork(pcActions, remoteId, pc);
    yield put(setRemotePeerConnection(remoteId, pc));

    const from: string = yield select(clientId);

    console.log(`creating local description from="${from}", hasSDP=${Boolean(sdp)}`);

    if (sdp) {
        yield pc.setRemoteDescription(sdp);
        yield pc.setLocalDescription(yield pc.createAnswer());
        if (!pc.localDescription) {
            throw new Error('failed to setup local description');
        }
        yield put(
            sendAnswer({
                from,
                to: remoteId,
                sdp: pc.localDescription,
                key: 'answer',
            })
        );
    } else {
        yield pc.setLocalDescription(yield pc.createOffer());
        if (!pc.localDescription) {
            throw new Error('failed to setup local description');
        }
        yield put(sendOffer({from, to: remoteId, sdp: pc.localDescription, key: 'offer'}));
    }

    yield put(newRTCDataChannel(remoteId));
}

interface Remote {
    channel?: RTCDataChannel;
    pc: RTCPeerConnection;
}

interface State {
    messages: RTCChatMessage[];
    remotes: {[key: string]: Remote};
    serverId: string;
}

const defaultState: State = {
    messages: [],
    remotes: {},
    serverId: '',
};

const reducer = (state: State = defaultState, action: Actions) =>
    produce(state, draft => {
        switch (action.type) {
            case SET_CLIENT_SERVER_ID:
                draft.serverId = action.id;
                break;

            case SET_REMOTE_DATA_CHANNEL:
                if (Object.hasOwnProperty.call(draft.remotes, action.remoteId)) {
                    draft.remotes[action.remoteId] = {
                        ...draft.remotes[action.remoteId],
                        channel: action.channel,
                    };
                }
                break;

            case SET_REMOTE_PEER_CONNECTION:
                draft.remotes[action.remoteId] = {pc: action.pc};
                break;
        }
    });

const clientId = (state: State) => state.serverId;
const remotePC = (state: State, remoteId: string) => (state.remotes[remoteId] ? state.remotes[remoteId].pc : null);
const channels = (state: State) => {
    const list: RTCDataChannel[] = [];
    for (const key in state.remotes) {
        if (Object.hasOwnProperty.call(state.remotes, key)) {
            const {channel, pc} = state.remotes[key];
            if (channel && pc && channel.readyState === 'open' && pc.connectionState === 'connected') {
                list.push(channel);
            }
        }
    }
    return list;
};
const messages = (state: State) => state.messages;

const append = (div: HTMLDivElement | null, message: RTCChatMessage) => {
    if (!div) {
        throw new Error('cannot append without a container div');
    }
    const timestamp = new Date(message.timestamp);
    const timeText = document.createTextNode(timestamp.toLocaleString());
    const time = document.createElement('time');
    time.dateTime = timestamp.toISOString();
    time.appendChild(timeText);
    const text = document.createTextNode(message.message);
    const p = document.createElement('p');
    p.appendChild(time);
    p.appendChild(text);
    div.appendChild(p);
};

const control = (
    form: HTMLFormElement | null,
    input: HTMLInputElement | null,
    send: (message: RTCChatMessage) => void
) => {
    if (!form || !input) {
        throw new Error('cannot get form');
    }
    form.onsubmit = event => {
        event.preventDefault();
        if (!input.value) {
            return;
        }
        send(createMessage(input.value));
        input.value = '';
    };
};

const template = document.querySelector('#container') as HTMLTemplateElement;
const copyTemplate = (
    id: string,
    send: (message: RTCChatMessage) => void,
    subscribe: (subscriberFn: (message: RTCChatMessage) => void) => void
) => {
    const container = document.importNode(template.content, true);
    const header = container.querySelector('.title') as HTMLHeadingElement;
    const messages = container.querySelector('.messages') as HTMLDivElement;
    const form = container.querySelector('form') as HTMLFormElement;
    const input = container.querySelector('input') as HTMLInputElement;
    header.innerText = id;
    control(form, input, send);
    subscribe((message: RTCChatMessage) => {
        append(messages, message);
    });
    document.body.appendChild(container);
};

const clientFactory = () => {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(reducer, applyMiddleware(sagaMiddleware));

    const send = (message: RTCChatMessage) => {
        store.dispatch(sendRTCMessage(message));
    };

    const subscribe = (subscriberFn: (message: RTCChatMessage) => void) => {
        let messageList: RTCChatMessage[] = [];
        store.subscribe(() => {
            const newMessages = messages(store.getState());
            const difference = messageList.filter(x => !newMessages.includes(x));
            messageList = newMessages;
            difference.forEach(subscriberFn);
        });
    };

    function* saga() {
        yield takeEvery(NEW_RTC_PEER_CONNECTION, pc);
        yield fork(client);
        const {id}: SetClientServerId = yield take(SET_CLIENT_SERVER_ID);
        yield call(copyTemplate, id, send, subscribe);
    }

    sagaMiddleware.run(saga);
};

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

(async () => {
    clientFactory();
    await wait(2000);
    clientFactory();
})();
