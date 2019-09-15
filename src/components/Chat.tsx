import React from 'react';
import {MessageInput} from './MessageInput';
import {RoomState, RTCChatMessage} from '../utils/types';
import {Message} from './Message';
import styled from 'styled-components';

const Div = styled.div`
    background-color: #fff;
    border-top: 1px solid #e1e3e5;
    flex-grow: 29;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-top: 20px;
    width: 100%;
`;

export const Chat: React.FC<{
    state: RoomState;
    editMessage: (old: RTCChatMessage, message: string) => void;
    handleEdit: (id: string) => void;
    sendMessage: (message: string) => void;
}> = ({state, editMessage, handleEdit, sendMessage}) => {
    return (
        <Div>
            {state.messages.map(message => (
                <Message
                    key={message.id}
                    message={message}
                    state={state}
                    editMessage={editMessage}
                    handleEdit={handleEdit}
                />
            ))}
            <MessageInput sendMessage={sendMessage} />
        </Div>
    );
};
