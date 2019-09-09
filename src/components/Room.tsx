import React, {useEffect, useReducer, useContext, useState, FormEvent} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage, Author, RTCKeyMessage} from '../types';
import produce from 'immer';
import {User} from './Login';
import styled from 'styled-components';
import {Tabs} from './Tabs';
import {Participants} from './Participants';
import {Chat} from './Chat';

export interface State {
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

const Div = styled.div`
    background-color: #ebebeb;
    display: flex;
    flex-direction: column;
    margin: auto;
    height: 100vh;
    width: 360px;
`;

export const Room: React.FC = () => {
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

    const handleSetTab = (id: string) => {
        setTab(id);
    };

    return (
        <Div>
            <h1 className="roomTitle">Daily Standup Meeting</h1>
            <Tabs
                onSelect={handleSetTab}
                selected={tab}
                tabs={[
                    {id: 'participants', label: `participants (${state.authors.length})`},
                    {id: 'chat', label: 'Chat'},
                ]}
            ></Tabs>
            {tab === 'participants' && <Participants author={author} authors={state.authors} />}
            {tab === 'chat' && <Chat state={state} finishEdit={finishEdit} handleEdit={handleEdit} />}
        </Div>
    );
};
