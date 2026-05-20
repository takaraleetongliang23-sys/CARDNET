import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import PublicCard from "./components/PublicCard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public digital business card view for shared external portal links */}
        <Route path="/card/:id" element={<PublicCard />} />
        
        {/* Administrator workspace control panels (all other routes map here) */}
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
