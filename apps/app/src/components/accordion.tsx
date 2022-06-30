import { useEffect, useRef, useState, useContext } from 'react';
import Chevron from "./icons/chevron";
import { AccordionContext } from '../context/accordion-context';
import "./Accordion.css"

function Accordion(props: any) {
    const [active, setActiveState] = useState("");
    const [height, setHeightState] = useState("0px");
    const [rotation, setRotateState] = useState("accordion__icon");
    const content = useRef<any>(null);

    const panels:any = useContext(AccordionContext).panels;
    useEffect(() => {
        document.title = `${active}`;
        
    })



    function toggleAccordion() {
        if (!!content.current) {
            const panelState = panels?.[props.id].isActive;
            // debugger;
            setActiveState(active === "" ? "active" : "");
            setHeightState(
                active === "active" ? "0px" : `${content.current.scrollHeight}px`
            );
            setRotateState(
                active === "active" ? "accordion__icon" : "accordion__icon rotate"
            );
        }
        
      }

    return (
        <div className="accordion__section">
          <button className={`accordion ${active}`} onClick={toggleAccordion}>
            <p className="accordion__title">{props.title}</p>
            <Chevron className={`${rotation}`} width={10} fill={"#777"} />
          </button>
          <div
            ref={content}
            style={{ maxHeight: `${height}` }}
            className="accordion__content"
          >
            <div
              className="accordion__text"
              dangerouslySetInnerHTML={{ __html: props.content }}
            />
          </div>
        </div>
    );
        
}


export default Accordion;
