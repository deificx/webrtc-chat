console.clear();

import React, {useEffect, useRef, useState} from 'react';
import {render} from 'react-dom';
import {Room} from './components/Room';
import {signaling} from './utils/signaling';
import {id} from './utils/id';
import {useRoomState} from './hooks/useRoomState';
import {RTCChatMessage} from './utils/types';

const App: React.FC = () => {
    const [username, setUsername] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [state, dispatch] = useRoomState();
    const dialog = useRef<HTMLDialogElement>(null);

    const handleUsername = (event: React.FormEvent<HTMLInputElement>) => {
        setUsername(event.currentTarget.value);
    };

    const handleSubmit = (_event: React.FormEvent<HTMLFormElement>) => {
        if (!username) {
            return;
        }
        console.log('logging in', username);
        window.setInterval(setLoggedIn, 0, true);
    };

    const signalMessage = (message: RTCChatMessage) => {
        signaling.sendMessage(message);
    };

    useEffect(() => {
        if (dialog.current && typeof dialog.current.showModal === 'function') {
            dialog.current.showModal();
        } else if (dialog.current) {
            const name = window.prompt('Username');
            setUsername(name || 'Guest');
            window.setInterval(setLoggedIn, 0, true);
        }
    }, [dialog]);

    useEffect(() => {
        if (!loggedIn || !username) {
            return;
        }
        signaling.setup({displayName: username, id}, message => dispatch(message));
    }, [loggedIn, username]);

    if (loggedIn) {
        return (
            <Room
                author={{displayName: username, id}}
                dispatch={dispatch}
                signalMessage={signalMessage}
                state={state}
            />
        );
    }

    return (
        <dialog ref={dialog}>
            <form method="dialog" onSubmit={handleSubmit}>
                <label htmlFor="username">Username</label>
                <br />
                <input id="username" onChange={handleUsername} value={username} />
                <button type="submit">Login</button>
            </form>
        </dialog>
    );
};

render(<App />, document.getElementById('root'));
