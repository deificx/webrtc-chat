console.clear();

import React, {useEffect} from 'react';
import {render} from 'react-dom';
import {Login} from './components/Login';
import {Messages} from './components/Messages';
import {MessageInput} from './components/MessageInput';

const App: React.FC = () => {
    useEffect(() => {}, []);
    return (
        <Login>
            <>
                <Messages />
                <MessageInput />
            </>
        </Login>
    );
};

render(<App />, document.getElementById('chat'));
