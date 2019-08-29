import 'webrtc-adapter';
import EventEmitter from 'eventemitter3';

// mock for the signaling server
const events = new EventEmitter();

type Party = 'local' | 'remote';

const dataChannel = (pc: RTCPeerConnection, side: Party, label: string) => {
    var channel = pc.createDataChannel(label, {negotiated: true, id: 0});

    channel.onopen = _event => {
        channel.send(`Hi, I am ${side}!`);
    };

    channel.onmessage = event => {
        console.log(event.data);
    };

    console.log(side, channel);
};

const signaling = async (side: Party, remote: Party, sdp?: RTCSessionDescription) => {
    console.log(side);
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
    console.log(pc);

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

    dataChannel(pc, side, 'chat');

    return pc;
};

(async () => {
    events.on('local-offer', async (sdp: RTCSessionDescription) => {
        await signaling('remote', 'local', sdp);
    });
    await signaling('local', 'remote');
})();
