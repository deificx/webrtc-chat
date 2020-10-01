import TurnServer from 'node-turn';
import WebSocket from 'ws';
import {v4} from 'uuid';
import {Sdp, AnnounceClient, IceCandidate} from './src/utils/types';

const turnServer = new TurnServer({
    listeningIps: ['0.0.0.0'],
});

turnServer.start();

const websocketServer = new WebSocket.Server({
    clientTracking: true,
    port: 4321,
});

const sockets: Array<[string, WebSocket]> = [];

const getSocketById = (id: string) => {
    const idAndSocket = sockets.find(([socketId]) => id === socketId);
    if (!idAndSocket) {
        return null;
    }
    return idAndSocket[1];
};

websocketServer.on('connection', (socket) => {
    const id = v4();
    sockets.push([id, socket]);

    console.log(`new socket connection given id=${id}`);

    socket.onclose = (event) => {
        console.log('socket closed');
        console.log(event);
    };

    socket.onmessage = (event) => {
        try {
            const message: AnnounceClient | Sdp | IceCandidate = JSON.parse(event.data.toString());
            console.log(
                `socket message, key="${message.key}", from="${message.from}"${
                    (message as any).to ? `, to="${(message as any).to}"` : ''
                }`
            );

            switch (message.key) {
                case 'announce':
                    sockets
                        .filter(([clientId]) => clientId !== id)
                        .map(([_, clientSocket]) => clientSocket)
                        .forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({from: id, key: 'announce'}));
                            }
                        });
                    break;

                case 'answer':
                case 'ice-candidate':
                case 'offer':
                case 'renegotiate': {
                    const remoteSocket = getSocketById(message.to);
                    if (remoteSocket && remoteSocket.readyState === WebSocket.OPEN) {
                        remoteSocket.send(JSON.stringify(message));
                    }
                    break;
                }
            }
        } catch (error) {
            console.log('unable to parse socket message');
            console.log(error);
        }
    };

    if (socket.readyState === WebSocket.OPEN) {
        console.log('socket already open, sending id', id);
        socket.send(JSON.stringify({id, key: 'id'}));
    }
});
