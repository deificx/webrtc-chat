import React, {useState} from 'react';
import {Input} from './Input';

export const MessageInput: React.FC<{sendMessage: (message: string, type: 'text/plain' | 'text/image') => void}> = ({
    sendMessage,
}) => {
    const [value, setValue] = useState('');

    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        sendMessage(value, 'text/plain');
        setValue('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input id="message" name="message" onChange={handleChange} value={value} />
        </form>
    );
};
