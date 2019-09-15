import {
    announceMessage,
    Author,
    iceMessage,
    publicKeyMessage,
    RTCChatMessage,
    RTCKeyMessage,
    sdpMessage,
    WebSocketMessage,
} from './types';
import {verifyMessage, importKey, signMessage, getKeys, exportKey} from './crypto';

type SubscriberFn = (message: RTCChatMessage | RTCKeyMessage | {key: 'clear:author'; id: string}) => void;

class Signaling {
    private connections: {
        [key: string]: {author?: Author; channel?: RTCDataChannel; pc: RTCPeerConnection; publicKey?: CryptoKey};
    } = {};

    private author: Author = {displayName: '', id: ''};
    private buffers: {[key: string]: WebSocketMessage[]} = {};
    private from = '';
    private keys: CryptoKeyPair | undefined;
    private messages: RTCChatMessage[] = [];
    private processes = new Set<string>();
    private subscribers: SubscriberFn[] = [];
    private ws: WebSocket | undefined;

    constructor() {
        this.setup = this.setup.bind(this);
        this.addSubscriber = this.addSubscriber.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    async setup(author: Author) {
        console.log('setting up signaling', author);

        this.author = author;

        this.keys = await getKeys();

        this.subscribers.forEach(fn => fn({author: this.author, exportedPublicKey: {}, key: 'rtc:public-key'}));

        this.ws = new WebSocket(`ws://${window.location.hostname}:4321`);

        this.ws.onclose = event => {
            console.log('socket closed', event);
        };

        this.ws.onopen = event => {
            console.log('socket opened', event);
        };

        this.from = await this.getID();

        this.ws.onmessage = event => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                this.push(message);
            } catch (error) {
                console.error('parsing socket message failed');
                console.error(error);
            }
        };

        this.ws.send(announceMessage({from: this.from, key: 'announce'}));
    }

    addSubscriber(fn: SubscriberFn) {
        this.subscribers.push(fn);
    }

    async sendMessage(message: RTCChatMessage) {
        if (!this.keys) {
            console.error('keys has not been configured, aborting');
            console.log(this.keys);
            return;
        }
        this.addMessage(message);
        const signedMessage = await signMessage(this.keys.privateKey, message);
        for (const to in this.connections) {
            if (Object.hasOwnProperty.call(this.connections, to)) {
                const {channel} = this.connections[to];
                if (channel) {
                    channel.send(JSON.stringify(signedMessage));
                }
            }
        }
    }

    private addMessage(message: RTCChatMessage) {
        this.messages.push(message);
        this.subscribers.forEach(fn => fn(message));
    }

    private async editMessage(message: RTCChatMessage, to: string) {
        const {author, publicKey} = this.connections[to];
        if (!author || !publicKey) {
            console.warn('cannot find author or publicKey, ignoring edit', message);
            return;
        }
        const index = this.messages.findIndex(m => m.id === message.id && author.id === message.author.id);
        if (
            index >= 0 &&
            index < this.messages.length &&
            (await verifyMessage(publicKey, message)) &&
            (await verifyMessage(publicKey, this.messages[index]))
        ) {
            console.log('editing message', message);
            this.messages[index] = message;
            this.subscribers.forEach(fn => fn(message));
        } else {
            console.warn('cannot verify message, ignoring edit');
        }
    }

    private getID(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                throw Error('expected a websocket');
            }
            this.ws.onmessage = event => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    if (message.key === 'id') {
                        console.log(`id:${message.id}`);
                        resolve(message.id);
                    } else {
                        reject(new Error('first message was not id'));
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    this.ws!.onmessage = null;
                }
            };
        });
    }

    private send(msg: string) {
        if (!this.ws) {
            throw new Error('expected a websocket');
        }
        this.ws.send(msg);
    }

    private sendAnswer(to: string, sdp: RTCSessionDescription) {
        this.send(sdpMessage({from: this.from, to, sdp, key: 'answer'}));
    }

    private sendOffer(to: string, sdp: RTCSessionDescription) {
        this.send(sdpMessage({from: this.from, to, sdp, key: 'offer'}));
    }

    private sendIceCandidate(to: string, candidate: RTCIceCandidate) {
        this.send(iceMessage({from: this.from, to, candidate, key: 'ice-candidate'}));
    }

    private sendRenegotiation(to: string, sdp: RTCSessionDescription) {
        this.send(sdpMessage({from: this.from, to, sdp, key: 'renegotiate'}));
    }

    private channelEvents(channel: RTCDataChannel, to: string) {
        channel.onclose = () => {
            console.warn('connection closed, it seems');
        };

        channel.onopen = async () => {
            if (!this.keys) {
                console.error('keys has not been configured, aborting');
                console.log(this.keys);
                return;
            }
            const exportedPublicKey = await exportKey(this.keys.publicKey);
            const message = publicKeyMessage(this.author, exportedPublicKey);
            channel.send(JSON.stringify(message));
        };

        channel.onmessage = async event => {
            try {
                const message: RTCChatMessage | RTCKeyMessage = JSON.parse(event.data);
                switch (message.key) {
                    case 'rtc:chat': {
                        if (message.edited) {
                            this.editMessage(message, to);
                        } else {
                            this.addMessage(message);
                        }
                        break;
                    }

                    case 'rtc:public-key': {
                        const publicKey = await importKey(message.exportedPublicKey, 'verify');
                        this.connections[to].publicKey = publicKey;
                        this.connections[to].author = message.author;
                        this.subscribers.forEach(fn => fn({...message, publicKey}));
                        break;
                    }
                }
            } catch (error) {
                console.error('failed to parse chat message');
                console.error(error);
            }
        };
    }

    private cleanupConnection(to: string) {
        if (!this.connections[to]) {
            console.log('connection already cleaned up');
            return;
        }
        console.log(`received disconnect signal to ${to}, cleaning up`);
        const connection = this.connections[to];
        delete this.connections[to];
        this.subscribers.forEach(fn => fn({key: 'clear:author', id: connection.author!.id}));
    }

    private async createPC(to: string, sdp?: RTCSessionDescription) {
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

        this.connections[to] = {pc};

        pc.ondatachannel = event => {
            this.connections[to].channel = event.channel;
            this.channelEvents(event.channel, to);
        };

        pc.onicecandidate = event => {
            if (event.candidate) {
                this.sendIceCandidate(to, event.candidate);
            }
        };

        pc.onnegotiationneeded = async _ => {
            await pc.setLocalDescription(await pc.createOffer());
            if (pc.localDescription) {
                this.sendRenegotiation(to, pc.localDescription);
            }
        };

        pc.onconnectionstatechange = _ => {
            console.log(`connection state for ${to} = ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.cleanupConnection(to);
            }
        };

        pc.oniceconnectionstatechange = _ => {
            console.log(`ice connection state for ${to} = ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                this.cleanupConnection(to);
            }
        };

        if (sdp) {
            const sessionDescription = new RTCSessionDescription(sdp);
            await pc.setRemoteDescription(sessionDescription);
            await pc.setLocalDescription(await pc.createAnswer());
        } else {
            await pc.setLocalDescription(await pc.createOffer());
            this.onSignalingState(to, 'stable', () => {
                const channel = pc.createDataChannel('chat');
                this.connections[to].channel = channel;
                this.channelEvents(channel, to);
            });
        }

        return pc;
    }

    private onSignalingState(
        remoteId: string,
        state: RTCSignalingState | null,
        callBack: (pc: RTCPeerConnection) => void
    ) {
        let pc: RTCPeerConnection | null = null;

        if (Object.hasOwnProperty.call(this.connections, remoteId) && this.connections[remoteId].pc) {
            pc = this.connections[remoteId].pc;
        }

        if (!pc) {
            throw new Error('cannot find peer connection');
        }

        if (!state) {
            callBack(pc);
            return;
        }

        if (pc.signalingState === state) {
            callBack(pc);
            return;
        }

        pc.onsignalingstatechange = () => {
            if (pc && pc.signalingState === state) {
                pc.onsignalingstatechange = null;
                callBack(pc);
            }
        };
    }

    private async handleSocketMessage(message: WebSocketMessage) {
        console.log(message);
        switch (message.key) {
            case 'announce': {
                // got a remote id, new peer connection, create offer
                const pc = await this.createPC(message.from);
                if (pc.localDescription) {
                    this.sendOffer(message.from, pc.localDescription);
                }
                break;
            }

            case 'answer': {
                // got an sdp back, setRemoteDescription
                this.onSignalingState(message.from, 'have-local-offer', async pc => {
                    const sessionDescription = new RTCSessionDescription(message.sdp);
                    await pc.setRemoteDescription(sessionDescription);
                });
                break;
            }

            case 'ice-candidate': {
                // got a candidate, add it
                this.onSignalingState(message.from, 'stable', async pc => {
                    await pc.addIceCandidate(message.candidate);
                });
                break;
            }

            case 'offer': {
                // got an SDP, new peer connection, set remote, create answer, answer
                const pc = await this.createPC(message.from, message.sdp);
                if (pc.localDescription) {
                    this.sendAnswer(message.from, pc.localDescription);
                }
                break;
            }

            case 'renegotiate': {
                // got an SDP, get peer connection, set remote, create answer, answer
                this.onSignalingState(message.from, 'stable', async pc => {
                    const sessionDescription = new RTCSessionDescription(message.sdp);
                    await pc.setRemoteDescription(sessionDescription);
                    await pc.setLocalDescription(await pc.createAnswer());
                    if (pc.localDescription) {
                        this.sendAnswer(message.from, pc.localDescription);
                    }
                });
                break;
            }
        }
    }

    private push(message: WebSocketMessage) {
        if (message.key === 'id') {
            return;
        }
        this.createAndAddToBuffer(message.from, message);
        if (!this.processes.has(message.from)) {
            this.process(message.from);
        }
    }

    private createAndAddToBuffer(remoteId: string, message: WebSocketMessage) {
        if (Object.hasOwnProperty.call(this.buffers, remoteId)) {
            this.buffers[remoteId].push(message);
        } else {
            this.buffers[remoteId] = [message];
        }
    }

    private async process(remoteId: string) {
        const message = this.buffers[remoteId].shift();
        if (message) {
            this.processes.add(remoteId);
            console.log('processing', message);
            await this.handleSocketMessage(message);
            this.processes.delete(remoteId);
        }
        if (this.buffers[remoteId].length) {
            this.process(remoteId);
        }
    }
}

export const signaling = new Signaling();
