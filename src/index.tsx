console.clear();

import React from 'react';
import {render} from 'react-dom';
import {Login} from './components/Login';
import {Messages} from './components/Messages';

const App: React.FC = () => (
    <Login>
        <Messages />
    </Login>
);

render(<App />, document.getElementById('root'));
