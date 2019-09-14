import React, {useEffect} from 'react';
import {storiesOf} from '@storybook/react';
import {Chat} from '../src/components/Chat';
import {createMessage, Author, RTCChatMessage, createEdit} from '../src/types';
import {useRoom} from '../src/hooks/useRoom';

const author1: Author = {
    id: '1',
    displayName: 'Chatty McChatface',
};

const author2: Author = {
    id: '2',
    displayName: 'Heisenberg æøå',
};

const texts = [
    "Do you see any Teletubbies in here? Do you see a slender plastic tag clipped to my shirt with my name printed on it? Do you see a little Asian child with a blank expression on his face sitting outside on a mechanical helicopter that shakes when you put quarters in it? No? Well, that's what you see at a toy store. And you must think you're in a toy store, because you're here shopping for an infant named Jeb.",
    "Normally, both your asses would be dead as fucking fried chicken, but you happen to pull this shit while I'm in a transitional period so I don't wanna kill you, I wanna help you. But I can't give you this case, it don't belong to me. Besides, I've already been through too much shit this morning over this case to hand it over to your dumb ass.",
    "Look, just because I don't be givin' no man a foot massage don't make it right for Marsellus to throw Antwone into a glass motherfuckin' house, fuckin' up the way the nigger talks. Motherfucker do that shit to me, he better paralyze my ass, 'cause I'll kill the motherfucker, know what I'm sayin'?",
    "Your bones don't break, mine do. That's clear. Your cells react to bacteria and viruses differently than mine. You don't get sick, I do. That's also clear. But for some reason, you and I react the exact same way to water. We swallow it too fast, we choke. We get some in our lungs, we drown. However unreal it may seem, we are connected, you and I. We're on the same curve, just on opposite ends.",
    "Now that there is the Tec-9, a crappy spray gun from South Miami. This gun is advertised as the most popular gun in American crime. Do you believe that shit? It actually says that in the little book that comes with it: the most popular gun in American crime. Like they're actually proud of that shit. ",
];

storiesOf('Chat', module).add('Populated', () => {
    const [state, dispatch] = useRoom();
    useEffect(() => {
        dispatch({key: 'rtc:public-key', author: author1, exportedPublicKey: {}});
        dispatch({key: 'rtc:public-key', author: author2, exportedPublicKey: {}});
        texts.forEach((text, index) => dispatch(createMessage(index % 2 === 0 ? author1 : author2, text)));
    }, []);

    const handleEdit = (id: string) => {
        if (state.messages.some(m => m.id === id && m.author.id === author1.id)) {
            dispatch({key: 'edit', id});
        }
    };

    const editMessage = (old: RTCChatMessage, message: string) => {
        dispatch(createEdit(old.author, old.id, message));
        dispatch({key: 'edit', id: ''});
    };

    const sendMessage = (message: string) => {
        dispatch(createMessage(author1, message));
    };

    return <Chat state={state} handleEdit={handleEdit} editMessage={editMessage} sendMessage={sendMessage} />;
});
