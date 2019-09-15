import React from 'react';
import {EditMessage} from './EditMessage';
import {RoomState, RTCChatMessage} from '../utils/types';
import styled from 'styled-components';

const Article = styled.article`
    padding: 0 25px 10px;
`;

const Time = styled.time`
    color: #9a9fa8;
    display: inline-block;
    padding: 0 5px;
`;

const Section = styled.section`
    margin: 5px 0;
`;

const Edit = styled.span`
    color: grey;
    display: inline-block;
    padding: 0 0.5em;
`;

export const Message: React.FC<{
    message: RTCChatMessage;
    state: RoomState;
    editMessage: (old: RTCChatMessage, message: string) => void;
    handleEdit: (id: string) => void;
}> = ({message, state, editMessage, handleEdit}) => {
    const time = new Date(message.timestamp);
    const author = state.authors.find(a => a.id === message.author.id);
    return (
        <Article key={message.id}>
            <header>
                {author ? <strong>{author.displayName}</strong> : <del>{message.author.displayName}</del>}
                <Time dateTime={time.toISOString()}>{time.toLocaleString()}</Time>
            </header>
            {message.edited && message.message === '' ? (
                <del>message deleted</del>
            ) : state.editing === message.id ? (
                <EditMessage message={message} editMessage={editMessage} />
            ) : (
                <>
                    <Section onDoubleClick={() => handleEdit(message.id)}>{message.message}</Section>
                    {message.edited && <Edit>(edited)</Edit>}
                </>
            )}
        </Article>
    );
};
