import styled, {css} from 'styled-components';

export const Tab = styled.button<{active: boolean}>`
    background-color: #ebebeb;
    border: 1px solid transparent;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    cursor: pointer;
    padding: 1em;
    position: relative;
    top: 1px;
    width: 50%;

    :disabled {
        color: #354052;
    }

    ${props =>
        props.active &&
        css`
            background-color: #fff;
            border-color: #e1e3e5;
            border-bottom-color: #fff;
        `}
`;
