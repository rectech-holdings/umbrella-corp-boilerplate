import React, { createContext, ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import CreateLoanForm from "../../components/create-loan-form";
import { ApiSDK } from "../../services/apiSDK.service";
import { useLocation } from "react-router-dom";
import create from "zustand";

export function About() {
  const { pathname } = useLocation();

  return (
    <div>
      <h2>Topics</h2>
      <ul>
        <li>
          <Link to={`${pathname}/rendering`}>Rendering with React</Link>
        </li>
        <li>
          <Link to={`${pathname}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${pathname}/props-v-state`}>Props v. State</Link>
        </li>
      </ul>
    </div>
  );
}

const useForm: any = null;

function SampleForm() {
  const { useStore, store, Select, Input } = useForm({ initState: { email: "", firstName: "", lastName: "" } });

  <div>
    <Input field={["email"] as const} placeholder="Enter email..." isEmail required />
    <Input field={["firstName"] as const} placeholder="Enter firstName..." required />
    <Input field={["lastName"] as const} placeholder="Enter lastName..." required />
    <button
      disabled={store.silentlyValidate()}
      onClick={() => {
        if (store.validate()) {
          //Send request...
          console.log(store.get());
        }
      }}
    >
      Submit
    </button>
  </div>;
}

const useFormState = create(() => ({ selected: "profile" }));

function SomeForm() {
  const { selected } = useFormState();

  let inner: ReactNode;
  if (selected === "profile") {
    inner = <div>profile</div>;
  } else {
    inner = <div>default</div>;
  }

  return (
    <div>
      <SideBar />
      {inner}
    </div>
  );
}

const routes = ["profile", "account", "etc"];
function SideBar() {
  const { selected } = useFormState();
  return (
    <div>
      {routes.map((a) => (
        <div
          onClick={() => {
            useFormState.setState({ selected: a });
          }}
          style={{ background: a === selected ? "black" : "white" }}
        >
          {a}
        </div>
      ))}
    </div>
  );
}
