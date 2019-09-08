# WebRTC chat (work in progress)

A chat implementation using WebRTC data channels.
Dependencies handled by yarn.

```bash
$ yarn install
```

## Server

```bash
$ yarn server
```

Includes a websocket server using `ws` and a STUN/TURN server using `node-turn`.
It's only function is to act as a relay between clients, by forwarding signaling through the websocket.

## Client

```bash
$ yarn start
```

The signaling class handles everything websocket and webrtc right now.
I've looked into how these could be sensibly split up, but haven't found a good way.
The react components simply subscribe to events from this class and display them on screen.
