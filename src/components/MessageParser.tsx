import React, {Fragment} from 'react';
import {Emoji, EmojiData, EmojiProps} from 'emoji-mart';

const emoji = /(:[\w\d]+:(?=:):[\w\-]+:|:[\w\-]+:)/;

export const MessageParser: React.FC<{message: string}> = ({message}) => {
    const tokens: string[] = message.split(emoji);
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
