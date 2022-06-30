import React, { useState } from 'react';

// THIS IS CONTEXT OBJECT - NOT PROVIDER (SCHEMA/META)
export const AccordionContext = React.createContext({
    panels: [],
    toggleAllPanels: () => {}
});

// FUNCTIONAL COMPONENT - PROVIDER -- USING CREATE CONTEXT
export default (props: any) => {
    const maxSections = props.children?.length ?? 0;
    const startData = [];
    if (maxSections > 0) {
        for(let i = 0; i < maxSections; i++) {
            startData.push({
                id: i,
                isActive: false,
                title: `test ${i}`,
                content: `some content ${i}`, 
            });
        }
    }
    const [panelsList, setPanelsList] = useState(startData);
    
    const toggleAllPanelsList = () => {
        console.warn('why not hit!!!!!!!');
        setPanelsList((currentPanels: any) => {
            currentPanels.forEach((panel: any) => {
                panel.isActive = !panel.isActive;
            });
            const updatedPanels = [...currentPanels];
            return updatedPanels;
        });
    }

    //
    const val: any = {
        panels: panelsList, 
        setPanels: setPanelsList, 
        toggleAllPanels: toggleAllPanelsList
    };

    return (
        <AccordionContext.Provider value={val}>
            {props.children}
        </AccordionContext.Provider>
    );
};

// export function AccordionContextProvider(props) {
    

    
    
    
    
// };

// export const useAccordionContext = () => React.useContext(AccordionContext);