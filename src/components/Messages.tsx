import React, {useEffect, useReducer, useContext} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage, Author, RTCKeyMessage} from '../types';
import produce from 'immer';
import {EditMessage} from './EditMessage';
import {User} from './Login';
import {MessageInput} from './MessageInput';

interface State {
    authors: Author[];
    editing: string;
    messages: RTCChatMessage[];
}
type Actions = RTCChatMessage | RTCKeyMessage | {key: 'edit'; id: string} | {key: 'clear:author'; id: string};

const initialState: State = {
    authors: [],
    editing: '',
    messages: [],
};

const reducer = (state: State, action: Actions) =>
    produce(state, draft => {
        console.log(action);
        switch (action.key) {
            case 'clear:author':
                const index = draft.authors.findIndex(author => author.id === action.id);
                if (index >= 0 && index < draft.authors.length) {
                    draft.authors = [...draft.authors.slice(0, index), ...draft.authors.slice(index + 1)];
                }
                break;

            case 'edit':
                draft.editing = action.id;
                break;

            case 'rtc:chat':
                if (action.edited) {
                    const index = draft.messages.findIndex(message => message.id === action.id);
                    if (index >= 0 && index < draft.messages.length) {
                        draft.messages[index] = action;
                    }
                } else {
                    draft.messages = [...draft.messages, action];
                }
                break;

            case 'rtc:public-key':
                draft.authors = [...draft.authors, action.author];
                break;
        }
    });

export const Messages: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
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

    const finishEdit = () => {
        dispatch({key: 'edit', id: ''});
    };

    return (
        <>
            <div className="container">
                <h2>Participants</h2>
                <ul>
                    {state.authors.map(a => (
                        <li key={a.id}>{a.id === author.id ? <strong>{a.displayName}</strong> : a.displayName}</li>
                    ))}
                </ul>
            </div>
            <div className="container">
                <h2>Chat</h2>
                {state.messages.map(message => {
                    const time = new Date(message.timestamp);
                    const author = state.authors.find(a => a.id === message.author.id);
                    return (
                        <article key={message.id}>
                            <header>
                                {author ? author.displayName : <del>{message.author.displayName}</del>}
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
            </div>
        </>
    );
};
