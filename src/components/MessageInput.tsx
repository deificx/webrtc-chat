import React, {useState, useContext} from 'react';
import {signaling} from '../signaling';
import {createMessage} from '../types';
import {User} from './Login';

export const MessageInput: React.FC = () => {
    const [value, setValue] = useState('');
    const author = useContext(User);

    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const message = createMessage(author);
        signaling.sendMessage(message(value));
        setValue('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input id="message" name="message" onChange={handleChange} value={value} />
        </form>
    );
};
