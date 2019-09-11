import React, {useState, createContext, useRef, useEffect} from 'react';
import {generateID} from '../crypto';
import {signaling} from '../signaling';

const getID = () => {
    const ID = window.localStorage.getItem('webrtc-chat:ID');
    if (ID) {
        return ID;
    }
    const newID = generateID();
    window.localStorage.setItem('webrtc-chat:ID', newID);
    return newID;
};

const id = getID();

export const User = createContext<{displayName: string; id: string}>({displayName: '', id});

export const Login: React.FC<{}> = ({children}) => {
    const [username, setUsername] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
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
        signaling.setup({displayName: username, id});
    }, [loggedIn, username]);

    if (loggedIn) {
        return <User.Provider value={{displayName: username, id}}>{React.Children.only(children)}</User.Provider>;
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
