import styled, {css} from 'styled-components';

export const Input = styled.input<{inline?: boolean}>`
    border: 1px solid #000;
    border-radius: 4px;
    padding: 15px 10px;
    margin: 20px;
    width: 240px;

    ${props =>
        props.inline &&
        css`
            margin: 0;
            width: 290px;
        `}
`;
