import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {EmojiPicker} from '../src/components/EmojiPicker';
import {EmojiData} from 'emoji-mart';
import {MessageParser} from '../src/components/MessageParser';

storiesOf('Emoji', module).add('Picker', () => {
    const [value, setValue] = useState('');

    const onSelect = (emoji: EmojiData) => {
        setValue([value.trim(), emoji.colons].join(' '));
    };

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    };

    return (
        <>
            <input onChange={onChange} type="text" value={value} />
            <p>
                <MessageParser message={value} />
            </p>
            <EmojiPicker onSelect={onSelect} />
        </>
    );
});
