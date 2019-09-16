import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {Emoji} from 'emoji-mart';

const Modal = styled.div`
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 5px 5px rgba(128, 128, 128, 0.25);
    display: flex;
    position: fixed;
    top: 5%;
    right: 5%;
    bottom: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    border-radius: 0.5em;

    div {
        position: absolute;
        bottom: 5%;
        right: 5%;
    }

    img {
        margin: auto;
        max-width: 90%;
        max-height: 90%;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

const Label = styled.label`
    cursor: pointer;
    width: 32px;
`;

export const File: React.FC<{sendMessage: (image: string, type: 'text/plain' | 'text/image') => void}> = ({
    sendMessage,
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [count, setCount] = useState(0);
    const [image, setImage] = useState('');

    const handleCancel = () => {
        setCount(count + 1);
        setImage('');
    };

    const handleSubmit = () => {
        if (!image) {
            return;
        }
        sendMessage(image, 'text/image');
        handleCancel();
    };

    useEffect(() => {
        if (!fileRef.current) {
            return;
        }

        const fileHandler = (_event: Event) => {
            if (!fileRef.current || (fileRef.current && !fileRef.current.files![0])) {
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                console.log(reader.result);
                if (typeof reader.result === 'string') {
                    setImage(reader.result);
                } else {
                    // incorrect format
                }
            });
            reader.readAsDataURL(fileRef.current.files![0]);
        };

        fileRef.current.addEventListener('change', fileHandler);

        return () => {
            if (!fileRef.current) {
                return;
            }
            fileRef.current.removeEventListener('change', fileHandler);
        };
    }, [count, fileRef]);

    return (
        <>
            {image && (
                <Modal>
                    <img src={image} alt="" />
                    <div>
                        <button onClick={handleCancel}>Cancel</button>
                        <button onClick={handleSubmit}>Send</button>
                    </div>
                </Modal>
            )}
            <HiddenInput id="file-input" ref={fileRef} type="file" />
            <Label htmlFor="file-input">
                <Emoji emoji=":file_folder:" set="messenger" size={24} />
            </Label>
        </>
    );
};
