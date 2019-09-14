import React, {useEffect, useContext, useState} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage, createMessage, createEdit} from '../types';
import {User} from './Login';
import styled from 'styled-components';
import {Tabs} from './Tabs';
import {Participants} from './Participants';
import {Chat} from './Chat';
import {Title} from './Title';
import {useRoom} from '../hooks/useRoom';

const Div = styled.div`
    background-color: #ebebeb;
    display: flex;
    flex-direction: column;
    margin: auto;
    height: 100vh;
    width: 360px;
`;

export const Room: React.FC = () => {
    const [state, dispatch] = useRoom();
    const [tab, setTab] = useState('chat');
    const author = useContext(User);

    useEffect(() => {
        signaling.addSubscriber(message => dispatch(message));
        return;
    }, []);

    const handleEdit = (id: string) => {
        if (state.messages.some(m => m.id === id && m.author.id === author.id)) {
            dispatch({key: 'edit', id});
        }
    };

    const handleSetTab = (id: string) => {
        setTab(id);
    };

    const editMessage = (old: RTCChatMessage, message: string) => {
        signaling.sendMessage(createEdit(old.author, old.id, message));
        dispatch({key: 'edit', id: ''});
    };

    const sendMessage = (message: string) => {
        signaling.sendMessage(createMessage(author, message));
    };

    return (
        <Div>
            <Title>Daily Standup Meeting</Title>
            <Tabs
                onSelect={handleSetTab}
                selected={tab}
                tabs={[
                    {id: 'participants', label: `participants (${state.authors.length})`},
                    {id: 'chat', label: 'Chat'},
                ]}
            ></Tabs>
            {tab === 'participants' && <Participants author={author} authors={state.authors} />}
            {tab === 'chat' && (
                <Chat state={state} editMessage={editMessage} handleEdit={handleEdit} sendMessage={sendMessage} />
            )}
        </Div>
    );
};
