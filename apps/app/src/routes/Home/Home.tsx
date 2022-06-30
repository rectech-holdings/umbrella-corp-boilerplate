import React, { useContext } from 'react';
import { useEffect } from "react";
import { Link } from "react-router-dom";
import Accordion from "../../components/accordion";
import Counter from "../../components/counter";
import useCounter from "../../hooks/use-counter";
import AccordionProvider from '../../context/accordion-context';
import { AccordionContext } from '../../context/accordion-context';
import AccordionGroup from '../../components/accordion-group';
import DashboardTiles from '../../components/dashboard-tiles';

export function Home() {
  

  return (
    <div>
      <DashboardTiles />
      <AccordionGroup />
      {/* <div>
        <Link to="/about">Navigate to About page</Link>
      </div> */}
    </div>
  );
}
// export function Home() {
//   return (
//     <div>
//       <h1>This is the HOME page</h1>
//       <div>
//         <Link to="/about">Navigate to About page</Link>
//       </div>
//     </div>
//   );
// }
