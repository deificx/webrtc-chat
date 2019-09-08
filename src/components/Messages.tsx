import React, {useEffect, useReducer} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage} from '../types';
import produce from 'immer';

type State = RTCChatMessage[];
type Actions = RTCChatMessage;

const reducer = (state: State, action: Actions) => produce(state, draft => [...draft, action]);

export const Messages: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, []);

    useEffect(() => {
        signaling.addSubscriber(message => dispatch(message));
        return;
    }, []);

    return (
        <div>
            {state.map(message => {
                const time = new Date(message.timestamp);
                return (
                    <article key={message.id}>
                        <header>
                            {message.author.displayName}
                            <time dateTime={time.toISOString()}>{time.toLocaleString()}</time>
                        </header>
                        <section>{message.message}</section>
                    </article>
                );
            })}
        </div>
    );
};
