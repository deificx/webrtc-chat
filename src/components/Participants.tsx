import React from 'react';
import styled from 'styled-components';
import {Author} from '../utils/types';

const Ul = styled.ul`
    background-color: #fff;
    border-top: 1px solid #e1e3e5;
    flex-grow: 29;
    margin: 0;
    padding: 0;
`;

const Li = styled.li`
    border-bottom: 1px solid #dcdfe2;
    line-height: 50px;
    list-style: none;
    padding: 0 20px;
`;

export const Participants: React.FC<{
    author: Author;
    authors: Author[];
}> = ({author, authors}) => (
    <Ul>
        {authors.map(a => (
            <Li key={a.id}>{a.id === author.id ? <strong>{a.displayName}</strong> : a.displayName}</Li>
        ))}
    </Ul>
);
