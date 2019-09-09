import React from 'react';
import {EditMessage} from './EditMessage';
import {MessageInput} from './MessageInput';
import {State} from './Room';
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
    state: State;
    finishEdit: () => void;
    handleEdit: (id: string) => void;
}> = ({state, finishEdit, handleEdit}) => {
    return (
        <Div>
            {state.messages.map(message => {
                const time = new Date(message.timestamp);
                const author = state.authors.find(a => a.id === message.author.id);
                return (
                    <article className="msg" key={message.id}>
                        <header>
                            {author ? <strong>{author.displayName}</strong> : <del>{message.author.displayName}</del>}
                            <time dateTime={time.toISOString()}>{time.toLocaleString()}</time>
                        </header>
                        {message.edited && message.message === '' ? (
                            <ins>message deleted</ins>
                        ) : state.editing === message.id ? (
                            <EditMessage message={message} onEdited={finishEdit} />
                        ) : (
                            <section onDoubleClick={() => handleEdit(message.id)}>{message.message}</section>
                        )}
                    </article>
                );
            })}
            <MessageInput />
        </Div>
    );
};
