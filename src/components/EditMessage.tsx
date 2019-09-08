import React, {useState} from 'react';
import {signaling} from '../signaling';
import {RTCChatMessage, createEdit} from '../types';

export const EditMessage: React.FC<{message: RTCChatMessage; onEdited: () => void}> = ({message, onEdited}) => {
    const [value, setValue] = useState(message.message);

    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        signaling.sendMessage(createEdit(message.author, message.id, value));
        onEdited();
    };

    return (
        <form onSubmit={handleSubmit}>
            <input id="message" name="message" onChange={handleChange} value={value} />
        </form>
    );
};
