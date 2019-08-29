import TurnServer from 'node-turn';

const turnServer = new TurnServer({
    listeningIps: ['0.0.0.0'],
});

turnServer.start();
