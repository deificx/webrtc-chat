import React, {FormEvent} from 'react';
import {Tab} from './Tab';
import styled from 'styled-components';

const TabContainer = styled.div`
    display: flex;
    top: 0;
    right: 0;
    left: 0;
`;

export const Tabs: React.FC<{
    onSelect: (id: string) => void;
    selected: string;
    tabs: Array<{id: string; label: string}>;
}> = ({onSelect, selected, tabs}) => {
    const handleSetCurrentTab = (event: FormEvent<HTMLButtonElement>) => {
        onSelect(event.currentTarget.dataset.id || '');
    };

    return (
        <TabContainer>
            {tabs.map(tab => (
                <Tab
                    active={tab.id === selected}
                    disabled={tab.id === selected}
                    data-id={tab.id}
                    key={tab.id}
                    onClick={handleSetCurrentTab}
                >
                    {tab.label}
                </Tab>
            ))}
        </TabContainer>
    );
};
