import React, {useState, useRef, useLayoutEffect, useEffect} from 'react';
import {MessageInput} from './MessageInput';
import {RoomState, RTCChatMessage} from '../utils/types';
import {Message} from './Message';
import styled from 'styled-components';
import {File} from './File';
import {EmojiPicker} from './EmojiPicker';
import {EmojiData} from 'emoji-mart';
import useStayScrolled from 'react-stay-scrolled';

const Div = styled.div`
    background-color: #fff;
    flex-grow: 29;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
    position: relative;
    width: 100%;
`;

const Messages = styled.div`
    overflow-y: auto;
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
    const messagesRef = useRef<HTMLDivElement>(null);
    const {stayScrolled} = useStayScrolled(messagesRef);

    const onSelect = (emoji: EmojiData) => {
        setValue([value.trim(), emoji.colons].join(' '));
    };

    useLayoutEffect(() => {
        stayScrolled();
    }, [state.messages.length]);

    return (
        <Div>
            <Messages ref={messagesRef}>
                {state.messages.map(message => (
                    <Message
                        key={message.id}
                        message={message}
                        state={state}
                        editMessage={editMessage}
                        handleEdit={handleEdit}
                    />
                ))}
            </Messages>
            <MessageInput sendMessage={sendMessage} setValue={setValue} value={value} />
            <Controls>
                <File sendMessage={sendMessage} />
                <EmojiPicker onSelect={onSelect} />
            </Controls>
        </Div>
    );
};
