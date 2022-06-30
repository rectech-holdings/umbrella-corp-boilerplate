import { ReactNode } from "react";
import { Link, Navigate, Route, RouteProps, Routes } from "react-router-dom";
import { About } from "./About/About";
import { Home } from "./Home/Home";

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="about" element={<About />} />
    </Routes>
  );
}
