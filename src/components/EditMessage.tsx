import React, {useState} from 'react';
import {RTCChatMessage} from '../utils/types';
import {Input} from './Input';

export const EditMessage: React.FC<{
    message: RTCChatMessage;
    editMessage: (old: RTCChatMessage, message: string) => void;
}> = ({message, editMessage}) => {
    const [value, setValue] = useState(message.message);

    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        editMessage(message, value);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input id="message" inline name="message" onChange={handleChange} value={value} />
        </form>
    );
};
