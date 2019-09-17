import React, {useContext, useState} from 'react';
import {RTCChatMessage, createMessage, createEdit, RoomState, Author} from '../utils/types';
import styled from 'styled-components';
import {Tabs} from './Tabs';
import {Participants} from './Participants';
import {Chat} from './Chat';
import {Title} from './Title';
import {Actions} from '../hooks/useRoomState';

const Div = styled.div`
    background-color: #ebebeb;
    display: flex;
    flex-direction: column;
    margin: auto;
    height: 100vh;
    width: 360px;
`;

export const Room: React.FC<{
    author: Author;
    dispatch: React.Dispatch<Actions>;
    signalMessage: (message: RTCChatMessage) => void;
    state: RoomState;
}> = ({author, dispatch, signalMessage, state}) => {
    const [tab, setTab] = useState('chat');

    const handleEdit = (id: string) => {
        if (state.messages.some(m => m.id === id && m.author.id === author.id)) {
            dispatch({key: 'edit', id});
        }
    };

    const handleSetTab = (id: string) => {
        setTab(id);
    };

    const editMessage = (old: RTCChatMessage, message: string) => {
        signalMessage(createEdit(old.author, old.id, message));
        dispatch({key: 'edit', id: ''});
    };

    const sendMessage = (message: string, type: 'text/plain' | 'text/image' = 'text/plain') => {
        signalMessage(createMessage(author, message, type));
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
