import {generateID} from './crypto';

const getID = () => {
    const ID = window.localStorage.getItem('webrtc-chat:ID');
    if (ID) {
        return ID;
    }
    const newID = generateID();
    window.localStorage.setItem('webrtc-chat:ID', newID);
    return newID;
};

export const id = getID();
