import React, {useEffect, useReducer, useContext} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage, Author, RTCKeyMessage} from '../types';
import produce from 'immer';
import {EditMessage} from './EditMessage';
import {User} from './Login';

interface State {
    authors: Author[];
    editing: string;
    messages: RTCChatMessage[];
}
type Actions = RTCChatMessage | RTCKeyMessage | {key: 'edit'; id: string};

const initialState: State = {
    authors: [],
    editing: '',
    messages: [],
};

const reducer = (state: State, action: Actions) =>
    produce(state, draft => {
        console.log(action);
        switch (action.key) {
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
        if (state.messages.some(m => m.id === id && m.authorId === author.id)) {
            dispatch({key: 'edit', id});
        }
    };

    const finishEdit = () => {
        dispatch({key: 'edit', id: ''});
    };

    return (
        <div>
            {state.messages.map(message => {
                const time = new Date(message.timestamp);
                const author = state.authors.find(a => a.id === message.authorId);
                if (!author) {
                    console.error('cannot list message without author');
                    return null;
                }
                return (
                    <article key={message.id}>
                        <header>
                            {author.displayName}
                            <time dateTime={time.toISOString()}>{time.toLocaleString()}</time>
                        </header>
                        {state.editing === message.id ? (
                            <EditMessage message={message} onEdited={finishEdit} />
                        ) : (
                            <section onDoubleClick={() => handleEdit(message.id)}>{message.message}</section>
                        )}
                    </article>
                );
            })}
        </div>
    );
};
