import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import SearchPage from "./SearchPage";

function App() {
  return (
    <Router>
      <nav style={{
        display: "flex", justifyContent: "center", gap: "2em", padding: "1em 0", background: "#e0e7ff"
      }}>
        <Link to="/" style={{ fontWeight: "bold", color: "#4f46e5", textDecoration: "none" }}>
          All Recipes
        </Link>
        <Link to="/search" style={{ fontWeight: "bold", color: "#6366f1", textDecoration: "none" }}>
          Recipe Recommender
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
