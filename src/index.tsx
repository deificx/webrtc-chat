console.clear();

import React from 'react';
import {render} from 'react-dom';
import {Login} from './components/Login';
import {Room} from './components/Room';

const App: React.FC = () => (
    <Login>
        <Room />
    </Login>
);

render(<App />, document.getElementById('root'));
