import React, {useEffect, useReducer, useContext, useState, FormEvent} from 'react';
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

    const finishEdit = () => {
        dispatch({key: 'edit', id: ''});
    };

    const handleSetTab = (event: FormEvent<HTMLButtonElement>) => {
        setTab(event.currentTarget.id);
    };

    return (
        <div className="room">
            <h1 className="roomTitle">Daily Standup Meeting</h1>
            <div className="tabs">
                <button
                    className={tab === 'participants' ? 'active' : ''}
                    disabled={tab === 'participants'}
                    id="participants"
                    onClick={handleSetTab}
                >
                    participants ({state.authors.length})
                </button>
                <button
                    className={tab === 'chat' ? 'active' : ''}
                    disabled={tab === 'chat'}
                    id="chat"
                    onClick={handleSetTab}
                >
                    chat
                </button>
            </div>
            {tab === 'participants' && (
                <ul className="main participants">
                    {state.authors.map(a => (
                        <li className="participant" key={a.id}>
                            {a.id === author.id ? <strong>{a.displayName}</strong> : a.displayName}
                        </li>
                    ))}
                </ul>
            )}
            {tab === 'chat' && (
                <div className="main chat">
                    <div className="content">
                        {state.messages.map(message => {
                            const time = new Date(message.timestamp);
                            const author = state.authors.find(a => a.id === message.author.id);
                            return (
                                <article className="msg" key={message.id}>
                                    <header>
                                        {author ? (
                                            <strong>{author.displayName}</strong>
                                        ) : (
                                            <del>{message.author.displayName}</del>
                                        )}
                                        <time dateTime={time.toISOString()}>{time.toLocaleString()}</time>
                                    </header>
                                    {message.edited && message.message === '' ? (
                                        <ins>message deleted</ins>
                                    ) : state.editing === message.id ? (
                                        <EditMessage message={message} onEdited={finishEdit} />
                                    ) : (
                                        <section onDoubleClick={() => handleEdit(message.id)}>
                                            {message.message}
                                        </section>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                    <MessageInput />
                </div>
            )}
        </div>
    );
};
