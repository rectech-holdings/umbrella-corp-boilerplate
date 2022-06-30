import { useContext } from "react";
import AccordionProvider, { AccordionContext } from "../context/accordion-context";
import Accordion from "./accordion";


function AccordionGroup(props: any) {
    const toggleAllPanels = useContext(AccordionContext).toggleAllPanels;

  const toggleAll = () => {
    toggleAllPanels();
  }

    return (
        <AccordionProvider>
            <button 
                onClick={toggleAll} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">
                Click
            </button>
            <Accordion id={1} title="whatever" content="something something something blah blah blah"/>
            <Accordion id={2} title="test2" content="sometng something sometng something something blhing blhing something something blah blah blah"/>
            <Accordion id={3} title="zzz" content="zzzzzzzzz"/>
            <Accordion id={4} title="AAAAA" content="aaaaaaa"/>
        </AccordionProvider>
    );
}

export default AccordionGroup;