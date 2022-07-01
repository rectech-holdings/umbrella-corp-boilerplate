import React from 'react';
import useCounter from "../hooks/use-counter";

function Counter() {
    const {count, doThing} = useCounter();
    return <button onClick={() => doThing()}>{count}</button>;
}

export default Counter;