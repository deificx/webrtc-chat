import React, {useEffect, useReducer} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage, RTCKeyMessage, Author} from '../types';
import produce from 'immer';

interface State {
    authors: Author[];
    messages: RTCChatMessage[];
}
type Actions = RTCChatMessage | RTCKeyMessage;

const initialState: State = {
    authors: [],
    messages: [],
};

const reducer = (state: State, action: Actions) =>
    produce(state, draft => {
        console.log(action);
        switch (action.key) {
            case 'rtc:chat':
                draft.messages = [...draft.messages, action];
                break;

            case 'rtc:public-key':
                draft.authors = [...draft.authors, action.author];
                break;
        }
    });

export const Messages: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        signaling.addSubscriber(message => dispatch(message));
        return;
    }, []);

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
                        <section>{message.message}</section>
                    </article>
                );
            })}
        </div>
    );
};
