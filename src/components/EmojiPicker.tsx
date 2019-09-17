import React, {useState} from 'react';
import data from 'emoji-mart/data/messenger.json';
import {Emoji, EmojiData, NimblePicker} from 'emoji-mart';
import styled from 'styled-components';

const Modal = styled.div`
    height: 426px;
    left: 50%;
    margin-left: -178px;
    margin-top: -213px;
    position: fixed;
    top: 50%;
    width: 356px;
`;

const Button = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    width: 32px;

    :focus {
        outline: none;
    }
`;

export const EmojiPicker: React.FC<{
    onSelect: (emoji: EmojiData) => void;
}> = ({onSelect}) => {
    const [show, setShow] = useState(false);

    const toggle = (show: boolean) => {
        setShow(show);
    };

    const handleSelect = (emoji: EmojiData) => {
        onSelect(emoji);
        toggle(false);
    };

    const handleClick = () => {
        toggle(!show);
    };

    return (
        <>
            {show && (
                <Modal>
                    <NimblePicker
                        data={data}
                        emoji="grinning"
                        onSelect={handleSelect}
                        set="messenger"
                        title="Select emoji"
                    />
                </Modal>
            )}
            <Button onClick={handleClick}>
                <Emoji emoji="grinning" set="messenger" size={24} />
            </Button>
        </>
    );
};