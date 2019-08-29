import 'webrtc-adapter';
import EventEmitter from 'eventemitter3';

// mock for the signaling server
const events = new EventEmitter();

type Party = 'local' | 'remote';

const messages = () => {
    const messageList: string[] = [];
    const subscribers: Array<(message: string) => void> = [];

    return {
        getMessages: () => Array.from(messageList),
        push: (message: string) => {
            messageList.push(message);
            subscribers.forEach(sub => sub(message));
        },
        subscribe: (subscriberFn: (message: string) => void) => {
            subscribers.push(subscriberFn);
        },
    };
};

const signaling = async (
    side: Party,
    remote: Party,
    sdp?: RTCSessionDescription
): Promise<[RTCDataChannel, () => string[], (subscriberFn: (message: string) => void) => void]> => {
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

    pc.onnegotiationneeded = async () => {
        console.log(`onnegotiationneeded triggered by ${side}`);
        await pc.setLocalDescription(await pc.createOffer());
        events.emit(`${side}-renegotiation`, pc.localDescription);
    };

    pc.onconnectionstatechange = _ => {
        console.log(`${side}-connection: ${pc.connectionState}`);
    };

    pc.onicecandidate = event => {
        events.emit(`${side}-ice-candidate`, event.candidate);
    };

    pc.onsignalingstatechange = _ => {
        console.log(`${side}-signaling: ${pc.signalingState}`);
    };

    if (sdp) {
        await pc.setRemoteDescription(sdp);
        await pc.setLocalDescription(await pc.createAnswer());
        if (!pc.localDescription) {
            throw new Error('failed to setup local description');
        }
        events.emit(`${side}-answer`, pc.localDescription);
    } else {
        await pc.setLocalDescription(await pc.createOffer());
        if (!pc.localDescription) {
            throw new Error('failed to setup local description');
        }
        events.emit(`${side}-offer`, pc.localDescription);
    }

    events.on(`${remote}-answer`, async sdp => {
        await pc.setRemoteDescription(sdp);
    });

    events.on(`${remote}-renegotiation`, async (sdp: RTCSessionDescription) => {
        await pc.setRemoteDescription(sdp);
        await pc.setLocalDescription(await pc.createAnswer());
        events.emit(`${side}-answer`, pc.localDescription);
    });

    events.on(`${remote}-ice-candidate`, (candidate: RTCIceCandidate) => {
        pc.addIceCandidate(candidate);
    });

    const {getMessages, push, subscribe} = messages();

    var channel = pc.createDataChannel('chat', {negotiated: true, id: 0});

    channel.onopen = _event => {
        channel.send(`Hi, I am a message from ${side}!`);
    };

    channel.onmessage = event => {
        push(event.data);
    };

    return [channel, getMessages, subscribe];
};

const append = (el: HTMLElement | null, message: string) => {
    if (!el) {
        throw new Error('cannot append without an element');
    }
    const now = new Date();
    const timeText = document.createTextNode(now.toLocaleString());
    const time = document.createElement('time');
    time.dateTime = now.toISOString();
    time.appendChild(timeText);
    const text = document.createTextNode(message);
    const p = document.createElement('p');
    p.appendChild(time);
    p.appendChild(text);
    el.appendChild(p);
};

(async () => {
    events.on('local-offer', async (sdp: RTCSessionDescription) => {
        const [remoteChannel, remoteGetMessages, remoteSubscribe] = await signaling('remote', 'local', sdp);
        const remoteMessagesDiv = document.getElementById('remote-messages') as HTMLDivElement;
        remoteSubscribe((message: string) => append(remoteMessagesDiv, message));
        const remoteForm = document.getElementById('remote-form') as HTMLFormElement;
        const remoteInput = document.getElementById('remote-input') as HTMLInputElement;
        remoteForm.onsubmit = event => {
            event.preventDefault();
            if (!remoteInput.value) {
                return;
            }
            remoteChannel.send(remoteInput.value);
            remoteInput.value = '';
        };
    });

    const [localChannel, localGetMessages, localSubscribe] = await signaling('local', 'remote');
    const localMessagesDiv = document.getElementById('local-messages') as HTMLDivElement;
    localSubscribe((message: string) => append(localMessagesDiv, message));
    const localForm = document.getElementById('local-form') as HTMLFormElement;
    const localInput = document.getElementById('local-input') as HTMLInputElement;
    localForm.onsubmit = event => {
        event.preventDefault();
        if (!localInput.value) {
            return;
        }
        localChannel.send(localInput.value);
        localInput.value = '';
    };
})();
