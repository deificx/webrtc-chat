import React, {useState} from 'react';
import {MessageInput} from './MessageInput';
import {RoomState, RTCChatMessage} from '../utils/types';
import {Message} from './Message';
import styled from 'styled-components';
import {File} from './File';
import {EmojiPicker} from './EmojiPicker';
import {EmojiData} from 'emoji-mart';

const Div = styled.div`
    background-color: #fff;
    border-top: 1px solid #e1e3e5;
    flex-grow: 29;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-top: 20px;
    position: relative;
    width: 100%;
`;

const Controls = styled.div`
    position: absolute;
    right: 27px;
    bottom: 27px;
`;

export const Chat: React.FC<{
    state: RoomState;
    editMessage: (old: RTCChatMessage, message: string) => void;
    handleEdit: (id: string) => void;
    sendMessage: (message: string, type: 'text/plain' | 'text/image') => void;
}> = ({state, editMessage, handleEdit, sendMessage}) => {
    const [value, setValue] = useState('');

    const onSelect = (emoji: EmojiData) => {
        setValue([value.trim(), emoji.colons].join(' '));
    };

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
            <MessageInput sendMessage={sendMessage} setValue={setValue} value={value} />
            <Controls>
                <File sendMessage={sendMessage} />
                <EmojiPicker onSelect={onSelect} />
            </Controls>
        </Div>
    );
};
