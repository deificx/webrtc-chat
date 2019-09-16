import React, {Fragment} from 'react';
import {Emoji, EmojiData, EmojiProps} from 'emoji-mart';

export const MessageParser: React.FC<{message: string}> = ({message}) => {
    const tokens: string[] = [];
    let token = '';
    let collecting = false;
    for (let i = 0; i < message.length; i++) {
        const symbol = message[i];
        if (symbol === ':' && !collecting) {
            collecting = true;
            tokens.push(token);
            token = ':';
        } else if ((symbol === ' ' || i === message.length - 1) && collecting) {
            if (symbol !== ' ') {
                token += symbol;
            }
            tokens.push(token);
            token = ' ';
            collecting = false;
        } else {
            token += symbol;
        }
    }
    tokens.push(token);
    return (
        <>
            {tokens.map((token, index) =>
                token.slice(0, 1) === ':' && token.slice(-1) === ':' ? (
                    <Emoji
                        emoji={token}
                        fallback={(_emoji: EmojiData, props: EmojiProps) => props.emoji as any}
                        key={index}
                        set="messenger"
                        size={16}
                    />
                ) : (
                    <Fragment key={index}>{token}</Fragment>
                )
            )}
        </>
    );
};
