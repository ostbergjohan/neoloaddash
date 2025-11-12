import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TestStatsDashboard from "./TestStatsDashboard";
import OrgPerformanceDashboard from "./OrgPerformanceDashboard.js";

function App() {
    return (
        <Router>
            <div style={{ padding: "1rem", backgroundColor: "#0f172a" }}>
                {/* Ingen nav — inga länkar */}
                <Routes>
                    <Route path="/" element={<TestStatsDashboard />} />
                    <Route path="/dashboard" element={<OrgPerformanceDashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;