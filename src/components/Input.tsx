import styled, {css} from 'styled-components';

export const Input = styled.input<{inline?: boolean}>`
    border: 1px solid #000;
    border-radius: 4px;
    padding: 1em;
    margin: 20px;
    width: 320px;

    ${props =>
        props.inline &&
        css`
            margin: 0;
        `}
`;
