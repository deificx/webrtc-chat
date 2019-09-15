import React from 'react';
import {storiesOf} from '@storybook/react';
import {File} from '../src/components/File';

const sendMessage = (image: string, type: string) => {
    console.log(image, type);
};

storiesOf('File', module).add('Form', () => <File sendMessage={sendMessage} />);
