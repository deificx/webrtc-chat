import React, {useReducer} from 'react';
import {RTCChatMessage, RTCKeyMessage, RoomState} from '../types';
import produce from 'immer';

type Actions = RTCChatMessage | RTCKeyMessage | {key: 'edit'; id: string} | {key: 'clear:author'; id: string};

const initialState: RoomState = {
    authors: [],
    editing: '',
    messages: [],
};

const reducer = (state: RoomState, action: Actions) =>
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

export const useRoom = () => {
    return useReducer(reducer, initialState);
};
