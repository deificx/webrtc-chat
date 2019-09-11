import React, {useState, useContext} from 'react';
import {signaling} from '../signaling';
import {createMessage} from '../types';
import {User} from './Login';
import {Input} from './Input';

export const MessageInput: React.FC = () => {
    const [value, setValue] = useState('');
    const author = useContext(User);

    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        signaling.sendMessage(createMessage(author, value));
        setValue('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input id="message" name="message" onChange={handleChange} value={value} />
        </form>
    );
};
