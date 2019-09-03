import 'webrtc-adapter';
import {
    WebSocketMessage,
    sdpMessage,
    announceMessage,
    iceMessage,
    RTCChatMessage,
    createMessage,
    publicKeyMessage,
    RTCKeyMessage,
} from './types';

interface Actions {
    createPC: (to: string, sdp?: RTCSessionDescription) => Promise<RTCPeerConnection>;
    onSignalingState: (remoteId: string, state: RTCSignalingState, callBack: (pc: RTCPeerConnection) => void) => void;
    sendAnswer: (to: string, sdp: RTCSessionDescription) => void;
    sendIceCandidate: (to: string, candidate: RTCIceCandidate) => void;
    sendOffer: (to: string, sdp: RTCSessionDescription) => void;
    sendMessage: (message: RTCChatMessage) => void;
    subscribe: (subscribeFn: (message: RTCChatMessage) => void) => void;
}

class Messages {
    private messages: RTCChatMessage[] = [];
    private subscribers: Array<(message: RTCChatMessage) => void> = [];

    push(message: RTCChatMessage) {
        this.messages.push(message);
        this.subscribers.forEach(subscribe => subscribe(message));
    }

    subscribe(subscribeFn: (message: RTCChatMessage) => void) {
        this.subscribers.push(subscribeFn);
    }
}

const socket = async () => {
    const ws = new WebSocket(`ws://${window.location.hostname}:4321`);

    ws.onclose = event => {
        console.log('socket closed', event);
    };

    ws.onopen = event => {
        console.log('socket opened', event);
    };

    const from = await getID(ws);
    const connections: {[key: string]: {channel?: RTCDataChannel; pc: RTCPeerConnection; publicKey?: CryptoKey}} = {};
    const messages = new Messages();
    const keyPair = await generateKeys();

    const channelEvents = (channel: RTCDataChannel, to: string) => {
        channel.onopen = async () => {
            channel.send(await publicKeyMessage(keyPair.publicKey));
        };

        channel.onmessage = async event => {
            try {
                const message: RTCChatMessage | RTCKeyMessage = JSON.parse(event.data);
                switch (message.key) {
                    case 'rtc:chat': {
                        messages.push(message);
                        const {publicKey} = connections[to];
                        if (publicKey) {
                            console.log(message, await verifyMessage(publicKey, message));
                        }
                        break;
                    }

                    case 'rtc:public-key': {
                        const publicKey = await crypto.subtle.importKey(
                            'jwk',
                            message.exportedPublicKey,
                            {
                                name: 'ECDSA',
                                namedCurve: 'P-384',
                            },
                            true,
                            ['verify']
                        );
                        connections[to].publicKey = publicKey;
                        break;
                    }
                }
            } catch (error) {
                console.error('failed to parse chat message');
                console.error(error);
            }
        };
    };

    const actions: Actions = {
        createPC: async (to, sdp) => {
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

            pc.ondatachannel = event => {
                connections[to].channel = event.channel;
                channelEvents(event.channel, to);
            };

            pc.onicecandidate = event => {
                if (event.candidate) {
                    ws.send(iceMessage({from, to, candidate: event.candidate, key: 'ice-candidate'}));
                }
            };

            pc.onnegotiationneeded = async event => {
                await pc.setLocalDescription(await pc.createOffer());
                if (pc.localDescription) {
                    ws.send(sdpMessage({from, to, sdp: pc.localDescription, key: 'renegotiate'}));
                }
            };

            connections[to] = {pc};

            if (sdp) {
                const sessionDescription = new RTCSessionDescription(sdp);
                await pc.setRemoteDescription(sessionDescription);
                await pc.setLocalDescription(await pc.createAnswer());
            } else {
                await pc.setLocalDescription(await pc.createOffer());
                actions.onSignalingState(to, 'stable', () => {
                    const channel = pc.createDataChannel('chat');
                    connections[to].channel = channel;
                    channelEvents(channel, to);
                });
            }

            return pc;
        },
        onSignalingState(remoteId: string, state: RTCSignalingState | null, callBack: (pc: RTCPeerConnection) => void) {
            let pc: RTCPeerConnection | null = null;

            if (Object.hasOwnProperty.call(connections, remoteId) && connections[remoteId].pc) {
                pc = connections[remoteId].pc;
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
        },
        sendAnswer: (to, sdp) => {
            ws.send(sdpMessage({from, to, sdp, key: 'answer'}));
        },
        sendOffer: (to, sdp) => {
            ws.send(sdpMessage({from, to, sdp, key: 'offer'}));
        },
        sendIceCandidate: (to, candidate) => {
            ws.send(iceMessage({from, to, candidate, key: 'ice-candidate'}));
        },
        sendMessage: async message => {
            const signedMessage = await signMessage(keyPair.privateKey, message);
            messages.push(signedMessage);
            for (const to in connections) {
                if (Object.hasOwnProperty.call(connections, to)) {
                    const {channel} = connections[to];
                    if (channel) {
                        channel.send(JSON.stringify(signedMessage));
                    }
                }
            }
        },
        subscribe: subscribeFn => {
            messages.subscribe(subscribeFn);
        },
    };

    const messageRouter = new MessageRouter(actions);

    ws.onmessage = event => {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);
            messageRouter.push(message);
        } catch (error) {
            console.error('parsing socket message failed');
            console.error(error);
        }
    };

    ws.send(announceMessage({from, key: 'announce'}));

    copyTemplate(from, actions);
};

const getID = (ws: WebSocket): Promise<string> =>
    new Promise((resolve, reject) => {
        ws.onmessage = event => {
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
                ws.onmessage = null;
            }
        };
    });

const generateKeys = async () =>
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

const signMessage = async (privateKey: CryptoKey, message: RTCChatMessage) => {
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

const verifyMessage = async (publicKey: CryptoKey, message: RTCChatMessage) => {
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

class MessageRouter {
    private buffers: {[key: string]: WebSocketMessage[]} = {};
    private processes = new Set<string>();

    constructor(private actions: Actions) {}

    push(message: WebSocketMessage) {
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
            await handleSocketMessage(message, this.actions);
            this.processes.delete(remoteId);
        }
        if (this.buffers[remoteId].length) {
            this.process(remoteId);
        }
    }
}

const handleSocketMessage = async (message: WebSocketMessage, actions: Actions) => {
    switch (message.key) {
        case 'announce': {
            // got a remote id, new peer connection, create offer
            const pc = await actions.createPC(message.from);
            if (pc.localDescription) {
                actions.sendOffer(message.from, pc.localDescription);
            }
            break;
        }

        case 'answer': {
            // got an sdp back, setRemoteDescription
            actions.onSignalingState(message.from, 'have-local-offer', async pc => {
                const sessionDescription = new RTCSessionDescription(message.sdp);
                await pc.setRemoteDescription(sessionDescription);
            });
            break;
        }

        case 'ice-candidate': {
            // got a candidate, add it
            actions.onSignalingState(message.from, 'stable', async pc => {
                await pc.addIceCandidate(message.candidate);
            });
            break;
        }

        case 'offer': {
            // got an SDP, new peer connection, set remote, create answer, answer
            const pc = await actions.createPC(message.from, message.sdp);
            if (pc.localDescription) {
                actions.sendAnswer(message.from, pc.localDescription);
            }
            break;
        }

        case 'renegotiate': {
            // got an SDP, get peer connection, set remote, create answer, answer
            actions.onSignalingState(message.from, 'stable', async pc => {
                const sessionDescription = new RTCSessionDescription(message.sdp);
                await pc.setRemoteDescription(sessionDescription);
                await pc.setLocalDescription(await pc.createAnswer());
                if (pc.localDescription) {
                    actions.sendAnswer(message.from, pc.localDescription);
                }
            });
            break;
        }
    }
};

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

const control = (form: HTMLFormElement | null, input: HTMLInputElement | null, actions: Actions) => {
    if (!form || !input) {
        throw new Error('cannot get form');
    }
    form.onsubmit = event => {
        event.preventDefault();
        if (!input.value) {
            return;
        }
        actions.sendMessage(createMessage(input.value));
        input.value = '';
    };
};

const template = document.querySelector('#container') as HTMLTemplateElement;
const copyTemplate = (id: string, actions: Actions) => {
    const container = document.importNode(template.content, true);
    const header = container.querySelector('.title') as HTMLHeadingElement;
    const messages = container.querySelector('.messages') as HTMLDivElement;
    const form = container.querySelector('form') as HTMLFormElement;
    const input = container.querySelector('input') as HTMLInputElement;
    header.innerText = id;
    control(form, input, actions);
    actions.subscribe((message: RTCChatMessage) => {
        append(messages, message);
    });
    document.body.appendChild(container);
};

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
(async () => {
    socket();
    await wait(2000);
    socket();
})();
